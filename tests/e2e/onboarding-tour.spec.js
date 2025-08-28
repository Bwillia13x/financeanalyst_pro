import { test, expect } from '@playwright/test';

const gotoPrivateAnalysis = async (page) => {
  // Enhanced error logging and environment setup
  await page.addInitScript(() => {
    try {
      localStorage.clear();

      // Set up comprehensive error logging
      window.addEventListener('error', (event) => {
        console.error('PAGE ERROR:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack || event.error
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('UNHANDLED REJECTION:', {
          reason: event.reason,
          promise: event.promise
        });
      });

      // Override console methods to capture all logs
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, ['TEST_ERROR:', ...args]);
      };

      const originalWarn = console.warn;
      console.warn = (...args) => {
        originalWarn.apply(console, ['TEST_WARN:', ...args]);
      };
    } catch {
      // Ignore initialization errors for test setup
    }
  });

  // Listen to console events
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning' || text.includes('TEST_ERROR') || text.includes('TEST_WARN') || text.includes('Quick Start') || text.includes('hasTourBeenCompleted')) {
      console.log(`BROWSER ${type.toUpperCase()}: ${text}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', (error) => {
    console.error('PAGE ERROR:', error.message);
    console.error('PAGE ERROR STACK:', error.stack);
  });

  await page.goto('/private-analysis');

  // Wait a moment for any async errors to surface
  await page.waitForTimeout(1000);

  // Check what's actually rendered instead of the expected heading
  const bodyContent = await page.textContent('body');
  console.log('PAGE BODY CONTENT:', bodyContent.substring(0, 500) + '...');

  await expect(page.locator('#page-title')).toBeVisible();
};

const tooltip = (page) => page.locator('.fixed.max-w-sm.bg-white.rounded-lg.shadow-xl.border.border-slate-200');

const expectTourStep = async (page, { title, contentIncludes }) => {
  const tl = tooltip(page);
  await expect(tl).toBeVisible();
  await expect(tl.getByRole('heading', { name: title })).toBeVisible();
  if (contentIncludes) {
    await expect(tl.getByText(contentIncludes)).toBeVisible();
  }
  // Next or Finish button should exist
  await expect(tl.getByRole('button', { name: /Next|Finish/ })).toBeVisible();
};

const next = async (page) => {
  const tl = tooltip(page);

  // Try Next button first
  const nextButton = tl.getByRole('button', { name: 'Next' });
  const finishButton = tl.getByRole('button', { name: 'Finish' });

  try {
    if (await nextButton.isVisible({ timeout: 1000 })) {
      await nextButton.click();
    } else if (await finishButton.isVisible({ timeout: 1000 })) {
      // For the finish button, wait a moment then click
      await page.waitForTimeout(500);
      await finishButton.click();
      // Wait for tour to complete
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.error('Error clicking tour button:', error);
    throw error;
  }
};

const finish = async (page) => {
  await tooltip(page).getByRole('button', { name: 'Finish' }).click();
};

// Step content expectations derived from src/config/onboardingTours.js
const steps = [
  { title: 'Financial Spreadsheet', contentIncludes: 'Start by building your financial model' },
  { title: 'Revenue Assumptions', contentIncludes: 'Begin with revenue projections.' },
  { title: 'Operating Expenses', contentIncludes: 'Model your cost structure' },
  { title: 'Advanced Modeling', contentIncludes: 'Access DCF, LBO, and other valuation models.' },
  { title: 'Analysis Results', contentIncludes: 'View detailed results including valuations' }
];

test.describe('Private Analysis Onboarding Tour', () => {
  test('Quick Start modal -> Start Tour -> navigate all steps -> Finish persists completion', async ({ page }) => {
    await gotoPrivateAnalysis(page);

    // Quick Start modal should appear
    await expect(page.getByRole('dialog', { name: 'Welcome to Private Analysis' })).toBeVisible();

    // Wait for the Start Tour button to be ready and click it
    const startTourButton = page.getByRole('button', { name: 'Start Tour' });
    await expect(startTourButton).toBeVisible();
    await expect(startTourButton).toBeEnabled();
    await startTourButton.click();

    // Verify each step and navigate
    for (let i = 0; i < steps.length; i++) {
      await expectTourStep(page, steps[i]);
      // For the first step, also verify highlight style is applied to the target element
      if (i === 0) {
        const highlighted = page.locator('[data-tour="financial-spreadsheet-tab"]');
        await expect(highlighted).toBeVisible();
        const boxShadow = await highlighted.evaluate(el => getComputedStyle(el).boxShadow);
        expect(boxShadow).toContain('rgba(59, 130, 246, 0.5)');
        await expect(highlighted).toHaveCSS('z-index', '1001');
      }
      if (i < steps.length - 1) {
        await next(page);
      }
    }

    // Finish at last step
    await finish(page);

    // Tooltip should disappear; manual start button should be hidden (tour completed)
    await expect(tooltip(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start Private Analysis tour' })).toHaveCount(0);
  });

  test('Quick Start modal -> Skip -> manual start button starts the tour', async ({ page }) => {
    await gotoPrivateAnalysis(page);

    // Skip from modal
    await expect(page.getByRole('dialog', { name: 'Welcome to Private Analysis' })).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    // No tour tooltip visible
    await expect(tooltip(page)).toHaveCount(0);

    // Manual start
    const manualStart = page.getByRole('button', { name: 'Start Private Analysis tour' });
    await expect(manualStart).toBeVisible();
    await manualStart.click();

    // First step visible
    await expectTourStep(page, steps[0]);

    // Close via the X button in the tooltip header
    await tooltip(page).getByRole('button').first().click();

    // Tour closed
    await expect(tooltip(page)).toHaveCount(0);
  });

  test('ESC key closes the Quick Start modal and returns focus to page title', async ({ page }) => {
    await gotoPrivateAnalysis(page);

    const modal = page.getByRole('dialog', { name: 'Welcome to Private Analysis' });
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(modal).toHaveCount(0);
    // Focus should return to page title per implementation
    await expect(page.locator('#page-title')).toBeFocused();
  });
});
