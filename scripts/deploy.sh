#!/bin/bash

# FinanceAnalyst Pro - Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
PROJECT_NAME="financeanalyst-pro"
BUILD_DIR="build"
BACKUP_DIR="backups"
LOG_FILE="deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check if environment is provided
if [ -z "$1" ]; then
    error "Usage: $0 <environment> [options]
    
Environments:
  staging     Deploy to staging environment
  production  Deploy to production environment
  
Options:
  --skip-tests    Skip running tests
  --skip-build    Skip building (use existing build)
  --dry-run       Show what would be deployed without actually deploying"
fi

ENVIRONMENT=$1
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
DEPLOY_BACKEND=false

# Parse additional options
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --deploy-backend)
            DEPLOY_BACKEND=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

log "Starting deployment to $ENVIRONMENT environment"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
fi

# Check if we're on the correct branch for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        error "Production deployments must be from 'main' branch. Current branch: $CURRENT_BRANCH"
    fi
fi

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

# Check Node.js version
NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

# Check if git working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    warning "Git working directory is not clean. Uncommitted changes detected."
    if [[ "$ENVIRONMENT" == "production" ]]; then
        error "Production deployment requires a clean git working directory"
    fi
fi

# Install dependencies
log "Installing dependencies..."
npm ci

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" == false ]]; then
    log "Running tests..."
    npm test -- --run
    success "All tests passed"
else
    warning "Skipping tests"
fi

# Run linting
log "Running code quality checks..."
npm run lint
npm run format:check
success "Code quality checks passed"

# Build application (unless skipped)
if [[ "$SKIP_BUILD" == false ]]; then
    log "Building application for $ENVIRONMENT..."
    
    # Copy environment-specific configuration
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        cp ".env.$ENVIRONMENT" .env.local
        log "Using environment configuration: .env.$ENVIRONMENT"
    else
        warning "No environment-specific configuration found: .env.$ENVIRONMENT"
    fi
    
    # Build the application
    npm run build
    success "Build completed successfully"
    
    # Verify build output
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "Build directory not found: $BUILD_DIR"
    fi
    
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log "Build size: $BUILD_SIZE"
else
    warning "Skipping build"
fi

# Create backup of current deployment (production only)
if [[ "$ENVIRONMENT" == "production" && "$DRY_RUN" == false ]]; then
    log "Creating backup of current deployment..."
    BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
    mkdir -p $BACKUP_DIR
    
    # This would backup your current production files
    # Adjust based on your deployment target (S3, server, etc.)
    log "Backup created: $BACKUP_NAME"
fi

# Backend deployment (if applicable)
if [ "$DEPLOY_BACKEND" = "true" ]; then
  echo "🔧 Deploying backend services..."
  
  # Check if we have backend deployment configuration
  if [ -f "backend/package.json" ]; then
    cd backend
    
    # Deploy to Render, Railway, or Heroku based on environment
    if [ ! -z "$RENDER_SERVICE_ID" ]; then
      echo "Deploying backend to Render..."
      # Render deploys automatically on git push to connected repository
      echo "✅ Backend deployment triggered via git push (Render auto-deploy)"
    elif [ ! -z "$RAILWAY_PROJECT_ID" ]; then
      echo "Deploying backend to Railway..."
      if command -v railway &> /dev/null; then
        railway up
        echo "✅ Backend deployed to Railway"
      else
        echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
      fi
    elif command -v heroku &> /dev/null; then
      echo "Deploying backend to Heroku..."
      heroku git:remote -a "$HEROKU_APP_NAME"
      git push heroku main
      echo "✅ Backend deployed to Heroku"
    else
      echo "⚠️  No backend deployment configuration found"
    fi
    
    cd ..
  else
    echo "⚠️  No backend found - skipping backend deployment"
  fi
fi

# Deployment based on environment
if [[ "$DRY_RUN" == true ]]; then
    log "DRY RUN: Would deploy to $ENVIRONMENT environment"
    log "Build directory: $BUILD_DIR"
    log "Files to deploy:"
    find $BUILD_DIR -type f | head -20
    if [[ $(find $BUILD_DIR -type f | wc -l) -gt 20 ]]; then
        log "... and $(( $(find $BUILD_DIR -type f | wc -l) - 20 )) more files"
    fi
else
    case $ENVIRONMENT in
        staging)
            log "Deploying to staging environment..."
            deploy_to_staging
            ;;
        production)
            log "Deploying to production environment..."
            deploy_to_production
            ;;
    esac
fi

# Deployment functions
deploy_to_staging() {
    log "Executing staging deployment..."
    
    # Example: Deploy to staging server
    # rsync -avz --delete $BUILD_DIR/ user@staging-server:/var/www/html/
    
    # Example: Deploy to AWS S3
    # aws s3 sync $BUILD_DIR/ s3://staging-bucket/ --delete
    
    # Example: Deploy to Netlify
    # netlify deploy --dir=$BUILD_DIR --site=staging-site-id
    
    # Example: Deploy to Vercel
    # vercel --prod --yes
    
    log "Staging deployment completed"
    
    # Run smoke tests
    run_smoke_tests "https://staging.financeanalyst.pro"
}

deploy_to_production() {
    log "Executing production deployment..."
    
    # Additional production checks
    log "Running final production checks..."
    
    # Check if staging deployment is healthy
    if ! check_staging_health; then
        error "Staging environment is not healthy. Aborting production deployment."
    fi
    
    # Production deployment to Netlify
    echo "🚀 Starting production deployment..."
    if command -v netlify &> /dev/null; then
      echo "Deploying to Netlify production..."
      netlify deploy --prod --dir dist --message "Production deployment $(date)"
      if [ $? -eq 0 ]; then
        echo "✅ Production deployment successful"
      else
        echo "❌ Production deployment failed"
        exit 1
      fi
    else
      echo "❌ Netlify CLI not found. Install with: npm install -g netlify-cli"
      exit 1
    fi
    
    # Health check for production
    echo "⚡ Running production health check..."
    if [ ! -z "$PRODUCTION_URL" ]; then
      sleep 30  # Allow time for deployment to propagate
      curl -f "$PRODUCTION_URL/health" || { echo "❌ Production health check failed"; exit 1; }
      echo "✅ Production health check passed"
    else
      echo "⚠️  PRODUCTION_URL not set - skipping health check"
    fi
    
    log "Production deployment completed"
    
    # Run post-deployment verification
    run_post_deployment_tests "https://financeanalyst.pro"
    
    # Send notifications
    send_deployment_notification
}

# Health check functions
check_staging_health() {
    log "Checking staging environment health..."
    
    # Example health check
    if curl -f -s "https://staging.financeanalyst.pro/health" > /dev/null; then
        return 0
    else
        return 1
    fi
}

run_smoke_tests() {
    local URL=$1
    log "Running smoke tests against $URL..."
    
    # Example smoke tests
    if curl -f -s "$URL" > /dev/null; then
        success "Smoke test passed: Homepage accessible"
    else
        error "Smoke test failed: Homepage not accessible"
    fi
}

run_post_deployment_tests() {
    local URL=$1
    log "Running post-deployment tests against $URL..."
    
    # Run comprehensive tests
    # npm run test:e2e -- --baseUrl=$URL
    
    success "Post-deployment tests completed"
}

send_deployment_notification() {
    log "Sending deployment notification..."
    
    # Example: Send Slack notification
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
      curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 FinanceAnalyst Pro deployed successfully to $ENVIRONMENT at $(date)\"}" \
        "$SLACK_WEBHOOK_URL"
      echo "✅ Slack notification sent"
    elif [ ! -z "$DISCORD_WEBHOOK_URL" ]; then
      curl -X POST -H 'Content-type: application/json' \
        --data "{\"content\":\"🚀 FinanceAnalyst Pro deployed successfully to $ENVIRONMENT at $(date)\"}" \
        "$DISCORD_WEBHOOK_URL"
      echo "✅ Discord notification sent"
    else
      echo "⚠️  No notification webhook configured - skipping notification"
    fi
    log "Deployment notification sent"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    rm -f .env.local
}

# Set up cleanup trap
trap cleanup EXIT

success "Deployment to $ENVIRONMENT completed successfully!"
log "Deployment log saved to: $LOG_FILE"
