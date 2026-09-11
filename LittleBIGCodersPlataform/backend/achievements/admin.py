from django.contrib import admin

from .models import StudentBadge
from quizzes.admin import HistoryAdmin

admin.site.register(StudentBadge, HistoryAdmin)
