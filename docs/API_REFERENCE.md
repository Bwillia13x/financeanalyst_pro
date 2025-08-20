# FinanceAnalyst Pro - API Reference

## 🔌 Service APIs

### Performance Optimizer API

```javascript
import performanceOptimizer from '../services/performanceOptimizer';

// Initialize optimizer
await performanceOptimizer.initializeOptimizer();

// Cache operations
const data = await performanceOptimizer.get('financial_data', 'AAPL_2023', async () => {
  return await fetchFinancialData('AAPL', '2023');
});

await performanceOptimizer.set('financial_data', 'AAPL_2023', financialData, { ttl: 300000 });

// Lazy loading
const Component = await performanceOptimizer.lazyLoad('privateAnalysis', () => import('./PrivateAnalysis'));

// Batch operations
const results = await performanceOptimizer.batchLoad([
  { loader: () => fetchData('A') },
  { loader: () => fetchData('B') }
], { batchSize: 5 });
```

### Collaboration Service API

```javascript
import collaborationService from '../services/collaborationService';

// Initialize collaboration
await collaborationService.initialize(userId, userProfile);

// Workspace management
await collaborationService.joinWorkspace(workspaceId, { workspaceName: 'Analysis Team' });
await collaborationService.leaveWorkspace(workspaceId);

// Model sharing
await collaborationService.shareModel(workspaceId, modelId, modelData, {
  permissions: ['read', 'write', 'comment']
});

// Real-time updates
await collaborationService.updateModel(workspaceId, modelId, updatedData);
const models = await collaborationService.getWorkspaceModels(workspaceId);

// Annotations
await collaborationService.addAnnotation(workspaceId, modelId, {
  position: { row: 5, col: 3 },
  text: 'Review this assumption',
  author: 'analyst@company.com'
});
```

### AI Insights Service API

```javascript
import aiInsightsService from '../services/aiInsightsService';

// Generate insights
const insights = await aiInsightsService.generateInsights(financialData);

// Structure:
const {
  recommendations,  // Array of strategic recommendations
  risks,           // Array of identified risks
  opportunities,   // Array of growth opportunities  
  keyMetrics,      // Important financial ratios
  confidence,      // Confidence score (0-1)
  methodology      // Analysis methodology used
} = insights;

// Generate specific analysis
const peerAnalysis = await aiInsightsService.generatePeerAnalysis(companyData, peerData);
const riskAssessment = await aiInsightsService.assessRisks(financialData, marketData);
```

### Reporting Engine API

```javascript
import reportingEngine from '../services/reportingEngine';

// Generate report
const report = await reportingEngine.generateReport('executive_summary', reportData, {
  theme: 'professional',
  includeCharts: true,
  customSections: ['risk_analysis']
});

// Export report
await reportingEngine.exportReport(report.id, ['pdf', 'pptx', 'xlsx']);

// Available templates
const templates = reportingEngine.getAvailableTemplates();
// Returns: ['executive_summary', 'full_analysis', 'investment_committee', 'portfolio_review', 'due_diligence']
```

### Security Service API

```javascript
import securityService from '../services/securityService';

// Authentication
const session = await securityService.authenticateUser({
  username: 'user@company.com',
  password: 'password',
  mfaCode: '123456'
});

// Data encryption
const encrypted = securityService.encryptData(sensitiveData);
const decrypted = securityService.decryptData(encrypted);

// Security monitoring
const securityStatus = await securityService.getSecurityStatus();
const complianceReport = await securityService.runComplianceCheck();

// Audit logging
securityService.logSecurityEvent('data_access', {
  userId: 'user123',
  resource: 'financial_data',
  action: 'read'
});
```

### Visualization Service API

```javascript
import visualizationService from '../services/visualizationService';

// Dashboard management
const dashboard = visualizationService.createDashboard({
  name: 'Portfolio Dashboard',
  layout: { grid: { rows: 4, cols: 12 } },
  theme: 'professional'
});

// Widget operations
const widget = visualizationService.addWidgetToDashboard(dashboard.id, {
  type: 'chart',
  chartType: 'line',
  data: chartData,
  config: { title: 'Revenue Trend' }
});

// Visualization creation
const chart = visualizationService.createVisualization({
  name: 'Performance Chart',
  type: 'line',
  template: 'revenue_trend',
  data: performanceData
});
```

### Analytics Service API  

```javascript
import analyticsService from '../services/analyticsService';

// Event tracking
analyticsService.trackEvent('model_created', { modelType: 'dcf', userId: 'user123' });
analyticsService.trackEvent('report_generated', { template: 'executive_summary' });

// Analytics retrieval
const analytics = await analyticsService.getAnalytics();
const sessionData = analytics.sessionData;
const featureUsage = analytics.featureUsage;
const performanceMetrics = analytics.performanceMetrics;
```

## 🎣 React Hooks

### usePerformanceOptimizer

```javascript
import { usePerformanceOptimizer } from '../hooks/usePerformanceOptimizer';

const {
  isInitialized,
  metrics,
  getCached,
  setCached,
  lazyLoad,
  batchLoad,
  getCacheStats,
  clearCache
} = usePerformanceOptimizer();
```

### useCachedData

```javascript
import { useCachedData } from '../hooks/usePerformanceOptimizer';

const { data, loading, error } = useCachedData(
  'financial_data',
  'AAPL_2023', 
  () => fetchFinancialData('AAPL', '2023')
);
```

### useCollaboration

```javascript
import { useCollaboration } from '../hooks/useCollaboration';

const {
  isInitialized,
  connectionStatus,
  currentWorkspace,
  workspaceMembers,
  joinWorkspace,
  leaveWorkspace,
  shareModel,
  updateModel,
  addAnnotation
} = useCollaboration(userId, userProfile);
```

## 📊 Data Structures

### Financial Data Format

```javascript
const financialData = {
  company: {
    name: 'Apple Inc.',
    symbol: 'AAPL',
    industry: 'Technology',
    sector: 'Consumer Electronics'
  },
  financialData: {
    statements: {
      incomeStatement: {
        '2023': {
          totalRevenue: 394328000000,
          operatingIncome: 114301000000,
          netIncome: 96995000000
        }
      },
      balanceSheet: {
        '2023': {
          totalAssets: 352755000000,
          totalLiabilities: 290437000000,
          totalEquity: 62318000000
        }
      },
      cashFlowStatement: {
        '2023': {
          operatingCashFlow: 110563000000,
          investingCashFlow: -3705000000,
          financingCashFlow: -108488000000
        }
      }
    }
  },
  assumptions: {
    revenueGrowthRate: 0.05,
    discountRate: 0.10,
    terminalGrowthRate: 0.03
  }
};
```

### Report Configuration

```javascript
const reportConfig = {
  template: 'executive_summary',
  theme: 'professional',
  sections: [
    'cover_page',
    'executive_summary', 
    'financial_overview',
    'valuation_analysis',
    'risk_assessment',
    'appendix'
  ],
  options: {
    includeCharts: true,
    includeTables: true,
    includeAssumptions: true,
    pageNumbers: true,
    watermark: 'CONFIDENTIAL'
  },
  exportFormats: ['pdf', 'pptx', 'xlsx']
};
```

### Dashboard Layout

```javascript
const dashboardLayout = {
  grid: { rows: 6, cols: 12 },
  widgets: [
    {
      id: 'revenue_chart',
      type: 'chart',
      x: 0, y: 0, w: 6, h: 3,
      config: {
        chartType: 'line',
        title: 'Revenue Trend',
        data: revenueData
      }
    },
    {
      id: 'metrics_table',
      type: 'table', 
      x: 6, y: 0, w: 6, h: 3,
      config: {
        title: 'Key Metrics',
        data: metricsData
      }
    }
  ]
};
```

## 🔧 Configuration Options

### Cache Configuration

```javascript
const cacheConfig = {
  maxSize: 100,           // Maximum number of entries
  ttl: 300000,           // Time to live in milliseconds
  strategy: 'lru',       // 'lru', 'lfu', or 'fifo'
  compression: true,      // Enable data compression
  persistent: false       // Persist to localStorage
};
```

### Security Policies

```javascript
const securityPolicies = {
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // days
  },
  session: {
    maxDuration: 480, // minutes
    maxConcurrent: 3,
    requireMFA: true
  },
  dataAccess: {
    encryptionRequired: true,
    auditLogging: true,
    dataRetentionDays: 2555 // 7 years
  }
};
```

## 📈 Performance Metrics

### Web Vitals Monitoring

```javascript
// Core Web Vitals thresholds
const webVitalsThresholds = {
  lcp: 2500,    // Largest Contentful Paint (ms)
  fid: 100,     // First Input Delay (ms)  
  cls: 0.1      // Cumulative Layout Shift
};

// Performance monitoring
const performanceMetrics = {
  loadTime: 1250,        // Page load time
  memoryUsage: 45.2,     // MB
  cacheHitRate: 0.87,    // Cache efficiency
  apiResponseTime: 145   // Average API response time
};
```

## 🚀 Deployment Configuration

### Environment Variables

```bash
# Backend API
REACT_APP_API_BASE_URL=https://api.financeanalyst.com
REACT_APP_WS_URL=wss://ws.financeanalyst.com

# External APIs
REACT_APP_ALPHA_VANTAGE_KEY=your_api_key
REACT_APP_YAHOO_FINANCE_KEY=your_api_key

# Features
REACT_APP_ENABLE_COLLABORATION=true
REACT_APP_ENABLE_AI_INSIGHTS=true
REACT_APP_ENABLE_ANALYTICS=true

# Security
REACT_APP_ENCRYPTION_KEY=your_encryption_key
REACT_APP_MFA_REQUIRED=true
```

### Performance Optimization

```javascript
// Vite configuration for optimal performance
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts', 'd3'],
          collaboration: ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  }
});
```

## 🐛 Error Handling

### Error Types

```javascript
// Standard error response format
const errorResponse = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid financial data format',
    details: {
      field: 'revenue',
      expected: 'number',
      received: 'string'
    },
    timestamp: '2024-01-15T10:30:00Z'
  }
};

// Error codes
const ERROR_CODES = {
  AUTHENTICATION_FAILED: 'AUTH_001',
  INSUFFICIENT_PERMISSIONS: 'AUTH_002',
  VALIDATION_ERROR: 'VAL_001',
  DATA_NOT_FOUND: 'DATA_001',
  CALCULATION_ERROR: 'CALC_001',
  NETWORK_ERROR: 'NET_001'
};
```

## 🧪 Testing Utilities

### Test Helpers

```javascript
import { IntegrationTestHelpers } from '../tests/integration/phase3Integration.test';

// Setup test environment
const testEnv = await IntegrationTestHelpers.setupTestEnvironment();

// Generate mock data
const mockData = IntegrationTestHelpers.generateMockFinancialData({
  company: { name: 'Test Corp' },
  revenue: 1000000
});

// Cleanup after tests
await IntegrationTestHelpers.cleanupTestEnvironment(testEnv);
```

---

*This API reference covers all major services and components. For implementation examples, see the feature guide and component documentation.*
