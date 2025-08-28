// Dashboard Template Library - Phase 2 Implementation
export class DashboardTemplateLibrary {
  constructor() {
    this.templates = new Map();
    this.collections = new Map();
    this.userTemplates = new Map();
    this.templateUsage = new Map();
    this.ratings = new Map();
    this.eventHandlers = new Map();
    this.initializeIndustryTemplates();
    this.initializeCollections();
  }

  initializeIndustryTemplates() {
    const industryTemplates = [
      {
        id: 'saas-metrics-dashboard',
        name: 'SaaS Metrics Dashboard',
        description: 'Comprehensive SaaS business metrics tracking',
        industry: 'technology',
        category: 'metrics',
        subcategory: 'saas',
        thumbnail: '/templates/saas-metrics.png',
        tags: ['saas', 'metrics', 'arr', 'churn', 'ltv'],
        difficulty: 'intermediate',
        estimatedSetupTime: 15,
        author: 'FinanceAnalyst Pro',
        isOfficial: true,
        widgets: [
          {
            type: 'kpi',
            title: 'Annual Recurring Revenue',
            position: { x: 0, y: 0, w: 3, h: 2 },
            config: { format: 'currency', showTrend: true, trendPeriod: 'monthly' },
            dataBinding: 'metrics.arr'
          },
          {
            type: 'kpi',
            title: 'Monthly Churn Rate',
            position: { x: 3, y: 0, w: 3, h: 2 },
            config: { format: 'percentage', showTrend: true, alertThreshold: 0.05 },
            dataBinding: 'metrics.churn_rate'
          },
          {
            type: 'chart',
            title: 'ARR Growth Trend',
            position: { x: 0, y: 2, w: 6, h: 4 },
            config: { chartType: 'line', timeRange: '12m', yAxis: { format: 'currency' } },
            dataBinding: 'timeseries.arr_growth'
          },
          {
            type: 'table',
            title: 'Top Customer Segments',
            position: { x: 0, y: 6, w: 12, h: 3 },
            config: { columns: ['segment', 'customers', 'arr', 'churn_rate', 'ltv'] },
            dataBinding: 'segments.customer_segments'
          }
        ],
        layout: { type: 'grid', columns: 12, rowHeight: 80, margin: [10, 10] },
        theme: 'professional',
        dataSources: ['saas_metrics_api', 'customer_database'],
        requirements: { dataConnections: ['stripe', 'mixpanel'], minimumDataPeriod: '3months' }
      },
      {
        id: 'reit-analysis-dashboard',
        name: 'REIT Analysis Dashboard',
        description: 'Real Estate Investment Trust performance analysis',
        industry: 'real_estate',
        category: 'analysis',
        subcategory: 'reit',
        thumbnail: '/templates/reit-analysis.png',
        tags: ['reit', 'real-estate', 'ffo', 'noi', 'occupancy'],
        difficulty: 'intermediate',
        estimatedSetupTime: 20,
        author: 'FinanceAnalyst Pro',
        isOfficial: true,
        widgets: [
          {
            type: 'kpi',
            title: 'Funds From Operations',
            position: { x: 0, y: 0, w: 3, h: 2 },
            config: { format: 'currency', showTrend: true, trendPeriod: 'quarterly' },
            dataBinding: 'metrics.ffo'
          },
          {
            type: 'kpi',
            title: 'Occupancy Rate',
            position: { x: 6, y: 0, w: 3, h: 2 },
            config: { format: 'percentage', precision: 1, showTrend: true },
            dataBinding: 'metrics.occupancy_rate'
          },
          {
            type: 'chart',
            title: 'Portfolio Performance',
            position: { x: 0, y: 2, w: 8, h: 4 },
            config: { chartType: 'mixed', series: [{ type: 'line', metric: 'noi' }] },
            dataBinding: 'timeseries.portfolio_performance'
          }
        ],
        layout: { type: 'grid', columns: 12, rowHeight: 75 },
        theme: 'real_estate',
        dataSources: ['reit_financials', 'property_data']
      },
      {
        id: 'bank-performance-dashboard',
        name: 'Bank Performance Dashboard',
        description: 'Comprehensive banking performance metrics',
        industry: 'financial_services',
        category: 'performance',
        subcategory: 'banking',
        thumbnail: '/templates/bank-performance.png',
        tags: ['banking', 'nim', 'credit-loss', 'deposits'],
        difficulty: 'intermediate',
        estimatedSetupTime: 18,
        author: 'FinanceAnalyst Pro',
        isOfficial: true,
        widgets: [
          {
            type: 'kpi',
            title: 'Net Interest Margin',
            position: { x: 0, y: 0, w: 3, h: 2 },
            config: { format: 'percentage', precision: 2, showTrend: true },
            dataBinding: 'metrics.net_interest_margin'
          },
          {
            type: 'chart',
            title: 'Loan Portfolio Composition',
            position: { x: 0, y: 2, w: 6, h: 4 },
            config: { chartType: 'donut', showLabels: true },
            dataBinding: 'portfolio.loan_composition'
          }
        ],
        layout: { type: 'grid', columns: 12, rowHeight: 75 },
        theme: 'financial',
        dataSources: ['core_banking', 'regulatory_reports']
      }
    ];

    industryTemplates.forEach(template => {
      template.createdAt = new Date().toISOString();
      template.updatedAt = new Date().toISOString();
      template.version = '1.0.0';
      template.downloads = 0;
      template.rating = 0;
      template.ratingCount = 0;
      template.isActive = true;

      this.templates.set(template.id, template);
    });
  }

  initializeCollections() {
    const collections = [
      {
        id: 'essential_industry_pack',
        name: 'Essential Industry Pack',
        description: 'Core dashboard templates for major industries',
        type: 'curated',
        templates: [
          'saas-metrics-dashboard',
          'reit-analysis-dashboard',
          'bank-performance-dashboard'
        ],
        author: 'FinanceAnalyst Pro',
        isOfficial: true,
        tags: ['essential', 'industry', 'starter'],
        thumbnail: '/collections/essential-pack.png'
      }
    ];

    collections.forEach(collection => {
      collection.createdAt = new Date().toISOString();
      collection.downloads = 0;
      this.collections.set(collection.id, collection);
    });
  }

  async createTemplate(templateData, userId) {
    const template = {
      id: templateData.id || this.generateTemplateId(),
      name: templateData.name,
      description: templateData.description,
      industry: templateData.industry,
      category: templateData.category,
      tags: templateData.tags || [],
      difficulty: templateData.difficulty || 'intermediate',
      estimatedSetupTime: templateData.estimatedSetupTime || 15,
      widgets: templateData.widgets || [],
      layout: templateData.layout || this.getDefaultLayout(),
      theme: templateData.theme || 'professional',
      author: userId,
      isOfficial: false,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      ratingCount: 0,
      isActive: true
    };

    this.templates.set(template.id, template);
    this.emit('template_created', template);
    return template;
  }

  searchTemplates(query, filters = {}) {
    let templates = Array.from(this.templates.values()).filter(template => template.isActive);

    if (query) {
      const queryLower = query.toLowerCase();
      templates = templates.filter(
        template =>
          template.name.toLowerCase().includes(queryLower) ||
          template.description.toLowerCase().includes(queryLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    if (filters.industry) {
      templates = templates.filter(template => template.industry === filters.industry);
    }

    if (filters.category) {
      templates = templates.filter(template => template.category === filters.category);
    }

    return templates.sort((a, b) => b.downloads - a.downloads);
  }

  getTemplatesByIndustry(industry, limit = null) {
    let templates = Array.from(this.templates.values())
      .filter(template => template.isActive && template.industry === industry)
      .sort((a, b) => b.downloads - a.downloads);

    if (limit) {
      templates = templates.slice(0, limit);
    }

    return templates;
  }

  getPopularTemplates(limit = 10) {
    return Array.from(this.templates.values())
      .filter(template => template.isActive)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  async downloadTemplate(templateId, userId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.downloads++;

    const usage = {
      templateId,
      userId,
      action: 'download',
      timestamp: new Date().toISOString()
    };

    if (!this.templateUsage.has(templateId)) {
      this.templateUsage.set(templateId, []);
    }
    this.templateUsage.get(templateId).push(usage);

    this.emit('template_downloaded', { template, userId });
    return template;
  }

  async rateTemplate(templateId, rating, review, userId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const ratingData = {
      id: this.generateRatingId(),
      templateId,
      userId,
      rating,
      review: review || '',
      createdAt: new Date().toISOString()
    };

    if (!this.ratings.has(templateId)) {
      this.ratings.set(templateId, []);
    }

    this.ratings.get(templateId).push(ratingData);
    this.recalculateTemplateRating(templateId);

    this.emit('template_rated', { templateId, rating, userId });
    return ratingData;
  }

  recalculateTemplateRating(templateId) {
    const template = this.templates.get(templateId);
    const ratings = this.ratings.get(templateId) || [];

    if (ratings.length === 0) {
      template.rating = 0;
      template.ratingCount = 0;
      return;
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    template.rating = Math.round((totalRating / ratings.length) * 10) / 10;
    template.ratingCount = ratings.length;
  }

  async createDashboardFromTemplate(templateId, dashboardName, userId, customizations = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const dashboard = {
      id: this.generateDashboardId(),
      name: dashboardName,
      description: template.description,
      templateId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      layout: { ...template.layout, ...customizations.layout },
      theme: customizations.theme || template.theme,
      widgets: template.widgets.map(widget => ({
        ...widget,
        id: this.generateWidgetId(),
        ...(customizations.widgets?.[widget.id] || {})
      })),
      dataSources: [...template.dataSources],
      isPublic: customizations.isPublic || false
    };

    await this.downloadTemplate(templateId, userId);
    this.emit('dashboard_created_from_template', { dashboard, template });
    return dashboard;
  }

  getTemplateAnalytics(templateId) {
    const template = this.templates.get(templateId);
    const usage = this.templateUsage.get(templateId) || [];
    const ratings = this.ratings.get(templateId) || [];

    if (!template) return null;

    return {
      template: {
        id: template.id,
        name: template.name,
        downloads: template.downloads,
        rating: template.rating,
        ratingCount: template.ratingCount
      },
      usage: {
        total: usage.length,
        last30Days: usage.filter(
          u => new Date(u.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        uniqueUsers: new Set(usage.map(u => u.userId)).size
      },
      ratings: {
        average: template.rating,
        distribution: this.getRatingDistribution(ratings),
        recent: ratings.slice(-10).reverse()
      }
    };
  }

  getRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      distribution[rating.rating]++;
    });
    return distribution;
  }

  getDefaultLayout() {
    return {
      type: 'grid',
      columns: 12,
      rowHeight: 80,
      margin: [10, 10],
      containerPadding: [10, 10]
    };
  }

  generateTemplateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDashboardId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWidgetId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRatingId() {
    return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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
          console.error(`Error in template library event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const dashboardTemplateLibrary = new DashboardTemplateLibrary();
export const dashboardTemplateService = dashboardTemplateLibrary;
