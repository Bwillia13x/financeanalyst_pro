import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Target
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import PortfolioAnalytics from '../components/PortfolioAnalytics/PortfolioAnalytics';
import PortfolioBuilder from '../components/PortfolioBuilder/PortfolioBuilder';
import SEOHead from '../components/SEO/SEOHead';
import SecondaryNav from '../components/ui/SecondaryNav';
import secureApiClient from '../services/secureApiClient';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';

const PortfolioManagement = () => {
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState({
    portfolios: false,
    performance: false,
    risk: false,
    market: false
  });
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

    setActivePortfolio(samplePortfolio);
  }, []);

  // Fetch real-time market data for portfolio holdings
  const fetchMarketData = useCallback(async() => {
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
            onClick={() => {}}
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
              {/* Portfolio Management Navigation */}
              <SecondaryNav
                variant="horizontal"
                items={[
                  { id: 'overview', label: 'Overview', icon: 'Eye' },
                  { id: 'builder', label: 'Builder', icon: 'Target' },
                  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' }
                ]}
                activeItem={viewMode}
                onItemClick={(itemId) => setViewMode(itemId)}
                className="bg-gray-100 rounded-lg"
              />

              <button
                onClick={() => {}}
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
          <PortfolioCard
            portfolio={activePortfolio}
            marketData={marketData}
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
const PortfolioCard = ({ portfolio }) => {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolio.totalValue)}
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
              <p className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolio.totalGainLoss)}
              </p>
              <p className={`text-sm ${portfolio.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(portfolio.totalGainLossPercent)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${portfolio.totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {portfolio.totalGainLoss >= 0 ? (
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
              <p className={`text-2xl font-bold ${portfolio.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolio.dailyChange)}
              </p>
              <p className={`text-sm ${portfolio.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(portfolio.dailyChangePercent)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${portfolio.dailyChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {portfolio.dailyChange >= 0 ? (
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
                {formatPercentage(portfolio.dividendYield)}
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
                <label htmlFor="portfolio-name" className="block text-sm font-medium text-gray-700 mb-1">Timeframe:</label>
                <input
                  id="portfolio-name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter portfolio name"
                />
              </div>
              {/* Loading indicator would appear here */}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full"
            role="table"
            aria-label="Portfolio holdings table"
          >
            <caption className="sr-only">
              Portfolio holdings showing symbols, shares, prices, market values, allocations, and performance data
            </caption>
            <thead className="bg-gray-50">
              <tr role="row">
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol / Name
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day Change
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio.holdings.map(holding => (
                <tr key={holding.symbol} className="hover:bg-gray-50 focus-within:bg-gray-100" role="row">
                  <th scope="row" className="px-6 py-4 whitespace-nowrap font-medium">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                      <div className="text-sm text-gray-500">{holding.name}</div>
                    </div>
                  </th>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Shares: ${formatNumber(holding.shares)}`}
                  >
                    {formatNumber(holding.shares)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Price: ${formatCurrency(holding.currentPrice)}`}
                  >
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Market Value: ${formatCurrency(holding.value)}`}
                  >
                    {formatCurrency(holding.value)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Allocation: ${formatPercentage(holding.allocation)}`}
                  >
                    {formatPercentage(holding.allocation)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    tabIndex="0"
                    aria-label={`Day Change: ${formatCurrency(holding.dayChange)} ${holding.dayChange >= 0 ? 'positive' : 'negative'}`}
                  >
                    {formatCurrency(holding.dayChange)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    tabIndex="0"
                    aria-label={`Total Gain Loss: ${formatCurrency(holding.gainLoss)} ${holding.gainLossPercent >= 0 ? 'positive' : 'negative'} ${formatPercentage(holding.gainLossPercent)} percent`}
                  >
                    <div>{formatCurrency(holding.gainLoss)}</div>
                    <div className="text-xs">({formatPercentage(holding.gainLossPercent)})</div>
                  </td>
                </tr>
              ))}

              {/* Cash Row */}
              {portfolio.cash > 0 && (
                <tr className="hover:bg-gray-50 focus-within:bg-gray-100" role="row">
                  <th scope="row" className="px-6 py-4 whitespace-nowrap font-medium">
                    <div>
                      <div className="text-sm font-medium text-gray-900">CASH</div>
                      <div className="text-sm text-gray-500">Cash & Cash Equivalents</div>
                    </div>
                  </th>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900" aria-label="Shares: Not applicable">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900" aria-label="Price: Not applicable">-</td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Cash Value: ${formatCurrency(portfolio.cash)}`}
                  >
                    {formatCurrency(portfolio.cash)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900"
                    aria-label="Cash Allocation: 0.1 percent"
                  >
                    {formatPercentage(0.1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500" aria-label="Day Change: Not applicable">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500" aria-label="Total Gain Loss: Not applicable">-</td>
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
