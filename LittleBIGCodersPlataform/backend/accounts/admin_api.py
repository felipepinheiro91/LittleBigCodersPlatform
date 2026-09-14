from django.db import transaction
from django.db.models.deletion import ProtectedError
from rest_framework import permissions, serializers, viewsets

from content.models import Book, Chapter, Material
from quizzes.models import Alternative, Question, Quiz
from .models import Class, ClassStudent, School, Student, Teacher, User


class IsPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsPlatformAdmin]

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise serializers.ValidationError('Este cadastro possui histórico vinculado e não pode ser removido.')


class AdminSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name', 'city', 'state', 'created_at']
        read_only_fields = ['created_at']


class AdminPersonSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    login = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True, required=False, allow_blank=True)
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all())
    school_name = serializers.CharField(source='school.name', read_only=True)

    role = None
    profile_model = None

    def validate(self, attrs):
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Informe uma senha inicial.'})
        login = attrs.get('login')
        if login and User.objects.exclude(pk=getattr(getattr(self.instance, 'user', None), 'pk', None)).filter(login=login).exists():
            raise serializers.ValidationError({'login': 'Este login já está em uso.'})
        email = attrs.get('email') or None
        if email and User.objects.exclude(pk=getattr(getattr(self.instance, 'user', None), 'pk', None)).filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Este e-mail já está em uso.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        school = validated_data.pop('school')
        password = validated_data.pop('password')
        login = validated_data['login']
        user = User(
            username=login,
            login=login,
            name=validated_data['name'],
            email=validated_data.get('email') or None,
            role=self.role,
        )
        user.set_password(password)
        user.save()
        return self.profile_model.objects.create(user=user, school=school, **self.profile_fields(validated_data))

    def profile_fields(self, validated_data):
        return {}

    def to_representation(self, instance):
        return {
            'id': instance.pk,
            'user_id': instance.user_id,
            'name': instance.user.name,
            'login': instance.user.login,
            'email': instance.user.email or '',
            'school': instance.school_id,
            'school_name': instance.school.name if instance.school_id else None,
            **self.extra_representation(instance),
        }

    def extra_representation(self, instance):
        return {}

    @transaction.atomic
    def update(self, instance, validated_data):
        user = instance.user
        login = validated_data.get('login', user.login)
        user.name = validated_data.get('name', user.name)
        user.login = login
        user.username = login
        user.email = validated_data.get('email', user.email) or None
        password = validated_data.get('password')
        if password:
            user.set_password(password)
        user.save()
        instance.school = validated_data.get('school', instance.school)
        for field, value in self.profile_fields(validated_data).items():
            setattr(instance, field, value)
        instance.save()
        return instance


class AdminTeacherSerializer(AdminPersonSerializer):
    role = 'teacher'
    profile_model = Teacher


class AdminStudentSerializer(AdminPersonSerializer):
    grade = serializers.CharField(max_length=30, required=False, allow_blank=True)
    is_individual_customer = serializers.BooleanField(default=False)
    role = 'student'
    profile_model = Student

    def profile_fields(self, validated_data):
        result = {}
        if 'grade' in validated_data:
            result['grade'] = validated_data['grade']
        if 'is_individual_customer' in validated_data:
            result['is_individual_customer'] = validated_data['is_individual_customer']
        return result

    def extra_representation(self, instance):
        return {'grade': instance.grade, 'is_individual_customer': instance.is_individual_customer}


class AdminClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.name', read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False, write_only=True)
    students_count = serializers.IntegerField(source='enrollments.count', read_only=True)

    class Meta:
        model = Class
        fields = ['id', 'name', 'year', 'school', 'school_name', 'teacher', 'teacher_name', 'student_ids', 'students_count']

    def validate(self, attrs):
        school = attrs.get('school', getattr(self.instance, 'school', None))
        teacher = attrs.get('teacher', getattr(self.instance, 'teacher', None))
        students = attrs.pop('student_ids', None)
        if teacher.school_id != school.pk:
            raise serializers.ValidationError({'teacher': 'O professor deve pertencer à escola selecionada.'})
        if students is not None and any(student.school_id != school.pk for student in students):
            raise serializers.ValidationError({'student_ids': 'Todos os estudantes devem pertencer à escola selecionada.'})
        attrs['_students'] = students
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        students = validated_data.pop('_students', None) or []
        group = Class.objects.create(**validated_data)
        ClassStudent.objects.bulk_create([ClassStudent(class_group=group, student=student) for student in students])
        return group

    @transaction.atomic
    def update(self, instance, validated_data):
        students = validated_data.pop('_students', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if students is not None:
            instance.enrollments.all().delete()
            ClassStudent.objects.bulk_create([ClassStudent(class_group=instance, student=student) for student in students])
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['student_ids'] = list(instance.enrollments.values_list('student_id', flat=True))
        return representation


class AdminBookSerializer(serializers.ModelSerializer):
    teacher_ids = serializers.PrimaryKeyRelatedField(source='teachers', queryset=Teacher.objects.all(), many=True, required=False)
    class_ids = serializers.PrimaryKeyRelatedField(source='classes', queryset=Class.objects.all(), many=True, required=False)
    cover = serializers.FileField(required=False, allow_null=True, write_only=True)
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'school_year', 'edition', 'description', 'cover', 'cover_url', 'active', 'teacher_ids', 'class_ids']

    def get_cover_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.cover.url) if obj.cover and request else None

    def validate_cover(self, cover):
        if cover is None:
            return cover
        if cover.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('A capa deve ter no máximo 5 MB.')
        content_type = getattr(cover, 'content_type', '')
        if content_type not in ['image/jpeg', 'image/png', 'image/webp']:
            raise serializers.ValidationError('Envie uma imagem JPG, PNG ou WebP.')
        return cover


class AdminChapterSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'book', 'book_title', 'number', 'title', 'description']


class AdminMaterialSerializer(serializers.ModelSerializer):
    chapter_title = serializers.CharField(source='chapter.title', read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'chapter', 'chapter_title', 'title', 'type', 'url', 'content', 'teacher_only', 'knowledge_areas']


class AdminAlternativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternative
        fields = ['text', 'order', 'is_correct']


class AdminQuestionSerializer(serializers.ModelSerializer):
    alternatives = AdminAlternativeSerializer(many=True)

    class Meta:
        model = Question
        fields = ['statement', 'order', 'knowledge_area', 'alternatives']

    def validate_alternatives(self, alternatives):
        if len(alternatives) < 2 or sum(item['is_correct'] for item in alternatives) != 1:
            raise serializers.ValidationError('Cada questão precisa de pelo menos duas alternativas e exatamente uma correta.')
        return alternatives


class AdminQuizSerializer(serializers.ModelSerializer):
    questions = AdminQuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ['id', 'material', 'title', 'description', 'active', 'questions']

    def validate_material(self, material):
        if material.type != 'quiz':
            raise serializers.ValidationError('Selecione um material do tipo quiz.')
        return material

    def validate_questions(self, questions):
        if not questions:
            raise serializers.ValidationError('Cadastre pelo menos uma questão.')
        return questions

    @transaction.atomic
    def create(self, validated_data):
        questions = validated_data.pop('questions')
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions:
            alternatives = question_data.pop('alternatives')
            question = Question.objects.create(quiz=quiz, **question_data)
            Alternative.objects.bulk_create([Alternative(question=question, **alternative) for alternative in alternatives])
        return quiz

    @transaction.atomic
    def update(self, instance, validated_data):
        questions = validated_data.pop('questions', None)
        if questions is not None and instance.attempts.exists():
            raise serializers.ValidationError('A prova possui tentativas. Edite apenas título, descrição ou situação.')
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if questions is not None:
            instance.questions.all().delete()
            for question_data in questions:
                alternatives = question_data.pop('alternatives')
                question = Question.objects.create(quiz=instance, **question_data)
                Alternative.objects.bulk_create([Alternative(question=question, **alternative) for alternative in alternatives])
        return instance


class SchoolAdminViewSet(AdminModelViewSet):
    queryset = School.objects.all().order_by('name')
    serializer_class = AdminSchoolSerializer

    def perform_destroy(self, instance):
        if instance.classes.exists() or instance.teacher_set.exists() or instance.student_set.exists():
            raise serializers.ValidationError('Remova ou transfira as turmas e pessoas vinculadas antes de excluir a escola.')
        super().perform_destroy(instance)


class TeacherAdminViewSet(AdminModelViewSet):
    queryset = Teacher.objects.select_related('user', 'school').all().order_by('user__name')
    serializer_class = AdminTeacherSerializer

    def perform_destroy(self, instance):
        user = instance.user
        super().perform_destroy(user)


class StudentAdminViewSet(AdminModelViewSet):
    queryset = Student.objects.select_related('user', 'school').all().order_by('user__name')
    serializer_class = AdminStudentSerializer

    def perform_destroy(self, instance):
        user = instance.user
        super().perform_destroy(user)


class ClassAdminViewSet(AdminModelViewSet):
    queryset = Class.objects.select_related('school', 'teacher__user').all().order_by('school__name', 'name')
    serializer_class = AdminClassSerializer


class BookAdminViewSet(AdminModelViewSet):
    queryset = Book.objects.prefetch_related('teachers', 'classes').all().order_by('title')
    serializer_class = AdminBookSerializer


class ChapterAdminViewSet(AdminModelViewSet):
    queryset = Chapter.objects.select_related('book').all()
    serializer_class = AdminChapterSerializer


class MaterialAdminViewSet(AdminModelViewSet):
    queryset = Material.objects.select_related('chapter').prefetch_related('knowledge_areas').all().order_by('id')
    serializer_class = AdminMaterialSerializer


class QuizAdminViewSet(AdminModelViewSet):
    queryset = Quiz.objects.select_related('material').prefetch_related('questions__alternatives').all().order_by('id')
    serializer_class = AdminQuizSerializer
