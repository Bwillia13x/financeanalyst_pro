import React, { useState, useEffect, useCallback } from 'react';

import InstitutionalChart from '../components/Charts/InstitutionalChart';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { apiIntegrationService } from '../services/api/APIIntegrationService';
import { dataManagementService } from '../services/data/DataManagementService';
import { realtimeDataService } from '../services/realtime/RealtimeDataService';

const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  CANDLESTICK: 'candlestick'
};

const RealtimeDashboard = () => {
  const [watchlist, setWatchlist] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']);
  const [quotes, setQuotes] = useState(new Map());
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [chartData, setChartData] = useState([]);
  const [news, setNews] = useState([]);
  const [economicData, setEconomicData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newSymbol, setNewSymbol] = useState('');

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize real-time data service
        await realtimeDataService.initialize();

        // Initialize API integration service
        await apiIntegrationService.initialize();

        setIsConnected(true);
        setConnectionStatus('connected');

        // Subscribe to watchlist symbols
        watchlist.forEach(symbol => {
          subscribeToSymbol(symbol);
        });

        // Load initial data
        loadInitialData();
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setConnectionStatus('error');
      }
    };

    initializeServices();

    // Setup real-time data listeners
    const handleDataReceived = data => {
      if (data.type === 'quote') {
        setQuotes(prev => new Map(prev.set(data.symbol, data)));
        setLastUpdate(new Date());
      }
    };

    const handleProviderConnected = ({ provider }) => {
      console.log(`Connected to ${provider}`);
    };

    const handleProviderDisconnected = ({ provider }) => {
      console.log(`Disconnected from ${provider}`);
    };

    realtimeDataService.on('dataReceived', handleDataReceived);
    realtimeDataService.on('providerConnected', handleProviderConnected);
    realtimeDataService.on('providerDisconnected', handleProviderDisconnected);

    // Cleanup on unmount
    return () => {
      realtimeDataService.off('dataReceived', handleDataReceived);
      realtimeDataService.off('providerConnected', handleProviderConnected);
      realtimeDataService.off('providerDisconnected', handleProviderDisconnected);
    };
  }, []);

  // Subscribe to symbol updates
  const subscribeToSymbol = useCallback(async symbol => {
    try {
      await realtimeDataService.subscribe(symbol, {
        callback: data => {
          if (data.type === 'quote') {
            setQuotes(prev => new Map(prev.set(data.symbol, data)));
          }
        }
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${symbol}:`, error);
    }
  }, []);

  // Load initial data for dashboard
  const loadInitialData = async () => {
    try {
      // Load quotes for watchlist
      const quotePromises = watchlist.map(symbol =>
        apiIntegrationService.getQuote(symbol).catch(() => null)
      );

      const quotesData = await Promise.allSettled(quotePromises);

      const quotesMap = new Map();
      quotesData.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          quotesMap.set(watchlist[index], result.value);
        }
      });

      setQuotes(quotesMap);

      // Load news
      const newsData = await apiIntegrationService
        .getNews({
          query: 'finance OR stocks OR market',
          provider: 'news-api'
        })
        .catch(() => []);

      setNews(newsData.slice(0, 10));

      // Load economic data (GDP)
      const gdpData = await apiIntegrationService
        .getEconomicData('GDP', {
          provider: 'fred'
        })
        .catch(() => []);

      setEconomicData(gdpData);

      // Load historical data for selected symbol
      await loadHistoricalData(selectedSymbol);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  // Load historical data for chart
  const loadHistoricalData = async symbol => {
    try {
      const historical = await apiIntegrationService.getHistoricalData(symbol, {
        period: '1y',
        interval: '1day'
      });

      if (historical && Array.isArray(historical)) {
        const chartData = historical.map(item => ({
          timestamp: item.timestamp,
          date: item.timestamp.toISOString().split('T')[0],
          price: item.close,
          volume: item.volume,
          open: item.open,
          high: item.high,
          low: item.low
        }));

        setChartData(chartData);
      }
    } catch (error) {
      console.error(`Failed to load historical data for ${symbol}:`, error);
    }
  };

  // Add symbol to watchlist
  const addToWatchlist = async () => {
    if (!newSymbol.trim() || watchlist.includes(newSymbol.toUpperCase())) {
      return;
    }

    const symbol = newSymbol.toUpperCase();
    setWatchlist(prev => [...prev, symbol]);
    setNewSymbol('');

    // Subscribe to real-time updates
    subscribeToSymbol(symbol);

    // Load quote
    try {
      const quote = await apiIntegrationService.getQuote(symbol);
      if (quote) {
        setQuotes(prev => new Map(prev.set(symbol, quote)));
      }
    } catch (error) {
      console.error(`Failed to load quote for ${symbol}:`, error);
    }
  };

  // Remove symbol from watchlist
  const removeFromWatchlist = symbol => {
    setWatchlist(prev => prev.filter(s => s !== symbol));

    // Unsubscribe from real-time updates
    realtimeDataService.unsubscribe(`${symbol}_quote`);

    // Remove from quotes
    setQuotes(prev => {
      const newQuotes = new Map(prev);
      newQuotes.delete(symbol);
      return newQuotes;
    });
  };

  // Handle symbol selection
  const handleSymbolSelect = async symbol => {
    setSelectedSymbol(symbol);
    await loadHistoricalData(symbol);
  };

  // Format currency
  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = value => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get quote for symbol
  const getQuote = symbol => {
    return quotes.get(symbol);
  };

  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    let totalValue = 0;
    let totalChange = 0;

    watchlist.forEach(symbol => {
      const quote = getQuote(symbol);
      if (quote) {
        totalValue += quote.price;
        totalChange += quote.change || 0;
      }
    });

    return { totalValue, totalChange };
  };

  const { totalValue, totalChange } = calculatePortfolioValue();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Real-time Financial Dashboard</h1>
            <p className="text-foreground-secondary mt-1">
              Live market data, news, and economic indicators
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-foreground-secondary">
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Disconnected'}
              </span>
            </div>

            {lastUpdate && (
              <span className="text-sm text-foreground-secondary">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Watchlist Management */}
        <Card>
          <CardHeader>
            <CardTitle>Watchlist Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Input
                type="text"
                placeholder="Enter symbol (e.g., AAPL)"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={e => e.key === 'Enter' && addToWatchlist()}
                className="w-48"
              />
              <Button onClick={addToWatchlist} disabled={!newSymbol.trim()}>
                Add Symbol
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map(symbol => {
                const quote = getQuote(symbol);
                return (
                  <div
                    key={symbol}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSymbol === symbol
                        ? 'border-brand-accent bg-brand-accent/10'
                        : 'border-border hover:border-brand-accent/50'
                    }`}
                    onClick={() => handleSymbolSelect(symbol)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{symbol}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeFromWatchlist(symbol);
                        }}
                        className="text-foreground-secondary hover:text-red-500 text-sm"
                      >
                        ×
                      </button>
                    </div>

                    {quote ? (
                      <div>
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(quote.price)}
                        </div>
                        <div
                          className={`text-sm ${
                            (quote.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercentage(quote.changePercent || 0)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-foreground-secondary">Loading...</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalValue)}
                  </div>
                  <div
                    className={`text-sm ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatPercentage(totalChange)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-foreground-secondary">Symbols</div>
                    <div className="text-lg font-semibold text-foreground">{watchlist.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-foreground-secondary">Connected</div>
                    <div className="text-lg font-semibold text-foreground">
                      {isConnected ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Symbol Details */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedSymbol} Details</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const quote = getQuote(selectedSymbol);
                if (!quote) {
                  return <div className="text-foreground-secondary">Loading...</div>;
                }

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Price</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(quote.price)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Change</span>
                      <span
                        className={`font-semibold ${
                          (quote.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(quote.change || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Volume</span>
                      <span className="font-semibold text-foreground">
                        {quote.volume?.toLocaleString() || 'N/A'}
                      </span>
                    </div>

                    {quote.marketCap && (
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Market Cap</span>
                        <span className="font-semibold text-foreground">
                          {(quote.marketCap / 1e9).toFixed(1)}B
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Market Status */}
          <Card>
            <CardHeader>
              <CardTitle>Market Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">Real-time Data</span>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">API Services</span>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">Cache Status</span>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-sm text-foreground-secondary">
                    Data providers: Alpha Vantage, FMP, Yahoo Finance, Polygon
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedSymbol} Price Chart</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <InstitutionalChart
                data={chartData}
                type={CHART_TYPES.LINE}
                xAxisKey="timestamp"
                yAxisKey="price"
                height={400}
                showGrid={true}
                showTooltip={true}
                showLegend={false}
                colors={['#1e3a5f']}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-foreground-secondary">
                Loading chart data...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {news.length > 0 ? (
                  news.map((item, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-b-0">
                      <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-foreground-secondary mb-2 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-secondary">{item.source}</span>
                        <span className="text-foreground-secondary">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-foreground-secondary">Loading news...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Economic Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Economic Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {economicData.length > 0 ? (
                  economicData.slice(-5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{item.indicator}</div>
                        <div className="text-sm text-foreground-secondary">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {item.value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-foreground-secondary">Loading economic data...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
