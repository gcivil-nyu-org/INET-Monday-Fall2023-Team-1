"""
Django settings for furbaby project.

Generated by 'django-admin startproject' using Django 4.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
import os
from dotenv import load_dotenv

os.environ.setdefault("FORGOT_PASSWORD_HOST", "http://localhost:3000")

load_dotenv()


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-5ic&%!xeaw@-lpvb6tfd)k0i(-t@$^ttrf)7sz=8)d#uzh)bgo"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "furbaby-prod-pr.eba-f3mkhigp.us-east-1.elasticbeanstalk.com",
]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "heartbeat",
    "api",
    "rest_framework",
    "drf_standardized_errors",
    "corsheaders",
    "django_rest_passwordreset",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "furbaby.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "furbaby.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "postgres",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "localhost",
        "PORT": "5432",
    },
}

AUTH_USER_MODEL = "api.Users"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "drf_standardized_errors.handler.exception_handler",
}

AUTHENTICATION_BACKENDS = ["api.auth_backends.EmailBackend"]
# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

HEARTBEAT = {
    "package_name": "furbaby",
    "checkers": [
        "heartbeat.checkers.build",
        "heartbeat.checkers.distribution_list",
        "heartbeat.checkers.debug_mode",
        "heartbeat.checkers.python",
        "heartbeat.checkers.database",
    ],
}

CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://*.vercel.app",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://*.elasticbeanstalk.com",
]
CORS_EXPOSE_HEADERS = ["Content-Type", "X-CSRFToken"]
CORS_ALLOW_CREDENTIALS = True
# PROD endpoint for frontend: https://inet-monday-fall2023-team-1.vercel.app/

# PROD ONLY
# CSRF_COOKIE_SECURE = True
# SESSION_COOKIE_SECURE = True

# NOTE: comment this in case you need to need
# to see the complete error locally for more
# context and error data
DRF_STANDARDIZED_ERRORS = {
    "ENABLE_IN_DEBUG_FOR_UNHANDLED_EXCEPTIONS": True,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://*.vercel.app",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://*.elasticbeanstalk.com",
]

# Email Backend Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_PORT = 587
EMAIL_USE_TLS = True  # Set to False if perhaps you have a local mailserver running
EMAIL_HOST = (
    "smtp.gmail.com"  # Replace with your email host for gmail -> 'smtp.gmail.com'
)
EMAIL_HOST_USER = os.environ["EMAIL_APP_USERNAME"]
EMAIL_HOST_PASSWORD = os.environ["EMAIL_APP_PASSWORD"]

SESSION_COOKIE_SECURE = False
SESSION_COOKIE_DOMAIN = "test.com"
