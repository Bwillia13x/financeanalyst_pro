import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  ReferenceLine,
  Brush
} from 'recharts';

import { cn } from '../../utils/cn';

// ===== INSTITUTIONAL CHART SYSTEM =====

/**
 * Institutional-grade chart component with financial data visualization
 * Supports multiple chart types with professional styling and accessibility
 */

const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  PIE: 'pie',
  SCATTER: 'scatter',
  COMPOSED: 'composed',
  CANDLESTICK: 'candlestick',
  OHLC: 'ohlc',
  VOLUME: 'volume'
};

const CHART_THEMES = {
  financial: {
    colors: [
      '#059669', // Revenue green
      '#dc2626', // Expense red
      '#2563eb', // Asset blue
      '#ea580c', // Liability orange
      '#7c3aed', // Equity purple
      '#0891b2', // Info cyan
      '#be123c', // Rose
      '#4d7c0f' // Lime
    ],
    gridColor: '#e2e8f0',
    textColor: '#475569',
    backgroundColor: 'transparent'
  },
  dark: {
    colors: [
      '#60a5fa', // Light blue
      '#f87171', // Light red
      '#93c5fd', // Light blue
      '#fb923c', // Light orange
      '#a78bfa', // Light purple
      '#5eead4', // Light cyan
      '#f472b6', // Light rose
      '#86efac' // Light lime
    ],
    gridColor: '#334155',
    textColor: '#cbd5e1',
    backgroundColor: '#0f172a'
  }
};

export const InstitutionalChart = ({
  data,
  type = CHART_TYPES.LINE,
  theme = 'financial',
  width = '100%',
  height = 400,
  title,
  subtitle,
  xAxisKey = 'x',
  yAxisKeys = ['y'],
  colors,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showBrush = false,
  interactive = true,
  animation = true,
  className,
  ...props
}) => {
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  // ===== THEME AND STYLING =====
  const chartTheme = useMemo(
    () => ({
      ...CHART_THEMES[theme],
      colors: colors || CHART_THEMES[theme].colors
    }),
    [theme, colors]
  );

  // ===== DATA PROCESSING =====
  useEffect(() => {
    if (data && data.length > 0) {
      setIsLoading(false);
      setChartData(data);
    }
  }, [data]);

  // ===== CUSTOM TOOLTIP =====
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-foreground-secondary">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ===== FINANCIAL TOOLTIP =====
  const FinancialTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[200px]">
        <div className="border-b border-border pb-2 mb-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-foreground-muted">Financial Data</p>
        </div>

        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-foreground-secondary capitalize">
                {entry.dataKey?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-right">
              {entry.dataKey?.includes('price') ||
              entry.dataKey?.includes('value') ||
              entry.dataKey?.includes('amount') ? (
                <span className="text-sm font-medium text-foreground">
                  $
                  {entry.value?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              ) : entry.dataKey?.includes('percentage') || entry.dataKey?.includes('percent') ? (
                <span className="text-sm font-medium text-foreground">
                  {entry.value?.toFixed(2)}%
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {entry.value?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Additional financial metrics */}
        {payload[0]?.payload && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              {payload[0].payload.change && (
                <div>
                  <span className="text-foreground-muted">Change: </span>
                  <span
                    className={cn(
                      'font-medium',
                      payload[0].payload.change >= 0 ? 'text-brand-success' : 'text-brand-error'
                    )}
                  >
                    {payload[0].payload.change >= 0 ? '+' : ''}
                    {payload[0].payload.change?.toFixed(2)}%
                  </span>
                </div>
              )}
              {payload[0].payload.volume && (
                <div>
                  <span className="text-foreground-muted">Volume: </span>
                  <span className="font-medium text-foreground">
                    {(payload[0].payload.volume / 1000000).toFixed(1)}M
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER CHART BY TYPE =====
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (type) {
      case CHART_TYPES.LINE:
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            <YAxis
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            {showTooltip && <Tooltip content={<FinancialTooltip />} />}
            {showLegend && (
              <Legend wrapperStyle={{ color: chartTheme.textColor }} iconType="line" />
            )}
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartTheme.colors[index % chartTheme.colors.length]}
                strokeWidth={2}
                dot={{ fill: chartTheme.colors[index % chartTheme.colors.length], r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: chartTheme.colors[index % chartTheme.colors.length],
                  strokeWidth: 2,
                  fill: chartTheme.backgroundColor
                }}
                animationDuration={animation ? 1000 : 0}
              />
            ))}
          </LineChart>
        );

      case CHART_TYPES.AREA:
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            <YAxis
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            {showTooltip && <Tooltip content={<FinancialTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: chartTheme.textColor }} />}
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartTheme.colors[index % chartTheme.colors.length]}
                fill={chartTheme.colors[index % chartTheme.colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={animation ? 1000 : 0}
              />
            ))}
          </AreaChart>
        );

      case CHART_TYPES.BAR:
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            <YAxis
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            {showTooltip && <Tooltip content={<FinancialTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: chartTheme.textColor }} />}
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartTheme.colors[index % chartTheme.colors.length]}
                radius={[2, 2, 0, 0]}
                animationDuration={animation ? 1000 : 0}
              />
            ))}
          </BarChart>
        );

      case CHART_TYPES.PIE:
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey={yAxisKeys[0]}
              animationDuration={animation ? 1000 : 0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartTheme.colors[index % chartTheme.colors.length]}
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<FinancialTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: chartTheme.textColor }} />}
          </PieChart>
        );

      case CHART_TYPES.COMPOSED:
        return (
          <ComposedChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            <YAxis
              stroke={chartTheme.textColor}
              fontSize={12}
              tick={{ fill: chartTheme.textColor }}
            />
            {showTooltip && <Tooltip content={<FinancialTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ color: chartTheme.textColor }} />}

            {/* Render different chart types for each data key */}
            {yAxisKeys.map((key, index) => {
              const chartType = index === 0 ? 'line' : index === 1 ? 'area' : 'bar';

              if (chartType === 'line') {
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={chartTheme.colors[index % chartTheme.colors.length]}
                    strokeWidth={3}
                    dot={{ fill: chartTheme.colors[index % chartTheme.colors.length], r: 4 }}
                    animationDuration={animation ? 1000 : 0}
                  />
                );
              }

              if (chartType === 'area') {
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    fill={chartTheme.colors[index % chartTheme.colors.length]}
                    fillOpacity={0.3}
                    stroke={chartTheme.colors[index % chartTheme.colors.length]}
                    animationDuration={animation ? 1000 : 0}
                  />
                );
              }

              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={chartTheme.colors[index % chartTheme.colors.length]}
                  animationDuration={animation ? 1000 : 0}
                />
              );
            })}
          </ComposedChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground-muted">Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div
      className={cn(
        'relative bg-background border border-border rounded-lg p-4',
        interactive && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {/* Chart Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>}
          {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
        </div>
      )}

      {/* Chart Container */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Brush for large datasets */}
      {showBrush && chartData.length > 50 && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey={yAxisKeys[0]}
                stroke={chartTheme.colors[0]}
                strokeWidth={1}
                dot={false}
              />
              <Brush dataKey={xAxisKey} height={30} stroke={chartTheme.colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accessibility Info */}
      <div className="sr-only">
        {title && <h4>{title}</h4>}
        {subtitle && <p>{subtitle}</p>}
        <p>Interactive chart showing {chartData.length} data points</p>
      </div>
    </div>
  );
};

// ===== FINANCIAL CHART COMPONENTS =====

export const CandlestickChart = ({ data, title, subtitle, className, ...props }) => {
  // Transform data for candlestick visualization
  const transformedData = useMemo(() => {
    if (!data) return [];

    return data.map(item => ({
      ...item,
      open: item.open || item.price,
      high: item.high || Math.max(item.open, item.close, item.price),
      low: item.low || Math.min(item.open, item.close, item.price),
      close: item.close || item.price,
      volume: item.volume || 0,
      color: item.close > item.open ? '#059669' : '#dc2626' // Green for up, red for down
    }));
  }, [data]);

  return (
    <InstitutionalChart
      data={transformedData}
      type={CHART_TYPES.COMPOSED}
      title={title}
      subtitle={subtitle}
      xAxisKey="date"
      yAxisKeys={['high', 'low', 'open', 'close']}
      className={cn('financial-chart', className)}
      {...props}
    />
  );
};

export const VolumeChart = ({ data, title, subtitle, className, ...props }) => {
  return (
    <InstitutionalChart
      data={data}
      type={CHART_TYPES.BAR}
      title={title}
      subtitle={subtitle}
      xAxisKey="date"
      yAxisKeys={['volume']}
      colors={['#2563eb']}
      className={cn('volume-chart', className)}
      {...props}
    />
  );
};

export const OHLCChart = ({ data, title, subtitle, className, ...props }) => {
  const transformedData = useMemo(() => {
    if (!data) return [];

    return data.map(item => ({
      ...item,
      date: item.date || item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      range: item.high - item.low,
      body: Math.abs(item.close - item.open),
      direction: item.close > item.open ? 'bullish' : 'bearish'
    }));
  }, [data]);

  return (
    <InstitutionalChart
      data={transformedData}
      type={CHART_TYPES.LINE}
      title={title}
      subtitle={subtitle}
      xAxisKey="date"
      yAxisKeys={['high', 'low', 'close']}
      className={cn('ohlc-chart', className)}
      {...props}
    />
  );
};

// ===== DASHBOARD CHART COMPONENT =====

export const DashboardChart = ({ data, config, title, subtitle, className, ...props }) => {
  const chartConfig = useMemo(
    () => ({
      type: CHART_TYPES.LINE,
      theme: 'financial',
      showGrid: true,
      showLegend: true,
      showTooltip: true,
      animation: true,
      ...config
    }),
    [config]
  );

  return (
    <InstitutionalChart
      data={data}
      title={title}
      subtitle={subtitle}
      className={cn('dashboard-chart', className)}
      {...chartConfig}
      {...props}
    />
  );
};

// ===== EXPORT ALL COMPONENTS =====
export { CHART_TYPES, CHART_THEMES };

export default InstitutionalChart;
