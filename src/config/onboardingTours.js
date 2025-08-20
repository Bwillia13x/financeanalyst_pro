/**
 * Onboarding tour configurations for FinanceAnalyst Pro
 * Guides users through complex financial features
 */

export const ONBOARDING_TOURS = {
  privateAnalysis: {
    id: 'private-analysis-tour',
    name: 'Private Analysis Walkthrough',
    description: 'Learn how to build and analyze financial models',
    steps: [
      {
        target: '[data-tour="financial-spreadsheet-tab"]',
        title: 'Financial Spreadsheet',
        content: 'Start by building your financial model with historical and projected data. Click here to access the spreadsheet interface.',
        tip: 'You can import data from Excel or enter it manually using our intuitive interface.'
      },
      {
        target: '[data-tour="revenue-section"]',
        title: 'Revenue Assumptions',
        content: 'Begin with revenue projections. Break down by business segments or product lines for more accurate modeling.',
        tip: 'Use growth rates and market size assumptions to build credible revenue forecasts.'
      },
      {
        target: '[data-tour="expense-section"]',
        title: 'Operating Expenses',
        content: 'Model your cost structure including COGS, SG&A, and other operating expenses. Link these to revenue drivers where possible.',
        tip: 'Consider both fixed and variable cost components for realistic expense modeling.'
      },
      {
        target: '[data-tour="financial-modeling-tab"]',
        title: 'Advanced Modeling',
        content: 'Access DCF, LBO, and other valuation models. These tools use your spreadsheet data for sophisticated analysis.',
        tip: 'Always validate your model assumptions before running complex analyses.'
      },
      {
        target: '[data-tour="analysis-results-tab"]',
        title: 'Analysis Results',
        content: 'View detailed results including valuations, ratios, and sensitivity analysis. Export reports for presentations.',
        tip: 'Use scenario analysis to test different assumptions and risk factors.'
      }
    ]
  },

  dcfModeling: {
    id: 'dcf-modeling-tour',
    name: 'DCF Analysis Guide',
    description: 'Master discounted cash flow valuation methodology',
    steps: [
      {
        target: '[data-tour="dcf-assumptions"]',
        title: 'Key Assumptions',
        content: 'Set your growth rates, margin assumptions, and terminal value parameters. These drive your entire valuation.',
        tip: 'Use conservative assumptions and benchmark against industry standards.'
      },
      {
        target: '[data-tour="wacc-calculation"]',
        title: 'WACC Calculation',
        content: 'Configure your weighted average cost of capital. This discount rate reflects the risk of your investment.',
        tip: 'Consider using industry betas and current market rates for accuracy.'
      },
      {
        target: '[data-tour="cash-flow-projections"]',
        title: 'Cash Flow Projections',
        content: 'Review projected free cash flows. These should reflect your operating assumptions and capital requirements.',
        tip: 'Pay attention to working capital changes and capital expenditure requirements.'
      },
      {
        target: '[data-tour="terminal-value"]',
        title: 'Terminal Value',
        content: 'The terminal value often represents 60-80% of total value. Choose appropriate growth rates and exit multiples.',
        tip: 'Terminal growth rates should not exceed long-term GDP growth (2-4%).'
      },
      {
        target: '[data-tour="sensitivity-analysis"]',
        title: 'Sensitivity Analysis',
        content: 'Test how changes in key assumptions affect valuation. This helps assess investment risk.',
        tip: 'Focus on the variables that have the biggest impact on your valuation.'
      }
    ]
  },

  portfolioManagement: {
    id: 'portfolio-tour',
    name: 'Portfolio Management Tour',
    description: 'Learn to track and analyze investment portfolios',
    steps: [
      {
        target: '[data-tour="portfolio-overview"]',
        title: 'Portfolio Overview',
        content: 'Get a high-level view of your portfolio performance, allocation, and key metrics.',
        tip: 'Use this dashboard to quickly assess portfolio health and identify areas for attention.'
      },
      {
        target: '[data-tour="holdings-table"]',
        title: 'Holdings Analysis',
        content: 'Detailed view of individual positions with performance metrics, valuations, and risk indicators.',
        tip: 'Sort and filter holdings to focus on specific sectors, performance ranges, or risk levels.'
      },
      {
        target: '[data-tour="allocation-chart"]',
        title: 'Asset Allocation',
        content: 'Visualize your portfolio allocation by sector, geography, market cap, or custom categories.',
        tip: 'Monitor allocation drift and rebalance when allocations deviate from targets.'
      },
      {
        target: '[data-tour="performance-charts"]',
        title: 'Performance Analysis',
        content: 'Track performance over time with benchmark comparisons and risk-adjusted metrics.',
        tip: 'Look at both absolute and relative performance across different time periods.'
      }
    ]
  },

  marketAnalysis: {
    id: 'market-analysis-tour',
    name: 'Market Analysis Guide',
    description: 'Navigate market data and analysis tools',
    steps: [
      {
        target: '[data-tour="market-overview"]',
        title: 'Market Overview',
        content: 'Real-time market data, indices, and key economic indicators to inform your analysis.',
        tip: 'Check market conditions before making investment decisions or valuations.'
      },
      {
        target: '[data-tour="company-search"]',
        title: 'Company Research',
        content: 'Search and analyze public companies with financial statements, ratios, and peer comparisons.',
        tip: 'Use comparable company analysis to validate your private company valuations.'
      },
      {
        target: '[data-tour="economic-data"]',
        title: 'Economic Indicators',
        content: 'Access key economic data like GDP, inflation, interest rates, and employment statistics.',
        tip: 'Economic indicators help contextualize your investment thesis and assumptions.'
      },
      {
        target: '[data-tour="sector-analysis"]',
        title: 'Sector Analysis',
        content: 'Compare performance across different sectors and identify investment themes.',
        tip: 'Sector trends can help identify opportunities and risks in your portfolio.'
      }
    ]
  }
};

export const FEATURE_INTRODUCTIONS = {
  financialValidator: {
    title: 'Real-time Financial Validation',
    content: 'Get instant feedback on your financial inputs with suggestions for improvements and error detection.',
    trigger: 'first-validation-error',
    dismissible: true
  },

  virtualizedTable: {
    title: 'High-Performance Tables',
    content: 'Handle large datasets efficiently with our virtualized table system. Scroll through thousands of rows without performance issues.',
    trigger: 'first-large-dataset',
    dismissible: true
  },

  advancedCharts: {
    title: 'Interactive Financial Charts',
    content: 'Create professional charts and visualizations. Click chart types to switch views and hover for detailed information.',
    trigger: 'chart-creation',
    dismissible: true
  },

  exportCapabilities: {
    title: 'Data Export Options',
    content: 'Export your analysis to Excel, PDF, or CSV formats. Perfect for presentations and further analysis.',
    trigger: 'first-export-attempt',
    dismissible: true
  }
};

// Helper functions for tour management
export const getTourSteps = (tourId) => {
  return ONBOARDING_TOURS[tourId]?.steps || [];
};

export const getTourByFeature = (feature) => {
  const tourMap = {
    'private-analysis': 'privateAnalysis',
    'dcf-analysis': 'dcfModeling',
    'portfolio': 'portfolioManagement',
    'market-data': 'marketAnalysis'
  };

  return ONBOARDING_TOURS[tourMap[feature]];
};

export const shouldShowIntroduction = (featureId, userPreferences = {}) => {
  const feature = FEATURE_INTRODUCTIONS[featureId];
  if (!feature) return false;

  // Check if user has dismissed this introduction
  const dismissed = userPreferences.dismissedIntroductions || [];
  if (dismissed.includes(featureId)) return false;

  return true;
};

export const markIntroductionSeen = (featureId, userPreferences = {}) => {
  const dismissed = userPreferences.dismissedIntroductions || [];
  if (!dismissed.includes(featureId)) {
    dismissed.push(featureId);
  }

  return {
    ...userPreferences,
    dismissedIntroductions: dismissed
  };
};
