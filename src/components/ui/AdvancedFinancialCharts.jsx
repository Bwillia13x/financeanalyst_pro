import { TrendingUp, BarChart3, LineChart as LineChartIcon, PieChart, Settings } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
  Cell
} from 'recharts';

import { cn } from '../../utils/cn';

/**
 * Advanced financial chart components with interactive features and real-time updates
 */

// Financial-specific tooltip with proper formatting
const FinancialTooltip = ({ active, payload, label, formatType = 'currency' }) => {
  if (!active || !payload?.length) return null;

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return 'N/A';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'decimal':
        return value.toFixed(2);
      case 'shares':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  return (
    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
      <p className="font-medium text-slate-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between space-x-3 mb-1">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">{entry.name}</span>
          </div>
          <span className="text-sm font-medium text-slate-900">
            {formatValue(entry.value, entry.payload?.formatType || formatType)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Revenue and Profit Trends Chart
export const RevenueProfitChart = ({
  data = [],
  height = 300,
  showBrush = true,
  className
}) => {
  const [selectedPeriod, _setSelectedPeriod] = useState(null);

  const chartData = useMemo(() =>
    data.map(item => ({
      ...item,
      profitMargin: item.revenue > 0 ? (item.netIncome / item.revenue) * 100 : 0
    })), [data]
  );

  return (
    <div className={cn('bg-white p-6 border border-slate-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Revenue & Profit Trends</h3>
          <p className="text-sm text-slate-600">Historical performance with profit margins</p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span className="text-sm text-slate-600">Growth Analysis</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="period"
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            yAxisId="currency"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={value => `$${(value / 1000000).toFixed(0)}M`}
          />
          <YAxis
            yAxisId="percentage"
            orientation="right"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={value => `${value.toFixed(1)}%`}
          />

          <Tooltip content={<FinancialTooltip formatType="currency" />} />
          <Legend />

          <Bar
            yAxisId="currency"
            dataKey="revenue"
            name="Revenue"
            fill="#3b82f6"
            fillOpacity={0.8}
          />
          <Bar
            yAxisId="currency"
            dataKey="netIncome"
            name="Net Income"
            fill="#10b981"
            fillOpacity={0.8}
          />
          <Line
            yAxisId="percentage"
            type="monotone"
            dataKey="profitMargin"
            name="Profit Margin %"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          />

          {selectedPeriod && (
            <ReferenceLine
              x={selectedPeriod}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label="Selected"
            />
          )}

          {showBrush && <Brush dataKey="period" height={30} stroke="#3b82f6" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Cash Flow Waterfall Chart
export const CashFlowWaterfallChart = ({
  data = [],
  height = 300,
  className
}) => {
  const waterfallData = useMemo(() => {
    let runningTotal = 0;
    return data.map((item, _index) => {
      const start = runningTotal;
      runningTotal += item.value;
      return {
        ...item,
        start,
        end: runningTotal,
        isPositive: item.value >= 0
      };
    });
  }, [data]);

  return (
    <div className={cn('bg-white p-6 border border-slate-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cash Flow Analysis</h3>
          <p className="text-sm text-slate-600">Operating, investing, and financing activities</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="category"
            stroke="#64748b"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={value => `$${(value / 1000000).toFixed(0)}M`}
          />

          <Tooltip content={<FinancialTooltip formatType="currency" />} />

          <Bar dataKey="value" name="Cash Flow">
            {waterfallData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isPositive ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Valuation Multiples Comparison
export const ValuationMultiplesChart = ({
  data = [],
  benchmarks = {},
  height = 300,
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState('PE');

  const metrics = ['PE', 'PB', 'PS', 'EV_EBITDA'];
  const metricLabels = {
    PE: 'P/E Ratio',
    PB: 'P/B Ratio',
    PS: 'P/S Ratio',
    EV_EBITDA: 'EV/EBITDA'
  };

  return (
    <div className={cn('bg-white p-6 border border-slate-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Valuation Multiples</h3>
          <p className="text-sm text-slate-600">Comparison vs industry benchmarks</p>
        </div>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-3 py-1 border border-slate-300 rounded text-sm"
        >
          {metrics.map(metric => (
            <option key={metric} value={metric}>
              {metricLabels[metric]}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="company"
            stroke="#64748b"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={value => `${value.toFixed(1)}x`}
          />

          <Tooltip content={<FinancialTooltip formatType="decimal" />} />

          <Bar
            dataKey={selectedMetric}
            name={metricLabels[selectedMetric]}
            fill="#3b82f6"
          />

          {benchmarks[selectedMetric] && (
            <ReferenceLine
              y={benchmarks[selectedMetric]}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: 'Industry Avg', position: 'top' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Portfolio Allocation Donut Chart
export const PortfolioAllocationChart = ({
  data = [],
  _height = 300,
  _showPercentages = true,
  className
}) => {
  const [_activeIndex, _setActiveIndex] = useState(-1);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const pieData = data.map((item, index) => ({
    ...item,
    percentage: (item.value / total) * 100,
    color: colors[index % colors.length]
  }));

  return (
    <div className={cn('bg-white p-6 border border-slate-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Portfolio Allocation</h3>
          <p className="text-sm text-slate-600">Asset distribution by sector/type</p>
        </div>
        <PieChart className="w-5 h-5 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart placeholder - would use actual PieChart component */}
        <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
          <div className="text-center">
            <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Interactive pie chart would render here</p>
            <p className="text-xs text-slate-500">Using recharts PieChart component</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Holdings Breakdown</h4>
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-700">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  ${item.value.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Monte Carlo Simulation Results
export const MonteCarloChart = ({
  data = [],
  confidence = 95,
  height = 300,
  className
}) => {
  const [_selectedPath, _setSelectedPath] = useState(null);

  const confidenceData = useMemo(() => {
    const sortedValues = [...data].sort((a, b) => a.finalValue - b.finalValue);
    const lowerIndex = Math.floor(((100 - confidence) / 2) * sortedValues.length / 100);
    const upperIndex = Math.ceil((confidence + (100 - confidence) / 2) * sortedValues.length / 100);

    return {
      lower: sortedValues[lowerIndex]?.finalValue || 0,
      upper: sortedValues[upperIndex]?.finalValue || 0,
      median: sortedValues[Math.floor(sortedValues.length / 2)]?.finalValue || 0
    };
  }, [data, confidence]);

  return (
    <div className={cn('bg-white p-6 border border-slate-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Monte Carlo Analysis</h3>
          <p className="text-sm text-slate-600">
            {confidence}% confidence interval: ${confidenceData.lower.toLocaleString()} - ${confidenceData.upper.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-900">
            Median: ${confidenceData.median.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            {data.length} simulations
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="period"
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={value => `$${(value / 1000).toFixed(0)}K`}
          />

          <Tooltip content={<FinancialTooltip formatType="currency" />} />

          <Area
            type="monotone"
            dataKey="upperBound"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="median"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            name="Median"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.1}
            name="Lower Bound"
          />

          <ReferenceLine
            y={confidenceData.median}
            stroke="#10b981"
            strokeDasharray="5 5"
            label="Median Outcome"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main chart container with type switching
export const FinancialChartContainer = ({
  chartType = 'revenue',
  data,
  height = 400,
  className
}) => {
  const [currentType, setCurrentType] = useState(chartType);

  const chartTypes = [
    { id: 'revenue', label: 'Revenue & Profit', icon: BarChart3 },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'valuation', label: 'Valuation', icon: LineChartIcon },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart }
  ];

  const renderChart = () => {
    switch (currentType) {
      case 'revenue':
        return <RevenueProfitChart data={data.revenue} height={height - 100} />;
      case 'cashflow':
        return <CashFlowWaterfallChart data={data.cashflow} height={height - 100} />;
      case 'valuation':
        return <ValuationMultiplesChart data={data.valuation} height={height - 100} />;
      case 'portfolio':
        return <PortfolioAllocationChart data={data.portfolio} height={height - 100} />;
      default:
        return <RevenueProfitChart data={data.revenue} height={height - 100} />;
    }
  };

  return (
    <div className={cn('bg-white border border-slate-200 rounded-lg', className)}>
      {/* Chart Type Selector */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          {chartTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setCurrentType(type.id)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentType === type.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
        <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Chart Content */}
      <div className="p-0">
        {renderChart()}
      </div>
    </div>
  );
};

export default FinancialChartContainer;
