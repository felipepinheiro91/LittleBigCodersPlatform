from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, ChapterViewSet, MaterialViewSet, SequenceViewSet
from .reports import PerformanceView
from .dashboard import DashboardView
from quizzes.views import QuizViewSet, AttemptViewSet
from achievements.views import AchievementView, RankingView

router = DefaultRouter()
for prefix, view in [('books', BookViewSet), ('chapters', ChapterViewSet), ('materials', MaterialViewSet), ('sequences', SequenceViewSet), ('quizzes', QuizViewSet), ('attempts', AttemptViewSet)]:
    router.register(prefix, view, basename=prefix)

urlpatterns = [path('', include(router.urls)), path('achievements/', AchievementView.as_view()), path('rankings/', RankingView.as_view()), path('performance/', PerformanceView.as_view())]
urlpatterns += [path('dashboard/', DashboardView.as_view())]
