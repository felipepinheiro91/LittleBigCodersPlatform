from django.db.models import Sum
from content.models import KnowledgeArea
from content.access import visible_books
from quizzes.models import Attempt, Answer, Quiz
from .models import StudentBadge


def level_for(percentage):
    if percentage >= 90:
        return 'expert'
    if percentage >= 75:
        return 'advanced'
    if percentage >= 50:
        return 'intermediate'
    if percentage >= 25:
        return 'novice'
    return 'zero'


def achievement_stats(student, book=None):
    attempts = Attempt.objects.filter(student=student, completed=True)
    assigned = visible_books(student.user, current=False).values('id')
    quizzes = Quiz.objects.filter(material__chapters__book_id__in=assigned, active=True, material__teacher_only=False).exclude(material__type='answer_key').distinct()
    if book:
        attempts = attempts.filter(quiz__in=Quiz.objects.filter(material__chapters__book_id=book))
        quizzes = quizzes.filter(material__chapters__book_id=book).distinct()
    totals = attempts.aggregate(correct=Sum('score'), total=Sum('total_questions'))
    completed = attempts.filter(quiz__in=quizzes).values('quiz_id').distinct().count()
    results = [stat('participation', 'Atividades realizadas', completed, quizzes.count()), stat('accuracy', 'Acertos gerais', totals['correct'] or 0, totals['total'] or 0)]
    for area in KnowledgeArea.objects.order_by('id'):
        answers = Answer.objects.filter(attempt__in=attempts, question__knowledge_area=area)
        results.append(stat(str(area.id), area.name, answers.filter(is_correct=True).count(), answers.count()))
    return results


def stat(category, name, correct, total):
    percentage = round(100 * correct / total, 2) if total else 0
    return {'category': category, 'name': name, 'correct': correct, 'total': total, 'percentage': percentage, 'level': level_for(percentage)}


def award_badges(student):
    earned = []
    for result in achievement_stats(student):
        if result['total'] and result['level'] != 'zero':
            badge, created = StudentBadge.objects.get_or_create(student=student, category=result['category'], level=result['level'])
            if created:
                earned.append({'id': badge.id, 'category': badge.category, 'level': badge.level})
    return earned
