from django.urls import path
from .views import (
    MeView,
    SchoolListView,
    ClassListView,
    ClassStudentsListView,
)

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("schools/", SchoolListView.as_view(), name="school-list"),
    path("classes/", ClassListView.as_view(), name="class-list"),
    path("classes/<int:id>/students/", ClassStudentsListView.as_view(), name="class-students"),
]