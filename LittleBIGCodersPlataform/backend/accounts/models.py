from django.contrib.auth.models import AbstractUser
from django.db import models


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

    def __str__(self):
        return self.user.name


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.name


class Class(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="classes")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="classes")
    name = models.CharField(max_length=120)
    year = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.year}"


class ClassStudent(models.Model):
    class_group = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="class_enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["class_group", "student"],
                name="unique_student_per_class",
            )
        ]

    def __str__(self):
        return f"{self.student} em {self.class_group}"