import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Keep worker count modest on CI to reduce resource contention/flakes
  workers: process.env.CI ? 2 : undefined,
  // Use HTML + list locally; GitHub reporter in CI
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }]
      ]
    : [
        ['list'],
        ['html', { open: 'never' }]
      ],
  use: {
    // Force IPv4 loopback to avoid ::1 binding issues in sandboxed envs
    baseURL: process.env.PW_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    // Stabilize environment
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Prefer data-testid for selectors in e2e specs
    testIdAttribute: 'data-testid'
  },
  webServer: {
    // Serve production build by default to avoid dev error overlay in E2E
    // Can opt into dev server via PW_USE_DEV_SERVER=1
    command: process.env.PW_USE_DEV_SERVER
      ? 'npm run start -- --host 127.0.0.1 --port 5173'
      : 'npm run build && npm run preview -- --host 127.0.0.1 --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
