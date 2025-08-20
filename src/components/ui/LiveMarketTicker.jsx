import { TrendingUp, TrendingDown, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { useMultipleRealTimeData } from '../../hooks/useRealTimeData';
import { cn } from '../../utils/cn';

/**
 * Live Market Ticker Component
 * Displays streaming market data in a scrolling ticker format
 */

const DEFAULT_SYMBOLS = [
  { dataType: 'stock_price', symbol: 'AAPL', name: 'Apple' },
  { dataType: 'stock_price', symbol: 'MSFT', name: 'Microsoft' },
  { dataType: 'stock_price', symbol: 'GOOGL', name: 'Google' },
  { dataType: 'stock_price', symbol: 'TSLA', name: 'Tesla' },
  { dataType: 'fx_rates', symbol: 'EURUSD', name: 'EUR/USD' },
  { dataType: 'commodity_prices', symbol: 'OIL', name: 'Oil' },
  { dataType: 'commodity_prices', symbol: 'GOLD', name: 'Gold' }
];

export const LiveMarketTicker = ({
  symbols = DEFAULT_SYMBOLS,
  className,
  speed = 'normal',
  showConnectionStatus = true,
  onTickerClick
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const subscriptions = symbols.map(({ dataType, symbol }) => ({
    dataType,
    symbol,
    options: { autoReconnect: true }
  }));

  const {
    getData,
    getConnectionState,
    isAllConnected
  } = useMultipleRealTimeData(subscriptions);

  const speedClasses = {
    slow: 'animate-scroll-slow',
    normal: 'animate-scroll',
    fast: 'animate-scroll-fast'
  };

  const formatValue = (dataType, data) => {
    if (!data) return '---';

    switch (dataType) {
      case 'stock_price':
        return `$${data.price?.toFixed(2)}`;
      case 'fx_rates':
        return data.rate?.toFixed(4);
      case 'commodity_prices':
        return `$${data.price?.toFixed(2)}`;
      case 'interest_rates':
        return `${data.rate?.toFixed(2)}%`;
      case 'bond_yields':
        return `${data.yield?.toFixed(2)}%`;
      default:
        return data.value?.toFixed(2) || '---';
    }
  };

  const formatChange = (dataType, data) => {
    if (!data) return null;

    let change, changePercent;

    switch (dataType) {
      case 'stock_price':
        change = data.change;
        changePercent = data.changePercent;
        break;
      case 'fx_rates':
      case 'commodity_prices':
        change = data.change;
        changePercent = change;
        break;
      default:
        return null;
    }

    if (change === undefined) return null;

    const isPositive = change >= 0;
    return {
      value: Math.abs(change),
      percent: Math.abs(changePercent),
      isPositive
    };
  };

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center p-2 bg-slate-800 text-white">
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center space-x-2 text-sm hover:text-blue-400"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Show Market Ticker</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-slate-900 border-b border-slate-700 overflow-hidden relative',
        className
      )}
    >
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-2">
          {isAllConnected ? (
            <div className="flex items-center space-x-1 text-green-400">
              <Wifi className="w-3 h-3" />
              <span className="text-xs">Live</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-400">
              <WifiOff className="w-3 h-3" />
              <span className="text-xs">Disconnected</span>
            </div>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scrolling Content */}
      <div
        className={cn(
          'flex whitespace-nowrap py-2',
          speedClasses[speed] || speedClasses.normal
        )}
      >
        {symbols.map(({ dataType, symbol }, index) => {
          const data = getData(dataType, symbol);
          const isConnected = getConnectionState(dataType, symbol);
          const change = formatChange(dataType, data);

          return (
            <div
              key={`${dataType}_${symbol}_${index}`}
              className={cn(
                'flex items-center space-x-2 px-4 py-1 cursor-pointer hover:bg-slate-800 transition-colors mr-8',
                !isConnected && 'opacity-50'
              )}
              onClick={() => onTickerClick?.(dataType, symbol, data)}
              onKeyDown={(e) => e.key === 'Enter' && onTickerClick?.(dataType, symbol, data)}
              role="button"
              tabIndex={0}
            >
              {/* Symbol */}
              <span className="text-white font-semibold text-sm">
                {symbol}
              </span>

              {/* Value */}
              <span className="text-slate-300 text-sm">
                {formatValue(dataType, data)}
              </span>

              {/* Change */}
              {change && (
                <div
                  className={cn(
                    'flex items-center space-x-1 text-xs',
                    change.isPositive ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {change.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {dataType === 'stock_price'
                      ? `${change.percent.toFixed(2)}%`
                      : `${change.value.toFixed(2)}%`
                    }
                  </span>
                </div>
              )}

              {/* Connection indicator */}
              {!isConnected && (
                <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
              )}
            </div>
          );
        })}

        {/* Duplicate content for seamless scrolling */}
        {symbols.map(({ dataType, symbol }, index) => {
          const data = getData(dataType, symbol);
          const isConnected = getConnectionState(dataType, symbol);
          const change = formatChange(dataType, data);

          return (
            <div
              key={`${dataType}_${symbol}_${index}_dup`}
              className={cn(
                'flex items-center space-x-2 px-4 py-1 cursor-pointer hover:bg-slate-800 transition-colors mr-8',
                !isConnected && 'opacity-50'
              )}
              onClick={() => onTickerClick?.(dataType, symbol, data)}
              onKeyDown={(e) => e.key === 'Enter' && onTickerClick?.(dataType, symbol, data)}
              role="button"
              tabIndex={0}
            >
              <span className="text-white font-semibold text-sm">{symbol}</span>
              <span className="text-slate-300 text-sm">{formatValue(dataType, data)}</span>
              {change && (
                <div
                  className={cn(
                    'flex items-center space-x-1 text-xs',
                    change.isPositive ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {change.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {dataType === 'stock_price'
                      ? `${change.percent.toFixed(2)}%`
                      : `${change.value.toFixed(2)}%`
                    }
                  </span>
                </div>
              )}
              {!isConnected && (
                <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveMarketTicker;
