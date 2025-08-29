# Environment Setup Guide

This guide covers the required environment variables and setup instructions for Finance Analyst Pro.

## Required Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-token-secret-different-from-jwt-secret"

# AI Integration (Optional - falls back to demo mode if not provided)
AI_API_KEY="your-openai-api-key"
AI_API_ENDPOINT="https://api.openai.com/v1"

# Rate Limiting
RATE_LIMIT_REQUESTS="100"
AI_RATE_LIMIT="10"

# Demo Mode (recommended for development)
DEMO_MODE="true"

# CORS Configuration
FRONTEND_URL="http://localhost:5173"

# Admin Features
ADMIN_KEY="your-admin-key-for-cache-clearing"

# Port Configuration
PORT="3001"

# Environment
NODE_ENV="development"
```

### Frontend (.env)

Create a `.env` file in the root directory with:

```bash
# API Configuration
VITE_API_BASE_URL="http://localhost:3001/api"

# Environment
VITE_APP_ENV="development"
VITE_DEMO_MODE="true"

# Debug Features
VITE_ENABLE_DEBUG_MODE="true"

# Performance Monitoring (Optional)
VITE_SENTRY_DSN="your-sentry-dsn-for-error-tracking"
```

## Environment Variable Descriptions

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Prisma database connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Secret key for refresh tokens |
| `AI_API_KEY` | No | - | OpenAI API key for AI assistant features |
| `AI_API_ENDPOINT` | No | OpenAI | AI service endpoint URL |
| `DEMO_MODE` | No | `true` | Enable demo mode with fallback data |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for CORS configuration |
| `ADMIN_KEY` | No | - | Admin key for protected endpoints |
| `RATE_LIMIT_REQUESTS` | No | `100` | General API rate limit per window |
| `AI_RATE_LIMIT` | No | `10` | AI endpoint rate limit per window |
| `PORT` | No | `3001` | Backend server port |
| `NODE_ENV` | No | `development` | Node environment |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL |
| `VITE_APP_ENV` | No | `development` | Application environment |
| `VITE_DEMO_MODE` | No | `false` | Enable demo mode features |
| `VITE_ENABLE_DEBUG_MODE` | No | `false` | Enable debug panels and tools |
| `VITE_SENTRY_DSN` | No | - | Sentry error tracking DSN |

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate JWT secrets**
   ```bash
   # Generate strong secrets (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # (Optional) Seed database with demo data
   npx prisma db seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Backend will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to project root**
   ```bash
   cd ..  # if in backend directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Frontend will be available at `http://localhost:5173`

## Development Workflow

### Starting the Full Stack

1. **Terminal 1 - Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 - Frontend**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api
   - API Health: http://localhost:3001/api/health

### Demo Mode

Demo mode is enabled by default and provides:
- Fallback authentication (demo@financeanalyst.pro / any password)
- Mock AI responses when API keys are not configured
- Deterministic data for consistent testing
- No external API dependencies

To disable demo mode, set `DEMO_MODE="false"` in backend `.env`.

## Production Configuration

### Backend Production Variables

```bash
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"
AI_API_KEY="your-production-openai-key"
DEMO_MODE="false"
FRONTEND_URL="https://your-frontend-domain.com"
ADMIN_KEY="your-production-admin-key"
```

### Frontend Production Variables

```bash
VITE_API_BASE_URL="https://your-backend-domain.com/api"
VITE_APP_ENV="production"
VITE_DEMO_MODE="false"
VITE_ENABLE_DEBUG_MODE="false"
VITE_SENTRY_DSN="your-production-sentry-dsn"
```

### Production Security

- Use strong, unique secrets (32+ characters)
- Set `DEMO_MODE="false"` in production
- Configure proper CORS origins
- Enable HTTPS for all environments
- Use environment-specific database URLs
- Never commit secrets to version control

## Testing Configuration

### Test Environment Variables

Create `.env.test` files for consistent test environments:

**Backend `.env.test`**
```bash
DATABASE_URL="file:./prisma/test.db"
JWT_SECRET="test-jwt-secret-minimum-32-characters-long"
JWT_REFRESH_SECRET="test-refresh-secret-different-from-jwt"
DEMO_MODE="true"
NODE_ENV="test"
```

**Frontend `.env.test`**
```bash
VITE_API_BASE_URL="http://localhost:3001/api"
VITE_APP_ENV="test"
VITE_DEMO_MODE="true"
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm run test

# Integration tests
npm run test:integration

# All tests
npm run test:all
```

## Troubleshooting

### Common Issues

**Backend won't start**
- Check if port 3001 is available
- Verify database connection in DATABASE_URL
- Ensure JWT_SECRET is at least 32 characters

**Frontend can't connect to backend**
- Verify VITE_API_BASE_URL matches backend port
- Check CORS configuration in backend
- Ensure backend is running before starting frontend

**Authentication issues**
- Verify JWT secrets are properly set
- Check token expiration times
- Clear localStorage and try again

**Database errors**
- Run `npx prisma generate` to update client
- Run `npx prisma migrate dev` to apply schema changes
- Check DATABASE_URL format and permissions

**AI features not working**
- Verify AI_API_KEY is set correctly
- Check AI service endpoint accessibility
- Enable DEMO_MODE for fallback responses

### Debug Mode

Enable debug mode for additional logging:

```bash
# Backend
DEBUG="finance-analyst:*" npm run dev

# Frontend
VITE_ENABLE_DEBUG_MODE="true" npm run dev
```

## Support

For additional help:
1. Check the logs in both backend and frontend consoles
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check the API health endpoint: http://localhost:3001/api/health
