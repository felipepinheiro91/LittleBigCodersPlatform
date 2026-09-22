from rest_framework.test import APITestCase
from . import tests as platform_tests
from .models import Book, Chapter, Material
from quizzes.models import Quiz, Attempt
from achievements.services import achievement_stats


class SharedResourceTests(APITestCase):
    setUp = platform_tests.PlatformTests.setUp
    submit = platform_tests.PlatformTests.submit
    authenticate_admin = platform_tests.PlatformTests.authenticate_admin
    challenge_payload = platform_tests.PlatformTests.challenge_payload

    def test_reuse_permissions_and_distinct_results(self):
        second = Chapter.objects.create(book=self.book, title='Segundo', number=2)
        private_book = Book.objects.create(title='Outro livro', school_year='6')
        private = Chapter.objects.create(book=private_book, title='Privado', number=1)
        self.material.chapters.add(second, private)
        self.assertEqual(len(self.client.get('/api/materials/').data), 1)
        self.assertEqual(len(self.client.get('/api/quizzes/').data), 1)
        self.assertEqual(self.client.get('/api/materials/', {'chapter': private.pk}).data, [])
        self.assertEqual(len(self.client.get('/api/materials/', {'chapter': second.pk}).data), 1)
        self.submit(self.correct)
        self.assertEqual(achievement_stats(self.student, self.book.pk)[0]['total'], 1)
        self.assertEqual(achievement_stats(self.student, self.book.pk)[1]['total'], 1)
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(f'/api/quizzes/{self.quiz.pk}/').status_code, 404)
        self.client.force_authenticate(self.teacher_user)
        report = self.client.get('/api/performance/').data
        self.assertEqual(report['metrics']['proposed'], 1)
        self.assertEqual(report['metrics']['completed'], 1)
        self.assertEqual(report['metrics']['attempts'], 1)
        self.assertEqual(len(report['chapters']), 2)

    def test_admin_can_link_unlink_and_delete_chapter_without_deleting_resource(self):
        self.submit(self.correct)
        self.authenticate_admin()
        second = Chapter.objects.create(book=self.book, title='Segundo', number=2)
        response = self.client.patch(f'/api/admin/quizzes/{self.quiz.pk}/', {'chapters': [self.chapter.pk, second.pk]}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertCountEqual(response.data['chapters'], [self.chapter.pk, second.pk])
        response = self.client.patch(f'/api/admin/chapters/{self.chapter.pk}/', {'material_ids': []}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(list(self.material.chapters.all()), [second])
        self.assertEqual(self.client.delete(f'/api/admin/chapters/{second.pk}/').status_code, 204)
        self.assertTrue(Material.objects.filter(pk=self.material.pk).exists())
        self.assertTrue(Quiz.objects.filter(pk=self.quiz.pk).exists())
        self.assertEqual(Attempt.objects.filter(quiz=self.quiz).count(), 1)
        self.assertEqual(self.client.patch(f'/api/admin/materials/{self.material.pk}/', {'type': 'text'}, format='json').status_code, 400)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get('/api/quizzes/').data, [])

    def test_create_shared_and_unassigned_resources(self):
        self.authenticate_admin()
        second = Chapter.objects.create(book=self.book, title='Segundo', number=2)
        payload = self.challenge_payload()
        del payload['chapter']
        payload['chapters'] = [self.chapter.pk, second.pk]
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertCountEqual(response.data['chapters'], payload['chapters'])
        payload['chapters'] = []
        response = self.client.post('/api/admin/quizzes/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        material = self.client.post('/api/admin/materials/', {'chapters': [self.chapter.pk, second.pk], 'title': 'Vídeo', 'type': 'video'}, format='json')
        self.assertEqual(material.status_code, 201, material.data)
        self.assertCountEqual(material.data['chapters'], [self.chapter.pk, second.pk])
        payload['chapters'] = [999999]
        self.assertEqual(self.client.post('/api/admin/quizzes/', payload, format='json').status_code, 400)
