from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from accounts.models import Student
from content.access import visible_students, visible_books, query_id
from content.models import KnowledgeArea
from .services import achievement_stats


class AchievementView(APIView):
    def get(self, request):
        student_id = query_id(request, 'student') or getattr(getattr(request.user, 'student_profile', None), 'pk', None)
        student = get_object_or_404(visible_students(request.user), pk=student_id)
        return Response({'student': student.pk, 'categories': achievement_stats(student), 'badges': list(student.badges.values('id', 'category', 'level', 'earned_at'))})


class RankingView(APIView):
    def get(self, request):
        book = query_id(request, 'book')
        category = request.query_params.get('category', 'accuracy')
        valid_categories = ['participation', 'accuracy', *[str(pk) for pk in KnowledgeArea.objects.values_list('pk', flat=True)]]
        if category not in valid_categories:
            raise ValidationError('Categoria desconhecida.')
        if book:
            get_object_or_404(visible_books(request.user, current=False), pk=book)
        students = Student.objects.filter(attempts__completed=True)
        if book:
            students = students.filter(attempts__quiz__material__chapters__book_id=book)
        rows = []
        for student in students.distinct():
            result = next((item for item in achievement_stats(student, book) if item['category'] == category), None)
            if result is None:
                raise ValidationError('Categoria desconhecida.')
            rows.append({'student': student.pk, 'display_name': f'Coder {student.pk}', 'percentage': result['percentage'], 'is_me': student.user_id == request.user.pk})
        rows.sort(key=lambda row: (-row['percentage'], row['student']))
        for position, row in enumerate(rows, 1):
            row['position'] = position
        return Response({'category': category, 'book': book, 'results': rows})
