from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import School, Class, ClassStudent
from .serializers import (
    UserMeSerializer,
    SchoolSerializer,
    ClassSerializer,
    StudentSimpleSerializer,
)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)


class SchoolListView(generics.ListAPIView):
    queryset = School.objects.all().order_by("name")
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassListView(generics.ListAPIView):
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Class.objects.select_related("school", "teacher", "teacher__user").all().order_by("school__name", "name")

        if user.role == "teacher" and hasattr(user, "teacher_profile"):
            return Class.objects.select_related("school", "teacher", "teacher__user").filter(
                teacher=user.teacher_profile
            ).order_by("name")

        if user.role == "student" and hasattr(user, "student_profile"):
            return Class.objects.select_related("school", "teacher", "teacher__user").filter(
                enrollments__student=user.student_profile
            ).distinct().order_by("name")

        return Class.objects.none()


class ClassStudentsListView(generics.ListAPIView):
    serializer_class = StudentSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        class_id = self.kwargs["id"]

        if user.role == "admin":
            return (
                ClassStudent.objects
                .filter(class_group_id=class_id)
                .select_related("student", "student__user", "student__school")
                .order_by("student__user__name")
            )

        if user.role == "teacher" and hasattr(user, "teacher_profile"):
            return (
                ClassStudent.objects
                .filter(
                    class_group_id=class_id,
                    class_group__teacher=user.teacher_profile,
                )
                .select_related("student", "student__user", "student__school")
                .order_by("student__user__name")
            )

        return ClassStudent.objects.none()

    def list(self, request, *args, **kwargs):
        enrollments = self.get_queryset()
        students = [enrollment.student for enrollment in enrollments]

        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)