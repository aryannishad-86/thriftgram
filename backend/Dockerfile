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
# exec gunicorn so it receives signals directly.
CMD python manage.py migrate --noinput && exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 config.wsgi:application
