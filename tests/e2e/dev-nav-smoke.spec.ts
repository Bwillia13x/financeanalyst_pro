import { test, expect } from '@playwright/test';

// This smoke is intended for dev builds only because /__dev/nav
// is gated behind import.meta.env.DEV.
// Run with: PW_USE_DEV_SERVER=1 npx playwright test tests/e2e/dev-nav-smoke.spec.ts

test.describe('@smoke DevNav', () => {
  test.skip(!process.env.PW_USE_DEV_SERVER, 'Dev-only test; run with PW_USE_DEV_SERVER=1');

  test('all DevNav links load without 404 or crash', async ({ page, baseURL }) => {
    const origin = baseURL || 'http://localhost:5173';
    const devNavUrl = `${origin}/__dev/nav?ci=1`;

    await page.goto(devNavUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Dev Navigation' })).toBeVisible({ timeout: 30_000 });

    // Collect unique hrefs from the DevNav page
    const anchors = page.locator('a[href^="/"]');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);

    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await anchors.nth(i).getAttribute('href');
      if (href) hrefs.add(href);
    }

    for (const href of hrefs) {
      const url = `${origin}${href}${href.includes('?') ? '&' : '?'}ci=1`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Assert the app container renders
      await expect(page.getByTestId('app')).toBeVisible();

      // Assert the Not Found page is not displayed
      await expect(page.getByText('Page Not Found')).toHaveCount(0);

      // Assert the route-path testid matches current pathname
      const routePath = page.getByTestId('route-path');
      await expect(routePath).toHaveAttribute('data-path', new URL(page.url()).pathname);
    }
  });
});
