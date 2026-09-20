import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest


@unittest.skipUnless(importlib.util.find_spec('dj_database_url'), 'Instale requirements-production.txt')
class ProductionSettingsTests(unittest.TestCase):
    def load_settings(self, **overrides):
        environment = {
            **os.environ,
            'SECRET_KEY': 'validation-only-not-a-real-production-secret-0123456789',
            'DATABASE_URL': 'postgresql://validation:validation@localhost/validation?sslmode=require',
            'ALLOWED_HOSTS': 'api.example.test',
            'RENDER_EXTERNAL_HOSTNAME': '',
            'CORS_ALLOWED_ORIGINS': 'https://app.example.test',
            'AWS_STORAGE_BUCKET_NAME': 'validation-only',
            'AWS_ACCESS_KEY_ID': 'validation-only',
            'AWS_SECRET_ACCESS_KEY': 'validation-only',
            **overrides,
        }
        return subprocess.run(
            [sys.executable, '-c',
             'import json; from config import production as settings; '
             'print(json.dumps({"debug": settings.DEBUG, "hosts": settings.ALLOWED_HOSTS, '
             '"ssl": settings.DATABASES["default"]["OPTIONS"]["sslmode"], '
             '"storage": settings.STORAGES["default"]["BACKEND"]}))'],
            cwd=Path(__file__).resolve().parent.parent,
            env=environment, capture_output=True, text=True,
        )

    def test_production_uses_secure_database_and_persistent_storage(self):
        result = self.load_settings(RENDER_EXTERNAL_HOSTNAME='service.onrender.com')
        self.assertEqual(result.returncode, 0, result.stderr)
        settings = json.loads(result.stdout)
        self.assertFalse(settings['debug'])
        self.assertEqual(settings['ssl'], 'require')
        self.assertIn('service.onrender.com', settings['hosts'])
        self.assertEqual(settings['storage'], 'storages.backends.s3.S3Storage')

    def test_required_secrets_and_storage_fail_closed(self):
        for name in ['SECRET_KEY', 'DATABASE_URL', 'AWS_STORAGE_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']:
            with self.subTest(name=name):
                result = self.load_settings(**{name: ''})
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(name, result.stderr)

    def test_sqlite_and_wildcard_hosts_are_rejected(self):
        for overrides in [{'DATABASE_URL': 'sqlite:///db.sqlite3'}, {'ALLOWED_HOSTS': '*'}]:
            with self.subTest(overrides=overrides):
                self.assertNotEqual(self.load_settings(**overrides).returncode, 0)
