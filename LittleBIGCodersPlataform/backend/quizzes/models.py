from django.db import models

class Quiz(models.Model):
    material = models.OneToOneField('content.Material', on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    statement = models.TextField()
    order = models.PositiveIntegerField(default=1)
    knowledge_area = models.ForeignKey('content.KnowledgeArea', null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['order', 'id']


class Alternative(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='alternatives')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order', 'id']
        constraints = [models.UniqueConstraint(fields=['question'], condition=models.Q(is_correct=True), name='one_correct_alternative')]


class Attempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.PROTECT, related_name='attempts')
    student = models.ForeignKey('accounts.Student', on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)


class Answer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.PROTECT)
    alternative = models.ForeignKey(Alternative, on_delete=models.PROTECT)
    is_correct = models.BooleanField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['attempt', 'question'], name='unique_attempt_answer')]
