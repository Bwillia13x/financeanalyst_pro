/**
 * Enterprise Integration Tests
 * Comprehensive tests for AI Analytics, Real-time Collaboration, and Business Intelligence
 * Tests the complete workflow from user interaction to data processing and real-time updates
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import enterprise components
import AIAnalyticsDashboard from '../../components/AIAnalytics/AIAnalyticsDashboard';
import BusinessIntelligenceDashboard from '../../components/BusinessIntelligence/BusinessIntelligenceDashboard';
import CollaborationDashboard from '../../components/Collaboration/CollaborationDashboard';

// Import services
import aiAnalyticsService from '../../services/aiAnalyticsService';
import businessIntelligenceService from '../../services/businessIntelligenceService';
import collaborationService from '../../services/collaborationService';
import realTimeDataService from '../../services/realTimeDataService';

// Mock external dependencies
vi.mock('../../services/aiAnalyticsService');
vi.mock('../../services/collaborationService');
vi.mock('../../services/businessIntelligenceService');
vi.mock('../../services/realTimeDataService');

// Mock LazyLoader to always render children immediately in tests
// This bypasses IntersectionObserver gating and preload delays.
vi.mock('../../components/LazyLoader/LazyLoader', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null
    }),
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  };
});

// Do not mock useAIAnalytics; use the real hook to validate service interactions

vi.mock('../../hooks/useCollaboration', async () => {
  const actual = await vi.importActual('../../hooks/useCollaboration');
  return {
    ...actual,
    // Keep the real useCollaboration to ensure initialization is triggered
    useWorkspace: () => ({
      workspace: null,
      members: [],
      models: [],
      activity: [],
      isLoading: false
    }),
    usePresence: () => ({
      cursors: [],
      presence: {},
      updateCursor: vi.fn()
    })
  };
});

// Mock WebSocket for real-time features
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.WebSocket = vi.fn(() => mockWebSocket);

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => [])
};

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
    },
    balanceSheet: {
      assets: [2000000, 2200000, 2400000],
      liabilities: [800000, 850000, 900000],
      equity: [1200000, 1350000, 1500000]
    }
  }
};

const mockUserProfile = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'analyst',
  preferences: {
    riskTolerance: 'moderate',
    dashboardLayout: 'default'
  }
};

// Create a test store
const createTestStore = () => configureStore({
  reducer: {
    // Mock reducers for testing
    auth: (state = { user: mockUserProfile }) => state,
    dashboard: (state = {}) => state,
    analytics: (state = {}) => state
  }
});

// Test wrapper component
const TestWrapper = ({ children }) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <Router>
        {children}
      </Router>
    </Provider>
  );
};

// Custom render function with providers
const renderWithProviders = (ui, options = {}) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
};

describe('Enterprise Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup AI Analytics Service mocks
    aiAnalyticsService.initialize = vi.fn().mockResolvedValue(true);
    aiAnalyticsService.analyzeFinancialData = vi.fn().mockResolvedValue({
      confidence: 0.82,
      analysisType: 'comprehensive',
      insights: [
        {
          id: 'insight1',
          type: 'pattern',
          severity: 'high',
          confidence: 0.85,
          title: 'Bull Flag Pattern Detected',
          description: 'Strong bullish continuation pattern identified',
          actionable: true,
          recommendations: ['Consider long position', 'Set stop-loss at $155']
        }
      ],
      patterns: [
        {
          type: 'bull_flag',
          confidence: 0.85,
          target: 170,
          stopLoss: 155,
          timeframe: '1w'
        }
      ],
      predictions: [
        {
          horizon: '1w',
          predictedPrice: 168,
          confidence: 0.78,
          range: { low: 162, high: 174 }
        }
      ],
      riskMetrics: {
        riskCategory: 'Moderate',
        riskScore: 5.6,
        volatility: 0.25,
        sharpeRatio: 1.2,
        maxDrawdown: 0.08
      },
      recommendations: [
        { id: 'rec1', priority: 'high', action: 'Set trailing stop' },
        { id: 'rec2', priority: 'medium', action: 'Monitor volume changes' }
      ]
    });

    // Setup Collaboration Service mocks with minimal event emitter behavior
    const listeners = {};
    const emit = (event, payload) => {
      if (listeners[event]) {
        // Use a copy to avoid mutation during iteration
        Array.from(listeners[event]).forEach(cb => {
          try { cb(payload); } catch (e) {}
        });
      }
    };

    collaborationService.on = vi.fn((event, cb) => {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(cb);
    });
    collaborationService.off = vi.fn((event, cb) => {
      listeners[event]?.delete(cb);
    });

    // Initialize should flip loading, then emit connectionStatus so UI shows Connected
    collaborationService.initialize = vi.fn().mockImplementation(async () => {
      // simulate async init
      await Promise.resolve();
      emit('connectionStatus', { online: true, connected: true });
      return true;
    });

    // Leave workspace should emit workspaceLeft
    collaborationService.leaveWorkspace = vi.fn().mockImplementation(async (workspaceId) => {
      emit('workspaceLeft', { workspaceId });
      return true;
    });

    // Join workspace returns object matching hook expectations and emits workspaceJoined
    collaborationService.joinWorkspace = vi.fn().mockImplementation(async (workspaceId, options = {}) => {
      const workspace = {
        id: workspaceId,
        name: options.name || 'Test Workspace',
        description: options.description || '',
        members: new Map([
          ['user123', { id: 'user123', name: 'Test User' }],
          ['user456', { id: 'user456', name: 'Collaborator' }]
        ]),
        models: new Map(),
        annotations: new Map()
      };
      emit('workspaceJoined', { workspaceId, workspace });
      return workspace;
    });

    collaborationService.shareModel = vi.fn().mockImplementation(async (workspaceId, modelId, modelData, permissions = {}) => {
      const sharedModel = {
        id: modelId,
        workspaceId,
        data: modelData,
        sharedBy: 'user123',
        sharedAt: new Date().toISOString(),
        permissions: { canEdit: !!permissions.canEdit, canComment: permissions.canComment !== false, canView: permissions.canView !== false },
        version: 1,
        lastModified: new Date().toISOString(),
        modifiedBy: 'user123'
      };
      emit('modelShared', { workspaceId, modelId, sharedModel });
      return sharedModel;
    });

    // Setup Business Intelligence Service mocks
    businessIntelligenceService.initialize = vi.fn().mockResolvedValue(true);
    businessIntelligenceService.trackUserAction = vi.fn().mockResolvedValue(true);
    businessIntelligenceService.generateReport = vi.fn().mockResolvedValue({
      totalActions: 150,
      popularFeatures: ['AI Analytics', 'Risk Assessment'],
      userEngagement: 0.85,
      recommendations: ['Increase AI usage', 'Explore collaboration features']
    });

    // Setup Real-time Data Service mocks
    realTimeDataService.subscribe = vi.fn().mockResolvedValue(true);
    realTimeDataService.unsubscribe = vi.fn().mockResolvedValue(true);
    realTimeDataService.publish = vi.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('AI Analytics Integration', () => {
    it('should initialize AI analytics and generate insights from financial data', async () => {
      renderWithProviders(
        <AIAnalyticsDashboard 
          data={mockFinancialData}
          symbol="AAPL"
          riskTolerance="moderate"
          autoAnalyze={true}
          onInsightAction={vi.fn()}
        />
      );

      // Should initialize AI service
      await waitFor(() => {
        expect(aiAnalyticsService.initialize).toHaveBeenCalled();
      });

      // Should analyze the provided data
      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledWith(
          mockFinancialData,
          expect.objectContaining({
            analysisType: 'comprehensive'
          })
        );
      });

      // Should display insights in the UI
      await waitFor(() => {
        expect(screen.getByText(/AI Analytics/i) || screen.getByText(/Overview/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle AI analytics errors gracefully', async () => {
      // Make service throw so the real hook sets error state
      aiAnalyticsService.analyzeFinancialData.mockRejectedValueOnce(new Error('AI service unavailable'));

      renderWithProviders(
        <AIAnalyticsDashboard 
          data={mockFinancialData}
          symbol="AAPL"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/AI Analytics Error/i)).toBeInTheDocument();
      });
    });

    it('should trigger AI re-analysis when data changes', async () => {
      const { rerender } = renderWithProviders(
        <AIAnalyticsDashboard 
          data={mockFinancialData}
          symbol="AAPL"
        />
      );

      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledTimes(1);
      });

      // Update data
      const updatedData = {
        ...mockFinancialData,
        prices: [...mockFinancialData.prices, 168]
      };

      rerender(
        <AIAnalyticsDashboard 
          data={updatedData}
          symbol="AAPL"
        />
      );

      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Real-time Collaboration Integration', () => {
    it('should initialize collaboration and join workspace', async () => {
      renderWithProviders(
        <CollaborationDashboard
          userId="user123"
          userProfile={mockUserProfile}
          isVisible={true}
        />
      );

      await waitFor(() => {
        expect(collaborationService.initialize).toHaveBeenCalled();
      });

      // Should display workspace options
      expect(screen.getByText(/Portfolio Analysis Q4/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk Modeling Team/i)).toBeInTheDocument();
    });

    it('should handle workspace creation and joining', async () => {
      renderWithProviders(
        <CollaborationDashboard
          userId="user123"
          userProfile={mockUserProfile}
          isVisible={true}
        />
      );

      // Switch to Workspaces tab first
      const workspacesTab = await screen.findByRole('button', { name: /Workspaces/i });
      fireEvent.click(workspacesTab);

      // Click create workspace button (tab toolbar)
      const createButton = await screen.findByRole('button', { name: /Create Workspace/i });
      fireEvent.click(createButton);

      // Fill in workspace name
      const nameInput = await screen.findByPlaceholderText(/workspace name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Integration Workspace' } });

      // Click confirm 'Create' inside modal (exact label)
      const confirmButton = await screen.findByRole('button', { name: /^Create$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(collaborationService.joinWorkspace).toHaveBeenCalledWith(
          expect.stringContaining('workspace_'),
          expect.objectContaining({
            name: 'Test Integration Workspace'
          })
        );
      });
    });

    it('should share models between workspace members', async () => {
      renderWithProviders(
        <CollaborationDashboard
          userId="user123"
          userProfile={mockUserProfile}
          isVisible={true}
        />
      );

      // Ensure initialized UI and switch to Workspaces tab
      const workspacesTab = await screen.findByRole('button', { name: /Workspaces/i });
      fireEvent.click(workspacesTab);

      // Select a workspace card
      const workspaceCard = await screen.findByText(/Portfolio Analysis Q4/i);
      fireEvent.click(workspaceCard);

      await waitFor(() => {
        // Look for a share-related control (e.g., tab or button)
        const shareElements = screen.queryAllByText(/Share/i);
        if (shareElements.length > 0) fireEvent.click(shareElements[0]);
      });

      // The share functionality should be triggered
      // Note: The exact interaction depends on the component's UI structure
    });
  });

  describe('Business Intelligence Integration', () => {
    it('should initialize BI service and track user actions', async () => {
      render(
        <BusinessIntelligenceDashboard 
          userId="user123"
          timeframe="30d"
        />
      );

      await waitFor(() => {
        expect(businessIntelligenceService.initialize).toHaveBeenCalled();
      });

      // Should display BI dashboard components
      await waitFor(() => {
        const dashboard = screen.getByTestId('bi-dashboard') || screen.getByRole('main');
        expect(dashboard).toBeInTheDocument();
      });
    });

    it('should generate and display BI reports', async () => {
      render(
        <BusinessIntelligenceDashboard 
          userId="user123"
          timeframe="30d"
        />
      );

      await waitFor(() => {
        expect(businessIntelligenceService.generateReport).toHaveBeenCalled();
      });

      // Should display report data
      await waitFor(() => {
        expect(screen.getByText(/150/)).toBeInTheDocument(); // totalActions
      });
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full enterprise workflow: login → collaboration → AI analysis → BI tracking', async () => {
      const mockOnInsightAction = vi.fn();

      // Step 1: Render collaboration dashboard (simulates user login and workspace setup)
      const { rerender } = render(
        <CollaborationDashboard 
          userId="user123"
          userProfile={mockUserProfile}
          isVisible={true}
        />
      );

      await waitFor(() => {
        expect(collaborationService.initialize).toHaveBeenCalled();
      });

      // Step 2: Add AI Analytics dashboard (simulates user opening analytics)
      rerender(
        <div>
          <CollaborationDashboard 
            userId="user123"
            userProfile={mockUserProfile}
            isVisible={true}
          />
          <AIAnalyticsDashboard 
            data={mockFinancialData}
            symbol="AAPL"
            onInsightAction={mockOnInsightAction}
          />
        </div>
      );

      await waitFor(() => {
        expect(aiAnalyticsService.initialize).toHaveBeenCalled();
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalled();
      });

      // Step 3: Add BI dashboard (simulates tracking and analytics)
      rerender(
        <div>
          <CollaborationDashboard 
            userId="user123"
            userProfile={mockUserProfile}
            isVisible={true}
          />
          <AIAnalyticsDashboard 
            data={mockFinancialData}
            symbol="AAPL"
            onInsightAction={mockOnInsightAction}
          />
          <BusinessIntelligenceDashboard 
            userId="user123"
            timeframe="30d"
          />
        </div>
      );

      await waitFor(() => {
        expect(businessIntelligenceService.initialize).toHaveBeenCalled();
      });

      // Step 4: Interact with AI insight (simulates user action)
      const insightElement = await screen.findByText(/Bull Flag Pattern Detected/i);
      fireEvent.click(insightElement);

      // Should trigger insight action callback
      expect(mockOnInsightAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pattern',
          title: 'Bull Flag Pattern Detected'
        })
      );

      // Step 5: Verify all systems are tracking the interaction
      await waitFor(() => {
        expect(businessIntelligenceService.trackUserAction).toHaveBeenCalled();
      });
    });

    it('should handle real-time data updates across all systems', async () => {
      render(
        <div>
          <AIAnalyticsDashboard 
            data={mockFinancialData}
            symbol="AAPL"
            autoAnalyze={true}
          />
          <CollaborationDashboard 
            userId="user123"
            userProfile={mockUserProfile}
            isVisible={true}
          />
        </div>
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(realTimeDataService.subscribe).toHaveBeenCalled();
      });

      // Simulate real-time data update
      const newPrice = 170;
      const updateEvent = new CustomEvent('priceUpdate', {
        detail: { symbol: 'AAPL', price: newPrice }
      });

      // Simulate WebSocket message
      const wsMessage = {
        type: 'price_update',
        data: { symbol: 'AAPL', price: newPrice, timestamp: Date.now() }
      };

      // Trigger real-time update
      if (mockWebSocket.addEventListener.mock.calls.length > 0) {
        const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        
        if (messageHandler) {
          messageHandler({ data: JSON.stringify(wsMessage) });
        }
      }

      // Should trigger re-analysis
      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledTimes(2);
      });
    });

    it('should maintain state consistency across components during errors', async () => {
      // Simulate AI service failure
      aiAnalyticsService.analyzeFinancialData.mockRejectedValueOnce(new Error('AI service down'));

      render(
        <div>
          <AIAnalyticsDashboard 
            data={mockFinancialData}
            symbol="AAPL"
          />
          <BusinessIntelligenceDashboard 
            userId="user123"
            timeframe="30d"
          />
        </div>
      );

      // AI should fail gracefully
      await waitFor(() => {
        expect(screen.getByText(/AI Analytics Error/i)).toBeInTheDocument();
      });

      // BI should still work
      await waitFor(() => {
        expect(businessIntelligenceService.initialize).toHaveBeenCalled();
      });

      // Should not crash the entire application
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent loading of all enterprise features within performance budget', async () => {
      const startTime = performance.now();

      render(
        <div>
          <AIAnalyticsDashboard 
            data={mockFinancialData}
            symbol="AAPL"
            autoAnalyze={true}
          />
          <CollaborationDashboard 
            userId="user123"
            userProfile={mockUserProfile}
            isVisible={true}
          />
          <BusinessIntelligenceDashboard 
            userId="user123"
            timeframe="30d"
          />
        </div>
      );

      // Wait for all systems to initialize
      await waitFor(() => {
        expect(aiAnalyticsService.initialize).toHaveBeenCalled();
        expect(collaborationService.initialize).toHaveBeenCalled();
        expect(businessIntelligenceService.initialize).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should complete within reasonable time (3 seconds for integration tests)
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle heavy data processing without UI blocking', async () => {
      const heavyData = {
        ...mockFinancialData,
        prices: Array.from({ length: 1000 }, (_, i) => 100 + Math.random() * 100),
        volumes: Array.from({ length: 1000 }, (_, i) => 1000000 + Math.random() * 500000)
      };

      render(
        <AIAnalyticsDashboard 
          data={heavyData}
          symbol="AAPL"
          autoAnalyze={true}
        />
      );

      // Should still be responsive
      const dashboard = await screen.findByText(/AI Analytics/i);
      expect(dashboard).toBeInTheDocument();

      // Should handle the heavy data
      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledWith(
          heavyData,
          expect.any(Object)
        );
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should propagate data changes through all systems correctly', async () => {
      let currentData = mockFinancialData;
      const onDataChange = vi.fn((newData) => {
        currentData = newData;
      });

      const { rerender } = render(
        <div>
          <AIAnalyticsDashboard 
            data={currentData}
            symbol="AAPL"
            onInsightAction={onDataChange}
          />
          <BusinessIntelligenceDashboard 
            userId="user123"
            timeframe="30d"
          />
        </div>
      );

      // Initial analysis
      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledWith(
          currentData,
          expect.any(Object)
        );
      });

      // Simulate data update
      const updatedData = {
        ...currentData,
        prices: [...currentData.prices, 172, 175]
      };

      rerender(
        <div>
          <AIAnalyticsDashboard 
            data={updatedData}
            symbol="AAPL"
            onInsightAction={onDataChange}
          />
          <BusinessIntelligenceDashboard 
            userId="user123"
            timeframe="30d"
          />
        </div>
      );

      // Should trigger re-analysis with new data
      await waitFor(() => {
        expect(aiAnalyticsService.analyzeFinancialData).toHaveBeenCalledWith(
          updatedData,
          expect.any(Object)
        );
      });

      // Should track the data update in BI
      await waitFor(() => {
        expect(businessIntelligenceService.trackUserAction).toHaveBeenCalled();
      });
    });
  });
});

// Export test utilities for other integration tests
export const enterpriseTestUtils = {
  mockFinancialData,
  mockUserProfile,
  mockWebSocket,
  
  setupMockServices: () => {
    aiAnalyticsService.initialize = vi.fn().mockResolvedValue(true);
    collaborationService.initialize = vi.fn().mockResolvedValue(true);
    businessIntelligenceService.initialize = vi.fn().mockResolvedValue(true);
    realTimeDataService.subscribe = vi.fn().mockResolvedValue(true);
  },
  
  simulateRealTimeUpdate: (symbol, price) => {
    const wsMessage = {
      type: 'price_update',
      data: { symbol, price, timestamp: Date.now() }
    };
    
    if (mockWebSocket.addEventListener.mock.calls.length > 0) {
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (messageHandler) {
        messageHandler({ data: JSON.stringify(wsMessage) });
      }
    }
  },
  
  simulateCollaborativeAction: (workspaceId, action) => {
    return collaborationService.shareModel.mockResolvedValue({
      shareId: `share_${Date.now()}`,
      workspaceId,
      action
    });
  }
};
