import React, { useState } from 'react';
import { TrendingUp, Globe, Activity, Settings } from 'lucide-react';
import LiveMarketDashboard from '../components/ui/LiveMarketDashboard';
import LivePriceWidget from '../components/ui/LivePriceWidget';
import Header from '../components/ui/Header';
import SEOHead from '../components/SEO/SEOHead';

/**
 * Market Analysis page with integrated real-time data streaming
 */

const MarketAnalysis = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleAssetClick = (dataType, symbol, data) => {
    setSelectedAsset({ dataType, symbol, data });
  };

  const watchlistSymbols = [
    { dataType: 'stock_price', symbol: 'AAPL', name: 'Apple Inc.' },
    { dataType: 'stock_price', symbol: 'MSFT', name: 'Microsoft Corp.' },
    { dataType: 'fx_rates', symbol: 'EURUSD', name: 'EUR/USD' },
    { dataType: 'commodity_prices', symbol: 'GOLD', name: 'Gold' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEOHead
        title="Live Market Analysis | FinanceAnalyst Pro"
        description="Real-time market data, live price feeds, and comprehensive market analysis tools for professional investors."
        canonical="/market-analysis"
        keywords="real-time market data, live prices, market analysis, trading, stocks, forex, commodities"
      />
      
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Live Market Analysis
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time market data and analysis tools for informed investment decisions
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {watchlistSymbols.map(({ dataType, symbol, name }) => (
            <LivePriceWidget
              key={`${dataType}_${symbol}`}
              dataType={dataType}
              symbol={symbol}
              name={name}
              size="small"
              showChart={true}
              onPriceUpdate={(data) => handleAssetClick(dataType, symbol, data)}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            />
          ))}
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Live Market Dashboard */}
          <div className="xl:col-span-3">
            <LiveMarketDashboard
              showTicker={true}
              onAssetClick={handleAssetClick}
              className="h-fit"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Asset Details */}
            {selectedAsset && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Asset Details
                </h3>
                <LivePriceWidget
                  dataType={selectedAsset.dataType}
                  symbol={selectedAsset.symbol}
                  size="large"
                  showChart={true}
                  className="border-none shadow-none"
                />
              </div>
            )}

            {/* Market Overview */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Market Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Market Status</span>
                  <span className="text-green-600 font-medium">Open</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Active Feeds</span>
                  <span className="text-slate-900 dark:text-white font-medium">28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Update</span>
                  <span className="text-slate-900 dark:text-white font-medium">Live</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Create Price Alert
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Export Market Data
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketAnalysis;
