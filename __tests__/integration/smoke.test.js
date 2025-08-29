import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Finance Analyst Pro - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode for consistent testing
    await page.addInitScript(() => {
      localStorage.setItem('demoMode', 'true');
    });
  });

  test('App loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for the app to load
    await expect(page.locator('body')).toBeVisible();
    
    // Check for basic app structure
    await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });
  });

  test('API health check responds', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
  });

  test('User can register and login', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`);
    
    // Fill registration form
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.check('input[name="agreeToTerms"]');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or main app
    await expect(page).toHaveURL(/\/(dashboard|financial-model-workspace|app)/);
  });

  test('Market data API endpoints work', async ({ request }) => {
    // Test quote endpoint
    const quoteResponse = await request.get(`${API_BASE_URL}/market-data/quote/AAPL`);
    expect(quoteResponse.status()).toBe(200);
    
    const quoteData = await quoteResponse.json();
    expect(quoteData.success).toBe(true);
    expect(quoteData.quote).toBeDefined();
    expect(quoteData.quote.symbol).toBe('AAPL');
  });

  test('User can search for a ticker', async ({ page }) => {
    // Login first (demo mode)
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', 'demo@financeanalyst.pro');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/(dashboard|financial-model-workspace|app)/);
    
    // Look for ticker search input (could be in header or main content)
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="ticker" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('AAPL');
      await page.waitForTimeout(1000); // Wait for search results
      
      // Check if results appear
      await expect(page.locator('text=AAPL').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('User can access DCF tool', async ({ page }) => {
    // Login first (demo mode)
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', 'demo@financeanalyst.pro');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|financial-model-workspace|app)/);
    
    // Navigate to DCF tool
    await page.goto(`${FRONTEND_URL}/valuation-tool`);
    
    // Check for DCF-related elements
    await expect(page.locator('text=/DCF|valuation|model/i').first()).toBeVisible({ timeout: 10000 });
    
    // Look for input fields typical of DCF models
    const inputs = page.locator('input[type="number"], input[type="text"]');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
  });

  test('AI assistant endpoint responds', async ({ request }) => {
    // Test AI assistant endpoint with fallback
    const response = await request.post(`${API_BASE_URL}/ai-assistant/chat`, {
      data: {
        message: 'Hello, can you help me analyze Apple stock?',
        context: {
          symbol: 'AAPL'
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.response).toBeDefined();
    expect(typeof data.response).toBe('string');
  });

  test('DCF computation works', async ({ request, page }) => {
    // Login first to get auth token
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', 'demo@financeanalyst.pro');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    
    if (token) {
      // Create a DCF scenario
      const createResponse = await request.post(`${API_BASE_URL}/dcf-scenarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: {
          name: 'Test Smoke Scenario',
          symbol: 'AAPL',
          assumptions: {
            currentRevenue: 100000000,
            projectionYears: 5,
            terminalGrowthRate: 0.025,
            discountRate: 0.12,
            netIncomeMargin: 0.15,
            capexAsPercentRevenue: 0.03,
            deprecationAsPercentRevenue: 0.02,
            workingCapitalAsPercentRevenue: 0.05,
            sharesOutstanding: 1000000,
            cashAndEquivalents: 10000000,
            totalDebt: 50000000
          }
        }
      });
      
      expect(createResponse.status()).toBe(201);
      const scenarioData = await createResponse.json();
      expect(scenarioData.success).toBe(true);
      
      const scenarioId = scenarioData.scenario.id;
      
      // Compute DCF results
      const computeResponse = await request.post(`${API_BASE_URL}/dcf-scenarios/${scenarioId}/compute`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(computeResponse.status()).toBe(200);
      const computeData = await computeResponse.json();
      expect(computeData.success).toBe(true);
      expect(computeData.results).toBeDefined();
      expect(computeData.results.fairValue).toBeGreaterThan(0);
    }
  });

  test('Export functionality works', async ({ request, page }) => {
    // Login and create scenario first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="email"]', 'demo@financeanalyst.pro');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    
    if (token) {
      // Create scenario
      const createResponse = await request.post(`${API_BASE_URL}/dcf-scenarios`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: {
          name: 'Export Test Scenario',
          symbol: 'AAPL',
          assumptions: {
            currentRevenue: 100000000,
            projectionYears: 5,
            terminalGrowthRate: 0.025,
            discountRate: 0.12,
            netIncomeMargin: 0.15,
            capexAsPercentRevenue: 0.03,
            deprecationAsPercentRevenue: 0.02,
            workingCapitalAsPercentRevenue: 0.05,
            sharesOutstanding: 1000000,
            cashAndEquivalents: 10000000,
            totalDebt: 50000000
          }
        }
      });
      
      const scenarioData = await createResponse.json();
      const scenarioId = scenarioData.scenario.id;
      
      // Test CSV export
      const csvResponse = await request.post(`${API_BASE_URL}/exports/dcf-csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: { scenarioId }
      });
      
      expect(csvResponse.status()).toBe(200);
      expect(csvResponse.headers()['content-type']).toContain('text/csv');
    }
  });

  test('Cache and performance endpoints respond', async ({ request }) => {
    const healthResponse = await request.get(`${API_BASE_URL}/health/detailed`);
    expect(healthResponse.status()).toBe(200);
    
    const data = await healthResponse.json();
    expect(data.success).toBe(true);
    expect(data.system).toBeDefined();
    expect(data.cache).toBeDefined();
  });
});
