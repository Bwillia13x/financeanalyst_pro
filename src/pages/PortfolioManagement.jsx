import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

import SEOHead from '../components/SEO/SEOHead';
import secureApiClient from '../services/secureApiClient';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';
import PortfolioBuilder from '../components/PortfolioBuilder/PortfolioBuilder';
import PortfolioAnalytics from '../components/PortfolioAnalytics/PortfolioAnalytics';

const PortfolioManagement = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [portfolioPerformance, setPortfolioPerformance] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState({
    portfolios: false,
    performance: false,
    risk: false,
    market: false
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [viewMode, setViewMode] = useState('overview'); // overview, builder, analytics

  // Initialize with sample portfolio if none exist
  useEffect(() => {
    const samplePortfolio = {
      id: 'sample-portfolio',
      name: 'Growth Portfolio',
      description: 'Technology-focused growth portfolio',
      totalValue: 100000,
      cash: 5000,
      holdings: [
        { symbol: 'AAPL', name: 'Apple Inc.', shares: 100, currentPrice: 175.50, allocation: 35.0, value: 17550, costBasis: 160.00 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', shares: 80, currentPrice: 335.20, allocation: 30.0, value: 26816, costBasis: 300.00 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 50, currentPrice: 128.45, allocation: 15.0, value: 6422.50, costBasis: 120.00 },
        { symbol: 'TSLA', name: 'Tesla Inc.', shares: 30, currentPrice: 245.80, allocation: 10.0, value: 7374, costBasis: 200.00 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 25, currentPrice: 425.30, allocation: 10.0, value: 10632.50, costBasis: 400.00 }
      ]
    };
    
    setPortfolios([samplePortfolio]);
    setActivePortfolio(samplePortfolio);
  }, []);

  // Fetch real-time market data for portfolio holdings
  const fetchMarketData = useCallback(async () => {
    if (!activePortfolio || loading.market) return;
    
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const symbols = activePortfolio.holdings.map(h => h.symbol);
      const marketPromises = symbols.map(symbol => 
        secureApiClient.getQuote(symbol).catch(error => {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
          return null;
        })
      );
      
      const results = await Promise.all(marketPromises);
      const marketDataMap = {};
      
      results.forEach((data, index) => {
        if (data) {
          marketDataMap[symbols[index]] = data;
        }
      });
      
      setMarketData(marketDataMap);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  }, [activePortfolio, loading.market]);

  // Calculate portfolio performance metrics
  const portfolioMetrics = useMemo(() => {
    if (!activePortfolio || !marketData) return null;

    let totalValue = activePortfolio.cash || 0;
    let totalCostBasis = 0;
    let dailyChange = 0;
    let dividendYield = 0;

    const updatedHoldings = activePortfolio.holdings.map(holding => {
      const marketQuote = marketData[holding.symbol];
      const currentPrice = marketQuote?.currentPrice || holding.currentPrice;
      const previousClose = marketQuote?.previousClose || holding.currentPrice;
      const change = marketQuote?.change || 0;
      
      const currentValue = holding.shares * currentPrice;
      const costBasisValue = holding.shares * holding.costBasis;
      const holdingDailyChange = holding.shares * change;
      
      totalValue += currentValue;
      totalCostBasis += costBasisValue;
      dailyChange += holdingDailyChange;
      dividendYield += (marketQuote?.dividendYield || 0) * (currentValue / 100000); // Weighted by portfolio allocation
      
      return {
        ...holding,
        currentPrice,
        previousClose,
        change,
        value: currentValue,
        costBasisValue,
        gainLoss: currentValue - costBasisValue,
        gainLossPercent: ((currentValue - costBasisValue) / costBasisValue) * 100,
        allocation: (currentValue / totalValue) * 100,
        dayChange: holdingDailyChange
      };
    });

    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent = (totalGainLoss / totalCostBasis) * 100;
    const dailyChangePercent = (dailyChange / (totalValue - dailyChange)) * 100;

    return {
      totalValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercent,
      dailyChange,
      dailyChangePercent,
      dividendYield,
      holdings: updatedHoldings,
      cashAllocation: ((activePortfolio.cash || 0) / totalValue) * 100
    };
  }, [activePortfolio, marketData]);

  // Fetch market data when active portfolio changes
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Auto-refresh market data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const timeframeOptions = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: 'YTD', label: 'YTD' }
  ];

  if (!activePortfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Portfolio Selected</h3>
          <p className="text-gray-600 mb-4">Create or select a portfolio to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Portfolio Management | FinanceAnalyst Pro"
        description="Professional portfolio management tools with real-time tracking, risk analysis, and performance analytics"
        keywords="portfolio management, investment tracking, risk analysis, asset allocation"
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <PieChart className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portfolio Management</h1>
                <p className="text-sm text-gray-500">Real-time portfolio tracking & analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'overview', label: 'Overview', icon: Eye },
                  { value: 'builder', label: 'Builder', icon: Target },
                  { value: 'analytics', label: 'Analytics', icon: BarChart3 }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setViewMode(value)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Portfolio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'overview' && (
          <PortfolioOverview
            portfolio={activePortfolio}
            metrics={portfolioMetrics}
            marketData={marketData}
            loading={loading}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            timeframeOptions={timeframeOptions}
          />
        )}
        
        {viewMode === 'builder' && (
          <PortfolioBuilder
            portfolio={activePortfolio}
            onPortfolioUpdate={setActivePortfolio}
            marketData={marketData}
          />
        )}
        
        {viewMode === 'analytics' && (
          <PortfolioAnalytics
            portfolio={activePortfolio}
            metrics={portfolioMetrics}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            timeframeOptions={timeframeOptions}
          />
        )}
      </div>
    </div>
  );
};

// Portfolio Overview Component
const PortfolioOverview = ({ 
  portfolio, 
  metrics, 
  marketData, 
  loading, 
  selectedTimeframe, 
  onTimeframeChange, 
  timeframeOptions 
}) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
              <p className={`text-2xl font-bold ${metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.totalGainLoss)}
              </p>
              <p className={`text-sm ${metrics.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(metrics.totalGainLossPercent)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${metrics.totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {metrics.totalGainLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Day Change</p>
              <p className={`text-2xl font-bold ${metrics.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.dailyChange)}
              </p>
              <p className={`text-sm ${metrics.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(metrics.dailyChangePercent)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${metrics.dailyChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {metrics.dailyChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dividend Yield</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(metrics.dividendYield)}
              </p>
              <p className="text-sm text-gray-500">Weighted Average</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Timeframe:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => onTimeframeChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeframeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {loading.market && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol / Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.holdings.map((holding) => (
                <tr key={holding.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                      <div className="text-sm text-gray-500">{holding.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatNumber(holding.shares)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(holding.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatPercentage(holding.allocation)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(holding.dayChange)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div>{formatCurrency(holding.gainLoss)}</div>
                    <div className="text-xs">({formatPercentage(holding.gainLossPercent)})</div>
                  </td>
                </tr>
              ))}
              
              {/* Cash Row */}
              {portfolio.cash > 0 && (
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">CASH</div>
                      <div className="text-sm text-gray-500">Cash & Cash Equivalents</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(portfolio.cash)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatPercentage(metrics.cashAllocation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default PortfolioManagement;
