import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { useRealTimeData } from '../../hooks/useRealTimeData';
import { cn } from '../../utils/cn';

/**
 * Live Price Widget - Individual stock/asset price display with real-time updates
 */

export const LivePriceWidget = ({
  dataType = 'stock_price',
  symbol,
  name,
  className,
  size = 'medium',
  showChart = false,
  onPriceUpdate
}) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);

  const { data, isConnected, error, lastUpdated } = useRealTimeData(dataType, symbol, {
    onUpdate: (newData) => {
      // Trigger flash animation on price change
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      // Update price history for mini chart
      setPriceHistory(prev => {
        const newHistory = [...prev, newData.price || newData.rate || newData.value].slice(-20);
        return newHistory;
      });

      onPriceUpdate?.(newData);
    }
  });

  const getChangeDirection = () => {
    if (!data) return 'neutral';

    const change = data.change || data.changePercent || 0;
    return change >= 0 ? 'positive' : 'negative';
  };

  const formatPrice = () => {
    if (!data) return '---';

    switch (dataType) {
      case 'stock_price':
        return `$${data.price?.toFixed(2)}`;
      case 'fx_rates':
        return data.rate?.toFixed(4);
      case 'commodity_prices':
        return `$${data.price?.toFixed(2)}`;
      case 'interest_rates':
      case 'bond_yields':
        return `${(data.rate || data.yield)?.toFixed(2)}%`;
      default:
        return data.value?.toFixed(2) || '---';
    }
  };

  const formatChange = () => {
    if (!data) return null;

    const change = data.change || 0;
    const changePercent = data.changePercent || change;

    return {
      absolute: Math.abs(change).toFixed(2),
      percent: Math.abs(changePercent).toFixed(2),
      direction: getChangeDirection()
    };
  };

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const textSizeClasses = {
    small: {
      price: 'text-lg',
      change: 'text-xs',
      symbol: 'text-sm'
    },
    medium: {
      price: 'text-xl',
      change: 'text-sm',
      symbol: 'text-base'
    },
    large: {
      price: 'text-2xl',
      change: 'text-base',
      symbol: 'text-lg'
    }
  };

  const change = formatChange();
  const direction = getChangeDirection();

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-200',
        sizeClasses[size],
        isFlashing && direction === 'positive' && 'bg-green-50 dark:bg-green-900/20',
        isFlashing && direction === 'negative' && 'bg-red-50 dark:bg-red-900/20',
        !isConnected && 'opacity-75',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3
            className={cn(
              'font-semibold text-slate-900 dark:text-white',
              textSizeClasses[size].symbol
            )}
          >
            {symbol}
          </h3>
          {name && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{name}</p>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
          ) : error ? (
            <AlertCircle className="w-3 h-3 text-red-500" />
          ) : (
            <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className={cn(
              'font-bold text-slate-900 dark:text-white',
              textSizeClasses[size].price
            )}
          >
            {formatPrice()}
          </div>

          {/* Change Display */}
          {change && (
            <div
              className={cn(
                'flex items-center space-x-1 mt-1',
                textSizeClasses[size].change,
                direction === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {direction === 'positive' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {dataType === 'stock_price' ? (
                  `$${change.absolute} (${change.percent}%)`
                ) : (
                  `${change.percent}%`
                )}
              </span>
            </div>
          )}
        </div>

        {/* Mini Chart */}
        {showChart && priceHistory.length > 1 && (
          <div className="w-16 h-8">
            <MiniChart
              data={priceHistory}
              color={direction === 'positive' ? '#10b981' : '#ef4444'}
            />
          </div>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-slate-400 mt-2">
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 text-xs text-red-500 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Connection error</span>
        </div>
      )}
    </div>
  );
};

/**
 * Mini Chart Component for price trends
 */
const MiniChart = ({ data, color = '#3b82f6' }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 64; // 64px width
    const y = 32 - ((value - min) / range) * 32; // 32px height, inverted
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="64" height="32" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot at the end */}
      <circle
        cx={64}
        cy={32 - ((data[data.length - 1] - min) / range) * 32}
        r="2"
        fill={color}
      />
    </svg>
  );
};

export default LivePriceWidget;
