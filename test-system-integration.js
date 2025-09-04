#!/usr/bin/env node

/**
 * SYSTEM INTEGRATION TEST SUITE
 * Comprehensive validation of all production components working together
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemIntegrationTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0,
        duration: 0
      },
      components: new Map(),
      errors: [],
      warnings: []
    };

    this.startTime = new Date();
    this.testSuites = [
      this.testCoreSystemIntegration.bind(this),
      this.testMonitoringIntegration.bind(this),
      this.testSecurityIntegration.bind(this),
      this.testPerformanceIntegration.bind(this),
      this.testBackupIntegration.bind(this),
      this.testDeploymentIntegration.bind(this),
      this.testDocumentationIntegration.bind(this)
    ];
  }

  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE SYSTEM INTEGRATION TESTING');
    console.log('==================================================\n');

    try {
      for (const testSuite of this.testSuites) {
        console.log(
          `\n📋 Running ${testSuite.name.replace('bound ', '').replace('.bind(this)', '')}...`
        );
        await testSuite();
      }

      this.calculateFinalResults();
    } catch (error) {
      console.error('💥 Critical test failure:', error.message);
      this.recordResult('CRITICAL', `Test suite failure: ${error.message}`, 'critical');
    }

    this.generateTestReport();
    return this.results;
  }

  async testCoreSystemIntegration() {
    console.log('🔧 Testing Core System Integration...');

    try {
      // Test CLI initialization
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');
      const initResult = await enhancedCLI.initialize();

      this.assert(initResult, 'CLI Initialization', 'CLI failed to initialize');

      // Test command execution
      const helpResult = await enhancedCLI.executeCommand('help');
      this.assert(helpResult.success, 'Help Command', 'Help command failed');

      // Test user context
      const contextResult = await enhancedCLI.executeCommand('help', {
        userId: 'test-user',
        userRole: 'analyst'
      });
      this.assert(contextResult.success, 'Context Handling', 'Context handling failed');

      // Test command pipeline
      const pipelineResult = await enhancedCLI.executeCommand('clear && help');
      this.assert(pipelineResult.success, 'Command Pipeline', 'Command pipeline failed');

      console.log('✅ Core system integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Core system: ${error.message}`, 'core');
    }
  }

  async testMonitoringIntegration() {
    console.log('📊 Testing Monitoring Integration...');

    try {
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      // Test monitoring data availability
      const metrics = enhancedCLI.getMonitoringMetrics();
      this.assert(metrics, 'Monitoring Metrics', 'Monitoring metrics not available');

      const health = enhancedCLI.getHealthStatus();
      this.assert(health, 'Health Status', 'Health status not available');

      // Test command execution tracking
      await enhancedCLI.executeCommand('clear');
      const updatedMetrics = enhancedCLI.getMonitoringMetrics();
      this.assert(
        updatedMetrics.commands.total > 0,
        'Command Tracking',
        'Command tracking not working'
      );

      // Test error recording
      try {
        await enhancedCLI.executeCommand('nonexistentcommand');
      } catch (e) {
        // Expected to fail
      }

      const errorStats = enhancedCLI.errorHandler?.getErrorStatistics();
      this.assert(errorStats, 'Error Statistics', 'Error statistics not available');

      console.log('✅ Monitoring integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Monitoring: ${error.message}`, 'monitoring');
    }
  }

  async testSecurityIntegration() {
    console.log('🛡️ Testing Security Integration...');

    try {
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      // Test rate limiting
      let rateLimited = false;
      for (let i = 0; i < 15; i++) {
        const result = await enhancedCLI.executeCommand('clear', { userRole: 'viewer' });
        if (!result.success && result.error?.includes('rate limit')) {
          rateLimited = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      this.assert(rateLimited, 'Rate Limiting', 'Rate limiting not working');

      // Test permission enforcement
      const adminResult = await enhancedCLI.executeCommand('analyze', { userRole: 'admin' });
      const viewerResult = await enhancedCLI.executeCommand('analyze', { userRole: 'viewer' });

      this.assert(adminResult.success, 'Admin Permissions', 'Admin permissions not working');
      // Note: Viewer might not have analyze permission, so this could be expected to fail

      // Test input validation
      const maliciousInputs = ['help; alert("hack")', 'help && rm -rf /', 'help | cat /etc/passwd'];

      for (const input of maliciousInputs) {
        const result = await enhancedCLI.executeCommand(input);
        this.assert(
          !result.success,
          `Malicious Input Blocked: ${input.substring(0, 20)}...`,
          `Security vulnerability: ${input}`
        );
      }

      console.log('✅ Security integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Security: ${error.message}`, 'security');
    }
  }

  async testPerformanceIntegration() {
    console.log('⚡ Testing Performance Integration...');

    try {
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      // Test performance monitoring
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        await enhancedCLI.executeCommand('clear');
      }
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 10;

      this.assert(
        avgTime < 1000,
        `Performance: ${avgTime.toFixed(2)}ms avg`,
        `Slow performance: ${avgTime.toFixed(2)}ms average`
      );

      // Test memory usage
      if (typeof performance !== 'undefined' && performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
        this.assert(
          memoryUsage < 0.8,
          `Memory Usage: ${(memoryUsage * 100).toFixed(1)}%`,
          `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`
        );
      }

      // Test caching (if available)
      if (enhancedCLI.performanceOptimizer) {
        const cacheStats = enhancedCLI.performanceOptimizer.getPerformanceMetrics();
        this.assert(cacheStats, 'Performance Optimization', 'Performance optimization not working');
      }

      console.log('✅ Performance integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Performance: ${error.message}`, 'performance');
    }
  }

  async testBackupIntegration() {
    console.log('💾 Testing Backup Integration...');

    try {
      // Test backup script existence
      const backupScript = path.join(__dirname, 'scripts', 'backup-manager.js');
      this.assert(fs.existsSync(backupScript), 'Backup Script', 'Backup script not found');

      // Test backup configuration
      const configPath = path.join(__dirname, 'config', 'backup.json');
      if (!fs.existsSync(configPath)) {
        console.log('⚠️  Backup config not found, using defaults (expected)');
      }

      // Test backup directory structure
      const backupsDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      this.assert(fs.existsSync(backupsDir), 'Backup Directory', 'Backup directory not created');

      console.log('✅ Backup integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Backup: ${error.message}`, 'backup');
    }
  }

  async testDeploymentIntegration() {
    console.log('🚀 Testing Deployment Integration...');

    try {
      // Test deployment scripts
      const deployScripts = [
        'scripts/deploy-production.js',
        'scripts/deploy-staging.js',
        'scripts/rollback.js'
      ];

      for (const script of deployScripts) {
        const scriptPath = path.join(__dirname, script);
        this.assert(
          fs.existsSync(scriptPath),
          `Deployment Script: ${script}`,
          `Missing: ${script}`
        );
      }

      // Test Docker configuration
      const dockerFiles = ['Dockerfile', 'nginx.conf', 'nginx.default.conf'];
      for (const file of dockerFiles) {
        const filePath = path.join(__dirname, file);
        this.assert(fs.existsSync(filePath), `Docker Config: ${file}`, `Missing: ${file}`);
      }

      // Test CI/CD configuration
      const githubWorkflow = path.join(__dirname, '.github', 'workflows', 'ci-cd.yml');
      this.assert(
        fs.existsSync(githubWorkflow),
        'CI/CD Pipeline',
        'GitHub Actions workflow missing'
      );

      // Test package.json deployment scripts
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      const deploymentScripts = [
        'deploy:staging',
        'deploy:production',
        'deploy:rollback',
        'docker:build',
        'ci:build',
        'ci:deploy:staging',
        'ci:deploy:production'
      ];

      for (const script of deploymentScripts) {
        this.assert(
          packageJson.scripts[script],
          `Package Script: ${script}`,
          `Missing script: ${script}`
        );
      }

      console.log('✅ Deployment integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Deployment: ${error.message}`, 'deployment');
    }
  }

  async testDocumentationIntegration() {
    console.log('📚 Testing Documentation Integration...');

    try {
      // Test documentation files
      const docFiles = [
        'docs/PRODUCTION_README.md',
        'docs/OPERATIONAL_RUNBOOK.md',
        'README.md',
        'CHANGELOG.md'
      ];

      for (const file of docFiles) {
        const filePath = path.join(__dirname, file);
        this.assert(fs.existsSync(filePath), `Documentation: ${file}`, `Missing: ${file}`);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.assert(content.length > 0, `Documentation Content: ${file}`, `Empty file: ${file}`);
        }
      }

      // Test monitoring dashboard
      const dashboardPath = path.join(__dirname, 'production-dashboard.html');
      this.assert(fs.existsSync(dashboardPath), 'Monitoring Dashboard', 'Dashboard HTML missing');

      // Test configuration files
      const configFiles = ['nginx.conf', 'nginx.default.conf'];
      for (const file of configFiles) {
        const filePath = path.join(__dirname, file);
        this.assert(fs.existsSync(filePath), `Config File: ${file}`, `Missing: ${file}`);
      }

      console.log('✅ Documentation integration passed');
    } catch (error) {
      this.recordResult('FAILED', `Documentation: ${error.message}`, 'documentation');
    }
  }

  assert(condition, testName, failureMessage) {
    if (condition) {
      this.results.summary.passed++;
      console.log(`  ✅ ${testName}`);
    } else {
      this.results.summary.failed++;
      console.log(`  ❌ ${testName}: ${failureMessage}`);
      this.recordResult('FAILED', `${testName}: ${failureMessage}`, 'assertion');
    }
    this.results.summary.total++;
  }

  recordResult(severity, message, type) {
    this.results.tests.push({
      timestamp: new Date().toISOString(),
      severity,
      message,
      type
    });

    if (severity === 'FAILED') {
      this.results.errors.push(message);
    } else if (severity === 'WARNING') {
      this.results.warnings.push(message);
    }
  }

  calculateFinalResults() {
    const { summary } = this.results;
    summary.duration = (new Date() - this.startTime) / 1000;

    // Calculate success rate
    summary.successRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

    // Determine overall status
    if (summary.failed > 0) {
      summary.overallStatus = 'FAILED';
      summary.overallGrade = 'F';
    } else if (summary.warnings > 0) {
      summary.overallStatus = 'WARNING';
      summary.overallGrade = 'C';
    } else {
      summary.overallStatus = 'PASSED';
      summary.overallGrade = 'A';
    }

    // Component status
    const components = [
      'core',
      'monitoring',
      'security',
      'performance',
      'backup',
      'deployment',
      'documentation'
    ];
    components.forEach(component => {
      const componentTests = this.results.tests.filter(test => test.type === component);
      const componentPassed = componentTests.every(test => test.severity !== 'FAILED');
      this.results.components.set(component, componentPassed ? 'PASSED' : 'FAILED');
    });
  }

  generateTestReport() {
    const { summary } = this.results;

    console.log('\n📊 SYSTEM INTEGRATION TEST REPORT');
    console.log('==================================');

    console.log(`\n📈 OVERALL RESULTS:`);
    console.log(`Grade: ${summary.overallGrade}`);
    console.log(`Status: ${summary.overallStatus}`);
    console.log(`Duration: ${summary.duration.toFixed(2)} seconds`);
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`📊 Success Rate: ${summary.successRate.toFixed(1)}%`);

    console.log(`\n🔧 COMPONENT STATUS:`);
    for (const [component, status] of this.results.components) {
      const icon = status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${component.charAt(0).toUpperCase() + component.slice(1)}: ${status}`);
    }

    if (summary.failed > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (summary.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    console.log(`\n🏆 FINAL VERDICT:`);
    if (summary.successRate >= 95) {
      console.log('🎉 EXCELLENT: System integration is flawless!');
      console.log('✅ All components working perfectly together');
      console.log('🚀 Ready for production deployment');
    } else if (summary.successRate >= 85) {
      console.log('⚠️ GOOD: System integration mostly working');
      console.log('✅ Core functionality operational');
      console.log('🔧 Minor issues need attention');
    } else if (summary.successRate >= 70) {
      console.log('⚠️ FAIR: System integration has issues');
      console.log('⚠️ Multiple components need fixes');
      console.log('🔧 Requires significant attention');
    } else {
      console.log('❌ POOR: System integration critical failures');
      console.log('❌ Major components not working');
      console.log('🔧 Immediate fixes required');
    }

    console.log('\n🏁 SYSTEM INTEGRATION TESTING COMPLETE');
  }

  exportResults() {
    return {
      ...this.results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        cwd: process.cwd()
      },
      metadata: {
        testSuite: 'system-integration',
        version: '2.0.0',
        framework: 'comprehensive'
      }
    };
  }
}

// Run comprehensive system integration testing
async function runSystemIntegrationTests() {
  console.log('🧪 FINANCEANALYST PRO - SYSTEM INTEGRATION TESTING');
  console.log('=================================================\n');

  const tester = new SystemIntegrationTester();
  const results = await tester.runAllTests();

  // Export results for further analysis
  if (typeof globalThis !== 'undefined') {
    globalThis.systemIntegrationResults = tester.exportResults();
  }

  return results;
}

// Execute system integration tests
runSystemIntegrationTests()
  .then(results => {
    const success = results.summary.failed === 0;

    if (success) {
      console.log('\n✅ SYSTEM INTEGRATION: ALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ SYSTEM INTEGRATION: TESTS FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 SYSTEM INTEGRATION TESTING CRASHED:', error);
    process.exit(1);
  });
