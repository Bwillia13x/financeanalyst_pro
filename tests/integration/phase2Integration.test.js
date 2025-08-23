// Phase 2 Integration Tests - Collaboration, Visualization & Analytics
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import Phase 2 services
import { versionControlService } from '../../src/services/collaboration/versionControl';
import { commentingService } from '../../src/services/collaboration/commentingSystem';
import { userPresenceService } from '../../src/services/collaboration/userPresenceSystem';
import { notificationService } from '../../src/services/notifications/notificationSystem';
import { interactiveDashboardService } from '../../src/services/dashboards/interactiveDashboards';
import { executivePresentationService } from '../../src/services/presentation/executivePresentationBuilder';
import { creditAnalysisService } from '../../src/services/credit/creditAnalysisModule';
import { riskAssessmentService } from '../../src/services/risk/riskAssessmentTools';
import { dashboardTemplateService } from '../../src/services/dashboards/dashboardTemplateLibrary';
import { dataVisualizationService } from '../../src/services/visualization/dataVisualizationComponents';
import { exportSharingService } from '../../src/services/sharing/exportSharingService';

describe('Phase 2 Integration Tests', () => {
  const mockAnalysisId = 'test-analysis-123';
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'analyst',
    avatar: 'avatar-url'
  };

  const mockFinancialData = {
    revenue: [100, 120, 140, 160, 180],
    expenses: [80, 90, 100, 110, 120],
    netIncome: [20, 30, 40, 50, 60],
    periods: ['2019', '2020', '2021', '2022', '2023']
  };

  beforeEach(() => {
    // Reset services before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllTimers();
  });

  describe('Collaboration Features Integration', () => {
    it('should handle complete collaboration workflow', async () => {
      // Test version control creation
      const version = await versionControlService.createVersion(mockAnalysisId, {
        changes: { revenue: mockFinancialData.revenue },
        message: 'Updated revenue projections',
        author: mockUser
      });

      expect(version).toBeDefined();
      expect(version.version).toBe('1.0.0');
      expect(version.message).toBe('Updated revenue projections');

      // Test user presence
      await userPresenceService.joinSession(mockAnalysisId, mockUser);
      const activeUsers = await userPresenceService.getActiveUsers(mockAnalysisId);
      
      expect(activeUsers).toContain(expect.objectContaining({
        id: mockUser.id,
        name: mockUser.name
      }));

      // Test commenting
      const comment = await commentingService.addComment(mockAnalysisId, {
        content: 'Revenue assumptions look conservative',
        cellReference: 'B5',
        type: 'assumption',
        author: mockUser
      });

      expect(comment).toBeDefined();
      expect(comment.content).toBe('Revenue assumptions look conservative');
      expect(comment.cellReference).toBe('B5');

      // Test comment replies
      const reply = await commentingService.addReply(comment.id, {
        content: 'Agreed, we should consider market growth',
        author: mockUser
      });

      expect(reply).toBeDefined();
      expect(reply.parentId).toBe(comment.id);

      // Test notifications
      const notification = await notificationService.createNotification({
        userId: mockUser.id,
        type: 'collaboration',
        title: 'New Comment Added',
        message: 'A new comment was added to your analysis',
        data: { analysisId: mockAnalysisId, commentId: comment.id }
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('collaboration');
    });

    it('should handle version branching and merging', async () => {
      // Create initial version
      const mainVersion = await versionControlService.createVersion(mockAnalysisId, {
        changes: mockFinancialData,
        message: 'Initial financial model',
        author: mockUser
      });

      // Create branch
      const branch = await versionControlService.createBranch(mockAnalysisId, {
        name: 'scenario-analysis',
        basedOn: mainVersion.id,
        author: mockUser
      });

      expect(branch).toBeDefined();
      expect(branch.name).toBe('scenario-analysis');

      // Switch to branch
      await versionControlService.switchBranch(mockAnalysisId, 'scenario-analysis');

      // Make changes in branch
      const branchVersion = await versionControlService.createVersion(mockAnalysisId, {
        changes: { revenue: [120, 140, 160, 180, 200] },
        message: 'Optimistic scenario',
        author: mockUser
      });

      expect(branchVersion.branch).toBe('scenario-analysis');

      // Merge branch back to main
      const mergeResult = await versionControlService.mergeBranch(
        mockAnalysisId,
        'scenario-analysis',
        'main',
        { strategy: 'accept_incoming', author: mockUser }
      );

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.conflicts).toHaveLength(0);
    });
  });

  describe('Dashboard and Visualization Integration', () => {
    it('should create and manage interactive dashboards', async () => {
      // Create dashboard
      const dashboard = await interactiveDashboardService.createDashboard({
        id: mockAnalysisId,
        name: 'Financial Overview Dashboard',
        layout: 'grid',
        theme: 'professional'
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Financial Overview Dashboard');

      // Add KPI widget
      const kpiWidget = await interactiveDashboardService.addWidget(dashboard.id, {
        type: 'kpi',
        title: 'Revenue Growth',
        position: { x: 0, y: 0 },
        size: { width: 3, height: 2 },
        data: {
          value: '25%',
          label: 'YoY Growth',
          change: 5.2
        }
      });

      expect(kpiWidget).toBeDefined();
      expect(kpiWidget.type).toBe('kpi');

      // Add chart widget
      const chartWidget = await interactiveDashboardService.addWidget(dashboard.id, {
        type: 'chart',
        title: 'Revenue Trend',
        position: { x: 3, y: 0 },
        size: { width: 6, height: 4 },
        config: {
          chartType: 'line',
          xAxis: 'periods',
          yAxis: 'revenue'
        }
      });

      expect(chartWidget).toBeDefined();
      expect(chartWidget.type).toBe('chart');

      // Connect data to widgets
      await interactiveDashboardService.connectDataSource(chartWidget.id, {
        type: 'json',
        data: mockFinancialData
      });

      // Test real-time updates
      const updatedData = { ...mockFinancialData, revenue: [110, 130, 150, 170, 190] };
      await interactiveDashboardService.updateData(dashboard.id, updatedData);

      const widgets = await interactiveDashboardService.getWidgets(dashboard.id);
      expect(widgets).toHaveLength(2);
    });

    it('should create advanced visualizations', async () => {
      // Create line chart
      const lineChartId = dataVisualizationService.createAdvancedLineChart(
        'test-container',
        [{
          name: 'Revenue',
          values: mockFinancialData.periods.map((period, i) => ({
            date: new Date(`${period}-01-01`),
            value: mockFinancialData.revenue[i]
          }))
        }],
        {
          theme: 'professional',
          showGrid: true,
          showTooltip: true,
          animations: true
        }
      );

      expect(lineChartId).toBeDefined();

      // Create bar chart
      const barChartId = dataVisualizationService.createAdvancedBarChart(
        'test-container-2',
        mockFinancialData.periods.map((period, i) => ({
          category: period,
          values: [
            { series: 'Revenue', value: mockFinancialData.revenue[i] },
            { series: 'Expenses', value: mockFinancialData.expenses[i] }
          ]
        })),
        {
          theme: 'financial',
          barType: 'grouped',
          showValues: true
        }
      );

      expect(barChartId).toBeDefined();

      // Test chart updates
      const updatedData = [{
        name: 'Revenue',
        values: mockFinancialData.periods.map((period, i) => ({
          date: new Date(`${period}-01-01`),
          value: mockFinancialData.revenue[i] * 1.1
        }))
      }];

      const updateResult = dataVisualizationService.updateChart(lineChartId, updatedData);
      expect(updateResult).toBe(true);
    });

    it('should manage dashboard templates', async () => {
      // Get available templates
      const templates = await dashboardTemplateService.getTemplates();
      expect(templates).toBeDefined();
      expect(templates.technology).toBeDefined();
      expect(templates.financial_services).toBeDefined();

      // Create dashboard from template
      const dashboard = await dashboardTemplateService.createFromTemplate(
        'technology',
        mockAnalysisId,
        'Tech Company Analysis'
      );

      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Tech Company Analysis');
      expect(dashboard.widgets).toBeInstanceOf(Array);
      expect(dashboard.widgets.length).toBeGreaterThan(0);

      // Rate template
      await dashboardTemplateService.rateTemplate('technology', mockUser.id, 5, 'Excellent template');

      const templateInfo = await dashboardTemplateService.getTemplate('technology');
      expect(templateInfo.rating).toBeGreaterThan(0);
    });
  });

  describe('Credit Analysis and Risk Assessment Integration', () => {
    it('should perform comprehensive credit analysis', async () => {
      const creditData = {
        totalAssets: 1000000,
        totalLiabilities: 600000,
        workingCapital: 200000,
        retainedEarnings: 150000,
        ebit: 100000,
        marketValueEquity: 800000,
        sales: 1200000,
        currentAssets: 400000,
        currentLiabilities: 200000,
        netIncome: 80000,
        cashFlow: 120000
      };

      // Test Altman Z-Score
      const altmanScore = await creditAnalysisService.calculateDefaultProbability(
        creditData,
        'altman_z'
      );

      expect(altmanScore).toBeDefined();
      expect(altmanScore.score).toBeGreaterThan(0);
      expect(altmanScore.rating).toBeDefined();
      expect(altmanScore.probability).toBeGreaterThan(0);

      // Test bond valuation
      const bondData = {
        faceValue: 1000,
        couponRate: 0.05,
        marketRate: 0.04,
        yearsToMaturity: 10,
        paymentsPerYear: 2,
        creditSpread: 0.01
      };

      const bondValuation = await creditAnalysisService.calculateBondValuation(bondData);

      expect(bondValuation).toBeDefined();
      expect(bondValuation.presentValue).toBeGreaterThan(0);
      expect(bondValuation.yieldToMaturity).toBeCloseTo(0.05, 2);
      expect(bondValuation.duration).toBeGreaterThan(0);

      // Test risk assessment
      const riskAssessment = await creditAnalysisService.assessRisk(creditData, {
        industry: 'technology',
        includeQualitative: true
      });

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.overallRating).toBeDefined();
      expect(riskAssessment.quantitativeScore).toBeGreaterThan(0);
      expect(riskAssessment.riskFactors).toBeInstanceOf(Array);
    });

    it('should perform risk assessment and covenant analysis', async () => {
      const covenantData = {
        currentRatio: 2.0,
        debtToEquity: 0.6,
        interestCoverage: 5.0,
        minCurrentRatio: 1.5,
        maxDebtToEquity: 0.8,
        minInterestCoverage: 3.0
      };

      // Test covenant compliance
      const covenantAnalysis = await riskAssessmentService.analyzeCovenant(
        mockAnalysisId,
        covenantData
      );

      expect(covenantAnalysis).toBeDefined();
      expect(covenantAnalysis.compliance.overall).toBe(true);
      expect(covenantAnalysis.tests).toBeInstanceOf(Array);
      expect(covenantAnalysis.tests.length).toBe(3);

      // Test credit scoring
      const creditScore = await riskAssessmentService.calculateCreditScore(
        covenantData,
        { model: 'comprehensive' }
      );

      expect(creditScore).toBeDefined();
      expect(creditScore.score).toBeGreaterThan(0);
      expect(creditScore.grade).toBeDefined();
      expect(creditScore.components).toBeDefined();

      // Test risk profiling
      const riskProfile = await riskAssessmentService.createRiskProfile(
        covenantData,
        { framework: 'basel_iii' }
      );

      expect(riskProfile).toBeDefined();
      expect(riskProfile.overallRisk).toBeDefined();
      expect(riskProfile.categories).toBeDefined();
      expect(riskProfile.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Presentation and Export Integration', () => {
    it('should create executive presentations', async () => {
      // Create presentation
      const presentation = await executivePresentationService.createPresentation({
        title: 'Financial Analysis Presentation',
        template: 'investment_pitch',
        theme: 'professional',
        author: mockUser
      });

      expect(presentation).toBeDefined();
      expect(presentation.title).toBe('Financial Analysis Presentation');

      // Add slides
      const titleSlide = await executivePresentationService.addSlide(presentation.id, {
        type: 'title',
        title: 'Financial Analysis Results',
        subtitle: 'Q3 2023 Performance Review'
      });

      const dataSlide = await executivePresentationService.addSlide(presentation.id, {
        type: 'chart',
        title: 'Revenue Growth',
        content: {
          chartType: 'line',
          data: mockFinancialData
        }
      });

      expect(titleSlide).toBeDefined();
      expect(dataSlide).toBeDefined();

      // Export presentation
      const exportResult = await executivePresentationService.exportPresentation(
        presentation.id,
        'pptx'
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.format).toBe('pptx');
    });

    it('should handle export and sharing features', async () => {
      const exportData = {
        title: 'Financial Analysis Report',
        executive_summary: 'Strong performance with 25% revenue growth',
        key_metrics: [
          { label: 'Revenue', value: '$1.2M', change: 25 },
          { label: 'Net Income', value: '$200K', change: 15 }
        ],
        financial_highlights: {
          type: 'chart',
          title: 'Revenue Trend',
          data: mockFinancialData
        }
      };

      // Test PDF export
      const pdfExport = await exportSharingService.exportToPDF(exportData, {
        template: 'executive_summary',
        filename: 'financial-analysis.pdf'
      });

      expect(pdfExport.success).toBe(true);
      expect(pdfExport.filename).toBe('financial-analysis.pdf');

      // Test Excel export
      const excelData = {
        'Financial Data': mockFinancialData.periods.map((period, i) => ({
          Period: period,
          Revenue: mockFinancialData.revenue[i],
          Expenses: mockFinancialData.expenses[i],
          'Net Income': mockFinancialData.netIncome[i]
        }))
      };

      const excelExport = await exportSharingService.exportToExcel(excelData, {
        filename: 'financial-data.xlsx'
      });

      expect(excelExport.success).toBe(true);
      expect(excelExport.filename).toBe('financial-data.xlsx');

      // Test shareable links
      const shareLink = await exportSharingService.createShareableLink(exportData, {
        expirationDays: 30,
        allowDownload: true,
        password: null
      });

      expect(shareLink).toBeDefined();
      expect(shareLink.url).toContain('/shared/');
      expect(shareLink.expirationDate).toBeInstanceOf(Date);

      // Test accessing shared link
      const sharedContent = await exportSharingService.accessSharedLink(shareLink.id);
      expect(sharedContent.content).toEqual(exportData);
      expect(sharedContent.permissions.view).toBe(true);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should handle complete analysis workflow', async () => {
      // 1. User joins session
      await userPresenceService.joinSession(mockAnalysisId, mockUser);

      // 2. Create initial version
      const initialVersion = await versionControlService.createVersion(mockAnalysisId, {
        changes: mockFinancialData,
        message: 'Initial financial model setup',
        author: mockUser
      });

      expect(initialVersion).toBeDefined();

      // 3. Add comments on assumptions
      const assumptionComment = await commentingService.addComment(mockAnalysisId, {
        content: 'Revenue growth assumptions are based on market research',
        cellReference: 'B5:B9',
        type: 'assumption',
        author: mockUser
      });

      expect(assumptionComment).toBeDefined();

      // 4. Create dashboard
      const dashboard = await interactiveDashboardService.createDashboard({
        id: mockAnalysisId,
        name: 'Analysis Dashboard',
        layout: 'grid'
      });

      // 5. Add widgets to dashboard
      await interactiveDashboardService.addWidget(dashboard.id, {
        type: 'kpi',
        title: 'Revenue Growth',
        data: { value: '25%', label: 'YoY Growth' }
      });

      // 6. Perform credit analysis
      const creditAnalysis = await creditAnalysisService.calculateDefaultProbability(
        mockFinancialData,
        'altman_z'
      );

      expect(creditAnalysis.score).toBeGreaterThan(0);

      // 7. Create presentation
      const presentation = await executivePresentationService.createPresentation({
        title: 'Analysis Results',
        template: 'detailed_analysis'
      });

      await executivePresentationService.addSlide(presentation.id, {
        type: 'data',
        content: mockFinancialData
      });

      // 8. Export final report
      const exportResult = await exportSharingService.exportToPDF({
        analysis: mockFinancialData,
        dashboard: dashboard,
        creditAnalysis: creditAnalysis,
        comments: [assumptionComment]
      }, {
        template: 'detailed_analysis',
        filename: 'complete-analysis.pdf'
      });

      expect(exportResult.success).toBe(true);

      // 9. Create shareable link
      const shareLink = await exportSharingService.createShareableLink({
        analysisId: mockAnalysisId,
        dashboard: dashboard,
        summary: 'Complete financial analysis with collaboration features'
      });

      expect(shareLink.url).toBeDefined();

      // 10. Send notification
      await notificationService.createNotification({
        userId: mockUser.id,
        type: 'analysis_complete',
        title: 'Analysis Complete',
        message: 'Your financial analysis has been completed and shared'
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle concurrent operations', async () => {
      const promises = [];

      // Simulate concurrent version creations
      for (let i = 0; i < 5; i++) {
        promises.push(
          versionControlService.createVersion(mockAnalysisId, {
            changes: { revenue: mockFinancialData.revenue.map(r => r * (1 + i * 0.1)) },
            message: `Scenario ${i + 1}`,
            author: { ...mockUser, id: `user-${i}` }
          })
        );
      }

      const versions = await Promise.all(promises);
      expect(versions).toHaveLength(5);
      expect(new Set(versions.map(v => v.version)).size).toBe(5); // All versions should be unique
    });

    it('should handle service errors gracefully', async () => {
      // Test invalid data handling
      await expect(
        creditAnalysisService.calculateDefaultProbability({}, 'invalid_model')
      ).rejects.toThrow();

      // Test missing resource handling
      await expect(
        commentingService.getComment('non-existent-id')
      ).rejects.toThrow();

      // Test network failures (mock)
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        exportSharingService.exportToPDF({}, { template: 'test' })
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
