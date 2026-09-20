import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .settings import *


def required_env(name):
    value = os.environ.get(name, '').strip()
    if not value:
        raise ImproperlyConfigured(f'Configure a variável {name} em produção.')
    return value


def env_list(name):
    return [value.strip() for value in os.environ.get(name, '').split(',') if value.strip()]


DEBUG = False
SECRET_KEY = required_env('SECRET_KEY')
ALLOWED_HOSTS = env_list('ALLOWED_HOSTS')
if os.environ.get('RENDER_EXTERNAL_HOSTNAME'):
    ALLOWED_HOSTS.append(os.environ['RENDER_EXTERNAL_HOSTNAME'])
if not ALLOWED_HOSTS or '*' in ALLOWED_HOSTS:
    raise ImproperlyConfigured('Configure os hosts exatos em ALLOWED_HOSTS.')

CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS')
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

DATABASES = {
    'default': dj_database_url.parse(required_env('DATABASE_URL'), conn_max_age=0, ssl_require=True),
}
if DATABASES['default']['ENGINE'] != 'django.db.backends.postgresql':
    raise ImproperlyConfigured('DATABASE_URL deve apontar para PostgreSQL.')
DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True
DATABASES['default']['OPTIONS']['connect_timeout'] = 10

MIDDLEWARE = list(MIDDLEWARE)
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
    'default': {
        'BACKEND': 'storages.backends.s3.S3Storage',
        'OPTIONS': {
            'bucket_name': required_env('AWS_STORAGE_BUCKET_NAME'),
            'access_key': required_env('AWS_ACCESS_KEY_ID'),
            'secret_key': required_env('AWS_SECRET_ACCESS_KEY'),
            'region_name': os.environ.get('AWS_S3_REGION_NAME', 'us-east-1'),
            'endpoint_url': os.environ.get('AWS_S3_ENDPOINT_URL') or None,
            'default_acl': None,
            'querystring_auth': True,
            'file_overwrite': False,
        },
    },
}
