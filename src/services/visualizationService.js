/**
 * Advanced Data Visualization and Interactive Dashboard Builder Service
 * Creates dynamic, customizable visualizations and interactive dashboards
 */

class VisualizationService {
  constructor() {
    this.dashboards = new Map();
    this.widgets = new Map();
    this.chartTemplates = new Map();
    this.visualizations = new Map();
    this.themes = new Map();
    this.isInitialized = false;

    this.initializeService();
  }

  async initializeService() {
    try {
      this.setupChartTemplates();
      this.setupVisualizationThemes();
      this.setupDefaultWidgets();
      this.setupDashboardTemplates();

      this.isInitialized = true;
      console.log('Visualization service initialized with advanced dashboard builder');
    } catch (error) {
      console.error('Error initializing visualization service:', error);
    }
  }

  setupChartTemplates() {
    // Financial Performance Charts
    this.chartTemplates.set('revenue_trend', {
      type: 'line',
      name: 'Revenue Trend Analysis',
      category: 'financial_performance',
      config: {
        dataKeys: ['period', 'revenue', 'growthRate'],
        xAxis: 'period',
        yAxes: [
          { key: 'revenue', type: 'currency', position: 'left', color: '#3b82f6' },
          { key: 'growthRate', type: 'percentage', position: 'right', color: '#10b981' }
        ],
        showTrendLine: true,
        showDataLabels: false,
        responsive: true
      }
    });

    this.chartTemplates.set('profitability_waterfall', {
      type: 'waterfall',
      name: 'Profitability Waterfall',
      category: 'financial_performance',
      config: {
        dataKeys: ['category', 'value', 'type'],
        xAxis: 'category',
        yAxis: 'value',
        colorMapping: {
          positive: '#10b981',
          negative: '#ef4444',
          total: '#3b82f6'
        },
        showConnectors: true,
        cumulative: true
      }
    });

    this.chartTemplates.set('market_comparison', {
      type: 'radar',
      name: 'Market Position Comparison',
      category: 'competitive_analysis',
      config: {
        dataKeys: ['metric', 'company', 'peer1', 'peer2', 'peer3'],
        angleKey: 'metric',
        radiusKey: 'value',
        groupKey: 'entity',
        scale: { min: 0, max: 100 },
        gridLevels: 5,
        showLegend: true
      }
    });

    this.chartTemplates.set('portfolio_allocation', {
      type: 'donut',
      name: 'Portfolio Allocation',
      category: 'portfolio_management',
      config: {
        dataKeys: ['asset', 'allocation', 'value'],
        labelKey: 'asset',
        valueKey: 'allocation',
        innerRadius: 0.6,
        showPercentages: true,
        showValues: true,
        colorScheme: 'category10'
      }
    });

    this.chartTemplates.set('risk_return_scatter', {
      type: 'scatter',
      name: 'Risk-Return Analysis',
      category: 'risk_analysis',
      config: {
        dataKeys: ['asset', 'risk', 'return', 'size'],
        xAxis: 'risk',
        yAxis: 'return',
        sizeKey: 'size',
        colorKey: 'asset',
        showQuadrants: true,
        quadrantLabels: ['Low Risk/Low Return', 'High Risk/Low Return', 'Low Risk/High Return', 'High Risk/High Return']
      }
    });

    this.chartTemplates.set('cashflow_timeline', {
      type: 'area',
      name: 'Cash Flow Timeline',
      category: 'cash_flow',
      config: {
        dataKeys: ['period', 'operating', 'investing', 'financing', 'net'],
        xAxis: 'period',
        yAxis: 'value',
        stacked: false,
        showBaseline: true,
        gradient: true,
        colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981']
      }
    });

    this.chartTemplates.set('valuation_sensitivity', {
      type: 'heatmap',
      name: 'Valuation Sensitivity Analysis',
      category: 'valuation',
      config: {
        dataKeys: ['discount_rate', 'growth_rate', 'valuation'],
        xAxis: 'growth_rate',
        yAxis: 'discount_rate',
        valueKey: 'valuation',
        colorScale: 'blues',
        showValues: true,
        cellSize: 'auto'
      }
    });
  }

  setupVisualizationThemes() {
    this.themes.set('professional', {
      name: 'Professional',
      colors: {
        primary: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
        secondary: ['#064e3b', '#059669', '#10b981', '#34d399'],
        accent: ['#7c2d12', '#ea580c', '#f97316', '#fb923c'],
        neutral: ['#374151', '#6b7280', '#9ca3af', '#d1d5db']
      },
      fonts: {
        title: { family: 'Inter', size: 16, weight: 600 },
        axis: { family: 'Inter', size: 12, weight: 400 },
        label: { family: 'Inter', size: 10, weight: 400 }
      },
      grid: { color: '#e5e7eb', width: 1, opacity: 0.5 },
      background: '#ffffff',
      borderRadius: 8
    });

    this.themes.set('executive', {
      name: 'Executive',
      colors: {
        primary: ['#111827', '#374151', '#6b7280', '#9ca3af'],
        secondary: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'],
        accent: ['#7c2d12', '#ea580c', '#f97316', '#fb923c'],
        neutral: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db']
      },
      fonts: {
        title: { family: 'Georgia', size: 18, weight: 600 },
        axis: { family: 'Georgia', size: 13, weight: 400 },
        label: { family: 'Georgia', size: 11, weight: 400 }
      },
      grid: { color: '#d1d5db', width: 1, opacity: 0.3 },
      background: '#ffffff',
      borderRadius: 4
    });

    this.themes.set('dark', {
      name: 'Dark Mode',
      colors: {
        primary: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
        secondary: ['#34d399', '#10b981', '#059669', '#047857'],
        accent: ['#fb923c', '#f97316', '#ea580c', '#dc2626'],
        neutral: ['#f9fafb', '#e5e7eb', '#9ca3af', '#6b7280']
      },
      fonts: {
        title: { family: 'Inter', size: 16, weight: 600, color: '#f9fafb' },
        axis: { family: 'Inter', size: 12, weight: 400, color: '#e5e7eb' },
        label: { family: 'Inter', size: 10, weight: 400, color: '#9ca3af' }
      },
      grid: { color: '#374151', width: 1, opacity: 0.4 },
      background: '#111827',
      borderRadius: 8
    });
  }

  setupDefaultWidgets() {
    this.widgets.set('key_metrics_grid', {
      id: 'key_metrics_grid',
      name: 'Key Metrics Grid',
      type: 'metrics_grid',
      category: 'overview',
      config: {
        metrics: ['revenue', 'profit_margin', 'roe', 'debt_ratio'],
        layout: 'grid',
        showTrends: true,
        showSparklines: true,
        refreshInterval: 300000
      },
      dataSource: 'financial_statements',
      size: { width: 6, height: 2 }
    });

    this.widgets.set('performance_chart', {
      id: 'performance_chart',
      name: 'Performance Chart',
      type: 'chart',
      category: 'analysis',
      config: {
        chartType: 'line',
        template: 'revenue_trend',
        interactive: true,
        exportable: true,
        drillDown: true
      },
      dataSource: 'time_series_data',
      size: { width: 8, height: 4 }
    });

    this.widgets.set('portfolio_summary', {
      id: 'portfolio_summary',
      name: 'Portfolio Summary',
      type: 'summary_card',
      category: 'portfolio',
      config: {
        showAllocation: true,
        showPerformance: true,
        showRisk: true,
        compactMode: false
      },
      dataSource: 'portfolio_data',
      size: { width: 4, height: 3 }
    });

    this.widgets.set('market_heatmap', {
      id: 'market_heatmap',
      name: 'Market Heatmap',
      type: 'heatmap',
      category: 'market',
      config: {
        groupBy: 'sector',
        colorBy: 'performance',
        sizeBy: 'market_cap',
        showLabels: true,
        interactive: true
      },
      dataSource: 'market_data',
      size: { width: 6, height: 4 }
    });
  }

  setupDashboardTemplates() {
    this.dashboards.set('executive_overview', {
      id: 'executive_overview',
      name: 'Executive Overview',
      description: 'High-level executive dashboard',
      layout: {
        grid: { rows: 6, cols: 12 },
        widgets: [
          { id: 'key_metrics_grid', x: 0, y: 0, w: 12, h: 2 },
          { id: 'performance_chart', x: 0, y: 2, w: 8, h: 2 },
          { id: 'portfolio_summary', x: 8, y: 2, w: 4, h: 2 },
          { id: 'market_heatmap', x: 0, y: 4, w: 6, h: 2 },
          { id: 'risk_metrics', x: 6, y: 4, w: 6, h: 2 }
        ]
      },
      theme: 'executive',
      refreshInterval: 300000
    });

    this.dashboards.set('analyst_workbench', {
      id: 'analyst_workbench',
      name: 'Analyst Workbench',
      description: 'Detailed analysis dashboard',
      layout: {
        grid: { rows: 8, cols: 12 },
        widgets: [
          { id: 'financial_model', x: 0, y: 0, w: 8, h: 4 },
          { id: 'assumptions_panel', x: 8, y: 0, w: 4, h: 2 },
          { id: 'scenario_analysis', x: 8, y: 2, w: 4, h: 2 },
          { id: 'peer_comparison', x: 0, y: 4, w: 6, h: 2 },
          { id: 'valuation_output', x: 6, y: 4, w: 6, h: 2 },
          { id: 'sensitivity_chart', x: 0, y: 6, w: 12, h: 2 }
        ]
      },
      theme: 'professional',
      refreshInterval: 60000
    });

    this.dashboards.set('portfolio_manager', {
      id: 'portfolio_manager',
      name: 'Portfolio Manager',
      description: 'Portfolio management dashboard',
      layout: {
        grid: { rows: 6, cols: 12 },
        widgets: [
          { id: 'portfolio_performance', x: 0, y: 0, w: 8, h: 3 },
          { id: 'allocation_breakdown', x: 8, y: 0, w: 4, h: 3 },
          { id: 'risk_analysis', x: 0, y: 3, w: 6, h: 3 },
          { id: 'attribution_analysis', x: 6, y: 3, w: 6, h: 3 }
        ]
      },
      theme: 'professional',
      refreshInterval: 180000
    });
  }

  createDashboard(config) {
    const dashboardId = config.id || `dashboard_${Date.now()}`;
    const dashboard = {
      id: dashboardId,
      name: config.name || 'Custom Dashboard',
      description: config.description || '',
      layout: config.layout || { grid: { rows: 6, cols: 12 }, widgets: [] },
      theme: config.theme || 'professional',
      refreshInterval: config.refreshInterval || 300000,
      filters: config.filters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: config.isPublic || false,
      tags: config.tags || []
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  updateDashboard(dashboardId, updates) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const updated = {
      ...dashboard,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.dashboards.set(dashboardId, updated);
    return updated;
  }

  addWidgetToDashboard(dashboardId, widgetConfig) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widget = {
      id: widgetConfig.id || `widget_${Date.now()}`,
      x: widgetConfig.x || 0,
      y: widgetConfig.y || 0,
      w: widgetConfig.w || 4,
      h: widgetConfig.h || 2,
      ...widgetConfig
    };

    dashboard.layout.widgets.push(widget);
    dashboard.updatedAt = new Date().toISOString();

    this.dashboards.set(dashboardId, dashboard);
    return widget;
  }

  createVisualization(config) {
    const visualizationId = config.id || `viz_${Date.now()}`;
    const template = this.chartTemplates.get(config.template);

    if (!template && config.type !== 'custom') {
      throw new Error(`Chart template ${config.template} not found`);
    }

    const visualization = {
      id: visualizationId,
      name: config.name || 'Custom Visualization',
      type: config.type || template?.type || 'line',
      template: config.template,
      data: config.data || [],
      config: {
        ...(template?.config || {}),
        ...config.config
      },
      theme: config.theme || 'professional',
      interactive: config.interactive !== false,
      exportable: config.exportable !== false,
      realTime: config.realTime || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.visualizations.set(visualizationId, visualization);
    return visualization;
  }

  updateVisualizationData(visualizationId, newData, options = {}) {
    const visualization = this.visualizations.get(visualizationId);
    if (!visualization) {
      throw new Error(`Visualization ${visualizationId} not found`);
    }

    if (options.append) {
      visualization.data = [...visualization.data, ...newData];
    } else if (options.merge) {
      visualization.data = this.mergeData(visualization.data, newData);
    } else {
      visualization.data = newData;
    }

    visualization.updatedAt = new Date().toISOString();
    this.visualizations.set(visualizationId, visualization);

    return visualization;
  }

  generateChart(visualizationConfig) {
    const theme = this.themes.get(visualizationConfig.theme || 'professional');

    return {
      type: visualizationConfig.type,
      data: this.processChartData(visualizationConfig.data, visualizationConfig.config),
      options: this.generateChartOptions(visualizationConfig.config, theme),
      responsive: true,
      maintainAspectRatio: false,
      plugins: this.generatePlugins(visualizationConfig.config)
    };
  }

  processChartData(rawData, config) {
    if (!Array.isArray(rawData)) return rawData;

    // Apply data transformations
    let processedData = rawData;

    // Filter data if needed
    if (config.filters) {
      processedData = this.applyFilters(processedData, config.filters);
    }

    // Sort data if needed
    if (config.sortBy) {
      processedData = this.sortData(processedData, config.sortBy);
    }

    // Aggregate data if needed
    if (config.aggregation) {
      processedData = this.aggregateData(processedData, config.aggregation);
    }

    return processedData;
  }

  generateChartOptions(config, theme) {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {},
      plugins: {
        legend: {
          display: config.showLegend !== false,
          position: config.legendPosition || 'top'
        },
        title: {
          display: config.title !== undefined,
          text: config.title
        },
        tooltip: {
          enabled: config.showTooltips !== false,
          mode: config.tooltipMode || 'nearest',
          intersect: false
        }
      },
      animation: {
        duration: config.animationDuration || 750,
        easing: config.animationEasing || 'easeInOutQuart'
      }
    };

    // Configure axes
    if (config.xAxis) {
      options.scales.x = this.generateAxisOptions(config.xAxis, theme, 'x');
    }

    if (config.yAxis || config.yAxes) {
      const yAxes = config.yAxes || [config.yAxis];
      yAxes.forEach((axis, index) => {
        const axisKey = index === 0 ? 'y' : `y${index}`;
        options.scales[axisKey] = this.generateAxisOptions(axis, theme, 'y');
      });
    }

    return options;
  }

  generateAxisOptions(axisConfig, theme, axisType) {
    const options = {
      display: axisConfig.display !== false,
      position: axisConfig.position || (axisType === 'y' ? 'left' : 'bottom'),
      title: {
        display: axisConfig.title !== undefined,
        text: axisConfig.title
      },
      grid: {
        display: axisConfig.showGrid !== false,
        color: theme.grid.color,
        lineWidth: theme.grid.width
      },
      ticks: {
        color: theme.fonts.axis.color || '#374151',
        font: {
          family: theme.fonts.axis.family,
          size: theme.fonts.axis.size,
          weight: theme.fonts.axis.weight
        }
      }
    };

    // Type-specific configurations
    if (axisConfig.type === 'currency') {
      options.ticks.callback = function(value) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      };
    } else if (axisConfig.type === 'percentage') {
      options.ticks.callback = function(value) {
        return value + '%';
      };
    }

    return options;
  }

  generatePlugins(config) {
    const plugins = [];

    if (config.showTrendLine) {
      plugins.push({
        id: 'trendline',
        afterDraw: (chart) => {
          this.drawTrendLine(chart);
        }
      });
    }

    if (config.showAnnotations) {
      plugins.push({
        id: 'annotations',
        afterDraw: (chart) => {
          this.drawAnnotations(chart, config.annotations);
        }
      });
    }

    return plugins;
  }

  applyFilters(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  sortData(data, sortConfig) {
    const { field, direction = 'asc' } = sortConfig;
    return data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (direction === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }

  aggregateData(data, aggregationConfig) {
    const { groupBy, aggregations } = aggregationConfig;

    const groups = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(groups).map(([key, items]) => {
      const result = { [groupBy]: key };

      Object.entries(aggregations).forEach(([field, operation]) => {
        const values = items.map(item => item[field]).filter(v => v !== undefined);

        switch (operation) {
          case 'sum':
            result[field] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'min':
            result[field] = Math.min(...values);
            break;
          case 'max':
            result[field] = Math.max(...values);
            break;
          case 'count':
            result[field] = values.length;
            break;
        }
      });

      return result;
    });
  }

  mergeData(existingData, newData) {
    // Simple merge strategy - can be enhanced based on needs
    return [...existingData, ...newData];
  }

  drawTrendLine(chart) {
    // Implementation for drawing trend line
    const ctx = chart.ctx;

    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw trend line logic here

    ctx.restore();
  }

  drawAnnotations(chart, annotations) {
    // Implementation for drawing annotations
    const ctx = chart.ctx;

    annotations.forEach(_annotation => {
      ctx.save();
      // Draw annotation logic here
      ctx.restore();
    });
  }

  exportVisualization(visualizationId, format = 'png') {
    const visualization = this.visualizations.get(visualizationId);
    if (!visualization) {
      throw new Error(`Visualization ${visualizationId} not found`);
    }

    // Implementation would generate actual export
    return {
      format,
      data: `data:image/${format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      filename: `${visualization.name}_${new Date().toISOString().split('T')[0]}.${format}`
    };
  }

  // Public API methods
  getDashboards() {
    return Array.from(this.dashboards.values());
  }

  getDashboard(id) {
    return this.dashboards.get(id);
  }

  getVisualizations() {
    return Array.from(this.visualizations.values());
  }

  getVisualization(id) {
    return this.visualizations.get(id);
  }

  getChartTemplates() {
    return Array.from(this.chartTemplates.values());
  }

  getThemes() {
    return Array.from(this.themes.values());
  }

  getWidgets() {
    return Array.from(this.widgets.values());
  }

  deleteDashboard(id) {
    return this.dashboards.delete(id);
  }

  deleteVisualization(id) {
    return this.visualizations.delete(id);
  }
}

export default new VisualizationService();
