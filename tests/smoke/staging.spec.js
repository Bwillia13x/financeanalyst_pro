import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_URL || 'https://financeanalyst-staging.netlify.app';

test.describe('Staging Environment Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to staging environment
    await page.goto(STAGING_URL);
  });

  test('should load homepage without errors', async ({ page }) => {
    // Check that page loads
    await expect(page).toHaveTitle(/FinanceAnalyst Pro/);

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Should not have critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('ResizeObserver') &&
      !error.includes('favicon') &&
      !error.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have functional navigation', async ({ page }) => {
    // Test main navigation links
    await expect(page.locator('nav')).toBeVisible();

    // Test Company Analysis navigation
    const companyAnalysisLink = page.getByText('Company Analysis');
    if (await companyAnalysisLink.isVisible()) {
      await companyAnalysisLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/company-analysis/);
    }

    // Test Private Analysis navigation
    await page.goto(STAGING_URL);
    const privateAnalysisLink = page.getByText('Private Analysis');
    if (await privateAnalysisLink.isVisible()) {
      await privateAnalysisLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/private-analysis/);
    }
  });

  test('should load core JavaScript bundles', async ({ page }) => {
    const response = await page.goto(STAGING_URL);
    expect(response.status()).toBe(200);

    // Check that critical JS files load
    const jsRequests = [];
    page.on('response', response => {
      if (response.url().includes('.js') && response.url().includes(STAGING_URL)) {
        jsRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    await page.waitForLoadState('networkidle');

    // Should have loaded JS files successfully
    const failedJs = jsRequests.filter(req => req.status >= 400);
    expect(failedJs).toHaveLength(0);
  });

  test('should have functional command palette', async ({ page }) => {
    // Open command palette with keyboard shortcut
    await page.keyboard.press('Meta+k');

    // Command palette should be visible
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

    // Should be able to search
    await page.fill('[placeholder*="Search"]', 'analysis');

    // Should show results
    await expect(page.locator('[data-testid="command-results"]')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });

  test('should handle API connectivity', async ({ page }) => {
    await page.goto(`${STAGING_URL}/company-analysis`);

    // Monitor network requests
    const apiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Try to load market data (should handle gracefully even if API is down)
    await page.fill('[placeholder*="ticker"]', 'AAPL');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(2000);

    // Check that we don't have 5xx errors (4xx is acceptable for demo mode)
    const serverErrors = apiRequests.filter(req => req.status >= 500);
    expect(serverErrors).toHaveLength(0);
  });

  test('should display version information', async ({ page }) => {
    // Check for version info in footer or about section
    const versionInfo = page.locator('[data-testid="version-info"]');
    if (await versionInfo.isVisible()) {
      const versionText = await versionInfo.textContent();
      expect(versionText).toMatch(/v?\d+\.\d+\.\d+/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigation should be responsive
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav')).toBeVisible();
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be functional
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have proper error boundaries', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto(`${STAGING_URL}/non-existent-route`);

    // Should show error page or redirect, not crash
    await page.waitForLoadState('networkidle');

    // Should not show React error boundary
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('should track performance metrics', async ({ page }) => {
    // Start performance measurement
    await page.goto(STAGING_URL);

    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('performance' in window && 'getEntriesByType' in performance) {
          const navigation = performance.getEntriesByType('navigation')[0];
          resolve({
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
          });
        } else {
          resolve({ loadTime: 0, domContentLoaded: 0, firstPaint: 0 });
        }
      });
    });

    // Reasonable performance thresholds for staging
    expect(performanceMetrics.loadTime).toBeLessThan(10000); // 10s max
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // 5s max
  });

  test('should handle authentication flow', async ({ page }) => {
    // Test auth-related functionality if present
    const loginButton = page.locator('text=Login').first();

    if (await loginButton.isVisible()) {
      await loginButton.click();

      // Should show login form or redirect to auth provider
      await page.waitForLoadState('networkidle');

      // Should not crash or show errors
      const errors = await page.locator('.error, [role="alert"]').count();
      expect(errors).toBe(0);
    }
  });
});
