/**
 * Report Builder Service
 * Advanced reporting engine for financial analysis
 * Generates professional reports, presentations, and exports
 */

class ReportBuilderService {
  constructor(options = {}) {
    this.options = {
      maxReportSize: 100, // MB
      supportedFormats: ['pdf', 'excel', 'powerpoint', 'html', 'json'],
      templateCacheSize: 50,
      defaultTheme: 'professional',
      ...options
    };

    this.templates = new Map();
    this.reports = new Map();
    this.themes = new Map();
    this.fonts = new Map();
    this.layouts = new Map();

    this.initializeDefaults();
  }

  /**
   * Initialize default templates, themes, and layouts
   */
  initializeDefaults() {
    this.initializeThemes();
    this.initializeTemplates();
    this.initializeLayouts();
    this.initializeFonts();
  }

  /**
   * Initialize professional themes
   */
  initializeThemes() {
    this.themes.set('professional', {
      name: 'Professional',
      colors: {
        primary: '#1e3a5f',
        secondary: '#3b82f6',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#ffffff',
        backgroundSecondary: '#f9fafb',
        border: '#e5e7eb'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'JetBrains Mono'
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 24,
        xlarge: 32
      }
    });

    this.themes.set('executive', {
      name: 'Executive',
      colors: {
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#7c3aed',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        text: '#0f172a',
        textSecondary: '#475569',
        background: '#ffffff',
        backgroundSecondary: '#f8fafc',
        border: '#e2e8f0'
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Source Sans Pro',
        mono: 'JetBrains Mono'
      },
      spacing: {
        small: 12,
        medium: 20,
        large: 28,
        xlarge: 36
      }
    });

    this.themes.set('modern', {
      name: 'Modern',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        text: '#111827',
        textSecondary: '#6b7280',
        background: '#ffffff',
        backgroundSecondary: '#f3f4f6',
        border: '#d1d5db'
      },
      fonts: {
        heading: 'Poppins',
        body: 'Inter',
        mono: 'Fira Code'
      },
      spacing: {
        small: 10,
        medium: 18,
        large: 26,
        xlarge: 34
      }
    });
  }

  /**
   * Initialize report templates
   */
  initializeTemplates() {
    // Financial Analysis Report Template
    this.templates.set('financial-analysis', {
      id: 'financial-analysis',
      name: 'Financial Analysis Report',
      description: 'Comprehensive financial analysis with charts and metrics',
      category: 'analysis',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: 'Financial Analysis Report',
          layout: 'full-page'
        },
        {
          id: 'executive-summary',
          type: 'content',
          title: 'Executive Summary',
          layout: 'two-column',
          content: {
            type: 'text',
            placeholder: 'Provide a high-level overview of the analysis...'
          }
        },
        {
          id: 'company-overview',
          type: 'content',
          title: 'Company Overview',
          layout: 'single-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'text', placeholder: 'Company description...' },
              { type: 'chart', chartType: 'metric', dataSource: 'company-metrics' }
            ]
          }
        },
        {
          id: 'financial-statements',
          type: 'content',
          title: 'Financial Statements',
          layout: 'single-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'line', dataSource: 'revenue-trend' },
              { type: 'chart', chartType: 'bar', dataSource: 'profit-margins' },
              { type: 'table', dataSource: 'balance-sheet' }
            ]
          }
        },
        {
          id: 'valuation-analysis',
          type: 'content',
          title: 'Valuation Analysis',
          layout: 'two-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'comparison', dataSource: 'valuation-multiples' },
              { type: 'table', dataSource: 'dcf-model' }
            ]
          }
        },
        {
          id: 'recommendations',
          type: 'content',
          title: 'Recommendations',
          layout: 'single-column',
          content: {
            type: 'text',
            placeholder: 'Investment recommendations and rationale...'
          }
        }
      ],
      metadata: {
        author: 'FinanceAnalyst Pro',
        version: '2.0',
        tags: ['financial-analysis', 'valuation', 'investment']
      }
    });

    // Investment Memorandum Template
    this.templates.set('investment-memo', {
      id: 'investment-memo',
      name: 'Investment Memorandum',
      description: 'Professional investment recommendation document',
      category: 'investment',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: 'Investment Memorandum',
          subtitle: 'Confidential',
          layout: 'full-page'
        },
        {
          id: 'deal-summary',
          type: 'content',
          title: 'Deal Summary',
          layout: 'single-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'text', placeholder: 'Brief deal overview...' },
              { type: 'chart', chartType: 'metric', dataSource: 'deal-metrics' }
            ]
          }
        },
        {
          id: 'market-analysis',
          type: 'content',
          title: 'Market Analysis',
          layout: 'two-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'line', dataSource: 'market-trends' },
              { type: 'chart', chartType: 'pie', dataSource: 'market-share' }
            ]
          }
        },
        {
          id: 'financial-analysis',
          type: 'content',
          title: 'Financial Analysis',
          layout: 'single-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'table', dataSource: 'financial-projections' },
              { type: 'chart', chartType: 'waterfall', dataSource: 'sensitivity-analysis' }
            ]
          }
        },
        {
          id: 'risk-analysis',
          type: 'content',
          title: 'Risk Analysis',
          layout: 'two-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'heatmap', dataSource: 'risk-matrix' },
              { type: 'table', dataSource: 'risk-scenarios' }
            ]
          }
        },
        {
          id: 'investment-thesis',
          type: 'content',
          title: 'Investment Thesis',
          layout: 'single-column',
          content: {
            type: 'text',
            placeholder: 'Detailed investment rationale...'
          }
        }
      ],
      metadata: {
        author: 'FinanceAnalyst Pro',
        version: '2.0',
        tags: ['investment', 'm&a', 'due-diligence']
      }
    });

    // Executive Dashboard Template
    this.templates.set('executive-dashboard', {
      id: 'executive-dashboard',
      name: 'Executive Dashboard',
      description: 'High-level executive summary with key metrics',
      category: 'dashboard',
      sections: [
        {
          id: 'key-metrics',
          type: 'dashboard',
          title: 'Key Performance Indicators',
          layout: 'grid-4',
          content: {
            type: 'mixed',
            elements: [
              { type: 'metric', dataSource: 'revenue', format: 'currency' },
              { type: 'metric', dataSource: 'profit-margin', format: 'percentage' },
              { type: 'metric', dataSource: 'market-cap', format: 'currency' },
              { type: 'metric', dataSource: 'pe-ratio', format: 'number' }
            ]
          }
        },
        {
          id: 'performance-charts',
          type: 'dashboard',
          title: 'Performance Overview',
          layout: 'grid-2',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'line', dataSource: 'stock-price' },
              { type: 'chart', chartType: 'bar', dataSource: 'quarterly-earnings' }
            ]
          }
        },
        {
          id: 'market-position',
          type: 'dashboard',
          title: 'Market Position',
          layout: 'single-column',
          content: {
            type: 'mixed',
            elements: [
              { type: 'chart', chartType: 'pie', dataSource: 'market-share' },
              { type: 'chart', chartType: 'radar', dataSource: 'competitive-analysis' }
            ]
          }
        }
      ],
      metadata: {
        author: 'FinanceAnalyst Pro',
        version: '2.0',
        tags: ['dashboard', 'executive', 'kpi']
      }
    });
  }

  /**
   * Initialize layout configurations
   */
  initializeLayouts() {
    this.layouts.set('single-column', {
      name: 'Single Column',
      columns: 1,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      spacing: { section: 30, element: 15 }
    });

    this.layouts.set('two-column', {
      name: 'Two Column',
      columns: 2,
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      spacing: { section: 25, element: 12 },
      columnGap: 20
    });

    this.layouts.set('three-column', {
      name: 'Three Column',
      columns: 3,
      margins: { top: 15, right: 10, bottom: 15, left: 10 },
      spacing: { section: 20, element: 10 },
      columnGap: 15
    });

    this.layouts.set('grid-2', {
      name: 'Grid 2x2',
      columns: 2,
      rows: 2,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      spacing: { section: 20, element: 10 },
      columnGap: 15,
      rowGap: 15
    });

    this.layouts.set('grid-4', {
      name: 'Grid 2x2',
      columns: 2,
      rows: 2,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      spacing: { section: 20, element: 10 },
      columnGap: 15,
      rowGap: 15
    });
  }

  /**
   * Initialize font configurations
   */
  initializeFonts() {
    this.fonts.set('Inter', {
      name: 'Inter',
      family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      weights: [400, 500, 600, 700],
      styles: ['normal']
    });

    this.fonts.set('Poppins', {
      name: 'Poppins',
      family: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal']
    });

    this.fonts.set('Playfair Display', {
      name: 'Playfair Display',
      family: 'Playfair Display, Georgia, serif',
      weights: [400, 700],
      styles: ['normal', 'italic']
    });

    this.fonts.set('JetBrains Mono', {
      name: 'JetBrains Mono',
      family: 'JetBrains Mono, Consolas, Monaco, monospace',
      weights: [400, 500, 600, 700],
      styles: ['normal']
    });
  }

  /**
   * Create a new report from template
   */
  async createReport(templateId, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      title: options.title || template.name,
      description: options.description || template.description,
      author: options.author || 'FinanceAnalyst Pro',
      created: new Date(),
      modified: new Date(),
      status: 'draft',
      theme: options.theme || this.options.defaultTheme,
      sections: JSON.parse(JSON.stringify(template.sections)), // Deep clone
      data: options.data || {},
      metadata: {
        ...template.metadata,
        ...options.metadata,
        reportId: `report_${Date.now()}`
      }
    };

    this.reports.set(report.id, report);

    return report;
  }

  /**
   * Update report content
   */
  async updateReport(reportId, updates) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Update sections
    if (updates.sections) {
      report.sections = updates.sections;
    }

    // Update data
    if (updates.data) {
      report.data = { ...report.data, ...updates.data };
    }

    // Update metadata
    if (updates.metadata) {
      report.metadata = { ...report.metadata, ...updates.metadata };
    }

    // Update other properties
    Object.assign(report, updates);

    report.modified = new Date();

    return report;
  }

  /**
   * Generate report in specified format
   */
  async generateReport(reportId, format = 'pdf', options = {}) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (!this.options.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const theme = this.themes.get(report.theme) || this.themes.get(this.options.defaultTheme);

    switch (format) {
      case 'pdf':
        return await this.generatePDF(report, theme, options);
      case 'excel':
        return await this.generateExcel(report, theme, options);
      case 'powerpoint':
        return await this.generatePowerPoint(report, theme, options);
      case 'html':
        return await this.generateHTML(report, theme, options);
      case 'json':
        return await this.generateJSON(report, theme, options);
      default:
        throw new Error(`Format generation not implemented: ${format}`);
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDF(report, theme, options = {}) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Set theme colors and fonts
    doc.setTextColor(theme.colors.text);
    doc.setFont(theme.fonts.body);

    let yPosition = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont(theme.fonts.heading, 'bold');
    doc.text(report.title, 20, yPosition);
    yPosition += 30;

    // Sections
    doc.setFontSize(12);
    doc.setFont(theme.fonts.body, 'normal');

    for (const section of report.sections) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Section title
      doc.setFont(theme.fonts.heading, 'bold');
      doc.text(section.title, 20, yPosition);
      yPosition += 15;

      // Section content
      doc.setFont(theme.fonts.body, 'normal');
      if (section.content?.type === 'text' && section.content.placeholder) {
        const lines = doc.splitTextToSize(section.content.placeholder, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 10;
      }

      yPosition += 10;
    }

    return {
      data: doc.output('datauristring'),
      filename: `${report.title.replace(/\s+/g, '_')}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Generate Excel report
   */
  async generateExcel(report, theme, options = {}) {
    const XLSX = await import('../../utils/exceljs-compat.js');

    const workbook = XLSX.utils.book_new();

    // Cover sheet
    const coverData = [
      ['Report Title', report.title],
      ['Description', report.description],
      ['Author', report.author],
      ['Created', report.created.toLocaleDateString()],
      ['Modified', report.modified.toLocaleDateString()]
    ];

    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Data sheets for each section
    for (const section of report.sections) {
      if (section.content?.elements) {
        const sectionData = [];

        for (const element of section.content.elements) {
          if (element.type === 'table' && report.data[element.dataSource]) {
            sectionData.push(...report.data[element.dataSource]);
          }
        }

        if (sectionData.length > 0) {
          const sheet = XLSX.utils.aoa_to_sheet(sectionData);
          XLSX.utils.book_append_sheet(workbook, sheet, section.title.substring(0, 31));
        }
      }
    }

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    return {
      data: buffer,
      filename: `${report.title.replace(/\s+/g, '_')}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Generate PowerPoint presentation
   */
  async generatePowerPoint(report, theme, options = {}) {
    const PptxGenJS = await import('pptxgenjs');

    const pptx = new PptxGenJS();

    // Set theme
    pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
    pptx.layout = 'CUSTOM';

    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: theme.colors.primary };
    titleSlide.addText(report.title, {
      x: 0.5,
      y: 1.0,
      w: 9.0,
      h: 1.0,
      fontSize: 44,
      color: theme.colors.background,
      fontFace: theme.fonts.heading
    });

    titleSlide.addText(report.description, {
      x: 0.5,
      y: 2.5,
      w: 9.0,
      h: 0.5,
      fontSize: 20,
      color: theme.colors.background,
      fontFace: theme.fonts.body
    });

    // Content slides
    for (const section of report.sections) {
      if (section.type !== 'cover') {
        const slide = pptx.addSlide();
        slide.background = { color: theme.colors.background };

        // Section title
        slide.addText(section.title, {
          x: 0.5,
          y: 0.3,
          w: 9.0,
          h: 0.8,
          fontSize: 32,
          color: theme.colors.primary,
          fontFace: theme.fonts.heading
        });

        // Section content (simplified)
        if (section.content?.placeholder) {
          slide.addText(section.content.placeholder, {
            x: 0.5,
            y: 1.2,
            w: 9.0,
            h: 3.0,
            fontSize: 18,
            color: theme.colors.text,
            fontFace: theme.fonts.body
          });
        }
      }
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' });

    return {
      data: buffer,
      filename: `${report.title.replace(/\s+/g, '_')}.pptx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
  }

  /**
   * Generate HTML report
   */
  async generateHTML(report, theme, options = {}) {
    const themeVars = Object.entries(theme.colors)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join('\n');

    const fontVars = Object.entries(theme.fonts)
      .map(([key, value]) => `--font-${key}: ${value};`)
      .join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        :root {
            ${themeVars}
            ${fontVars}
            --spacing-small: ${theme.spacing.small}px;
            --spacing-medium: ${theme.spacing.medium}px;
            --spacing-large: ${theme.spacing.large}px;
        }

        body {
            font-family: var(--font-body);
            color: var(--color-text);
            background: var(--color-background);
            margin: 0;
            padding: var(--spacing-large);
        }

        .report-header {
            text-align: center;
            margin-bottom: var(--spacing-large);
            padding-bottom: var(--spacing-medium);
            border-bottom: 2px solid var(--color-primary);
        }

        .report-title {
            font-family: var(--font-heading);
            font-size: 2.5rem;
            color: var(--color-primary);
            margin-bottom: var(--spacing-small);
        }

        .report-description {
            font-size: 1.2rem;
            color: var(--color-text-secondary);
        }

        .section {
            margin-bottom: var(--spacing-large);
            page-break-inside: avoid;
        }

        .section-title {
            font-family: var(--font-heading);
            font-size: 1.8rem;
            color: var(--color-primary);
            margin-bottom: var(--spacing-medium);
            border-left: 4px solid var(--color-accent);
            padding-left: var(--spacing-medium);
        }

        .section-content {
            line-height: 1.6;
            color: var(--color-text);
        }

        .placeholder {
            color: var(--color-text-secondary);
            font-style: italic;
        }

        @media print {
            body {
                padding: 0;
            }

            .section {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <header class="report-header">
        <h1 class="report-title">${report.title}</h1>
        <p class="report-description">${report.description}</p>
        <p class="report-meta">
            Author: ${report.author} |
            Created: ${report.created.toLocaleDateString()} |
            Modified: ${report.modified.toLocaleDateString()}
        </p>
    </header>

    <main>
        ${report.sections
          .map(
            section => `
            <section class="section">
                <h2 class="section-title">${section.title}</h2>
                <div class="section-content">
                    ${
                      section.content?.placeholder
                        ? `<p class="placeholder">${section.content.placeholder}</p>`
                        : '<p class="placeholder">Content to be added...</p>'
                    }
                </div>
            </section>
        `
          )
          .join('')}
    </main>
</body>
</html>`;

    return {
      data: html,
      filename: `${report.title.replace(/\s+/g, '_')}.html`,
      mimeType: 'text/html'
    };
  }

  /**
   * Generate JSON report
   */
  async generateJSON(report, theme, options = {}) {
    const jsonData = {
      report: {
        id: report.id,
        title: report.title,
        description: report.description,
        author: report.author,
        created: report.created,
        modified: report.modified,
        status: report.status,
        theme: report.theme,
        template: report.templateId
      },
      sections: report.sections,
      data: report.data,
      metadata: report.metadata,
      theme: theme,
      generated: new Date()
    };

    const jsonString = JSON.stringify(jsonData, null, 2);

    return {
      data: jsonString,
      filename: `${report.title.replace(/\s+/g, '_')}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Get report templates by category
   */
  getTemplates(category = null) {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter(template => template.category === category);
    }

    return templates;
  }

  /**
   * Get available themes
   */
  getThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get report by ID
   */
  getReport(reportId) {
    return this.reports.get(reportId);
  }

  /**
   * List all reports
   */
  listReports() {
    return Array.from(this.reports.values());
  }

  /**
   * Delete report
   */
  deleteReport(reportId) {
    return this.reports.delete(reportId);
  }

  /**
   * Duplicate report
   */
  duplicateReport(reportId, options = {}) {
    const original = this.reports.get(reportId);
    if (!original) {
      throw new Error(`Report ${reportId} not found`);
    }

    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: options.title || `${original.title} (Copy)`,
      created: new Date(),
      modified: new Date(),
      status: 'draft'
    };

    this.reports.set(duplicate.id, duplicate);

    return duplicate;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      templates: this.templates.size,
      reports: this.reports.size,
      themes: this.themes.size,
      layouts: this.layouts.size,
      fonts: this.fonts.size
    };
  }

  /**
   * Export report templates
   */
  exportTemplates() {
    return {
      templates: Object.fromEntries(this.templates),
      themes: Object.fromEntries(this.themes),
      layouts: Object.fromEntries(this.layouts),
      fonts: Object.fromEntries(this.fonts),
      exportedAt: new Date()
    };
  }

  /**
   * Import report templates
   */
  importTemplates(data) {
    if (data.templates) {
      for (const [id, template] of Object.entries(data.templates)) {
        this.templates.set(id, template);
      }
    }

    if (data.themes) {
      for (const [id, theme] of Object.entries(data.themes)) {
        this.themes.set(id, theme);
      }
    }

    if (data.layouts) {
      for (const [id, layout] of Object.entries(data.layouts)) {
        this.layouts.set(id, layout);
      }
    }

    if (data.fonts) {
      for (const [id, font] of Object.entries(data.fonts)) {
        this.fonts.set(id, font);
      }
    }
  }

  /**
   * Clear all data
   */
  clear() {
    this.templates.clear();
    this.reports.clear();
    this.themes.clear();
    this.layouts.clear();
    this.fonts.clear();

    this.initializeDefaults();
  }
}

// Export singleton instance
export const reportBuilderService = new ReportBuilderService();
export default ReportBuilderService;
