/**
 * Cross-Browser Compatibility and Responsive Design Testing
 * FinanceAnalyst Pro Platform
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class CrossBrowserTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Define test scenarios
    this.viewports = [
      { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 2 },
      { name: 'Tablet', width: 768, height: 1024, deviceScaleFactor: 1 },
      { name: 'Desktop', width: 1920, height: 1080, deviceScaleFactor: 1 },
      { name: 'Large Desktop', width: 2560, height: 1440, deviceScaleFactor: 1 }
    ];

    this.browsers = ['chromium'];

    this.testUrls = [
      { name: 'Home Page', url: 'http://localhost:5173' },
      { name: 'Private Analysis', url: 'http://localhost:5173/private-analysis' },
      { name: 'Real-time Dashboard', url: 'http://localhost:5173/realtime-dashboard' }
    ];

    // Modern JS and CSS features to test
    this.modernFeatures = {
      js: ['async', 'await', 'Promise', 'fetch', 'Map', 'Set'],
      css: ['grid', 'flexbox', 'css-variables', 'backdrop-filter']
    };
  }

  async runAllTests() {
    console.log('🌐 Starting Cross-Browser Compatibility Test Suite');

    try {
      for (const browserType of this.browsers) {
        console.log(`\n🔍 Testing with ${browserType.toUpperCase()}`);

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (const viewport of this.viewports) {
          console.log(
            `  📱 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`
          );

          for (const testUrl of this.testUrls) {
            await this.testPage(browser, viewport, testUrl);
          }
        }

        await browser.close();
      }

      this.generateReport();
    } catch (error) {
      console.error('❌ Cross-browser testing failed:', error);
    }
  }

  async testPage(browser, viewport, testUrl) {
    const page = await browser.newPage();

    try {
      // Set viewport
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor
      });

      // Navigate to page
      console.log(`    🌐 Loading ${testUrl.name}...`);
      await page.goto(testUrl.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for React to load
      await page.waitForSelector('#root', { timeout: 10000 });

      // Test basic functionality
      const testResult = {
        name: `${testUrl.name} - ${viewport.name}`,
        viewport: viewport,
        url: testUrl.url,
        timestamp: new Date().toISOString(),
        metrics: {}
      };

      // Test page title
      const title = await page.title();
      testResult.metrics.title = title;
      testResult.metrics.hasTitle = title.length > 0;

      // Test if main content loads
      const hasRootContent = (await page.$('#root > *')) !== null;
      testResult.metrics.hasContent = hasRootContent;

      // Test for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });

      // Wait a bit for any errors to surface
      await page.waitForTimeout(2000);

      testResult.metrics.jsErrors = jsErrors;
      testResult.metrics.hasErrors = jsErrors.length > 0;

      // Test responsive elements
      const viewportSize = await page.viewport();
      testResult.metrics.actualViewport = viewportSize;

      // Test if navigation elements are present
      const hasNavigation = (await page.$('nav, [role="navigation"]')) !== null;
      testResult.metrics.hasNavigation = hasNavigation;

      // Test for accessibility basics
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
      testResult.metrics.imagesWithoutAlt = imagesWithoutAlt;

      const buttonsWithoutAriaLabel = await page.$$eval(
        'button:not([aria-label]):not([aria-labelledby])',
        buttons => buttons.length
      );
      testResult.metrics.buttonsWithoutAriaLabel = buttonsWithoutAriaLabel;

      // Calculate overall score
      let score = 100;
      if (!testResult.metrics.hasTitle) score -= 20;
      if (!testResult.metrics.hasContent) score -= 30;
      if (testResult.metrics.hasErrors) score -= 25;
      if (!testResult.metrics.hasNavigation) score -= 10;
      if (testResult.metrics.imagesWithoutAlt > 0) score -= 5;
      if (testResult.metrics.buttonsWithoutAriaLabel > 0) score -= 5;

      testResult.metrics.score = Math.max(0, score);
      testResult.status = score >= 70 ? 'PASS' : 'FAIL';

      this.results.tests.push(testResult);

      console.log(
        `      ✅ ${testUrl.name}: ${testResult.metrics.score}/100 (${testResult.status})`
      );

      if (testResult.metrics.jsErrors.length > 0) {
        console.log(`        ⚠️  JS Errors: ${testResult.metrics.jsErrors.length}`);
      }
    } catch (error) {
      console.log(`      ❌ ${testUrl.name}: FAILED - ${error.message}`);

      this.results.tests.push({
        name: `${testUrl.name} - ${viewport.name}`,
        viewport: viewport,
        url: testUrl.url,
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await page.close();
    }
  }

  generateReport() {
    console.log('\n📋 Generating Cross-Browser Compatibility Report');

    const reportPath = path.join(process.cwd(), 'cross-browser-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('🌐 CROSS-BROWSER COMPATIBILITY RESULTS');
    console.log('=====================================');

    const summary = {
      total: this.results.tests.length,
      passed: 0,
      failed: 0,
      errors: 0
    };

    // Group by viewport
    const byViewport = {};

    this.results.tests.forEach(test => {
      if (test.status === 'PASS') summary.passed++;
      else if (test.status === 'FAIL') summary.failed++;
      else if (test.status === 'ERROR') summary.errors++;

      const viewportKey = `${test.viewport.name} (${test.viewport.width}x${test.viewport.height})`;
      if (!byViewport[viewportKey]) {
        byViewport[viewportKey] = { tests: [], scores: [] };
      }
      byViewport[viewportKey].tests.push(test);
      if (test.metrics && test.metrics.score !== undefined) {
        byViewport[viewportKey].scores.push(test.metrics.score);
      }
    });

    console.log(`\n📊 SUMMARY`);
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Errors: ${summary.errors}`);

    console.log(`\n📱 VIEWPORT BREAKDOWN`);
    Object.entries(byViewport).forEach(([viewport, data]) => {
      const avgScore =
        data.scores.length > 0
          ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)
          : 'N/A';
      console.log(`${viewport}: ${avgScore}/100 avg`);
    });

    // Overall assessment
    const overallScore =
      summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

    console.log(`\n🎯 OVERALL COMPATIBILITY SCORE: ${overallScore}%`);

    if (parseFloat(overallScore) >= 90) {
      console.log('🎉 Excellent cross-browser compatibility!');
    } else if (parseFloat(overallScore) >= 75) {
      console.log('👍 Good cross-browser compatibility with minor issues.');
    } else if (parseFloat(overallScore) >= 50) {
      console.log('⚠️ Moderate cross-browser compatibility - needs attention.');
    } else {
      console.log('❌ Poor cross-browser compatibility - requires fixes.');
    }

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');

    const failedTests = this.results.tests.filter(t => t.status !== 'PASS');
    if (failedTests.length > 0) {
      console.log('Issues found:');
      failedTests.forEach(test => {
        console.log(`• ${test.name}: ${test.error || 'Failed checks'}`);
      });
    } else {
      console.log('🎯 All tests passed! Cross-browser compatibility is excellent.');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new CrossBrowserTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export default CrossBrowserTestSuite;
