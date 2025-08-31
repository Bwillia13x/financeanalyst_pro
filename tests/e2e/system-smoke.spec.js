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

  test('@smoke should load Private Analysis and render main spreadsheet landmark', async ({
    page
  }) => {
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

    // Navigate to the page
    await page.goto('http://localhost:5173/private-analysis', { waitUntil: 'domcontentloaded' });

    // Wait for basic page structure
    await page.waitForSelector('#root', { timeout: 10000 });

    // Check that we have some content (either preloader or actual content)
    const hasContent = (await page.locator('#root > *').count()) > 0;
    expect(hasContent).toBe(true);

    // Check URL
    await expect(page).toHaveURL(/\/private-analysis/);

    // Debug: Log page content
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Page title:', await page.title());

    // Check if React root exists
    const rootExists = (await page.locator('#root').count()) > 0;
    console.log('Root element exists:', rootExists);

    // Check what's in the body
    const bodyContent = await page.locator('body').textContent();
    console.log('Body content (first 500 chars):', bodyContent?.substring(0, 500));

    // Check for error messages
    const errorMessages = await page.locator('.error, [class*="error"]').allTextContents();
    console.log('Error messages found:', errorMessages);

    // Dismiss onboarding if present
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForSelector('button:has-text("Skip")', { state: 'hidden', timeout: 10000 });
    }

    // Verify PrivateAnalysis page is rendering correctly
    const privateAnalysisContainer =
      (await page.locator('[data-testid="private-analysis-container"]').count()) > 0;
    console.log('PrivateAnalysis container found:', privateAnalysisContainer);
    expect(privateAnalysisContainer).toBe(true);

    // Check for the main heading
    const mainHeading = (await page.locator('h1:has-text("Private Analysis")').count()) > 0;
    console.log('Main heading found:', mainHeading);
    expect(mainHeading).toBe(true);

    // Check for main landmark
    const mainLandmark = (await page.locator('main[role="main"]').count()) > 0;
    console.log('Main landmark found:', mainLandmark);
    expect(mainLandmark).toBe(true);

    // Check for tab navigation
    const tabNavigation =
      (await page.locator('nav button:has-text("Financial Spreadsheet")').count()) > 0;
    console.log('Tab navigation found:', tabNavigation);
    expect(tabNavigation).toBe(true);

    console.log('✅ PrivateAnalysis page rendered successfully!');
  });
});
