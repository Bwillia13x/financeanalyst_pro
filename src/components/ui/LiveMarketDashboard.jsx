import { Activity, TrendingUp, Globe, Zap, Settings, Maximize2, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';

import { useMultipleRealTimeData } from '../../hooks/useRealTimeData';
import { cn } from '../../utils/cn';

import LiveMarketTicker from './LiveMarketTicker';
import LivePriceWidget from './LivePriceWidget';

/**
 * Live Market Dashboard - Comprehensive real-time market data display
 */

const MARKET_SECTIONS = {
  stocks: {
    title: 'Major Stocks',
    icon: TrendingUp,
    items: [
      { dataType: 'stock_price', symbol: 'AAPL', name: 'Apple Inc.' },
      { dataType: 'stock_price', symbol: 'MSFT', name: 'Microsoft Corp.' },
      { dataType: 'stock_price', symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { dataType: 'stock_price', symbol: 'TSLA', name: 'Tesla Inc.' },
      { dataType: 'stock_price', symbol: 'AMZN', name: 'Amazon.com Inc.' }
    ]
  },
  forex: {
    title: 'Foreign Exchange',
    icon: Globe,
    items: [
      { dataType: 'fx_rates', symbol: 'EURUSD', name: 'Euro/US Dollar' },
      { dataType: 'fx_rates', symbol: 'GBPUSD', name: 'British Pound/US Dollar' },
      { dataType: 'fx_rates', symbol: 'USDJPY', name: 'US Dollar/Japanese Yen' },
      { dataType: 'fx_rates', symbol: 'USDCHF', name: 'US Dollar/Swiss Franc' }
    ]
  },
  commodities: {
    title: 'Commodities',
    icon: Zap,
    items: [
      { dataType: 'commodity_prices', symbol: 'OIL', name: 'Crude Oil' },
      { dataType: 'commodity_prices', symbol: 'GOLD', name: 'Gold' },
      { dataType: 'commodity_prices', symbol: 'SILVER', name: 'Silver' },
      { dataType: 'commodity_prices', symbol: 'COPPER', name: 'Copper' }
    ]
  },
  rates: {
    title: 'Interest Rates & Bonds',
    icon: Activity,
    items: [
      { dataType: 'bond_yields', symbol: 'US10Y', name: 'US 10-Year Treasury' },
      { dataType: 'bond_yields', symbol: 'US2Y', name: 'US 2-Year Treasury' },
      { dataType: 'interest_rates', symbol: 'USD_3M', name: 'USD 3-Month LIBOR' },
      { dataType: 'volatility_index', symbol: 'VIX', name: 'CBOE Volatility Index' }
    ]
  }
};

export const LiveMarketDashboard = ({
  className,
  showTicker = true,
  defaultSection = 'stocks',
  onAssetClick
}) => {
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [expandedWidget, setExpandedWidget] = useState(null);

  // Subscribe to all market data
  const allSubscriptions = Object.values(MARKET_SECTIONS)
    .flatMap(section => section.items)
    .map(({ dataType, symbol }) => ({ dataType, symbol }));

  const { getData, getConnectionState, isAllConnected, hasAnyErrors } =
    useMultipleRealTimeData(allSubscriptions);

  const handleTickerClick = (dataType, symbol, data) => {
    onAssetClick?.(dataType, symbol, data);
  };

  const handleWidgetExpand = key => {
    setExpandedWidget(expandedWidget === key ? null : key);
  };

  const activeItems = MARKET_SECTIONS[activeSection]?.items || [];

  return (
    <div
      className={cn('bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden', className)}
    >
      {/* Market Ticker */}
      {showTicker && (
        <LiveMarketTicker
          onTickerClick={handleTickerClick}
          speed="normal"
          showConnectionStatus={true}
        />
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Live Market Data
            </h2>
            <div
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                isAllConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}
            >
              {isAllConnected ? 'Live' : 'Disconnected'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 mt-4">
          {Object.entries(MARKET_SECTIONS).map(([key, section]) => {
            const Icon = section.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeSection === key
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map(({ dataType, symbol, name }) => {
              const key = `${dataType}_${symbol}`;
              const isExpanded = expandedWidget === key;

              return (
                <div
                  key={key}
                  className={cn(
                    'transition-all duration-200',
                    isExpanded && 'md:col-span-2 lg:col-span-2'
                  )}
                >
                  <LivePriceWidget
                    dataType={dataType}
                    symbol={symbol}
                    name={name}
                    size={isExpanded ? 'large' : 'medium'}
                    showChart={isExpanded}
                    onPriceUpdate={data => onAssetClick?.(dataType, symbol, data)}
                    className="cursor-pointer hover:shadow-md"
                    onClick={() => handleWidgetExpand(key)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {activeItems.map(({ dataType, symbol, name }) => {
              const data = getData(dataType, symbol);
              const isConnected = getConnectionState(dataType, symbol);

              return (
                <div
                  key={`${dataType}_${symbol}`}
                  onClick={() => onAssetClick?.(dataType, symbol, data)}
                  onKeyDown={e => e.key === 'Enter' && onAssetClick?.(dataType, symbol, data)}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{symbol}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {data
                        ? dataType === 'stock_price'
                          ? `$${data.price?.toFixed(2)}`
                          : dataType === 'fx_rates'
                            ? data.rate?.toFixed(4)
                            : dataType === 'commodity_prices'
                              ? `$${data.price?.toFixed(2)}`
                              : `${(data.rate || data.yield || data.volatility)?.toFixed(2)}%`
                        : '---'}
                    </div>
                    {data && (data.change !== undefined || data.changePercent !== undefined) && (
                      <div
                        className={cn(
                          'text-sm flex items-center space-x-1',
                          (data.change || data.changePercent || 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {(data.change || data.changePercent || 0) >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {dataType === 'stock_price'
                            ? `${Math.abs(data.changePercent || 0).toFixed(2)}%`
                            : `${Math.abs(data.change || data.changePercent || 0).toFixed(2)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {hasAnyErrors && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              Some market data feeds are experiencing connectivity issues. Prices may not reflect
              real-time values.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMarketDashboard;
