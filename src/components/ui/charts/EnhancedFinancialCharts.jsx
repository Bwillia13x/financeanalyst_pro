/**
 * Enhanced Financial Charts Component
 * Professional-grade interactive charts for financial data visualization
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Download,
  Maximize,
  Settings,
  Eye,
  EyeOff,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
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
  Cell,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  TreemapChart,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

// Custom color schemes for financial data
const FINANCIAL_COLOR_SCHEMES = {
  professional: {
    primary: '#1e40af',
    secondary: '#059669',
    tertiary: '#dc2626',
    quaternary: '#7c3aed',
    gradient: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
  },
  bloomberg: {
    primary: '#ff7300',
    secondary: '#00ff41',
    tertiary: '#ff0040',
    quaternary: '#ffff00',
    gradient: ['#ff7300', '#ff8533', '#ff9966', '#ffad99']
  },
  monochrome: {
    primary: '#374151',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    quaternary: '#d1d5db',
    gradient: ['#111827', '#374151', '#6b7280', '#9ca3af']
  }
};

/**
 * Enhanced Tooltip Component
 */
const CustomTooltip = ({ active, payload, label, formatters = {} }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 min-w-[200px]"
    >
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">{entry.dataKey}:</span>
          </div>
          <span className="font-mono text-sm">
            {formatters[entry.dataKey]
              ? formatters[entry.dataKey](entry.value)
              : entry.value?.toLocaleString()
            }
          </span>
        </div>
      ))}
    </motion.div>
  );
};

/**
 * Chart Controls Component
 */
const ChartControls = ({
  chartType,
  onChartTypeChange,
  colorScheme,
  onColorSchemeChange,
  showLegend,
  onToggleLegend,
  onExport,
  onFullscreen,
  onZoomIn,
  onZoomOut,
  onReset,
  visibleSeries,
  onToggleSeries,
  seriesOptions = []
}) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowControls(!showControls)}
          className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Settings size={16} />
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg border border-slate-200"
            >
              {/* Chart Type Selector */}
              <select
                value={chartType}
                onChange={(e) => onChartTypeChange(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              >
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="bar">Bar</option>
                <option value="composed">Combined</option>
                <option value="scatter">Scatter</option>
              </select>

              {/* Color Scheme Selector */}
              <select
                value={colorScheme}
                onChange={(e) => onColorSchemeChange(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              >
                <option value="professional">Professional</option>
                <option value="bloomberg">Bloomberg</option>
                <option value="monochrome">Monochrome</option>
              </select>

              {/* Series Visibility */}
              {seriesOptions.length > 0 && (
                <div className="flex items-center gap-1">
                  {seriesOptions.map(series => (
                    <button
                      key={series.key}
                      onClick={() => onToggleSeries(series.key)}
                      className={`p-1 rounded transition-colors ${
                        visibleSeries.includes(series.key)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={series.label}
                    >
                      {visibleSeries.includes(series.key) ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  onClick={onToggleLegend}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Toggle Legend"
                >
                  <PieChart size={12} />
                </button>
                <button
                  onClick={onZoomIn}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  onClick={onZoomOut}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut size={12} />
                </button>
                <button
                  onClick={onReset}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Reset View"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={onExport}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Export Chart"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={onFullscreen}
                  className="p-1 hover:bg-slate-100 rounded"
                  title="Fullscreen"
                >
                  <Maximize size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Main Enhanced Financial Charts Component
 */
const EnhancedFinancialCharts = ({
  data = [],
  title = 'Financial Chart',
  type = 'line',
  series = [],
  height = 400,
  className = '',
  showBrush = false,
  showGrid = true,
  animations = true,
  colorScheme = 'professional',
  formatters = {},
  referenceLines = [],
  onDataPointClick = null,
  realTimeUpdates = false,
  updateInterval = 5000
}) => {
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState(type);
  const [currentColorScheme, setCurrentColorScheme] = useState(colorScheme);
  const [showLegend, setShowLegend] = useState(true);
  const [visibleSeries, setVisibleSeries] = useState(series.map(s => s.key));
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Get current color palette
  const colors = FINANCIAL_COLOR_SCHEMES[currentColorScheme];

  // Filter data for visible series
  const filteredSeries = series.filter(s => visibleSeries.includes(s.key));

  // Device detection for responsive behavior
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Handle real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Trigger data refresh (implementation depends on data source)
      if (onDataPointClick) {
        onDataPointClick({ type: 'refresh' });
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdates, updateInterval, onDataPointClick]);

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;

    // Create canvas for export
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);

    // Export as PNG
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [title]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleToggleSeries = useCallback((seriesKey) => {
    setVisibleSeries(prev =>
      prev.includes(seriesKey)
        ? prev.filter(k => k !== seriesKey)
        : [...prev, seriesKey]
    );
  }, []);

  const renderChart = () => {
    // Responsive margins and properties
    const commonProps = {
      data,
      margin: isMobile
        ? { top: 10, right: 10, left: 10, bottom: 5 }
        : isTablet
          ? { top: 15, right: 20, left: 15, bottom: 5 }
          : { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const chartComponents = {
      line: (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            tickFormatter={(value) => formatters.yAxis ? formatters.yAxis(value) : value}
          />
          <Tooltip content={<CustomTooltip formatters={formatters} />} />
          {showLegend && <Legend />}
          {filteredSeries.map((s, index) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={colors.gradient[index % colors.gradient.length]}
              strokeWidth={2}
              dot={{ fill: colors.gradient[index % colors.gradient.length], strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: colors.gradient[index % colors.gradient.length], strokeWidth: 2 }}
              animationDuration={animations ? 1500 : 0}
              connectNulls={false}
            />
          ))}
          {referenceLines.map((line, index) => (
            <ReferenceLine
              key={index}
              y={line.value}
              stroke={line.color || colors.tertiary}
              strokeDasharray={line.dashArray || '5 5'}
              label={line.label}
            />
          ))}
          {showBrush && <Brush dataKey="period" height={30} />}
        </LineChart>
      ),

      area: (
        <AreaChart {...commonProps}>
          <defs>
            {filteredSeries.map((s, index) => (
              <linearGradient
                key={s.key} id={`gradient-${s.key}`} x1="0"
                y1="0" x2="0" y2="1"
              >
                <stop offset="5%" stopColor={colors.gradient[index % colors.gradient.length]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.gradient[index % colors.gradient.length]} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip content={<CustomTooltip formatters={formatters} />} />
          {showLegend && <Legend />}
          {filteredSeries.map((s, index) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={colors.gradient[index % colors.gradient.length]}
              fillOpacity={1}
              fill={`url(#gradient-${s.key})`}
              animationDuration={animations ? 1500 : 0}
            />
          ))}
        </AreaChart>
      ),

      bar: (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip content={<CustomTooltip formatters={formatters} />} />
          {showLegend && <Legend />}
          {filteredSeries.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={colors.gradient[index % colors.gradient.length]}
              animationDuration={animations ? 1500 : 0}
            >
              {data.map((entry, entryIndex) => (
                <Cell
                  key={entryIndex}
                  fill={colors.gradient[index % colors.gradient.length]}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      ),

      composed: (
        <ComposedChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip content={<CustomTooltip formatters={formatters} />} />
          {showLegend && <Legend />}
          {filteredSeries.map((s, index) => {
            if (s.type === 'bar') {
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  fill={colors.gradient[index % colors.gradient.length]}
                  animationDuration={animations ? 1500 : 0}
                />
              );
            } else {
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={colors.gradient[index % colors.gradient.length]}
                  strokeWidth={2}
                  animationDuration={animations ? 1500 : 0}
                />
              );
            }
          })}
        </ComposedChart>
      ),

      scatter: (
        <ScatterChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis dataKey="y" tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip content={<CustomTooltip formatters={formatters} />} />
          {showLegend && <Legend />}
          {filteredSeries.map((s, index) => (
            <Scatter
              key={s.key}
              name={s.label}
              data={data}
              fill={colors.gradient[index % colors.gradient.length]}
            />
          ))}
        </ScatterChart>
      )
    };

    return chartComponents[chartType] || chartComponents.line;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-lg border border-slate-200 shadow-sm ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      } ${className}`}
    >
      {/* Chart Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {realTimeUpdates && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500">Live Updates</span>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <ChartControls
        chartType={chartType}
        onChartTypeChange={setChartType}
        colorScheme={currentColorScheme}
        onColorSchemeChange={setCurrentColorScheme}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onExport={handleExport}
        onFullscreen={handleFullscreen}
        onZoomIn={() => {/* Implement zoom functionality */}}
        onZoomOut={() => {/* Implement zoom functionality */}}
        onReset={() => setZoomDomain(null)}
        visibleSeries={visibleSeries}
        onToggleSeries={handleToggleSeries}
        seriesOptions={series}
      />

      {/* Chart Container */}
      <div className={`${isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-4'}`}>
        <ResponsiveContainer
          width="100%"
          height={isMobile ? Math.min(height, 300) : isTablet ? Math.min(height, 350) : height}
        >
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="px-4 pb-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {data.length} data points • {filteredSeries.length} of {series.length} series visible
        </span>
        <span>
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
};

export default EnhancedFinancialCharts;
