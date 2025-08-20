# Monitoring & Analytics Setup

This document summarizes how Sentry, Google Analytics (gtag), and Hotjar are integrated into FinanceAnalyst Pro, including environment flags, CSP, initialization points, and staging test instructions.

## Components & Files
- `src/utils/monitoring.js` — Centralized MonitoringService (Sentry, GA, Hotjar, performance, global error handlers).
- `src/index.jsx` — Side-effect import of `./utils/monitoring` to initialize monitoring on app startup.
- `src/Routes.jsx` — `RouteChangeTracker` triggers SPA pageviews via `monitoring.trackPageView()` on route changes.
- `src/components/ErrorBoundary.jsx` — Reports caught errors via `monitoring.trackError()`.
- `public/_headers` — Netlify headers with CSP for Sentry/GA/Hotjar (incl. Hotjar WebSocket).
- `src/utils/securityHeaders.js` — Dynamic CSP builder aligned with monitoring domains.
- `src/components/MonitoringDebugPanel.jsx` — Route `/monitoring-debug` for staging validation.

## Environment Variables
Set these in your deployment provider (do not commit secrets):
- `VITE_APP_ENV`: `staging` or `production`
- `VITE_APP_VERSION`: build/version string
- `VITE_ENABLE_ANALYTICS`: `true|false`
- `VITE_ENABLE_ERROR_REPORTING`: `true|false`
- `VITE_PERFORMANCE_MONITORING`: `true|false`
- `VITE_SENTRY_DSN`: Sentry DSN (project-specific)
- `VITE_GA_TRACKING_ID`: GA measurement ID (e.g., `G-XXXXXXX`)
- `VITE_HOTJAR_ID`: Hotjar site ID
- `VITE_ENABLE_DEBUG_MODE`: when `true`, exposes `/monitoring-debug` even in production

Staging/production templates: `.env.staging`, `.env.production`.

## Initialization Points
- `src/index.jsx`: `import './utils/monitoring'` triggers `MonitoringService` constructor.
- `src/Routes.jsx`: `RouteChangeTracker` calls `monitoring.trackPageView(path)` on route changes.
- `src/components/ErrorBoundary.jsx`: `componentDidCatch()` calls `monitoring.trackError(...)`.

## Content Security Policy (CSP)
Netlify headers at `public/_headers` and built file at `dist/_headers` include:
- script-src: `https://www.googletagmanager.com`, `https://static.hotjar.com`
- connect-src: `https://www.google-analytics.com`, `https://www.googletagmanager.com`, `https://script.hotjar.com`, `https://in.hotjar.com`, `https://api.hotjar.com`, `https://*.sentry.io`, `https://*.ingest.sentry.io`, `wss://*.hotjar.com`
- Fonts/Styles: Google Fonts domains allowed

Additionally, `src/utils/securityHeaders.js` mirrors these domains for in-app CSP generation/validation.

## Staging Test Instructions
1) Pageview tracking (GA + Hotjar)
   - Navigate across routes; GA hits should appear to `https://www.google-analytics.com/collect`.
   - Hotjar should open a WebSocket to `wss://*.hotjar.com` and send events to `https://in.hotjar.com`.
   - Visit `/monitoring-debug` and use buttons to trigger pageviews and SPA navigations.
     - Route availability: visible in non-`production` `VITE_APP_ENV`; in `production`, set `VITE_ENABLE_DEBUG_MODE=true` to expose.

2) Error reporting (Sentry)
   - In `/monitoring-debug`, use "Capture Sentry error" for a non-crashing event.
   - Use "Crash component" to trigger `ErrorBoundary` and verify captured exceptions in Sentry.

3) Feature flags verification
   - Toggle `VITE_ENABLE_ANALYTICS` or `VITE_ENABLE_ERROR_REPORTING` in staging and redeploy.
   - Confirm GA/Hotjar and Sentry respectively enable/disable.

## Deployment Notes
- Ensure IDs/DSNs are set in the host environment (Netlify) for staging and production.
- After editing `public/_headers`, run a production build to update `dist/_headers`.
- Respect user privacy and applicable regulations. Consider cookie consent before enabling analytics in production (`VITE_COOKIE_CONSENT_ENABLED`).

## Quick Links
- Debug Route: `/monitoring-debug`
- Router: `src/Routes.jsx`
- Monitoring: `src/utils/monitoring.js`
- Error Boundary: `src/components/ErrorBoundary.jsx`
- CSP Headers: `public/_headers` (build outputs to `dist/_headers`)
