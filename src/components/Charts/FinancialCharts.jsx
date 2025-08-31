import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// ===== FINANCIAL CHART COMPONENTS =====

/**
 * Professional financial chart components specifically designed for
 * institutional-grade financial data visualization
 */

// ===== CANDLESTICK CHART =====
export const CandlestickChart = ({
  data,
  title = 'Price Chart',
  subtitle,
  symbol,
  height = 400,
  showVolume = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  ...props
}) => {
  // Transform data for candlestick visualization
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item, index) => {
      const open = item.open || item.price || 0;
      const high = item.high || Math.max(open, item.close || open, item.price || open);
      const low = item.low || Math.min(open, item.close || open, item.price || open);
      const close = item.close || item.price || open;
      const volume = item.volume || 0;

      // Determine candle color (green for up, red for down)
      const isUp = close >= open;
      const color = isUp ? '#059669' : '#dc2626';

      return {
        ...item,
        index,
        date: item.date || item.timestamp || `Point ${index + 1}`,
        open,
        high,
        low,
        close,
        volume,
        isUp,
        color,
        body: Math.abs(close - open),
        upperWick: high - Math.max(open, close),
        lowerWick: Math.min(open, close) - low,
        change: close - open,
        changePercent: open !== 0 ? ((close - open) / open) * 100 : 0
      };
    });
  }, [data]);

  // Custom candlestick shape
  const CandlestickShape = props => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close, isUp, color } = payload;
    const centerX = x + width / 2;
    const scaleY =
      height / (Math.max(...chartData.map(d => d.high)) - Math.min(...chartData.map(d => d.low)));

    // Calculate positions
    const highY = y;
    const lowY = y + height;
    const openY = y + (high - open) * scaleY;
    const closeY = y + (high - close) * scaleY;

    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1); // Minimum height

    return (
      <g>
        {/* High-Low line (wick) */}
        <line x1={centerX} y1={highY} x2={centerX} y2={lowY} stroke={color} strokeWidth={1} />

        {/* Open-Close body */}
        <rect
          x={x + width * 0.2}
          y={bodyTop}
          width={width * 0.6}
          height={bodyHeight}
          fill={isUp ? color : 'none'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Custom tooltip for candlestick
  const CandlestickTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">{symbol || 'Stock'}</h4>
          <span className="text-sm text-foreground-secondary">{data.date}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Open:</span>
              <span className="text-sm font-medium">${data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">High:</span>
              <span className="text-sm font-medium text-green-600">${data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Low:</span>
              <span className="text-sm font-medium text-red-600">${data.low?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Close:</span>
              <span className="text-sm font-medium">${data.close?.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">Change:</span>
              <div className="flex items-center gap-1">
                {data.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    data.change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {data.change >= 0 ? '+' : ''}${Math.abs(data.change).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Change %:</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {data.changePercent >= 0 ? '+' : ''}
                {data.changePercent.toFixed(2)}%
              </span>
            </div>

            {data.volume && (
              <div className="flex justify-between">
                <span className="text-sm text-foreground-secondary">Volume:</span>
                <span className="text-sm font-medium">{(data.volume / 1000000).toFixed(1)}M</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('financial-chart', className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {symbol && <span className="text-brand-accent font-bold">{symbol}</span>}
          {title}
        </CardTitle>
        {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
      </CardHeader>

      <CardContent>
        <div style={{ height: showVolume ? height - 120 : height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />}

              <XAxis
                dataKey="date"
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />

              <YAxis
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />

              {showTooltip && <Tooltip content={<CandlestickTooltip />} />}

              {/* Candlestick shapes */}
              <Scatter dataKey="close" shape={<CandlestickShape />} legendType="none" />

              {/* Moving average lines (if available) */}
              {chartData.some(d => d.ma20) && (
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA(20)"
                />
              )}

              {chartData.some(d => d.ma50) && (
                <Line
                  type="monotone"
                  dataKey="ma50"
                  stroke="#7c3aed"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="MA(50)"
                />
              )}

              {showLegend && <Legend wrapperStyle={{ color: '#475569' }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        {showVolume && chartData.some(d => d.volume) && (
          <div className="mt-4" style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={10}
                  tick={{ fill: '#475569' }}
                  axisLine={false}
                />
                <YAxis stroke="#475569" fontSize={10} tick={{ fill: '#475569' }} axisLine={false} />
                <Bar
                  dataKey="volume"
                  fill={data => (data.isUp ? '#059669' : '#dc2626')}
                  opacity={0.7}
                />
                <Tooltip
                  formatter={value => [`${(value / 1000000).toFixed(1)}M`, 'Volume']}
                  labelStyle={{ color: '#475569' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ===== OHLC (OPEN-HIGH-LOW-CLOSE) CHART =====
export const OHLCChart = ({
  data,
  title = 'OHLC Chart',
  subtitle,
  symbol,
  height = 400,
  showGrid = true,
  showTooltip = true,
  className,
  ...props
}) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item, index) => ({
      ...item,
      index,
      date: item.date || item.timestamp || `Point ${index + 1}`,
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      range: (item.high || 0) - (item.low || 0),
      body: Math.abs((item.close || 0) - (item.open || 0)),
      direction: (item.close || 0) > (item.open || 0) ? 'bullish' : 'bearish',
      midpoint: ((item.high || 0) + (item.low || 0)) / 2
    }));
  }, [data]);

  const OHLCTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">{symbol || 'Asset'}</h4>
          <span className="text-sm text-foreground-secondary">{data.date}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Open:</span>
              <span className="text-sm font-medium">${data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Close:</span>
              <span className="text-sm font-medium">${data.close?.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">High:</span>
              <span className="text-sm font-medium text-green-600">${data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Low:</span>
              <span className="text-sm font-medium text-red-600">${data.low?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">Range:</span>
            <span className="text-sm font-medium">${data.range?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('ohlc-chart', className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {symbol && <span className="text-brand-accent font-bold">{symbol}</span>}
          {title}
        </CardTitle>
        {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />}

              <XAxis dataKey="date" stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />

              <YAxis
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />

              {showTooltip && <Tooltip content={<OHLCTooltip />} />}

              {/* High-Low range lines */}
              <Line
                type="monotone"
                dataKey="high"
                stroke="#059669"
                strokeWidth={1}
                dot={false}
                name="High"
              />

              <Line
                type="monotone"
                dataKey="low"
                stroke="#dc2626"
                strokeWidth={1}
                dot={false}
                name="Low"
              />

              {/* Open-Close points */}
              <Scatter dataKey="open" fill="#2563eb" name="Open" />

              <Scatter dataKey="close" fill="#7c3aed" name="Close" />

              <Legend wrapperStyle={{ color: '#475569' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== VOLUME CHART =====
export const VolumeChart = ({
  data,
  title = 'Volume Chart',
  subtitle,
  symbol,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showAverage = true,
  className,
  ...props
}) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item, index) => {
      const volume = item.volume || 0;
      const price = item.price || item.close || item.open || 0;
      const isUp = price >= (item.open || price);

      return {
        ...item,
        index,
        date: item.date || item.timestamp || `Point ${index + 1}`,
        volume,
        price,
        isUp,
        volumeColor: isUp ? '#059669' : '#dc2626',
        volumeFormatted:
          volume >= 1000000
            ? `${(volume / 1000000).toFixed(1)}M`
            : volume >= 1000
              ? `${(volume / 1000).toFixed(1)}K`
              : volume.toString()
      };
    });
  }, [data]);

  // Calculate volume moving average
  const volumeMA = useMemo(() => {
    const period = 20; // 20-period moving average
    return chartData.map((item, index) => {
      if (index < period - 1) return { ...item, volumeMA: null };

      const sum = chartData
        .slice(index - period + 1, index + 1)
        .reduce((acc, d) => acc + d.volume, 0);

      return {
        ...item,
        volumeMA: sum / period
      };
    });
  }, [chartData]);

  const VolumeTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <div className="text-sm font-medium text-foreground mb-2">{data.date}</div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-foreground-secondary">Volume:</span>
            <span className="text-sm font-medium text-foreground">{data.volumeFormatted}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-foreground-secondary">Price:</span>
            <span className="text-sm font-medium text-foreground">${data.price?.toFixed(2)}</span>
          </div>

          {data.volumeMA && (
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-sm text-foreground-secondary">MA(20):</span>
              <span className="text-sm font-medium text-foreground">
                {(data.volumeMA / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('volume-chart', className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {symbol && <span className="text-brand-accent font-bold">{symbol}</span>}
          {title}
        </CardTitle>
        {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />}

              <XAxis dataKey="date" stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />

              <YAxis
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
                tickFormatter={value => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toString();
                }}
              />

              {showTooltip && <Tooltip content={<VolumeTooltip />} />}

              {/* Volume bars with color based on price direction */}
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.volumeColor} opacity={0.7} />
                ))}
              </Bar>

              {/* Volume moving average line */}
              {showAverage && (
                <Line
                  type="monotone"
                  dataKey="volumeMA"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  yAxisId="volume"
                  name="Volume MA(20)"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== FINANCIAL INDICATORS CHART =====
export const IndicatorsChart = ({
  data,
  indicators = [],
  title = 'Technical Indicators',
  subtitle,
  symbol,
  height = 400,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  className,
  ...props
}) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item, index) => ({
      ...item,
      index,
      date: item.date || item.timestamp || `Point ${index + 1}`,
      // Ensure all indicators are available
      ...indicators.reduce((acc, indicator) => {
        acc[indicator.key] = item[indicator.key] || null;
        return acc;
      }, {})
    }));
  }, [data, indicators]);

  const IndicatorsTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-xs">
        <div className="text-sm font-medium text-foreground mb-3">{data.date}</div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-foreground-secondary">Price:</span>
            <span className="text-sm font-medium text-foreground">
              ${data.price?.toFixed(2) || data.close?.toFixed(2)}
            </span>
          </div>

          {indicators.map(indicator => {
            const value = data[indicator.key];
            if (value === null || value === undefined) return null;

            return (
              <div key={indicator.key} className="flex justify-between">
                <span className="text-sm text-foreground-secondary">{indicator.name}:</span>
                <span className="text-sm font-medium" style={{ color: indicator.color }}>
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('indicators-chart', className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {symbol && <span className="text-brand-accent font-bold">{symbol}</span>}
          {title}
        </CardTitle>
        {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />}

              <XAxis dataKey="date" stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />

              <YAxis
                yAxisId="price"
                orientation="left"
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
              />

              <YAxis
                yAxisId="indicator"
                orientation="right"
                stroke="#7c3aed"
                fontSize={12}
                tick={{ fill: '#7c3aed' }}
              />

              {showTooltip && <Tooltip content={<IndicatorsTooltip />} />}

              {/* Price line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                name="Price"
              />

              {/* Indicator lines */}
              {indicators.map(indicator => (
                <Line
                  key={indicator.key}
                  yAxisId="indicator"
                  type="monotone"
                  dataKey={indicator.key}
                  stroke={indicator.color}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name={indicator.name}
                />
              ))}

              {showLegend && <Legend wrapperStyle={{ color: '#475569' }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Indicator Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {indicators.map(indicator => (
            <div key={indicator.key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color }} />
              <span className="text-sm text-foreground-secondary">{indicator.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ===== COMPONENTS EXPORTED INDIVIDUALLY ABOVE =====
