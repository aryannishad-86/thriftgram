#!/usr/bin/env bash
# Deploy ThriftGram Backend to Cloud Run

echo "Starting deployment to GCP Cloud Run..."

# Ensure we are logged in and correct project is set
gcloud config set project gen-lang-client-0181120216

# Create env.yaml from .env to handle commas properly
echo "Generating env.yaml..."
./venv/bin/python -c '
import os
from dotenv import dotenv_values
import json
env_vars = dotenv_values(".env")
env_vars["ALLOWED_HOSTS"] = "*"
with open("env.yaml", "w") as f:
    for k, v in env_vars.items():
        if v is not None:
            # Format value as a JSON string to ensure valid YAML scalar
            f.write(f"{k}: {json.dumps(v)}\n")
'

# Deploy command
echo "Deploying container to Cloud Run (asia-south1)..."
gcloud run deploy thriftgram-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml \
  --min-instances 0 \
  --max-instances 3 \
  --port 8080 \
  --quiet

rm env.yaml
echo "Deployment complete!"

