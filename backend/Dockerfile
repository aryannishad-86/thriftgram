# Use the official lightweight Python image
# https://hub.docker.com/_/python
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Collect static files (needs a dummy SECRET_KEY if settings require it during collectstatic)
RUN SECRET_KEY="dummy-for-collectstatic" python manage.py collectstatic --no-input

# Run the web service on container startup.
# Cloud Run sets the PORT environment variable (default 8080).
# Apply migrations first (idempotent — a no-op when the DB is current), then
# ensure the DatabaseCache table exists (createcachetable is idempotent too —
# verified it just prints "already exists" and exits 0 on a re-run rather
# than erroring), then exec gunicorn so it receives signals directly.
#
# Deliberately `;` not `&&` throughout: a migrate/cache-table failure (e.g.
# the DB is temporarily unreachable — Supabase free tier auto-pauses on
# inactivity) must not stop gunicorn from starting. Losing the whole
# container over a transient DB hiccup took down every endpoint, including
# /api/health/, during a real incident. Both steps retry on every future
# cold start regardless.
CMD python manage.py migrate --noinput || echo "MIGRATION FAILED — starting anyway, will retry on next boot"; python manage.py createcachetable || echo "CACHE TABLE SETUP FAILED — starting anyway, will retry on next boot"; exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 config.wsgi:application
