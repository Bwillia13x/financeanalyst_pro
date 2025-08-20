/**
 * Comprehensive data export service for FinanceAnalyst Pro
 * Supports Excel, PDF, CSV exports with financial formatting
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import 'jspdf-autotable';

class ExportService {
  constructor() {
    this.defaultStyles = {
      excel: {
        headerStyle: {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        },
        currencyStyle: {
          numFmt: '"$"#,##0.00',
          alignment: { horizontal: 'right' }
        },
        percentageStyle: {
          numFmt: '0.00%',
          alignment: { horizontal: 'right' }
        }
      },
      pdf: {
        headerStyle: {
          fillColor: [79, 129, 189],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyle: {
          fontSize: 9,
          textColor: [64, 64, 64]
        }
      }
    };
  }

  /**
   * Export financial spreadsheet data to Excel
   */
  async exportToExcel(data, options = {}) {
    const {
      filename = 'financial-analysis',
      sheetName = 'Financial Data',
      _includeCharts = false,
      includeFormatting = true
    } = options;

    try {
      const workbook = XLSX.utils.book_new();

      // Create main data sheet
      const worksheet = this.createFinancialWorksheet(data, includeFormatting);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Add summary sheet
      if (data.summary) {
        const summarySheet = this.createSummaryWorksheet(data.summary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      // Add analysis results sheet
      if (data.analysis) {
        const analysisSheet = this.createAnalysisWorksheet(data.analysis);
        XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis');
      }

      // Generate file
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: includeFormatting
      });

      this.downloadFile(
        new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${filename}.xlsx`
      );

      return { success: true, message: 'Excel file exported successfully' };
    } catch (error) {
      console.error('Excel export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export financial data to PDF report
   */
  async exportToPDF(data, options = {}) {
    const {
      filename = 'financial-report',
      orientation = 'portrait',
      includeCharts = true,
      includeAnalysis = true,
      companyInfo = {}
    } = options;

    try {
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      let yPosition = 20;

      // Header
      yPosition = this.addPDFHeader(doc, companyInfo, yPosition);

      // Financial data tables
      if (data.financialData) {
        yPosition = this.addFinancialDataToPDF(doc, data.financialData, yPosition);
      }

      // Analysis results
      if (includeAnalysis && data.analysis) {
        yPosition = this.addAnalysisToPDF(doc, data.analysis, yPosition);
      }

      // Charts (placeholders for now)
      if (includeCharts && data.charts) {
        this.addChartsToPDF(doc, data.charts, yPosition);
      }

      // Footer
      this.addPDFFooter(doc);

      // Save PDF
      doc.save(`${filename}.pdf`);

      return { success: true, message: 'PDF report exported successfully' };
    } catch (error) {
      console.error('PDF export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(data, options = {}) {
    const {
      filename = 'financial-data',
      delimiter = ',',
      includeHeaders = true,
      flattenData = true
    } = options;

    try {
      let csvContent = '';

      if (Array.isArray(data)) {
        // Simple array export
        csvContent = this.arrayToCSV(data, { delimiter, includeHeaders });
      } else if (data.financialData) {
        // Financial data export
        csvContent = this.financialDataToCSV(data.financialData, { delimiter, includeHeaders, flattenData });
      } else {
        // Generic object export
        csvContent = this.objectToCSV(data, { delimiter, includeHeaders });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadFile(blob, `${filename}.csv`);

      return { success: true, message: 'CSV file exported successfully' };
    } catch (error) {
      console.error('CSV export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create financial data worksheet for Excel
   */
  createFinancialWorksheet(data, includeFormatting = true) {
    const { periods = [], incomeStatement = {}, balanceSheet = {}, cashFlow = {} } = data;

    const worksheetData = [];
    let rowIndex = 0;

    // Headers
    const headers = ['Account', 'Type', ...periods];
    worksheetData[rowIndex++] = headers;

    // Income Statement
    if (Object.keys(incomeStatement).length > 0) {
      worksheetData[rowIndex++] = ['INCOME STATEMENT', '', ...periods.map(() => '')];
      rowIndex = this.addFinancialSection(worksheetData, incomeStatement, periods, rowIndex);
      worksheetData[rowIndex++] = ['', '', ...periods.map(() => '')]; // Empty row
    }

    // Balance Sheet
    if (Object.keys(balanceSheet).length > 0) {
      worksheetData[rowIndex++] = ['BALANCE SHEET', '', ...periods.map(() => '')];
      rowIndex = this.addFinancialSection(worksheetData, balanceSheet, periods, rowIndex);
      worksheetData[rowIndex++] = ['', '', ...periods.map(() => '')]; // Empty row
    }

    // Cash Flow
    if (Object.keys(cashFlow).length > 0) {
      worksheetData[rowIndex++] = ['CASH FLOW STATEMENT', '', ...periods.map(() => '')];
      rowIndex = this.addFinancialSection(worksheetData, cashFlow, periods, rowIndex);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply formatting if requested
    if (includeFormatting) {
      this.applyExcelFormatting(worksheet, worksheetData);
    }

    return worksheet;
  }

  /**
   * Add financial section to worksheet data
   */
  addFinancialSection(worksheetData, section, periods, startRow) {
    let rowIndex = startRow;

    const processItems = (items, level = 0) => {
      Object.entries(items).forEach(([_key, item]) => {
        if (typeof item === 'object' && item.label) {
          const indent = '  '.repeat(level);
          const row = [
            indent + item.label,
            item.formula ? 'Calculated' : 'Manual',
            ...(item.values || periods.map(() => 0))
          ];
          worksheetData[rowIndex++] = row;

          if (item.items) {
            processItems(item.items, level + 1);
          }
        }
      });
    };

    processItems(section);
    return rowIndex;
  }

  /**
   * Apply Excel formatting
   */
  applyExcelFormatting(worksheet, _data) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Format headers
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = this.defaultStyles.excel.headerStyle;
      }
    }

    // Format currency columns (assuming columns 2+ contain financial data)
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 2; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'number') {
          worksheet[cellRef].s = this.defaultStyles.excel.currencyStyle;
        }
      }
    }
  }

  /**
   * Create summary worksheet
   */
  createSummaryWorksheet(summaryData) {
    const data = [
      ['Financial Summary', ''],
      ['', ''],
      ['Key Metrics', 'Value'],
      ...Object.entries(summaryData).map(([_key, value]) => [
        this.formatMetricName(_key),
        this.formatMetricValue(value)
      ])
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * Create analysis worksheet
   */
  createAnalysisWorksheet(analysisData) {
    const data = [
      ['Analysis Results', ''],
      ['', ''],
      ['Metric', 'Current', 'Target', 'Variance'],
      ...analysisData.map(item => [
        item.metric,
        item.current,
        item.target,
        item.variance
      ])
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * Add header to PDF
   */
  addPDFHeader(doc, companyInfo, yPosition) {
    doc.setFontSize(20);
    doc.setTextColor(64, 64, 64);
    doc.text(companyInfo.name || 'Financial Analysis Report', 20, yPosition);

    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);

    if (companyInfo.period) {
      doc.text(`Period: ${companyInfo.period}`, 120, yPosition);
    }

    return yPosition + 15;
  }

  /**
   * Add financial data tables to PDF
   */
  addFinancialDataToPDF(doc, financialData, yPosition) {
    const { periods = [], incomeStatement = {} } = financialData;

    if (Object.keys(incomeStatement).length > 0) {
      doc.setFontSize(14);
      doc.text('Income Statement', 20, yPosition);
      yPosition += 10;

      const tableData = this.prepareTableDataForPDF(incomeStatement, periods);

      doc.autoTable({
        head: [['Account', ...periods]],
        body: tableData,
        startY: yPosition,
        styles: this.defaultStyles.pdf.bodyStyle,
        headStyles: this.defaultStyles.pdf.headerStyle,
        columnStyles: {
          0: { cellWidth: 80 },
          ...periods.reduce((acc, _, index) => ({
            ...acc,
            [index + 1]: { cellWidth: 30, halign: 'right' }
          }), {})
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    return yPosition;
  }

  /**
   * Add analysis results to PDF
   */
  addAnalysisToPDF(doc, analysisData, yPosition) {
    doc.setFontSize(14);
    doc.text('Analysis Results', 20, yPosition);
    yPosition += 10;

    const tableData = analysisData.map(item => [
      item.metric,
      this.formatCurrency(item.current),
      this.formatCurrency(item.target),
      this.formatPercentage(item.variance)
    ]);

    doc.autoTable({
      head: [['Metric', 'Current', 'Target', 'Variance']],
      body: tableData,
      startY: yPosition,
      styles: this.defaultStyles.pdf.bodyStyle,
      headStyles: this.defaultStyles.pdf.headerStyle
    });

    return doc.lastAutoTable.finalY + 15;
  }

  /**
   * Add charts placeholder to PDF
   */
  addChartsToPDF(doc, _chartsData, yPosition) {
    doc.setFontSize(14);
    doc.text('Charts & Visualizations', 20, yPosition);
    yPosition += 10;

    // Placeholder for charts - in a real implementation, you'd render charts to images
    doc.setFontSize(10);
    doc.text('Chart visualizations would be rendered here', 20, yPosition);
    doc.text('Implementation requires chart-to-image conversion', 20, yPosition + 5);

    return yPosition + 20;
  }

  /**
   * Add footer to PDF
   */
  addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by FinanceAnalyst Pro`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
  }

  /**
   * Convert financial data to CSV
   */
  financialDataToCSV(financialData, options) {
    const { delimiter, includeHeaders, flattenData } = options;
    const { periods = [], incomeStatement = {} } = financialData;

    let csvContent = '';

    if (includeHeaders) {
      csvContent += ['Account', 'Type', ...periods].join(delimiter) + '\n';
    }

    const processSection = (section, sectionName) => {
      csvContent += `\n${sectionName}\n`;

      const processItems = (items, level = 0) => {
        Object.entries(items).forEach(([_key, item]) => {
          if (typeof item === 'object' && item.label) {
            const indent = flattenData ? '' : '  '.repeat(level);
            const row = [
              `"${indent}${item.label}"`,
              item.formula ? 'Calculated' : 'Manual',
              ...(item.values || periods.map(() => 0))
            ];
            csvContent += row.join(delimiter) + '\n';

            if (item.items && !flattenData) {
              processItems(item.items, level + 1);
            }
          }
        });
      };

      processItems(section);
    };

    if (Object.keys(incomeStatement).length > 0) {
      processSection(incomeStatement, 'Income Statement');
    }

    return csvContent;
  }

  /**
   * Generic array to CSV conversion
   */
  arrayToCSV(data, options) {
    const { delimiter, includeHeaders } = options;

    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    let csvContent = '';

    if (includeHeaders) {
      csvContent += headers.join(delimiter) + '\n';
    }

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains delimiter
        const stringValue = String(value || '');
        return stringValue.includes(delimiter) || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      });
      csvContent += values.join(delimiter) + '\n';
    });

    return csvContent;
  }

  /**
   * Utility functions
   */
  formatMetricName(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  formatMetricValue(value) {
    if (typeof value === 'number') {
      return value > 1 ? this.formatCurrency(value) : this.formatPercentage(value);
    }
    return value;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  prepareTableDataForPDF(data, periods) {
    const tableData = [];

    const processItems = (items, level = 0) => {
      Object.entries(items).forEach(([_key, item]) => {
        if (typeof item === 'object' && item.label) {
          const indent = '  '.repeat(level);
          const row = [
            indent + item.label,
            ...(item.values || periods.map(() => 0)).map(val => this.formatCurrency(val))
          ];
          tableData.push(row);

          if (item.items) {
            processItems(item.items, level + 1);
          }
        }
      });
    };

    processItems(data);
    return tableData;
  }

  downloadFile(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

// Create singleton instance
const exportService = new ExportService();

// Export convenience functions
export const exportToExcel = (data, options) => exportService.exportToExcel(data, options);
export const exportToPDF = (data, options) => exportService.exportToPDF(data, options);
export const exportToCSV = (data, options) => exportService.exportToCSV(data, options);

export default exportService;
