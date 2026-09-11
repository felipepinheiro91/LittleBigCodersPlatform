from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from accounts.models import Class
from achievements.services import achievement_stats
from quizzes.models import Attempt, Quiz
from .access import visible_books, visible_students
from .reports import summarize


class DashboardView(APIView):
    def get(self, request):
        books = visible_books(request.user)
        if request.user.role == 'student' and hasattr(request.user, 'student_profile'):
            student = request.user.student_profile
            attempts = Attempt.objects.filter(student=student, completed=True)
            week = timezone.now() - timedelta(days=7)
            points = attempts.aggregate(value=Sum('score'))['value'] or 0
            weekly = attempts.filter(finished_at__gte=week).aggregate(value=Sum('score'))['value'] or 0
            return Response({'role': 'student', 'active_books': books.count(), 'points': points, 'weekly_points': weekly, 'categories': achievement_stats(student), 'recent_attempts': list(attempts.order_by('-finished_at').values('id', 'quiz_id', 'score', 'total_questions', 'finished_at')[:10])})
        if request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied()
        groups = Class.objects.all()
        if request.user.role == 'teacher':
            teacher = getattr(request.user, 'teacher_profile', None)
            groups = groups.filter(teacher=teacher, school_id=getattr(teacher, 'school_id', None)) if teacher else groups.none()
        quizzes = Quiz.objects.filter(active=True, material__chapter__book__in=books, material__teacher_only=False).exclude(material__type='answer_key')
        students = list(visible_students(request.user))
        return Response({'role': request.user.role, 'active_books': books.filter(active=True).count(), 'class_count': groups.count(), 'metrics': summarize(students, quizzes)})
