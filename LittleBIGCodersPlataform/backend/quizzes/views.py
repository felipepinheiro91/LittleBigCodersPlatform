from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from content.access import visible_books, visible_students, query_id
from achievements.services import award_badges
from .models import Quiz, Attempt, Answer
from .serializers import QuizSerializer, AttemptSerializer, SubmissionSerializer


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizSerializer

    def get_queryset(self):
        quizzes = Quiz.objects.filter(active=True, material__chapters__book__in=visible_books(self.request.user)).prefetch_related('questions__alternatives')
        if self.request.user.role == 'student':
            quizzes = quizzes.filter(material__teacher_only=False).exclude(material__type='answer_key')
        if self.request.query_params.get('material'):
            quizzes = quizzes.filter(material_id=query_id(self.request, 'material'))
        return quizzes.order_by('id').distinct()

    @action(detail=True, methods=['patch'], url_path='alternative-image')
    def alternative_image(self, request, pk=None):
        from accounts.admin_api import QuizImageValidationMixin
        from rest_framework import serializers
        from .models import Alternative
        from .serializers import AlternativeSerializer

        if request.user.role not in ('teacher', 'admin'):
            raise PermissionDenied('Somente professores podem editar imagens das alternativas.')
        quiz = self.get_object()
        if request.user.role == 'teacher' and quiz.material.chapters.exclude(book__in=visible_books(request.user)).exists():
            raise PermissionDenied('Este desafio também pertence a livros fora do seu acesso.')

        class ImageSerializer(QuizImageValidationMixin, serializers.Serializer):
            alternative = serializers.IntegerField(min_value=1)
            image = serializers.CharField(allow_blank=True, max_length=2800100)
            image_description = serializers.CharField(allow_blank=True, max_length=255, default='')

        serializer = ImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            Quiz.objects.select_for_update().get(pk=quiz.pk)
            if quiz.attempts.exists():
                raise ValidationError('Este desafio possui tentativas. As alternativas estão protegidas.')
            alternative = Alternative.objects.filter(pk=data['alternative'], question__quiz=quiz).first()
            if alternative is None:
                raise ValidationError('Alternativa inválida para este desafio.')
            if not alternative.text.strip() and not data['image']:
                raise ValidationError('A alternativa precisa de texto ou imagem.')
            alternative.image = data['image']
            alternative.image_description = data['image_description'] if data['image'] else ''
            alternative.save(update_fields=['image', 'image_description'])
        return Response(AlternativeSerializer(alternative).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        quiz = self.get_object()
        if request.user.role != 'student' or not hasattr(request.user, 'student_profile'):
            raise PermissionDenied('Somente estudantes podem iniciar uma prova.')
        questions = list(quiz.questions.all())
        if not questions or any(question.alternatives.count() < 2 or question.alternatives.filter(is_correct=True).count() != 1 for question in questions):
            raise ValidationError('Prova ainda não está pronta para aplicação.')
        attempt = Attempt.objects.create(quiz=quiz, student=request.user.student_profile, total_questions=len(questions))
        return Response(AttemptSerializer(attempt).data, status=201)


class AttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttemptSerializer

    def get_queryset(self):
        attempts = Attempt.objects.filter(student__in=visible_students(self.request.user)).select_related('quiz').order_by('-started_at', '-id')
        for field in ['student', 'quiz']:
            if self.request.query_params.get(field):
                attempts = attempts.filter(**{field + '_id': query_id(self.request, field)})
        return attempts

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def submit(self, request, pk=None):
        attempt = self.get_object()
        if request.user.role != 'student' or attempt.student.user_id != request.user.pk:
            raise PermissionDenied()
        attempt = Attempt.objects.select_for_update().get(pk=attempt.pk)
        if attempt.completed:
            raise ValidationError('Tentativa já finalizada. Inicie outra para refazer a prova.')
        if not attempt.quiz.active or attempt.quiz.material.teacher_only or attempt.quiz.material.type == 'answer_key' or not attempt.quiz.material.chapters.filter(book__in=visible_books(request.user)).exists():
            raise PermissionDenied('Acesso ao livro expirado.')
        payload = SubmissionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        submitted = payload.validated_data['answers']
        questions = list(attempt.quiz.questions.prefetch_related('alternatives'))
        if len(questions) != attempt.total_questions or set(submitted) != {str(question.id) for question in questions}:
            raise ValidationError('Responda todas as questões da prova atual.')
        answers = []
        for question in questions:
            alternative = next((option for option in question.alternatives.all() if option.pk == submitted[str(question.pk)]), None)
            if alternative is None:
                raise ValidationError('Alternativa não pertence à questão.')
            answers.append(Answer(attempt=attempt, question=question, alternative=alternative, is_correct=alternative.is_correct))
        Answer.objects.bulk_create(answers)
        attempt.score = sum(answer.is_correct for answer in answers)
        attempt.completed = True
        attempt.finished_at = timezone.now()
        attempt.save(update_fields=['score', 'completed', 'finished_at'])
        badges = award_badges(attempt.student)
        return Response({**AttemptSerializer(attempt).data, 'new_badges': badges, 'answers': [{'question': answer.question_id, 'selected_alternative': answer.alternative_id, 'is_correct': answer.is_correct} for answer in answers]})
