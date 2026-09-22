from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from accounts.models import Class
from quizzes.models import Quiz, Attempt
from .access import visible_students, visible_books
from .models import Chapter


def summarize(students, quizzes):
    attempts = Attempt.objects.filter(student__in=students, quiz__in=quizzes, completed=True)
    totals = attempts.aggregate(correct=Sum('score'), total=Sum('total_questions'))
    proposed = sum(quizzes.filter(material__chapter__book__in=visible_books(student.user, current=False)).distinct().count() for student in students)
    completed = attempts.values('student_id', 'quiz_id').distinct().count()
    return {
        'students': len(students), 'proposed': proposed, 'completed': completed,
        'completion': round(100 * completed / proposed, 2) if proposed else 0,
        'score': round(100 * (totals['correct'] or 0) / totals['total'], 2) if totals['total'] else None,
        'attempts': attempts.count(), 'active_students': attempts.values('student_id').distinct().count(),
    }


class PerformanceView(APIView):
    def get(self, request):
        if request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied()
        filters = {}
        for key in ['class', 'chapter', 'student', 'book']:
            value = request.query_params.get(key)
            if value:
                if not value.isdigit() or int(value) < 1:
                    raise ValidationError({key: 'Informe um ID positivo.'})
                filters[key] = int(value)
        groups = Class.objects.all()
        if request.user.role == 'teacher':
            teacher = getattr(request.user, 'teacher_profile', None)
            groups = groups.filter(teacher=teacher, school_id=getattr(teacher, 'school_id', None)) if teacher else groups.none()
        students = visible_students(request.user)
        if 'class' in filters:
            group = get_object_or_404(groups, pk=filters['class'])
            students = students.filter(class_enrollments__class_group=group)
        if 'student' in filters:
            selected = get_object_or_404(students, pk=filters['student'])
            students = students.filter(pk=selected.pk)
        books = visible_books(request.user)
        if 'book' in filters:
            get_object_or_404(books, pk=filters['book'])
            books = books.filter(pk=filters['book'])
        chapters = Chapter.objects.filter(book__in=books)
        if 'chapter' in filters:
            get_object_or_404(chapters, pk=filters['chapter'])
            chapters = chapters.filter(pk=filters['chapter'])
        quizzes = Quiz.objects.filter(material__chapter__in=chapters, material__teacher_only=False).exclude(material__type='answer_key')
        students = list(students.distinct())
        rows = [{'id': student.pk, 'name': student.user.name, **summarize([student], quizzes)} for student in students]
        rows.sort(key=lambda row: (row['score'] is None, -(row['score'] or 0), row['id']))
        chapter_rows = [{'id': chapter.pk, 'title': chapter.title, **summarize(students, quizzes.filter(material__chapter=chapter))} for chapter in chapters]
        class_rows = []
        for group in groups:
            members = [student for student in students if student.class_enrollments.filter(class_group=group).exists()]
            if members:
                class_rows.append({'id': group.pk, 'name': group.name, **summarize(members, quizzes)})
        distribution = {label: 0 for label in ['90–100', '75–89', '60–74', '0–59', 'no_attempts']}
        for row in rows:
            score = row['score']
            label = 'no_attempts' if score is None else '90–100' if score >= 90 else '75–89' if score >= 75 else '60–74' if score >= 60 else '0–59'
            distribution[label] += 1
        attention = [row for row in rows if row['completion'] < 70 or row['score'] is None or row['score'] < 60]
        return Response({'filters': filters, 'metrics': summarize(students, quizzes), 'students': rows, 'chapters': chapter_rows, 'classes': class_rows, 'distribution': distribution, 'attention': attention})
