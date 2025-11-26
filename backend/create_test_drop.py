import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import DropEvent

# Create a drop starting in 2 minutes
start_time = timezone.now() + timedelta(minutes=2)
end_time = start_time + timedelta(hours=24)

DropEvent.objects.create(
    title="Vintage Streetwear Drop",
    description="A curated collection of 90s streetwear essentials. Rare finds from Supreme, Stussy, and more.",
    start_time=start_time,
    end_time=end_time,
    is_active=True
)

print(f"Created drop event starting at {start_time}")
