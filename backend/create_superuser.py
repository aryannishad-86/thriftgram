"""Create a Django superuser from environment variables.

Set DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD before running. Never hardcode
or print the password.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = os.getenv('DJANGO_SUPERUSER_USERNAME')
email = os.getenv('DJANGO_SUPERUSER_EMAIL', '')
password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

if not username or not password:
    sys.exit('Set DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD to create a superuser.')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created.")
else:
    print(f"Superuser '{username}' already exists.")
