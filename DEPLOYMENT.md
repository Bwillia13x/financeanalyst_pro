# Deployment Guide

This guide covers deployment options for FinanceAnalyst Pro across different platforms and environments.

## 🚀 Quick Deploy

### Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
npm run deploy:netlify

# Or deploy manually
netlify deploy --prod --dir dist
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run deploy:vercel

# Or deploy manually
vercel --prod
```

### GitHub Pages
```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
npm run deploy:gh-pages
```

## 🛠️ Build Commands

### Production Build
```bash
npm run build:prod
```

### Staging Build
```bash
npm run build:staging
```

### Development Preview
```bash
npm run build:preview
```

## 📊 Performance Monitoring

### Bundle Analysis
```bash
npm run build:analyze
```

### Size Check
```bash
npm run size-check
```

### Performance Audit
```bash
npm run perf-check
```

## 🔧 Environment Variables

### Required Variables
```bash
# API Configuration
VITE_API_BASE_URL=https://api.financeanalyst.pro
VITE_AI_API_ENDPOINT=https://api.openai.com/v1

# Analytics
VITE_GA_TRACKING_ID=your-ga-id
VITE_HOTJAR_ID=your-hotjar-id

# Security
VITE_SENTRY_DSN=your-sentry-dsn
```

### Environment-Specific Configs
- `.env.production` - Production environment
- `.env.staging` - Staging environment
- `.env.development` - Development environment

## 🌐 Platform-Specific Configurations

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build:prod"

[build.environment]
  NODE_VERSION = "20.19.0"
  NPM_FLAGS = "--prefer-offline"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## 🔐 Security Headers

### Automatic Security Headers
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Comprehensive CSP policy

### Content Security Policy
Configured to allow:
- Self-hosted scripts and styles
- Google Analytics and Tag Manager
- Financial data APIs
- Hotjar analytics
- Sentry error tracking

## 📈 Performance Optimization

### Bundle Splitting
- Automatic code splitting by route
- Vendor chunk separation
- Dynamic imports for heavy components

### Caching Strategy
- Static assets: 1 year cache
- API responses: Intelligent caching
- Service worker for offline support

### Compression
- Gzip compression enabled
- Brotli compression support
- Image optimization

## 🧪 Testing in Production

### Pre-deployment Checks
```bash
# Run full test suite
npm run ci:build

# Performance audit
npm run perf:audit

# Bundle size check
npm run budget:check
```

### Post-deployment Verification
- [ ] Application loads correctly
- [ ] All features functional
- [ ] Performance metrics acceptable
- [ ] Error tracking working
- [ ] Analytics tracking active

## 📱 PWA Deployment

### Service Worker
- Automatic registration
- Cache management
- Background sync
- Push notifications (optional)

### Offline Support
- Critical resources cached
- Offline fallback pages
- Data synchronization
- Graceful degradation

## 🔍 Monitoring & Analytics

### Error Tracking
- Sentry integration
- Real-time error monitoring
- Performance issue detection
- User feedback collection

### Analytics
- Google Analytics 4
- Hotjar user recordings
- Custom event tracking
- Performance metrics monitoring

## 🚦 CI/CD Pipeline

### GitHub Actions Workflow
- Automated testing on PR
- Production deployment on merge
- Staging deployment for feature branches
- Performance regression detection

### Quality Gates
- Lint check (ESLint)
- Test coverage (>80%)
- Bundle size limits
- Lighthouse score (>90)

## 🌍 Multi-Environment Support

### Production Environment
- Optimized builds
- Error tracking enabled
- Analytics active
- Full PWA features

### Staging Environment
- Development builds
- Debug logging enabled
- Test data sources
- Feature flags for testing

### Development Environment
- Hot module replacement
- Debug tools enabled
- Local API mocking
- Fast refresh

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean:install
npm run build:prod
```

#### Performance Issues
```bash
# Analyze bundle
npm run build:analyze

# Check bundle size
npm run budget:check
```

#### Deployment Failures
```bash
# Check build logs
npm run build:prod 2>&1 | tee build.log

# Verify environment variables
printenv | grep VITE_
```

## 📞 Support

For deployment issues:
- Check build logs
- Verify environment variables
- Test locally with `npm run build:preview`
- Review platform-specific documentation

## 🔄 Rollback Strategy

### Emergency Rollback
```bash
# Netlify
netlify deploys:list
netlify rollback [deploy-id]

# Vercel
vercel rollback [deployment-url]

# GitHub Pages
git revert HEAD~1
npm run deploy:gh-pages
```

### Gradual Rollback
1. Deploy to staging first
2. Test critical functionality
3. Monitor error rates
4. Roll back if issues detected
