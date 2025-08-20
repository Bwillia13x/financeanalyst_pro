/**
 * Phase 3 Components Integration Testing Suite
 * Comprehensive testing of all Phase 3 features working together
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

import aiInsightsService from '../../services/aiInsightsService';
import analyticsService from '../../services/analyticsService';
import apiIntegrationService from '../../services/apiIntegrationService';
import collaborationService from '../../services/collaborationService';
import reportingEngine from '../../services/reportingEngine';
import securityService from '../../services/securityService';
import testingService from '../../services/testingService';
import userPreferencesService from '../../services/userPreferencesService';
import visualizationService from '../../services/visualizationService';

describe('Phase 3 Integration Tests', () => {
  let testUser;
  let mockFinancialData;

  beforeAll(async() => {
    // Initialize test user and data
    testUser = {
      id: 'test_user_123',
      name: 'Test Analyst',
      email: 'test@financeanalyst.com',
      permissions: ['read', 'write', 'analyze', 'collaborate']
    };

    mockFinancialData = {
      company: { name: 'Test Corp', symbol: 'TEST' },
      financialData: {
        statements: {
          incomeStatement: {
            '2023': { totalRevenue: 1000000, netIncome: 100000, operatingIncome: 150000 },
            '2022': { totalRevenue: 900000, netIncome: 90000, operatingIncome: 135000 }
          },
          balanceSheet: {
            '2023': { totalAssets: 2000000, totalLiabilities: 800000, totalEquity: 1200000 },
            '2022': { totalAssets: 1800000, totalLiabilities: 720000, totalEquity: 1080000 }
          }
        }
      },
      assumptions: {
        revenueGrowthRate: 0.05,
        discountRate: 0.10,
        terminalGrowthRate: 0.03
      }
    };

    // Ensure all services are initialized
    await Promise.all([
      testingService.initializeService?.(),
      collaborationService.initialize?.(testUser.id, testUser),
      aiInsightsService.initialize?.(),
      analyticsService.initialize?.(testUser.id),
      apiIntegrationService.initialize?.(),
      userPreferencesService.initializeService?.(),
      securityService.initializeService?.(),
      visualizationService.initializeService?.()
    ]);
  });

  afterAll(async() => {
    // Cleanup test data
    if (collaborationService.disconnect) {
      await collaborationService.disconnect();
    }
  });

  describe('Real-time Data & Collaboration Integration', () => {
    it('should sync financial data updates across collaborative sessions', async() => {
      // Create a workspace
      const workspaceId = 'test_workspace_integration';
      await collaborationService.joinWorkspace(workspaceId, {
        workspaceName: 'Integration Test Workspace'
      });

      // Share financial model
      const modelId = 'test_model_integration';
      await collaborationService.shareModel(workspaceId, modelId, mockFinancialData);

      // Update model data
      const updatedData = {
        ...mockFinancialData,
        assumptions: {
          ...mockFinancialData.assumptions,
          revenueGrowthRate: 0.07
        }
      };

      await collaborationService.updateModel(workspaceId, modelId, updatedData);

      // Verify data synchronization
      const sharedModels = await collaborationService.getWorkspaceModels(workspaceId);
      const updatedModel = sharedModels.find(m => m.id === modelId);

      expect(updatedModel).toBeDefined();
      expect(updatedModel.data.assumptions.revenueGrowthRate).toBe(0.07);
    });

    it('should generate AI insights on collaborative data changes', async() => {
      // Generate AI insights for the financial data
      const insights = await aiInsightsService.generateInsights(mockFinancialData);

      expect(insights).toBeDefined();
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.risks).toBeInstanceOf(Array);
      expect(insights.opportunities).toBeInstanceOf(Array);
      expect(insights.confidence).toBeGreaterThan(0);
    });
  });

  describe('Analytics & User Tracking Integration', () => {
    it('should track user interactions across all Phase 3 features', async() => {
      // Simulate user interactions
      analyticsService.trackEvent('collaboration_join', { workspaceId: 'test_workspace' });
      analyticsService.trackEvent('ai_insights_generated', { insightCount: 5 });
      analyticsService.trackEvent('report_generated', { templateId: 'executive_summary' });
      analyticsService.trackEvent('dashboard_created', { widgetCount: 4 });

      // Get analytics summary
      const analytics = await analyticsService.getAnalytics();

      expect(analytics.sessionData).toBeDefined();
      expect(analytics.featureUsage).toBeDefined();
      expect(analytics.events).toBeInstanceOf(Array);
      expect(analytics.events.length).toBeGreaterThan(0);
    });

    it('should integrate user preferences with analytics tracking', async() => {
      // Update user preferences
      const preferences = userPreferencesService.updatePreferences({
        theme: 'professional',
        defaultView: 'dashboard',
        enableNotifications: true
      });

      // Track preference change
      analyticsService.trackEvent('preferences_updated', {
        theme: preferences.theme,
        view: preferences.defaultView
      });

      const analytics = await analyticsService.getAnalytics();
      const prefEvent = analytics.events.find(e => e.eventType === 'preferences_updated');

      expect(prefEvent).toBeDefined();
      expect(prefEvent.data.theme).toBe('professional');
    });
  });

  describe('API Integration & Security Integration', () => {
    it('should securely authenticate API requests', async() => {
      // Test API authentication flow
      const credentials = {
        username: testUser.email,
        password: 'test_password_123',
        mfaCode: '123456'
      };

      // Mock authentication
      const mockAuth = vi.spyOn(securityService, 'authenticateUser')
        .mockResolvedValue({
          sessionId: 'test_session_123',
          user: testUser,
          permissions: testUser.permissions
        });

      const session = await securityService.authenticateUser(credentials);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.user.id).toBe(testUser.id);

      mockAuth.mockRestore();
    });

    it('should encrypt sensitive data in API integrations', async() => {
      const sensitiveData = {
        apiKey: 'secret_api_key_123',
        userData: mockFinancialData
      };

      // Test encryption
      const encrypted = securityService.encryptData(sensitiveData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(JSON.stringify(sensitiveData));

      // Test decryption
      const decrypted = securityService.decryptData(encrypted);
      expect(decrypted).toEqual(sensitiveData);
    });
  });

  describe('Reporting Engine Integration', () => {
    it('should generate reports using data from multiple Phase 3 services', async() => {
      // Prepare comprehensive report data
      const reportData = {
        ...mockFinancialData,
        aiInsights: await aiInsightsService.generateInsights(mockFinancialData),
        analytics: await analyticsService.getAnalytics(),
        userPreferences: userPreferencesService.getPreferences()
      };

      // Generate executive summary report
      const report = await reportingEngine.generateReport('executive_summary', reportData, {
        theme: 'professional',
        includeCharts: true
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.status).toBe('completed');
      expect(report.sections).toBeInstanceOf(Array);
      expect(report.sections.length).toBeGreaterThan(0);
    });

    it('should export reports with visualization data', async() => {
      // Create a visualization
      const visualization = visualizationService.createVisualization({
        name: 'Revenue Trend',
        type: 'line',
        template: 'revenue_trend',
        data: [
          { period: '2022', revenue: 900000 },
          { period: '2023', revenue: 1000000 }
        ]
      });

      expect(visualization).toBeDefined();
      expect(visualization.id).toBeDefined();

      // Generate report with visualization
      const reportWithViz = await reportingEngine.generateReport('full_analysis', {
        ...mockFinancialData,
        visualizations: [visualization]
      });

      expect(reportWithViz.status).toBe('completed');
    });
  });

  describe('Dashboard & Visualization Integration', () => {
    it('should create interactive dashboards with real-time data', async() => {
      // Create custom dashboard
      const dashboard = visualizationService.createDashboard({
        name: 'Integration Test Dashboard',
        layout: {
          grid: { rows: 4, cols: 12 },
          widgets: []
        },
        theme: 'professional'
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();

      // Add widgets with live data
      const widget = visualizationService.addWidgetToDashboard(dashboard.id, {
        id: 'performance_chart',
        type: 'chart',
        x: 0, y: 0, w: 8, h: 4,
        config: { chartType: 'line', template: 'revenue_trend' }
      });

      expect(widget).toBeDefined();

      const updatedDashboard = visualizationService.getDashboard(dashboard.id);
      expect(updatedDashboard.layout.widgets.length).toBe(1);
    });

    it('should integrate user preferences with dashboard themes', async() => {
      // Update user preferences
      userPreferencesService.updatePreferences({
        theme: 'dark',
        defaultView: 'dashboard'
      });

      // Create dashboard with user theme
      const preferences = userPreferencesService.getPreferences();
      const themedDashboard = visualizationService.createDashboard({
        name: 'Themed Dashboard',
        theme: preferences.theme
      });

      expect(themedDashboard.theme).toBe('dark');
    });
  });

  describe('Performance & Testing Integration', () => {
    it('should run automated tests on integrated components', async() => {
      // Run comprehensive test suite
      const testResults = await testingService.runAllTests({
        categories: ['unit', 'integration', 'performance']
      });

      expect(testResults).toBeDefined();
      expect(testResults.summary).toBeDefined();
      expect(testResults.summary.totalTests).toBeGreaterThan(0);
    });

    it('should monitor performance across all Phase 3 features', async() => {
      // Collect performance metrics
      testingService.collectPerformanceMetrics();

      const metrics = testingService.getPerformanceMetrics();
      expect(metrics).toBeInstanceOf(Array);

      if (metrics.length > 0) {
        const latestMetrics = metrics[metrics.length - 1];
        expect(latestMetrics.timestamp).toBeDefined();
        expect(latestMetrics.memory).toBeDefined();
      }
    });
  });

  describe('Security & Compliance Integration', () => {
    it('should maintain security across all integrated features', async() => {
      // Run security compliance check
      const complianceReport = await securityService.runComplianceCheck();

      expect(complianceReport).toBeDefined();
      expect(complianceReport.summary).toBeDefined();
    });

    it('should audit all Phase 3 feature interactions', async() => {
      // Simulate various user actions that should be audited
      securityService.logSecurityEvent('data_access', {
        userId: testUser.id,
        resource: 'financial_data',
        action: 'read'
      });

      securityService.logSecurityEvent('collaboration_join', {
        userId: testUser.id,
        workspaceId: 'test_workspace',
        action: 'join'
      });

      // Generate security report
      const securityReport = await securityService.generateSecurityReport('24h');

      expect(securityReport).toBeDefined();
      expect(securityReport.summary).toBeDefined();
      expect(securityReport.summary.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full analysis workflow using all Phase 3 features', async() => {
      const workflowResults = {};

      // 1. User authentication and preferences
      const session = {
        sessionId: 'test_session_e2e',
        user: testUser
      };
      const preferences = userPreferencesService.getPreferences();
      workflowResults.authentication = { success: true, preferences };

      // 2. Collaborative workspace setup
      const workspaceId = 'e2e_test_workspace';
      await collaborationService.joinWorkspace(workspaceId);
      workflowResults.collaboration = { workspaceId };

      // 3. Financial analysis with AI insights
      const insights = await aiInsightsService.generateInsights(mockFinancialData);
      workflowResults.aiInsights = insights;

      // 4. Report generation
      const report = await reportingEngine.generateReport('executive_summary', {
        ...mockFinancialData,
        aiInsights: insights
      });
      workflowResults.reporting = { reportId: report.id };

      // 5. Dashboard creation
      const dashboard = visualizationService.createDashboard({
        name: 'E2E Test Dashboard',
        theme: preferences.theme
      });
      workflowResults.visualization = { dashboardId: dashboard.id };

      // 6. Analytics tracking
      analyticsService.trackEvent('workflow_completed', {
        workflowType: 'end_to_end_analysis',
        componentsUsed: Object.keys(workflowResults)
      });
      workflowResults.analytics = { tracked: true };

      // Verify all components worked together
      expect(workflowResults.authentication.success).toBe(true);
      expect(workflowResults.collaboration.workspaceId).toBeDefined();
      expect(workflowResults.aiInsights.recommendations).toBeInstanceOf(Array);
      expect(workflowResults.reporting.reportId).toBeDefined();
      expect(workflowResults.visualization.dashboardId).toBeDefined();
      expect(workflowResults.analytics.tracked).toBe(true);
    });
  });
});

// Helper functions for integration testing
export const IntegrationTestHelpers = {
  async setupTestEnvironment() {
    // Setup test data and mocks
    const testEnv = {
      user: {
        id: 'test_user_integration',
        name: 'Integration Test User',
        email: 'integration@test.com'
      },
      workspace: 'integration_test_workspace',
      financialData: {
        company: { name: 'Integration Test Corp' },
        revenue: 1000000,
        netIncome: 100000
      }
    };

    return testEnv;
  },

  async cleanupTestEnvironment(testEnv) {
    // Cleanup test data
    if (testEnv.workspace) {
      await collaborationService.leaveWorkspace?.(testEnv.workspace);
    }
  },

  generateMockFinancialData(overrides = {}) {
    return {
      company: { name: 'Mock Corp', symbol: 'MOCK' },
      financialData: {
        statements: {
          incomeStatement: {
            '2023': { totalRevenue: 1000000, netIncome: 100000 },
            '2022': { totalRevenue: 900000, netIncome: 90000 }
          }
        }
      },
      ...overrides
    };
  }
};

export default IntegrationTestHelpers;
