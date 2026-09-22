from rest_framework.routers import DefaultRouter
from .admin_api import (
    BookAdminViewSet, ChapterAdminViewSet, ClassAdminViewSet, MaterialAdminViewSet,
    QuizAdminViewSet, SchoolAdminViewSet, StudentAdminViewSet, TeacherAdminViewSet,
    SequenceAdminViewSet, ClassBookAccessAdminViewSet,
)

router = DefaultRouter()
for prefix, view in [
    ('schools', SchoolAdminViewSet), ('teachers', TeacherAdminViewSet),
    ('students', StudentAdminViewSet), ('classes', ClassAdminViewSet),
    ('books', BookAdminViewSet), ('chapters', ChapterAdminViewSet),
    ('materials', MaterialAdminViewSet), ('quizzes', QuizAdminViewSet),
    ('sequences', SequenceAdminViewSet),
    ('class-book-accesses', ClassBookAccessAdminViewSet),
]:
    router.register(prefix, view, basename=f'admin-{prefix}')

urlpatterns = router.urls
