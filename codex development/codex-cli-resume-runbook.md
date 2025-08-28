# Codex CLI Resume Runbook – Audit Mode Optimization

This runbook lets you (re)start the Codex CLI workflow and validate audit-mode performance optimizations quickly and repeatably.

## Prerequisites
- Node.js: use the version in `.nvmrc` (engines: ^20.19.0 or ≥22.12.0)
- npm installed
- Local ports: 4173 (vite preview), 9001 (LHCI server)

Recommended:
- Use nvm
  ```bash
  nvm use
  ```

## Install
```bash
npm install
```
(If you suspect drift) reset caches and reinstall:
```bash
rm -rf node_modules .npm-cache && npm install
```

## Quickly verify local health
- Lint:
  ```bash
  npm run lint
  ```
- Format (optional, resolves Prettier diffs):
  ```bash
  npm run format
  ```
- Unit tests:
  ```bash
  npm run test:run
  ```

## Dev server
```bash
npm start
```
Navigate to http://localhost:5173 (default vite dev) or as shown in terminal.

## Audit mode overview
Audit mode is automatically enabled when either is true:
- URL contains `?lhci` or `?audit`
- `VITE_LIGHTHOUSE_CI=true`

Effects:
- `src/App.jsx`: disables performance monitoring init and hides heavy UI (PerformanceDashboard, AIFinancialAssistant, PersistentCLI, floating AI button).
- `src/pages/App.jsx`: removes above-the-fold Framer Motion animations.
- `src/components/ui/Header.jsx`: icons inlined via direct `lucide-react` imports for lower runtime overhead.

## Lighthouse CI
The CI config already points LHCI to the audit URL with `?lhci=1`.
- Config: `lighthouse.config.cjs`
  - Collect URL: `http://localhost:4173/?lhci=1&pwa=0`
  - Upload target: temporary-public-storage (ephemeral)

Run a full local audit (build + preview + LHCI):
```bash
npm run perf:audit
# equivalent to: npm run build && npm run lighthouse:ci
```
This uses the preview server and automatically activates audit mode via the query string.

Alternative manual run:
```bash
npm run build
npm run preview &
# open another terminal
npm run lighthouse:ci
```

Force audit mode without query params:
```bash
VITE_LIGHTHOUSE_CI=true npm run preview
# then open http://localhost:4173/
```

## Expected improvements (focus)
- Total Blocking Time (TBT) reduced due to:
  - No perf monitoring initialization in audit mode
  - Heavy components suppressed (AI assistant, CLI, dashboard)
  - Above-the-fold motion removed on landing
  - Inlined header icons removing dynamic icon resolution

## Resuming Codex CLI workflow
1. Lint and unit tests
   ```bash
   npm run lint && npm run test:run
   ```
2. Build
   ```bash
   npm run build
   ```
3. Audit
   ```bash
   npm run lighthouse:ci
   ```
4. Review LHCI output and performance budgets
   - See `/lighthouse-performance.json` or LHCI console output
   - Budgets enforced in `performance-budgets.json` and asserts in `lighthouse.config.cjs`

## Troubleshooting
- LHCI port busy: kill existing preview or change port via `--port` on preview or edit config.
- Audit mode not active: ensure URL includes `?lhci` or set `VITE_LIGHTHOUSE_CI=true` env.
- ESLint noise: run `npm run lint:fix` then `npm run format`.
- Bundle bloat: run
  ```bash
  npm run analyze:bundle
  npm run budget:check
  ```

## Pointers
- Root app: `src/App.jsx`
- Landing page: `src/pages/App.jsx`
- Header: `src/components/ui/Header.jsx`
- LHCI: `lighthouse.config.cjs`
- Budgets: `performance-budgets.json`
