/**
 * Export Service
 * Handles exporting dashboards, charts, and visualizations to various formats
 * Supports PDF, PNG, SVG, and interactive web formats
 */

class ExportService {
  constructor(options = {}) {
    this.options = {
      maxExportSize: 50, // MB
      supportedFormats: ['pdf', 'png', 'svg', 'html', 'json'],
      defaultQuality: 2.0,
      defaultResolution: 1920,
      ...options
    };

    this.exportQueue = [];
    this.activeExports = new Map();
    this.exportHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the export service
   */
  async initialize() {
    if (this.isInitialized) return;

    this.startExportProcessor();
    this.isInitialized = true;

    console.log('Export Service initialized');
  }

  /**
   * Export dashboard to specified format
   */
  async exportDashboard(dashboardConfig, format = 'pdf', options = {}) {
    const exportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'dashboard',
      config: dashboardConfig,
      format,
      options: {
        quality: options.quality || this.options.defaultQuality,
        resolution: options.resolution || this.options.defaultResolution,
        includeHeader: options.includeHeader !== false,
        includeFooter: options.includeFooter !== false,
        theme: options.theme || 'light',
        ...options
      },
      status: 'queued',
      created: new Date(),
      progress: 0
    };

    this.exportQueue.push(exportJob);

    return exportJob.id;
  }

  /**
   * Export chart to specified format
   */
  async exportChart(chartConfig, format = 'png', options = {}) {
    const exportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'chart',
      config: chartConfig,
      format,
      options: {
        width: options.width || 800,
        height: options.height || 600,
        quality: options.quality || this.options.defaultQuality,
        backgroundColor: options.backgroundColor || 'transparent',
        ...options
      },
      status: 'queued',
      created: new Date(),
      progress: 0
    };

    this.exportQueue.push(exportJob);

    return exportJob.id;
  }

  /**
   * Export table/data to specified format
   */
  async exportTable(tableData, format = 'excel', options = {}) {
    const exportJob = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'table',
      data: tableData,
      format,
      options: {
        includeHeaders: options.includeHeaders !== false,
        includeFilters: options.includeFilters || false,
        formatting: options.formatting || 'default',
        ...options
      },
      status: 'queued',
      created: new Date(),
      progress: 0
    };

    this.exportQueue.push(exportJob);

    return exportJob.id;
  }

  /**
   * Start export processor
   */
  startExportProcessor() {
    setInterval(() => {
      this.processExportQueue();
    }, 1000); // Process every second
  }

  /**
   * Process export queue
   */
  async processExportQueue() {
    const pendingExports = this.exportQueue.filter(job => job.status === 'queued');

    for (const job of pendingExports) {
      if (this.activeExports.size >= 3) {
        // Limit concurrent exports
        break;
      }

      this.processExportJob(job);
    }
  }

  /**
   * Process individual export job
   */
  async processExportJob(job) {
    this.activeExports.set(job.id, job);
    job.status = 'processing';

    try {
      let result;

      switch (job.type) {
        case 'dashboard':
          result = await this.processDashboardExport(job);
          break;
        case 'chart':
          result = await this.processChartExport(job);
          break;
        case 'table':
          result = await this.processTableExport(job);
          break;
        default:
          throw new Error(`Unsupported export type: ${job.type}`);
      }

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();

      // Record in history
      this.recordExportHistory(job);
    } catch (error) {
      console.error(`Export failed for job ${job.id}:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
    } finally {
      this.activeExports.delete(job.id);
    }
  }

  /**
   * Process dashboard export
   */
  async processDashboardExport(job) {
    const { config, format, options } = job;

    // Create virtual DOM representation
    const dashboardElement = await this.renderDashboardToElement(config, options);

    switch (format) {
      case 'pdf':
        return await this.exportToPDF(dashboardElement, options);
      case 'png':
        return await this.exportToPNG(dashboardElement, options);
      case 'svg':
        return await this.exportToSVG(dashboardElement, options);
      case 'html':
        return await this.exportToHTML(dashboardElement, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Process chart export
   */
  async processChartExport(job) {
    const { config, format, options } = job;

    // Create virtual chart representation
    const chartElement = await this.renderChartToElement(config, options);

    switch (format) {
      case 'png':
        return await this.exportToPNG(chartElement, options);
      case 'svg':
        return await this.exportToSVG(chartElement, options);
      case 'pdf':
        return await this.exportToPDF(chartElement, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Process table export
   */
  async processTableExport(job) {
    const { data, format, options } = job;

    switch (format) {
      case 'excel':
        return await this.exportToExcel(data, options);
      case 'csv':
        return await this.exportToCSV(data, options);
      case 'json':
        return await this.exportToJSON(data, options);
      case 'pdf':
        return await this.exportToPDF(await this.renderTableToElement(data, options), options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Render dashboard to virtual element
   */
  async renderDashboardToElement(config, options) {
    // Create a virtual container for the dashboard
    const container = {
      type: 'div',
      className: 'dashboard-export',
      style: {
        width: options.resolution || 1920,
        backgroundColor: options.theme === 'dark' ? '#1f2937' : '#ffffff',
        padding: '20px',
        fontFamily: 'Inter, sans-serif'
      },
      children: []
    };

    // Add header if requested
    if (options.includeHeader) {
      container.children.push({
        type: 'div',
        className: 'dashboard-header',
        style: {
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '20px'
        },
        children: [
          {
            type: 'h1',
            text: config.title || 'Dashboard Export',
            style: {
              fontSize: '28px',
              fontWeight: 'bold',
              color: options.theme === 'dark' ? '#ffffff' : '#1f2937',
              margin: '0 0 10px 0'
            }
          },
          {
            type: 'p',
            text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
            style: {
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }
          }
        ]
      });
    }

    // Add dashboard content
    const gridLayout = {
      type: 'div',
      className: 'dashboard-grid',
      style: {
        display: 'grid',
        gridTemplateColumns:
          config.layout === 'grid-4' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      },
      children: []
    };

    // Add widgets/cards
    for (const widget of config.widgets || []) {
      const widgetElement = await this.renderWidgetToElement(widget, options);
      gridLayout.children.push(widgetElement);
    }

    container.children.push(gridLayout);

    // Add footer if requested
    if (options.includeFooter) {
      container.children.push({
        type: 'div',
        className: 'dashboard-footer',
        style: {
          textAlign: 'center',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '12px',
          color: '#6b7280'
        },
        children: [
          {
            type: 'p',
            text: 'Generated by FinanceAnalyst Pro',
            style: { margin: '0' }
          }
        ]
      });
    }

    return container;
  }

  /**
   * Render widget to virtual element
   */
  async renderWidgetToElement(widget, options) {
    const widgetElement = {
      type: 'div',
      className: 'dashboard-widget',
      style: {
        backgroundColor: options.theme === 'dark' ? '#374151' : '#ffffff',
        border: `1px solid ${options.theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      children: []
    };

    // Add widget title
    if (widget.title) {
      widgetElement.children.push({
        type: 'h3',
        text: widget.title,
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: options.theme === 'dark' ? '#ffffff' : '#1f2937',
          margin: '0 0 15px 0'
        }
      });
    }

    // Add widget content based on type
    switch (widget.type) {
      case 'metric':
        widgetElement.children.push(await this.renderMetricWidget(widget, options));
        break;
      case 'chart':
        widgetElement.children.push(await this.renderChartWidget(widget, options));
        break;
      case 'table':
        widgetElement.children.push(await this.renderTableWidget(widget, options));
        break;
      default:
        widgetElement.children.push({
          type: 'div',
          text: 'Widget content',
          style: { color: '#6b7280' }
        });
    }

    return widgetElement;
  }

  /**
   * Render metric widget
   */
  async renderMetricWidget(widget, options) {
    const value = widget.data?.value || 0;
    const format = widget.data?.format || 'number';
    const change = widget.data?.change;
    const changePercent = widget.data?.changePercent;

    let formattedValue = value.toLocaleString();

    switch (format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
        break;
      case 'percentage':
        formattedValue = `${value.toFixed(1)}%`;
        break;
    }

    const metricElement = {
      type: 'div',
      className: 'metric-widget',
      children: [
        {
          type: 'div',
          className: 'metric-value',
          text: formattedValue,
          style: {
            fontSize: '32px',
            fontWeight: 'bold',
            color: options.theme === 'dark' ? '#ffffff' : '#1f2937',
            marginBottom: '5px'
          }
        }
      ]
    };

    // Add change indicator
    if (change !== undefined) {
      const changeColor = change >= 0 ? '#10b981' : '#ef4444';
      const changeSymbol = change >= 0 ? '+' : '';

      metricElement.children.push({
        type: 'div',
        className: 'metric-change',
        text: `${changeSymbol}${change.toFixed(2)}`,
        style: {
          fontSize: '14px',
          color: changeColor,
          fontWeight: '500'
        }
      });
    }

    if (changePercent !== undefined) {
      const percentColor = changePercent >= 0 ? '#10b981' : '#ef4444';
      const percentSymbol = changePercent >= 0 ? '+' : '';

      metricElement.children.push({
        type: 'div',
        className: 'metric-change-percent',
        text: `(${percentSymbol}${changePercent.toFixed(2)}%)`,
        style: {
          fontSize: '12px',
          color: percentColor,
          marginTop: '2px'
        }
      });
    }

    return metricElement;
  }

  /**
   * Render chart widget
   */
  async renderChartWidget(widget, options) {
    // Create a simple representation of the chart
    return {
      type: 'div',
      className: 'chart-widget',
      style: {
        height: '200px',
        backgroundColor: options.theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280'
      },
      children: [
        {
          type: 'div',
          text: `${widget.data?.chartType || 'Chart'} Visualization`,
          style: { fontSize: '14px' }
        }
      ]
    };
  }

  /**
   * Render table widget
   */
  async renderTableWidget(widget, options) {
    const data = widget.data?.rows || [];
    const headers = widget.data?.headers || [];

    const tableElement = {
      type: 'table',
      className: 'table-widget',
      style: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
      },
      children: []
    };

    // Add table header
    if (headers.length > 0) {
      const thead = {
        type: 'thead',
        children: [
          {
            type: 'tr',
            children: headers.map(header => ({
              type: 'th',
              text: header,
              style: {
                padding: '8px 12px',
                textAlign: 'left',
                backgroundColor: options.theme === 'dark' ? '#374151' : '#f9fafb',
                borderBottom: `1px solid ${options.theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                fontWeight: '600',
                color: options.theme === 'dark' ? '#ffffff' : '#374151'
              }
            }))
          }
        ]
      };
      tableElement.children.push(thead);
    }

    // Add table body
    const tbody = {
      type: 'tbody',
      children: data.slice(0, 10).map(row => ({
        type: 'tr',
        children: row.map(cell => ({
          type: 'td',
          text: String(cell),
          style: {
            padding: '8px 12px',
            borderBottom: `1px solid ${options.theme === 'dark' ? '#374151' : '#f3f4f6'}`,
            color: options.theme === 'dark' ? '#e5e7eb' : '#374151'
          }
        }))
      }))
    };

    tableElement.children.push(tbody);

    return tableElement;
  }

  /**
   * Render chart to virtual element
   */
  async renderChartToElement(config, options) {
    // Create a virtual representation of the chart
    return {
      type: 'div',
      className: 'chart-export',
      style: {
        width: options.width,
        height: options.height,
        backgroundColor: options.backgroundColor || 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        {
          type: 'div',
          text: 'Chart Visualization',
          style: {
            fontSize: '18px',
            color: '#6b7280',
            textAlign: 'center'
          }
        }
      ]
    };
  }

  /**
   * Render table to virtual element
   */
  async renderTableToElement(data, options) {
    // Reuse table widget rendering
    return await this.renderTableWidget({ data }, options);
  }

  /**
   * Export to PDF
   */
  async exportToPDF(element, options) {
    // In a real implementation, this would use jsPDF or similar
    const pdfContent = this.serializeElementToHTML(element);

    return {
      data: pdfContent,
      filename: `export_${Date.now()}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Export to PNG
   */
  async exportToPNG(element, options) {
    // In a real implementation, this would use html2canvas
    const htmlContent = this.serializeElementToHTML(element);

    return {
      data: htmlContent,
      filename: `export_${Date.now()}.png`,
      mimeType: 'image/png'
    };
  }

  /**
   * Export to SVG
   */
  async exportToSVG(element, options) {
    // In a real implementation, this would convert to SVG
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width || 800}" height="${options.height || 600}"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Chart Visualization</text></svg>`;

    return {
      data: svgContent,
      filename: `export_${Date.now()}.svg`,
      mimeType: 'image/svg+xml'
    };
  }

  /**
   * Export to HTML
   */
  async exportToHTML(element, options) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .export-container { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="export-container">
        ${this.serializeElementToHTML(element)}
    </div>
</body>
</html>`;

    return {
      data: htmlContent,
      filename: `export_${Date.now()}.html`,
      mimeType: 'text/html'
    };
  }

  /**
   * Export to Excel
   */
  async exportToExcel(data, options) {
    // In a real implementation, this would use xlsx library
    const csvContent = this.convertToCSV(data);

    return {
      data: csvContent,
      filename: `export_${Date.now()}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Export to CSV
   */
  async exportToCSV(data, options) {
    const csvContent = this.convertToCSV(data);

    return {
      data: csvContent,
      filename: `export_${Date.now()}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export to JSON
   */
  async exportToJSON(data, options) {
    const jsonContent = JSON.stringify(data, null, 2);

    return {
      data: jsonContent,
      filename: `export_${Date.now()}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data || !Array.isArray(data.rows)) return '';

    const rows = data.rows;
    const headers = data.headers || [];

    let csv = '';

    // Add headers
    if (headers.length > 0) {
      csv += headers.join(',') + '\n';
    }

    // Add data rows
    for (const row of rows) {
      const csvRow = row.map(cell => {
        // Escape commas and quotes
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csv += csvRow.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Serialize virtual element to HTML
   */
  serializeElementToHTML(element, indent = 0) {
    const indentStr = '  '.repeat(indent);

    if (element.type === 'text' && element.text) {
      return `${indentStr}${element.text}`;
    }

    let html = `${indentStr}<${element.type}`;

    // Add attributes
    if (element.className) {
      html += ` class="${element.className}"`;
    }

    if (element.style) {
      const styleStr = Object.entries(element.style)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
        .join(';');
      html += ` style="${styleStr}"`;
    }

    html += '>';

    // Add children
    if (element.children && element.children.length > 0) {
      html += '\n';
      for (const child of element.children) {
        html += this.serializeElementToHTML(child, indent + 1) + '\n';
      }
      html += `${indentStr}</${element.type}>`;
    } else {
      html += `</${element.type}>`;
    }

    return html;
  }

  /**
   * Get export job status
   */
  getExportStatus(jobId) {
    // Check active exports
    const activeJob = this.activeExports.get(jobId);
    if (activeJob) {
      return {
        status: activeJob.status,
        progress: activeJob.progress,
        created: activeJob.created
      };
    }

    // Check queue
    const queuedJob = this.exportQueue.find(job => job.id === jobId);
    if (queuedJob) {
      return {
        status: queuedJob.status,
        progress: 0,
        created: queuedJob.created,
        queuePosition: this.exportQueue.indexOf(queuedJob) + 1
      };
    }

    // Check history
    const history = this.exportHistory.get(jobId);
    if (history) {
      return {
        status: history.status,
        progress: 100,
        created: history.created,
        completed: history.completedAt || history.failedAt,
        result: history.result,
        error: history.error
      };
    }

    return null;
  }

  /**
   * Record export in history
   */
  recordExportHistory(job) {
    this.exportHistory.set(job.id, {
      ...job,
      recordedAt: new Date()
    });

    // Keep only last 100 exports in history
    if (this.exportHistory.size > 100) {
      const oldestKey = this.exportHistory.keys().next().value;
      this.exportHistory.delete(oldestKey);
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      queueSize: this.exportQueue.length,
      activeExports: this.activeExports.size,
      completedExports: Array.from(this.exportHistory.values()).filter(
        job => job.status === 'completed'
      ).length,
      failedExports: Array.from(this.exportHistory.values()).filter(job => job.status === 'failed')
        .length
    };
  }

  /**
   * Cancel export job
   */
  cancelExport(jobId) {
    // Remove from queue
    const queueIndex = this.exportQueue.findIndex(job => job.id === jobId);
    if (queueIndex > -1) {
      this.exportQueue.splice(queueIndex, 1);
      return true;
    }

    // Cancel active export
    const activeJob = this.activeExports.get(jobId);
    if (activeJob) {
      activeJob.status = 'cancelled';
      this.activeExports.delete(jobId);
      return true;
    }

    return false;
  }

  /**
   * Clear export history
   */
  clearHistory() {
    this.exportHistory.clear();
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down Export Service...');

    // Cancel all active exports
    for (const job of this.activeExports.values()) {
      job.status = 'cancelled';
    }

    this.activeExports.clear();
    this.exportQueue = [];
    this.exportHistory.clear();

    this.isInitialized = false;

    console.log('Export Service shutdown complete');
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default ExportService;
