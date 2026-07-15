"""
ASGI config for config project.

Plain Django ASGI. Real-time features use polling over HTTP, not WebSockets, so
there is no Channels ProtocolTypeRouter here. Production serves WSGI via gunicorn.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_asgi_application()
