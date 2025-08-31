// Export & Sharing Features - Phase 2 Implementation
import jsPDF from 'jspdf';
import XLSX from '../utils/exceljs-compat.js';

export class ExportSharingService {
  constructor() {
    this.shareLinks = new Map();
    this.exportJobs = new Map();
    this.templates = new Map();
    this.permissions = new Map();
    this.eventHandlers = new Map();
    this.baseUrl = window.location.origin;
    this.initializeTemplates();
  }

  initializeTemplates() {
    const templates = {
      executive_summary: {
        name: 'Executive Summary',
        sections: ['cover', 'key_metrics', 'financial_highlights', 'recommendations'],
        layout: 'portrait',
        theme: 'professional',
        includeCharts: true,
        includeData: false
      },
      detailed_analysis: {
        name: 'Detailed Analysis',
        sections: [
          'cover',
          'methodology',
          'assumptions',
          'financial_model',
          'sensitivity_analysis',
          'conclusions'
        ],
        layout: 'portrait',
        theme: 'financial',
        includeCharts: true,
        includeData: true
      },
      investment_memo: {
        name: 'Investment Memo',
        sections: [
          'investment_thesis',
          'market_opportunity',
          'financial_projections',
          'risks',
          'valuation'
        ],
        layout: 'portrait',
        theme: 'professional',
        includeCharts: true,
        includeData: false
      },
      quarterly_report: {
        name: 'Quarterly Report',
        sections: ['performance_summary', 'key_metrics', 'variance_analysis', 'outlook'],
        layout: 'landscape',
        theme: 'corporate',
        includeCharts: true,
        includeData: true
      }
    };

    Object.entries(templates).forEach(([key, template]) => {
      this.templates.set(key, template);
    });
  }

  // PDF Export with Advanced Formatting
  async exportToPDF(content, config = {}) {
    const defaultConfig = {
      template: 'detailed_analysis',
      filename: 'financial_analysis.pdf',
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      quality: 'high',
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      watermark: null,
      metadata: {}
    };

    const finalConfig = { ...defaultConfig, ...config };
    const jobId = this.generateJobId();

    try {
      this.emit('export:started', { jobId, type: 'pdf', config: finalConfig });

      // Create PDF document
      const pdf = new jsPDF({
        orientation: finalConfig.orientation,
        unit: 'mm',
        format: finalConfig.format
      });

      // Set document metadata
      if (finalConfig.metadata) {
        pdf.setProperties(finalConfig.metadata);
      }

      // Generate content based on template
      const template = this.templates.get(finalConfig.template);
      if (!template) {
        throw new Error(`Template ${finalConfig.template} not found`);
      }

      await this.generatePDFContent(pdf, content, template, finalConfig);

      // Add watermark if specified
      if (finalConfig.watermark) {
        this.addWatermark(pdf, finalConfig.watermark);
      }

      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalConfig.filename;
      link.click();

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.emit('export:completed', { jobId, type: 'pdf', filename: finalConfig.filename });

      return {
        success: true,
        jobId,
        filename: finalConfig.filename,
        size: pdfBlob.size
      };
    } catch (error) {
      this.emit('export:error', { jobId, type: 'pdf', error: error.message });
      throw error;
    }
  }

  async generatePDFContent(pdf, content, template, config) {
    let currentPage = 1;
    let yPosition = config.margins.top;

    // Cover page
    if (template.sections.includes('cover')) {
      await this.addCoverPage(pdf, content.title || 'Financial Analysis', content.subtitle, config);
      pdf.addPage();
      currentPage++;
    }

    // Table of contents
    if (template.sections.length > 2) {
      this.addTableOfContents(pdf, template.sections, config);
      pdf.addPage();
      currentPage++;
    }

    // Content sections
    for (const section of template.sections) {
      if (section === 'cover') continue;

      const sectionData = content[section];
      if (!sectionData) continue;

      yPosition = await this.addSection(pdf, section, sectionData, config, yPosition);

      // Add page break if needed
      if (yPosition > 250) {
        pdf.addPage();
        currentPage++;
        yPosition = config.margins.top;
      }
    }

    // Add page numbers
    if (config.includePageNumbers) {
      this.addPageNumbers(pdf, currentPage);
    }
  }

  async addCoverPage(pdf, title, subtitle, config) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Company logo placeholder
    pdf.setFillColor(240, 240, 240);
    pdf.rect(pageWidth / 2 - 30, 40, 60, 20, 'F');

    // Title
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 100, { align: 'center' });

    // Subtitle
    if (subtitle) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, pageWidth / 2, 120, { align: 'center' });
    }

    // Date
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 40, { align: 'center' });

    // Footer line
    pdf.setDrawColor(0, 0, 0);
    pdf.line(
      config.margins.left,
      pageHeight - 30,
      pageWidth - config.margins.right,
      pageHeight - 30
    );
  }

  addTableOfContents(pdf, sections, config) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 60;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', pageWidth / 2, 40, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    sections.forEach((section, index) => {
      const sectionTitle = this.formatSectionTitle(section);
      pdf.text(`${index + 1}. ${sectionTitle}`, config.margins.left, yPos);
      pdf.text('...................................', config.margins.left + 80, yPos);
      pdf.text(`${index + 2}`, pageWidth - config.margins.right - 10, yPos);
      yPos += 15;
    });
  }

  async addSection(pdf, sectionName, sectionData, config, startY) {
    let yPos = startY;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - config.margins.left - config.margins.right;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const sectionTitle = this.formatSectionTitle(sectionName);
    pdf.text(sectionTitle, config.margins.left, yPos);
    yPos += 20;

    // Section content
    if (typeof sectionData === 'string') {
      // Text content
      const lines = pdf.splitTextToSize(sectionData, contentWidth);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      lines.forEach(line => {
        pdf.text(line, config.margins.left, yPos);
        yPos += 6;
      });
    } else if (sectionData.type === 'chart') {
      // Chart content
      await this.addChartToPDF(pdf, sectionData, config.margins.left, yPos, contentWidth);
      yPos += 120; // Chart height
    } else if (sectionData.type === 'table') {
      // Table content
      yPos = this.addTableToPDF(pdf, sectionData.data, config.margins.left, yPos, contentWidth);
    } else if (sectionData.type === 'metrics') {
      // Key metrics grid
      yPos = this.addMetricsGrid(pdf, sectionData.metrics, config.margins.left, yPos, contentWidth);
    }

    return yPos + 15; // Add spacing after section
  }

  async addChartToPDF(pdf, chartData, x, y, width) {
    // For charts, we would typically render them to canvas first
    // This is a placeholder for chart rendering logic
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, width, 80, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`[Chart: ${chartData.title || 'Untitled Chart'}]`, x + 10, y + 45);
  }

  addTableToPDF(pdf, tableData, x, startY, maxWidth) {
    let yPos = startY;
    const colWidth = maxWidth / tableData.headers.length;
    const rowHeight = 8;

    // Headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x, yPos, maxWidth, rowHeight, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    tableData.headers.forEach((header, index) => {
      pdf.text(header, x + index * colWidth + 5, yPos + 5);
    });

    yPos += rowHeight;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    tableData.rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(x, yPos, maxWidth, rowHeight, 'F');
      }

      row.forEach((cell, colIndex) => {
        pdf.text(String(cell), x + colIndex * colWidth + 5, yPos + 5);
      });

      yPos += rowHeight;
    });

    return yPos;
  }

  addMetricsGrid(pdf, metrics, x, startY, maxWidth) {
    const cols = 2;
    const colWidth = maxWidth / cols;
    const rowHeight = 25;

    pdf.setFont('helvetica', 'normal');

    metrics.forEach((metric, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = x + col * colWidth;
      const yPos = startY + row * rowHeight;

      // Metric box
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(xPos + 5, yPos, colWidth - 10, rowHeight - 5);

      // Metric value
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(metric.value, xPos + 10, yPos + 12);

      // Metric label
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(metric.label, xPos + 10, yPos + 20);
    });

    return startY + Math.ceil(metrics.length / cols) * rowHeight;
  }

  addPageNumbers(pdf, totalPages) {
    const pageWidth = pdf.internal.pageSize.getWidth();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${i} of ${totalPages}`, pageWidth - 30, 285);
    }
  }

  addWatermark(pdf, watermark) {
    const totalPages = pdf.internal.pages.length - 1;

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(50);
      pdf.text(watermark.text, 100, 150, {
        angle: 45,
        align: 'center'
      });
    }
  }

  // Excel Export
  async exportToExcel(data, config = {}) {
    const defaultConfig = {
      filename: 'financial_data.xlsx',
      includeCharts: false,
      includeFormatting: true,
      sheetNames: ['Data']
    };

    const finalConfig = { ...defaultConfig, ...config };
    const jobId = this.generateJobId();

    try {
      this.emit('export:started', { jobId, type: 'excel', config: finalConfig });

      const workbook = XLSX.utils.book_new();

      // Process multiple sheets if data is an object with sheet names
      if (typeof data === 'object' && !Array.isArray(data) && !data.length) {
        Object.entries(data).forEach(([sheetName, sheetData]) => {
          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });
      } else {
        // Single sheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, finalConfig.sheetNames[0]);
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: finalConfig.includeFormatting
      });

      // Create download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalConfig.filename;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.emit('export:completed', { jobId, type: 'excel', filename: finalConfig.filename });

      return {
        success: true,
        jobId,
        filename: finalConfig.filename,
        size: blob.size
      };
    } catch (error) {
      this.emit('export:error', { jobId, type: 'excel', error: error.message });
      throw error;
    }
  }

  // Shareable Links System
  async createShareableLink(content, config = {}) {
    const defaultConfig = {
      expirationDays: 30,
      password: null,
      allowDownload: true,
      allowComments: false,
      trackViews: true,
      notifyOwner: false
    };

    const finalConfig = { ...defaultConfig, ...config };
    const linkId = this.generateLinkId();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + finalConfig.expirationDays);

    const shareData = {
      id: linkId,
      content,
      config: finalConfig,
      createdAt: new Date(),
      expirationDate,
      views: 0,
      lastAccessed: null,
      isActive: true,
      analytics: {
        views: [],
        downloads: [],
        comments: []
      }
    };

    this.shareLinks.set(linkId, shareData);

    // Set permissions
    this.permissions.set(linkId, {
      view: true,
      download: finalConfig.allowDownload,
      comment: finalConfig.allowComments,
      password: finalConfig.password
    });

    const shareUrl = `${this.baseUrl}/shared/${linkId}`;

    this.emit('share:created', {
      linkId,
      url: shareUrl,
      config: finalConfig
    });

    return {
      id: linkId,
      url: shareUrl,
      expirationDate,
      config: finalConfig
    };
  }

  async accessSharedLink(linkId, password = null) {
    const shareData = this.shareLinks.get(linkId);

    if (!shareData) {
      throw new Error('Share link not found');
    }

    if (!shareData.isActive) {
      throw new Error('Share link is no longer active');
    }

    if (shareData.expirationDate < new Date()) {
      shareData.isActive = false;
      throw new Error('Share link has expired');
    }

    const permissions = this.permissions.get(linkId);

    if (permissions.password && permissions.password !== password) {
      throw new Error('Invalid password');
    }

    // Update analytics
    shareData.views++;
    shareData.lastAccessed = new Date();
    shareData.analytics.views.push({
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ip: 'client-side' // Would be populated server-side
    });

    this.emit('share:accessed', {
      linkId,
      views: shareData.views
    });

    return {
      content: shareData.content,
      permissions: {
        view: permissions.view,
        download: permissions.download,
        comment: permissions.comment
      },
      metadata: {
        createdAt: shareData.createdAt,
        views: shareData.views,
        lastAccessed: shareData.lastAccessed
      }
    };
  }

  updateShareLink(linkId, updates) {
    const shareData = this.shareLinks.get(linkId);
    if (!shareData) return false;

    // Update configuration
    if (updates.config) {
      shareData.config = { ...shareData.config, ...updates.config };
    }

    // Update permissions
    if (updates.permissions) {
      const currentPerms = this.permissions.get(linkId);
      this.permissions.set(linkId, { ...currentPerms, ...updates.permissions });
    }

    // Update expiration
    if (updates.expirationDays) {
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + updates.expirationDays);
      shareData.expirationDate = newExpiration;
    }

    // Update active status
    if (updates.isActive !== undefined) {
      shareData.isActive = updates.isActive;
    }

    this.emit('share:updated', { linkId, updates });
    return true;
  }

  revokeShareLink(linkId) {
    const shareData = this.shareLinks.get(linkId);
    if (!shareData) return false;

    shareData.isActive = false;
    this.permissions.delete(linkId);

    this.emit('share:revoked', { linkId });
    return true;
  }

  getShareLinkAnalytics(linkId) {
    const shareData = this.shareLinks.get(linkId);
    if (!shareData) return null;

    return {
      id: linkId,
      totalViews: shareData.views,
      createdAt: shareData.createdAt,
      lastAccessed: shareData.lastAccessed,
      isActive: shareData.isActive,
      expirationDate: shareData.expirationDate,
      analytics: shareData.analytics,
      config: shareData.config
    };
  }

  // Batch Export Operations
  async exportMultiple(exports, config = {}) {
    const results = [];
    const batchId = this.generateJobId();

    this.emit('batch_export:started', { batchId, count: exports.length });

    for (let i = 0; i < exports.length; i++) {
      const exportConfig = exports[i];

      try {
        let result;

        switch (exportConfig.type) {
          case 'pdf':
            result = await this.exportToPDF(exportConfig.content, exportConfig.config);
            break;
          case 'excel':
            result = await this.exportToExcel(exportConfig.content, exportConfig.config);
            break;
          default:
            throw new Error(`Unsupported export type: ${exportConfig.type}`);
        }

        results.push({ index: i, success: true, result });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }

      // Progress callback
      if (config.onProgress) {
        config.onProgress(i + 1, exports.length, results[i]);
      }
    }

    this.emit('batch_export:completed', {
      batchId,
      results,
      successCount: results.filter(r => r.success).length
    });

    return results;
  }

  // Template Management
  createTemplate(name, template) {
    this.templates.set(name, {
      ...template,
      createdAt: new Date(),
      customTemplate: true
    });

    this.emit('template:created', { name, template });
    return true;
  }

  updateTemplate(name, updates) {
    const template = this.templates.get(name);
    if (!template) return false;

    this.templates.set(name, {
      ...template,
      ...updates,
      updatedAt: new Date()
    });

    this.emit('template:updated', { name, updates });
    return true;
  }

  deleteTemplate(name) {
    const template = this.templates.get(name);
    if (!template || !template.customTemplate) return false;

    this.templates.delete(name);
    this.emit('template:deleted', { name });
    return true;
  }

  getTemplates() {
    const templates = {};
    this.templates.forEach((template, name) => {
      templates[name] = template;
    });
    return templates;
  }

  // Utility Methods
  formatSectionTitle(sectionName) {
    return sectionName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLinkId() {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
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
          console.error(`Error in export/sharing event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const exportSharingService = new ExportSharingService();
