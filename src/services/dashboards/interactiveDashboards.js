// Advanced Interactive Dashboards Service - Phase 2 Implementation
export class InteractiveDashboardService {
  constructor() {
    this.dashboards = new Map();
    this.widgets = new Map();
    this.layouts = new Map();
    this.templates = new Map();
    this.dataConnections = new Map();
    this.eventHandlers = new Map();
    this.dragState = null;
    this.layoutEngine = null;
  }

  // Dashboard Management
  async createDashboard(config, userId) {
    const dashboard = {
      id: this.generateDashboardId(),
      name: config.name || 'Untitled Dashboard',
      description: config.description || '',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      modifiedBy: userId,
      layout: {
        type: config.layoutType || 'grid',
        columns: config.columns || 12,
        rowHeight: config.rowHeight || 150,
        margin: config.margin || [10, 10],
        containerPadding: config.containerPadding || [10, 10],
        breakpoints: config.breakpoints || {
          lg: 1200,
          md: 996,
          sm: 768,
          xs: 480,
          xxs: 0
        },
        cols: config.cols || {
          lg: 12,
          md: 10,
          sm: 6,
          xs: 4,
          xxs: 2
        }
      },
      widgets: [],
      theme: config.theme || 'professional',
      permissions: {
        owner: userId,
        editors: config.editors || [],
        viewers: config.viewers || [],
        isPublic: config.isPublic || false
      },
      settings: {
        autoSave: config.autoSave !== false,
        refreshInterval: config.refreshInterval || 300000, // 5 minutes
        enableRealTimeUpdates: config.enableRealTimeUpdates || true,
        enableComments: config.enableComments !== false,
        enableExport: config.enableExport !== false
      },
      metadata: {
        industry: config.industry || 'general',
        category: config.category || 'analysis',
        tags: config.tags || [],
        version: '1.0.0'
      }
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.emit('dashboard_created', dashboard);
    return dashboard;
  }

  async duplicateDashboard(dashboardId, newName, userId) {
    const originalDashboard = this.dashboards.get(dashboardId);
    if (!originalDashboard) {
      throw new Error('Dashboard not found');
    }

    const duplicatedDashboard = {
      ...originalDashboard,
      id: this.generateDashboardId(),
      name: newName || `${originalDashboard.name} (Copy)`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      modifiedBy: userId,
      widgets: [...originalDashboard.widgets],
      permissions: {
        ...originalDashboard.permissions,
        owner: userId,
        editors: [],
        viewers: []
      }
    };

    this.dashboards.set(duplicatedDashboard.id, duplicatedDashboard);
    return duplicatedDashboard;
  }

  // Widget System
  async createWidget(dashboardId, widgetConfig, position, userId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const widget = {
      id: this.generateWidgetId(),
      dashboardId,
      type: widgetConfig.type,
      title: widgetConfig.title || 'New Widget',
      description: widgetConfig.description || '',
      position: {
        x: position.x || 0,
        y: position.y || 0,
        w: position.w || 4,
        h: position.h || 3,
        minW: position.minW || 2,
        minH: position.minH || 2,
        maxW: position.maxW || 12,
        maxH: position.maxH || 10
      },
      config: this.getDefaultWidgetConfig(widgetConfig.type),
      dataSource: widgetConfig.dataSource || null,
      styling: {
        backgroundColor: widgetConfig.backgroundColor || '#ffffff',
        borderColor: widgetConfig.borderColor || '#e5e7eb',
        textColor: widgetConfig.textColor || '#1f2937',
        borderRadius: widgetConfig.borderRadius || 8,
        shadow: widgetConfig.shadow || 'sm',
        padding: widgetConfig.padding || 16
      },
      interactions: {
        clickable: widgetConfig.clickable || false,
        hoverable: widgetConfig.hoverable || true,
        selectable: widgetConfig.selectable || false,
        drillDown: widgetConfig.drillDown || null
      },
      visibility: {
        isVisible: true,
        conditionalVisibility: widgetConfig.conditionalVisibility || null
      },
      createdAt: new Date().toISOString(),
      createdBy: userId,
      lastModified: new Date().toISOString()
    };

    // Apply widget-specific configuration
    widget.config = { ...widget.config, ...widgetConfig.config };

    this.widgets.set(widget.id, widget);
    dashboard.widgets.push(widget.id);
    dashboard.lastModified = new Date().toISOString();
    dashboard.modifiedBy = userId;

    this.emit('widget_created', { widget, dashboardId });
    return widget;
  }

  getDefaultWidgetConfig(type) {
    const configs = {
      chart: {
        chartType: 'line',
        xAxis: { title: 'X Axis', type: 'category' },
        yAxis: { title: 'Y Axis', type: 'linear' },
        legend: { show: true, position: 'top' },
        colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
        animations: true,
        tooltip: { enabled: true },
        grid: { show: true }
      },
      kpi: {
        value: 0,
        previousValue: 0,
        format: 'number',
        prefix: '',
        suffix: '',
        decimals: 0,
        showTrend: true,
        trendColor: 'auto',
        targetValue: null,
        thresholds: []
      },
      table: {
        columns: [],
        pagination: { enabled: true, pageSize: 10 },
        sorting: { enabled: true },
        filtering: { enabled: true },
        export: { enabled: true },
        striped: true,
        hoverable: true,
        compact: false
      },
      text: {
        content: 'New Text Widget',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        allowMarkdown: true
      },
      gauge: {
        min: 0,
        max: 100,
        value: 0,
        thresholds: [
          { value: 30, color: '#EF4444' },
          { value: 70, color: '#F59E0B' },
          { value: 100, color: '#10B981' }
        ],
        showValue: true,
        unit: ''
      },
      iframe: {
        url: '',
        allowFullscreen: false,
        sandbox: 'allow-scripts allow-same-origin'
      }
    };

    return configs[type] || {};
  }

  // Widget Operations
  async updateWidget(widgetId, updates, userId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error('Widget not found');
    }

    // Merge updates
    const updatedWidget = {
      ...widget,
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy: userId
    };

    // Special handling for position updates
    if (updates.position) {
      updatedWidget.position = { ...widget.position, ...updates.position };
    }

    // Special handling for config updates
    if (updates.config) {
      updatedWidget.config = { ...widget.config, ...updates.config };
    }

    this.widgets.set(widgetId, updatedWidget);

    // Update dashboard timestamp
    const dashboard = this.dashboards.get(widget.dashboardId);
    if (dashboard) {
      dashboard.lastModified = new Date().toISOString();
      dashboard.modifiedBy = userId;
    }

    this.emit('widget_updated', { widget: updatedWidget, updates });
    return updatedWidget;
  }

  async deleteWidget(widgetId, userId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error('Widget not found');
    }

    const dashboard = this.dashboards.get(widget.dashboardId);
    if (dashboard) {
      dashboard.widgets = dashboard.widgets.filter(id => id !== widgetId);
      dashboard.lastModified = new Date().toISOString();
      dashboard.modifiedBy = userId;
    }

    this.widgets.delete(widgetId);
    this.emit('widget_deleted', { widgetId, dashboardId: widget.dashboardId });
    return true;
  }

  // Drag & Drop System
  initializeDragDrop(containerElement) {
    this.layoutEngine = new DragDropLayout(containerElement, {
      onDragStart: (widgetId, position) => {
        this.dragState = { widgetId, startPosition: position };
        this.emit('drag_start', { widgetId, position });
      },
      onDrag: (widgetId, position) => {
        this.emit('drag_move', { widgetId, position });
      },
      onDragEnd: (widgetId, position, userId) => {
        this.updateWidget(widgetId, { position }, userId);
        this.dragState = null;
        this.emit('drag_end', { widgetId, position });
      },
      onResize: (widgetId, size, userId) => {
        this.updateWidget(widgetId, { position: { w: size.w, h: size.h } }, userId);
        this.emit('widget_resized', { widgetId, size });
      }
    });
  }

  // Layout Management
  async saveLayout(dashboardId, layout, userId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const layoutConfig = {
      id: this.generateLayoutId(),
      dashboardId,
      name: layout.name || 'Custom Layout',
      config: layout.config,
      widgets:
        layout.widgets ||
        dashboard.widgets
          .map(widgetId => {
            const widget = this.widgets.get(widgetId);
            return widget ? { id: widgetId, position: widget.position } : null;
          })
          .filter(Boolean),
      createdAt: new Date().toISOString(),
      createdBy: userId
    };

    this.layouts.set(layoutConfig.id, layoutConfig);
    return layoutConfig;
  }

  async applyLayout(dashboardId, layoutId, userId) {
    const dashboard = this.dashboards.get(dashboardId);
    const layout = this.layouts.get(layoutId);

    if (!dashboard || !layout) {
      throw new Error('Dashboard or layout not found');
    }

    // Apply widget positions from layout
    for (const layoutWidget of layout.widgets) {
      const widget = this.widgets.get(layoutWidget.id);
      if (widget) {
        await this.updateWidget(widget.id, { position: layoutWidget.position }, userId);
      }
    }

    // Apply layout configuration to dashboard
    dashboard.layout = { ...dashboard.layout, ...layout.config };
    dashboard.lastModified = new Date().toISOString();
    dashboard.modifiedBy = userId;

    this.emit('layout_applied', { dashboardId, layoutId });
    return dashboard;
  }

  // Data Connection System
  async connectDataSource(widgetId, dataSourceConfig) {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error('Widget not found');
    }

    const connection = {
      id: this.generateConnectionId(),
      widgetId,
      type: dataSourceConfig.type, // api, websocket, file, manual
      config: dataSourceConfig.config,
      refreshInterval: dataSourceConfig.refreshInterval || 300000,
      lastRefresh: null,
      isActive: true,
      transform: dataSourceConfig.transform || null // data transformation function
    };

    this.dataConnections.set(connection.id, connection);

    // Update widget with data source reference
    widget.dataSource = connection.id;

    // Start data fetching if it's an active connection
    if (connection.isActive) {
      this.startDataFetch(connection.id);
    }

    return connection;
  }

  async startDataFetch(connectionId) {
    const connection = this.dataConnections.get(connectionId);
    if (!connection || !connection.isActive) return;

    try {
      let data;

      switch (connection.type) {
        case 'api':
          data = await this.fetchFromAPI(connection.config);
          break;
        case 'websocket':
          this.setupWebSocketConnection(connection);
          return; // WebSocket handles its own data updates
        case 'file':
          data = await this.loadFromFile(connection.config);
          break;
        default:
          throw new Error(`Unsupported data source type: ${connection.type}`);
      }

      // Apply data transformation if specified
      if (connection.transform && typeof connection.transform === 'function') {
        data = connection.transform(data);
      }

      // Update widget with new data
      const widget = this.widgets.get(connection.widgetId);
      if (widget) {
        widget.data = data;
        widget.lastDataUpdate = new Date().toISOString();
        connection.lastRefresh = new Date().toISOString();

        this.emit('widget_data_updated', { widgetId: widget.id, data });
      }

      // Schedule next refresh
      if (connection.refreshInterval > 0) {
        setTimeout(() => this.startDataFetch(connectionId), connection.refreshInterval);
      }
    } catch (error) {
      console.error(`Error fetching data for connection ${connectionId}:`, error);
      this.emit('data_fetch_error', { connectionId, error });
    }
  }

  // Real-time Updates
  enableRealTimeUpdates(dashboardId, websocketUrl) {
    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', dashboardId }));
      this.emit('realtime_connected', { dashboardId });
    };

    ws.onmessage = event => {
      try {
        const update = JSON.parse(event.data);
        this.handleRealTimeUpdate(dashboardId, update);
      } catch (error) {
        console.error('Error processing real-time update:', error);
      }
    };

    ws.onclose = () => {
      this.emit('realtime_disconnected', { dashboardId });
      // Implement reconnection logic here
    };

    return ws;
  }

  handleRealTimeUpdate(dashboardId, update) {
    switch (update.type) {
      case 'widget_updated': {
        const widget = this.widgets.get(update.widgetId);
        if (widget && widget.dashboardId === dashboardId) {
          Object.assign(widget, update.data);
          this.emit('widget_updated', { widget, realTime: true });
        }
        break;
      }

      case 'widget_data': {
        const dataWidget = this.widgets.get(update.widgetId);
        if (dataWidget && dataWidget.dashboardId === dashboardId) {
          dataWidget.data = update.data;
          dataWidget.lastDataUpdate = new Date().toISOString();
          this.emit('widget_data_updated', {
            widgetId: update.widgetId,
            data: update.data,
            realTime: true
          });
        }
        break;
      }

      case 'layout_changed':
        this.emit('layout_changed', { dashboardId, layout: update.layout });
        break;
    }
  }

  // Template System
  async createTemplate(dashboardId, templateInfo, userId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const template = {
      id: this.generateTemplateId(),
      name: templateInfo.name,
      description: templateInfo.description || '',
      category: templateInfo.category || 'custom',
      industry: templateInfo.industry || 'general',
      tags: templateInfo.tags || [],
      thumbnail: templateInfo.thumbnail || null,
      dashboardConfig: {
        layout: dashboard.layout,
        theme: dashboard.theme,
        settings: dashboard.settings
      },
      widgets: dashboard.widgets.map(widgetId => {
        const widget = this.widgets.get(widgetId);
        return {
          type: widget.type,
          title: widget.title,
          position: widget.position,
          config: widget.config,
          styling: widget.styling
        };
      }),
      createdBy: userId,
      createdAt: new Date().toISOString(),
      isPublic: templateInfo.isPublic || false,
      downloadCount: 0
    };

    this.templates.set(template.id, template);
    return template;
  }

  async applyTemplate(templateId, dashboardName, userId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create dashboard from template
    const dashboard = await this.createDashboard(
      {
        name: dashboardName,
        ...template.dashboardConfig
      },
      userId
    );

    // Create widgets from template
    for (const templateWidget of template.widgets) {
      await this.createWidget(
        dashboard.id,
        {
          type: templateWidget.type,
          title: templateWidget.title,
          config: templateWidget.config,
          ...templateWidget.styling
        },
        templateWidget.position,
        userId
      );
    }

    // Update template usage stats
    template.downloadCount++;

    return dashboard;
  }

  // Export and Sharing
  async exportDashboard(dashboardId, format = 'json') {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const widgets = dashboard.widgets.map(id => this.widgets.get(id)).filter(Boolean);

    const exportData = {
      dashboard,
      widgets,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'pdf':
        return await this.generatePDFReport(exportData);
      case 'png':
        return await this.generateImageExport(exportData);
      default:
        return exportData;
    }
  }

  // Query and Search
  getDashboards(userId, filters = {}) {
    let dashboards = Array.from(this.dashboards.values());

    // Filter by permissions
    dashboards = dashboards.filter(
      dashboard =>
        dashboard.permissions.owner === userId ||
        dashboard.permissions.editors.includes(userId) ||
        dashboard.permissions.viewers.includes(userId) ||
        dashboard.permissions.isPublic
    );

    // Apply additional filters
    if (filters.industry) {
      dashboards = dashboards.filter(d => d.metadata.industry === filters.industry);
    }

    if (filters.category) {
      dashboards = dashboards.filter(d => d.metadata.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      dashboards = dashboards.filter(d => filters.tags.some(tag => d.metadata.tags.includes(tag)));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      dashboards = dashboards.filter(
        d =>
          d.name.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower)
      );
    }

    return dashboards.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  searchTemplates(query, filters = {}) {
    let templates = Array.from(this.templates.values()).filter(
      template => template.isPublic || filters.includePrivate
    );

    if (query) {
      const queryLower = query.toLowerCase();
      templates = templates.filter(
        template =>
          template.name.toLowerCase().includes(queryLower) ||
          template.description.toLowerCase().includes(queryLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    if (filters.category) {
      templates = templates.filter(template => template.category === filters.category);
    }

    if (filters.industry) {
      templates = templates.filter(template => template.industry === filters.industry);
    }

    return templates.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  // Utility Methods
  generateDashboardId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWidgetId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLayoutId() {
    return `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateConnectionId() {
    return `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTemplateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          console.error(`Error in dashboard event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Drag & Drop Layout Engine
class DragDropLayout {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.isDragging = false;
    this.isResizing = false;
    this.initialize();
  }

  initialize() {
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  handleMouseDown(event) {
    const widgetElement = event.target.closest('.dashboard-widget');
    if (!widgetElement) return;

    const widgetId = widgetElement.dataset.widgetId;
    const isResizeHandle = event.target.classList.contains('resize-handle');

    if (isResizeHandle) {
      this.startResize(widgetId, event);
    } else if (
      event.target.classList.contains('drag-handle') ||
      widgetElement.dataset.draggable === 'true'
    ) {
      this.startDrag(widgetId, event);
    }
  }

  startDrag(widgetId, event) {
    this.isDragging = true;
    this.currentWidget = widgetId;
    this.dragOffset = {
      x: event.clientX - event.target.getBoundingClientRect().left,
      y: event.clientY - event.target.getBoundingClientRect().top
    };

    if (this.options.onDragStart) {
      this.options.onDragStart(widgetId, this.getPosition(event));
    }
  }

  startResize(widgetId, event) {
    this.isResizing = true;
    this.currentWidget = widgetId;
    this.resizeStart = {
      x: event.clientX,
      y: event.clientY,
      width: event.target.closest('.dashboard-widget').offsetWidth,
      height: event.target.closest('.dashboard-widget').offsetHeight
    };
  }

  handleMouseMove(event) {
    if (this.isDragging && this.options.onDrag) {
      this.options.onDrag(this.currentWidget, this.getPosition(event));
    } else if (this.isResizing) {
      const newSize = {
        w: Math.max(
          2,
          Math.round((this.resizeStart.width + event.clientX - this.resizeStart.x) / 100)
        ),
        h: Math.max(
          2,
          Math.round((this.resizeStart.height + event.clientY - this.resizeStart.y) / 100)
        )
      };

      // Visual feedback during resize
      const widgetElement = this.container.querySelector(
        `[data-widget-id="${this.currentWidget}"]`
      );
      if (widgetElement) {
        widgetElement.style.width = `${newSize.w * 100}px`;
        widgetElement.style.height = `${newSize.h * 100}px`;
      }
    }
  }

  handleMouseUp(event) {
    if (this.isDragging && this.options.onDragEnd) {
      this.options.onDragEnd(this.currentWidget, this.getPosition(event), 'current_user');
    } else if (this.isResizing && this.options.onResize) {
      const newSize = {
        w: Math.max(
          2,
          Math.round((this.resizeStart.width + event.clientX - this.resizeStart.x) / 100)
        ),
        h: Math.max(
          2,
          Math.round((this.resizeStart.height + event.clientY - this.resizeStart.y) / 100)
        )
      };
      this.options.onResize(this.currentWidget, newSize, 'current_user');
    }

    this.isDragging = false;
    this.isResizing = false;
    this.currentWidget = null;
  }

  getPosition(event) {
    const containerRect = this.container.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - containerRect.left - this.dragOffset.x) / 100),
      y: Math.round((event.clientY - containerRect.top - this.dragOffset.y) / 100)
    };
  }
}

export const interactiveDashboardService = new InteractiveDashboardService();
