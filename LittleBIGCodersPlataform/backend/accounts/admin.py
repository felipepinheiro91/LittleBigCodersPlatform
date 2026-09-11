from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, School, Student, Teacher, Class, ClassStudent


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ("id", "login", "name", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("login", "name", "email")
    ordering = ("id",)

    fieldsets = UserAdmin.fieldsets + (
        ("Dados da Plataforma Little BIG Coders", {
            "fields": ("name", "login", "role")
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Dados da Plataforma Little BIG Coders", {
            "fields": ("name", "login", "email", "role")
        }),
    )


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "state", "created_at")
    search_fields = ("name", "city", "state")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "school", "grade", "is_individual_customer", "created_at")
    list_filter = ("school", "grade", "is_individual_customer")
    search_fields = ("user__name", "user__login", "user__email")


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "school", "created_at")
    list_filter = ("school",)
    search_fields = ("user__name", "user__login", "user__email")


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "school", "teacher", "year", "created_at")
    list_filter = ("school", "year")
    search_fields = ("name", "teacher__user__name", "school__name")


@admin.register(ClassStudent)
class ClassStudentAdmin(admin.ModelAdmin):
    list_display = ("id", "class_group", "student", "enrolled_at")
    list_filter = ("class_group",)
    search_fields = ("student__user__name", "student__user__login", "class_group__name")