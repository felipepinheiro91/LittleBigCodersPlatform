from django.db import models

class StudentBadge(models.Model):
    student = models.ForeignKey('accounts.Student', on_delete=models.CASCADE, related_name='badges')
    category = models.CharField(max_length=120)
    level = models.CharField(max_length=20)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['student', 'category', 'level'], name='unique_student_badge')]
