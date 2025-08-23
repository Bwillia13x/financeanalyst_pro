// Financial Data Types for FinanceAnalyst Pro
export interface FinancialStatement {
  fiscalYear: number;
  period: 'FY' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
  currency: string;
}

export interface IncomeStatement extends FinancialStatement {
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  pretaxIncome: number;
  taxExpense: number;
  netIncome: number;
  eps: number;
  dilutedEPS: number;
  sharesOutstanding: number;
  dilutedSharesOutstanding: number;
}

export interface BalanceSheet extends FinancialStatement {
  totalAssets: number;
  currentAssets: number;
  cash: number;
  shortTermInvestments: number;
  receivables: number;
  inventory: number;
  prepaidExpenses: number;
  longTermAssets: number;
  ppe: number;
  intangibleAssets: number;
  goodwill: number;
  totalLiabilities: number;
  currentLiabilities: number;
  accountsPayable: number;
  shortTermDebt: number;
  accruedLiabilities: number;
  longTermLiabilities: number;
  longTermDebt: number;
  deferredTaxLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
  additionalPaidInCapital: number;
  commonStock: number;
}

export interface CashFlowStatement extends FinancialStatement {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
  capitalExpenditures: number;
  depreciation: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  netCashChange: number;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  averageVolume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  peRatio: number;
  pegRatio: number;
  priceToBook: number;
  priceToSales: number;
  dividendYield: number;
  beta: number;
  timestamp: string;
}

export interface DCFAssumptions {
  revenueGrowthRates: number[];
  operatingMargin: number;
  taxRate: number;
  capexAsPercentOfRevenue: number;
  workingCapitalChange: number;
  discountRate: number;
  terminalGrowthRate: number;
  yearsToProject: number;
}

export interface DCFProjection {
  year: number;
  revenue: number;
  operatingIncome: number;
  nopat: number;
  capex: number;
  workingCapitalChange: number;
  freeCashFlow: number;
  presentValue: number;
  discountFactor: number;
}

export interface DCFResult {
  modelId: string;
  symbol: string;
  enterpriseValue: number;
  equityValue: number;
  pricePerShare: number;
  currentPrice: number;
  upside: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  projections: DCFProjection[];
  assumptions: DCFAssumptions;
  sensitivityAnalysis?: SensitivityAnalysis;
  createdAt: string;
  lastUpdated: string;
}

export interface SensitivityAnalysis {
  discountRateRange: [number, number];
  terminalGrowthRange: [number, number];
  steps: number;
  npvMatrix: number[][];
  labels: {
    discountRates: number[];
    terminalGrowthRates: number[];
  };
}

export interface LBOAssumptions {
  purchasePrice: number;
  debtToEquityRatio: number;
  interestRate: number;
  exitMultiple: number;
  holdingPeriod: number;
  managementRollover: number;
  dividendRecap: number;
  synergies: number;
}

export interface LBOResult {
  modelId: string;
  symbol: string;
  irr: number;
  moic: number;
  equityContribution: number;
  debtAmount: number;
  exitValue: number;
  exitEquityValue: number;
  assumptions: LBOAssumptions;
  yearlyCashFlows: number[];
  debtSchedule: DebtSchedule[];
  createdAt: string;
}

export interface DebtSchedule {
  year: number;
  beginningBalance: number;
  interestPayment: number;
  principalPayment: number;
  endingBalance: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastUpdated: string;
  totalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  holdings: PortfolioHolding[];
  cash: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentStrategy: 'value' | 'growth' | 'balanced' | 'income';
}

export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalReturn: number;
  weight: number;
  targetWeight?: number;
  sector: string;
  industry: string;
  dividendYield?: number;
}

export interface MonteCarloResult {
  iterations: number;
  scenarios: MonteCarloScenario[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      p5: number;
      p10: number;
      p25: number;
      p75: number;
      p90: number;
      p95: number;
    };
  };
  valueAtRisk: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
  };
}

export interface MonteCarloScenario {
  scenarioId: number;
  finalValue: number;
  pathValues: number[];
  assumptions: {
    [key: string]: number;
  };
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  informationRatio: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  calmarRatio: number;
  trackingError: number;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  currency: string;
  marketCap: number;
  employeeCount: number;
  foundedYear: number;
  headquarters: string;
  website: string;
  ceo: string;
  fiscalYearEnd: string;
}

export interface PeerComparison {
  symbol: string;
  peers: string[];
  metrics: {
    [symbol: string]: {
      peRatio: number;
      pegRatio: number;
      priceToBook: number;
      priceToSales: number;
      evToEbitda: number;
      returnOnEquity: number;
      returnOnAssets: number;
      debtToEquity: number;
      currentRatio: number;
      grossMargin: number;
      operatingMargin: number;
      netMargin: number;
    };
  };
  rankings: {
    [metric: string]: {
      symbol: string;
      value: number;
      rank: number;
    }[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'premium' | 'enterprise' | 'admin';
  preferences: UserPreferences;
  subscription: Subscription;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserPreferences {
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  marketAlerts: boolean;
  portfolioAlerts: boolean;
  modelUpdates: boolean;
  priceTargets: boolean;
}

export interface DashboardPreferences {
  defaultView: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface DashboardWidget {
  id: string;
  type: 'portfolio' | 'watchlist' | 'market' | 'news' | 'models';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxPortfolios: number;
  maxModels: number;
  maxWatchlistSymbols: number;
  apiCallsPerMonth: number;
  historicalDataYears: number;
  realTimeData: boolean;
  advancedAnalytics: boolean;
  collaboration: boolean;
}

// Collaboration Types
export interface CollaborationSession {
  sessionId: string;
  modelId: string;
  users: CollaborationUser[];
  isActive: boolean;
  startedAt: string;
  lastActivity: string;
}

export interface CollaborationUser {
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer';
  isActive: boolean;
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
  lastSeen: string;
}

export interface CollaborationMessage {
  type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor' | 'sync';
  userId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Utility Types
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface SearchConfig {
  query: string;
  fields: string[];
  fuzzy?: boolean;
}

// Error Types
export interface FinanceError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}
