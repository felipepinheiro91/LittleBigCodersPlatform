from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken


class PasswordLoginTests(TestCase):
    """Exercise password verification and signed JWTs in an isolated test DB."""

    @classmethod
    def setUpTestData(cls):
        cls.password = 'test-only-password-7346!'
        cls.users = {}
        for role in ('admin', 'teacher', 'student'):
            cls.users[role] = get_user_model().objects.create_user(
                username=f'auth-test-{role}', login=f'auth-test-{role}',
                email=f'{role}@auth.example.test',
                name=f'Auth test {role}', role=role, password=cls.password,
            )

    def setUp(self):
        self.client = APIClient()

    def login(self, role='student', password=None):
        return self.client.post('/api/token/', {
            'login': self.users[role].login,
            'password': self.password if password is None else password,
        }, format='json', secure=True)

    def test_password_login_and_authenticated_profile_for_each_role(self):
        for role, user in self.users.items():
            with self.subTest(role=role):
                self.client.credentials()
                response = self.login(role)
                self.assertEqual(response.status_code, 200)
                self.assertIn('refresh', response.data)
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
                profile = self.client.get('/api/me/', secure=True)
                self.assertEqual(profile.status_code, 200)
                self.assertEqual(profile.data['id'], user.pk)
                self.assertEqual(profile.data['role'], role)

    def test_wrong_password_and_anonymous_requests_are_rejected(self):
        self.assertEqual(self.login(password='incorrect').status_code, 401)
        self.assertEqual(self.client.get('/api/me/', secure=True).status_code, 401)

    def test_expired_access_is_rejected_and_refresh_restores_access(self):
        tokens = self.login().data
        expired = AccessToken(tokens['access'])
        expired['exp'] = int((timezone.now() - timedelta(minutes=1)).timestamp())
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired}')
        self.assertEqual(self.client.get('/api/me/', secure=True).status_code, 401)
        refreshed = self.client.post('/api/token/refresh/', {
            'refresh': tokens['refresh'],
        }, format='json', secure=True)
        self.assertEqual(refreshed.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refreshed.data["access"]}')
        self.assertEqual(self.client.get('/api/me/', secure=True).status_code, 200)
        invalid = self.client.post('/api/token/refresh/', {'refresh': 'invalid'},
                                   format='json', secure=True)
        self.assertEqual(invalid.status_code, 401)

    def test_inactive_account_cannot_login(self):
        user = self.users['student']
        user.is_active = False
        user.save(update_fields=['is_active'])
        self.assertEqual(self.login().status_code, 401)
