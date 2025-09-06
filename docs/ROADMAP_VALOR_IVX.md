# Valor‑IVX Development Roadmap

This document tracks the current state, phased roadmap, and progress for Valor‑IVX. Update statuses as we ship.

## Status Legend
- [x] Completed
- [~] In Progress
- [ ] Planned / Not Started

---

## Current Status

- Platform: Solid full‑stack foundation with a production‑capable backend (`backend/app.js`, Express, security headers, rate limiting) and a feature‑rich React/Vite frontend with PWA, lazy loading, and monitoring.
- Routing + Layout: Clear IA with `src/Routes.jsx` and a composed `MainLayout` (floating actions, AI assistant, CLI, export panel).
- Design System: Mature tokenized Tailwind setup (`src/styles/tailwind.css`) with dark mode, typography, spacing, status styles, and financial domain primitives.
- Performance + Ops: Scripts for CI/CD, budgets, Lighthouse, Playwright/Cypress, Sentry hooks, and bundle analysis. Vercel config ships long‑cache assets.
- Known gaps: Lighthouse perf score ~0.54 (prior JSON), one perf report “API Health Check: FAIL” (likely local/dev harness), bundle heavy (~5.4 MB). Expect improvements via route gating, self‑hosted fonts, and chunking.

---

## Frontend Look & Feel

Strengths
- Professional, cohesive “institutional” styling; strong contrast and typography.
- Fast perceived nav via lazy routes + idle time mounts; clear top‑nav + secondary tools.
- Power‑user affordances: Command palette, persistent CLI, floating actions, keyboard shortcuts.
- PWA with install prompts, offline indicator, and dev SW hygiene.
- Accessibility scaffolding: Skip link, focus styles, labeled icon buttons.

Areas to Polish
- Header density on mobile: secondary tools compete with primary nav; apply progressive disclosure.
- Load impact from demos: many heavy demo pages are routable; gate or tree‑shake from prod.
- Fonts: remote Google fonts by default; self‑host + subset to cut CLS and blocking.
- Console noise: debug logs and env prints in `src/index.jsx`; strip in production.
- Lighthouse perf: improve FCP/LCP via resource hints, preloading, and further code‑split hot paths.
- A11y consistency: verify aria‑labels/title on all icon‑only buttons across components.

---

## Immediate Next Steps (2 weeks)

Performance Hardening
- [x] Gate demo routes with a build flag and compile-time define (tree‑shakes demos from prod).
- [x] Reduce console noise; keep warnings/errors in prod, gate logs in dev.
- [x] Replace external fonts with system/self‑host; add `@font-face` and fallbacks.
- [x] Preload critical CSS (added `public/assets/critical.css`).
- [~] Profile top paths; split oversized components (analytics dashboards, charts, BI panel).
 - [x] PWA icons generation wired; icons generated via script.

UX Polish
- [x] Tighten mobile header with a compact “More tools” flow.
- [x] Add skeleton/Suspense fallback for lazy routes; unify loading states.
- [x] Add “What’s New” modal and keyboard shortcuts help overlay.

Observability & Safety
- [x] Add performance budgets and enforce in CI (Lighthouse + budget check), local+Vercel preview.
- [~] Configure Sentry DSN in env; CSP aligned; enable when DSN available.
- [x] Wire Web Vitals (FCP/LCP/INP/CLS) to backend endpoint for dashboards.
 - [x] Accessibility CI with axe-core on key routes.

Data Health
- [x] API health smoke in CI; backend `/api/health` wait + check.
- [x] Latency tracing (per service) + `/api/health/latency` summary; p95 alert in response.
- [ ] Validate caching TTLs under load; tune as needed.

---

## 60–90 Day Roadmap

### Phase 0: Stabilization & Delivery (Weeks 1–2)
- [x] Cleanup: remove prod logs, gate demos, finalize CSP, confirm SW behavior.
- [x] Performance: ship budgets in CI; raise Lighthouse scores via easy wins.
- [~] A11y: run axe‑core sweep; address color contrast, focus traps, aria gaps. (axe workflow added)

### Phase 1: Productization & Onboarding (Weeks 3–6)
- [~] Onboarding: guided tour for “Workspace → Analysis → Report”; sample datasets; tutorial mode.
- [x] IA refinements: reduce above‑the‑fold options on mobile (compact menu).
- [ ] Reporting: finalize export templates (PDF/PPT/Excel) + templated IC memo flow.
- [ ] SEO/Meta: per‑route Helmet metadata; OG images; sitemap; basic SSR/SSG for marketing pages.

### Phase 2: Data Accuracy & Scale (Weeks 7–10)
- [ ] Providers: AV/FMP/FRED/EDGAR fallbacks + circuit breakers; provider selection policy.
- [ ] Caching: tiered TTLs + background refresh; cache keys by symbol + period.
- [ ] Validations: nightly integrity checks and anomaly detection; reconciliation dashboards.
- [ ] Rate limiting: adaptive throttling + queuing; clear UX for quota exhaustion.

### Phase 3: Collaboration & Versioning (Weeks 11–14)
- [ ] AuthZ: roles/permissions (Viewer/Analyst/Admin) and resource scoping.
- [ ] Model versioning: named versions, diffs, labels; restore; immutable published runs.
- [ ] Real‑time collab: presence, comments, optional CRDT for shared workspaces.
- [ ] Audit logging: user actions/events; exportable change history.

### Phase 4: Advanced Analytics (Weeks 15–18)
- [ ] Options/risk: Black‑Scholes, Monte Carlo, Greeks; VaR/CVaR.
- [ ] Factor models: Fama‑French, risk decomposition; scenario library and shocks.
- [ ] Calibration UI: sensitivity tables, heatmaps, multi‑scenario comparators.

### Phase 5: Billing & Entitlements (Weeks 19–20)
- [ ] Stripe integration: plans, trials, seat management, invoices.
- [ ] Feature flags/entitlements per plan; usage metering for heavy analytics.

### Phase 6: Enterprise Readiness (Weeks 21–24)
- [ ] SSO/SAML/OIDC; SCIM user provisioning; audit exports.
- [ ] Data controls: encryption at rest, retention policies, data residency options.
- [ ] Compliance prep: SOC2 Type 1 groundwork (logging, change mgmt, access reviews).

---

## Cross‑Cutting Initiatives

Quality & Testing
- [ ] E2E Playwright smoke on critical journeys; visual regression for key dashboards.
- [ ] Contract tests for data providers; snapshot tests for valuation outputs with mocks.

Observability
- [ ] SLIs: availability, API p95 latency, cache hit rate, FCP/LCP/INP; SLO targets + alerts.
- [ ] Unified dashboards (Sentry, Web Vitals, API health, cache metrics).

Security
- [ ] Dependency hygiene; tighten CSP (remove `'unsafe-eval'` in prod if possible).
- [ ] Secret handling, key rotation, DLP checks on exports.

Developer Experience
- [ ] One‑command env setup; seed data; Storybook/Playroom for components/systems.
- [ ] Clear contribution and release guidelines with canary deploys.

---

## Specific Recommendations For Valor‑IVX
- [x] Branding consistency: set app metadata to “Valor‑IVX” (index.html). Package rename pending.
- [x] Feature curation: hide demo routes in prod; expose via flag for QA.
- [~] Performance targets: commit to CWV passing on Landing, Workspace, Portfolio, Valuation. Track via CI budgets.
- [x] Data confidence: header data status chip (initial). Expand to provider status panel.
- [ ] AI assistant: scope toolset (fetch company, compute model, draft memo) and reproducibility logs per action.

---

## Success Metrics (Targets)
- UX: Task time “Run DCF → Export IC memo” < 5 minutes; NPS > 40 with pilot users.
- Performance: FCP < 1.8s, LCP < 2.5s (p75); JS shipped < 250KB on Landing and < 500KB on top workflows (post‑cache).
- Reliability: API p95 < 500ms; cache hit rate > 70% for statements.
- Data: Valuation diffs within ±3–5% of benchmark models for selected tickers.
- Business: Trial → paid conversion > 8–10% after onboarding revamp.

---

## Pointers
- Perf audits: `npm run perf:audit:local` or Vercel preview audit workflow.
- Feature flags: see `.env.example` (`VITE_ENABLE_DEMOS`, `VITE_MOBILE_SECONDARY_NAV_DRAWER`, `VITE_VERBOSE_LOGGING`).
- Fonts: add WOFF2 files to `public/fonts/` to enable self‑hosted Inter + JetBrains Mono.
