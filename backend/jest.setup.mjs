// Jest setup for ES modules and Prisma mocking

import { jest } from '@jest/globals';

// Create comprehensive Prisma mock with all models
const createMockModel = () => ({
  create: jest.fn().mockResolvedValue({}),
  createMany: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  update: jest.fn().mockResolvedValue({}),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  findFirst: jest.fn().mockResolvedValue(null),
  findMany: jest.fn().mockResolvedValue([]),
  findUnique: jest.fn().mockResolvedValue(null),
  upsert: jest.fn().mockResolvedValue({}),
  count: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue({}),
  groupBy: jest.fn().mockResolvedValue([])
});

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(),
    $disconnect: jest.fn().mockResolvedValue(),
    // Core financial models
    user: createMockModel(),
    dCFScenario: createMockModel(),
    marketData: createMockModel(),
    dcfScenario: createMockModel(),
    // Authentication models
    authToken: createMockModel(),
    // Company and financial data
    company: createMockModel(),
    financialStatement: createMockModel(),
    balanceSheet: createMockModel(),
    incomeStatement: createMockModel(),
    cashFlowStatement: createMockModel(),
    // Volatility and risk models
    volatilityData: createMockModel(),
    riskMetrics: createMockModel(),
    // Portfolio models
    portfolio: createMockModel(),
    portfolioHolding: createMockModel(),
    // Valuation models
    valuation: createMockModel(),
    lboValuation: createMockModel(),
    comparableValuation: createMockModel(),
    // Historical data
    historicalData: createMockModel(),
    // Reporting models
    report: createMockModel(),
    reportSection: createMockModel(),
    // Analytics and insights
    analyticsEvent: createMockModel(),
    userInsight: createMockModel()
  }))
}));

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ALLOW_BIND = 'true'; // Allow binding for health tests

// Mock external API calls
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/health')) {
    return Promise.resolve({
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: { status: 'healthy', timestamp: new Date().toISOString() }
      })
    });
  }
  return Promise.resolve({
    status: 200,
    json: () => Promise.resolve({})
  });
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ExperimentalWarning')) {
      return;
    }
    if (typeof args[0] === 'string' && args[0].includes('API request failed')) {
      return; // Suppress API failure logs in tests
    }
    if (typeof args[0] === 'string' && args[0].includes('Intraday data error')) {
      return; // Suppress expected API errors in tests
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

export default undefined;