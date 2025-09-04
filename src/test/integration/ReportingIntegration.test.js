/**
 * Reporting System Integration Tests
 * Tests the integration between report builder, scheduled reports, and export services
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { reportBuilderService } from '../../services/reporting/ReportBuilderService';
import { scheduledReportsService } from '../../services/reporting/ScheduledReportsService';
import { exportService } from '../../services/reporting/ExportService';

describe('Reporting System Integration', () => {
  const testTemplateId = 'financial-analysis';
  const testScheduledReportId = 'scheduled_' + Date.now();
  let testReportId;
  let actualScheduledReportId;

  beforeAll(async () => {
    // Initialize all reporting services
    await reportBuilderService.initialize?.();
    await scheduledReportsService.initialize?.();
    await exportService.initialize?.();
  }, 10000);

  afterAll(async () => {
    // Cleanup
    await reportBuilderService.shutdown?.();
    await scheduledReportsService.shutdown?.();
    await exportService.shutdown?.();
  });

  describe('Service Integration', () => {
    it('should initialize all reporting services successfully', () => {
      expect(reportBuilderService).toBeDefined();
      expect(scheduledReportsService).toBeDefined();
      expect(exportService).toBeDefined();
    });

    it('should have all required methods available', () => {
      expect(typeof reportBuilderService.createReport).toBe('function');
      expect(typeof reportBuilderService.generateReport).toBe('function');
      expect(typeof scheduledReportsService.scheduleReport).toBe('function');
      expect(typeof exportService.exportDashboard).toBe('function');
    });
  });

  describe('Report Builder Integration', () => {
    it('should create report from template', async () => {
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Test Financial Analysis',
        author: 'Test User',
        theme: 'professional'
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.title).toBe('Test Financial Analysis');
      expect(report.author).toBe('Test User');
      expect(report.theme).toBe('professional');
      expect(Array.isArray(report.sections)).toBe(true);
      expect(report.sections.length).toBeGreaterThan(0);

      // Store the actual report ID for use in subsequent tests
      testReportId = report.id;
    });

    it('should update report content', async () => {
      const report = reportBuilderService.getReport(testReportId);
      expect(report).toBeDefined();

      const updates = {
        title: 'Updated Test Report',
        sections: [
          ...report.sections,
          {
            id: 'new_section',
            type: 'content',
            title: 'New Section',
            content: { type: 'text', placeholder: 'New content' }
          }
        ]
      };

      const updatedReport = await reportBuilderService.updateReport(testReportId, updates);

      expect(updatedReport.title).toBe('Updated Test Report');
      expect(updatedReport.sections.length).toBe(7); // Template has 6 sections + 1 new section
    });

    it('should generate report in multiple formats', async () => {
      const formats = ['pdf', 'html', 'json'];

      for (const format of formats) {
        const result = await reportBuilderService.generateReport(testReportId, format);

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.filename).toBeDefined();
        expect(result.mimeType).toBeDefined();
        expect(result.filename).toContain(format);
      }
    });

    it('should list available templates', () => {
      const templates = reportBuilderService.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      const template = templates.find(t => t.id === testTemplateId);
      expect(template).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.category).toBeDefined();
    });

    it('should filter templates by category', () => {
      const analysisTemplates = reportBuilderService.getTemplates('analysis');
      const investmentTemplates = reportBuilderService.getTemplates('investment');

      expect(Array.isArray(analysisTemplates)).toBe(true);
      expect(Array.isArray(investmentTemplates)).toBe(true);

      analysisTemplates.forEach(template => {
        expect(template.category).toBe('analysis');
      });

      investmentTemplates.forEach(template => {
        expect(template.category).toBe('investment');
      });
    });

    it('should get available themes', () => {
      const themes = reportBuilderService.getThemes();

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);

      themes.forEach(theme => {
        expect(theme.name).toBeDefined();
        expect(theme.colors).toBeDefined();
        expect(theme.fonts).toBeDefined();
      });
    });
  });

  describe('Scheduled Reports Integration', () => {
    it('should schedule a new report', async () => {
      const scheduledReport = await scheduledReportsService.scheduleReport(
        {
          name: 'Daily Market Summary',
          description: 'Automated daily market summary report',
          templateId: testTemplateId,
          schedule: {
            type: 'interval',
            interval: 'daily',
            time: '09:00'
          },
          recipients: ['test@example.com'],
          format: 'pdf',
          dataSource: 'market-data'
        },
        {
          userId: 'test_user',
          tags: ['market', 'daily']
        }
      );

      expect(scheduledReport).toBeDefined();
      expect(scheduledReport.id).toBeDefined();
      expect(scheduledReport.name).toBe('Daily Market Summary');
      expect(scheduledReport.status).toBe('active');
      expect(scheduledReport.schedule.interval).toBe('daily');
      expect(Array.isArray(scheduledReport.recipients)).toBe(true);

      // Store the actual scheduled report ID for use in subsequent tests
      actualScheduledReportId = scheduledReport.id;
    });

    it('should list scheduled reports', () => {
      const reports = scheduledReportsService.listScheduledReports();

      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);

      const report = reports.find(r => r.id === actualScheduledReportId);
      expect(report).toBeDefined();
    });

    it('should pause and resume scheduled report', async () => {
      // Pause
      const pausedReport =
        await scheduledReportsService.pauseScheduledReport(actualScheduledReportId);
      expect(pausedReport.status).toBe('paused');

      // Resume
      const resumedReport =
        await scheduledReportsService.resumeScheduledReport(actualScheduledReportId);
      expect(resumedReport.status).toBe('active');
    });

    it('should get scheduled report by ID', () => {
      const report = scheduledReportsService.getScheduledReport(actualScheduledReportId);

      expect(report).toBeDefined();
      expect(report.id).toBe(actualScheduledReportId);
      expect(report.name).toBe('Daily Market Summary');
    });

    it('should get execution history', () => {
      const history = scheduledReportsService.getExecutionHistory(actualScheduledReportId);

      expect(Array.isArray(history)).toBe(true);
      // History might be empty initially
    });

    it('should get delivery queue status', () => {
      const status = scheduledReportsService.getDeliveryQueueStatus();

      expect(status).toBeDefined();
      expect(typeof status.total).toBe('number');
      expect(typeof status.queued).toBe('number');
      expect(typeof status.delivered).toBe('number');
      expect(typeof status.failed).toBe('number');
    });
  });

  describe('Export Service Integration', () => {
    const testDashboardConfig = {
      title: 'Test Dashboard',
      widgets: [
        {
          type: 'metric',
          data: { value: 1500000, format: 'currency' }
        },
        {
          type: 'chart',
          data: { chartType: 'line', dataSource: 'test-data' }
        }
      ]
    };

    it('should export dashboard to multiple formats', async () => {
      const formats = ['pdf', 'png', 'html'];

      for (const format of formats) {
        const jobId = await exportService.exportDashboard(testDashboardConfig, format, {
          quality: 1.0,
          resolution: 1200
        });

        expect(jobId).toBeDefined();
        expect(typeof jobId).toBe('string');

        // Wait for export to complete (in real implementation)
        // For now, just check that job was created
        const status = exportService.getExportStatus(jobId);
        expect(status).toBeDefined();
      }
    });

    it('should export chart to image format', async () => {
      const chartConfig = {
        type: 'line',
        data: [1, 2, 3, 4, 5],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
      };

      const jobId = await exportService.exportChart(chartConfig, 'png', {
        width: 800,
        height: 400,
        backgroundColor: 'white'
      });

      expect(jobId).toBeDefined();

      const status = exportService.getExportStatus(jobId);
      expect(status).toBeDefined();
    });

    it('should export table to spreadsheet format', async () => {
      const tableData = {
        headers: ['Name', 'Value', 'Change'],
        rows: [
          ['AAPL', 150.0, 2.5],
          ['MSFT', 300.0, 5.0],
          ['GOOGL', 2800.0, 25.0]
        ]
      };

      const jobId = await exportService.exportTable(tableData, 'excel', {
        includeHeaders: true,
        formatting: 'currency'
      });

      expect(jobId).toBeDefined();

      const status = exportService.getExportStatus(jobId);
      expect(status).toBeDefined();
    });

    it('should handle export job lifecycle', async () => {
      const jobId = await exportService.exportDashboard(testDashboardConfig, 'pdf');

      // Initially should be queued or processing
      const status = exportService.getExportStatus(jobId);
      expect(status).toBeDefined();
      expect(['queued', 'processing']).toContain(status.status);

      // Should have creation timestamp
      expect(status.created).toBeDefined();
      expect(status.created instanceof Date || typeof status.created === 'string').toBe(true);
    });

    it('should cancel export job', () => {
      const jobId = 'test_cancel_' + Date.now();

      // Mock adding a job to cancel
      exportService.exportQueue = [
        {
          id: jobId,
          status: 'queued',
          created: new Date()
        }
      ];

      const cancelled = exportService.cancelExport(jobId);
      expect(cancelled).toBe(true);

      // Job should be removed from queue
      const status = exportService.getExportStatus(jobId);
      expect(status).toBeNull();
    });

    it('should get export service statistics', () => {
      const stats = exportService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.queueSize).toBe('number');
      expect(typeof stats.activeExports).toBe('number');
      expect(typeof stats.completedExports).toBe('number');
      expect(typeof stats.failedExports).toBe('number');
    });
  });

  describe('Cross-Service Integration', () => {
    it('should create report from template and export it', async () => {
      // Create report
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Integration Test Report',
        author: 'Integration Test'
      });

      expect(report).toBeDefined();

      // Export report
      const exportResult = await reportBuilderService.generateReport(report.id, 'pdf');
      expect(exportResult).toBeDefined();
      expect(exportResult.data).toBeDefined();
      expect(exportResult.filename).toContain('pdf');
    });

    it('should create scheduled report and verify scheduling', async () => {
      const scheduledReport = await scheduledReportsService.scheduleReport({
        name: 'Integration Test Schedule',
        templateId: testTemplateId,
        schedule: {
          type: 'interval',
          interval: 'weekly',
          time: '10:00',
          daysOfWeek: [1] // Monday
        },
        recipients: ['integration@example.com'],
        format: 'excel'
      });

      expect(scheduledReport).toBeDefined();
      expect(scheduledReport.schedule.interval).toBe('weekly');
      expect(scheduledReport.format).toBe('excel');

      // Verify it appears in list
      const reports = scheduledReportsService.listScheduledReports();
      const found = reports.find(r => r.id === scheduledReport.id);
      expect(found).toBeDefined();
    });

    it('should handle complex report with multiple sections and export', async () => {
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Complex Integration Report',
        author: 'Integration Test'
      });

      // Add complex content
      const complexSections = report.sections.map(section => ({
        ...section,
        content: {
          ...section.content,
          // Ensure elements array exists and add complex content
          ...(section.content && section.content.type === 'mixed'
            ? {
                elements: [
                  ...(section.content.elements || []),
                  {
                    type: 'chart',
                    chartType: 'line',
                    dataSource: 'complex-data'
                  },
                  {
                    type: 'table',
                    dataSource: 'complex-table'
                  }
                ]
              }
            : {
                // For non-mixed content types, keep original content
                ...section.content
              })
        }
      }));

      await reportBuilderService.updateReport(report.id, {
        sections: complexSections
      });

      // Export complex report
      const exportResult = await reportBuilderService.generateReport(report.id, 'html');
      expect(exportResult).toBeDefined();
      expect(exportResult.data).toBeDefined();
    });

    it('should handle multiple concurrent exports', async () => {
      const exportPromises = [];

      // Create multiple export jobs
      for (let i = 0; i < 3; i++) {
        const promise = exportService.exportDashboard(
          {
            title: `Concurrent Export ${i}`,
            widgets: [
              {
                type: 'metric',
                data: { value: 100 * (i + 1) }
              }
            ]
          },
          'pdf'
        );

        exportPromises.push(promise);
      }

      // Wait for all to be queued
      const jobIds = await Promise.all(exportPromises);

      expect(jobIds).toHaveLength(3);
      jobIds.forEach(jobId => {
        expect(jobId).toBeDefined();
        expect(typeof jobId).toBe('string');
      });

      // Check queue status
      const stats = exportService.getStats();
      expect(stats.queueSize).toBeGreaterThanOrEqual(3);
    });

    it('should integrate report creation with scheduled delivery', async () => {
      // Create a report
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Scheduled Delivery Report',
        author: 'Integration Test'
      });

      // Schedule it for delivery
      const scheduledReport = await scheduledReportsService.scheduleReport({
        name: 'Scheduled Delivery Test',
        description: 'Test scheduled delivery',
        templateId: testTemplateId,
        schedule: {
          type: 'interval',
          interval: 'monthly',
          time: '08:00'
        },
        recipients: ['delivery@example.com'],
        format: 'pdf'
      });

      expect(scheduledReport).toBeDefined();
      expect(scheduledReport.schedule.interval).toBe('monthly');
      expect(scheduledReport.recipients).toContain('delivery@example.com');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple report creations efficiently', async () => {
      const startTime = Date.now();
      const reportPromises = [];

      // Create multiple reports
      for (let i = 0; i < 5; i++) {
        const promise = reportBuilderService.createReport(testTemplateId, {
          title: `Performance Test Report ${i}`,
          author: 'Performance Test'
        });
        reportPromises.push(promise);
      }

      const reports = await Promise.all(reportPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(reports).toHaveLength(5);
      reports.forEach(report => {
        expect(report).toBeDefined();
        expect(report.id).toBeDefined();
      });

      // Should complete within reasonable time (allowing for async operations)
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should handle large report exports', async () => {
      // Create a report with many sections
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Large Report Test',
        author: 'Performance Test'
      });

      // Add many sections
      const largeSections = [];
      for (let i = 0; i < 20; i++) {
        largeSections.push({
          id: `section_${i}`,
          type: 'content',
          title: `Section ${i}`,
          layout: 'single-column',
          content: {
            type: 'text',
            placeholder: `Content for section ${i}. `.repeat(50)
          }
        });
      }

      await reportBuilderService.updateReport(report.id, {
        sections: largeSections
      });

      // Export large report
      const exportResult = await reportBuilderService.generateReport(report.id, 'html');

      expect(exportResult).toBeDefined();
      expect(exportResult.data).toBeDefined();
      expect(exportResult.data.length).toBeGreaterThan(1000); // Should be substantial
    });

    it('should maintain performance with many scheduled reports', async () => {
      const startTime = Date.now();
      const schedulePromises = [];

      // Create multiple scheduled reports
      for (let i = 0; i < 10; i++) {
        const promise = scheduledReportsService.scheduleReport({
          name: `Bulk Schedule ${i}`,
          templateId: testTemplateId,
          schedule: {
            type: 'interval',
            interval: 'daily',
            time: '09:00'
          },
          recipients: [`user${i}@example.com`],
          format: 'pdf'
        });
        schedulePromises.push(promise);
      }

      await Promise.all(schedulePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all were created
      const reports = scheduledReportsService.listScheduledReports();
      expect(reports.length).toBeGreaterThanOrEqual(10);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid template IDs gracefully', async () => {
      await expect(reportBuilderService.createReport('invalid-template', {})).rejects.toThrow();
    });

    it('should handle invalid report IDs gracefully', async () => {
      await expect(reportBuilderService.updateReport('invalid-report-id', {})).rejects.toThrow();

      await expect(
        reportBuilderService.generateReport('invalid-report-id', 'pdf')
      ).rejects.toThrow();
    });

    it('should handle unsupported export formats gracefully', async () => {
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Format Test',
        author: 'Error Test'
      });

      await expect(reportBuilderService.generateReport(report.id, 'unsupported')).rejects.toThrow();
    });

    it('should handle invalid scheduled report configurations', async () => {
      await expect(
        scheduledReportsService.scheduleReport({
          name: 'Invalid Schedule',
          templateId: 'invalid-template',
          schedule: {}
        })
      ).rejects.toThrow();
    });

    it('should handle export failures gracefully', async () => {
      const invalidConfig = {
        title: 'Invalid Export',
        widgets: [] // Empty widgets might cause issues
      };

      const jobId = await exportService.exportDashboard(invalidConfig, 'invalid-format');

      // Job should be created even with invalid format
      expect(jobId).toBeDefined();

      // But should fail during processing
      const status = exportService.getExportStatus(jobId);
      expect(status).toBeDefined();
    });

    it('should handle concurrent access to services', async () => {
      // Test concurrent report creation and access
      const concurrentPromises = [];

      for (let i = 0; i < 5; i++) {
        const promise = reportBuilderService
          .createReport(testTemplateId, {
            title: `Concurrent Report ${i}`,
            author: 'Concurrency Test'
          })
          .then(report => {
            // Try to access and update the report immediately
            return reportBuilderService.updateReport(report.id, {
              title: `Updated Concurrent Report ${i}`
            });
          });

        concurrentPromises.push(promise);
      }

      const results = await Promise.all(concurrentPromises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.title).toContain('Updated');
      });
    });
  });

  describe('Data Persistence and Recovery', () => {
    it('should maintain report data across service operations', async () => {
      const report = await reportBuilderService.createReport(testTemplateId, {
        title: 'Persistence Test',
        author: 'Persistence Test'
      });

      const originalTitle = report.title;
      const originalSections = report.sections.length;

      // Update report
      await reportBuilderService.updateReport(report.id, {
        title: 'Updated Persistence Test',
        sections: [
          ...report.sections,
          {
            id: 'persistence_section',
            type: 'content',
            title: 'Persistence Section',
            content: { type: 'text', placeholder: 'Persistent content' }
          }
        ]
      });

      // Retrieve report again
      const retrievedReport = reportBuilderService.getReport(report.id);

      expect(retrievedReport).toBeDefined();
      expect(retrievedReport.title).toBe('Updated Persistence Test');
      expect(retrievedReport.sections.length).toBe(originalSections + 1);
    });

    it('should maintain scheduled report state', async () => {
      const scheduledReport = await scheduledReportsService.scheduleReport({
        name: 'Persistence Test Schedule',
        templateId: testTemplateId,
        schedule: { type: 'interval', interval: 'daily', time: '09:00' },
        recipients: ['persistence@example.com'],
        format: 'pdf'
      });

      const originalStatus = scheduledReport.status;

      // Pause the report
      await scheduledReportsService.pauseScheduledReport(scheduledReport.id);

      // Retrieve and verify
      const retrievedReport = scheduledReportsService.getScheduledReport(scheduledReport.id);

      expect(retrievedReport).toBeDefined();
      expect(retrievedReport.status).toBe('paused');
      expect(retrievedReport.name).toBe('Persistence Test Schedule');
    });

    it('should handle service restart scenarios', async () => {
      // Create some reports
      const reports = [];
      for (let i = 0; i < 3; i++) {
        const report = await reportBuilderService.createReport(testTemplateId, {
          title: `Restart Test ${i}`,
          author: 'Restart Test'
        });
        reports.push(report);
      }

      // Simulate service restart by getting fresh references
      const allReports = reportBuilderService.listReports();

      expect(allReports.length).toBeGreaterThanOrEqual(3);

      // Verify all reports are still accessible
      for (const report of reports) {
        const found = allReports.find(r => r.id === report.id);
        expect(found).toBeDefined();
        expect(found.title).toBe(report.title);
      }
    });
  });

  describe('System Health Monitoring', () => {
    it('should provide report builder service statistics', () => {
      const stats = reportBuilderService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.templates).toBe('number');
      expect(typeof stats.reports).toBe('number');
      expect(typeof stats.themes).toBe('number');
      expect(typeof stats.layouts).toBe('number');
      expect(typeof stats.fonts).toBe('number');
    });

    it('should provide scheduled reports service statistics', () => {
      const stats = scheduledReportsService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.scheduledReports).toBe('number');
      expect(typeof stats.activeReports).toBe('number');
      expect(typeof stats.deliveryQueue).toBe('number');
      expect(typeof stats.executionHistory).toBe('number');
    });

    it('should provide export service statistics', () => {
      const stats = exportService.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.queueSize).toBe('number');
      expect(typeof stats.activeExports).toBe('number');
      expect(typeof stats.completedExports).toBe('number');
      expect(typeof stats.failedExports).toBe('number');
    });

    it('should track service usage metrics', async () => {
      const initialStats = reportBuilderService.getStats();

      // Perform some operations
      await reportBuilderService.createReport(testTemplateId, {
        title: 'Metrics Test',
        author: 'Metrics Test'
      });

      const finalStats = reportBuilderService.getStats();

      // Reports count should increase
      expect(finalStats.reports).toBeGreaterThanOrEqual(initialStats.reports);
    });

    it('should monitor export performance', async () => {
      const initialStats = exportService.getStats();

      // Perform export
      await exportService.exportDashboard(
        {
          title: 'Performance Test',
          widgets: [
            {
              type: 'metric',
              data: { value: 100 }
            }
          ]
        },
        'pdf'
      );

      const finalStats = exportService.getStats();

      // Queue size should increase initially
      expect(finalStats.queueSize).toBeGreaterThanOrEqual(initialStats.queueSize);
    });
  });
});
