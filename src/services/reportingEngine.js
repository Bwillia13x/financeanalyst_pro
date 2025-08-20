/**
 * Advanced Reporting Engine with Custom Templates
 * Generates professional financial reports with customizable templates
 */

class ReportingEngine {
  constructor() {
    this.templates = new Map();
    this.reports = new Map();
    this.themes = new Map();
    this.exportFormats = new Set(['pdf', 'docx', 'pptx', 'html', 'excel']);
    this.isInitialized = false;
    
    this.initializeTemplates();
    this.initializeThemes();
  }

  /**
   * Initialize default report templates
   */
  initializeTemplates() {
    // Executive Summary Template
    this.registerTemplate('executive_summary', {
      name: 'Executive Summary',
      description: 'High-level overview for executives and stakeholders',
      category: 'summary',
      sections: [
        {
          id: 'cover',
          name: 'Cover Page',
          type: 'cover',
          required: true,
          fields: ['company_name', 'report_date', 'analyst_name', 'executive_summary']
        },
        {
          id: 'key_metrics',
          name: 'Key Financial Metrics',
          type: 'metrics_grid',
          required: true,
          fields: ['revenue', 'profit_margin', 'roe', 'debt_ratio', 'current_ratio']
        },
        {
          id: 'valuation',
          name: 'Valuation Summary',
          type: 'valuation_card',
          required: true,
          fields: ['dcf_value', 'market_value', 'recommendation', 'price_target']
        },
        {
          id: 'risks',
          name: 'Key Risks & Opportunities',
          type: 'risk_matrix',
          required: false,
          fields: ['risks', 'opportunities', 'mitigation_strategies']
        }
      ],
      layout: 'executive',
      estimatedPages: 4
    });

    // Full Financial Analysis Template
    this.registerTemplate('full_analysis', {
      name: 'Comprehensive Financial Analysis',
      description: 'Detailed analysis for investment decisions',
      category: 'analysis',
      sections: [
        {
          id: 'executive_summary',
          name: 'Executive Summary',
          type: 'text_summary',
          required: true
        },
        {
          id: 'company_overview',
          name: 'Company Overview',
          type: 'company_profile',
          required: true,
          fields: ['business_description', 'key_products', 'market_position', 'competitive_landscape']
        },
        {
          id: 'financial_performance',
          name: 'Financial Performance Analysis',
          type: 'financial_tables',
          required: true,
          fields: ['income_statement', 'balance_sheet', 'cash_flow', 'ratio_analysis']
        },
        {
          id: 'valuation_analysis',
          name: 'Valuation Analysis',
          type: 'valuation_detailed',
          required: true,
          fields: ['dcf_model', 'comparable_analysis', 'precedent_transactions', 'sensitivity_analysis']
        },
        {
          id: 'scenario_analysis',
          name: 'Scenario & Sensitivity Analysis',
          type: 'scenario_charts',
          required: false,
          fields: ['base_case', 'bull_case', 'bear_case', 'key_assumptions']
        },
        {
          id: 'appendix',
          name: 'Appendix',
          type: 'appendix',
          required: false,
          fields: ['detailed_calculations', 'data_sources', 'methodology']
        }
      ],
      layout: 'detailed',
      estimatedPages: 25
    });

    // Investment Committee Template
    this.registerTemplate('investment_committee', {
      name: 'Investment Committee Presentation',
      description: 'Presentation format for investment decisions',
      category: 'presentation',
      sections: [
        {
          id: 'investment_thesis',
          name: 'Investment Thesis',
          type: 'slide_content',
          required: true,
          fields: ['investment_rationale', 'key_catalysts', 'timeline']
        },
        {
          id: 'financial_snapshot',
          name: 'Financial Snapshot',
          type: 'dashboard',
          required: true,
          fields: ['key_metrics_dashboard', 'performance_trends']
        },
        {
          id: 'valuation_summary',
          name: 'Valuation & Recommendation',
          type: 'valuation_slide',
          required: true,
          fields: ['target_price', 'recommendation', 'risk_rating']
        },
        {
          id: 'risk_assessment',
          name: 'Risk Assessment',
          type: 'risk_slides',
          required: true,
          fields: ['key_risks', 'risk_mitigation', 'stress_tests']
        }
      ],
      layout: 'presentation',
      estimatedPages: 15
    });

    // Portfolio Review Template
    this.registerTemplate('portfolio_review', {
      name: 'Portfolio Performance Review',
      description: 'Regular portfolio performance and attribution analysis',
      category: 'portfolio',
      sections: [
        {
          id: 'performance_summary',
          name: 'Performance Summary',
          type: 'performance_dashboard',
          required: true,
          fields: ['total_return', 'benchmark_comparison', 'attribution_analysis']
        },
        {
          id: 'holdings_analysis',
          name: 'Holdings Analysis',
          type: 'holdings_table',
          required: true,
          fields: ['top_holdings', 'sector_allocation', 'geographic_allocation']
        },
        {
          id: 'risk_metrics',
          name: 'Risk Metrics',
          type: 'risk_dashboard',
          required: true,
          fields: ['volatility', 'var', 'maximum_drawdown', 'beta']
        },
        {
          id: 'outlook',
          name: 'Market Outlook & Strategy',
          type: 'strategic_outlook',
          required: false,
          fields: ['market_outlook', 'strategy_changes', 'tactical_adjustments']
        }
      ],
      layout: 'portfolio',
      estimatedPages: 12
    });

    // Due Diligence Template
    this.registerTemplate('due_diligence', {
      name: 'Due Diligence Report',
      description: 'Comprehensive due diligence for investment decisions',
      category: 'due_diligence',
      sections: [
        {
          id: 'transaction_summary',
          name: 'Transaction Summary',
          type: 'transaction_overview',
          required: true
        },
        {
          id: 'business_analysis',
          name: 'Business & Market Analysis',
          type: 'business_deep_dive',
          required: true,
          fields: ['market_analysis', 'competitive_position', 'business_model', 'management_team']
        },
        {
          id: 'financial_analysis',
          name: 'Financial Analysis',
          type: 'financial_deep_dive',
          required: true,
          fields: ['historical_performance', 'quality_of_earnings', 'working_capital', 'capex_analysis']
        },
        {
          id: 'valuation',
          name: 'Valuation Analysis',
          type: 'valuation_comprehensive',
          required: true
        },
        {
          id: 'risks_issues',
          name: 'Risks & Issues',
          type: 'risk_comprehensive',
          required: true,
          fields: ['commercial_risks', 'financial_risks', 'operational_risks', 'regulatory_risks']
        }
      ],
      layout: 'due_diligence',
      estimatedPages: 35
    });

    console.log('Report templates initialized:', this.templates.size);
  }

  /**
   * Initialize report themes
   */
  initializeThemes() {
    this.registerTheme('professional', {
      name: 'Professional',
      colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        accent: '#0ea5e9',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        monospace: 'JetBrains Mono, monospace'
      },
      layout: {
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        spacing: 16,
        borderRadius: 8
      }
    });

    this.registerTheme('executive', {
      name: 'Executive',
      colors: {
        primary: '#111827',
        secondary: '#6b7280',
        accent: '#3b82f6',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827'
      },
      fonts: {
        heading: 'Georgia, serif',
        body: 'system-ui, sans-serif',
        monospace: 'SF Mono, monospace'
      },
      layout: {
        margins: { top: 90, right: 90, bottom: 90, left: 90 },
        spacing: 20,
        borderRadius: 4
      }
    });

    this.registerTheme('modern', {
      name: 'Modern',
      colors: {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#f43f5e',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b'
      },
      fonts: {
        heading: 'Poppins, sans-serif',
        body: 'Inter, sans-serif',
        monospace: 'Fira Code, monospace'
      },
      layout: {
        margins: { top: 60, right: 60, bottom: 60, left: 60 },
        spacing: 18,
        borderRadius: 12
      }
    });
  }

  /**
   * Register a new report template
   */
  registerTemplate(id, template) {
    this.templates.set(id, {
      id,
      ...template,
      createdAt: new Date().toISOString(),
      version: '1.0'
    });
  }

  /**
   * Register a new theme
   */
  registerTheme(id, theme) {
    this.themes.set(id, {
      id,
      ...theme,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Generate a report
   */
  async generateReport(templateId, data, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const theme = this.themes.get(options.theme || 'professional');
    
    const report = {
      id: reportId,
      templateId,
      template: template.name,
      data,
      options: {
        theme: options.theme || 'professional',
        format: options.format || 'pdf',
        includeCharts: options.includeCharts !== false,
        includeRawData: options.includeRawData || false,
        customSections: options.customSections || [],
        ...options
      },
      status: 'generating',
      createdAt: new Date().toISOString(),
      sections: []
    };

    try {
      // Generate each section
      for (const sectionConfig of template.sections) {
        if (sectionConfig.required || options.includedSections?.includes(sectionConfig.id)) {
          const section = await this.generateSection(sectionConfig, data, theme, options);
          report.sections.push(section);
        }
      }

      // Add custom sections
      for (const customSection of (options.customSections || [])) {
        const section = await this.generateCustomSection(customSection, data, theme, options);
        report.sections.push(section);
      }

      // Generate final report document
      const document = await this.compileReport(report, template, theme);
      report.document = document;
      report.status = 'completed';
      report.completedAt = new Date().toISOString();

      // Store report
      this.reports.set(reportId, report);

      return report;

    } catch (error) {
      report.status = 'error';
      report.error = error.message;
      throw error;
    }
  }

  /**
   * Generate a specific section
   */
  async generateSection(sectionConfig, data, theme, options) {
    const section = {
      id: sectionConfig.id,
      name: sectionConfig.name,
      type: sectionConfig.type,
      content: {},
      charts: [],
      tables: []
    };

    switch (sectionConfig.type) {
      case 'cover':
        section.content = this.generateCoverPage(data, sectionConfig.fields);
        break;
      case 'metrics_grid':
        section.content = this.generateMetricsGrid(data, sectionConfig.fields);
        break;
      case 'valuation_card':
        section.content = this.generateValuationCard(data);
        section.charts = this.generateValuationCharts(data);
        break;
      case 'financial_tables':
        section.tables = this.generateFinancialTables(data);
        break;
      case 'scenario_charts':
        section.charts = this.generateScenarioCharts(data);
        break;
      case 'risk_matrix':
        section.content = this.generateRiskMatrix(data);
        break;
      case 'performance_dashboard':
        section.content = this.generatePerformanceDashboard(data);
        section.charts = this.generatePerformanceCharts(data);
        break;
      default:
        section.content = this.generateGenericSection(sectionConfig, data);
    }

    return section;
  }

  /**
   * Generate cover page content
   */
  generateCoverPage(data, fields) {
    return {
      companyName: data.company?.name || 'Financial Analysis',
      reportTitle: data.reportTitle || 'Financial Analysis Report',
      reportDate: new Date().toLocaleDateString(),
      analystName: data.analyst?.name || 'Financial Analyst',
      executiveSummary: data.executiveSummary || 'Comprehensive financial analysis and valuation.',
      logo: data.company?.logo,
      disclaimer: 'This report is for informational purposes only and should not be considered as investment advice.'
    };
  }

  /**
   * Generate key metrics grid
   */
  generateMetricsGrid(data, fields) {
    const statements = data.financialData?.statements;
    const latest = statements?.incomeStatement ? Object.keys(statements.incomeStatement).sort().pop() : null;
    
    return {
      revenue: {
        label: 'Revenue',
        value: statements?.incomeStatement?.[latest]?.totalRevenue || 0,
        format: 'currency',
        trend: this.calculateTrend(statements?.incomeStatement, 'totalRevenue')
      },
      profitMargin: {
        label: 'Net Profit Margin',
        value: this.calculateNetMargin(statements?.incomeStatement?.[latest]),
        format: 'percentage',
        trend: 'stable'
      },
      roe: {
        label: 'Return on Equity',
        value: this.calculateROE(statements?.incomeStatement?.[latest], statements?.balanceSheet?.[latest]),
        format: 'percentage',
        trend: 'positive'
      },
      currentRatio: {
        label: 'Current Ratio',
        value: this.calculateCurrentRatio(statements?.balanceSheet?.[latest]),
        format: 'ratio',
        trend: 'stable'
      }
    };
  }

  /**
   * Generate valuation card
   */
  generateValuationCard(data) {
    const dcfValue = data.dcfResults?.enterpriseValue || 0;
    const marketValue = data.marketData?.marketCap || 0;
    const upside = marketValue > 0 ? ((dcfValue - marketValue) / marketValue) * 100 : 0;
    
    return {
      dcfValue,
      marketValue,
      upside,
      recommendation: upside > 20 ? 'BUY' : upside > -10 ? 'HOLD' : 'SELL',
      priceTarget: dcfValue * (data.assumptions?.sharesOutstanding || 1000000) / 1000000,
      confidence: 'Medium',
      methodology: 'DCF Analysis with peer comparison'
    };
  }

  /**
   * Generate financial tables
   */
  generateFinancialTables(data) {
    const statements = data.financialData?.statements;
    return {
      incomeStatement: this.formatIncomeStatement(statements?.incomeStatement),
      balanceSheet: this.formatBalanceSheet(statements?.balanceSheet),
      cashFlow: this.formatCashFlowStatement(statements?.cashFlow),
      ratios: this.calculateFinancialRatios(statements)
    };
  }

  /**
   * Generate scenario charts
   */
  generateScenarioCharts(data) {
    return [
      {
        type: 'scenario_comparison',
        title: 'Scenario Analysis - Valuation Range',
        data: this.generateScenarioData(data),
        chartType: 'bar'
      },
      {
        type: 'sensitivity_tornado',
        title: 'Sensitivity Analysis',
        data: this.generateSensitivityData(data),
        chartType: 'tornado'
      }
    ];
  }

  /**
   * Compile final report document
   */
  async compileReport(report, template, theme) {
    const document = {
      metadata: {
        title: `${report.template} - ${report.data.company?.name || 'Analysis'}`,
        author: report.data.analyst?.name || 'Financial Analyst',
        subject: 'Financial Analysis Report',
        creator: 'FinanceAnalyst Pro',
        createdAt: report.createdAt
      },
      theme,
      layout: template.layout,
      pages: []
    };

    // Generate pages based on sections
    for (const section of report.sections) {
      const pages = await this.renderSection(section, theme, template.layout);
      document.pages.push(...pages);
    }

    // Add page numbers and headers/footers
    this.addPageElements(document);

    return document;
  }

  /**
   * Render a section into pages
   */
  async renderSection(section, theme, layout) {
    const pages = [];
    
    // Create section title page if needed
    if (section.type !== 'cover') {
      pages.push({
        type: 'section_title',
        title: section.name,
        content: section.content.summary || '',
        theme
      });
    }

    // Add content pages
    if (section.content) {
      pages.push({
        type: 'content',
        section: section.id,
        content: section.content,
        theme
      });
    }

    // Add chart pages
    for (const chart of section.charts || []) {
      pages.push({
        type: 'chart',
        chart,
        theme
      });
    }

    // Add table pages
    for (const table of section.tables || []) {
      pages.push({
        type: 'table',
        table,
        theme
      });
    }

    return pages;
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId, format = 'pdf', options = {}) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (!this.exportFormats.has(format)) {
      throw new Error(`Export format ${format} not supported`);
    }

    try {
      let exportedData;
      
      switch (format) {
        case 'pdf':
          exportedData = await this.exportToPDF(report, options);
          break;
        case 'docx':
          exportedData = await this.exportToWord(report, options);
          break;
        case 'pptx':
          exportedData = await this.exportToPowerPoint(report, options);
          break;
        case 'html':
          exportedData = await this.exportToHTML(report, options);
          break;
        case 'excel':
          exportedData = await this.exportToExcel(report, options);
          break;
        default:
          throw new Error(`Export format ${format} not implemented`);
      }

      return {
        reportId,
        format,
        data: exportedData,
        filename: this.generateFilename(report, format),
        size: exportedData.length,
        exportedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Get available templates
   */
  getTemplates(category = null) {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  /**
   * Get available themes
   */
  getThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get report status
   */
  getReport(reportId) {
    return this.reports.get(reportId);
  }

  /**
   * List all reports
   */
  listReports() {
    return Array.from(this.reports.values()).map(report => ({
      id: report.id,
      template: report.template,
      status: report.status,
      createdAt: report.createdAt,
      completedAt: report.completedAt
    }));
  }

  // Helper methods for calculations and formatting
  calculateTrend(data, field) {
    if (!data) return 'neutral';
    const periods = Object.keys(data).sort();
    if (periods.length < 2) return 'neutral';
    
    const latest = data[periods[periods.length - 1]]?.[field] || 0;
    const previous = data[periods[periods.length - 2]]?.[field] || 0;
    
    if (latest > previous * 1.05) return 'positive';
    if (latest < previous * 0.95) return 'negative';
    return 'stable';
  }

  calculateNetMargin(incomeData) {
    if (!incomeData) return 0;
    const revenue = incomeData.totalRevenue || 0;
    const netIncome = incomeData.netIncome || 0;
    return revenue > 0 ? (netIncome / revenue) * 100 : 0;
  }

  calculateROE(incomeData, balanceData) {
    if (!incomeData || !balanceData) return 0;
    const netIncome = incomeData.netIncome || 0;
    const equity = balanceData.totalEquity || 0;
    return equity > 0 ? (netIncome / equity) * 100 : 0;
  }

  calculateCurrentRatio(balanceData) {
    if (!balanceData) return 0;
    const currentAssets = balanceData.currentAssets || 0;
    const currentLiabilities = balanceData.currentLiabilities || 0;
    return currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  }

  formatIncomeStatement(data) {
    if (!data) return {};
    
    const periods = Object.keys(data).sort();
    const formatted = { periods, rows: [] };
    
    const fields = [
      { key: 'totalRevenue', label: 'Total Revenue' },
      { key: 'totalCostOfGoodsSold', label: 'Cost of Goods Sold' },
      { key: 'grossProfit', label: 'Gross Profit' },
      { key: 'operatingIncome', label: 'Operating Income' },
      { key: 'netIncome', label: 'Net Income' }
    ];

    for (const field of fields) {
      const row = { label: field.label, values: [] };
      for (const period of periods) {
        row.values.push(data[period]?.[field.key] || 0);
      }
      formatted.rows.push(row);
    }

    return formatted;
  }

  formatBalanceSheet(data) {
    // Similar formatting for balance sheet
    return data || {};
  }

  formatCashFlowStatement(data) {
    // Similar formatting for cash flow
    return data || {};
  }

  calculateFinancialRatios(statements) {
    // Calculate comprehensive financial ratios
    return {
      profitability: {},
      liquidity: {},
      efficiency: {},
      leverage: {}
    };
  }

  generateScenarioData(data) {
    return [
      { scenario: 'Bear Case', value: (data.dcfResults?.enterpriseValue || 0) * 0.7 },
      { scenario: 'Base Case', value: data.dcfResults?.enterpriseValue || 0 },
      { scenario: 'Bull Case', value: (data.dcfResults?.enterpriseValue || 0) * 1.3 }
    ];
  }

  generateSensitivityData(data) {
    return [
      { variable: 'Revenue Growth', impact: 25 },
      { variable: 'Discount Rate', impact: -20 },
      { variable: 'Terminal Growth', impact: 15 },
      { variable: 'Operating Margin', impact: 18 }
    ];
  }

  async exportToPDF(report, options) {
    // Mock PDF generation
    return new Uint8Array([37, 80, 68, 70]); // PDF header
  }

  async exportToWord(report, options) {
    // Mock Word generation
    return new Uint8Array([80, 75, 3, 4]); // ZIP header for DOCX
  }

  async exportToPowerPoint(report, options) {
    // Mock PowerPoint generation
    return new Uint8Array([80, 75, 3, 4]); // ZIP header for PPTX
  }

  async exportToHTML(report, options) {
    // Generate HTML report
    return `<!DOCTYPE html><html><head><title>${report.template}</title></head><body><h1>Report Generated</h1></body></html>`;
  }

  async exportToExcel(report, options) {
    // Mock Excel generation
    return new Uint8Array([80, 75, 3, 4]); // ZIP header for XLSX
  }

  generateFilename(report, format) {
    const date = new Date().toISOString().split('T')[0];
    const company = report.data.company?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Analysis';
    return `${company}_${report.template.replace(/\s+/g, '_')}_${date}.${format}`;
  }

  addPageElements(document) {
    document.pages.forEach((page, index) => {
      page.pageNumber = index + 1;
      page.totalPages = document.pages.length;
      page.header = document.metadata.title;
      page.footer = `Page ${index + 1} of ${document.pages.length}`;
    });
  }

  generateCustomSection(customSection, data, theme, options) {
    return {
      id: customSection.id,
      name: customSection.name,
      type: 'custom',
      content: customSection.content || {},
      charts: customSection.charts || [],
      tables: customSection.tables || []
    };
  }

  generateGenericSection(sectionConfig, data) {
    return {
      title: sectionConfig.name,
      content: 'Generic section content would be generated here based on available data.',
      fields: sectionConfig.fields || []
    };
  }

  generateRiskMatrix(data) {
    return {
      risks: [
        { category: 'Market Risk', level: 'Medium', description: 'General market volatility' },
        { category: 'Credit Risk', level: 'Low', description: 'Strong balance sheet' },
        { category: 'Operational Risk', level: 'Medium', description: 'Industry-specific challenges' }
      ],
      opportunities: [
        { category: 'Market Expansion', potential: 'High', description: 'New market opportunities' },
        { category: 'Cost Optimization', potential: 'Medium', description: 'Operational improvements' }
      ]
    };
  }

  generatePerformanceDashboard(data) {
    return {
      totalReturn: data.performance?.totalReturn || 0,
      benchmarkReturn: data.performance?.benchmarkReturn || 0,
      alpha: data.performance?.alpha || 0,
      sharpeRatio: data.performance?.sharpeRatio || 0,
      maxDrawdown: data.performance?.maxDrawdown || 0
    };
  }

  generatePerformanceCharts(data) {
    return [
      {
        type: 'performance_line',
        title: 'Performance vs Benchmark',
        data: data.performance?.timeSeries || [],
        chartType: 'line'
      },
      {
        type: 'attribution_bar',
        title: 'Performance Attribution',
        data: data.performance?.attribution || [],
        chartType: 'bar'
      }
    ];
  }
}

export default new ReportingEngine();
