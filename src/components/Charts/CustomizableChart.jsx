/**
 * Customizable Chart Component
 * Flexible chart builder with multiple visualization types and customization options
 */

import {
  Settings,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Target
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  Line,
  Area,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CustomizableChart = ({
  data = [],
  title = 'Custom Chart',
  height: _height = 400,
  onSettingsChange
}) => {
  const [chartSettings, setChartSettings] = useState({
    type: 'line',
    theme: 'light',
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    xAxisKey: 'timestamp',
    yAxisKeys: ['price'],
    title,
    subtitle: '',
    smooth: true,
    strokeWidth: 2,
    fillOpacity: 0.1
  });

  const [showSettings, setShowSettings] = useState(false);

  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || !data.length) return [];

    return data.map(item => {
      const processed = { ...item };

      // Format timestamp for display
      if (processed.timestamp) {
        processed.displayTime = new Date(processed.timestamp).toLocaleTimeString();
        processed.displayDate = new Date(processed.timestamp).toLocaleDateString();
      }

      return processed;
    });
  }, [data]);

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: TrendingUp, component: LineChart },
    { id: 'area', name: 'Area Chart', icon: Activity, component: AreaChart },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3, component: BarChart },
    { id: 'scatter', name: 'Scatter Plot', icon: Target, component: ScatterChart },
    { id: 'pie', name: 'Pie Chart', icon: PieIcon, component: PieChart }
  ];

  const colorThemes = {
    light: {
      background: '#ffffff',
      grid: '#e5e7eb',
      text: '#374151',
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
    },
    dark: {
      background: '#1f2937',
      grid: '#4b5563',
      text: '#f3f4f6',
      colors: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa']
    },
    professional: {
      background: '#ffffff',
      grid: '#d1d5db',
      text: '#111827',
      colors: ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed']
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...chartSettings, [key]: value };
    setChartSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const CustomTooltip = ({ active, payload, label: _label }) => {
    if (!active || !payload || !payload.length) return null;

    const theme = colorThemes[chartSettings.theme];

    return (
      <div
        className="p-3 border rounded-lg shadow-lg"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.grid,
          color: theme.text
        }}
      >
        <p className="font-semibold">{_label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}:</span>
              </div>
              <span className="font-mono text-sm font-semibold">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    const theme = colorThemes[chartSettings.theme];
    const ChartComponent =
      chartTypes.find(t => t.id === chartSettings.type)?.component || LineChart;

    if (!processedData.length) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No data available for visualization</p>
          </div>
        </div>
      );
    }

    if (chartSettings.type === 'pie') {
      // Special handling for pie charts
      const pieData = chartSettings.yAxisKeys.map((key, index) => ({
        name: key,
        value: processedData.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0),
        fill: theme.colors[index % theme.colors.length]
      }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
          <XAxis
            dataKey={chartSettings.xAxisKey}
            stroke={theme.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={theme.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={value =>
              typeof value === 'number' && value > 1000
                ? `${(value / 1000).toFixed(1)}K`
                : value.toLocaleString()
            }
          />
          {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
          {chartSettings.showLegend && <Legend />}

          {chartSettings.yAxisKeys.map((key, index) => {
            const color = theme.colors[index % theme.colors.length];

            if (chartSettings.type === 'line') {
              return (
                <Line
                  key={key}
                  type={chartSettings.smooth ? 'monotone' : 'linear'}
                  dataKey={key}
                  stroke={color}
                  strokeWidth={chartSettings.strokeWidth}
                  dot={false}
                  connectNulls={false}
                />
              );
            } else if (chartSettings.type === 'area') {
              return (
                <Area
                  key={key}
                  type={chartSettings.smooth ? 'monotone' : 'linear'}
                  dataKey={key}
                  stroke={color}
                  fill={color}
                  strokeWidth={chartSettings.strokeWidth}
                  fillOpacity={chartSettings.fillOpacity}
                />
              );
            } else if (chartSettings.type === 'bar') {
              return <Bar key={key} dataKey={key} fill={color} radius={[2, 2, 0, 0]} />;
            } else if (chartSettings.type === 'scatter') {
              return <Scatter key={key} dataKey={key} fill={color} />;
            }

            return null;
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{chartSettings.title}</h3>
          {chartSettings.subtitle && (
            <p className="text-sm text-gray-600">{chartSettings.subtitle}</p>
          )}
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Chart Settings"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chart Type */}
            <div>
              <label htmlFor="chart-type" className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <select
                id="chart-type"
                value={chartSettings.type}
                onChange={e => handleSettingChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {chartTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div>
              <label htmlFor="chart-theme" className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                id="chart-theme"
                value={chartSettings.theme}
                onChange={e => handleSettingChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {Object.keys(colorThemes).map(theme => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stroke Width */}
            <div>
              <label htmlFor="line-width" className="block text-sm font-medium text-gray-700 mb-2">
                Line Width
              </label>
              <input
                id="line-width"
                type="range"
                min="1"
                max="5"
                value={chartSettings.strokeWidth}
                onChange={e => handleSettingChange('strokeWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Fill Opacity */}
            <div>
              <label
                htmlFor="fill-opacity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fill Opacity
              </label>
              <input
                id="fill-opacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={chartSettings.fillOpacity}
                onChange={e => handleSettingChange('fillOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartSettings.showGrid}
                onChange={e => handleSettingChange('showGrid', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Grid</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartSettings.showLegend}
                onChange={e => handleSettingChange('showLegend', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Legend</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartSettings.showTooltip}
                onChange={e => handleSettingChange('showTooltip', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Tooltips</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartSettings.smooth}
                onChange={e => handleSettingChange('smooth', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Smooth Lines</span>
            </label>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="chart-title" className="block text-sm font-medium text-gray-700 mb-2">
              Chart Title
            </label>
            <input
              id="chart-title"
              type="text"
              value={chartSettings.title}
              onChange={e => handleSettingChange('title', e.target.value)}
              placeholder="Enter chart title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="flex-1 min-h-0">{renderChart()}</div>
    </div>
  );
};

export default CustomizableChart;
