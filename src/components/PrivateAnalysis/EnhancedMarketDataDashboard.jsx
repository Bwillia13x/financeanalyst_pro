import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, Globe, Bell, 
  Plus, Minus, RefreshCw, Settings, Download, Search,
  BarChart3, LineChart, PieChart, AlertCircle, CheckCircle
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const EnhancedMarketDataDashboard = ({ data, onDataChange }) => {
  const [activeView, setActiveView] = useState('overview');
  const [watchlist, setWatchlist] = useState([
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 445.67, change: 2.34, changePercent: 0.53, category: 'index' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 378.91, change: -1.45, changePercent: -0.38, category: 'index' },
    { symbol: 'VIX', name: 'CBOE Volatility Index', price: 18.45, change: 0.87, changePercent: 4.95, category: 'volatility' },
    { symbol: 'DXY', name: 'US Dollar Index', price: 102.45, change: -0.23, changePercent: -0.22, category: 'currency' },
    { symbol: '^TNX', name: '10-Year Treasury Yield', price: 4.25, change: 0.05, changePercent: 1.19, category: 'rates' }
  ]);

  const [marketData, setMarketData] = useState({
    indices: {
      'S&P 500': { value: 4456.78, change: 23.45, changePercent: 0.53 },
      'NASDAQ': { value: 13789.45, change: -45.67, changePercent: -0.33 },
      'DOW': { value: 34567.89, change: 156.78, changePercent: 0.46 },
      'Russell 2000': { value: 1987.65, change: 12.34, changePercent: 0.63 }
    },
    sectors: [
      { name: 'Technology', change: 1.2, weight: 23.5 },
      { name: 'Healthcare', change: 0.8, weight: 13.2 },
      { name: 'Financial', change: -0.4, weight: 12.8 },
      { name: 'Consumer Disc.', change: 0.6, weight: 10.9 },
      { name: 'Communication', change: -0.2, weight: 9.1 },
      { name: 'Industrials', change: 0.9, weight: 8.7 }
    ],
    economicIndicators: {
      'Fed Funds Rate': { value: 5.25, change: 0.0, unit: '%' },
      '10Y Treasury': { value: 4.25, change: 0.05, unit: '%' },
      'Inflation (CPI)': { value: 3.1, change: -0.2, unit: '%' },
      'Unemployment': { value: 3.8, change: 0.1, unit: '%' },
      'GDP Growth': { value: 2.4, change: 0.1, unit: '%' }
    }
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'price', symbol: 'SPY', condition: 'above', value: 450, active: true },
    { id: 2, type: 'volatility', symbol: 'VIX', condition: 'above', value: 20, active: true }
  ]);

  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const formatPercent = useCallback((value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }, []);

  const getChangeColor = useCallback((change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  const getChangeIcon = useCallback((change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * 2,
        change: item.change + (Math.random() - 0.5) * 0.5,
        changePercent: item.changePercent + (Math.random() - 0.5) * 0.1
      })));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const addToWatchlist = useCallback(async () => {
    if (!newSymbol.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newItem = {
        symbol: newSymbol.toUpperCase(),
        name: `${newSymbol.toUpperCase()} Inc.`,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        category: 'stock'
      };
      
      setWatchlist(prev => [...prev, newItem]);
      setNewSymbol('');
    } catch (error) {
      console.error('Error adding symbol:', error);
    } finally {
      setIsLoading(false);
    }
  }, [newSymbol]);

  const removeFromWatchlist = useCallback((symbol) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  }, []);

  const chartData = useMemo(() => {
    // Generate sample time series data
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => ({
      time: new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      SPY: 440 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
      QQQ: 370 + Math.sin(i * 0.25) * 15 + Math.random() * 8,
      VIX: 20 + Math.sin(i * 0.3) * 5 + Math.random() * 3
    }));
  }, []);

  const correlationMatrix = useMemo(() => {
    // Calculate correlations between major indices (simulated)
    return [
      { pair: 'SPY vs QQQ', correlation: 0.85, strength: 'Strong Positive' },
      { pair: 'SPY vs VIX', correlation: -0.72, strength: 'Strong Negative' },
      { pair: 'QQQ vs VIX', correlation: -0.68, strength: 'Moderate Negative' },
      { pair: 'SPY vs DXY', correlation: -0.45, strength: 'Moderate Negative' }
    ];
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="text-blue-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Enhanced Market Data Dashboard</h2>
            <p className="text-gray-600">Real-time market insights & valuation integration</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
          >
            <RefreshCw size={16} />
            <span>Sync Data</span>
          </motion.button>
          
          <motion.button
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
          >
            <Settings size={16} />
            <span>Settings</span>
          </motion.button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Market Overview', icon: Globe },
            { id: 'watchlist', label: 'Watchlist', icon: BarChart3 },
            { id: 'charts', label: 'Charts & Analysis', icon: LineChart },
            { id: 'alerts', label: 'Alerts', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Market Overview */}
      {activeView === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Major Indices */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Major Indices</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(marketData.indices).map(([name, data]) => {
                const ChangeIcon = getChangeIcon(data.change);
                return (
                  <div key={name} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{name}</div>
                    <div className="text-xl font-bold text-gray-800">
                      {data.value.toLocaleString()}
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${getChangeColor(data.change)}`}>
                      <ChangeIcon size={14} />
                      <span>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)}</span>
                      <span>({formatPercent(data.changePercent)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sector Performance */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sector Performance</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {marketData.sectors.map((sector) => (
                  <div key={sector.name} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{sector.name}</div>
                      <div className="text-sm text-gray-600">{sector.weight}% weight</div>
                    </div>
                    <div className={`font-semibold ${getChangeColor(sector.change)}`}>
                      {formatPercent(sector.change)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Economic Indicators */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Economic Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(marketData.economicIndicators).map(([name, data]) => (
                <div key={name} className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-1">{name}</div>
                  <div className="text-lg font-bold text-gray-800">
                    {data.value}{data.unit}
                  </div>
                  <div className={`text-sm ${getChangeColor(data.change)}`}>
                    {data.change > 0 ? '+' : ''}{data.change}{data.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Watchlist */}
      {activeView === 'watchlist' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Add Symbol */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter symbol (e.g., AAPL, MSFT)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <motion.button
              onClick={addToWatchlist}
              disabled={isLoading || !newSymbol.trim()}
              className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                isLoading || !newSymbol.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              whileHover={!isLoading && newSymbol.trim() ? { scale: 1.02 } : {}}
            >
              <Plus size={16} />
              <span>{isLoading ? 'Adding...' : 'Add'}</span>
            </motion.button>
          </div>

          {/* Watchlist Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Change</th>
                  <th className="text-right py-3 px-4">Change %</th>
                  <th className="text-center py-3 px-4">Category</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const ChangeIcon = getChangeIcon(item.change);
                  return (
                    <tr key={item.symbol} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{item.symbol}</td>
                      <td className="py-3 px-4 text-gray-600">{item.name}</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(item.price)}</td>
                      <td className={`text-right py-3 px-4 ${getChangeColor(item.change)}`}>
                        <div className="flex items-center justify-end space-x-1">
                          <ChangeIcon size={14} />
                          <span>{item.change > 0 ? '+' : ''}{item.change.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${getChangeColor(item.changePercent)}`}>
                        {formatPercent(item.changePercent)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.category === 'index' ? 'bg-blue-100 text-blue-800' :
                          item.category === 'stock' ? 'bg-green-100 text-green-800' :
                          item.category === 'volatility' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => removeFromWatchlist(item.symbol)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Charts & Analysis */}
      {activeView === 'charts' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Price Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">30-Day Price Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="SPY" stroke="#3B82F6" strokeWidth={2} name="S&P 500" />
                  <Line type="monotone" dataKey="QQQ" stroke="#10B981" strokeWidth={2} name="NASDAQ" />
                  <Line type="monotone" dataKey="VIX" stroke="#EF4444" strokeWidth={2} name="VIX" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation Analysis */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Correlation Analysis</h3>
            <div className="space-y-3">
              {correlationMatrix.map((corr, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{corr.pair}</div>
                    <div className="text-sm text-gray-600">{corr.strength}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${
                      Math.abs(corr.correlation) > 0.7 ? 'text-red-600' :
                      Math.abs(corr.correlation) > 0.4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {corr.correlation.toFixed(2)}
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          Math.abs(corr.correlation) > 0.7 ? 'bg-red-600' :
                          Math.abs(corr.correlation) > 0.4 ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Alerts */}
      {activeView === 'alerts' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Active Alerts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="text-yellow-600" size={20} />
                    <div>
                      <div className="font-medium text-gray-800">
                        {alert.symbol} {alert.type} alert
                      </div>
                      <div className="text-sm text-gray-600">
                        Notify when {alert.type} goes {alert.condition} {alert.value}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.active ? 'Active' : 'Inactive'}
                    </span>
                    <button className="text-red-600 hover:text-red-800">
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Status Indicators */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Market Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <div className="font-medium text-gray-800">US Markets</div>
                  <div className="text-sm text-gray-600">Open (6h 23m remaining)</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <AlertCircle className="text-yellow-600" size={20} />
                <div>
                  <div className="font-medium text-gray-800">European Markets</div>
                  <div className="text-sm text-gray-600">Closed</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <AlertCircle className="text-red-600" size={20} />
                <div>
                  <div className="font-medium text-gray-800">Asian Markets</div>
                  <div className="text-sm text-gray-600">Closed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedMarketDataDashboard;
