import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Comprehensive accessibility tests using axe-core
 * Tests WCAG 2.1 AA compliance across all major pages
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Homepage accessibility scan', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Private Analysis page accessibility', async ({ page }) => {
    await page.goto('/private-analysis');
    await page.waitForLoadState('networkidle');

    // Wait for components to load
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('[data-axe-exclude]') // Allow components to opt-out if needed
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Valuation Tool accessibility', async ({ page }) => {
    await page.goto('/valuation-tool');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page accessibility', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation and header accessibility', async ({ page }) => {
    // Test main navigation
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('header, nav, [role="navigation"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form accessibility in DCF analysis', async ({ page }) => {
    await page.goto('/private-analysis');
    await page.waitForLoadState('networkidle');

    // Navigate to DCF modeling tab
    await page.click('[data-testid="tab-modeling"]');
    await page.waitForSelector('[data-testid="dcf-parameters"]', { timeout: 5000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="dcf-parameters"], form, input, label')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Modal accessibility - Command Palette', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 5000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="command-palette"], [role="dialog"], [role="combobox"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Charts and data visualization accessibility', async ({ page }) => {
    await page.goto('/private-analysis');
    await page.waitForLoadState('networkidle');

    // Navigate to results tab where charts are displayed
    await page.click('[data-testid="tab-results"]');
    await page.waitForTimeout(2000); // Wait for charts to render

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="chart"], svg, canvas')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast']) // Charts may have intentional color choices
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation test', async ({ page }) => {
    // Test tab navigation through major interactive elements
    await page.focus('body');

    // Tab through navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing and verify focus is visible
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Color contrast compliance', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // Report any color contrast violations with details
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Color contrast violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.log(`- ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`  Element: ${node.target.join(', ')}`);
          console.log(`  Impact: ${node.impact}`);
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Focus management in dynamic content', async ({ page }) => {
    await page.goto('/private-analysis');
    await page.waitForLoadState('networkidle');

    // Test focus management when switching tabs
    await page.click('[data-testid="tab-modeling"]');

    // Verify focus is moved appropriately
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Run accessibility scan on the newly loaded content
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Screen reader landmarks and structure', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['landmark-one-main', 'region', 'bypass'])
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form labels and descriptions', async ({ page }) => {
    await page.goto('/private-analysis');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only', 'form-field-multiple-labels'])
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
