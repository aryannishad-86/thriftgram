"""Test settings: fast, hermetic, no external services.

SQLite in-memory, throttling off, cheap password hashing, local file storage,
and dummy Stripe keys so StripeService.is_configured() is True (the network call
itself is monkeypatched in the tests that exercise checkout).
"""
from .settings import *  # noqa: F401,F403

# Hermetic: CI has no .env, so never depend on env-provided config. Without
# these, an env-less run gets an empty SECRET_KEY (boot failure) and DEBUG=False
# (SECURE_SSL_REDIRECT 301s every test request to https://).
SECRET_KEY = 'test-only-secret-key-not-used-anywhere-real'
DEBUG = True
ALLOWED_HOSTS = ['testserver', 'localhost']
SECURE_SSL_REDIRECT = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': [],
    # Keep every scope defined (view-level throttles like 'register' still resolve
    # their rate) but set to None so nothing throttles during tests.
    'DEFAULT_THROTTLE_RATES': {'anon': None, 'user': None, 'login': None, 'register': None},
}

PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

STRIPE_SECRET_KEY = 'sk_test_dummy'
STRIPE_WEBHOOK_SECRET = 'whsec_dummy'
