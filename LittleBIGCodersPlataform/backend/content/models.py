from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=255)
    school_year = models.CharField(max_length=30)
    edition = models.CharField(max_length=60, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    teachers = models.ManyToManyField('accounts.Teacher', blank=True, related_name='books')
    classes = models.ManyToManyField('accounts.Class', blank=True, related_name='books')

    def __str__(self):
        return self.title


class BookAccess(models.Model):
    student = models.ForeignKey('accounts.Student', on_delete=models.CASCADE, related_name='book_accesses')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='accesses')
    login_code = models.CharField(max_length=100, unique=True)
    qr_code_url = models.URLField(blank=True)
    valid_from = models.DateField()
    valid_until = models.DateField()
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(valid_until__gte=models.F('valid_from')), name='access_valid_dates')]


class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=255)
    number = models.PositiveIntegerField()
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['number', 'id']
        constraints = [models.UniqueConstraint(fields=['book', 'number'], name='unique_book_chapter')]


class KnowledgeArea(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Material(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=[(value, value) for value in ['video', 'game', 'text', 'quiz', 'answer_key']])
    url = models.URLField(blank=True)
    content = models.TextField(blank=True)
    teacher_only = models.BooleanField(default=False)
    knowledge_areas = models.ManyToManyField(KnowledgeArea, blank=True)


class DidacticSequence(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='sequences')
    teacher = models.ForeignKey('accounts.Teacher', null=True, blank=True, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=255)
    axis = models.TextField(blank=True)
    duration = models.CharField(max_length=100, blank=True)
    estimated_classes = models.PositiveIntegerField(default=1)
    format = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[('pending', 'Pendente'), ('completed', 'Realizada')], default='pending')
    description = models.TextField(blank=True)
    ventures = models.TextField(blank=True)
    rationale = models.TextField(blank=True)
    general_objective = models.TextField(blank=True)
    specific_objectives = models.TextField(blank=True)
    learning_outcomes = models.TextField(blank=True)
    contents = models.TextField(blank=True)
    activities = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)
