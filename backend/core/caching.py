"""Shared keys/TTLs for the DatabaseCache-backed response caching added in
P4 (see CACHING.md). Kept in one place so the views that set a cache entry
and the signal handlers that invalidate it can't drift out of sync on the
key string.

Only ever used for public, non-personalized, non-payment endpoints —
leaderboard and the featured-items gallery. Nothing authenticated,
per-user, or payment-related is cached.
"""

CACHE_VERSION = 1  # bump to invalidate every key below at once (e.g. after a response-shape change)

LEADERBOARD_KEY = f'v{CACHE_VERSION}:leaderboard:top10'
FEATURED_ITEMS_ANON_KEY = f'v{CACHE_VERSION}:items:featured:anon'

# Backstop TTL — the actual staleness bound in practice is the explicit
# invalidation below (post_save signals / write-path cache.delete calls);
# this is what protects correctness if an invalidation hook is ever missed
# by future code, not the primary mechanism.
DEFAULT_TTL_SECONDS = 300
