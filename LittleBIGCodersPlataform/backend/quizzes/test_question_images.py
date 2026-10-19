import base64
from io import BytesIO

from PIL import Image
from rest_framework.test import APITestCase

from accounts.models import User
from content.models import Book, Chapter


class QuestionImageTests(APITestCase):
    def setUp(self):
        self.client.force_authenticate(User.objects.create_superuser(username='image-admin', login='image-admin', role='admin', password='test-password'))
        book = Book.objects.create(title='Livro', school_year='1')
        self.chapter = Chapter.objects.create(book=book, number=1, title='Capítulo')
        image = BytesIO()
        Image.new('RGB', (10, 10), 'blue').save(image, format='PNG')
        self.image = 'data:image/png;base64,' + base64.b64encode(image.getvalue()).decode('ascii')

    def payload(self, image):
        return {'chapters': [self.chapter.pk], 'title': 'Prova com imagem', 'questions': [{
            'statement': 'Qual é a cor?', 'image': image, 'image_description': 'Um quadrado azul',
            'alternatives': [{'text': 'Azul', 'is_correct': True}, {'text': 'Verde', 'is_correct': False}],
        }]}

    def test_image_survives_create_read_edit_and_removal(self):
        response = self.client.post('/api/admin/quizzes/', self.payload(self.image), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        quiz_id = response.data['id']
        response = self.client.get(f'/api/quizzes/{quiz_id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['questions'][0]['image'], self.image)
        self.assertEqual(response.data['questions'][0]['image_description'], 'Um quadrado azul')
        self.assertNotIn('is_correct', response.data['questions'][0]['alternatives'][0])
        updated = self.payload(self.image)
        updated['questions'][0]['statement'] = 'Observe o quadrado.'
        response = self.client.patch(f'/api/admin/quizzes/{quiz_id}/', updated, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['questions'][0]['image'], self.image)
        updated['questions'][0].update(image='', image_description='')
        response = self.client.patch(f'/api/admin/quizzes/{quiz_id}/', updated, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['questions'][0]['image'], '')

    def test_invalid_images_are_rejected(self):
        for image in ['data:image/png;base64,aW52YWxpZA==', 'data:image/svg+xml;base64,PHN2Zy8+', self.image.replace('image/png', 'image/jpeg'), 'data:image/png;base64,' + 'A' * 2800004]:
            with self.subTest(image=image[:40]):
                response = self.client.post('/api/admin/quizzes/', self.payload(image), format='json')
                self.assertEqual(response.status_code, 400)

    def test_image_is_optional(self):
        payload = self.payload('')
        del payload['questions'][0]['image']
        del payload['questions'][0]['image_description']
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['questions'][0]['image'], '')

    def test_alternative_image_roundtrip_and_validation(self):
        payload = self.payload('')
        option = payload['questions'][0]['alternatives'][0]
        option.update(text='', image=self.image, image_description='Quadrado azul')
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        quiz_id = response.data['id']
        response = self.client.get(f'/api/quizzes/{quiz_id}/')
        option = response.data['questions'][0]['alternatives'][0]
        self.assertEqual(option['image'], self.image)
        self.assertEqual(option['image_description'], 'Quadrado azul')
        self.assertNotIn('is_correct', option)
        payload['questions'][0]['alternatives'][0]['image'] = 'data:image/png;base64,aW52YWxpZA=='
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 400)
        payload['questions'][0]['alternatives'][0]['image'] = ''
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 400)

    def test_teacher_can_edit_accessible_alternative_images(self):
        from accounts.models import Teacher, School
        from quizzes.models import Attempt
        school = School.objects.create(name='Escola')
        user = User.objects.create_user(username='image-teacher', login='image-teacher', email='image-teacher@example.test', role='teacher')
        teacher = Teacher.objects.create(user=user, school=school)
        self.chapter.book.teachers.add(teacher)
        response = self.client.post('/api/admin/quizzes/', self.payload(''), format='json')
        quiz_id = response.data['id']
        option_id = self.client.get(f'/api/quizzes/{quiz_id}/').data['questions'][0]['alternatives'][0]['id']
        url = f'/api/quizzes/{quiz_id}/alternative-image/'
        self.client.force_authenticate(user)
        body = {'alternative': option_id, 'image': self.image, 'image_description': 'Azul'}
        response = self.client.patch(url, body, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['image'], self.image)
        self.assertNotIn('is_correct', response.data)
        response = self.client.patch(url, {**body, 'image': ''}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['image'], '')
        outsider = User.objects.create_user(username='outsider', login='outsider', email='outsider@example.test', role='teacher')
        self.client.force_authenticate(outsider)
        self.assertEqual(self.client.patch(url, body, format='json').status_code, 404)
        self.client.force_authenticate(user)
        self.chapter.book.teachers.remove(teacher)
        self.assertEqual(self.client.patch(url, body, format='json').status_code, 404)
        self.chapter.book.teachers.add(teacher)
        from accounts.models import Student
        student_user = User.objects.create_user(username='image-student', login='image-student', email='image-student@example.test', role='student')
        student = Student.objects.create(user=student_user, school=school)
        Attempt.objects.create(quiz_id=quiz_id, student=student)
        self.assertEqual(self.client.patch(url, body, format='json').status_code, 400)
        self.client.force_authenticate(student_user)
        self.assertEqual(self.client.patch(url, body, format='json').status_code, 403)
