import { test, expect } from '@playwright/test';

test.describe('@smoke AdminLogin', () => {
  test.skip(!process.env.PW_USE_DEV_SERVER, 'Dev-only test; run with PW_USE_DEV_SERVER=1');

  test('admin can login and view AI Action Log', async ({ page, baseURL }) => {
    const origin = baseURL || 'http://localhost:5173';

    // Navigate to Admin Login
    await page.goto(`${origin}/admin-login?ci=1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();

    // Fill credentials (demo defaults are prefilled, but fill to be explicit)
    await page.getByLabel('Email').fill('admin@financeanalyst.pro');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to AI Action Log
    await expect(page).toHaveURL(/\/ai-log/);
    await expect(page.getByRole('heading', { name: 'AI Action Log' })).toBeVisible({ timeout: 30_000 });

    // Validate table or empty state renders without auth error
    await expect(page.getByText('Unauthorized: You do not have permission', { exact: false })).toHaveCount(0);
    await expect(
      page.locator('table, text=No log entries.').first()
    ).toBeVisible();
  });
});

