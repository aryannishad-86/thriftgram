"""
Seed a small set of demo listings so the "After Hours" gallery has real
photography to work with.

Why this exists: production currently has 6 items, exactly 1 with a photo
(a screenshot, not a garment) — the redesign's dark-gallery centerpiece has
nothing to show. This command adds 18 garment photos across categories
(jackets, shirts, jeans, sneakers, sweaters, dresses) under one clearly-named
demo seller, so the gallery, feed, and item-detail pages can be judged with
real content instead of an empty state.

Photography: Unsplash, downloaded and re-uploaded through this project's own
Cloudinary pipeline (Item.images -> ItemImage.image, the same ImageField
every real listing uses). The Unsplash License (unsplash.com/license) permits
this — free for any use, commercial included, no attribution required. This
command still records attribution: every photo's ID is listed below, and
https://unsplash.com/photos/<id> permanently resolves to that photo's credit
page. IDs were hand-picked and each verified live (HTTP 200) before being
added here, not assumed.

Safety:
  --dry-run   Print exactly what would be created. Touches nothing.
  --undo      Delete the demo seller and everything that cascades from it
              (their items, images, likes). This is the ENTIRE undo — the
              demo seller exists only for this command, so deleting the
              account is a clean, complete removal, not a partial cleanup.
  (default)   Create only what's missing. Re-running is a no-op for items
              that already exist (matched by title, scoped to the demo
              seller) — safe to run more than once.

Stripe is in TEST mode on this project (verified before this command was
written) — nothing created here is purchasable with real money.
"""
import io

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Item, ItemImage

User = get_user_model()

DEMO_USERNAME = "after_hours_demo"
DEMO_EMAIL = "demo@thriftgram.internal"  # non-routable — obviously not a real inbox

# Each entry: (Unsplash photo ID, title, description, price INR, size,
# condition). Prices are realistic Indian resale-market values, not the
# placeholder ₹10-99 range already sitting in production's test data.
LISTINGS = [
    ("1543076447-215ad9ba6923", "Washed Denim Jacket",
     "Classic mid-wash denim jacket, broken in just right. No rips, buttons all present.",
     1299, "M", "GOOD"),
    ("1611312449408-fcece27cdbb7", "Denim Button-Up Jacket",
     "Sturdy trucker-style jacket, sun-faded on the shoulders in a good way.",
     1499, "L", "LIKE_NEW"),
    ("1608147152875-b0eb0c53d491", "Denim Shirt",
     "Lightweight denim overshirt, works buttoned or open over a tee.",
     799, "M", "GOOD"),
    ("1605092474347-574370143393", "Vintage Straight-Leg Jeans",
     "Non-stretch vintage cut, that heavier denim you don't get anymore.",
     999, "32", "FAIR"),
    ("1616761512547-ea151d8a56d5", "Black Denim Button-Up",
     "Black-on-black denim shirt, holds up as a light jacket layer too.",
     849, "L", "GOOD"),
    ("1441035844538-e2ce7dba066b", "Vintage Flat-Lay Shirt Set",
     "Well-loved button-up with a story — light wear throughout, honestly priced.",
     599, "M", "FAIR"),
    ("1616761525721-3fd9832908af", "Converse High-Tops",
     "Classic black-and-white high-tops, decent tread left on the sole.",
     1699, "9", "GOOD"),
    ("1587563871167-1ee9c731aefb", "Nike Air Force 1",
     "The white-on-white classic. Cleaned up, minor yellowing on the sole.",
     2499, "10", "GOOD"),
    ("1600185365483-26d7a4cc7519", "Nike Athletic Sneakers",
     "White and red colourway, worn a handful of times only.",
     2199, "9", "LIKE_NEW"),
    ("1604671801908-6f0c6a092c05", "Nike Trainers",
     "Purple and black trainers, great for everyday wear.",
     1899, "8", "GOOD"),
    ("1695073621086-aa692bc32a3d", "White Nike Sneakers",
     "Clean white pair, one small scuff on the left toe (pictured honestly).",
     1799, "10", "GOOD"),
    ("1603808033192-082d6919d3e1", "Casual Canvas Sneakers",
     "Everyday canvas sneakers, comfortable break-in already done for you.",
     999, "9", "FAIR"),
    ("1560769629-975ec94e6a86", "Orange Athletic Sneakers",
     "Bold white-and-orange pair, barely worn.",
     1599, "8", "LIKE_NEW"),
    ("1634901581982-6b408cf4226a", "Multicolor Knit Sweater",
     "Chunky knit in a colour-block pattern, warm without being bulky.",
     899, "M", "GOOD"),
    ("1621198059871-0d5f9b449233", "White Knit Sweater",
     "Simple cream knit, goes with everything. No pilling.",
     799, "S", "LIKE_NEW"),
    ("1591221662157-6f62de5508eb", "Floral Lace Dress",
     "Sleeveless floral lace, worn once for a summer wedding.",
     1299, "S", "LIKE_NEW"),
    ("1540459920617-415d62f1f76b", "White Sweetheart Dress",
     "Sweetheart neckline, fitted through the waist. Dry-clean only.",
     1099, "M", "GOOD"),
    ("1760097679488-f808c6aca11d", "Blue Floral Dress",
     "Flowy blue floral print, great for warm weather.",
     949, "M", "GOOD"),
]


class Command(BaseCommand):
    help = "Seed demo garment listings (with real photography) under one clearly-named demo seller."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Print what would be created; touch nothing.")
        parser.add_argument("--undo", action="store_true", help="Delete the demo seller and everything they own.")

    def handle(self, *args, **options):
        if options["undo"]:
            return self._undo()
        if options["dry_run"]:
            return self._dry_run()
        return self._seed()

    # -- undo ---------------------------------------------------------------

    def _undo(self):
        try:
            demo_user = User.objects.get(username=DEMO_USERNAME)
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'No user "{DEMO_USERNAME}" exists — nothing to undo.'))
            return

        item_count = Item.objects.filter(seller=demo_user).count()
        self.stdout.write(f'Deleting user "{DEMO_USERNAME}" and their {item_count} item(s)...')
        demo_user.delete()  # CASCADE removes Items -> ItemImages, Likes, etc.
        self.stdout.write(self.style.SUCCESS("Done. Demo seller and all their listings are gone."))

    # -- dry run --------------------------------------------------------------

    def _dry_run(self):
        exists = User.objects.filter(username=DEMO_USERNAME).exists()
        self.stdout.write(f'Demo seller "{DEMO_USERNAME}" already exists: {exists}')

        existing_titles = set()
        if exists:
            demo_user = User.objects.get(username=DEMO_USERNAME)
            existing_titles = set(Item.objects.filter(seller=demo_user).values_list("title", flat=True))

        self.stdout.write(f"\n{len(LISTINGS)} listings in the seed set:\n")
        to_create = 0
        for photo_id, title, _desc, price, size, condition in LISTINGS:
            status = "SKIP (already exists)" if title in existing_titles else "CREATE"
            if status == "CREATE":
                to_create += 1
            self.stdout.write(
                f"  [{status:22}] {title:32} ₹{price:<6} {size:<4} {condition:<9} "
                f"https://unsplash.com/photos/{photo_id}"
            )

        self.stdout.write(f"\nWould create: {to_create} item(s) (+ demo user if not present).")
        self.stdout.write(self.style.WARNING("Dry run only — nothing was written. Run without --dry-run to apply."))

    # -- real seed --------------------------------------------------------------

    def _seed(self):
        demo_user, user_created = User.objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL, "bio": "Demo listings for the After Hours redesign — not a real seller."},
        )
        if user_created:
            demo_user.set_unusable_password()  # this account is never meant to log in
            demo_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created demo seller "{DEMO_USERNAME}" (login disabled).'))
        else:
            self.stdout.write(f'Demo seller "{DEMO_USERNAME}" already exists — reusing.')

        existing_titles = set(Item.objects.filter(seller=demo_user).values_list("title", flat=True))
        created_count = 0

        for photo_id, title, description, price, size, condition in LISTINGS:
            if title in existing_titles:
                self.stdout.write(f"  skip  {title} (already exists)")
                continue

            image_url = f"https://images.unsplash.com/photo-{photo_id}?w=1200&q=85&fm=jpg&fit=crop"
            try:
                response = requests.get(image_url, timeout=15)
                response.raise_for_status()
            except requests.RequestException as exc:
                self.stdout.write(self.style.ERROR(f"  FAILED to download {title}: {exc} — skipping this item."))
                continue

            with transaction.atomic():
                item = Item.objects.create(
                    seller=demo_user,
                    title=title,
                    description=description,
                    price=price,
                    size=size,
                    condition=condition,
                )
                item_image = ItemImage(item=item)
                item_image.image.save(
                    f"{photo_id}.jpg", ContentFile(io.BytesIO(response.content).read()), save=True
                )
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"  created  {title}"))

        self.stdout.write(self.style.SUCCESS(f"\nDone. {created_count} new listing(s) created under \"{DEMO_USERNAME}\"."))
