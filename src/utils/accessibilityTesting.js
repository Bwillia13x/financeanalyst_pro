// Accessibility Testing Framework with axe-core
import axeCore from 'axe-core';

class AccessibilityTester {
  constructor(options = {}) {
    this.options = {
      // Default axe configuration
      rules: {
        // Financial application specific rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'skip-link': { enabled: true },

        // Disable rules that might conflict with financial widgets
        'nested-interactive': { enabled: false }, // Some financial tables need nested controls

        ...options.rules
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      runOnly: options.runOnly || null,
      reporter: options.reporter || 'v2',
      ...options
    };

    this.violations = [];
    this.lastTestResults = null;
  }

  // Run accessibility tests on current page or specific element
  async runTests(element = document, options = {}) {
    const testOptions = {
      ...this.options,
      ...options
    };

    try {
      console.log('🔍 Running accessibility tests...');
      const results = await axeCore.run(element, testOptions);

      this.lastTestResults = results;
      this.violations = results.violations;

      // Log results
      this.logResults(results);

      // Report violations in development
      if (import.meta.env.DEV) {
        this.reportViolations(results.violations);
      }

      // Store results for analytics
      this.storeResults(results);

      return results;
    } catch (error) {
      console.error('Accessibility testing failed:', error);
      throw error;
    }
  }

  // Test specific financial components
  async testFinancialComponent(selector, componentType = 'generic') {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Component-specific test configurations
    const componentConfigs = {
      'spreadsheet': {
        rules: {
          'table-header': { enabled: true },
          'th-has-data-cells': { enabled: true },
          'table-duplicate-name': { enabled: true },
          'scope-attr-valid': { enabled: true }
        },
        tags: ['wcag2aa', 'section508']
      },

      'chart': {
        rules: {
          'image-alt': { enabled: true },
          'svg-img-alt': { enabled: true },
          'aria-hidden-focus': { enabled: true }
        },
        tags: ['wcag2aa']
      },

      'calculator': {
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'duplicate-id': { enabled: true }
        },
        tags: ['wcag2aa', 'section508']
      },

      'modal': {
        rules: {
          'focus-trap': { enabled: true },
          'aria-dialog-name': { enabled: true },
          'keyboard-navigation': { enabled: true }
        },
        tags: ['wcag2aa', 'best-practice']
      }
    };

    const config = componentConfigs[componentType] || {};
    return await this.runTests(element, config);
  }

  // Test keyboard navigation
  async testKeyboardNavigation() {
    console.log('🎹 Testing keyboard navigation...');

    const focusableElements = this.getFocusableElements();
    const tabOrderIssues = [];

    // Test tab order
    let previousTabIndex = -1;
    focusableElements.forEach((element, index) => {
      const tabIndex = element.tabIndex || 0;

      if (tabIndex > 0 && tabIndex <= previousTabIndex) {
        tabOrderIssues.push({
          element: element.tagName,
          id: element.id,
          tabIndex,
          position: index,
          issue: 'Tab order not sequential'
        });
      }

      previousTabIndex = tabIndex;
    });

    // Test focus visibility
    const focusVisibilityIssues = [];
    focusableElements.forEach(element => {
      const styles = window.getComputedStyle(element, ':focus');
      const hasOutline = styles.outline !== 'none' && styles.outline !== '0px';
      const hasBoxShadow = styles.boxShadow !== 'none';
      const hasBackground = styles.backgroundColor !== 'transparent';

      if (!hasOutline && !hasBoxShadow && !hasBackground) {
        focusVisibilityIssues.push({
          element: element.tagName,
          id: element.id,
          className: element.className,
          issue: 'No visible focus indicator'
        });
      }
    });

    return {
      focusableElementsCount: focusableElements.length,
      tabOrderIssues,
      focusVisibilityIssues,
      passed: tabOrderIssues.length === 0 && focusVisibilityIssues.length === 0
    };
  }

  // Test color contrast for financial data
  async testColorContrast() {
    console.log('🎨 Testing color contrast...');

    const textElements = document.querySelectorAll('p, span, div, td, th, label, button, a, h1, h2, h3, h4, h5, h6');
    const contrastIssues = [];

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const textColor = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Skip if background is transparent
      if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return;
      }

      const contrast = this.calculateContrastRatio(textColor, backgroundColor);
      const fontSize = parseInt(styles.fontSize);
      const fontWeight = styles.fontWeight;

      // WCAG AA requirements
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
      const requiredRatio = isLargeText ? 3.0 : 4.5;

      if (contrast < requiredRatio) {
        contrastIssues.push({
          element: element.tagName,
          id: element.id,
          className: element.className,
          textColor,
          backgroundColor,
          contrast: contrast.toFixed(2),
          required: requiredRatio,
          fontSize,
          fontWeight,
          text: element.textContent?.substring(0, 50) + '...'
        });
      }
    });

    return {
      totalElements: textElements.length,
      contrastIssues,
      passed: contrastIssues.length === 0
    };
  }

  // Test financial forms accessibility
  async testFormAccessibility() {
    console.log('📝 Testing form accessibility...');

    const forms = document.querySelectorAll('form');
    const formIssues = [];

    forms.forEach((form, formIndex) => {
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        const issues = [];

        // Check for labels
        const hasLabel = this.hasAssociatedLabel(input);
        if (!hasLabel) {
          issues.push('Missing label');
        }

        // Check for required field indication
        if (input.required && !this.hasRequiredIndication(input)) {
          issues.push('Required field not clearly indicated');
        }

        // Check for error states
        if (input.getAttribute('aria-invalid') === 'true' && !this.hasErrorMessage(input)) {
          issues.push('Error state without error message');
        }

        // Check for autocomplete on financial inputs
        if (this.isFinancialInput(input) && !input.autocomplete) {
          issues.push('Financial input missing autocomplete attribute');
        }

        if (issues.length > 0) {
          formIssues.push({
            formIndex,
            inputType: input.type,
            inputId: input.id,
            inputName: input.name,
            issues
          });
        }
      });
    });

    return {
      totalForms: forms.length,
      formIssues,
      passed: formIssues.length === 0
    };
  }

  // Generate comprehensive accessibility report
  generateReport() {
    if (!this.lastTestResults) {
      throw new Error('No test results available. Run tests first.');
    }

    const { violations, passes, incomplete, inapplicable } = this.lastTestResults;

    return {
      summary: {
        timestamp: new Date().toISOString(),
        totalChecks: violations.length + passes.length + incomplete.length + inapplicable.length,
        violations: violations.length,
        passes: passes.length,
        incomplete: incomplete.length,
        inapplicable: inapplicable.length,
        score: this.calculateAccessibilityScore()
      },
      violations: violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.length,
        tags: violation.tags
      })),
      recommendations: this.generateRecommendations(violations),
      financialSpecific: this.getFinancialAccessibilityInsights()
    };
  }

  // Calculate accessibility score (0-100)
  calculateAccessibilityScore() {
    if (!this.lastTestResults) return 0;

    const { violations, passes } = this.lastTestResults;
    const totalTests = violations.length + passes.length;

    if (totalTests === 0) return 100;

    // Weight violations by impact
    const impactWeights = { critical: 4, serious: 3, moderate: 2, minor: 1 };
    const violationScore = violations.reduce((score, violation) => {
      return score + (impactWeights[violation.impact] || 1);
    }, 0);

    const maxPossibleScore = totalTests * 4; // Assuming all could be critical
    return Math.max(0, 100 - (violationScore / maxPossibleScore) * 100);
  }

  // Generate specific recommendations for financial applications
  generateRecommendations(violations) {
    const recommendations = [];

    violations.forEach(violation => {
      switch (violation.id) {
        case 'color-contrast':
          recommendations.push({
            category: 'Visual Design',
            priority: 'High',
            issue: 'Insufficient color contrast',
            solution: 'Ensure text colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)',
            financialContext: 'Critical for reading financial data and avoiding misinterpretation of numbers'
          });
          break;

        case 'keyboard-navigation':
          recommendations.push({
            category: 'Keyboard Access',
            priority: 'High',
            issue: 'Keyboard navigation issues',
            solution: 'Ensure all interactive elements are keyboard accessible with visible focus indicators',
            financialContext: 'Essential for users who rely on keyboard navigation to access financial tools'
          });
          break;

        case 'label':
          recommendations.push({
            category: 'Form Controls',
            priority: 'High',
            issue: 'Missing form labels',
            solution: 'Add proper labels to all form controls, especially financial input fields',
            financialContext: 'Critical for screen readers to understand financial input requirements'
          });
          break;

        case 'aria-hidden-focus':
          recommendations.push({
            category: 'ARIA Usage',
            priority: 'Medium',
            issue: 'Focusable elements hidden from screen readers',
            solution: 'Review aria-hidden usage on interactive elements',
            financialContext: 'May hide important financial controls from assistive technology users'
          });
          break;
      }
    });

    return recommendations;
  }

  // Get financial application specific accessibility insights
  getFinancialAccessibilityInsights() {
    const insights = [];

    // Check for financial data tables
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      insights.push({
        component: 'Data Tables',
        recommendation: 'Ensure financial data tables have proper headers and scope attributes for screen reader navigation'
      });
    }

    // Check for charts
    const charts = document.querySelectorAll('[data-chart], .recharts-wrapper, canvas');
    if (charts.length > 0) {
      insights.push({
        component: 'Charts and Graphs',
        recommendation: 'Provide alternative text descriptions and data tables for financial charts'
      });
    }

    // Check for calculators
    const calculators = document.querySelectorAll('[data-calculator], .calculator');
    if (calculators.length > 0) {
      insights.push({
        component: 'Financial Calculators',
        recommendation: 'Ensure calculator inputs have clear labels and results are announced to screen readers'
      });
    }

    return insights;
  }

  // Utility methods
  getFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(document.querySelectorAll(focusableSelectors.join(',')));
  }

  hasAssociatedLabel(input) {
    const id = input.id;
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');

    if (ariaLabel || ariaLabelledby) return true;
    if (id && document.querySelector(`label[for="${id}"]`)) return true;

    // Check for wrapping label
    const parentLabel = input.closest('label');
    return !!parentLabel;
  }

  hasRequiredIndication(input) {
    const ariaRequired = input.getAttribute('aria-required');
    const requiredAttr = input.hasAttribute('required');
    const hasRequiredText = this.hasRequiredTextIndicator(input);

    return ariaRequired === 'true' || requiredAttr || hasRequiredText;
  }

  hasRequiredTextIndicator(input) {
    const label = this.getAssociatedLabel(input);
    if (!label) return false;

    const text = label.textContent || '';
    return text.includes('*') || text.toLowerCase().includes('required');
  }

  hasErrorMessage(input) {
    const ariaDescribedby = input.getAttribute('aria-describedby');
    if (ariaDescribedby) {
      const errorElement = document.getElementById(ariaDescribedby);
      return errorElement && errorElement.textContent;
    }
    return false;
  }

  isFinancialInput(input) {
    const financialTypes = ['number', 'email', 'tel'];
    const financialNames = ['amount', 'price', 'rate', 'percent', 'currency', 'value'];

    return financialTypes.includes(input.type) ||
           financialNames.some(name => input.name?.toLowerCase().includes(name));
  }

  getAssociatedLabel(input) {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label;
    }

    return input.closest('label');
  }

  // Simplified contrast ratio calculation
  calculateContrastRatio(color1, color2) {
    // This is a simplified version - in production use a proper color contrast library
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  parseColor(color) {
    // Simple RGB parsing - expand for production use
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0]; // Default to black
  }

  getLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  logResults(results) {
    console.group('♿ Accessibility Test Results');
    console.log(`✅ Passed: ${results.passes.length}`);
    console.log(`❌ Violations: ${results.violations.length}`);
    console.log(`⚠️  Incomplete: ${results.incomplete.length}`);
    console.log(`➖ Not applicable: ${results.inapplicable.length}`);

    if (results.violations.length > 0) {
      console.warn('Violations found:');
      results.violations.forEach(violation => {
        console.warn(`- ${violation.id}: ${violation.description}`);
      });
    }
    console.groupEnd();
  }

  reportViolations(violations) {
    violations.forEach(violation => {
      violation.nodes.forEach(node => {
        console.error('Accessibility violation:', {
          rule: violation.id,
          impact: violation.impact,
          element: node.target,
          message: node.failureSummary
        });
      });
    });
  }

  storeResults(results) {
    try {
      const reportData = {
        timestamp: Date.now(),
        url: window.location.href,
        violations: results.violations.length,
        passes: results.passes.length,
        score: this.calculateAccessibilityScore()
      };

      const existingReports = JSON.parse(localStorage.getItem('accessibility-reports') || '[]');
      existingReports.push(reportData);

      // Keep only last 10 reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10);
      }

      localStorage.setItem('accessibility-reports', JSON.stringify(existingReports));
    } catch (error) {
      console.error('Failed to store accessibility results:', error);
    }
  }
}

// Create singleton instance
export const accessibilityTester = new AccessibilityTester();

// React hook for accessibility testing
export function useAccessibilityTester() {
  return {
    runTests: (element, options) => accessibilityTester.runTests(element, options),
    testFinancialComponent: (selector, type) => accessibilityTester.testFinancialComponent(selector, type),
    testKeyboardNavigation: () => accessibilityTester.testKeyboardNavigation(),
    testColorContrast: () => accessibilityTester.testColorContrast(),
    testFormAccessibility: () => accessibilityTester.testFormAccessibility(),
    generateReport: () => accessibilityTester.generateReport(),
    getScore: () => accessibilityTester.calculateAccessibilityScore()
  };
}

export default AccessibilityTester;
