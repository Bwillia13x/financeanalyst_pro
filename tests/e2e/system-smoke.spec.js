import { test, expect } from '@playwright/test';

// Minimal, fast, and reliable platform smoke covering SEO and core Private Analysis load
// Tests are tagged with '@smoke' in their titles for easy selection

test.describe('System Smoke', () => {
  test('@smoke should load home and expose SEO metadata', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Title contains product name
    await expect(page).toHaveTitle(/financeanalyst-pro|FinanceAnalyst Pro/i);

    // Meta description contains financial messaging
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /financial/i);
  });

  test('@smoke should load Private Analysis and render main spreadsheet landmark', async ({ page }) => {
    // Stabilize environment: ensure onboarding is skipped and storage is clean
    await page.addInitScript(() => {
      try {
        localStorage.setItem('fa-pro-visited-private-analysis', 'true');
        localStorage.setItem('privateAnalyses', '[]');
      } catch (e) {
        /* ignore storage write in CI */
      }
    });

    // Capture console and page errors for debugging on CI
    page.on('console', msg => console.log(`[console:${msg.type()}]`, msg.text()));
    page.on('pageerror', err => console.log('[pageerror]', err.message));

    await page.goto('/private-analysis?ci=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to mount and preloader to disappear
    await page.waitForSelector('#root', { timeout: 10000 });
    await page.locator('#app-preloader').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await expect(page).toHaveURL(/\/private-analysis/);

    // Container present
    const container = page.locator('[data-testid="private-analysis-container"]');
    await container.waitFor({ state: 'visible', timeout: 30000 });

    // Dismiss onboarding if present
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForSelector('button:has-text("Skip")', { state: 'hidden', timeout: 10000 });
    }

    // Main landmark from FinancialSpreadsheet (see memory about ensuring <main role="main" aria-busy>)
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();

    // Spreadsheet presence
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 20000 });
  });
});
