"""Test settings: fast, hermetic, no external services.

SQLite in-memory, throttling off, cheap password hashing, local file storage,
and dummy Stripe keys so StripeService.is_configured() is True (the network call
itself is monkeypatched in the tests that exercise checkout).
"""
from .settings import *  # noqa: F401,F403

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
