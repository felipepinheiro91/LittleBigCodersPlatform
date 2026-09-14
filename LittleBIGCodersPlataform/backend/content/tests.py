from datetime import timedelta
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APITestCase
from accounts.models import User, School, Teacher, Student, Class, ClassStudent
from .models import Book, BookAccess, Chapter, Material, DidacticSequence
from quizzes.models import Quiz, Question, Alternative, Attempt


class PlatformTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name='Escola A')
        self.other_school = School.objects.create(name='Escola B')
        self.teacher_user = User.objects.create_user(username='teacher', email='teacher@example.test', login='teacher', name='Professor', role='teacher', password='test-password')
        self.teacher = Teacher.objects.create(user=self.teacher_user, school=self.school)
        self.user = User.objects.create_user(username='student', email='student@example.test', login='student', name='Aluno', role='student', password='test-password')
        self.student = Student.objects.create(user=self.user, school=self.school)
        self.other_user = User.objects.create_user(username='other', email='other@example.test', login='other', name='Outro', role='student', password='test-password')
        self.other = Student.objects.create(user=self.other_user, school=self.other_school)
        self.group = Class.objects.create(name='5A', school=self.school, teacher=self.teacher, year=2026)
        ClassStudent.objects.create(student=self.student, class_group=self.group)
        self.book = Book.objects.create(title='Computação', school_year='5')
        self.book.teachers.add(self.teacher)
        self.book.classes.add(self.group)
        today = timezone.localdate()
        self.access = BookAccess.objects.create(student=self.student, book=self.book, login_code='code', valid_from=today, valid_until=today + timedelta(days=365))
        self.chapter = Chapter.objects.create(book=self.book, title='Algoritmos', number=1)
        self.material = Material.objects.create(chapter=self.chapter, title='Prova', type='quiz')
        self.quiz = Quiz.objects.create(material=self.material, title='Quiz')
        self.question = Question.objects.create(quiz=self.quiz, statement='Qual?')
        self.correct = Alternative.objects.create(question=self.question, text='Sim', is_correct=True)
        self.wrong = Alternative.objects.create(question=self.question, text='Não')
        self.client.force_authenticate(self.user)

    def submit(self, option):
        response = self.client.post(f'/api/quizzes/{self.quiz.pk}/start/')
        self.assertEqual(response.status_code, 201)
        attempt_id = response.data['id']
        result = self.client.post(f'/api/attempts/{attempt_id}/submit/', {'answers': {str(self.question.pk): option.pk}}, format='json')
        self.assertEqual(result.status_code, 200)
        return result

    def test_jwt_profile_school(self):
        self.client.force_authenticate(None)
        token = self.client.post('/api/token/', {'login': 'student', 'password': 'test-password'}).data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(self.client.get('/api/me/').data['school']['id'], self.school.pk)

    def test_student_access_and_hidden_answers(self):
        response = self.client.get(f'/api/quizzes/{self.quiz.pk}/')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('is_correct', response.data['questions'][0]['alternatives'][0])
        key = Material.objects.create(chapter=self.chapter, title='Gabarito', type='answer_key')
        self.assertEqual(self.client.get(f'/api/materials/{key.pk}/').status_code, 404)
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(f'/api/quizzes/{self.quiz.pk}/').status_code, 404)
        self.assertEqual(self.client.get('/api/schools/').data[0]['id'], self.other_school.pk)

    def test_expired_book_retained_but_content_denied(self):
        self.access.valid_from = timezone.localdate() - timedelta(days=366)
        self.access.valid_until = timezone.localdate() - timedelta(days=1)
        self.access.save()
        self.assertFalse(self.client.get('/api/books/').data[0]['accessible'])
        self.assertEqual(self.client.get(f'/api/chapters/{self.chapter.pk}/').status_code, 404)

    def test_multiple_attempts_count_and_replay_rejected(self):
        first = self.submit(self.correct)
        self.assertEqual(first.data['percentage'], 100)
        self.assertTrue(first.data['new_badges'])
        replay = self.client.post(f"/api/attempts/{first.data['id']}/submit/", {'answers': {str(self.question.pk): self.wrong.pk}}, format='json')
        self.assertEqual(replay.status_code, 400)
        self.submit(self.wrong)
        categories = self.client.get('/api/achievements/').data['categories']
        self.assertEqual(categories[1]['percentage'], 50)
        self.assertEqual(categories[0]['percentage'], 100)

    def test_invalid_submission_does_not_finish(self):
        attempt = Attempt.objects.create(quiz=self.quiz, student=self.student, total_questions=1)
        response = self.client.post(f'/api/attempts/{attempt.pk}/submit/', {'answers': {str(self.question.pk): 99999}}, format='json')
        self.assertEqual(response.status_code, 400)
        attempt.refresh_from_db()
        self.assertFalse(attempt.completed)
        self.assertFalse(attempt.answers.exists())
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(f'/api/attempts/{attempt.pk}/').status_code, 404)

    def test_sequence_copy_and_full_fields(self):
        source = DidacticSequence.objects.create(chapter=self.chapter, title='Sugestão')
        self.assertEqual(self.client.get(f'/api/sequences/{source.pk}/').status_code, 404)
        self.client.force_authenticate(self.teacher_user)
        self.assertEqual(self.client.patch(f'/api/sequences/{source.pk}/', {'title': 'Editado'}).status_code, 403)
        response = self.client.post(f'/api/sequences/{source.pk}/copy/')
        self.assertEqual(response.status_code, 201)
        sequence_id = response.data['id']
        result = self.client.patch(f'/api/sequences/{sequence_id}/', {'title': 'Meu projeto', 'rationale': 'Motivação', 'learning_outcomes': 'PC2', 'activities': [{'title': 'Etapa', 'description': 'Texto longo'}]}, format='json')
        self.assertEqual(result.status_code, 200)
        self.assertEqual(DidacticSequence.objects.get(pk=sequence_id).rationale, 'Motivação')
        source.refresh_from_db()
        self.assertEqual(source.title, 'Sugestão')

    def test_admin_guided_creation_end_to_end(self):
        admin = User.objects.create_superuser(username='admin', login='admin', name='Admin', role='admin', password='test-password')
        self.client.force_authenticate(admin)
        school = self.client.post('/api/admin/schools/', {'name': 'Escola Nova', 'city': 'Salvador', 'state': 'BA'}, format='json')
        self.assertEqual(school.status_code, 201)
        teacher = self.client.post('/api/admin/teachers/', {'name': 'Docente', 'login': 'docente.novo', 'email': 'docente@nova.test', 'password': 'senha-segura', 'school': school.data['id']}, format='json')
        student = self.client.post('/api/admin/students/', {'name': 'Discente', 'login': 'discente.novo', 'password': 'senha-segura', 'school': school.data['id'], 'grade': '6'}, format='json')
        self.assertEqual(teacher.status_code, 201)
        self.assertEqual(student.status_code, 201)
        group = self.client.post('/api/admin/classes/', {'name': '6º A', 'year': 2026, 'school': school.data['id'], 'teacher': teacher.data['id'], 'student_ids': [student.data['id']]}, format='json')
        self.assertEqual(group.status_code, 201)
        book = self.client.post('/api/admin/books/', {'title': 'Livro novo', 'school_year': '6', 'teacher_ids': [teacher.data['id']], 'class_ids': [group.data['id']]}, format='json')
        chapter = self.client.post('/api/admin/chapters/', {'book': book.data['id'], 'number': 1, 'title': 'Capítulo inicial'}, format='json')
        material = self.client.post('/api/admin/materials/', {'chapter': chapter.data['id'], 'title': 'Avaliação', 'type': 'quiz'}, format='json')
        quiz = self.client.post('/api/admin/quizzes/', {'material': material.data['id'], 'title': 'Prova inicial', 'description': '', 'active': True, 'questions': [{'statement': 'Qual opção?', 'order': 1, 'knowledge_area': None, 'alternatives': [{'text': 'Correta', 'order': 1, 'is_correct': True}, {'text': 'Incorreta', 'order': 2, 'is_correct': False}]}]}, format='json')
        self.assertEqual(quiz.status_code, 201)
        self.assertEqual(Quiz.objects.get(pk=quiz.data['id']).questions.count(), 1)
        edited_student = self.client.put(f"/api/admin/students/{student.data['id']}/", {'name': 'Discente Editado', 'login': 'discente.novo', 'email': '', 'password': '', 'school': school.data['id'], 'grade': '7', 'is_individual_customer': False}, format='json')
        self.assertEqual(edited_student.status_code, 200)
        self.assertEqual(edited_student.data['grade'], '7')
        edited_class = self.client.put(f"/api/admin/classes/{group.data['id']}/", {'name': '7º A', 'year': 2027, 'school': school.data['id'], 'teacher': teacher.data['id'], 'student_ids': [student.data['id']]}, format='json')
        self.assertEqual(edited_class.status_code, 200)
        self.assertEqual(edited_class.data['student_ids'], [student.data['id']])
        self.assertEqual(self.client.delete(f"/api/admin/quizzes/{quiz.data['id']}/").status_code, 204)
        self.assertEqual(self.client.delete(f"/api/admin/schools/{school.data['id']}/").status_code, 400)

    def test_teacher_cannot_use_admin_creation_api(self):
        self.client.force_authenticate(self.teacher_user)
        self.assertEqual(self.client.post('/api/admin/schools/', {'name': 'Proibida'}).status_code, 403)

    def test_report_filters_and_school_isolation(self):
        self.submit(self.correct)
        self.client.force_authenticate(self.teacher_user)
        response = self.client.get('/api/performance/', {'class': self.group.pk, 'chapter': self.chapter.pk, 'student': self.student.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['metrics']['score'], 100)
        self.assertEqual(response.data['metrics']['completion'], 100)
        self.assertEqual(response.data['metrics']['students'], 1)
        self.assertEqual(self.client.get('/api/performance/', {'student': self.other.pk}).status_code, 404)
        self.assertEqual(self.client.get('/api/performance/', {'class': 'bad'}).status_code, 400)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/performance/').status_code, 403)

    def test_school_relationship_validation(self):
        with self.assertRaises(ValidationError):
            ClassStudent.objects.create(class_group=self.group, student=self.other)
        with self.assertRaises(ValidationError):
            Class.objects.create(name='Inválida', year=2026, school=self.other_school, teacher=self.teacher)

    def test_anonymous_denied(self):
        self.client.force_authenticate(None)
        for endpoint in ['books', 'chapters', 'materials', 'sequences', 'quizzes', 'attempts', 'achievements', 'rankings', 'performance']:
            self.assertEqual(self.client.get(f'/api/{endpoint}/').status_code, 401)

    def test_dashboard_and_ranking(self):
        self.submit(self.correct)
        self.assertEqual(self.client.get('/api/dashboard/').data['points'], 1)
        ranking = self.client.get('/api/rankings/', {'book': self.book.pk}).data['results']
        self.assertEqual(ranking[0]['percentage'], 100)
        self.assertTrue(ranking[0]['is_me'])
        self.assertNotIn('name', ranking[0])
        self.assertEqual(self.client.get('/api/rankings/', {'category': 'invalid'}).status_code, 400)
        self.assertEqual(self.client.get('/api/chapters/', {'book': 'bad'}).status_code, 400)
        self.client.force_authenticate(self.teacher_user)
        self.assertEqual(self.client.get('/api/dashboard/').data['class_count'], 1)

    def test_filters_change_report(self):
        self.submit(self.correct)
        second = Chapter.objects.create(book=self.book, title='Outro capítulo', number=2)
        material = Material.objects.create(chapter=second, title='Outra prova', type='quiz')
        Quiz.objects.create(material=material, title='Outra prova')
        self.client.force_authenticate(self.teacher_user)
        report = self.client.get('/api/performance/', {'chapter': second.pk}).data
        self.assertIsNone(report['metrics']['score'])
        self.assertEqual(report['metrics']['completion'], 0)
        self.assertEqual(report['distribution']['no_attempts'], 1)
