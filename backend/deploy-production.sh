#!/bin/bash
set -e

# This script automates the deployment of the backend to Render.
# It requires the Render CLI to be installed and configured with an API key.

# Check for required environment variables
if [ -z "$RENDER_API_KEY" ]; then
  echo "Error: RENDER_API_KEY environment variable is not set."
  exit 1
fi

if [ -z "$RENDER_SERVICE_ID" ]; then
  echo "Error: RENDER_SERVICE_ID environment variable is not set."
  echo "This is the ID of the service on Render (e.g., srv-xxxxxxxxxxxx)."
  exit 1
fi

if [ -z "$PRODUCTION_BACKEND_URL" ]; then
    echo "Error: PRODUCTION_BACKEND_URL environment variable is not set."
    echo "This is the URL of the deployed backend (e.g., https://app-name.onrender.com)."
    exit 1
fi

# 1. Trigger deployment on Render
echo "🚀 Starting backend deployment on Render..."
render-cli deploy --service-id "$RENDER_SERVICE_ID"

echo "✅ Deployment triggered. Waiting for it to complete..."
# The Render CLI deploy command waits for the deployment to finish by default.

# 2. Run post-deployment verification checks
echo "🔍 Running post-deployment verification checks..."

# Health check
echo "  - Checking /api/health endpoint..."
curl --fail --silent --show-error "$PRODUCTION_BACKEND_URL/api/health"

# Services check
echo "  - Checking /api/health/services endpoint..."
curl --fail --silent --show-error "$PRODUCTION_BACKEND_URL/api/health/services"

# Cache check
echo "  - Checking /api/health/cache endpoint..."
curl --fail --silent --show-error "$PRODUCTION_BACKEND_URL/api/health/cache"

echo "🎉 Backend deployment and verification completed successfully!"
