from datetime import timedelta
import base64
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APITestCase
from accounts.models import User, School, Teacher, Student, Class, ClassStudent
from .models import Book, BookAccess, Chapter, Material, DidacticSequence
from quizzes.models import Quiz, Question, Alternative, Attempt


class PlatformTests(APITestCase):
    def test_class_book_access_lifecycle(self):
        from .access import visible_books
        from .reports import summarize
        self.access.delete()
        self.authenticate_admin()
        endpoint = '/api/admin/class-book-accesses/'
        today = timezone.localdate()
        payload = {'class_group': self.group.pk, 'book': self.book.pk, 'valid_from': str(today), 'valid_until': str(today + timedelta(days=30)), 'active': True}
        response = self.client.post(endpoint, payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        detail = f"{endpoint}{response.data['id']}/"
        self.assertTrue(visible_books(self.user).filter(pk=self.book.pk).exists())
        self.assertFalse(visible_books(self.other_user).exists())
        self.assertEqual(summarize([self.student], Quiz.objects.all())['proposed'], 1)
        self.assertEqual(self.client.post(endpoint, payload, format='json').status_code, 400)
        self.assertEqual(self.client.patch(detail, {'valid_until': str(today - timedelta(days=1))}, format='json').status_code, 400)
        self.client.patch(detail, {'active': False}, format='json')
        self.assertFalse(visible_books(self.user).exists())
        self.client.patch(detail, {'active': True}, format='json')
        self.group.enrollments.all().delete()
        self.assertFalse(visible_books(self.user).exists())
        ClassStudent.objects.create(class_group=self.group, student=self.student)
        self.assertTrue(visible_books(self.user).exists())
        self.client.force_authenticate(self.user)
        self.assertEqual(len(self.client.get(f'/api/books/{self.book.pk}/').data['access']), 1)
        self.assertEqual(self.client.get(endpoint).status_code, 403)
        self.assertEqual(self.client.post(endpoint, payload, format='json').status_code, 403)
        self.client.force_authenticate(self.teacher_user)
        self.assertEqual(self.client.delete(detail).status_code, 403)
        self.client.force_authenticate(User.objects.get(login='admin'))
        self.client.patch(detail, {'valid_from': str(today + timedelta(days=1))}, format='json')
        self.assertFalse(visible_books(self.user).exists())
        self.client.patch(detail, {'valid_from': str(today - timedelta(days=2)), 'valid_until': str(today - timedelta(days=1))}, format='json')
        self.assertFalse(visible_books(self.user).exists())
        self.client.patch(detail, payload, format='json')
        self.book.active = False
        self.book.save()
        self.assertFalse(visible_books(self.user).exists())
        self.book.active = True
        self.book.save()
        BookAccess.objects.create(student=self.student, book=self.book, login_code='independent', valid_from=today, valid_until=today)
        self.assertEqual(self.client.delete(detail).status_code, 204)
        self.assertTrue(visible_books(self.user).exists())

    def test_cover_upload_is_stored_in_database_and_can_be_removed(self):
        self.authenticate_admin()
        buffer = BytesIO()
        Image.new('RGB', (2, 2), 'purple').save(buffer, format='PNG')
        contents = buffer.getvalue()
        response = self.client.post('/api/admin/books/', {
            'title': 'Livro com capa', 'school_year': '6',
            'cover': SimpleUploadedFile('cover.png', contents, content_type='image/png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        book = Book.objects.get(pk=response.data['id'])
        self.assertEqual(book.cover, 'data:image/png;base64,' + base64.b64encode(contents).decode('ascii'))
        self.assertEqual(response.data['cover_url'], book.cover)
        self.assertEqual(self.client.get(f'/api/books/{book.pk}/').data['cover_url'], book.cover)
        endpoint = f'/api/admin/books/{book.pk}/'
        self.assertEqual(self.client.patch(endpoint, {'title': 'Editado'}, format='json').data['cover_url'], book.cover)
        response = self.client.patch(endpoint, {'cover': None}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['cover_url'])
        book.refresh_from_db()
        self.assertEqual(book.cover, '')

    def test_cover_rejects_fake_image(self):
        self.authenticate_admin()
        response = self.client.post('/api/admin/books/', {
            'title': 'Inválido', 'school_year': '6',
            'cover': SimpleUploadedFile('fake.png', b'not an image', content_type='image/png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 400)

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

    def challenge_payload(self):
        return {
            'chapter': self.chapter.pk, 'title': 'Desafio de lógica',
            'description': 'Escolha uma resposta', 'active': True,
            'questions': [{'statement': 'Qual opção?', 'order': 1, 'alternatives': [
                {'text': 'Sim', 'order': 1, 'is_correct': True},
                {'text': 'Não', 'order': 2},
            ]}],
        }

    def authenticate_admin(self):
        admin = User.objects.create_superuser(username='admin', login='admin', name='Admin', role='admin', password='test-password')
        self.client.force_authenticate(admin)

    def test_admin_creates_challenge_directly_in_chapter(self):
        self.authenticate_admin()
        response = self.client.post('/api/admin/quizzes/', self.challenge_payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        challenge = Quiz.objects.get(pk=response.data['id'])
        self.assertEqual(challenge.material.chapter, self.chapter)
        self.assertEqual(challenge.material.type, 'quiz')
        self.assertEqual(challenge.material.title, challenge.title)
        self.assertEqual(response.data['book_title'], self.book.title)
        self.assertFalse(response.data['has_attempts'])
        self.client.force_authenticate(self.user)
        visible = self.client.get(f'/api/quizzes/{challenge.pk}/')
        self.assertEqual(visible.status_code, 200)
        self.assertNotIn('is_correct', visible.data['questions'][0]['alternatives'][0])

    def test_invalid_challenge_does_not_leave_material(self):
        self.authenticate_admin()
        before = Material.objects.count()
        payload = self.challenge_payload()
        payload['questions'][0]['alternatives'][0]['is_correct'] = False
        self.assertEqual(self.client.post('/api/admin/quizzes/', payload, format='json').status_code, 400)
        self.assertEqual(Material.objects.count(), before)
        payload = self.challenge_payload()
        del payload['chapter']
        self.assertEqual(self.client.post('/api/admin/quizzes/', payload, format='json').status_code, 400)
        payload['chapter'] = self.chapter.pk
        payload['material'] = self.material.pk
        self.assertEqual(self.client.post('/api/admin/quizzes/', payload, format='json').status_code, 400)

    def test_admin_edits_used_challenge_without_changing_questions(self):
        self.submit(self.correct)
        self.authenticate_admin()
        endpoint = f'/api/admin/quizzes/{self.quiz.pk}/'
        response = self.client.patch(endpoint, {'title': 'Título atualizado', 'description': 'Novas orientações', 'active': False}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['has_attempts'])
        self.material.refresh_from_db()
        self.assertEqual(self.material.title, 'Título atualizado')
        self.assertEqual(self.client.patch(endpoint, {'questions': self.challenge_payload()['questions']}, format='json').status_code, 400)
        self.assertTrue(Question.objects.filter(pk=self.question.pk).exists())

    def test_challenge_admin_endpoints_require_admin(self):
        for user in [self.user, self.teacher_user]:
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get('/api/admin/quizzes/').status_code, 403)
            self.assertEqual(self.client.post('/api/admin/quizzes/', self.challenge_payload(), format='json').status_code, 403)

    def test_admin_sequence_creation_copy_edit_and_delete(self):
        self.authenticate_admin()
        payload = {
            'chapter': self.chapter.pk, 'title': 'Projeto de computação',
            'axis': 'Pensamento computacional', 'duration': '2 semanas',
            'estimated_classes': 4, 'format': 'Grupos', 'status': 'pending',
            'description': 'Construção de um jogo', 'ventures': 'Jogo final',
            'rationale': 'Aprender criando', 'general_objective': 'Criar algoritmos',
            'specific_objectives': 'Identificar padrões', 'learning_outcomes': 'Colaboração',
            'contents': 'Sequências e repetições',
            'activities': [{'title': 'Planejar', 'description': 'Desenhar o jogo'}],
        }
        response = self.client.post('/api/admin/sequences/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        sequence_id = response.data['id']
        self.assertIsNone(response.data['teacher'])
        self.assertEqual(response.data['book_id'], self.book.pk)
        for field, value in payload.items():
            self.assertEqual(response.data[field], value)
        self.client.force_authenticate(self.teacher_user)
        self.assertEqual(self.client.get(f'/api/sequences/{sequence_id}/').status_code, 200)
        copied = self.client.post(f'/api/sequences/{sequence_id}/copy/')
        self.assertEqual(copied.status_code, 201)
        self.assertEqual(copied.data['activities'], payload['activities'])
        self.assertEqual(self.client.get('/api/admin/sequences/').status_code, 403)
        self.authenticate_admin_for_sequence_test(sequence_id, copied.data['id'])

    def authenticate_admin_for_sequence_test(self, sequence_id, copy_id):
        self.client.force_authenticate(User.objects.get(login='admin'))
        endpoint = f'/api/admin/sequences/{sequence_id}/'
        self.assertEqual(self.client.patch(endpoint, {'title': 'Projeto revisado'}, format='json').status_code, 200)
        self.assertEqual(self.client.get(f'/api/admin/sequences/{copy_id}/').status_code, 404)
        self.assertEqual(self.client.delete(endpoint).status_code, 204)
        self.assertTrue(DidacticSequence.objects.filter(pk=copy_id).exists())

    def test_admin_sequence_validation_and_permissions(self):
        self.authenticate_admin()
        for payload in [
            {'chapter': self.chapter.pk, 'title': 'Inválida', 'estimated_classes': 0, 'activities': []},
            {'chapter': self.chapter.pk, 'title': 'Inválida', 'activities': [{'description': 'Sem título'}]},
        ]:
            self.assertEqual(self.client.post('/api/admin/sequences/', payload, format='json').status_code, 400)
        for user in [self.user, self.teacher_user, None]:
            self.client.force_authenticate(user)
            expected = 403 if user else 401
            self.assertEqual(self.client.get('/api/admin/sequences/').status_code, expected)
            self.assertEqual(self.client.post('/api/admin/sequences/', {}, format='json').status_code, expected)

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
