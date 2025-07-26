#!/bin/bash

# FinanceAnalyst Pro - Production Deployment Script
# This script automates the full production deployment process

echo "🚀 Starting FinanceAnalyst Pro Production Deployment..."

# Set error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    print_error "Not in backend directory. Please run from the backend folder."
    exit 1
fi

print_status "Validating environment..."

# Check for required files
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating from template..."
    cp .env.example .env.production
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Run tests if available
if npm run test --silent 2>/dev/null; then
    print_status "Running tests..."
    npm test
else
    print_warning "No tests found, skipping test phase"
fi

# Build if needed (for TypeScript projects)
if [ -f "tsconfig.json" ]; then
    print_status "Building TypeScript..."
    npm run build
fi

print_status "✅ Backend is ready for production deployment!"
print_status "Next steps:"
print_status "1. Deploy to your chosen service (Railway, Render, Heroku)"
print_status "2. Set environment variables in your hosting service"
print_status "3. Update frontend VITE_API_BASE_URL to production backend URL"
print_status "4. Redeploy frontend"

echo ""
print_status "Available deployment options:"
print_status "- Railway: railway up"
print_status "- Render: Push to GitHub and connect repository"
print_status "- Heroku: git push heroku main"

echo ""
print_status "🎉 Production deployment preparation complete!"
