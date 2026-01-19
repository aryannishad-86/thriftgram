# ThriftGram

A marketplace for thrifted fashion — think Instagram meets Depop. Built as a fullstack project to explore real-time features, payment processing, and social commerce patterns.

## What it does

ThriftGram lets users buy and sell secondhand clothing with features you'd expect from a modern marketplace:

- **Listings** — Post items with photos, prices, condition ratings
- **Messaging** — Real-time chat between buyers and sellers (WebSockets via Django Channels)
- **Payments** — Stripe integration for checkout
- **Drops** — Time-limited product releases with countdowns
- **Closet sync** — Upload your wardrobe and match items with listings
- **Social stuff** — Follow users, like items, build wishlists
- **Eco tracking** — Gamified sustainability points with tiered badges

The frontend has some nice scroll animations and a clean UI. Nothing groundbreaking, but it feels polished.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework, Channels |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth |
| Payments | Stripe |
| Media | Cloudinary |
| Animations | Framer Motion, Lenis |

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Stripe account (for payments)
- Cloudinary account (for image uploads)
- Google Cloud project (for OAuth)

### Database

```bash
createdb thriftgram
```

Or use pgAdmin/DataGrip if you don't have `createdb`.

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your credentials

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `localhost:3000`, API at `localhost:8000`.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. You'll need:

```
SECRET_KEY          # Django secret key
DATABASE_URL        # PostgreSQL connection string
CLOUDINARY_URL      # From your Cloudinary dashboard
GOOGLE_CLIENT_ID    # From Google Cloud Console
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY   # From Stripe dashboard
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

The `.env.example` has comments explaining each variable.

## Project structure

```
├── backend/
│   ├── core/           # Main app (models, views, serializers)
│   ├── chat/           # WebSocket messaging
│   ├── notifications/  # User notifications
│   └── config/         # Django settings
│
├── frontend/
│   ├── src/app/        # Next.js pages (app router)
│   ├── src/components/ # React components
│   └── src/lib/        # Utils, API client
```

## API endpoints

Some notable ones:

```
POST   /api/auth/register/     # Create account
POST   /api/auth/google/       # Google OAuth login
GET    /api/items/             # List all items (with search/filter)
POST   /api/items/             # Create listing
POST   /api/items/{id}/like/   # Like an item
GET    /api/users/me/          # Current user profile
GET    /api/drops/             # Upcoming drops
POST   /api/orders/            # Create order (triggers Stripe)
WS     /ws/chat/{room}/        # Real-time messaging
```

## Things I learned

- WebSockets with Django Channels are actually pretty nice once you get the routing figured out
- Stripe's webhook flow took some debugging but works well for async payment confirmation
- Next.js App Router with server components is powerful but has a learning curve
- Eco points / gamification adds surprising engagement even in a demo project

## Known issues

- Mobile responsiveness could use work in some spots
- No email verification yet (on the roadmap)
- Search is basic — would benefit from Elasticsearch for production

---

Built by Aryan Nishad
