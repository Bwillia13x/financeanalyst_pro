MVP Scope

- Market Data: real-time quote + historical candles; ticker search.
- Fundamentals: income/balance/cash-flow + key ratios.
- Valuation: basic DCF with editable assumptions; save scenarios.
- AI Insights: chat with context (ticker/scenario); robust fallback if AI key absent.
- Reports: export to PDF/CSV for company snapshot and DCF output.
- Health/Status: service health, cache stats, demo mode indicator.

End‑to‑End Workflows

- Onboarding: login/signup (simple JWT) → landing tour.
- Research Flow: search ticker → quote + chart → profile + financials.
- Valuation Flow: open DCF → adjust inputs → compute → save scenario.
- AI Flow: ask question in context of selected ticker/scenario → suggestions/actions.
- Export Flow: generate PDF report with charts, assumptions, outputs.
- Optional Alpha+: portfolio CSV import → performance + basic risk.

Backend (Targeted Tasks)

- Auth: minimal JWT sign/verify, refresh, middleware; gate save/report endpoints.
- Persistence: lightweight DB (SQLite via Prisma) for users, saved scenarios, exports, simple chat history.
- API Hardening: unify error shape, validation, pagination; adjust ticker validation (allow “-”, “.”).
- AI Endpoint: support both streaming and fallback; env‑guarded keys; rate limit per IP/user.
- Caching/Rate Limits: tune TTLs; add cache bust endpoints (dev only).
- Tests: unit tests for apiService, routes; a few integration smoke tests.

Frontend (Targeted Tasks)

- Data Wiring: use secureApiClient for quote/historical/profile/financials.
- DCF UI: assumptions form, sensitivity (1D), results with charts; persist/load scenarios.
- AI Insights: connect to /api/ai-assistant/chat, handle suggestions/actions; display context (ticker/scenario).
- Navigation: global ticker search, consistent loading/error states, route guards for protected pages.
- Exports: PDF/CSV from valuation and company snapshot.
- UX Polish: onboarding tour, skeletons/spinners, toasts; accessibility pass on core pages.

DevOps & Environments

- Env Management: .env for frontend/backend; DEMO_MODE true by default; document required keys.
- CI: lint + unit tests + build on PR (GitHub Actions); optional Playwright smoke.
- Staging: Docker for backend; Netlify/Vercel for frontend; CORS/CSR/headers set.
- Observability: Sentry DSN wiring (frontend/backend), structured logs.

Security & Compliance

- CSP/Helmet review for production; strict CORS; hide stack traces in prod.
- Secrets: never in frontend; rotate via env; audit logs sanitize PII.
- Input validation everywhere; SSRF-safe webhooks; postpone websockets/collab unless required.

Validation Plan

- Smoke: load app, search AAPL, see quote/chart, open DCF, compute, export PDF, AI query returns text.
- API: happy-path tests for quote, financials, DCF, AI fallback; cache stats reachable.
- UX/A11y: keyboard nav + axe pass on 3 core pages.
- Perf: bundle size budget; initial load < 2.5s on mid‑tier laptop; Lighthouse ≥ 80.
- Data: demo mode produces consistent deterministic outputs (seeded).

Prioritized 10‑Day Track

- Days 1–2: Auth + DB, unify error shapes; wire quote/historical/profile/financials.
- Days 3–4: DCF engine UI + save/load; exports (CSV/PDF).
- Day 5: AI chat integration with robust fallback; guard keys.
- Day 6: Health/status page; cache controls; DEMO_MODE polish.
- Day 7: Frontend polish (search/guards/loading); accessibility fixes.
- Day 8: Tests (backend unit/integration + frontend smoke).
- Day 9: CI/CD, env docs, staging deploy.
- Day 10: Hardening pass; beta checklist.

Notable Gaps/Risks Observed

- WebSocket/Webhook services are CommonJS and not wired; defer for alpha or refactor to ESM later.
- Ticker validators restrict to letters only; many tickers use “.”/“-” (e.g., BRK.B). Loosen validators.
- AI route uses fetch without import; ensure Node 18+ global fetch or polyfill; add streaming later.
- Confirm secureApiClient baseURL matches backend port and CORS allows frontend origin.

If you want, I can:

- Draft the DB schema (Prisma) and minimal auth middleware.
- Loosen ticker validators and add consistent error responses.
- Wire AIInsights to the backend chat now and stub UI state until streaming is added.
