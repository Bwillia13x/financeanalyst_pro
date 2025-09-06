// Production stub for accessibility testing to avoid bundling axe-core in prod
export const accessibilityTester = {
  async runTests() { return { violations: [], passes: [], inapplicable: [], incomplete: [] }; },
  async testFinancialComponent() { return { violations: [], passed: true }; },
  async testKeyboardNavigation() { return { focusableElementsCount: 0, passed: true }; },
  async testColorContrast() { return { totalElements: 0, contrastIssues: [], passed: true }; },
  async testFormAccessibility() { return { totalForms: 0, formIssues: [], passed: true }; },
  calculateAccessibilityScore() { return 100; },
  generateReport() { return { summary: { score: 100, violations: 0, totalChecks: 0 } }; }
};

