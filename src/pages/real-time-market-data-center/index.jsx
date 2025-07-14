import React, { useState, useEffect } from 'react';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';

import BulkOperationsPanel from './components/BulkOperationsPanel';
import ConnectionStatus from './components/ConnectionStatus';
import DataSourceToggle from './components/DataSourceToggle';
import MarketDataWidget from './components/MarketDataWidget';
import SymbolSearch from './components/SymbolSearch';
import WatchlistPanel from './components/WatchlistPanel';

const RealTimeMarketDataCenter = () => {
  const [dataSources, setDataSources] = useState([
    { id: 'bloomberg', name: 'Bloomberg', enabled: true, status: 'connected', latency: 12 },
    { id: 'factset', name: 'FactSet', enabled: true, status: 'connected', latency: 18 },
    { id: 'refinitiv', name: 'Refinitiv', enabled: false, status: 'warning', latency: 45 }
  ]);

  const [connectionHealth, setConnectionHealth] = useState({
    overall: 'excellent',
    sources: {
      bloomberg: 'connected',
      factset: 'connected',
      refinitiv: 'warning'
    }
  });

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

  // Simulate real-time updates
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setWidgets(prevWidgets =>
        prevWidgets.map(widget => ({
          ...widget,
          currentValue: widget.currentValue + (Math.random() - 0.5) * 2,
          change: (Math.random() - 0.5) * 5,
          changePercent: (Math.random() - 0.5) * 2,
          lastUpdate: new Date(),
          sparklineData: [
            ...widget.sparklineData.slice(1),
            widget.currentValue + (Math.random() - 0.5) * 2
          ]
        }))
      );
      setLastUpdate('Just now');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isAutoRefresh]);

  const handleDataSourceToggle = sourceId => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId ? { ...source, enabled: !source.enabled } : source
      )
    );
  };

  const handleSymbolSelect = symbol => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      symbol: symbol.symbol,
      name: symbol.name,
      currentValue: Math.random() * 1000 + 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      valueType: 'currency',
      dayHigh: Math.random() * 1000 + 60,
      dayLow: Math.random() * 1000 + 40,
      volume: Math.floor(Math.random() * 100000000),
      source: 'Bloomberg',
      lastUpdate: new Date(),
      sparklineData: Array.from({ length: 6 }, () => Math.random() * 1000 + 50)
    };
    setWidgets(prev => [...prev, newWidget]);
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
