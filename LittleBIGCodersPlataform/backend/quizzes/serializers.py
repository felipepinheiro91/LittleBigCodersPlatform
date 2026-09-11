from rest_framework import serializers
from .models import Quiz, Question, Alternative, Attempt


class AlternativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alternative
        fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    alternatives = AlternativeSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'statement', 'order', 'knowledge_area', 'alternatives']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'material', 'title', 'description', 'questions']


class AttemptSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = ['id', 'quiz', 'student', 'started_at', 'finished_at', 'score', 'total_questions', 'completed', 'percentage']
        read_only_fields = fields

    def get_percentage(self, obj):
        return round(100 * obj.score / obj.total_questions, 2) if obj.completed and obj.total_questions else None


class SubmissionSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.IntegerField(min_value=1), allow_empty=False)
