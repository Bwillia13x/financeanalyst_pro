import { Plus, TrendingUp, TrendingDown, PieChart, DollarSign, Target } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import PortfolioAnalytics from '../components/PortfolioAnalytics/PortfolioAnalytics';
import PortfolioBuilder from '../components/PortfolioBuilder/PortfolioBuilder';
import SEOHead from '../components/SEO/SEOHead';
import MetricCard from '../components/ui/MetricCard';
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
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          shares: 100,
          currentPrice: 175.5,
          allocation: 35.0,
          value: 17550,
          costBasis: 160.0
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          shares: 80,
          currentPrice: 335.2,
          allocation: 30.0,
          value: 26816,
          costBasis: 300.0
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          shares: 50,
          currentPrice: 128.45,
          allocation: 15.0,
          value: 6422.5,
          costBasis: 120.0
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          shares: 30,
          currentPrice: 245.8,
          allocation: 10.0,
          value: 7374,
          costBasis: 200.0
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          shares: 25,
          currentPrice: 425.3,
          allocation: 10.0,
          value: 10632.5,
          costBasis: 400.0
        }
      ]
    };

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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <PieChart className="w-16 h-16 text-foreground-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Portfolio Selected</h3>
          <p className="text-foreground-secondary mb-4">Create or select a portfolio to get started</p>
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth"
          >
            Create Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Portfolio Management | FinanceAnalyst Pro"
        description="Professional portfolio management tools with real-time tracking, risk analysis, and performance analytics"
        keywords="portfolio management, investment tracking, risk analysis, asset allocation"
      />

      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <PieChart className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Portfolio Management</h1>
                <p className="text-sm text-foreground-secondary">Real-time portfolio tracking & analysis</p>
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
                onItemClick={itemId => setViewMode(itemId)}
                className="bg-muted rounded-lg"
              />

              <button
                onClick={() => {}}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth"
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
        <MetricCard label="Portfolio Value" value={formatCurrency(portfolio.totalValue)} color="primary" icon={DollarSign} />
        <MetricCard
          label="Total Gain/Loss"
          value={formatCurrency(portfolio.totalGainLoss)}
          color={portfolio.totalGainLoss >= 0 ? 'success' : 'destructive'}
          caption={formatPercentage(portfolio.totalGainLossPercent)}
          captionColor={portfolio.totalGainLossPercent >= 0 ? 'success' : 'destructive'}
          icon={portfolio.totalGainLoss >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard
          label="Day Change"
          value={formatCurrency(portfolio.dailyChange)}
          color={portfolio.dailyChange >= 0 ? 'success' : 'destructive'}
          caption={formatPercentage(portfolio.dailyChangePercent)}
          captionColor={portfolio.dailyChangePercent >= 0 ? 'success' : 'destructive'}
          icon={portfolio.dailyChange >= 0 ? TrendingUp : TrendingDown}
        />
        <MetricCard label="Dividend Yield" value={formatPercentage(portfolio.dividendYield)} color="accent" caption="Weighted Average" icon={Target} />
      </div>

      {/* Holdings Table */}
      <div className="bg-card text-card-foreground rounded-xl shadow-elevation-1 border border-border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Holdings</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="portfolio-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Timeframe:
                </label>
                <input
                  id="portfolio-name"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter portfolio name"
                />
              </div>
              {/* Loading indicator would appear here */}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Portfolio holdings table">
            <caption className="sr-only">
              Portfolio holdings showing symbols, shares, prices, market values, allocations, and
              performance data
            </caption>
            <thead className="bg-muted/40">
              <tr role="row">
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Symbol / Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Shares
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Market Value
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Allocation
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Day Change
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-foreground-secondary uppercase tracking-wider"
                >
                  Total Gain/Loss
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {portfolio.holdings.map(holding => (
                <tr
                  key={holding.symbol}
                  className="hover:bg-muted/50 focus-within:bg-muted"
                  role="row"
                >
                  <th scope="row" className="px-6 py-4 whitespace-nowrap font-medium">
                    <div>
                      <div className="text-sm font-medium text-foreground">{holding.symbol}</div>
                      <div className="text-sm text-foreground-secondary">{holding.name}</div>
                    </div>
                  </th>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Shares: ${formatNumber(holding.shares)}`}
                  >
                    {formatNumber(holding.shares)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Price: ${formatCurrency(holding.currentPrice)}`}
                  >
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Market Value: ${formatCurrency(holding.value)}`}
                  >
                    {formatCurrency(holding.value)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Allocation: ${formatPercentage(holding.allocation)}`}
                  >
                    {formatPercentage(holding.allocation)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${holding.dayChange >= 0 ? 'text-success' : 'text-destructive'}`}
                    tabIndex="0"
                    aria-label={`Day Change: ${formatCurrency(holding.dayChange)} ${holding.dayChange >= 0 ? 'positive' : 'negative'}`}
                  >
                    {formatCurrency(holding.dayChange)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${holding.gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}
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
                <tr className="hover:bg-muted/50 focus-within:bg-muted" role="row">
                  <th scope="row" className="px-6 py-4 whitespace-nowrap font-medium">
                    <div>
                      <div className="text-sm font-medium text-foreground">CASH</div>
                      <div className="text-sm text-foreground-secondary">Cash & Cash Equivalents</div>
                    </div>
                  </th>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground"
                    aria-label="Shares: Not applicable"
                  >
                    -
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground"
                    aria-label="Price: Not applicable"
                  >
                    -
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                    tabIndex="0"
                    aria-label={`Cash Value: ${formatCurrency(portfolio.cash)}`}
                  >
                    {formatCurrency(portfolio.cash)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground"
                    aria-label="Cash Allocation: 0.1 percent"
                  >
                    {formatPercentage(0.1)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground-secondary"
                    aria-label="Day Change: Not applicable"
                  >
                    -
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground-secondary"
                    aria-label="Total Gain Loss: Not applicable"
                  >
                    -
                  </td>
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
