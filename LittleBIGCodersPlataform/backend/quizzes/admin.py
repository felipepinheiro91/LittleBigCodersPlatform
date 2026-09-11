from django.contrib import admin

from .models import Quiz, Question, Alternative, Attempt, Answer

for model in [Quiz, Question, Alternative]:
    admin.site.register(model)


class HistoryAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Attempt, HistoryAdmin)
admin.site.register(Answer, HistoryAdmin)
