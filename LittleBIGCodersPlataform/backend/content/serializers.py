from rest_framework import serializers
from .models import Book, Chapter, Material, DidacticSequence
from .access import visible_books


class BookSerializer(serializers.ModelSerializer):
    accessible = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'school_year', 'edition', 'description', 'cover_url', 'active', 'accessible', 'progress', 'access']

    def get_cover_url(self, obj):
        return obj.cover or None

    def get_accessible(self, obj):
        return visible_books(self.context['request'].user).filter(pk=obj.pk).exists()

    def get_progress(self, obj):
        from achievements.services import achievement_stats
        student = getattr(self.context['request'].user, 'student_profile', None)
        return achievement_stats(student, obj.pk)[0] if student else None

    def get_access(self, obj):
        student = getattr(self.context['request'].user, 'student_profile', None)
        if not student:
            return []
        individual = obj.accesses.filter(student=student).values('valid_from', 'valid_until', 'active')
        groups = obj.class_accesses.filter(class_group__enrollments__student=student, class_group__school_id=student.school_id).values('valid_from', 'valid_until', 'active')
        return list(individual) + list(groups)


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = '__all__'


class MaterialSerializer(serializers.ModelSerializer):
    quiz_id = serializers.IntegerField(source='quiz.id', read_only=True, default=None)

    class Meta:
        model = Material
        fields = '__all__'


class ActivitySerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True)


class SequenceSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True)

    class Meta:
        model = DidacticSequence
        fields = '__all__'
        read_only_fields = ['teacher', 'parent', 'updated_at']

    def validate_chapter(self, chapter):
        if not visible_books(self.context['request'].user).filter(pk=chapter.book_id).exists():
            raise serializers.ValidationError('Livro não disponível para este professor.')
        return chapter
