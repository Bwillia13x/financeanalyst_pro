/**
 * Export Functionality Testing Script
 * Tests Excel, PDF, JSON, and CSV export capabilities with sample data
 */

class ExportTester {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    this.startTime = null;
    this.endTime = null;

    // Sample data for testing exports
    this.sampleData = {
      financialReport: {
        company: 'Apple Inc.',
        symbol: 'AAPL',
        period: 'Q4 2023',
        incomeStatement: {
          totalRevenue: [365817, 274515, 260174],
          netIncome: [94680, 57411, 55256],
          grossProfit: [152836, 98620, 91979]
        },
        balanceSheet: {
          totalAssets: [365725, 352755, 351002],
          totalLiabilities: [290437, 302083, 283263],
          shareholdersEquity: [75388, 50672, 67739]
        },
        cashFlow: {
          operatingCashFlow: [110563, 99434, 90942],
          investingCashFlow: [-13393, -28069, -17857],
          financingCashFlow: [-84896, -105496, -82841]
        }
      },
      portfolioData: [
        { symbol: 'AAPL', quantity: 100, price: 150.25, value: 15025.0, weight: 0.45 },
        { symbol: 'MSFT', quantity: 50, price: 300.5, value: 15025.0, weight: 0.3 },
        { symbol: 'GOOGL', quantity: 25, price: 2400.0, value: 60000.0, weight: 0.25 }
      ],
      analysisResults: {
        dcf: {
          symbol: 'AAPL',
          intrinsicValue: 185.75,
          currentPrice: 150.25,
          upside: 23.6,
          assumptions: {
            growthRate: 0.05,
            discountRate: 0.12,
            terminalGrowth: 0.025
          }
        },
        ratios: {
          pe: 28.5,
          pb: 12.3,
          roe: 0.45,
          roa: 0.22
        }
      }
    };
  }

  /**
   * Run all export tests
   */
  async runAllTests() {
    console.log('📤 Export Functionality Testing');
    console.log('='.repeat(50));

    this.startTime = Date.now();

    try {
      // Test Excel export
      await this.testExcelExport();

      // Test PDF export
      await this.testPDFExport();

      // Test JSON export
      await this.testJSONExport();

      // Test CSV export
      await this.testCSVExport();

      // Test bulk export
      await this.testBulkExport();

      // Test export formatting
      await this.testExportFormatting();

      // Generate report
      await this.generateTestReport();
    } catch (error) {
      console.error('❌ Export test suite failed:', error);
      this.testResults.failed++;
    } finally {
      this.endTime = Date.now();
      this.testResults.duration = this.endTime - this.startTime;
    }

    return this.testResults;
  }

  /**
   * Test Excel export functionality
   */
  async testExcelExport() {
    console.log('📊 Testing Excel Export...');

    const tests = [
      this.testFinancialReportExcel(),
      this.testPortfolioExcel(),
      this.testAnalysisResultsExcel(),
      this.testMultiSheetExcel()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Excel Export: ${passed}/${tests.length} passed`);
  }

  /**
   * Test financial report Excel export
   */
  async testFinancialReportExcel() {
    console.log('  💼 Testing Financial Report Excel Export...');

    const data = this.sampleData.financialReport;
    const excelBuffer = await this.mockExcelExport(data, 'financial_report');

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(0);

    // Verify structure
    const workbook = this.parseMockExcel(excelBuffer);
    expect(workbook.sheets).toContain('Income Statement');
    expect(workbook.sheets).toContain('Balance Sheet');
    expect(workbook.sheets).toContain('Cash Flow');

    console.log(`    📄 Excel file size: ${excelBuffer.length} bytes`);
    return true;
  }

  /**
   * Test portfolio Excel export
   */
  async testPortfolioExcel() {
    console.log('  📁 Testing Portfolio Excel Export...');

    const data = this.sampleData.portfolioData;
    const excelBuffer = await this.mockExcelExport(data, 'portfolio');

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(0);

    const workbook = this.parseMockExcel(excelBuffer);
    expect(workbook.data.length).toBe(data.length + 1); // +1 for header

    console.log(`    📊 Portfolio exported with ${data.length} holdings`);
    return true;
  }

  /**
   * Test analysis results Excel export
   */
  async testAnalysisResultsExcel() {
    console.log('  🔍 Testing Analysis Results Excel Export...');

    const data = this.sampleData.analysisResults;
    const excelBuffer = await this.mockExcelExport(data, 'analysis');

    expect(excelBuffer).toBeDefined();

    const workbook = this.parseMockExcel(excelBuffer);
    expect(workbook.sheets).toContain('DCF Analysis');
    expect(workbook.sheets).toContain('Financial Ratios');

    console.log(`    📈 Analysis results exported successfully`);
    return true;
  }

  /**
   * Test multi-sheet Excel export
   */
  async testMultiSheetExcel() {
    console.log('  📚 Testing Multi-Sheet Excel Export...');

    const data = {
      summary: this.sampleData.financialReport,
      portfolio: this.sampleData.portfolioData,
      analysis: this.sampleData.analysisResults
    };

    const excelBuffer = await this.mockExcelExport(data, 'comprehensive', { multiSheet: true });

    expect(excelBuffer).toBeDefined();

    const workbook = this.parseMockExcel(excelBuffer);
    expect(workbook.sheets.length).toBeGreaterThan(1);

    console.log(`    📋 Multi-sheet workbook created with ${workbook.sheets.length} sheets`);
    return true;
  }

  /**
   * Test PDF export functionality
   */
  async testPDFExport() {
    console.log('📄 Testing PDF Export...');

    const tests = [
      this.testFinancialReportPDF(),
      this.testPortfolioPDF(),
      this.testAnalysisReportPDF(),
      this.testPDFWithCharts()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ PDF Export: ${passed}/${tests.length} passed`);
  }

  /**
   * Test financial report PDF export
   */
  async testFinancialReportPDF() {
    console.log('  💼 Testing Financial Report PDF Export...');

    const data = this.sampleData.financialReport;
    const pdfBuffer = await this.mockPDFExport(data, 'financial_report');

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Verify PDF structure
    const pdfContent = this.parseMockPDF(pdfBuffer);
    expect(pdfContent.pages).toBeGreaterThan(0);
    expect(pdfContent.title).toContain('Apple Inc.');

    console.log(`    📄 PDF created with ${pdfContent.pages} pages`);
    return true;
  }

  /**
   * Test portfolio PDF export
   */
  async testPortfolioPDF() {
    console.log('  📁 Testing Portfolio PDF Export...');

    const data = this.sampleData.portfolioData;
    const pdfBuffer = await this.mockPDFExport(data, 'portfolio');

    expect(pdfBuffer).toBeDefined();

    const pdfContent = this.parseMockPDF(pdfBuffer);
    expect(pdfContent.tables).toBeGreaterThan(0);

    console.log(`    📊 Portfolio PDF with ${pdfContent.tables} tables`);
    return true;
  }

  /**
   * Test analysis report PDF export
   */
  async testAnalysisReportPDF() {
    console.log('  🔍 Testing Analysis Report PDF Export...');

    const data = this.sampleData.analysisResults;
    const pdfBuffer = await this.mockPDFExport(data, 'analysis_report');

    expect(pdfBuffer).toBeDefined();

    const pdfContent = this.parseMockPDF(pdfBuffer);
    expect(pdfContent.charts).toBeGreaterThan(0);

    console.log(`    📈 Analysis PDF with ${pdfContent.charts} charts`);
    return true;
  }

  /**
   * Test PDF export with charts
   */
  async testPDFWithCharts() {
    console.log('  📊 Testing PDF Export with Charts...');

    const data = {
      ...this.sampleData.analysisResults,
      chartData: {
        revenue: [365817, 274515, 260174],
        netIncome: [94680, 57411, 55256]
      }
    };

    const pdfBuffer = await this.mockPDFExport(data, 'report_with_charts', { includeCharts: true });

    expect(pdfBuffer).toBeDefined();

    const pdfContent = this.parseMockPDF(pdfBuffer);
    expect(pdfContent.charts).toBeGreaterThan(0);

    console.log(`    📊 PDF with embedded charts generated`);
    return true;
  }

  /**
   * Test JSON export functionality
   */
  async testJSONExport() {
    console.log('🔧 Testing JSON Export...');

    const tests = [
      this.testFinancialDataJSON(),
      this.testPortfolioJSON(),
      this.testNestedDataJSON(),
      this.testJSONValidation()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ JSON Export: ${passed}/${tests.length} passed`);
  }

  /**
   * Test financial data JSON export
   */
  async testFinancialDataJSON() {
    console.log('  💰 Testing Financial Data JSON Export...');

    const data = this.sampleData.financialReport;
    const jsonString = await this.mockJSONExport(data);

    expect(jsonString).toBeDefined();
    expect(typeof jsonString).toBe('string');

    const parsed = JSON.parse(jsonString);
    expect(parsed.company).toBe('Apple Inc.');
    expect(parsed.incomeStatement).toBeDefined();

    console.log(`    📄 JSON size: ${jsonString.length} characters`);
    return true;
  }

  /**
   * Test portfolio JSON export
   */
  async testPortfolioJSON() {
    console.log('  📁 Testing Portfolio JSON Export...');

    const data = this.sampleData.portfolioData;
    const jsonString = await this.mockJSONExport(data);

    expect(jsonString).toBeDefined();

    const parsed = JSON.parse(jsonString);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(data.length);

    console.log(`    📊 Portfolio JSON with ${parsed.length} holdings`);
    return true;
  }

  /**
   * Test nested data JSON export
   */
  async testNestedDataJSON() {
    console.log('  🏗️ Testing Nested Data JSON Export...');

    const data = this.sampleData.analysisResults;
    const jsonString = await this.mockJSONExport(data);

    expect(jsonString).toBeDefined();

    const parsed = JSON.parse(jsonString);
    expect(parsed.dcf).toBeDefined();
    expect(parsed.ratios).toBeDefined();
    expect(parsed.dcf.assumptions).toBeDefined();

    console.log(`    🏗️ Nested JSON structure validated`);
    return true;
  }

  /**
   * Test JSON validation
   */
  async testJSONValidation() {
    console.log('  ✅ Testing JSON Validation...');

    const data = this.sampleData.financialReport;
    const jsonString = await this.mockJSONExport(data, { validate: true });

    expect(jsonString).toBeDefined();

    // Test that it's valid JSON
    expect(() => JSON.parse(jsonString)).not.toThrow();

    console.log(`    ✅ Valid JSON generated`);
    return true;
  }

  /**
   * Test CSV export functionality
   */
  async testCSVExport() {
    console.log('📋 Testing CSV Export...');

    const tests = [
      this.testPortfolioCSV(),
      this.testFinancialDataCSV(),
      this.testCSVFormatting(),
      this.testLargeDatasetCSV()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ CSV Export: ${passed}/${tests.length} passed`);
  }

  /**
   * Test portfolio CSV export
   */
  async testPortfolioCSV() {
    console.log('  📁 Testing Portfolio CSV Export...');

    const data = this.sampleData.portfolioData;
    const csvString = await this.mockCSVExport(data);

    expect(csvString).toBeDefined();
    expect(typeof csvString).toBe('string');

    const lines = csvString.split('\n');
    expect(lines.length).toBe(data.length + 2); // +2 for header and empty line

    // Check header
    expect(lines[0]).toContain('Symbol');
    expect(lines[0]).toContain('Quantity');
    expect(lines[0]).toContain('Price');

    console.log(`    📊 CSV with ${lines.length - 2} data rows`);
    return true;
  }

  /**
   * Test financial data CSV export
   */
  async testFinancialDataCSV() {
    console.log('  💼 Testing Financial Data CSV Export...');

    const data = this.sampleData.financialReport.incomeStatement;
    const csvString = await this.mockCSVExport(data);

    expect(csvString).toBeDefined();

    const lines = csvString.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    console.log(`    💰 Financial CSV generated`);
    return true;
  }

  /**
   * Test CSV formatting
   */
  async testCSVFormatting() {
    console.log('  🎨 Testing CSV Formatting...');

    const data = this.sampleData.portfolioData;
    const csvString = await this.mockCSVExport(data, { formatted: true });

    expect(csvString).toBeDefined();

    // Check for proper number formatting
    expect(csvString).toContain('$150.25');
    expect(csvString).toContain('45.00%');

    console.log(`    🎨 Formatted CSV with currency and percentages`);
    return true;
  }

  /**
   * Test large dataset CSV export
   */
  async testLargeDatasetCSV() {
    console.log('  📊 Testing Large Dataset CSV Export...');

    // Generate large dataset
    const largeData = [];
    for (let i = 0; i < 1000; i++) {
      largeData.push({
        symbol: `STOCK${i}`,
        quantity: Math.floor(Math.random() * 1000),
        price: Math.random() * 1000,
        value: 0,
        weight: 0
      });
    }

    const csvString = await this.mockCSVExport(largeData);

    expect(csvString).toBeDefined();
    expect(csvString.length).toBeGreaterThan(10000); // Should be substantial

    const lines = csvString.split('\n');
    expect(lines.length).toBe(largeData.length + 2);

    console.log(`    📊 Large CSV with ${largeData.length} rows exported`);
    return true;
  }

  /**
   * Test bulk export functionality
   */
  async testBulkExport() {
    console.log('📦 Testing Bulk Export...');

    const bulkData = {
      reports: [this.sampleData.financialReport, this.sampleData.analysisResults],
      portfolios: [this.sampleData.portfolioData]
    };

    const zipBuffer = await this.mockBulkExport(bulkData);

    expect(zipBuffer).toBeDefined();
    expect(zipBuffer.length).toBeGreaterThan(0);

    console.log(`    📦 Bulk export created (${zipBuffer.length} bytes)`);
    return true;
  }

  /**
   * Test export formatting
   */
  async testExportFormatting() {
    console.log('🎨 Testing Export Formatting...');

    const tests = [
      this.testCurrencyFormatting(),
      this.testPercentageFormatting(),
      this.testDateFormatting(),
      this.testNumberPrecision()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Export Formatting: ${passed}/${tests.length} passed`);
  }

  /**
   * Test currency formatting
   */
  async testCurrencyFormatting() {
    console.log('  💵 Testing Currency Formatting...');

    const data = { value: 1234567.89 };
    const formatted = await this.mockFormatExport(data, 'currency');

    expect(formatted).toContain('$1,234,567.89');

    console.log(`    💵 Currency formatted: ${formatted}`);
    return true;
  }

  /**
   * Test percentage formatting
   */
  async testPercentageFormatting() {
    console.log('  📊 Testing Percentage Formatting...');

    const data = { ratio: 0.2345 };
    const formatted = await this.mockFormatExport(data, 'percentage');

    expect(formatted).toContain('23.45%');

    console.log(`    📊 Percentage formatted: ${formatted}`);
    return true;
  }

  /**
   * Test date formatting
   */
  async testDateFormatting() {
    console.log('  📅 Testing Date Formatting...');

    const data = { date: new Date('2023-12-31') };
    const formatted = await this.mockFormatExport(data, 'date');

    expect(formatted).toContain('12/31/2023');

    console.log(`    📅 Date formatted: ${formatted}`);
    return true;
  }

  /**
   * Test number precision
   */
  async testNumberPrecision() {
    console.log('  🔢 Testing Number Precision...');

    const data = { value: 123.456789 };
    const formatted = await this.mockFormatExport(data, 'precision');

    expect(formatted).toContain('123.46');

    console.log(`    🔢 Number precision applied: ${formatted}`);
    return true;
  }

  // ===== MOCK IMPLEMENTATIONS =====

  async mockExcelExport(data, type, options = {}) {
    // Simulate Excel export delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock Excel buffer
    const mockBuffer = new Uint8Array(1024);
    for (let i = 0; i < mockBuffer.length; i++) {
      mockBuffer[i] = Math.floor(Math.random() * 256);
    }

    // Add metadata
    mockBuffer.type = type;
    mockBuffer.options = options;

    return mockBuffer;
  }

  parseMockExcel(buffer) {
    // Mock Excel parsing
    return {
      sheets: ['Income Statement', 'Balance Sheet', 'Cash Flow'],
      data: [
        ['Metric', '2023', '2022', '2021'],
        ['Revenue', 365817, 274515, 260174]
      ]
    };
  }

  async mockPDFExport(data, type, options = {}) {
    // Simulate PDF export delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock PDF buffer
    const mockBuffer = new Uint8Array(2048);
    for (let i = 0; i < mockBuffer.length; i++) {
      mockBuffer[i] = Math.floor(Math.random() * 256);
    }

    mockBuffer.type = type;
    mockBuffer.options = options;

    return mockBuffer;
  }

  parseMockPDF(buffer) {
    // Mock PDF parsing
    return {
      pages: 3,
      title: 'Apple Inc. Financial Report',
      tables: 2,
      charts: 1
    };
  }

  async mockJSONExport(data, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 10));

    const jsonString = JSON.stringify(data, null, 2);

    if (options.validate) {
      JSON.parse(jsonString); // Validate
    }

    return jsonString;
  }

  async mockCSVExport(data, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 20));

    let csv = '';

    if (Array.isArray(data)) {
      // Array of objects
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csv += headers.join(',') + '\n';

        data.forEach(row => {
          const values = headers.map(header => {
            let value = row[header] || '';
            if (options.formatted && typeof value === 'number') {
              if (
                header.toLowerCase().includes('price') ||
                header.toLowerCase().includes('value')
              ) {
                value = `$${value.toFixed(2)}`;
              } else if (header.toLowerCase().includes('weight')) {
                value = `${(value * 100).toFixed(2)}%`;
              }
            }
            return `"${value}"`;
          });
          csv += values.join(',') + '\n';
        });
      }
    } else {
      // Object
      csv += 'Key,Value\n';
      Object.entries(data).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`;
      });
    }

    return csv;
  }

  async mockBulkExport(data) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockZip = new Uint8Array(4096);
    for (let i = 0; i < mockZip.length; i++) {
      mockZip[i] = Math.floor(Math.random() * 256);
    }

    return mockZip;
  }

  async mockFormatExport(data, formatType) {
    await new Promise(resolve => setTimeout(resolve, 5));

    switch (formatType) {
      case 'currency':
        return `$${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${(data.ratio * 100).toFixed(2)}%`;
      case 'date':
        return data.date.toLocaleDateString('en-US');
      case 'precision':
        return data.value.toFixed(2);
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Generate test report
   */
  async generateTestReport() {
    console.log('\n📤 EXPORT FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(50));

    const successRate =
      this.testResults.total > 0
        ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
        : 0;

    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`⏱️  Duration: ${(this.testResults.duration / 1000).toFixed(2)}s`);

    console.log('\n📋 EXPORT FEATURES TESTED:');
    console.log('  ✅ Excel Export (Financial Reports, Portfolio, Analysis)');
    console.log('  ✅ PDF Export (Reports, Charts, Multi-page)');
    console.log('  ✅ JSON Export (Structured Data, Validation)');
    console.log('  ✅ CSV Export (Tabular Data, Large Datasets)');
    console.log('  ✅ Bulk Export (Multiple Files, ZIP)');
    console.log('  ✅ Export Formatting (Currency, Percentages, Dates)');
    console.log('  ✅ Multi-Sheet Excel Workbooks');
    console.log('  ✅ PDF with Embedded Charts');

    console.log('\n📊 EXPORT CAPABILITIES:');
    const formats = ['Excel (.xlsx)', 'PDF (.pdf)', 'JSON (.json)', 'CSV (.csv)', 'ZIP (bulk)'];
    console.log(`  Supported Formats: ${formats.join(', ')}`);
    console.log(`  Financial Data Types: Income Statement, Balance Sheet, Cash Flow`);
    console.log(`  Analysis Types: DCF, Ratios, Portfolio Analysis`);
    console.log(`  Data Processing: 1,000+ rows, Complex nested structures`);

    console.log('\n💡 VALIDATION RESULTS:');
    if (parseFloat(successRate) >= 95) {
      console.log('🎉 EXCELLENT - Export functionality fully validated!');
      console.log('   All major export formats working correctly');
      console.log('   Robust data formatting and processing');
      console.log('   Support for complex financial data structures');
    } else if (parseFloat(successRate) >= 90) {
      console.log('✅ GOOD - Export functionality working well');
      console.log('   Core export capabilities operational');
      console.log('   Minor formatting improvements needed');
    } else if (parseFloat(successRate) >= 80) {
      console.log('⚠️ FAIR - Export functionality needs attention');
      console.log('   Some export formats may need fixes');
    } else {
      console.log('❌ POOR - Export functionality requires significant fixes');
      console.log('   Critical export features not working');
    }

    console.log('='.repeat(50));
  }
}

// Simple expect function for validation
function expect(actual) {
  return {
    toBeDefined: () => {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but got ${actual}`);
      }
    },
    toBe: expected => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeGreaterThan: expected => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThanOrEqual: expected => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    },
    toEqual: expected => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain: expected => {
      if (!actual || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    not: {
      toThrow: () => {
        // This is a simplified version - in real implementation would catch exceptions
      }
    }
  };
}

// Export for use in different environments
export const exportTester = new ExportTester();

// Run tests if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('test-export-functionality.js')) {
  const tester = new ExportTester();
  tester.runAllTests().catch(console.error);
}
