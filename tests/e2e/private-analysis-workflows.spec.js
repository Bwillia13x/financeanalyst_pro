import { test, expect } from '@playwright/test';

test.describe('Private Analysis Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Private Analysis page
    await page.goto('/private-analysis');
    
    // Wait for the page to be fully loaded
    await page.waitForSelector('[data-testid="private-analysis-container"]', { timeout: 10000 });
    
    // Skip onboarding tour if it appears
    const skipButton = page.locator('button:has-text("Skip Tour")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
  });

  test('should load financial spreadsheet and allow data entry', async ({ page }) => {
    // Ensure we're on the spreadsheet tab
    await page.click('button[data-tab="spreadsheet"]');
    
    // Wait for spreadsheet to load
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 5000 });
    
    // Test revenue input
    const revenueInput = page.locator('input[data-metric="revenue"]').first();
    await revenueInput.fill('100000000');
    await revenueInput.press('Tab');
    
    // Verify the value was entered
    await expect(revenueInput).toHaveValue('100000000');
    
    // Test COGS input
    const cogsInput = page.locator('input[data-metric="cogs"]').first();
    await cogsInput.fill('60000000');
    await cogsInput.press('Tab');
    
    // Verify automatic gross profit calculation
    const grossProfitCell = page.locator('[data-metric="gross-profit"]').first();
    await expect(grossProfitCell).toContainText('40,000,000');
  });

  test('should perform DCF analysis workflow', async ({ page }) => {
    // Navigate to modeling tab
    await page.click('button[data-tab="modeling"]');
    
    // Wait for modeling tools to load
    await page.waitForSelector('[data-testid="modeling-tools"]', { timeout: 5000 });
    
    // Set DCF parameters
    await page.fill('input[data-parameter="discount-rate"]', '0.10');
    await page.fill('input[data-parameter="terminal-growth"]', '0.025');
    await page.fill('input[data-parameter="tax-rate"]', '0.25');
    
    // Run DCF calculation
    await page.click('button[data-action="calculate-dcf"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="dcf-results"]', { timeout: 10000 });
    
    // Verify DCF output contains valuation
    const valuationResult = page.locator('[data-metric="enterprise-value"]');
    await expect(valuationResult).toBeVisible();
    await expect(valuationResult).not.toContainText('$0');
    
    // Verify analysis progress updated
    const progressIndicator = page.locator('[data-testid="analysis-progress"]');
    await expect(progressIndicator).toContainText('60%');
  });

  test('should navigate to advanced LBO tool and perform analysis', async ({ page }) => {
    // Navigate to LBO tab
    await page.click('button[data-tab="lbo"]');
    
    // Wait for LBO tool to load
    await page.waitForSelector('[data-testid="advanced-lbo-tool"]', { timeout: 5000 });
    
    // Set LBO parameters
    await page.fill('input[data-parameter="purchase-price"]', '1000000000');
    await page.fill('input[data-parameter="debt-percentage"]', '0.6');
    await page.fill('input[data-parameter="equity-percentage"]', '0.4');
    
    // Set exit assumptions
    await page.fill('input[data-parameter="exit-multiple"]', '8.5');
    await page.fill('input[data-parameter="hold-period"]', '5');
    
    // Run LBO calculation
    await page.click('button[data-action="calculate-lbo"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="lbo-results"]', { timeout: 10000 });
    
    // Verify LBO output contains IRR
    const irrResult = page.locator('[data-metric="equity-irr"]');
    await expect(irrResult).toBeVisible();
    await expect(irrResult).toContainText('%');
    
    // Verify MOIC calculation
    const moicResult = page.locator('[data-metric="equity-moic"]');
    await expect(moicResult).toBeVisible();
    await expect(moicResult).toContainText('x');
  });

  test('should create and analyze multiple scenarios', async ({ page }) => {
    // Navigate to scenarios tab
    await page.click('button[data-tab="scenarios"]');
    
    // Wait for scenario analysis to load
    await page.waitForSelector('[data-testid="scenario-analysis"]', { timeout: 5000 });
    
    // Add a new scenario
    await page.click('button[data-action="add-scenario"]');
    
    // Configure Bear scenario
    await page.fill('input[data-scenario="bear"][data-parameter="revenue-growth"]', '-0.05');
    await page.fill('input[data-scenario="bear"][data-parameter="margin-impact"]', '-0.02');
    
    // Configure Bull scenario
    await page.fill('input[data-scenario="bull"][data-parameter="revenue-growth"]', '0.15');
    await page.fill('input[data-scenario="bull"][data-parameter="margin-impact"]', '0.03');
    
    // Run scenario analysis
    await page.click('button[data-action="run-scenarios"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="scenario-results"]', { timeout: 10000 });
    
    // Verify scenario comparison chart
    const scenarioChart = page.locator('[data-testid="scenario-comparison-chart"]');
    await expect(scenarioChart).toBeVisible();
    
    // Verify scenario summary table
    const scenarioTable = page.locator('[data-testid="scenario-summary-table"]');
    await expect(scenarioTable).toBeVisible();
    await expect(scenarioTable).toContainText('Bear');
    await expect(scenarioTable).toContainText('Bull');
    await expect(scenarioTable).toContainText('Base');
  });

  test('should perform Monte Carlo simulation', async ({ page }) => {
    // Navigate to Monte Carlo tab
    await page.click('button[data-tab="montecarlo"]');
    
    // Wait for Monte Carlo hub to load
    await page.waitForSelector('[data-testid="monte-carlo-hub"]', { timeout: 5000 });
    
    // Configure simulation settings
    await page.fill('input[data-parameter="iterations"]', '1000');
    await page.fill('input[data-parameter="revenue-volatility"]', '0.15');
    await page.fill('input[data-parameter="margin-volatility"]', '0.10');
    
    // Start simulation
    await page.click('button[data-action="run-monte-carlo"]');
    
    // Wait for simulation to complete
    await page.waitForSelector('[data-testid="monte-carlo-results"]', { timeout: 15000 });
    
    // Verify distribution chart
    const distributionChart = page.locator('[data-testid="valuation-distribution-chart"]');
    await expect(distributionChart).toBeVisible();
    
    // Verify confidence intervals
    const confidenceIntervals = page.locator('[data-testid="confidence-intervals"]');
    await expect(confidenceIntervals).toBeVisible();
    await expect(confidenceIntervals).toContainText('95%');
    await expect(confidenceIntervals).toContainText('P50');
    
    // Verify risk metrics
    const riskMetrics = page.locator('[data-testid="risk-metrics"]');
    await expect(riskMetrics).toBeVisible();
    await expect(riskMetrics).toContainText('VaR');
  });

  test('should save and load analysis', async ({ page }) => {
    // Enter some test data
    await page.click('button[data-tab="spreadsheet"]');
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 5000 });
    
    const revenueInput = page.locator('input[data-metric="revenue"]').first();
    await revenueInput.fill('150000000');
    
    // Save analysis
    await page.click('button[data-action="save-analysis"]');
    
    // Enter analysis name
    const nameInput = page.locator('input[data-field="analysis-name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Analysis E2E');
      await page.click('button[data-action="confirm-save"]');
    }
    
    // Wait for save confirmation
    await page.waitForSelector('[data-testid="save-success"]', { timeout: 5000 });
    
    // Clear the data
    await revenueInput.fill('0');
    
    // Load analysis
    await page.click('button[data-action="load-analysis"]');
    
    // Select the saved analysis
    await page.click('[data-analysis-name="Test Analysis E2E"]');
    
    // Verify data was restored
    await expect(revenueInput).toHaveValue('150000000');
  });

  test('should use Command Palette for navigation', async ({ page }) => {
    // Open Command Palette
    await page.keyboard.press('Meta+K');
    
    // Wait for Command Palette to open
    await page.waitForSelector('[data-testid="command-palette"]', { timeout: 3000 });
    
    // Search for LBO command
    await page.fill('input[placeholder*="command"]', 'Advanced LBO');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="command-result"]', { timeout: 2000 });
    
    // Select LBO command
    await page.click('[data-command-id="go-to-lbo"]');
    
    // Verify navigation to LBO tab
    await page.waitForSelector('[data-testid="advanced-lbo-tool"]', { timeout: 5000 });
    await expect(page.locator('button[data-tab="lbo"]')).toHaveClass(/active/);
    
    // Test natural language command
    await page.keyboard.press('Meta+K');
    await page.fill('input[placeholder*="command"]', 'Create new DCF for AAPL');
    await page.press('input[placeholder*="command"]', 'Enter');
    
    // Verify DCF creation or navigation
    await page.waitForSelector('[data-testid="modeling-tools"]', { timeout: 5000 });
  });

  test('should export analysis to different formats', async ({ page }) => {
    // Navigate to import-export tab or use export button
    const exportButton = page.locator('button[data-action="export-analysis"]');
    if (await exportButton.isVisible()) {
      await exportButton.click();
    } else {
      await page.click('button[data-tab="import-export"]');
      await page.waitForSelector('[data-testid="data-export-import"]', { timeout: 5000 });
    }
    
    // Test PDF export
    await page.click('button[data-format="pdf"]');
    
    // Wait for export to process
    await page.waitForSelector('[data-testid="export-success"]', { timeout: 10000 });
    
    // Test Excel export
    await page.click('button[data-format="excel"]');
    await page.waitForSelector('[data-testid="export-success"]', { timeout: 10000 });
    
    // Verify export notifications
    const exportNotification = page.locator('[data-testid="export-notification"]');
    await expect(exportNotification).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Navigate to modeling tab
    await page.click('button[data-tab="modeling"]');
    await page.waitForSelector('[data-testid="modeling-tools"]', { timeout: 5000 });
    
    // Try to run DCF without required data
    await page.click('button[data-action="calculate-dcf"]');
    
    // Verify error handling
    const errorMessage = page.locator('[data-testid="calculation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('insufficient data');
    
    // Test invalid input handling
    await page.fill('input[data-parameter="discount-rate"]', 'invalid');
    await page.press('input[data-parameter="discount-rate"]', 'Tab');
    
    // Verify input validation
    const validationError = page.locator('[data-testid="validation-error"]');
    await expect(validationError).toBeVisible();
  });

  test('should maintain state across tab navigation', async ({ page }) => {
    // Enter data in spreadsheet
    await page.click('button[data-tab="spreadsheet"]');
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 5000 });
    
    const revenueInput = page.locator('input[data-metric="revenue"]').first();
    await revenueInput.fill('200000000');
    
    // Navigate to modeling tab
    await page.click('button[data-tab="modeling"]');
    await page.waitForSelector('[data-testid="modeling-tools"]', { timeout: 5000 });
    
    // Navigate back to spreadsheet
    await page.click('button[data-tab="spreadsheet"]');
    await page.waitForSelector('[data-testid="financial-spreadsheet"]', { timeout: 5000 });
    
    // Verify data persistence
    await expect(revenueInput).toHaveValue('200000000');
    
    // Check that calculated fields updated
    const grossProfitCell = page.locator('[data-metric="gross-profit"]').first();
    await expect(grossProfitCell).not.toContainText('$0');
  });
});
