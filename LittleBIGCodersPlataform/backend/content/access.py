from django.db.models import Q
from django.utils import timezone
from .models import Book
from rest_framework.exceptions import ValidationError


def query_id(request, name):
    value = request.query_params.get(name)
    if value is None or value == '':
        return None
    if not value.isdigit() or int(value) < 1:
        raise ValidationError({name: 'Informe um ID positivo.'})
    return int(value)


def visible_books(user, current=True):
    books = Book.objects.all()
    if user.role == 'admin':
        return books
    if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
        teacher = user.teacher_profile
        return books.filter(Q(teachers=teacher) | Q(classes__teacher=teacher, classes__school_id=teacher.school_id)).distinct()
    if user.role == 'student' and hasattr(user, 'student_profile'):
        grants = user.student_profile.book_accesses.all()
        if current:
            today = timezone.localdate()
            grants = grants.filter(active=True, valid_from__lte=today, valid_until__gte=today, book__active=True)
        return books.filter(id__in=grants.values('book_id')).distinct()
    return books.none()


def visible_students(user):
    from accounts.models import Student
    students = Student.objects.select_related('user', 'school')
    if user.role == 'admin':
        return students
    if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
        teacher = user.teacher_profile
        return students.filter(school_id=teacher.school_id, class_enrollments__class_group__teacher=teacher, class_enrollments__class_group__school_id=teacher.school_id).distinct()
    if user.role == 'student' and hasattr(user, 'student_profile'):
        return students.filter(pk=user.student_profile.pk)
    return students.none()
