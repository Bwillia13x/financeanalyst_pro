import React, { useState, useEffect } from 'react';

import Icon from '../../components/AppIcon';
import SEOHead from '../../components/SEO/SEOHead';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { useFinancialAccessibility } from '../../hooks/useAccessibility';
import { dataValidationService } from '../../services/dataValidationService';
import { enhancedApiService } from '../../services/enhancedApiService';
import realTimeDataService from '../../services/realTimeDataService';
import { trackFinancialComponentPerformance } from '../../utils/performanceMonitoring';

import ApiStatusPanel from './components/ApiStatusPanel';
import BulkOperationsPanel from './components/BulkOperationsPanel';
import ConnectionStatus from './components/ConnectionStatus';
import DataSourceToggle from './components/DataSourceToggle';
import MarketDataWidget from './components/MarketDataWidget';
import SymbolSearch from './components/SymbolSearch';
import WatchlistPanel from './components/WatchlistPanel';

// Import real data services

const RealTimeMarketDataCenter = () => {
  // Add accessibility and performance monitoring
  const { elementRef, testFinancialFeatures } = useFinancialAccessibility('market-data-center');

  const [dataSources, setDataSources] = useState([
    { id: 'yahoo', name: 'Yahoo Finance', enabled: true, status: 'connected', latency: 12, requiresKey: false },
    { id: 'alpha_vantage', name: 'Alpha Vantage', enabled: false, status: 'disconnected', latency: 25, requiresKey: true },
    { id: 'fmp', name: 'Financial Modeling Prep', enabled: false, status: 'disconnected', latency: 18, requiresKey: true },
    { id: 'sec_edgar', name: 'SEC EDGAR', enabled: true, status: 'connected', latency: 45, requiresKey: false }
  ]);

  const [connectionHealth, setConnectionHealth] = useState({
    overall: 'good',
    sources: {
      yahoo: 'connected',
      alpha_vantage: 'disconnected',
      fmp: 'disconnected',
      sec_edgar: 'connected'
    }
  });

  const [realDataEnabled, setRealDataEnabled] = useState(false);
  const [apiHealthStatus, setApiHealthStatus] = useState({});
  const [dataQuality, setDataQuality] = useState({});

  const [widgets, setWidgets] = useState([
    {
      id: 'widget-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currentValue: 182.52,
      change: 2.15,
      changePercent: 1.19,
      valueType: 'currency',
      dayHigh: 184.3,
      dayLow: 180.15,
      volume: 52847392,
      source: 'Bloomberg',
      lastUpdate: new Date(Date.now() - 2000),
      sparklineData: [180.25, 181.15, 180.95, 182.1, 181.85, 182.52]
    },
    {
      id: 'widget-2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      currentValue: 378.85,
      change: -1.25,
      changePercent: -0.33,
      valueType: 'currency',
      dayHigh: 381.2,
      dayLow: 377.5,
      volume: 28394751,
      source: 'FactSet',
      lastUpdate: new Date(Date.now() - 1500),
      sparklineData: [380.15, 379.85, 378.95, 379.4, 378.2, 378.85]
    },
    {
      id: 'widget-3',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      currentValue: 2847.35,
      change: 15.8,
      changePercent: 0.56,
      valueType: 'currency',
      dayHigh: 2855.0,
      dayLow: 2830.15,
      volume: 1847392,
      source: 'Bloomberg',
      lastUpdate: new Date(Date.now() - 3000),
      sparklineData: [2835.25, 2841.15, 2838.95, 2845.1, 2843.85, 2847.35]
    },
    {
      id: 'widget-4',
      symbol: 'US10Y',
      name: 'US 10-Year Treasury',
      currentValue: 4.285,
      change: 0.025,
      changePercent: 0.59,
      valueType: 'percentage',
      dayHigh: 4.295,
      dayLow: 4.26,
      volume: null,
      source: 'Refinitiv',
      lastUpdate: new Date(Date.now() - 5000),
      sparklineData: [4.26, 4.27, 4.275, 4.28, 4.285, 4.285]
    }
  ]);

  const [watchlist, setWatchlist] = useState([
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      sector: 'Technology',
      price: 182.52,
      change: 2.15,
      changePercent: 1.19
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      sector: 'Technology',
      price: 378.85,
      change: -1.25,
      changePercent: -0.33
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      exchange: 'NASDAQ',
      sector: 'Consumer Discretionary',
      price: 248.42,
      change: 5.67,
      changePercent: 2.34
    }
  ]);

  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('2 min ago');
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Initialize real data services and check API health
  useEffect(() => {
    const initializeRealData = async() => {
      try {
        // Ensure backend base URL is initialized from environment at runtime
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        enhancedApiService.setBaseUrl(base);

        // Check API health status
        const healthStatus = enhancedApiService.getSourceHealthStatus();
        setApiHealthStatus(healthStatus);

        // Update data sources based on API availability
        setDataSources(prevSources =>
          prevSources.map(source => {
            const health = healthStatus[source.id.toUpperCase()];
            if (health) {
              return {
                ...source,
                enabled: health.hasValidApiKey || !health.requiresApiKey,
                status: health.hasValidApiKey || !health.requiresApiKey ? 'connected' : 'disconnected'
              };
            }
            return source;
          })
        );

        // Enable real data if we have at least one working API
        const hasWorkingApi = Object.values(healthStatus).some(
          health => health.hasValidApiKey || !health.requiresApiKey
        );
        setRealDataEnabled(hasWorkingApi);

      } catch (error) {
        console.error('Failed to initialize real data services:', error);
      }
    };

    initializeRealData();
  }, []);

  // Real-time updates with actual data or simulation
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(async() => {
      if (realDataEnabled) {
        // Fetch real data for each widget
        const updatedWidgets = await Promise.all(
          widgets.map(async(widget) => {
            try {
              const marketData = await enhancedApiService.fetchRealTimeMarketData(widget.symbol);
              const validation = dataValidationService.validateData(marketData, 'marketData');

              return {
                ...widget,
                currentValue: marketData.currentPrice,
                change: marketData.change,
                changePercent: marketData.changePercent,
                dayHigh: marketData.dayHigh,
                dayLow: marketData.dayLow,
                volume: marketData.volume,
                lastUpdate: new Date(),
                source: marketData.source,
                dataQuality: validation.qualityScore,
                sparklineData: [
                  ...widget.sparklineData.slice(1),
                  marketData.currentPrice
                ]
              };
            } catch (error) {
              console.warn(`Failed to fetch real data for ${widget.symbol}, using simulation:`, error);
              // Fallback to simulation
              return {
                ...widget,
                currentValue: widget.currentValue + (Math.random() - 0.5) * 2,
                change: (Math.random() - 0.5) * 5,
                changePercent: (Math.random() - 0.5) * 2,
                lastUpdate: new Date(),
                source: 'Simulation',
                sparklineData: [
                  ...widget.sparklineData.slice(1),
                  widget.currentValue + (Math.random() - 0.5) * 2
                ]
              };
            }
          })
        );
        setWidgets(updatedWidgets);
      } else {
        // Fallback to simulation
        setWidgets(prevWidgets =>
          prevWidgets.map(widget => ({
            ...widget,
            currentValue: widget.currentValue + (Math.random() - 0.5) * 2,
            change: (Math.random() - 0.5) * 5,
            changePercent: (Math.random() - 0.5) * 2,
            lastUpdate: new Date(),
            source: 'Simulation',
            sparklineData: [
              ...widget.sparklineData.slice(1),
              widget.currentValue + (Math.random() - 0.5) * 2
            ]
          }))
        );
      }
      setLastUpdate('Just now');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isAutoRefresh, realDataEnabled, widgets]);

  const handleDataSourceToggle = sourceId => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId ? { ...source, enabled: !source.enabled } : source
      )
    );
  };

  const handleSymbolSelect = async(symbol) => {
    try {
      let marketData;
      let source = 'Simulation';
      let dataQuality = 75;

      if (realDataEnabled) {
        try {
          marketData = await enhancedApiService.fetchRealTimeMarketData(symbol.symbol);
          const validation = dataValidationService.validateData(marketData, 'marketData');
          source = marketData.source;
          dataQuality = validation.qualityScore;
        } catch (error) {
          console.warn(`Failed to fetch real data for ${symbol.symbol}, using simulation:`, error);
          marketData = null;
        }
      }

      const newWidget = {
        id: `widget-${Date.now()}`,
        symbol: symbol.symbol,
        name: symbol.name,
        currentValue: marketData?.currentPrice || Math.random() * 1000 + 50,
        change: marketData?.change || (Math.random() - 0.5) * 10,
        changePercent: marketData?.changePercent || (Math.random() - 0.5) * 5,
        valueType: 'currency',
        dayHigh: marketData?.dayHigh || Math.random() * 1000 + 60,
        dayLow: marketData?.dayLow || Math.random() * 1000 + 40,
        volume: marketData?.volume || Math.floor(Math.random() * 100000000),
        source,
        dataQuality,
        lastUpdate: new Date(),
        sparklineData: Array.from({ length: 6 }, () =>
          marketData?.currentPrice || Math.random() * 1000 + 50
        )
      };

      setWidgets(prev => [...prev, newWidget]);

      // Subscribe to real-time updates for this symbol
      if (realDataEnabled) {
        realTimeDataService.subscribe(symbol.symbol, 'marketData', (data) => {
          setWidgets(prevWidgets =>
            prevWidgets.map(widget =>
              widget.symbol === symbol.symbol
                ? {
                  ...widget,
                  currentValue: data.currentPrice,
                  change: data.change,
                  changePercent: data.changePercent,
                  lastUpdate: new Date(data.timestamp),
                  source: data.source
                }
                : widget
            )
          );
        });
      }
    } catch (error) {
      console.error('Error adding symbol:', error);
    }
  };

  const handleAddToWatchlist = symbol => {
    if (!watchlist.some(item => item.symbol === symbol.symbol)) {
      setWatchlist(prev => [
        ...prev,
        {
          ...symbol,
          price: Math.random() * 1000 + 50,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5
        }
      ]);
    }
  };

  const handleRemoveFromWatchlist = symbol => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  const handleWidgetResize = widgetId => {
    console.log('Resize widget:', widgetId);
  };

  const handleWidgetRemove = widgetId => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const handleBulkExport = config => {
    console.log('Bulk export:', config);
    alert(`Exporting ${config.symbols.length} symbols in ${config.format.toUpperCase()} format`);
  };

  const handleBulkAlert = config => {
    console.log('Bulk alert setup:', config);
    alert(`Setting ${config.threshold}% alerts for ${config.symbols.length} symbols`);
  };

  const handleBulkHistorical = config => {
    console.log('Bulk historical data:', config);
    alert(`Fetching ${config.period} historical data for ${config.symbols.length} symbols`);
  };

  const handleRefresh = () => {
    setLastUpdate('Just now');
    // Trigger data refresh
  };

  const handleKeyboardShortcut = e => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      document.querySelector('input[placeholder*="Search symbols"]')?.focus();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-[60px]">
        {/* Top Toolbar */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <DataSourceToggle dataSources={dataSources} onToggle={handleDataSourceToggle} />

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="RefreshCw"
                  onClick={handleRefresh}
                  className={isAutoRefresh ? 'animate-spin' : ''}
                >
                  Refresh
                </Button>
                <Button
                  variant={isAutoRefresh ? 'default' : 'outline'}
                  size="sm"
                  iconName={isAutoRefresh ? 'Pause' : 'Play'}
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                >
                  {isAutoRefresh ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </div>

            <ConnectionStatus connectionHealth={connectionHealth} lastUpdate={lastUpdate} />
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-3 space-y-6">
              {/* Symbol Search */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-elevation-1">
                <h3 className="font-semibold text-foreground mb-4">Add Symbols</h3>
                <SymbolSearch
                  onSymbolSelect={handleSymbolSelect}
                  watchlist={watchlist}
                  onAddToWatchlist={handleAddToWatchlist}
                />
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Icon name="Keyboard" size={12} />
                    <span>Ctrl+F to focus search</span>
                  </div>
                </div>
              </div>

              {/* Watchlist */}
              <WatchlistPanel
                watchlist={watchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onSelectSymbol={handleSymbolSelect}
              />

              {/* Bulk Operations */}
              <BulkOperationsPanel
                selectedSymbols={selectedSymbols}
                onBulkExport={handleBulkExport}
                onBulkAlert={handleBulkAlert}
                onBulkHistorical={handleBulkHistorical}
              />

              {/* API Status & Data Quality */}
              <ApiStatusPanel
                apiHealthStatus={apiHealthStatus}
                realDataEnabled={realDataEnabled}
                dataSources={dataSources}
                dataQuality={dataQuality}
              />
            </div>

            {/* Main Data Grid */}
            <div className="col-span-9">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Market Data Widgets ({widgets.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" iconName="Settings">
                    Layout
                  </Button>
                  <Button variant="outline" size="sm" iconName="Save">
                    Save Dashboard
                  </Button>
                </div>
              </div>

              {/* Widgets Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {widgets.map(widget => (
                  <MarketDataWidget
                    key={widget.id}
                    widget={widget}
                    onResize={handleWidgetResize}
                    onRemove={handleWidgetRemove}
                  />
                ))}
              </div>

              {/* Empty State */}
              {widgets.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Data Widgets</h3>
                  <p className="text-muted-foreground mb-4">
                    Search and add symbols to start monitoring market data
                  </p>
                  <Button variant="outline" iconName="Plus">
                    Add Your First Widget
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Active Widgets: {widgets.length}</span>
              <span>Watchlist: {watchlist.length}</span>
              <span>Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Market Hours: OPEN</span>
              <span>Last Update: {lastUpdate}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMarketDataCenter;
