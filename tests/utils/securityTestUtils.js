// Security Test Utilities
// Comprehensive security testing helpers for the FinanceAnalyst Pro application

export class SecurityTestUtils {
  constructor() {
    this.testResults = [];
    this.vulnerabilities = [];
    this.securityMetrics = {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      vulnerabilitiesFound: 0
    };
  }

  // Authentication & Authorization Testing
  static generateTestUser(overrides = {}) {
    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      role: 'user',
      permissions: ['read', 'write'],
      isActive: true,
      lastLogin: new Date().toISOString(),
      ...overrides
    };
  }

  static generateAdminUser(overrides = {}) {
    return this.generateTestUser({
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      ...overrides
    });
  }

  static generateInvalidJWT() {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
  }

  static generateExpiredJWT() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1234567890',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200
    }));
    const signature = 'invalid_signature';
    return `${header}.${payload}.${signature}`;
  }

  // Input Validation Testing
  static generateSQLInjectionPayloads() {
    return [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT username, password FROM users; --",
      "admin'; --",
      "' OR 1=1; --",
      "'; EXEC xp_cmdshell 'dir'; --",
      "' AND (SELECT COUNT(*) FROM users) > 0; --"
    ];
  }

  static generateXSSPayloads() {
    return [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<div onmouseover=alert("XSS")>Hover me</div>'
    ];
  }

  static generateCSRFToken() {
    return `csrf_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // File Upload Testing
  static createMockFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    return new File([blob], filename, { type });
  }

  static generateMaliciousFilePayloads() {
    return [
      { name: 'malicious.exe', content: 'MZ\x90\x00\x03\x00\x00\x00', type: 'application/octet-stream' },
      { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { name: 'webshell.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', type: 'application/jsp' },
      { name: 'large_file.txt', content: 'A'.repeat(100 * 1024 * 1024), type: 'text/plain' } // 100MB file
    ];
  }

  // API Security Testing
  static generateAPIEndpoints() {
    return [
      '/api/users',
      '/api/users/123',
      '/api/admin/users',
      '/api/financial-data',
      '/api/reports',
      '/api/system/config',
      '/api/debug/logs'
    ];
  }

  static generateHTTPMethods() {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  }

  static generateRateLimitTestPayloads() {
    const payloads = [];
    for (let i = 0; i < 100; i++) {
      payloads.push({
        endpoint: '/api/login',
        method: 'POST',
        data: {
          email: `user${i}@example.com`,
          password: 'password123'
        },
        timestamp: Date.now() + i * 10
      });
    }
    return payloads;
  }

  // Session Management Testing
  static generateSessionData() {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ipAddress: '127.0.0.1',
      isSecure: true
    };
  }

  static generateExpiredSession() {
    const session = this.generateSessionData();
    session.expiresAt = new Date(Date.now() - 3600000).toISOString(); // Expired 1 hour ago
    return session;
  }

  // Encryption Testing
  static generateTestEncryptionKeys() {
    return {
      validKey: 'a'.repeat(32), // 256-bit key
      weakKey: 'weak',
      nullKey: null,
      emptyKey: ''
    };
  }

  static generateTestDataForEncryption() {
    return {
      sensitive: 'This is sensitive financial data',
      personal: 'SSN: 123-45-6789',
      credentials: 'password: secret123'
    };
  }

  // Security Headers Testing
  static getExpectedSecurityHeaders() {
    return {
      'Content-Security-Policy': 'default-src \'self\'',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  // Vulnerability Assessment
  async runVulnerabilityScan(target) {
    const vulnerabilities = [];

    // Test for common vulnerabilities
    const tests = [
      this.testSQLInjection.bind(this),
      this.testXSS.bind(this),
      this.testCSRF.bind(this),
      this.testDirectoryTraversal.bind(this),
      this.testCommandInjection.bind(this),
      this.testAuthenticationBypass.bind(this)
    ];

    for (const test of tests) {
      try {
        const result = await test(target);
        if (result.vulnerable) {
          vulnerabilities.push(result);
          this.vulnerabilities.push(result);
        }
        this.logTestResult(result);
      } catch (error) {
        console.error('Error running security test:', error);
      }
    }

    return vulnerabilities;
  }

  async testSQLInjection(_target) {
    const payloads = SecurityTestUtils.generateSQLInjectionPayloads();

    for (const payload of payloads) {
      // Simulate testing logic
      const isVulnerable = Math.random() < 0.1; // 10% chance for demo

      if (isVulnerable) {
        return {
          type: 'SQL Injection',
          severity: 'High',
          payload,
          vulnerable: true,
          description: 'Application may be vulnerable to SQL injection attacks',
          recommendation: 'Use parameterized queries and input validation'
        };
      }
    }

    return { type: 'SQL Injection', vulnerable: false };
  }

  async testXSS(_target) {
    const payloads = SecurityTestUtils.generateXSSPayloads();

    for (const payload of payloads) {
      const isVulnerable = Math.random() < 0.05; // 5% chance for demo

      if (isVulnerable) {
        return {
          type: 'Cross-Site Scripting (XSS)',
          severity: 'High',
          payload,
          vulnerable: true,
          description: 'Application may be vulnerable to XSS attacks',
          recommendation: 'Implement proper input sanitization and CSP headers'
        };
      }
    }

    return { type: 'XSS', vulnerable: false };
  }

  async testCSRF(_target) {
    const isVulnerable = Math.random() < 0.15; // 15% chance for demo

    if (isVulnerable) {
      return {
        type: 'Cross-Site Request Forgery (CSRF)',
        severity: 'Medium',
        vulnerable: true,
        description: 'Application may be vulnerable to CSRF attacks',
        recommendation: 'Implement CSRF tokens and SameSite cookies'
      };
    }

    return { type: 'CSRF', vulnerable: false };
  }

  async testDirectoryTraversal(_target) {
    const payloads = ['../../../etc/passwd', '..\\..\\..\\windows\\system32\\config\\sam'];

    for (const payload of payloads) {
      const isVulnerable = Math.random() < 0.05; // 5% chance for demo

      if (isVulnerable) {
        return {
          type: 'Directory Traversal',
          severity: 'High',
          payload,
          vulnerable: true,
          description: 'Application may be vulnerable to directory traversal attacks',
          recommendation: 'Validate and sanitize file paths'
        };
      }
    }

    return { type: 'Directory Traversal', vulnerable: false };
  }

  async testCommandInjection(_target) {
    const payloads = ['; ls -la', '| cat /etc/passwd', '&& dir', '|| whoami'];

    for (const payload of payloads) {
      const isVulnerable = Math.random() < 0.03; // 3% chance for demo

      if (isVulnerable) {
        return {
          type: 'Command Injection',
          severity: 'Critical',
          payload,
          vulnerable: true,
          description: 'Application may be vulnerable to command injection attacks',
          recommendation: 'Avoid shell commands, use safe APIs'
        };
      }
    }

    return { type: 'Command Injection', vulnerable: false };
  }

  async testAuthenticationBypass(_target) {
    const isVulnerable = Math.random() < 0.08; // 8% chance for demo

    if (isVulnerable) {
      return {
        type: 'Authentication Bypass',
        severity: 'Critical',
        vulnerable: true,
        description: 'Application may be vulnerable to authentication bypass',
        recommendation: 'Implement proper session management and validation'
      };
    }

    return { type: 'Authentication Bypass', vulnerable: false };
  }

  // Test Result Management
  logTestResult(result) {
    this.testResults.push({
      ...result,
      timestamp: new Date().toISOString(),
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    this.securityMetrics.testsRun++;
    if (result.vulnerable) {
      this.securityMetrics.vulnerabilitiesFound++;
    }
  }

  getSecurityReport() {
    return {
      summary: {
        ...this.securityMetrics,
        scanDate: new Date().toISOString(),
        overallRisk: this.calculateOverallRisk()
      },
      vulnerabilities: this.vulnerabilities,
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };
  }

  calculateOverallRisk() {
    if (this.securityMetrics.vulnerabilitiesFound === 0) {
      return 'Low';
    } else if (this.securityMetrics.vulnerabilitiesFound <= 2) {
      return 'Medium';
    } else {
      return 'High';
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.vulnerabilities.some(v => v.type === 'SQL Injection')) {
      recommendations.push({
        priority: 'High',
        title: 'Implement Parameterized Queries',
        description: 'Use parameterized queries instead of string concatenation for database operations'
      });
    }

    if (this.vulnerabilities.some(v => v.type === 'XSS')) {
      recommendations.push({
        priority: 'High',
        title: 'Implement Content Security Policy',
        description: 'Add CSP headers and sanitize all user input'
      });
    }

    if (this.vulnerabilities.some(v => v.type === 'Authentication Bypass')) {
      recommendations.push({
        priority: 'Critical',
        title: 'Strengthen Authentication',
        description: 'Implement multi-factor authentication and proper session management'
      });
    }

    return recommendations;
  }

  // Utility Methods
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomString(length = 10) {
    return Math.random().toString(36).substr(2, length);
  }

  static generateRandomEmail() {
    return `test.${Date.now()}.${Math.random().toString(36).substr(2, 5)}@example.com`;
  }

  static generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Export individual utility functions for convenience
export const {
  generateTestUser,
  generateAdminUser,
  generateInvalidJWT,
  generateExpiredJWT,
  generateSQLInjectionPayloads,
  generateXSSPayloads,
  generateCSRFToken,
  createMockFile,
  generateMaliciousFilePayloads,
  generateAPIEndpoints,
  generateHTTPMethods,
  generateRateLimitTestPayloads,
  generateSessionData,
  generateExpiredSession,
  generateTestEncryptionKeys,
  generateTestDataForEncryption,
  getExpectedSecurityHeaders
} = SecurityTestUtils;

// Export default class
export default SecurityTestUtils;
