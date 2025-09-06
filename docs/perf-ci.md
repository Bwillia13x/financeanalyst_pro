# Performance Audit in CI (Valor-IVX)

This project enforces performance budgets using Lighthouse in CI.

## Commands

- `npm run perf:audit` — Builds for production, runs Lighthouse, and validates against `performance-budgets.json` via `scripts/budget-check.js`.

## Typical CI Job (pseudo-YAML)

1. Build preview (or start a local preview):
   - `npm ci`
   - `npm run build:prod`
   - `npm run preview &` (serve at http://localhost:4173)
2. Run Lighthouse and budgets:
   - `npm run perf:audit`

If you deploy a preview to Vercel first, point Lighthouse to the preview URL instead and pass the output path to `budget-check.js`.

## Budgets

Defined in `performance-budgets.json`. Production budgets are strict; development and staging use multipliers. Error severity fails the job; warning severity logs a warning.

Metrics enforced:
- Score target (>= 90 prod, >= 70 dev)
- FCP, LCP, CLS (Core Web Vitals proxies)

## Notes
- Demos are gated by `VITE_ENABLE_DEMOS` and excluded in prod by default.
- Avoid extraneous console logs in production; they’re stripped or gated by `VITE_VERBOSE_LOGGING`.
- Prefer preview audits to test realistic caching and CDN.

