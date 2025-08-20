codex
Here’s a focused audit of features, endpoints,
and configs that are present in the codebase
but not fully wired for local development.
I’ve grouped items by severity and provided
precise file references and concrete next
steps.

• Unwired API Client Usage

- secureApiClient generics: Several
components call secureApiClient.get(...)
and secureApiClient.post(...), but the class
in src/services/secureApiClient.js does
not expose generic get/post/put/delete. It
only exposes typed methods like getQuote/
getHistoricalData/... and some “compatibility”
methods. Affected examples:
    - src/components/AIAssistant/
AIFinancialAssistant.jsx line ~77:
secureApiClient.post('/ai-assistant/
chat', ...) → post is undefined.
    - src/pages/AdvancedCharting.jsx lines
~113, ~145, ~166: secureApiClient.get(...)
used multiple times.
    - src/services/productionDataSources.js
lines ~245, ~263: secureApiClient.get(...)
used.
- Path duplication under /api: Because
secureApiClient.baseURL already includes '/
api' (default http://localhost:3001/api),
passing paths that start with '/api/...'
produces double '/api' (e.g., http://
localhost:3001/api/api/market-data/...),
breaking calls.
    - src/services/productionDataSources.js:
secureApiClient.get(/api/market-data/
yahoo/...) will yield /api/api/... and route
is not implemented anyway (see below).
- Yahoo subroutes not implemented: Code
references endpoints like /market-data/yahoo/
quote and /market-data/yahoo/historical, but
backend only provides:
    - /api/market-data/quote/:symbol
    - /api/market-data/historical/:symbol?
range&interval
    - /api/market-data/intraday/:symbol
    - /api/market-data/batch
No “yahoo” segment exists in backend routes.
Affected:
    - src/services/productionDataSources.js
lines ~241–271.

Recommended fix:

- Add generic methods to secureApiClient.js
that delegate to this.client (axios), e.g.
get(url, config), post(url, data, config),
etc.
- Replace any '/api/...' path strings passed
to secureApiClient with paths relative to the
API root (e.g., '/market-data/quote/...').
- Replace references to nonexistent “yahoo”
prefixed routes with the implemented
ones (e.g., '/market-data/quote/:symbol',
'/market-data/historical/:symbol?
range=...&interval=...') and adjust query
param names as noted below.

• Backend/Frontend Parameter Mismatches

- Historical query param mismatch: Backend
expects 'range' (and 'interval') for /api/
market-data/historical/:symbol (see backend/
routes/marketData.js). Frontend calls use
'period' param in places.
    - src/pages/AdvancedCharting.jsx: uses
'?period=${selectedTimeframe}' instead of
'?range=...'.

Recommended fix:

- Update callers to send 'range' (and
'interval' where applicable) to match backend.

• Authentication Routes Missing (but
referenced)

- Frontend references /api/auth/login, /api/
auth/logout, and /api/auth/refresh:
    - src/services/authenticationService.js:
login/logout/refresh endpoints used.
- Backend has no /api/auth routes implemented.

Impact:

- In development, authenticateWithServer()
short-circuits on process.env.NODE_ENV ===
'development' and returns a mock auth result,
so “login” can appear to work but refresh/
logout calls still try these endpoints and
will fail or warn.
- Session expiry/refresh flows will clear
session on failure due to missing backend
endpoints.

Recommended options:

- Short-term: Gate refresh/logout network
calls under the same dev guard or no-op in dev
to avoid noisy failures.
- Medium-term: Implement minimal auth routes
in backend (login/logout/refresh with mock
tokens) so flows can be exercised locally.

• Error Reporting Endpoint Missing (but
referenced)

- Frontend posts to '/api/errors' from
multiple places:
    - src/components/ErrorBoundary/
ProductionErrorBoundary.jsx
    - src/components/ErrorBoundary/
ErrorBoundaryProvider.jsx
    - src/components/ui/ErrorBoundary.jsx
    - src/services/productionMonitoring.js
(sendToEndpoint('/api/errors', ...))
- Backend has no '/api/errors' route.

Recommended fix:

- Add a simple POST /api/errors route that
receives and logs error payloads (and 200s).
This enables local and staging testing of
error reporting.

• Monitoring/Env Vars Not Documented

- EnhancedErrorBoundary uses
import.meta.env.VITE_MONITORING_ENDPOINT and
optionally VITE_SUPPORT_EMAIL:
    - src/components/EnhancedErrorBoundary.jsx
- These are not present in .env.example.

Recommended fix:

- Add optional entries to .env.example:
    - VITE_MONITORING_ENDPOINT=
    - VITE_SUPPORT_EMAIL=
- Also note: MonitoringDebugPanel and
monitoring utils rely on flags and IDs already
present in .env.example; that part is fine.

• Collaboration Defaults Not Ideal For Local

- CollaborationService tries to initialize a
real WebSocket unless VITE_COLLAB_WS_MOCK is
'true'. Current .env.example:
    - VITE_ENABLE_COLLABORATION=true
    - VITE_COLLAB_WS_MOCK=false
- PrivateAnalysis.jsx uses useCollaboration()
which will initialize collaboration. With
collaboration enabled and mock disabled, it
attempts real WS at ws(s):///collaboration
(no server present), likely causing connection
errors.

Recommended fix:

- For local development, set VITE_COLLAB_WS_MOCK=true in .env (or default to false for VITE_ENABLE_COLLABORATION).
- Alternatively, set VITE_ENABLE_COLLABORATION=false by default in .env.example to avoid any WS attempts unless
explicitly enabled.

• CORS Origin Mismatch Blocks Local Development

- Backend CORS origin is FRONTEND_URL or default 'http://localhost:3000' (backend/.env):
    - backend/.env: FRONTEND_URL=http://localhost:3000
- Vite dev server configured to 5173 (vite.config.mjs), and frontend runs there by default.
- Result: CORS failures when frontend calls the backend at http://localhost:3001.

Recommended fix:

- Update backend/.env to FRONTEND_URL=http://localhost:5173 for local dev; or run Vite on 3000 by adjusting Vite
config.

• Dead/Unused or Duplicate Services

- authenticationService.js appears unused (no imports anywhere). Meanwhile, authService.js is actually used by
components and examples.
    - authenticationService.js offers more “production” behaviors but is not wired.
- advancedAnalyticsService.ts (and .js) not referenced by any page/component. The AdvancedAnalytics page uses UI
components that do their own logic.

Recommendation:

- Remove or clearly mark unused services to avoid confusion, or wire them into the relevant pages if intended (e.g.,
integrate advancedAnalyticsService into AdvancedAnalytics UI).


- External direct fetches in productionDataSources.js use frontend env vars VITE_ALPHA_VANTAGE_API_KEY, etc. That
contradicts the “all API calls via secure backend proxy” posture. These are noted as fallbacks but could leak calls:
    - src/services/productionDataSources.js: _fetchAlphaVantage..., _fetchIEX..., _fetchFinnhub...
- SEO Base URL hardcoded:
    - src/components/SEO/SEOHead.jsx uses const siteUrl = 'https://valor-ivx.com'; ensure this is intentional for
local/staging or make configurable.

Recommended fix:

- Consider gating direct external fetches behind demo mode or remove them, favoring secureApiClient exclusively.
- Make SEO base URL configurable via env if needed.

What to change to enable smooth local testing

- Add secureApiClient generics and unify paths:
    - Implement get/post/put/delete on src/services/secureApiClient.js to delegate to axios instance.
    - Replace any '/api/...' paths passed to secureApiClient with '/...' under the API root (e.g., '/market-data/
quote/AAPL').
    - Remove “yahoo” segment from client URLs and align to backend routes.
- Align query params:
    - Use 'range' not 'period' for historical market-data calls.
- Provide minimal error-reporting route in backend:
    - POST /api/errors that accepts and logs JSON.
- Address auth wiring:
    - Add mock /api/auth/login, /api/auth/logout, /api/auth/refresh in backend; or in dev, avoid these calls.
- Fix CORS:
    - Set backend/.env FRONTEND_URL=http://localhost:5173 (or adjust Vite to 3000).
- Update .env.example:
    - Add VITE_MONITORING_ENDPOINT and VITE_SUPPORT_EMAIL (optional), and set collaboration defaults that won’t
attempt WS in local by default.
- Clean up unused services (optional but helpful):
    - Either remove or clearly annotate src/services/authenticationService.js and advancedAnalyticsService.* if not
used.

Quick verification checklist after changes

- Start backend: from backend/, run npm start and confirm:
    - GET http://localhost:3001/api/health returns healthy.
    - GET /api/market-data/quote/AAPL works.
    - GET /api/market-data/historical/AAPL?range=1mo works.
- Start frontend: npm start and confirm:
    - AI Assistant opens and chat POST /api/ai-assistant/chat succeeds (or returns fallback if no AI key).
    - AdvancedCharting loads quotes and historical data without CORS errors.
    - Visiting /private-analysis does not trigger WS errors (collab mock off or disabled).
    - No 404s for /api/errors when error boundaries send reports (after adding route).

If you want, I can:

- Patch secureApiClient to add generic HTTP methods and fix the handful of misrouted calls.
- Add a minimal /api/errors endpoint in backend.
- Adjust the example env files for the local defaults above.
- Hunt and refactor the specific callers using wrong params or paths (AdvancedCharting, productionDataSources).
