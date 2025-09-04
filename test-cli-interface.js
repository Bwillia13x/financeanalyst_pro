/**
 * CLI Interface Testing Script
 * Tests the command-line interface with sample commands and validates outputs
 */

import { CLIService } from './src/services/cli/cliService.js';

class CLITester {
  constructor() {
    this.cliService = new CLIService();
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run all CLI interface tests
   */
  async runAllTests() {
    console.log('💻 CLI Interface Testing');
    console.log('='.repeat(50));

    this.startTime = Date.now();

    try {
      // Test basic CLI functionality
      await this.testBasicCommands();
      await this.testFinancialCommands();
      await this.testAnalysisCommands();
      await this.testUtilityCommands();
      await this.testCommandParsing();
      await this.testAutoComplete();

      // Generate report
      await this.generateTestReport();
    } catch (error) {
      console.error('❌ CLI Test suite failed:', error);
      this.testResults.failed++;
    } finally {
      this.endTime = Date.now();
      this.testResults.duration = this.endTime - this.startTime;
    }

    return this.testResults;
  }

  /**
   * Test basic system commands
   */
  async testBasicCommands() {
    console.log('🧪 Testing Basic Commands...');

    const tests = [
      this.testHelpCommand(),
      this.testHistoryCommand(),
      this.testClearCommand(),
      this.testExitCommand()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Basic Commands: ${passed}/${tests.length} passed`);
  }

  /**
   * Test help command
   */
  async testHelpCommand() {
    console.log('  📖 Testing Help Command...');

    // Test general help
    const generalHelp = await this.cliService.executeCommand('help');
    expect(generalHelp.type).toBe('success');
    expect(generalHelp.content).toContain('Available Commands');
    expect(generalHelp.content).toContain('SYSTEM:');

    // Test specific command help
    const specificHelp = await this.cliService.executeCommand('help analyze');
    expect(specificHelp.type).toBe('success');
    expect(specificHelp.content).toContain('ANALYZE');
    expect(specificHelp.content).toContain('Description:');

    console.log('    ✅ Help command working correctly');
    return true;
  }

  /**
   * Test history command
   */
  async testHistoryCommand() {
    console.log('  📜 Testing History Command...');

    // Add some commands to history
    await this.cliService.executeCommand('help');
    await this.cliService.executeCommand('quote AAPL');
    await this.cliService.executeCommand('analyze stock MSFT');

    // Test history display
    const history = await this.cliService.executeCommand('history');
    expect(history.type).toBe('success');
    expect(history.content).toContain('Command History:');
    expect(history.content).toContain('help');
    expect(history.content).toContain('quote AAPL');

    console.log('    ✅ History command working correctly');
    return true;
  }

  /**
   * Test clear command
   */
  async testClearCommand() {
    console.log('  🧹 Testing Clear Command...');

    const result = await this.cliService.executeCommand('clear');
    expect(result.type).toBe('success');
    expect(result.content.action).toBe('clear_output');

    console.log('    ✅ Clear command working correctly');
    return true;
  }

  /**
   * Test exit command
   */
  async testExitCommand() {
    console.log('  🚪 Testing Exit Command...');

    const result = await this.cliService.executeCommand('exit');
    expect(result.type).toBe('success');
    expect(result.content.action).toBe('exit_cli');

    console.log('    ✅ Exit command working correctly');
    return true;
  }

  /**
   * Test financial analysis commands
   */
  async testFinancialCommands() {
    console.log('📊 Testing Financial Commands...');

    const tests = [this.testQuoteCommand(), this.testAnalyzeCommand(), this.testPortfolioCommand()];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Financial Commands: ${passed}/${tests.length} passed`);
  }

  /**
   * Test quote command
   */
  async testQuoteCommand() {
    console.log('  💰 Testing Quote Command...');

    const result = await this.cliService.executeCommand('quote AAPL');
    expect(result.type).toBe('success');
    expect(result.content).toContain('AAPL Quote:');
    expect(result.content).toContain('Price: $');
    expect(result.content).toContain('Change:');

    // Test with detailed flag
    const detailedResult = await this.cliService.executeCommand('quote MSFT --detailed');
    expect(detailedResult.type).toBe('success');
    expect(detailedResult.content).toContain('Volume:');
    expect(detailedResult.content).toContain('Market Cap:');

    console.log('    ✅ Quote command working correctly');
    return true;
  }

  /**
   * Test analyze command
   */
  async testAnalyzeCommand() {
    console.log('  🔍 Testing Analyze Command...');

    // Test stock analysis
    const stockResult = await this.cliService.executeCommand('analyze stock AAPL');
    expect(stockResult.type).toBe('success');
    expect(stockResult.content).toContain('Analyzing AAPL');

    // Test DCF analysis
    const dcfResult = await this.cliService.executeCommand(
      'analyze dcf --symbol TSLA --growth 0.05'
    );
    expect(dcfResult.type).toBe('success');
    expect(dcfResult.content).toContain('Analyzing TSLA');

    // Test invalid analysis type
    const invalidResult = await this.cliService.executeCommand('analyze invalid');
    expect(invalidResult.type).toBe('success');
    expect(invalidResult.content).toContain('Unknown analysis type');

    console.log('    ✅ Analyze command working correctly');
    return true;
  }

  /**
   * Test portfolio command
   */
  async testPortfolioCommand() {
    console.log('  📁 Testing Portfolio Command...');

    // Test portfolio creation
    const createResult = await this.cliService.executeCommand('portfolio create test_portfolio');
    expect(createResult.type).toBe('success');
    expect(createResult.content).toContain('Created portfolio: test_portfolio');

    // Test portfolio listing
    const listResult = await this.cliService.executeCommand('portfolio list');
    expect(listResult.type).toBe('success');
    expect(listResult.content).toBeDefined();

    // Test adding to portfolio
    const addResult = await this.cliService.executeCommand('portfolio add AAPL 100');
    expect(addResult.type).toBe('success');
    expect(addResult.content).toBeDefined();

    console.log('    ✅ Portfolio command working correctly');
    return true;
  }

  /**
   * Test analysis-specific commands
   */
  async testAnalysisCommands() {
    console.log('🧮 Testing Analysis Commands...');

    const tests = [this.testESGCommand(), this.testCalculatorCommand(), this.testChartCommand()];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Analysis Commands: ${passed}/${tests.length} passed`);
  }

  /**
   * Test ESG command
   */
  async testESGCommand() {
    console.log('  🌱 Testing ESG Command...');

    const result = await this.cliService.executeCommand('esg score AAPL');
    expect(result.type).toBe('success');
    expect(result.content).toContain('AAPL ESG Score:');
    expect(result.content).toContain('/100');

    console.log('    ✅ ESG command working correctly');
    return true;
  }

  /**
   * Test calculator command
   */
  async testCalculatorCommand() {
    console.log('  🔢 Testing Calculator Command...');

    // Test IRR calculation
    const irrResult = await this.cliService.executeCommand('calc irr 1000 1200 1400');
    expect(irrResult.type).toBe('success');
    expect(irrResult.content).toBeDefined();

    // Test NPV calculation
    const npvResult = await this.cliService.executeCommand('calc npv 0.1 -1000 300 400 500');
    expect(npvResult.type).toBe('success');
    expect(npvResult.content).toBeDefined();

    console.log('    ✅ Calculator command working correctly');
    return true;
  }

  /**
   * Test chart command
   */
  async testChartCommand() {
    console.log('  📈 Testing Chart Command...');

    const result = await this.cliService.executeCommand('chart AAPL');
    expect(result.type).toBe('success');
    expect(result.content).toBeDefined();

    // Test with options
    const optionsResult = await this.cliService.executeCommand('chart MSFT --indicators rsi,macd');
    expect(optionsResult.type).toBe('success');
    expect(optionsResult.content).toBeDefined();

    console.log('    ✅ Chart command working correctly');
    return true;
  }

  /**
   * Test utility commands
   */
  async testUtilityCommands() {
    console.log('🔧 Testing Utility Commands...');

    const tests = [this.testExportCommand(), this.testTutorialCommand(), this.testDocsCommand()];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Utility Commands: ${passed}/${tests.length} passed`);
  }

  /**
   * Test export command
   */
  async testExportCommand() {
    console.log('  📤 Testing Export Command...');

    const result = await this.cliService.executeCommand('export analysis --format csv');
    expect(result.type).toBe('success');
    expect(result.content).toBeDefined();

    console.log('    ✅ Export command working correctly');
    return true;
  }

  /**
   * Test tutorial command
   */
  async testTutorialCommand() {
    console.log('  📚 Testing Tutorial Command...');

    const result = await this.cliService.executeCommand('tutorial');
    expect(result.type).toBe('success');
    expect(result.content).toBeDefined();

    console.log('    ✅ Tutorial command working correctly');
    return true;
  }

  /**
   * Test docs command
   */
  async testDocsCommand() {
    console.log('  📖 Testing Docs Command...');

    const result = await this.cliService.executeCommand('docs commands');
    expect(result.type).toBe('success');
    expect(result.content).toBeDefined();

    console.log('    ✅ Docs command working correctly');
    return true;
  }

  /**
   * Test command parsing functionality
   */
  async testCommandParsing() {
    console.log('🔍 Testing Command Parsing...');

    const tests = [
      this.testSimpleParsing(),
      this.testArgumentParsing(),
      this.testFlagParsing(),
      this.testAliasResolution()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Command Parsing: ${passed}/${tests.length} passed`);
  }

  /**
   * Test simple command parsing
   */
  async testSimpleParsing() {
    console.log('  📝 Testing Simple Command Parsing...');

    const parsed = this.cliService.parseCommand('help analyze');
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe('help');
    expect(parsed.args.positional).toContain('analyze');

    console.log('    ✅ Simple parsing working correctly');
    return true;
  }

  /**
   * Test argument parsing
   */
  async testArgumentParsing() {
    console.log('  🔧 Testing Argument Parsing...');

    const parsed = this.cliService.parseCommand('quote AAPL --detailed --period 1mo');
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe('quote');
    expect(parsed.args.positional).toContain('AAPL');
    expect(parsed.args.flags.detailed).toBe(true);
    expect(parsed.args.options.period).toBe('1mo');

    console.log('    ✅ Argument parsing working correctly');
    return true;
  }

  /**
   * Test flag parsing
   */
  async testFlagParsing() {
    console.log('  🚩 Testing Flag Parsing...');

    const parsed = this.cliService.parseCommand('analyze stock AAPL --verbose -q');
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe('analyze');
    expect(parsed.args.positional).toContain('stock');
    expect(parsed.args.positional).toContain('AAPL');
    expect(parsed.args.flags.verbose).toBe(true);
    expect(parsed.args.flags.q).toBe(true);

    console.log('    ✅ Flag parsing working correctly');
    return true;
  }

  /**
   * Test alias resolution
   */
  async testAliasResolution() {
    console.log('  🔗 Testing Alias Resolution...');

    // Test command execution with alias
    const result = await this.cliService.executeCommand('h'); // 'h' is alias for 'help'
    expect(result.type).toBe('success');
    expect(result.content).toContain('Available Commands');

    console.log('    ✅ Alias resolution working correctly');
    return true;
  }

  /**
   * Test auto-complete functionality
   */
  async testAutoComplete() {
    console.log('⚡ Testing Auto-Complete...');

    const tests = [this.testCommandAutoComplete(), this.testSuggestionGeneration()];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.testResults.total += tests.length;
    this.testResults.passed += passed;
    this.testResults.failed += failed;

    console.log(`✅ Auto-Complete: ${passed}/${tests.length} passed`);
  }

  /**
   * Test command auto-completion
   */
  async testCommandAutoComplete() {
    console.log('  ⌨️ Testing Command Auto-Complete...');

    // Test partial command completion
    const completed = this.cliService.autoComplete('hel');
    expect(completed).toBe('help ');

    // Test full command (should not add space)
    const noChange = this.cliService.autoComplete('help');
    expect(noChange).toBe('help');

    console.log('    ✅ Command auto-complete working correctly');
    return true;
  }

  /**
   * Test suggestion generation
   */
  async testSuggestionGeneration() {
    console.log('  💡 Testing Suggestion Generation...');

    const suggestions = this.cliService.getCommandSuggestions('ana');
    expect(suggestions).toContain('analyze');
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);

    console.log('    ✅ Suggestion generation working correctly');
    return true;
  }

  /**
   * Generate test report
   */
  async generateTestReport() {
    console.log('\n💻 CLI INTERFACE TEST REPORT');
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

    console.log('\n🎯 CLI FEATURES TESTED:');
    console.log('  ✅ Basic Commands (help, history, clear, exit)');
    console.log('  ✅ Financial Commands (quote, analyze, portfolio)');
    console.log('  ✅ Analysis Commands (ESG, calculator, chart)');
    console.log('  ✅ Utility Commands (export, tutorial, docs)');
    console.log('  ✅ Command Parsing (arguments, flags, options)');
    console.log('  ✅ Auto-Complete and Suggestions');
    console.log('  ✅ Alias Resolution');
    console.log('  ✅ Error Handling');

    console.log('\n📈 CLI PERFORMANCE METRICS:');
    const commandCount = this.cliService.commandHistory.length;
    console.log(`  Commands Processed: ${commandCount}`);
    console.log(
      `  Commands per Second: ${(commandCount / (this.testResults.duration / 1000)).toFixed(2)}`
    );

    console.log('\n💡 VALIDATION RESULTS:');
    if (parseFloat(successRate) >= 95) {
      console.log('🎉 EXCELLENT - CLI interface fully validated!');
      console.log('   All core commands working correctly');
      console.log('   Command parsing robust and reliable');
      console.log('   Auto-complete and suggestions functional');
    } else if (parseFloat(successRate) >= 90) {
      console.log('✅ GOOD - CLI interface working well with minor issues');
    } else if (parseFloat(successRate) >= 80) {
      console.log('⚠️ FAIR - CLI interface needs some attention');
    } else {
      console.log('❌ POOR - CLI interface requires significant fixes');
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
    toContain: expected => {
      if (!actual || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeGreaterThan: expected => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan: expected => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

// Export for use in different environments
export const cliTester = new CLITester();

// Run tests if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('test-cli-interface.js')) {
  const tester = new CLITester();
  tester.runAllTests().catch(console.error);
}
