import React, { useState, useEffect, useCallback } from 'react';

import { trackComponentRender } from '../../utils/performanceMonitoring';

const EnhancedMarketDataDashboard = ({
  symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
  updateInterval = 5000,
  onDataUpdate
}) => {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    // Track component performance
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      trackComponentRender('EnhancedMarketDataDashboard', endTime - startTime);
    };
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);

      // Simulate API calls for market data
      const data = await Promise.all(
        symbols.map(async symbol => {
          const response = await fetchMarketDataForSymbol(symbol);
          return { symbol, data: response };
        })
      );

      const dataMap = {};
      data.forEach(({ symbol, data: symbolData }) => {
        dataMap[symbol] = symbolData;
      });

      setMarketData(dataMap);
      setLastUpdate(new Date());
      setLoading(false);

      if (onDataUpdate) {
        onDataUpdate(dataMap);
      }
    } catch (err) {
      setError('Failed to fetch market data');
      setLoading(false);
      console.error('Market data fetch error:', err);
    }
  }, [symbols, onDataUpdate]);

  const fetchMarketDataForSymbol = async symbol => {
    // Simulate API call with realistic market data structure
    return new Promise(resolve => {
      setTimeout(
        () => {
          const basePrice = getBasePrice(symbol);
          const change = (Math.random() - 0.5) * 10;
          const changePercent = (change / basePrice) * 100;

          resolve({
            symbol,
            price: basePrice + change,
            change,
            changePercent,
            volume: Math.floor(Math.random() * 1000000) + 100000,
            high: basePrice + Math.random() * 5,
            low: basePrice - Math.random() * 5,
            open: basePrice + (Math.random() - 0.5) * 3,
            previousClose: basePrice,
            marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
            peRatio: Math.random() * 50 + 10,
            dividendYield: Math.random() * 0.05,
            lastUpdated: new Date().toISOString()
          });
        },
        Math.random() * 1000 + 500
      );
    });
  };

  const getBasePrice = symbol => {
    const basePrices = {
      AAPL: 150,
      GOOGL: 2500,
      MSFT: 300,
      TSLA: 250
    };
    return basePrices[symbol] || 100;
  };

  useEffect(() => {
    fetchMarketData();

    let interval;
    if (isAutoRefresh) {
      interval = setInterval(fetchMarketData, updateInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchMarketData, isAutoRefresh, updateInterval]);

  const handleRefresh = () => {
    fetchMarketData();
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  const formatNumber = value => {
    if (value >= 1e12) {
      return (value / 1e12).toFixed(1) + 'T';
    } else if (value >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B';
    } else if (value >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M';
    }
    return value.toLocaleString();
  };

  if (loading && Object.keys(marketData).length === 0) {
    return (
      <div className="market-data-dashboard loading">
        <div className="loading-spinner">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="enhanced-market-data-dashboard">
      <div className="dashboard-header">
        <h2>Enhanced Market Data Dashboard</h2>
        <div className="dashboard-controls">
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Refresh
          </button>
          <button
            onClick={toggleAutoRefresh}
            className={`auto-refresh-btn ${isAutoRefresh ? 'active' : ''}`}
          >
            {isAutoRefresh ? '⏸️ Pause' : '▶️ Auto'}
          </button>
          {lastUpdate && (
            <span className="last-update">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="symbols-navigation">
        {symbols.map(symbol => (
          <button
            key={symbol}
            className={`symbol-tab ${selectedSymbol === symbol ? 'active' : ''}`}
            onClick={() => setSelectedSymbol(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>

      <div className="market-data-content">
        {selectedSymbol && marketData[selectedSymbol] && (
          <div className="symbol-details">
            <div className="price-section">
              <div className="main-price">
                <h3>{selectedSymbol}</h3>
                <div className="price-display">
                  {formatCurrency(marketData[selectedSymbol].price)}
                </div>
                <div
                  className={`price-change ${marketData[selectedSymbol].change >= 0 ? 'positive' : 'negative'}`}
                >
                  {marketData[selectedSymbol].change >= 0 ? '↗' : '↘'}
                  {formatCurrency(Math.abs(marketData[selectedSymbol].change))}(
                  {marketData[selectedSymbol].changePercent >= 0 ? '+' : ''}
                  {marketData[selectedSymbol].changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="key-metrics">
              <div className="metric-item">
                <span className="metric-label">Volume</span>
                <span className="metric-value">
                  {formatNumber(marketData[selectedSymbol].volume)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Market Cap</span>
                <span className="metric-value">
                  {formatNumber(marketData[selectedSymbol].marketCap)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">P/E Ratio</span>
                <span className="metric-value">
                  {marketData[selectedSymbol].peRatio.toFixed(2)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Dividend Yield</span>
                <span className="metric-value">
                  {formatPercentage(marketData[selectedSymbol].dividendYield * 100)}
                </span>
              </div>
            </div>

            <div className="price-details">
              <div className="detail-row">
                <span>Open:</span>
                <span>{formatCurrency(marketData[selectedSymbol].open)}</span>
              </div>
              <div className="detail-row">
                <span>Previous Close:</span>
                <span>{formatCurrency(marketData[selectedSymbol].previousClose)}</span>
              </div>
              <div className="detail-row">
                <span>Day High:</span>
                <span>{formatCurrency(marketData[selectedSymbol].high)}</span>
              </div>
              <div className="detail-row">
                <span>Day Low:</span>
                <span>{formatCurrency(marketData[selectedSymbol].low)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="market-overview">
          <h3>Market Overview</h3>
          <div className="symbols-grid">
            {symbols.map(symbol => {
              const data = marketData[symbol];
              if (!data) return null;

              return (
                <div key={symbol} className="symbol-card">
                  <div className="symbol-header">
                    <span className="symbol-name">{symbol}</span>
                    <span className={`symbol-change ${data.change >= 0 ? 'positive' : 'negative'}`}>
                      {data.changePercent >= 0 ? '+' : ''}
                      {data.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="symbol-price">{formatCurrency(data.price)}</div>
                  <div className="symbol-volume">Vol: {formatNumber(data.volume)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>
        {`
        .enhanced-market-data-dashboard {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.5rem;
        }

        .dashboard-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-btn, .auto-refresh-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .auto-refresh-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .last-update {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .symbols-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .symbol-tab {
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
        }

        .symbol-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .symbol-details {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .price-section {
          margin-bottom: 1.5rem;
        }

        .main-price h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .price-display {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .price-change {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .price-change.positive {
          color: #059669;
        }

        .price-change.negative {
          color: #dc2626;
        }

        .key-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric-item {
          text-align: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 4px;
        }

        .metric-item .metric-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .price-details {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .market-overview h3 {
          margin: 0 0 1rem 0;
          color: #1e293b;
        }

        .symbols-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .symbol-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .symbol-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .symbol-name {
          font-weight: 600;
          color: #374151;
        }

        .symbol-change {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .symbol-change.positive {
          color: #059669;
        }

        .symbol-change.negative {
          color: #dc2626;
        }

        .symbol-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .symbol-volume {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }

        .loading-spinner {
          color: #6b7280;
        }
      `}
      </style>
    </div>
  );
};

export default EnhancedMarketDataDashboard;
