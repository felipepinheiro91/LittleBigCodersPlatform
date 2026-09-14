from datetime import timedelta
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from accounts.models import Class, School, Student, Teacher
from achievements.services import achievement_stats
from quizzes.models import Attempt, Quiz
from .access import visible_books, visible_students
from .models import Book, Chapter, Material
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
        if request.user.role == 'admin':
            students = list(Student.objects.all())
            quizzes = Quiz.objects.filter(active=True, material__teacher_only=False).exclude(material__type='answer_key')
            completed_attempts = Attempt.objects.filter(completed=True)
            monthly = []
            for row in completed_attempts.annotate(month=TruncMonth('finished_at')).values('month').annotate(attempts=Sum('total_questions'), correct=Sum('score')).order_by('month'):
                monthly.append({'month': row['month'], 'questions': row['attempts'] or 0, 'score': round(100 * (row['correct'] or 0) / row['attempts'], 2) if row['attempts'] else None})
            school_rows = []
            for school in School.objects.all().order_by('name'):
                school_students = list(Student.objects.filter(school=school))
                school_rows.append({
                    'id': school.pk, 'name': school.name,
                    'teachers': Teacher.objects.filter(school=school).count(),
                    'students': len(school_students), 'classes': Class.objects.filter(school=school).count(),
                    **summarize(school_students, quizzes),
                })
            book_rows = []
            for book in Book.objects.all().order_by('title'):
                book_students = list(Student.objects.filter(book_accesses__book=book).distinct())
                book_rows.append({'id': book.pk, 'title': book.title, **summarize(book_students, quizzes.filter(material__chapter__book=book))})
            return Response({
                'role': 'admin',
                'totals': {
                    'schools': School.objects.count(), 'teachers': Teacher.objects.count(),
                    'students': len(students), 'classes': Class.objects.count(),
                    'books': Book.objects.count(), 'active_books': Book.objects.filter(active=True).count(),
                    'chapters': Chapter.objects.count(), 'materials': Material.objects.count(),
                    'quizzes': Quiz.objects.count(), 'completed_attempts': completed_attempts.count(),
                },
                'metrics': summarize(students, quizzes), 'schools': school_rows,
                'books': book_rows, 'monthly_performance': monthly[-6:],
            })
        if request.user.role != 'teacher':
            raise PermissionDenied()
        groups = Class.objects.all()
        if request.user.role == 'teacher':
            teacher = getattr(request.user, 'teacher_profile', None)
            groups = groups.filter(teacher=teacher, school_id=getattr(teacher, 'school_id', None)) if teacher else groups.none()
        quizzes = Quiz.objects.filter(active=True, material__chapter__book__in=books, material__teacher_only=False).exclude(material__type='answer_key')
        students = list(visible_students(request.user))
        return Response({'role': request.user.role, 'active_books': books.filter(active=True).count(), 'class_count': groups.count(), 'metrics': summarize(students, quizzes)})
