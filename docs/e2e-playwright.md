# E2E (Playwright) Guide

This project uses Playwright for E2E. Config: `playwright.config.mjs`

## New environment toggles
- PW_BASE_URL: override base URL
  - Example: `PW_BASE_URL=http://127.0.0.1:5000 npm run e2e`
- PW_USE_DEV_SERVER=1: run against Vite dev server instead of preview build
  - Example: `PW_USE_DEV_SERVER=1 npm run e2e`

## Helpful scripts
- npm run e2e: default run across all projects (chromium, firefox, webkit)
- npm run e2e:headed: run headed (useful for debugging)
- npm run e2e:chromium: run only Chromium
- npm run e2e:dev: run E2E against dev server (no build)

## Stability settings
Configured in `playwright.config.mjs`:
- workers: 2 on CI (reduce flakiness)
- baseURL defaults to IPv4 loopback `http://127.0.0.1:5173`
- use: trace on first retry, screenshots/videos on failure, UTC timezone, en-US locale, fixed viewport
- webServer: preview build by default; switchable to dev server

## Local debugging tips
- Filter to a single test file or title: `npx playwright test tests/e2e/dashboard.spec.ts -g "filters data"`
- Open HTML report: `npx playwright show-report`
- Use `page.pause()` and run headed (`npm run e2e:headed`) for interactive inspector.

## Notes on jsdom vs browser
Vitest unit/integration uses jsdom, which logs warnings on navigation. We’ve:
- Prevented default on anchor clicks and stubbed HTMLAnchorElement.click in `src/test/setup.js`
- This does not affect Playwright (real browser) behavior.
