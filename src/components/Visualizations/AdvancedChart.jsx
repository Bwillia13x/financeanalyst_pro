// Advanced Chart Component - Phase 2 Integration
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Download,
  Settings,
  Maximize2,
  RefreshCw,
  Info
} from 'lucide-react';

// Import Phase 2 service
import { dataVisualizationService } from '../../services/visualization/dataVisualizationComponents';

export default function AdvancedChart({ 
  data, 
  type = 'line', 
  config = {}, 
  onExport,
  className = '',
  title,
  subtitle 
}) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const [chartId, setChartId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chartConfig, setChartConfig] = useState({
    theme: 'professional',
    showGrid: true,
    showTooltip: true,
    showLegend: true,
    animations: true,
    ...config
  });

  useEffect(() => {
    if (data && chartRef.current) {
      createChart();
    }

    return () => {
      if (chartId) {
        dataVisualizationService.removeChart(chartId);
      }
    };
  }, [data, type]);

  useEffect(() => {
    if (chartId && data) {
      updateChart();
    }
  }, [chartConfig]);

  const createChart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate unique container ID
      const containerId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      chartRef.current.id = containerId;

      let newChartId;

      switch (type) {
        case 'line':
          newChartId = dataVisualizationService.createAdvancedLineChart(
            containerId, 
            data, 
            chartConfig
          );
          break;

        case 'bar':
          newChartId = dataVisualizationService.createAdvancedBarChart(
            containerId, 
            data, 
            chartConfig
          );
          break;

        case 'scatter':
          newChartId = dataVisualizationService.createScatterPlot(
            containerId, 
            data, 
            chartConfig
          );
          break;

        case 'heatmap':
          newChartId = dataVisualizationService.createHeatmap(
            containerId, 
            data, 
            chartConfig
          );
          break;

        case 'dashboard':
          newChartId = dataVisualizationService.createFinancialDashboard(
            containerId, 
            data, 
            chartConfig
          );
          break;

        default:
          throw new Error(`Unsupported chart type: ${type}`);
      }

      setChartId(newChartId);
      setIsLoading(false);

    } catch (err) {
      console.error('Failed to create chart:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const updateChart = async () => {
    if (!chartId) return;

    try {
      await dataVisualizationService.updateChart(chartId, data);
    } catch (err) {
      console.error('Failed to update chart:', err);
      setError(err.message);
    }
  };

  const refreshChart = async () => {
    if (chartId) {
      dataVisualizationService.removeChart(chartId);
      setChartId(null);
    }
    await createChart();
  };

  const exportChart = async (format = 'png') => {
    if (!chartRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Get chart dimensions
      const rect = chartRef.current.getBoundingClientRect();
      canvas.width = rect.width * 2; // High DPI
      canvas.height = rect.height * 2;
      
      // Scale for high DPI
      ctx.scale(2, 2);
      
      // Convert SVG to canvas (simplified - would need proper implementation)
      const svgData = new XMLSerializer().serializeToString(chartRef.current.querySelector('svg'));
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // Download
        const link = document.createElement('a');
        link.download = `chart-${Date.now()}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
        
        if (onExport) {
          onExport({ format, data: canvas.toDataURL(`image/${format}`) });
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      
    } catch (err) {
      console.error('Failed to export chart:', err);
    }
  };

  const handleResize = () => {
    if (chartId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dataVisualizationService.resizeChart(chartId, rect.width, rect.height - 60); // Account for header
    }
  };

  const getChartIcon = () => {
    switch (type) {
      case 'line': return LineChart;
      case 'bar': return BarChart3;
      case 'scatter': return TrendingUp;
      case 'heatmap': return PieChart;
      default: return BarChart3;
    }
  };

  const ChartIcon = getChartIcon();

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <ChartIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Chart Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshChart}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            {title && (
              <h3 className="font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportChart('png')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={refreshChart}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Refresh Chart"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Chart Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {/* Handle fullscreen */}}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={chartConfig.theme}
                onChange={(e) => setChartConfig(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="dark">Dark</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGrid"
                checked={chartConfig.showGrid}
                onChange={(e) => setChartConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="showGrid" className="text-sm text-gray-700">
                Show Grid
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showLegend"
                checked={chartConfig.showLegend}
                onChange={(e) => setChartConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="showLegend" className="text-sm text-gray-700">
                Show Legend
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="animations"
                checked={chartConfig.animations}
                onChange={(e) => setChartConfig(prev => ({ ...prev, animations: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="animations" className="text-sm text-gray-700">
                Animations
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chart Container */}
      <div className="p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading chart...</span>
            </div>
          </div>
        )}
        
        <div
          ref={chartRef}
          className="w-full"
          style={{ minHeight: '300px' }}
        />
      </div>

      {/* Chart Info */}
      {data && (
        <div className="px-4 pb-4">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Info className="w-3 h-3 mr-1" />
              {Array.isArray(data) ? data.length : Object.keys(data).length} data points
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
