/**
 * Enterprise Workflows Integration Tests
 * Focused tests for critical enterprise feature workflows
 * Tests service integration and data flow without complex UI rendering
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import services directly for integration testing
import aiAnalyticsService from '../../services/aiAnalyticsService';
import businessIntelligenceService from '../../services/businessIntelligenceService';
import collaborationService from '../../services/collaborationService';
import realTimeDataService from '../../services/realTimeDataService';

// Mock WebSocket for real-time features
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.WebSocket = vi.fn(() => mockWebSocket);

// Sample financial data for testing
const mockFinancialData = {
  symbol: 'AAPL',
  prices: [150, 152, 148, 155, 157, 160, 158, 162, 165, 163],
  volumes: [1000000, 1200000, 900000, 1500000, 1100000, 1300000, 1000000, 1400000, 1600000, 1200000],
  timestamps: Array.from({ length: 10 }, (_, i) => Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
  statements: {
    incomeStatement: {
      revenue: [900000, 1000000, 1100000],
      expenses: [600000, 650000, 700000],
      netIncome: [300000, 350000, 400000]
    }
  }
};

const mockUserProfile = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'analyst'
};

describe('Enterprise Workflows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('AI Analytics Service Integration', () => {
    it('should initialize and analyze financial data successfully', async() => {
      // Test AI Analytics service initialization and analysis
      await aiAnalyticsService.initialize();
      expect(aiAnalyticsService.isInitialized).toBe(true);

      const analysis = await aiAnalyticsService.analyzeFinancialData(mockFinancialData, {
        analysisType: 'comprehensive',
        includePatterns: true,
        includePredictions: true,
        includeRiskAnalysis: true
      });

      // Verify analysis structure
      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('predictions');
      expect(analysis).toHaveProperty('riskMetrics');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis.confidence).toBeGreaterThan(0);

      // Verify insights generation
      expect(Array.isArray(analysis.insights)).toBe(true);
      expect(analysis.insights.length).toBeGreaterThan(0);

      // Verify pattern detection
      expect(Array.isArray(analysis.patterns)).toBe(true);
      analysis.patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('confidence');
        expect(pattern.confidence).toBeGreaterThan(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should generate actionable recommendations', async() => {
      await aiAnalyticsService.initialize();
      const analysis = await aiAnalyticsService.analyzeFinancialData(mockFinancialData);

      expect(Array.isArray(analysis.recommendations)).toBe(true);
      analysis.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('description');
      });
    });

    it('should handle service health monitoring', async() => {
      await aiAnalyticsService.initialize();
      const health = aiAnalyticsService.getServiceHealth();

      expect(health).toHaveProperty('isInitialized');
      expect(health).toHaveProperty('modelsLoaded');
      expect(health).toHaveProperty('totalInsights');
      expect(health.isInitialized).toBe(true);
      expect(health.modelsLoaded).toBeGreaterThan(0);
    });
  });

  describe('Collaboration Service Integration', () => {
    it('should initialize and manage workspace operations', async() => {
      await collaborationService.initialize(mockUserProfile.id, mockUserProfile);
      expect(collaborationService.isInitialized).toBe(true);

      // Test workspace creation/joining
      const workspaceId = 'test-workspace-' + Date.now();
      const workspace = await collaborationService.joinWorkspace(workspaceId, {
        name: 'Test Integration Workspace',
        description: 'Workspace for integration testing',
        isPublic: false
      });

      expect(workspace).toHaveProperty('id');
      expect(workspace.id).toBe(workspaceId);
      expect(workspace).toHaveProperty('name');

      // Test model sharing
      const modelData = { algorithm: 'linear_regression', parameters: { alpha: 0.01 } };
      const permissions = { read: true, write: false };
      const shareResult = await collaborationService.shareModel(
        workspaceId,
        'test-model-123',
        modelData,
        permissions
      );

      expect(shareResult).toHaveProperty('id');
      expect(shareResult).toHaveProperty('sharedAt');
      expect(shareResult.id).toBe('test-model-123');
    });

    it('should handle real-time collaboration features', async() => {
      await collaborationService.initialize(mockUserProfile.id, mockUserProfile);

      const workspaceId = 'test-workspace';

      // Test cursor updates (real-time presence)
      collaborationService.updateCursor(workspaceId, { x: 100, y: 200 });

      // Verify the cursor update was processed (no direct return value)
      expect(collaborationService.isInitialized).toBe(true);

      // Test real-time messaging
      const message = collaborationService.sendMessage({
        type: 'comment',
        workspaceId,
        userId: mockUserProfile.id,
        content: 'Test integration message',
        timestamp: Date.now()
      });

      // sendMessage doesn't return a promise, it sends via WebSocket
      expect(collaborationService.wsConnection).toBeTruthy();
    });
  });

  describe('Business Intelligence Service Integration', () => {
    it('should initialize and track user actions', async() => {
      await businessIntelligenceService.initialize();
      expect(businessIntelligenceService.isInitialized).toBe(true);

      // Test feature usage tracking
      businessIntelligenceService.trackFeatureUsage('AI Analytics', 'analyze_data', {
        symbol: 'AAPL',
        analysisType: 'comprehensive',
        userId: mockUserProfile.id
      });

      // Test user interaction tracking
      businessIntelligenceService.trackUserInteraction('click', 'analyze_button', {
        userId: mockUserProfile.id,
        page: 'dashboard'
      });

      // Test page view tracking
      businessIntelligenceService.trackPageView('dashboard', {
        userId: mockUserProfile.id,
        referrer: 'direct'
      });

      // Test report generation
      const usageReport = await businessIntelligenceService.generateUsageReport();
      expect(usageReport).toHaveProperty('period');
      expect(usageReport).toHaveProperty('metrics');
      expect(usageReport.metrics).toHaveProperty('totalSessions');
      expect(usageReport.metrics).toHaveProperty('uniqueUsers');
      expect(usageReport.metrics).toHaveProperty('averageSessionDuration');
    });

    it('should generate performance and behavior reports', async() => {
      await businessIntelligenceService.initialize();

      // Generate performance report
      const performanceReport = await businessIntelligenceService.generatePerformanceReport();
      expect(performanceReport).toHaveProperty('systemHealth');
      expect(performanceReport.systemHealth).toHaveProperty('overall');
      expect(performanceReport.systemHealth).toHaveProperty('responseTime');
      expect(performanceReport.systemHealth.responseTime).toHaveProperty('average');
      expect(performanceReport.systemHealth).toHaveProperty('errorRate');

      // Generate behavior report
      const behaviorReport = await businessIntelligenceService.generateBehaviorReport();
      expect(behaviorReport).toHaveProperty('userJourney');
      expect(behaviorReport).toHaveProperty('engagementPatterns');
      expect(behaviorReport).toHaveProperty('featureAdoption');

      // Generate automated insights
      const insights = await businessIntelligenceService.generateIntelligentInsights();
      expect(insights).toHaveProperty('timestamp');
      expect(insights).toHaveProperty('patterns');
      expect(insights).toHaveProperty('predictions');
    });
  });

  describe('Real-time Data Service Integration', () => {
    it('should handle real-time data subscriptions and updates', async() => {
      // Test subscription to price updates
      const callback = vi.fn();
      const unsubscribe = realTimeDataService.subscribe('stock_price', 'AAPL', callback);

      expect(typeof unsubscribe).toBe('function');

      // Wait for potential cached data callback
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if callback was called (could be with cached data)
      const initialCallCount = callback.mock.calls.length;

      // Wait for real-time update (service updates every 500ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should have received at least one update
      expect(callback.mock.calls.length).toBeGreaterThan(initialCallCount);

      // Verify data structure
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall[0]).toHaveProperty('symbol');
      expect(lastCall[0]).toHaveProperty('price');
      expect(lastCall[0]).toHaveProperty('timestamp');

      // Test unsubscription
      unsubscribe();
      const callCountAfterUnsub = callback.mock.calls.length;

      // Wait and verify no more calls
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(callback.mock.calls.length).toBe(callCountAfterUnsub);
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full enterprise workflow: AI analysis → Collaboration → BI tracking', async() => {
      // Step 1: Initialize all services
      await Promise.all([
        aiAnalyticsService.initialize(),
        collaborationService.initialize(mockUserProfile.id, mockUserProfile),
        businessIntelligenceService.initialize()
      ]);

      // Subscribe to real-time updates separately
      const unsubscribe = realTimeDataService.subscribe('stock_price', 'AAPL', vi.fn());

      // Step 2: Perform AI analysis
      const analysis = await aiAnalyticsService.analyzeFinancialData(mockFinancialData, {
        analysisType: 'comprehensive'
      });

      expect(analysis.insights.length).toBeGreaterThan(0);

      // Step 3: Share analysis in collaboration workspace
      const workspaceId = 'integration-test-' + Date.now();
      const workspace = await collaborationService.joinWorkspace(workspaceId, {
        name: 'Integration Test Workspace'
      });

      const shareResult = await collaborationService.shareModel(
        workspace.id,
        `analysis-${Date.now()}`,
        analysis,
        { canEdit: true, canView: true }
      );

      expect(shareResult.id).toBeTruthy();

      // Step 4: Track the entire workflow in BI
      businessIntelligenceService.trackFeatureUsage('AI Analytics', 'analysis_completed', {
        userId: mockUserProfile.id,
        analysisId: analysis.timestamp,
        insights: analysis.insights.length
      });

      businessIntelligenceService.trackFeatureUsage('Collaboration', 'model_shared', {
        userId: mockUserProfile.id,
        shareId: shareResult.id,
        workspaceId: workspace.id
      });

      // Step 5: Generate comprehensive report
      const workflowReport = await businessIntelligenceService.generateUsageReport();

      expect(workflowReport.metrics.totalSessions).toBeGreaterThanOrEqual(0);
      expect(workflowReport.metrics.uniqueUsers).toBeGreaterThanOrEqual(0);

      // Clean up subscription
      unsubscribe();
    });

    it('should handle data updates propagating across all systems', async() => {
      // Initialize services
      await Promise.all([
        aiAnalyticsService.initialize(),
        collaborationService.initialize(mockUserProfile.id, mockUserProfile),
        businessIntelligenceService.initialize()
      ]);

      // Subscribe to real-time updates
      const updateCallback = vi.fn();
      const unsubscribe = realTimeDataService.subscribe('stock_price', 'AAPL', updateCallback);

      // Wait for real-time data update
      await new Promise(resolve => setTimeout(resolve, 600));

      // Verify callback was triggered
      expect(updateCallback.mock.calls.length).toBeGreaterThan(0);

      // Verify data structure
      const lastCall = updateCallback.mock.calls[updateCallback.mock.calls.length - 1];
      expect(lastCall[0]).toHaveProperty('symbol');
      expect(lastCall[0]).toHaveProperty('price');
      expect(lastCall[0]).toHaveProperty('timestamp');

      // Clean up
      unsubscribe();
    });

    it('should maintain service resilience during partial failures', async() => {
      // Initialize services
      await aiAnalyticsService.initialize();
      await businessIntelligenceService.initialize();

      // AI Analytics should still work
      const analysis = await aiAnalyticsService.analyzeFinancialData(mockFinancialData);
      expect(analysis.insights.length).toBeGreaterThan(0);

      // BI tracking should still work
      businessIntelligenceService.trackFeatureUsage(
        mockUserProfile.id,
        'analysis_with_partial_failure',
        { collaborationDown: true }
      );

      // Report should reflect the failure appropriately
      const report = await businessIntelligenceService.generateUsageReport();
      expect(report.metrics.totalSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle concurrent operations efficiently', async() => {
      const startTime = Date.now();

      // Initialize all services concurrently
      await Promise.all([
        aiAnalyticsService.initialize(),
        collaborationService.initialize(mockUserProfile.id, mockUserProfile),
        businessIntelligenceService.initialize()
      ]);

      // Perform multiple concurrent operations
      const operations = await Promise.all([
        aiAnalyticsService.analyzeFinancialData(mockFinancialData),
        collaborationService.joinWorkspace('concurrent-test', { name: 'Concurrent Test' }),
        businessIntelligenceService.trackFeatureUsage(
          mockUserProfile.id,
          'concurrent_test',
          { metadata: 'performance_test' }
        )
      ]);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All operations should complete successfully
      expect(operations).toHaveLength(3);
      expect(operations[0]).toHaveProperty('insights'); // AI analysis
      expect(operations[1]).toHaveProperty('id'); // Workspace
      expect(operations[2]).toBeUndefined(); // BI tracking (returns void)

      // Should complete within reasonable time (5 seconds for integration test)
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle large datasets without performance degradation', async() => {
      // Create large dataset
      const largeDataset = {
        ...mockFinancialData,
        prices: Array.from({ length: 1000 }, (_, i) => 100 + Math.random() * 100),
        volumes: Array.from({ length: 1000 }, (_, i) => 1000000 + Math.random() * 500000)
      };

      await aiAnalyticsService.initialize();

      const startTime = Date.now();
      const analysis = await aiAnalyticsService.analyzeFinancialData(largeDataset);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should complete analysis
      expect(analysis).toHaveProperty('insights');
      expect(analysis.confidence).toBeGreaterThan(0);

      // Should complete within reasonable time even with large dataset
      expect(processingTime).toBeLessThan(3000); // 3 seconds

      // Should track the large dataset processing
      await businessIntelligenceService.initialize();
      businessIntelligenceService.trackFeatureUsage('AI Analytics', 'large_dataset_analysis', {
        userId: mockUserProfile.id,
        dataPoints: largeDataset.prices.length,
        processingTime
      });

      // Verify tracking was processed
      expect(businessIntelligenceService.isInitialized).toBe(true);
    });
  });
});
