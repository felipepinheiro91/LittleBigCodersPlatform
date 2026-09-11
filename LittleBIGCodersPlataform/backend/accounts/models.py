from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Estudante"
        TEACHER = "teacher", "Professor"
        ADMIN = "admin", "Administrador"

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    login = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)

    username = models.CharField(max_length=150, unique=True)

    USERNAME_FIELD = "login"
    REQUIRED_FIELDS = ["username", "name", "role"]

    def __str__(self):
        return f"{self.name} ({self.role})"


class School(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=2, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True)
    grade = models.CharField(max_length=30, blank=True)
    is_individual_customer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.school_id and not self.is_individual_customer:
            raise ValidationError({'school': 'Aluno escolar precisa de uma escola.'})
        if self.user_id and self.user.role != 'student':
            raise ValidationError({'user': 'O usuário precisa ter papel de estudante.'})
        if self.pk and self.class_enrollments.exclude(class_group__school_id=self.school_id).exists():
            raise ValidationError({'school': 'Existem matrículas vinculadas a outra escola.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.user.name


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.school_id:
            raise ValidationError({'school': 'Professor precisa de uma escola.'})
        if self.user_id and self.user.role != 'teacher':
            raise ValidationError({'user': 'O usuário precisa ter papel de professor.'})
        if self.pk and self.classes.exclude(school_id=self.school_id).exists():
            raise ValidationError({'school': 'Existem turmas vinculadas a outra escola.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.user.name


class Class(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="classes")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="classes")
    name = models.CharField(max_length=120)
    year = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.teacher_id and self.teacher.school_id != self.school_id:
            raise ValidationError({'teacher': 'Professor e turma devem pertencer à mesma escola.'})
        if self.pk and self.enrollments.exclude(student__school_id=self.school_id).exists():
            raise ValidationError({'school': 'Existem alunos de outra escola matriculados.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.year}"


class ClassStudent(models.Model):
    class_group = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="class_enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.class_group_id and self.student_id and self.class_group.school_id != self.student.school_id:
            raise ValidationError('Aluno e turma devem pertencer à mesma escola.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["class_group", "student"],
                name="unique_student_per_class",
            )
        ]

    def __str__(self):
        return f"{self.student} em {self.class_group}"
