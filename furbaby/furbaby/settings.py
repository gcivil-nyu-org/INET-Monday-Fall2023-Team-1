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

# from dotenv import load_dotenv, find_dotenv
from dotenv import load_dotenv
from botocore.config import Config as AWSConfig

# load_dotenv(find_dotenv(".eb_env", True, False)) - when using this settings file locally or deploying manually
load_dotenv()

CURRENT_BRANCH = os.environ.get("TRAVIS_BRANCH", "").lower()


# def get_password_reset_host():
#     if CURRENT_BRANCH == "master":
#         return "https://ui.furbabyapi.net"
#     return "https://staging-ui.furbabyapi.net"


def get_s3_assets_path():
    if CURRENT_BRANCH == "master":
        return "production-assets"
    return "staging-assets"


S3_CONFIG = AWSConfig(
    region_name="us-east-1",
    retries={"max_attempts": 10, "mode": "standard"},
    signature_version="v4",
)

AWS_BUCKET_NAME = os.environ.get("AWS_BUCKET_NAME", "")

ASSETS_PATH = get_s3_assets_path()

# NOTE: perhaps very few opportunities to test this feature...but nevertheless it would mostly work
os.environ.setdefault("FORGOT_PASSWORD_HOST", "https://ui.furbabyapi.net")

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ["*"]


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
# database_name = "ebdb" if os.environ.get("TRAVIS_BRANCH", "").lower() != "master" else "ebdb_master"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "db",
        "USER": "root",
        "PASSWORD": os.environ.get("AWS_RDS_DATABASE_PASSWORD", ""),
        "HOST": "awseb-e-n3h4ykpptm-stack-awsebrdsdatabase-5tlrcwj3rs0l.ckzyhv20mvw0.us-east-1.rds.amazonaws.com",
        "PORT": "5432",
        "ATOMIC_REQUESTS": True,
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "drf_standardized_errors.handler.exception_handler",
}

AUTH_USER_MODEL = "api.Users"

AUTHENTICATION_BACKENDS = ["api.auth_backends.EmailBackend"]
# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        },
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
    "auth": {
        "username": "furbaby-api",
        "password": os.environ.get("DJANGO_SECRET_KEY"),
    },
}

CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_DOMAIN = "furbabyapi.net"
SESSION_COOKIE_DOMAIN = "furbabyapi.net"
SESSION_COOKIE_HTTPONLY = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "https://inet-monday-fall2023-team-1.vercel.app",
    "https://*.vercel.app",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://furbaby-prod-pr.eba-f3mkhigp.us-east-1.elasticbeanstalk.com",
    "https://ui.furbabyapi.net",
    "https://furbabyapi.net",
]
CORS_EXPOSE_HEADERS = ["Content-Type", "X-CSRFToken"]
CORS_ALLOW_CREDENTIALS = True
# PROD endpoint for frontend: https://inet-monday-fall2023-team-1.vercel.app/

# PROD ONLY
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

DRF_STANDARDIZED_ERRORS = {
    "ENABLE_IN_DEBUG_FOR_UNHANDLED_EXCEPTIONS": True,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://inet-monday-fall2023-team-1.vercel.app",
    "https://*.vercel.app",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://furbaby-prod-pr.eba-f3mkhigp.us-east-1.elasticbeanstalk.com",
    "http://*.elasticbeanstalk.com",
    "https://ui.furbabyapi.net",
    "https://furbabyapi.net",
]

# Email Backend Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_PORT = 587
EMAIL_USE_TLS = True  # Set to False if perhaps you have a local mailserver running
EMAIL_HOST = "smtp.gmail.com"
EMAIL_HOST_USER = os.environ.get("EMAIL_APP_USERNAME")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_APP_PASSWORD")

GIT_COMMIT_SHORT_HASH = os.environ.get("GIT_COMMIT_SHORT_HASH", "")

# # subprocess.check_output(["git", "rev-parse", "--short", "HEAD"])
#     .decode("ascii")
#     .strip()
GIT_COMMIT_HASH = os.environ.get("GIT_COMMIT_HASH", "")

# (subprocess.check_output(["git", "rev-parse", "HEAD"]).decode("ascii").strip()),
