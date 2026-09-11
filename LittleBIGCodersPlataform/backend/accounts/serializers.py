from rest_framework import serializers
from .models import User, School, Student, Teacher, Class, ClassStudent


class UserMeSerializer(serializers.ModelSerializer):
    student_id = serializers.SerializerMethodField()
    teacher_id = serializers.SerializerMethodField()
    school_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "login",
            "role",
            "student_id",
            "teacher_id",
            "school_id",
        ]

    def get_student_id(self, obj):
        if hasattr(obj, "student_profile"):
            return obj.student_profile.id
        return None

    def get_teacher_id(self, obj):
        if hasattr(obj, "teacher_profile"):
            return obj.teacher_profile.id
        return None

    def get_school_id(self, obj):
        if hasattr(obj, "student_profile") and obj.student_profile.school:
            return obj.student_profile.school.id

        if hasattr(obj, "teacher_profile") and obj.teacher_profile.school:
            return obj.teacher_profile.school.id

        return None


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "city",
            "state",
            "created_at",
        ]


class StudentSimpleSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    login = serializers.CharField(source="user.login", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True, allow_null=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "user_id",
            "name",
            "login",
            "email",
            "school",
            "school_name",
            "grade",
            "is_individual_customer",
            "created_at",
        ]


class TeacherSimpleSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    login = serializers.CharField(source="user.login", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True, allow_null=True)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user_id",
            "name",
            "login",
            "email",
            "school",
            "school_name",
            "created_at",
        ]


class ClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.user.name", read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id",
            "name",
            "year",
            "school",
            "school_name",
            "teacher",
            "teacher_name",
            "students_count",
            "created_at",
        ]

    def get_students_count(self, obj):
        return obj.enrollments.count()