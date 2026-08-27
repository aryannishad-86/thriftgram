# Caching

ThriftGram caches two endpoints. This doc says what's cached, why those two
and not others, how invalidation works, and what to check before adding a
third.

## Backend

Django's `DatabaseCache` (`django.core.cache.backends.db.DatabaseCache`),
backed by a plain table (`django_cache_table`) in the same Postgres database
as everything else — not Redis or Memcached. This project runs at $0; a
cache backend that needs its own hosted service isn't worth it at this
traffic, and `DatabaseCache` gives the one property that actually matters
here: **the cache is shared across every Cloud Run instance**, unlike the
implicit in-process `LocMemCache` Django falls back to when `CACHES` isn't
configured at all (which is what this project ran on until now — each
instance had its own independent, unshared cache, which is also why DRF's
throttling was quietly bypassable: the request-rate counters live in the
same cache and were never actually shared either).

The table is created by `manage.py createcachetable`, which runs on every
container boot (see `Dockerfile`), the same idempotent-on-repeat pattern as
`migrate`. It is **not** a tracked Django migration — there's no
`django_migrations` row for it, so if the table is ever missing in a fresh
environment, the fix is running that command once, not `migrate`.

## What's cached, and why only these two

| Endpoint | Cached for | Key | TTL |
|---|---|---|---|
| `GET /api/leaderboard/` | everyone | `caching.LEADERBOARD_KEY` | 5 min backstop |
| `GET /api/items/featured/` | anonymous callers only | `caching.FEATURED_ITEMS_ANON_KEY` | 5 min backstop |

Both are public, read-heavy, identical-for-most-viewers, and nowhere near
the payment or auth flow. That combination is the actual bar for adding a
new cached endpoint here — not "this endpoint is slow."

**Nothing authenticated, personalized, or payment-related gets cached.**
This isn't just a guideline; it's the thing that actually bit this work in
progress and is worth understanding before touching either endpoint:

- `LeaderboardViewSet` used to serialize entries with the full
  `UserSerializer`, which includes `is_following` — whether the *current
  viewer* follows that leaderboard entry. Caching that raw response would
  have leaked one viewer's follow relationships into the response every
  other viewer received. The fix wasn't "don't cache it" — it was
  `LeaderboardEntrySerializer`, a leaderboard-specific shape with exactly
  the fields the leaderboard page actually renders (checked against its
  frontend code first) and nothing per-viewer. Once the response has no
  personalized data in it, caching it for everyone is correct.
- `featured()` couldn't get the same treatment: `ItemSerializer.is_liked`
  (did *this viewer* like this item) is core to what the homepage gallery
  shows, not an incidental field to strip. So caching is scoped to
  anonymous requests only, where `is_liked` is always deterministically
  `False` for everyone — one shared cache entry is correct for that
  audience, and a public homepage gallery skews heavily anonymous anyway.
  Authenticated requests always compute fresh, every time, full stop.

If you're adding caching to a new endpoint: check what every field in the
serialized response actually means before deciding whether one cached
response can honestly be shared across every caller. If anything varies by
who's asking, either strip it (leaderboard's fix) or scope the cache to the
audience for whom it's actually constant (featured's fix) — don't cache the
raw response "because it's mostly the same for everyone."

## Invalidation

Both endpoints are invalidated explicitly on the writes that change their
content, with the TTL as a backstop for anything that isn't:

- **Leaderboard** — `invalidate_leaderboard_cache` in `core/signals.py`, a
  `post_save` receiver on `CustomUser`. Deliberately unconditional: it
  clears the cache on *every* user save, not just ones that changed
  `eco_points`, because there are three separate places `eco_points`
  changes (`core/signals.py`'s three `award_*` receivers) and all three go
  through `user.save()`/`instance.save(...)`. One receiver on the model
  that actually changes is more reliable than hooking three call sites
  individually and hoping nothing new is added later without also touching
  this file. A cheap top-10 query being recomputed slightly more often than
  strictly necessary costs nothing worth guarding against.

- **Featured items** — two invalidation paths, because the underlying data
  changes two different ways:
  - `invalidate_featured_cache` in `core/signals.py`, a `post_save`
    receiver on `Item`. Fires on create *and* update, and — because it's a
    signal, not a hook in `ItemViewSet.perform_create` — fires no matter
    how the `Item` was written: through the API, the Django admin, a
    management command, or (this is exactly what a test caught) a factory
    calling `Item.objects.create(...)` directly in a test.
  - An explicit `cache.delete(FEATURED_ITEMS_ANON_KEY)` call inside
    `handle_checkout_completion` (`core/views.py`), right where a sold
    item's `is_sold` flips to `True`. That flip is a bulk
    `Item.objects.filter(...).update(is_sold=True)`, and **Django's bulk
    `.update()` does not fire `post_save` signals** — the signal above
    can't see it happen. Any future write path that uses `.update()`
    instead of `.save()` needs the same treatment: an explicit
    `cache.delete()` at the call site, not an assumption that the signal
    will catch it.

If you add a write path that changes what either endpoint returns, ask
first whether it goes through `.save()` (the signals already catch it) or a
bulk `.update()`/`.delete()` (it won't — add an explicit `cache.delete()`
next to that call, the way the webhook path does).

## Keys and versioning

Cache keys live in `core/caching.py`, not inline in the views or signals
that use them — the same string has to match on both the write side (views)
and the invalidation side (signals), and keeping them in one file is what
stops that from silently drifting apart.

Every key is prefixed with a version (`v1:...`). If a cached response's
*shape* ever changes — a field renamed, removed, or reinterpreted — bump
`CACHE_VERSION` in `core/caching.py` rather than trying to reason about
whether old cached entries in production are still valid under the new
code. A version bump makes every previously-cached key simply never get
read again; the old rows age out of the table on their own (DatabaseCache
doesn't eagerly evict, but nothing reads them, and they're a handful of
tiny rows — not worth writing a cleanup job for at this scale).

## Testing

`core/tests/test_caching.py` covers both endpoints. The two "does caching
actually happen" tests are worth understanding if you're extending them:
they change the underlying data via a bulk `Item.objects.filter(...).update()`
/ `CustomUser.objects.filter(...).update()` call, specifically *not* by
creating a new row through a factory. A factory's `.create()` fires the
`post_save` invalidation signal and would recompute correctly whether or
not caching works at all — that makes the test pass for the wrong reason
even in the worst case (caching completely broken and every request always
hits the DB). Using `.update()` bypasses the signal entirely, so the test
genuinely proves the second call was served from cache, not recomputed.

## Local dev / tests

`config/test_settings.py` overrides `CACHES` to `LocMemCache` instead of
`DatabaseCache`. `DatabaseCache` needs its table created by
`createcachetable`, a plain management command with no migration — the test
runner's migrate-then-run flow has no hook for that. `LocMemCache` has the
same cache API and the same behavior for everything the tests actually
check (hit/miss, key presence, invalidation), with zero extra test
bootstrap.
