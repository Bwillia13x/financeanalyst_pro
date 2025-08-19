/**
 * Advanced Charting & Data Visualization Page
 * Professional-grade financial charting and analytics dashboard
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Layers,
  Grid3X3,
  Download,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Filter,
  Calendar,
  Search,
  Plus,
  Zap,
  X
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import CandlestickChart from '../components/Charts/CandlestickChart';
import CorrelationMatrix from '../components/Charts/CorrelationMatrix';
import CustomizableChart from '../components/Charts/CustomizableChart';
import HeatmapChart from '../components/Charts/HeatmapChart';
import RealTimeChart from '../components/Charts/RealTimeChart';
import SEOHead from '../components/SEO/SEOHead';
import secureApiClient from '../services/secureApiClient';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';

const AdvancedCharting = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);
  const [chartLayout, setChartLayout] = useState('grid');
  const [isRealTime, setIsRealTime] = useState(true);
  const [marketData, setMarketData] = useState({});
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState({
    charts: false,
    data: false,
    export: false
  });
  const [activeCharts, setActiveCharts] = useState([
    { id: 'price-chart', type: 'candlestick', symbol: 'AAPL', position: { x: 0, y: 0, w: 6, h: 4 } },
    { id: 'volume-chart', type: 'bar', symbol: 'AAPL', position: { x: 6, y: 0, w: 6, h: 2 } },
    { id: 'correlation-matrix', type: 'heatmap', symbols: selectedSymbols, position: { x: 6, y: 2, w: 6, h: 2 } },
    { id: 'performance-comparison', type: 'line', symbols: selectedSymbols.slice(0, 3), position: { x: 0, y: 4, w: 12, h: 3 } }
  ]);

  const timeframeOptions = [
    { value: '1D', label: '1 Day', interval: '1m' },
    { value: '5D', label: '5 Days', interval: '5m' },
    { value: '1M', label: '1 Month', interval: '1h' },
    { value: '3M', label: '3 Months', interval: '1d' },
    { value: '6M', label: '6 Months', interval: '1d' },
    { value: '1Y', label: '1 Year', interval: '1wk' },
    { value: '2Y', label: '2 Years', interval: '1wk' },
    { value: '5Y', label: '5 Years', interval: '1mo' },
    { value: 'MAX', label: 'Max', interval: '1mo' }
  ];

  const chartTypes = [
    { id: 'candlestick', name: 'Candlestick', icon: CandlestickChart, description: 'OHLC price data' },
    { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Price trends over time' },
    { id: 'bar', name: 'Bar Chart', icon: BarChart, description: 'Volume and comparison data' },
    { id: 'area', name: 'Area Chart', icon: Activity, description: 'Filled area charts' },
    { id: 'heatmap', name: 'Heatmap', icon: Grid3X3, description: 'Correlation matrices' },
    { id: 'scatter', name: 'Scatter Plot', icon: Target, description: 'Risk vs return analysis' }
  ];

  const realTimeUpdateRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadChartData();
    if (isRealTime) {
      startRealTimeUpdates();
    }
    return () => {
      if (realTimeUpdateRef.current) {
        clearInterval(realTimeUpdateRef.current);
      }
    };
  }, [selectedSymbols, selectedTimeframe]);

  // Real-time updates
  useEffect(() => {
    if (isRealTime) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }, [isRealTime]);

  const loadChartData = async() => {
    setLoading(prev => ({ ...prev, data: true }));

    try {
      // Load market data for selected symbols
      const dataPromises = selectedSymbols.map(async(symbol) => {
        try {
          const [quote, historical] = await Promise.all([
            secureApiClient.get(`/market-data/quote/${symbol}`),
            secureApiClient.get(`/market-data/historical/${symbol}?period=${selectedTimeframe}`)
          ]);

          return {
            symbol,
            quote: quote.data,
            historical: historical.data
          };
        } catch (error) {
          console.warn(`Failed to load data for ${symbol}:`, error);
          return {
            symbol,
            quote: generateMockQuote(symbol),
            historical: generateMockHistoricalData(symbol)
          };
        }
      });

      const results = await Promise.all(dataPromises);
      const newMarketData = {};

      results.forEach(result => {
        if (result) {
          newMarketData[result.symbol] = result;
        }
      });

      setMarketData(newMarketData);

      // Load portfolio data if available
      try {
        const portfolioResponse = await secureApiClient.get('/portfolio/current');
        setPortfolioData(portfolioResponse.data);
      } catch (error) {
        console.log('No portfolio data available');
      }

    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  const startRealTimeUpdates = () => {
    stopRealTimeUpdates(); // Clear existing interval

    realTimeUpdateRef.current = setInterval(async() => {
      try {
        // Update quotes for selected symbols
        const quotePromises = selectedSymbols.map(async(symbol) => {
          try {
            const response = await secureApiClient.get(`/market-data/quote/${symbol}`);
            return { symbol, quote: response.data };
          } catch (error) {
            return { symbol, quote: generateMockQuote(symbol) };
          }
        });

        const quotes = await Promise.all(quotePromises);

        setMarketData(prev => {
          const updated = { ...prev };
          quotes.forEach(({ symbol, quote }) => {
            if (updated[symbol]) {
              updated[symbol] = { ...updated[symbol], quote };
            }
          });
          return updated;
        });

      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, 5000); // Update every 5 seconds
  };

  const stopRealTimeUpdates = () => {
    if (realTimeUpdateRef.current) {
      clearInterval(realTimeUpdateRef.current);
      realTimeUpdateRef.current = null;
    }
  };

  const generateMockQuote = (symbol) => {
    const basePrice = { AAPL: 175, MSFT: 280, GOOGL: 2800, AMZN: 3200, TSLA: 250 }[symbol] || 100;
    const change = (Math.random() - 0.5) * 10;
    const price = basePrice + change;

    return {
      symbol,
      price: price.toFixed(2),
      change: change.toFixed(2),
      changePercent: ((change / basePrice) * 100).toFixed(2),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: price * Math.floor(Math.random() * 1000000000),
      timestamp: new Date().toISOString()
    };
  };

  const generateMockHistoricalData = (symbol) => {
    const data = [];
    const basePrice = { AAPL: 175, MSFT: 280, GOOGL: 2800, AMZN: 3200, TSLA: 250 }[symbol] || 100;
    let currentPrice = basePrice;

    const intervals = { '1D': 390, '5D': 78, '1M': 22, '3M': 65, '6M': 130, '1Y': 252, '2Y': 104, '5Y': 260, 'MAX': 520 }[selectedTimeframe] || 100;

    for (let i = 0; i < intervals; i++) {
      const change = (Math.random() - 0.5) * 5;
      currentPrice += change;
      const volume = Math.floor(Math.random() * 1000000);

      data.push({
        timestamp: new Date(Date.now() - (intervals - i) * 24 * 60 * 60 * 1000).toISOString(),
        open: currentPrice - Math.random() * 2,
        high: currentPrice + Math.random() * 3,
        low: currentPrice - Math.random() * 3,
        close: currentPrice,
        volume
      });
    }

    return data;
  };

  const addChart = (type, symbol = null, symbols = null) => {
    const newChart = {
      id: `chart-${Date.now()}`,
      type,
      symbol,
      symbols,
      position: { x: 0, y: 0, w: 6, h: 4 }
    };

    setActiveCharts(prev => [...prev, newChart]);
  };

  const removeChart = (chartId) => {
    setActiveCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const exportChart = async(chartId, format = 'png') => {
    setLoading(prev => ({ ...prev, export: true }));

    try {
      // In a real implementation, this would capture the chart and export it
      const chart = activeCharts.find(c => c.id === chartId);
      console.log(`Exporting chart ${chart.type} as ${format}`);

      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create download link (placeholder)
      const blob = new Blob(['Chart export placeholder'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${chartId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <SEOHead
        title="Advanced Charting & Data Visualization - FinanceAnalyst Pro"
        description="Professional-grade financial charting with real-time data, customizable dashboards, and advanced visualization tools for comprehensive market analysis."
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Advanced Charting</h1>
                  <p className="text-sm text-gray-600">Professional financial data visualization</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-500">
                  {isRealTime ? 'Live Data' : 'Static Data'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Real-time toggle */}
              <button
                onClick={() => setIsRealTime(!isRealTime)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isRealTime
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isRealTime ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRealTime ? 'Pause' : 'Start'} Live</span>
              </button>

              {/* Refresh button */}
              <button
                onClick={loadChartData}
                disabled={loading.data}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.data ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* Timeframe selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Timeframe:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {timeframeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeframe(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      selectedTimeframe === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Symbols:</span>
              <div className="flex flex-wrap gap-1">
                {selectedSymbols.map(symbol => (
                  <span
                    key={symbol}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                  >
                    <span>{symbol}</span>
                    <button
                      onClick={() => setSelectedSymbols(prev => prev.filter(s => s !== symbol))}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs hover:bg-gray-200 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Layout selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Layout:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartLayout('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    chartLayout === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Grid Layout"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartLayout('stack')}
                  className={`p-2 rounded-md transition-colors ${
                    chartLayout === 'stack' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Stacked Layout"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Dashboard */}
      <div className="p-6">
        {chartLayout === 'grid' ? (
          <div className="grid grid-cols-12 gap-4 min-h-screen">
            {activeCharts.map(chart => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  `col-span-${chart.position.w} row-span-${chart.position.h}`
                }`}
              >
                {/* Chart Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded">
                      {React.createElement(
                        chartTypes.find(t => t.id === chart.type)?.icon || BarChart3,
                        { className: 'w-4 h-4 text-blue-600' }
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {chartTypes.find(t => t.id === chart.type)?.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {chart.symbol || chart.symbols?.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => exportChart(chart.id, 'png')}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export Chart"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeChart(chart.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Remove Chart"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Chart Content */}
                <div className="p-4 h-64">
                  <ChartRenderer
                    chart={chart}
                    marketData={marketData}
                    timeframe={selectedTimeframe}
                    isRealTime={isRealTime}
                  />
                </div>
              </motion.div>
            ))}

            {/* Add Chart Button */}
            <div className="col-span-6 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-64 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add Chart</h3>
                <div className="grid grid-cols-2 gap-2">
                  {chartTypes.slice(0, 4).map(type => (
                    <button
                      key={type.id}
                      onClick={() => addChart(type.id, selectedSymbols[0])}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      <type.icon className="w-4 h-4" />
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeCharts.map(chart => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Chart Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded">
                      {React.createElement(
                        chartTypes.find(t => t.id === chart.type)?.icon || BarChart3,
                        { className: 'w-4 h-4 text-blue-600' }
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {chartTypes.find(t => t.id === chart.type)?.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {chart.symbol || chart.symbols?.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => exportChart(chart.id, 'png')}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeChart(chart.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Chart Content */}
                <div className="p-4 h-96">
                  <ChartRenderer
                    chart={chart}
                    marketData={marketData}
                    timeframe={selectedTimeframe}
                    isRealTime={isRealTime}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Chart Renderer Component
const ChartRenderer = ({ chart, marketData, timeframe, isRealTime }) => {
  const data = chart.symbol ? marketData[chart.symbol] : null;
  const multiData = chart.symbols ? chart.symbols.map(s => marketData[s]).filter(Boolean) : [];

  if (!data && multiData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // This is a placeholder - in a real implementation, you'd render actual chart components
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          {React.createElement(
            {
              candlestick: CandlestickChart,
              line: LineChart,
              bar: BarChart,
              area: Activity,
              heatmap: Grid3X3,
              scatter: Target
            }[chart.type] || BarChart3,
            { className: 'w-8 h-8 text-blue-600' }
          )}
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">
          {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
        </h3>
        <p className="text-sm text-gray-600">
          {chart.symbol || chart.symbols?.join(', ')} • {timeframe}
        </p>
        {isRealTime && (
          <div className="flex items-center justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-600">Live Updates</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCharting;
