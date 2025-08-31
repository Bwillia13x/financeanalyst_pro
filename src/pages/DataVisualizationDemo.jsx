import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Calendar,
  Download,
  Share2,
  Settings,
  RefreshCw
} from 'lucide-react';

// Import all chart components
import InstitutionalChart, { CHART_TYPES } from '../components/Charts/InstitutionalChart';
import RealTimeChart from '../components/Charts/RealTimeChart';
import InteractiveDashboard, {
  DASHBOARD_PRESETS
} from '../components/Dashboards/InteractiveDashboard';
import {
  CandlestickChart,
  OHLCChart,
  VolumeChart,
  IndicatorsChart
} from '../components/Charts/FinancialCharts';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

// ===== SAMPLE DATA =====

// Stock price data
const generateStockData = (days = 30) => {
  const data = [];
  let price = 150;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 10;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;

    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      price: parseFloat(close.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / price) * 100).toFixed(2))
    });

    price = close;
  }

  return data;
};

// Financial metrics data
const generateMetricsData = (months = 12) => {
  const data = [];
  let revenue = 1000000;
  let expenses = 700000;
  let assets = 5000000;
  let liabilities = 2000000;

  for (let i = 0; i < months; i++) {
    revenue *= 1 + (Math.random() - 0.3) * 0.2;
    expenses *= 1 + (Math.random() - 0.4) * 0.15;
    assets *= 1 + (Math.random() - 0.45) * 0.1;
    liabilities *= 1 + (Math.random() - 0.4) * 0.12;

    data.push({
      month: new Date(Date.now() - (months - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        'en-US',
        { month: 'short', year: 'numeric' }
      ),
      revenue: Math.floor(revenue),
      expenses: Math.floor(expenses),
      profit: Math.floor(revenue - expenses),
      assets: Math.floor(assets),
      liabilities: Math.floor(liabilities),
      equity: Math.floor(assets - liabilities),
      margin: parseFloat((((revenue - expenses) / revenue) * 100).toFixed(2))
    });
  }

  return data;
};

// Portfolio allocation data
const portfolioData = [
  { name: 'Stocks', value: 450000, percentage: 45 },
  { name: 'Bonds', value: 300000, percentage: 30 },
  { name: 'Real Estate', value: 150000, percentage: 15 },
  { name: 'Cash', value: 60000, percentage: 6 },
  { name: 'Alternatives', value: 40000, percentage: 4 }
];

// ===== DATA VISUALIZATION DEMO PAGE =====

const DataVisualizationDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeRange, setTimeRange] = useState('1M');

  // Generate sample data
  const stockData = useMemo(() => generateStockData(60), []);
  const metricsData = useMemo(() => generateMetricsData(12), []);

  // Financial indicators
  const indicators = [
    { key: 'rsi', name: 'RSI', color: '#f59e0b' },
    { key: 'macd', name: 'MACD', color: '#8b5cf6' },
    { key: 'bb_upper', name: 'BB Upper', color: '#10b981' },
    { key: 'bb_lower', name: 'BB Lower', color: '#ef4444' }
  ];

  // Add indicators to stock data
  const stockDataWithIndicators = useMemo(() => {
    return stockData.map((item, index) => ({
      ...item,
      rsi: 30 + Math.random() * 40, // RSI between 30-70
      macd: (Math.random() - 0.5) * 4,
      bb_upper: item.close + Math.random() * 5,
      bb_lower: item.close - Math.random() * 5
    }));
  }, [stockData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: LineChart },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'realtime', label: 'Real-Time', icon: RefreshCw }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Visualization Demo</h1>
            <p className="text-foreground-secondary mt-1">
              Institutional-grade financial data visualization components
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="AAPL">Apple (AAPL)</option>
              <option value="GOOGL">Google (GOOGL)</option>
              <option value="MSFT">Microsoft (MSFT)</option>
              <option value="TSLA">Tesla (TSLA)</option>
              <option value="AMZN">Amazon (AMZN)</option>
            </select>

            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
            </select>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-brand-accent text-foreground-inverse'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Current Price</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${stockData[stockData.length - 1]?.close?.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {stockData[stockData.length - 1]?.change >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-brand-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-brand-error" />
                        )}
                        <span
                          className={cn(
                            'text-sm font-medium',
                            stockData[stockData.length - 1]?.change >= 0
                              ? 'text-brand-success'
                              : 'text-brand-error'
                          )}
                        >
                          {stockData[stockData.length - 1]?.changePercent?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-brand-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Volume</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(stockData[stockData.length - 1]?.volume / 1000000)?.toFixed(1)}M
                      </p>
                      <p className="text-sm text-foreground-secondary mt-1">Trading volume</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">52W High</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${Math.max(...stockData.map(d => d.high))?.toFixed(2)}
                      </p>
                      <p className="text-sm text-foreground-secondary mt-1">Peak value</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">52W Low</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${Math.min(...stockData.map(d => d.low))?.toFixed(2)}
                      </p>
                      <p className="text-sm text-foreground-secondary mt-1">Bottom value</p>
                    </div>
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Price Chart */}
            <InstitutionalChart
              data={stockData}
              type={CHART_TYPES.LINE}
              title={`${selectedSymbol} Price Chart`}
              subtitle={`Last ${timeRange} performance`}
              xAxisKey="date"
              yAxisKeys={['close']}
              height={400}
              colors={['#059669']}
            />

            {/* Financial Metrics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstitutionalChart
                data={metricsData}
                type={CHART_TYPES.BAR}
                title="Revenue vs Expenses"
                subtitle="Monthly comparison"
                xAxisKey="month"
                yAxisKeys={['revenue', 'expenses']}
                height={300}
                colors={['#059669', '#dc2626']}
              />

              <InstitutionalChart
                data={portfolioData}
                type={CHART_TYPES.PIE}
                title="Portfolio Allocation"
                subtitle="Asset distribution"
                xAxisKey="name"
                yAxisKeys={['value']}
                height={300}
              />
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstitutionalChart
                data={stockData}
                type={CHART_TYPES.LINE}
                title="Line Chart"
                subtitle="Price movement over time"
                xAxisKey="date"
                yAxisKeys={['close']}
                height={350}
              />

              <InstitutionalChart
                data={stockData}
                type={CHART_TYPES.AREA}
                title="Area Chart"
                subtitle="Volume filled area"
                xAxisKey="date"
                yAxisKeys={['volume']}
                height={350}
                colors={['#2563eb']}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstitutionalChart
                data={metricsData}
                type={CHART_TYPES.BAR}
                title="Bar Chart"
                subtitle="Monthly performance"
                xAxisKey="month"
                yAxisKeys={['profit']}
                height={350}
                colors={['#059669']}
              />

              <InstitutionalChart
                data={metricsData}
                type={CHART_TYPES.COMPOSED}
                title="Composed Chart"
                subtitle="Multiple data series"
                xAxisKey="month"
                yAxisKeys={['revenue', 'expenses', 'profit']}
                height={350}
              />
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <CandlestickChart
                data={stockData}
                title={`${selectedSymbol} Candlestick Chart`}
                subtitle="Professional price analysis"
                symbol={selectedSymbol}
                height={500}
                showVolume={true}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OHLCChart
                data={stockData}
                title="OHLC Analysis"
                subtitle="Open, High, Low, Close"
                symbol={selectedSymbol}
                height={350}
              />

              <VolumeChart
                data={stockData}
                title="Trading Volume"
                subtitle="Volume analysis"
                symbol={selectedSymbol}
                height={350}
              />
            </div>

            <IndicatorsChart
              data={stockDataWithIndicators}
              indicators={indicators}
              title="Technical Indicators"
              subtitle="RSI, MACD, Bollinger Bands"
              symbol={selectedSymbol}
              height={400}
            />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <InteractiveDashboard
            title="Financial Analytics Dashboard"
            subtitle="Real-time financial data visualization"
            widgets={[
              {
                id: 'price-widget',
                type: 'chart',
                title: `${selectedSymbol} Price`,
                config: {
                  chartType: CHART_TYPES.LINE,
                  dataKeys: ['close'],
                  showGrid: true,
                  showLegend: false
                },
                data: stockData
              },
              {
                id: 'volume-widget',
                type: 'chart',
                title: 'Volume',
                config: {
                  chartType: CHART_TYPES.BAR,
                  dataKeys: ['volume'],
                  showGrid: false,
                  showLegend: false,
                  colors: ['#2563eb']
                },
                data: stockData
              },
              {
                id: 'metrics-widget',
                type: 'metric',
                title: 'Current Price',
                config: {
                  format: 'currency',
                  prefix: '$'
                },
                data: { value: stockData[stockData.length - 1]?.close || 0 }
              },
              {
                id: 'allocation-widget',
                type: 'chart',
                title: 'Portfolio',
                config: {
                  chartType: CHART_TYPES.PIE,
                  dataKeys: ['value'],
                  showLegend: true
                },
                data: portfolioData
              }
            ]}
            layout="grid"
            columns={2}
            editable={true}
            realTime={false}
          />
        )}

        {/* Real-Time Tab */}
        {activeTab === 'realtime' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This demo uses simulated data. In a real application, you would connect to live
                market data feeds.
              </p>
            </div>

            <RealTimeChart
              dataSource={{
                wsUrl: 'wss://api.example.com/ws',
                apiUrl: 'https://api.example.com/data'
              }}
              title={`${selectedSymbol} Live Data`}
              subtitle="Real-time price and volume updates"
              symbol={selectedSymbol}
              initialData={stockData.slice(-20)}
              maxDataPoints={50}
              updateFrequency={1000}
              showControls={true}
              showAlerts={true}
              alertThresholds={{
                priceHigh: stockData[stockData.length - 1]?.close * 1.05,
                priceLow: stockData[stockData.length - 1]?.close * 0.95,
                volumeThreshold: 5000000
              }}
              height={500}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Connection</p>
                      <p className="text-lg font-bold text-foreground">Connected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Updates/sec</p>
                      <p className="text-lg font-bold text-foreground">2.5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Data Points</p>
                      <p className="text-lg font-bold text-foreground">50</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationDemo;
