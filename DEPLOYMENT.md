# Deployment

How ThriftGram actually runs in production — where each piece lives, how a
push gets there, and the free-tier constraints that shaped several
decisions below. For local dev setup, see [README.md](README.md) instead;
this doc is about the deployed system, not `runserver`/`npm run dev`.

## Architecture

| Piece | Where | Plan |
|---|---|---|
| Backend (Django/DRF) | Google Cloud Run, `asia-south1` | Free tier (usage-based, nets to $0 at current traffic) |
| Frontend (Next.js) | Vercel | Hobby (free) |
| Database | Supabase Postgres, via its transaction-mode pooler | Free tier (500MB, auto-pauses after 7 days idle) |
| Media (images) | Cloudinary | Free (25 credits/mo) |
| Payments | Stripe | **Test mode** — no real transactions possible yet |
| AI image analysis | Google Gemini (`gemini-1.5-flash`, AI Studio SDK) | Free tier; falls back to labeled mock data if `GEMINI_API_KEY` is unset or any call fails |
| Error tracking | Sentry (optional) | Not currently configured — a no-op until `SENTRY_DSN` is set (see below) |
| CI/CD | GitHub Actions | Free (public repo — unlimited minutes) |

Everything here is deliberately free-tier. See "Cost posture" below before
adding anything that isn't.

## How a deploy happens

**Backend** — `.github/workflows/deploy-backend.yml`. Triggers on push to
`main` touching `backend/**`. Runs the test job (pytest +
`makemigrations --check`) first; only deploys on success, and only for an
actual push (a PR touching backend/ runs tests but does not deploy). The
deploy step builds and ships via `gcloud run deploy --source ./backend`,
which builds the image with Cloud Build and pushes it to Artifact Registry
before deploying the new revision. Secrets are written to a transient
`env.yaml` from GitHub Secrets and deleted immediately after (`if: always()`
cleanup step, so it's removed even if the deploy step fails).

**Frontend** — Vercel's own GitHub integration (not a workflow in this
repo). Connected directly to this repo with root directory `frontend/`,
production branch `main`. Any push to `main` touching `frontend/**`
auto-deploys; Vercel also builds preview deployments for PRs. Configure or
inspect this at vercel.com, not in `.github/workflows/`.

**Database migrations** ship *with* the backend deploy, not separately —
the container's `CMD` runs `manage.py migrate --noinput` before starting
gunicorn (see `backend/Dockerfile`). This means **a push to main that
includes a migration applies it directly to the live production
database** — there is no staging environment (local dev and production
point at the same Supabase project). Review migrations carefully before
merging.

## Environment variables / secrets

Backend secrets live in GitHub Actions secrets (Settings → Secrets and
variables → Actions) and are written into Cloud Run's env vars at deploy
time. `backend/.env.example` documents every variable and what it's for —
copy it to `backend/.env` for local dev. The one used only in CI/production
(not meaningful locally) is `GCP_SA_KEY`, the service account key used to
authenticate the deploy step itself.

Frontend env vars are configured directly in the Vercel dashboard (Project
→ Settings → Environment Variables), not in this repo.

## Cost posture

This project is meant to run at genuinely $0/month, not just "mostly free
tier." That constraint has shaped real decisions, not just an
aspiration — worth knowing before changing infrastructure:

- **`CACHES` uses `DatabaseCache`, not Redis** — a managed Redis instance
  isn't free on GCP; sharing the existing Postgres connection for caching
  is. `createcachetable` runs on every container boot (idempotent).
- **`min-instances: 0`** — the backend scales to zero when idle. This is
  why cold starts happen and why migration failures are handled as
  warn-and-continue rather than fatal (see the Dockerfile's `CMD` comment) —
  losing the whole container over a transient DB hiccup during a cold start
  previously took down `/api/health/` along with everything else.
- **`--concurrency 8` matches gunicorn's `--workers 1 --threads 8`** —
  Cloud Run's default concurrency (80) would let it route far more
  simultaneous requests to one container than gunicorn can actually serve
  in parallel, queuing the excess instead of scaling out. Verified directly
  against the live service before fixing (see git history / `change.ai.log`,
  P7) — this had silently been at the default the whole time.
- **`CONN_MAX_AGE=0`** — the production `DATABASE_URL` points at Supabase's
  *transaction-mode* pooler (`pooler.supabase.com:6543`, confirmed
  directly, not assumed). Persistent connections (`CONN_MAX_AGE>0`) are
  actively wrong against a transaction pooler, not just unnecessary — the
  pooler can reassign the underlying Postgres connection between queries a
  Django-level persistent connection object still thinks it owns.
- **Artifact Registry and the Cloud Build source-storage bucket both had
  unbounded growth** — every `--source` deploy leaves behind a container
  image and a source zip that nothing ever cleaned up, and neither has a
  natural cap. Fixed with a cleanup policy on the `cloud-run-source-deploy`
  repo (keep the 3 most recent image versions) and a 3-day age-based
  lifecycle policy on the `run-sources-*` bucket. **If GCP billing
  ever creeps up again, check these two first** — they're the standard
  place `--source`-based Cloud Run deploys quietly accumulate storage, and
  it's easy to reintroduce if the deploy method ever changes.
- **Sentry is wired up but inert** — `SENTRY_DSN` is not set anywhere, so
  `sentry_sdk.init()` is never called (see `config/settings.py`). Turning
  it on needs a free Sentry account and a `SENTRY_DSN` GitHub secret; no
  code change required after that.
- **Stripe is in test mode** (`sk_test_...` / `pk_test_...` keys) — no real
  money can move through this app as currently configured. Switching to
  live keys is a deliberate, separate decision, not something to do
  incidentally.

## Runbook

- **Health check**: `GET /api/health/` — checks DB connectivity, used by
  the deploy workflow's post-deploy verification step and safe to poll
  manually.
- **Logs**: `gcloud run services logs read thriftgram-backend --region
  asia-south1 --project gen-lang-client-0181120216` (or the Cloud Run
  console — Logs tab).
- **Roll back**: Cloud Run keeps prior revisions; traffic can be
  repointed to an older one from the console (Revisions tab → Manage
  Traffic) without a new deploy. Note the Artifact Registry cleanup policy
  only keeps the 3 most recent image versions — a revision older than that
  no longer has a backing image and cannot be rolled back to.
- **Supabase paused**: free-tier Supabase auto-pauses after 7 days with no
  database activity (this has happened before — see `change.ai.log`'s P1
  entry for the incident it caused). Reactivating is a manual step in the
  Supabase dashboard; there's currently no automated keepalive (a
  GitHub Actions cron ping was considered and deliberately not added —
  ask before reintroducing it if this recurs).
- **A deploy fails at the migration step**: by design, this does *not*
  crash the container — gunicorn still starts (see the Dockerfile's `CMD`),
  and the migration retries on the next cold start. Check logs for
  `MIGRATION FAILED` to confirm this is what happened rather than a
  different startup failure.
