"""Settings for the Delgarmi API and team panel.

Everything that differs between servers comes from environment variables (the .env file on the
server). Secrets never live in the repository.
"""

import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, default)


def required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f'Environment variable {name} is required.')
    return value


DEBUG = env('DJANGO_DEBUG', '0') == '1'
SECRET_KEY = env('DJANGO_SECRET_KEY') or ('dev-only-not-secret' if DEBUG else required('DJANGO_SECRET_KEY'))

SITE_DOMAIN = env('SITE_DOMAIN', 'localhost')
# The site's domain, plus the names other containers and health checks use.
ALLOWED_HOSTS = [h.strip() for h in env('DJANGO_ALLOWED_HOSTS', SITE_DOMAIN).split(',') if h.strip()]
ALLOWED_HOSTS += ['api', 'localhost', '127.0.0.1']
CSRF_TRUSTED_ORIGINS = [f'https://{SITE_DOMAIN}']

# The team panel does not live at /admin, so bots probing /admin find nothing.
PANEL_PATH = required('PANEL_PATH')
if not re.fullmatch(r'[a-z0-9-]{6,40}', PANEL_PATH) or PANEL_PATH == 'admin':
    raise RuntimeError('PANEL_PATH must be 6–40 lowercase letters, digits or dashes, and not "admin".')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'catalog',
    'providers',
    'care_requests',
    'accounts',
    'notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB', 'delgarmi'),
        'USER': env('POSTGRES_USER', 'delgarmi'),
        'PASSWORD': env('POSTGRES_PASSWORD', ''),
        'HOST': env('POSTGRES_HOST', 'db'),
        'PORT': env('POSTGRES_PORT', '5432'),
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Stored in UTC, shown in Tehran time.
LANGUAGE_CODE = 'fa'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

# /static/ belongs to the Next.js site; the panel's files sit under their own prefix.
STATIC_URL = '/django-static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

# nginx terminates TLS and tells us the original scheme.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
X_FRAME_OPTIONS = 'DENY'
# HTTPS redirect and HSTS are set by nginx in front of every response.
SILENCED_SYSTEM_CHECKS = ['security.W004', 'security.W008']

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
    'UNAUTHENTICATED_USER': None,
}

# SMS. Until an SMS account is connected, 'log' writes each message to the log instead of sending it
# (on the server: docker compose logs api | grep OTP).
SMS_BACKENDS = ['log']
SMS_BACKEND = env('SMS_BACKEND', 'log')
if SMS_BACKEND not in SMS_BACKENDS:
    raise RuntimeError(f'SMS_BACKEND must be one of: {", ".join(SMS_BACKENDS)}.')

# Checking a mobile number with a code by SMS. The form's error texts name these numbers
# (two minutes, five codes, half an hour): change both together.
OTP_LENGTH = 5
OTP_TTL = 120                  # seconds a code is valid
OTP_RESEND_AFTER = 120         # seconds before the same number may ask again
OTP_MAX_PER_HOUR = 5           # codes per number per hour
OTP_MAX_PER_HOUR_IP = 20       # codes per client IP per hour
OTP_MAX_ATTEMPTS = 5           # wrong tries that void a code
OTP_TOKEN_TTL = 1800           # seconds the checked-number token lasts

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'plain': {'format': '%(asctime)s %(levelname)s %(name)s %(message)s'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'plain'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
}
