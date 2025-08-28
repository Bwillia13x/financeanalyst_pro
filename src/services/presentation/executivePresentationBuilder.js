// Executive Presentation Builder - Phase 2 Implementation
// import JSZip from 'jszip'; // Commented out - not currently used

export class ExecutivePresentationBuilder {
  constructor() {
    this.presentations = new Map();
    this.templates = new Map();
    this.slides = new Map();
    this.themes = new Map();
    this.assets = new Map();
    this.exportFormats = ['pptx', 'pdf', 'html', 'png'];
    this.eventHandlers = new Map();
    this.initializeDefaultTemplates();
    this.initializeThemes();
  }

  // Initialize default presentation templates
  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'investment-pitch',
        name: 'Investment Pitch Deck',
        category: 'investment',
        description: 'Professional pitch deck for investment presentations',
        slides: [
          { type: 'title', title: 'Investment Opportunity', layout: 'title-only' },
          { type: 'executive-summary', title: 'Executive Summary', layout: 'bullet-points' },
          { type: 'market-opportunity', title: 'Market Opportunity', layout: 'chart-text' },
          { type: 'financial-highlights', title: 'Financial Highlights', layout: 'metrics-grid' },
          { type: 'valuation', title: 'Valuation Analysis', layout: 'comparison-table' },
          { type: 'competitive-analysis', title: 'Competitive Landscape', layout: 'matrix' },
          { type: 'financial-projections', title: 'Financial Projections', layout: 'chart-heavy' },
          { type: 'investment-thesis', title: 'Investment Thesis', layout: 'key-points' },
          { type: 'risks-mitigation', title: 'Risks & Mitigation', layout: 'two-column' },
          { type: 'next-steps', title: 'Next Steps', layout: 'timeline' }
        ]
      },
      {
        id: 'quarterly-review',
        name: 'Quarterly Business Review',
        category: 'reporting',
        description: 'Comprehensive quarterly performance review',
        slides: [
          { type: 'title', title: 'Q4 2024 Business Review', layout: 'title-subtitle' },
          { type: 'agenda', title: 'Agenda', layout: 'bullet-points' },
          { type: 'key-metrics', title: 'Key Performance Metrics', layout: 'kpi-dashboard' },
          {
            type: 'financial-performance',
            title: 'Financial Performance',
            layout: 'chart-comparison'
          },
          {
            type: 'operational-highlights',
            title: 'Operational Highlights',
            layout: 'icon-bullets'
          },
          { type: 'market-analysis', title: 'Market Analysis', layout: 'chart-text' },
          { type: 'challenges-opportunities', title: 'Challenges & Opportunities', layout: 'swot' },
          { type: 'outlook', title: 'Forward Looking', layout: 'forecast-chart' },
          { type: 'action-items', title: 'Action Items', layout: 'task-list' }
        ]
      },
      {
        id: 'ma-analysis',
        name: 'M&A Analysis Presentation',
        category: 'analysis',
        description: 'Merger & acquisition analysis presentation',
        slides: [
          { type: 'title', title: 'M&A Transaction Analysis', layout: 'title-only' },
          { type: 'transaction-overview', title: 'Transaction Overview', layout: 'fact-sheet' },
          { type: 'strategic-rationale', title: 'Strategic Rationale', layout: 'key-points' },
          { type: 'financial-analysis', title: 'Financial Analysis', layout: 'metrics-comparison' },
          { type: 'synergies', title: 'Synergy Analysis', layout: 'waterfall-chart' },
          { type: 'valuation-methods', title: 'Valuation Methodology', layout: 'comparison-table' },
          {
            type: 'accretion-dilution',
            title: 'Accretion/Dilution Analysis',
            layout: 'sensitivity-table'
          },
          { type: 'risk-assessment', title: 'Risk Assessment', layout: 'risk-matrix' },
          { type: 'recommendation', title: 'Recommendation', layout: 'decision-framework' }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  initializeThemes() {
    const themes = [
      {
        id: 'professional',
        name: 'Professional',
        colors: {
          primary: '#1e40af',
          secondary: '#64748b',
          accent: '#0ea5e9',
          success: '#059669',
          warning: '#d97706',
          error: '#dc2626',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1f2937',
          textSecondary: '#6b7280'
        },
        fonts: {
          heading: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, Consolas, monospace'
        },
        spacing: {
          slideMargin: 40,
          contentPadding: 32,
          elementSpacing: 24
        }
      },
      {
        id: 'executive',
        name: 'Executive',
        colors: {
          primary: '#0f172a',
          secondary: '#475569',
          accent: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          background: '#ffffff',
          surface: '#f1f5f9',
          text: '#0f172a',
          textSecondary: '#64748b'
        },
        fonts: {
          heading: 'Georgia, serif',
          body: 'Inter, system-ui, sans-serif',
          mono: 'Monaco, Consolas, monospace'
        },
        spacing: {
          slideMargin: 48,
          contentPadding: 40,
          elementSpacing: 32
        }
      },
      {
        id: 'investment',
        name: 'Investment Banking',
        colors: {
          primary: '#991b1b',
          secondary: '#374151',
          accent: '#dc2626',
          success: '#065f46',
          warning: '#92400e',
          error: '#b91c1c',
          background: '#ffffff',
          surface: '#fafafa',
          text: '#111827',
          textSecondary: '#4b5563'
        },
        fonts: {
          heading: 'Times New Roman, serif',
          body: 'Arial, sans-serif',
          mono: 'Courier New, monospace'
        },
        spacing: {
          slideMargin: 36,
          contentPadding: 28,
          elementSpacing: 20
        }
      }
    ];

    themes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  // Presentation Management
  async createPresentation(config, userId) {
    const presentation = {
      id: this.generatePresentationId(),
      title: config.title || 'Untitled Presentation',
      description: config.description || '',
      templateId: config.templateId || null,
      themeId: config.themeId || 'professional',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      modifiedBy: userId,
      slides: [],
      settings: {
        aspectRatio: config.aspectRatio || '16:9', // 16:9, 4:3
        slideSize: config.slideSize || 'standard', // standard, widescreen
        autoAdvance: config.autoAdvance || false,
        transitionType: config.transitionType || 'fade',
        speakerNotes: config.speakerNotes !== false,
        animations: config.animations !== false
      },
      metadata: {
        industry: config.industry || 'general',
        audience: config.audience || 'executive',
        duration: config.duration || 30, // minutes
        tags: config.tags || []
      },
      collaboration: {
        isShared: config.isShared || false,
        editors: config.editors || [],
        viewers: config.viewers || [],
        comments: []
      },
      analytics: {
        views: 0,
        downloads: 0,
        shares: 0,
        avgViewTime: 0
      }
    };

    this.presentations.set(presentation.id, presentation);

    // Apply template if specified
    if (config.templateId) {
      await this.applyTemplate(presentation.id, config.templateId, userId);
    }

    this.emit('presentation_created', presentation);
    return presentation;
  }

  async applyTemplate(presentationId, templateId, userId) {
    const presentation = this.presentations.get(presentationId);
    const template = this.templates.get(templateId);

    if (!presentation || !template) {
      throw new Error('Presentation or template not found');
    }

    // Clear existing slides
    presentation.slides.forEach(slideId => {
      this.slides.delete(slideId);
    });
    presentation.slides = [];

    // Create slides from template
    for (const templateSlide of template.slides) {
      const slide = await this.createSlide(
        presentationId,
        {
          type: templateSlide.type,
          title: templateSlide.title,
          layout: templateSlide.layout
        },
        userId
      );

      presentation.slides.push(slide.id);
    }

    presentation.templateId = templateId;
    presentation.lastModified = new Date().toISOString();
    presentation.modifiedBy = userId;

    return presentation;
  }

  // Slide Management
  async createSlide(presentationId, slideConfig, userId) {
    const presentation = this.presentations.get(presentationId);
    if (!presentation) {
      throw new Error('Presentation not found');
    }

    const slide = {
      id: this.generateSlideId(),
      presentationId,
      type: slideConfig.type || 'content',
      title: slideConfig.title || 'New Slide',
      layout: slideConfig.layout || 'title-content',
      order: slideConfig.order || presentation.slides.length,
      content: {
        elements: [],
        background: slideConfig.background || null,
        notes: slideConfig.notes || ''
      },
      styling: {
        backgroundColor: slideConfig.backgroundColor || null,
        backgroundImage: slideConfig.backgroundImage || null,
        textAlign: slideConfig.textAlign || 'left',
        padding: slideConfig.padding || 32
      },
      animations: slideConfig.animations || [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
      lastModified: new Date().toISOString()
    };

    // Initialize slide with default elements based on layout
    slide.content.elements = this.getDefaultElementsForLayout(slide.layout);

    this.slides.set(slide.id, slide);

    if (slideConfig.order !== undefined) {
      presentation.slides.splice(slideConfig.order, 0, slide.id);
    } else {
      presentation.slides.push(slide.id);
    }

    presentation.lastModified = new Date().toISOString();
    presentation.modifiedBy = userId;

    this.emit('slide_created', { slide, presentationId });
    return slide;
  }

  getDefaultElementsForLayout(layout) {
    const layouts = {
      'title-only': [
        { type: 'title', content: 'Slide Title', position: { x: 10, y: 40, width: 80, height: 20 } }
      ],
      'title-content': [
        {
          type: 'title',
          content: 'Slide Title',
          position: { x: 10, y: 10, width: 80, height: 15 }
        },
        {
          type: 'text',
          content: 'Content goes here',
          position: { x: 10, y: 30, width: 80, height: 60 }
        }
      ],
      'bullet-points': [
        {
          type: 'title',
          content: 'Slide Title',
          position: { x: 10, y: 10, width: 80, height: 15 }
        },
        {
          type: 'bullets',
          content: ['Point 1', 'Point 2', 'Point 3'],
          position: { x: 10, y: 30, width: 80, height: 60 }
        }
      ],
      'chart-text': [
        {
          type: 'title',
          content: 'Slide Title',
          position: { x: 10, y: 10, width: 80, height: 15 }
        },
        { type: 'chart', content: null, position: { x: 10, y: 25, width: 45, height: 65 } },
        {
          type: 'text',
          content: 'Analysis text',
          position: { x: 60, y: 25, width: 30, height: 65 }
        }
      ],
      'two-column': [
        {
          type: 'title',
          content: 'Slide Title',
          position: { x: 10, y: 10, width: 80, height: 15 }
        },
        { type: 'text', content: 'Left column', position: { x: 10, y: 25, width: 35, height: 65 } },
        { type: 'text', content: 'Right column', position: { x: 55, y: 25, width: 35, height: 65 } }
      ],
      'metrics-grid': [
        {
          type: 'title',
          content: 'Key Metrics',
          position: { x: 10, y: 10, width: 80, height: 15 }
        },
        {
          type: 'kpi',
          content: { value: '$100M', label: 'Revenue', trend: '+12%' },
          position: { x: 10, y: 25, width: 35, height: 30 }
        },
        {
          type: 'kpi',
          content: { value: '15%', label: 'EBITDA Margin', trend: '+2%' },
          position: { x: 55, y: 25, width: 35, height: 30 }
        },
        {
          type: 'kpi',
          content: { value: '$2.5B', label: 'Market Cap', trend: '+25%' },
          position: { x: 10, y: 65, width: 35, height: 30 }
        },
        {
          type: 'kpi',
          content: { value: '12.5x', label: 'P/E Ratio', trend: '-5%' },
          position: { x: 55, y: 65, width: 35, height: 30 }
        }
      ]
    };

    return layouts[layout] || layouts['title-content'];
  }

  // Content Element Management
  async addElement(slideId, element, _userId) {
    const slide = this.slides.get(slideId);
    if (!slide) {
      throw new Error('Slide not found');
    }

    const newElement = {
      id: this.generateElementId(),
      type: element.type,
      content: element.content,
      position: element.position || { x: 10, y: 10, width: 30, height: 20 },
      styling: element.styling || {},
      animations: element.animations || [],
      createdAt: new Date().toISOString()
    };

    slide.content.elements.push(newElement);
    slide.lastModified = new Date().toISOString();

    this.emit('element_added', { slideId, element: newElement });
    return newElement;
  }

  async updateElement(slideId, elementId, updates, _userId) {
    const slide = this.slides.get(slideId);
    if (!slide) {
      throw new Error('Slide not found');
    }

    const elementIndex = slide.content.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) {
      throw new Error('Element not found');
    }

    const element = slide.content.elements[elementIndex];
    Object.assign(element, updates);
    slide.lastModified = new Date().toISOString();

    this.emit('element_updated', { slideId, element, updates });
    return element;
  }

  // Data Integration for Financial Content
  async populateSlideWithFinancialData(slideId, dataSource, mappings) {
    const slide = this.slides.get(slideId);
    if (!slide) {
      throw new Error('Slide not found');
    }

    // Map data to slide elements based on mappings
    for (const mapping of mappings) {
      const element = slide.content.elements.find(el => el.id === mapping.elementId);
      if (!element) continue;

      switch (element.type) {
        case 'chart':
          element.content = await this.formatChartData(dataSource, mapping);
          break;
        case 'kpi':
          element.content = await this.formatKPIData(dataSource, mapping);
          break;
        case 'table':
          element.content = await this.formatTableData(dataSource, mapping);
          break;
        case 'text':
          element.content = await this.formatTextData(dataSource, mapping);
          break;
      }
    }

    slide.lastModified = new Date().toISOString();
    this.emit('slide_data_populated', { slideId, dataSource });
    return slide;
  }

  async formatChartData(dataSource, mapping) {
    return {
      type: mapping.chartType || 'line',
      data: {
        labels: dataSource.labels || [],
        datasets: [
          {
            label: mapping.label || 'Data',
            data: dataSource.values || [],
            backgroundColor: mapping.backgroundColor || '#3b82f6',
            borderColor: mapping.borderColor || '#1d4ed8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: mapping.yAxisLabel || 'Value'
            }
          },
          x: {
            title: {
              display: true,
              text: mapping.xAxisLabel || 'Period'
            }
          }
        }
      }
    };
  }

  async formatKPIData(dataSource, mapping) {
    const value = dataSource[mapping.valueField] || 0;
    const previousValue = dataSource[mapping.previousValueField] || 0;
    const change = value - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      value: this.formatNumber(value, mapping.format),
      label: mapping.label || 'KPI',
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
      change: this.formatNumber(changePercent, 'percentage') + '%',
      previousValue: this.formatNumber(previousValue, mapping.format)
    };
  }

  async formatTableData(_dataSource, _mapping) {
    // Placeholder implementation for table data formatting
    return {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6']
      ]
    };
  }

  async formatTextData(_dataSource, _mapping) {
    // Placeholder implementation for text data formatting
    return 'Formatted text content';
  }

  // Export Functions
  async exportToPowerPoint(presentationId, options = {}) {
    const presentation = this.presentations.get(presentationId);
    if (!presentation) {
      throw new Error('Presentation not found');
    }

    const pptxData = await this.generatePowerPointData(presentation, options);

    // Track analytics
    presentation.analytics.downloads++;

    return pptxData;
  }

  async generatePowerPointData(presentation, _options) {
    // This would integrate with a library like PptxGenJS
    const theme = this.themes.get(presentation.themeId);
    const slides = presentation.slides.map(id => this.slides.get(id)).filter(Boolean);

    const pptxConfig = {
      title: presentation.title,
      author: presentation.createdBy,
      subject: presentation.description,
      layout: presentation.settings.aspectRatio,
      masterSlide: {
        backgroundColor: theme.colors.background,
        margin: theme.spacing.slideMargin
      },
      slides: slides.map(slide => this.convertSlideForPowerPoint(slide, theme))
    };

    // Generate PPTX using PptxGenJS or similar library
    // This is a simplified representation
    return {
      type: 'pptx',
      data: pptxConfig,
      filename: `${presentation.title.replace(/\s+/g, '_')}.pptx`
    };
  }

  convertSlideForPowerPoint(slide, theme) {
    return {
      title: slide.title,
      backgroundColor: slide.styling.backgroundColor || theme.colors.background,
      elements: slide.content.elements.map(element => ({
        type: element.type,
        content: element.content,
        position: {
          x: `${element.position.x}%`,
          y: `${element.position.y}%`,
          w: `${element.position.width}%`,
          h: `${element.position.height}%`
        },
        styling: {
          fontSize: element.styling.fontSize || 14,
          color: element.styling.color || theme.colors.text,
          fontFamily: element.styling.fontFamily || theme.fonts.body,
          textAlign: element.styling.textAlign || 'left'
        }
      })),
      notes: slide.content.notes
    };
  }

  async exportToPDF(presentationId, options = {}) {
    const presentation = this.presentations.get(presentationId);
    if (!presentation) {
      throw new Error('Presentation not found');
    }

    // Generate HTML version first, then convert to PDF
    const htmlContent = await this.generateHTMLPresentation(presentation, {
      ...options,
      printMode: true
    });

    // This would use puppeteer or similar for PDF generation
    const pdfBuffer = await this.htmlToPDF(htmlContent, {
      format: 'A4',
      landscape: presentation.settings.aspectRatio === '16:9',
      printBackground: true,
      margin: { top: 20, bottom: 20, left: 20, right: 20 }
    });

    presentation.analytics.downloads++;

    return {
      type: 'pdf',
      data: pdfBuffer,
      filename: `${presentation.title.replace(/\s+/g, '_')}.pdf`
    };
  }

  async generateHTMLPresentation(presentation, options = {}) {
    const theme = this.themes.get(presentation.themeId);
    const slides = presentation.slides.map(id => this.slides.get(id)).filter(Boolean);

    const css = this.generatePresentationCSS(theme, presentation.settings);
    const slidesHTML = slides.map(slide => this.generateSlideHTML(slide, theme)).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${presentation.title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${css}</style>
        ${options.includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
      </head>
      <body>
        <div class="presentation-container">
          ${slidesHTML}
        </div>
        ${options.includeNavigation ? this.generateNavigationHTML() : ''}
        ${options.includeCharts ? '<script>initCharts();</script>' : ''}
      </body>
      </html>
    `;
  }

  generatePresentationCSS(theme, settings) {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: ${theme.fonts.body};
        color: ${theme.colors.text};
        background: ${theme.colors.background};
        line-height: 1.6;
      }

      .presentation-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .slide {
        width: 100%;
        min-height: ${settings.aspectRatio === '16:9' ? '675px' : '900px'};
        background: ${theme.colors.surface};
        margin-bottom: 40px;
        padding: ${theme.spacing.contentPadding}px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .slide-title {
        font-family: ${theme.fonts.heading};
        font-size: 2.5rem;
        font-weight: 700;
        color: ${theme.colors.primary};
        margin-bottom: ${theme.spacing.elementSpacing}px;
      }

      .slide-element {
        position: absolute;
      }

      .kpi-element {
        background: ${theme.colors.background};
        border: 2px solid ${theme.colors.primary};
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }

      .kpi-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: ${theme.colors.primary};
      }

      .kpi-label {
        font-size: 1rem;
        color: ${theme.colors.textSecondary};
        margin-top: 8px;
      }

      .chart-container {
        position: relative;
        height: 100%;
        width: 100%;
      }

      @media print {
        .slide {
          page-break-after: always;
          margin: 0;
          box-shadow: none;
        }
      }
    `;
  }

  // Utility Methods
  formatNumber(value, format) {
    if (typeof value !== 'number') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1
        }).format(value / 100);
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value.toString();
    }
  }

  generatePresentationId() {
    return `presentation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSlideId() {
    return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateElementId() {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event System
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in presentation event handler for ${event}:`, error);
        }
      });
    }
  }

  // Query Methods
  getUserPresentations(userId, filters = {}) {
    let presentations = Array.from(this.presentations.values()).filter(
      p => p.createdBy === userId || p.collaboration.editors.includes(userId)
    );

    if (filters.industry) {
      presentations = presentations.filter(p => p.metadata.industry === filters.industry);
    }

    if (filters.audience) {
      presentations = presentations.filter(p => p.metadata.audience === filters.audience);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      presentations = presentations.filter(
        p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return presentations.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  getTemplates(category = null) {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    return templates;
  }
}

export const executivePresentationBuilder = new ExecutivePresentationBuilder();
export const executivePresentationService = executivePresentationBuilder;
