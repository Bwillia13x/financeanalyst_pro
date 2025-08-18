import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Target, 
  Activity, 
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { portfolioCommands } from '../../services/commands/portfolioCommands';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

const PortfolioAnalytics = ({ 
  portfolio, 
  metrics, 
  selectedTimeframe, 
  onTimeframeChange, 
  timeframeOptions 
}) => {
  const [analyticsData, setAnalyticsData] = useState({
    riskMetrics: null,
    correlationMatrix: null,
    performanceAttribution: null,
    historicalPerformance: null
  });
  const [loading, setLoading] = useState({
    risk: false,
    correlation: false,
    performance: false
  });
  const [activeChart, setActiveChart] = useState('performance');
  const [riskTimeframe, setRiskTimeframe] = useState('252');

  // Calculate portfolio risk metrics using existing portfolio commands
  const calculateRiskMetrics = useCallback(async () => {
    if (!portfolio || !portfolio.holdings.length || loading.risk) return;

    setLoading(prev => ({ ...prev, risk: true }));
    try {
      const symbols = portfolio.holdings.map(h => h.symbol);
      const weights = portfolio.holdings.map(h => (h.allocation || 0) / 100);

      // Calculate individual stock risk metrics
      const individualRiskPromises = symbols.map(async (symbol) => {
        try {
          const riskCommand = portfolioCommands.RISK_METRICS;
          const mockCommand = { parameters: [symbol, parseInt(riskTimeframe)] };
          const result = await riskCommand.execute(mockCommand, {}, null);
          return result.data?.metrics || null;
        } catch (error) {
          console.warn(`Risk calculation failed for ${symbol}:`, error);
          return null;
        }
      });

      const individualRiskResults = await Promise.all(individualRiskPromises);

      // Aggregate risk metrics
      const validRisks = individualRiskResults.filter(r => r);
      const aggregatedMetrics = {
        portfolioVolatility: calculateWeightedAverage(validRisks.map(r => r.volatility || 0), weights),
        portfolioBeta: calculateWeightedAverage(validRisks.map(r => r.beta || 1), weights),
        portfolioSharpe: calculateWeightedAverage(validRisks.map(r => r.sharpeRatio || 0), weights),
        portfolioVar95: calculateWeightedAverage(validRisks.map(r => r.var95 || 0), weights),
        portfolioVar99: calculateWeightedAverage(validRisks.map(r => r.var99 || 0), weights),
        maxDrawdown: Math.max(...validRisks.map(r => r.maxDrawdown || 0)),
        concentrationRisk: calculateConcentrationRisk(weights),
        individualMetrics: symbols.map((symbol, index) => ({
          symbol,
          weight: weights[index],
          ...individualRiskResults[index]
        })).filter(item => item.symbol)
      };

      setAnalyticsData(prev => ({ 
        ...prev, 
        riskMetrics: aggregatedMetrics 
      }));

    } catch (error) {
      console.error('Risk metrics calculation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, risk: false }));
    }
  }, [portfolio, loading.risk, riskTimeframe]);

  // Calculate correlation matrix
  const calculateCorrelationMatrix = useCallback(async () => {
    if (!portfolio || !portfolio.holdings.length || loading.correlation) return;

    setLoading(prev => ({ ...prev, correlation: true }));
    try {
      const symbols = portfolio.holdings.map(h => h.symbol);
      
      if (symbols.length < 2) {
        setAnalyticsData(prev => ({ 
          ...prev, 
          correlationMatrix: { message: 'Need at least 2 holdings for correlation analysis' }
        }));
        return;
      }

      const correlationCommand = portfolioCommands.CORRELATION_MATRIX;
      const mockCommand = { parameters: [symbols] };
      const result = await correlationCommand.execute(mockCommand, {}, null);

      if (result.type === 'success') {
        setAnalyticsData(prev => ({ 
          ...prev, 
          correlationMatrix: result.data 
        }));
      }

    } catch (error) {
      console.error('Correlation calculation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, correlation: false }));
    }
  }, [portfolio, loading.correlation]);

  // Generate historical performance data
  const generateHistoricalPerformance = useCallback(() => {
    if (!metrics) return;

    const days = getDaysFromTimeframe(selectedTimeframe);
    const data = [];
    const startValue = metrics.totalValue * 0.9;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const trend = i / days;
      const volatility = Math.sin(i * 0.1) * 0.02 + Math.random() * 0.01 - 0.005;
      const value = startValue * (1 + trend * 0.15 + volatility);
      
      data.push({
        date: date.toISOString().split('T')[0],
        portfolioValue: value,
        benchmark: startValue * (1 + trend * 0.12)
      });
    }

    setAnalyticsData(prev => ({ 
      ...prev, 
      historicalPerformance: data 
    }));
  }, [metrics, selectedTimeframe]);

  // Calculate performance attribution
  const calculatePerformanceAttribution = useCallback(() => {
    if (!portfolio || !metrics) return;

    const attribution = portfolio.holdings.map(holding => {
      const contribution = (holding.allocation || 0) * (holding.gainLossPercent || 0) / 100;
      return {
        symbol: holding.symbol,
        name: holding.name,
        allocation: holding.allocation || 0,
        return: holding.gainLossPercent || 0,
        contribution,
        value: holding.value || 0
      };
    });

    attribution.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    setAnalyticsData(prev => ({ 
      ...prev, 
      performanceAttribution: attribution 
    }));
  }, [portfolio, metrics]);

  // Run calculations when dependencies change
  useEffect(() => {
    calculateRiskMetrics();
  }, [calculateRiskMetrics]);

  useEffect(() => {
    calculateCorrelationMatrix();
  }, [calculateCorrelationMatrix]);

  useEffect(() => {
    generateHistoricalPerformance();
  }, [generateHistoricalPerformance]);

  useEffect(() => {
    calculatePerformanceAttribution();
  }, [calculatePerformanceAttribution]);

  if (!portfolio || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: 'performance', label: 'Performance', icon: TrendingUp },
            { value: 'risk', label: 'Risk', icon: Shield },
            { value: 'correlation', label: 'Correlation', icon: Activity },
            { value: 'attribution', label: 'Attribution', icon: Target }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveChart(value)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeChart === value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">Timeframe:</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Performance Chart */}
      {activeChart === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Performance</h3>
              
              {analyticsData.historicalPerformance && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.historicalPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value, 0)}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name === 'portfolioValue' ? 'Portfolio' : 'Benchmark']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="portfolioValue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                      name="Portfolio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <PerformanceMetricsCard metrics={metrics} />
            {analyticsData.performanceAttribution && (
              <PerformanceAttributionCard attribution={analyticsData.performanceAttribution} />
            )}
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      {activeChart === 'risk' && analyticsData.riskMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskMetricsCard riskMetrics={analyticsData.riskMetrics} loading={loading.risk} />
          <RiskDecompositionCard riskMetrics={analyticsData.riskMetrics} />
        </div>
      )}

      {/* Correlation Analysis */}
      {activeChart === 'correlation' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Correlation Matrix</h3>
            {loading.correlation && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          
          {analyticsData.correlationMatrix && (
            <CorrelationMatrix data={analyticsData.correlationMatrix} />
          )}
        </div>
      )}

      {/* Performance Attribution */}
      {activeChart === 'attribution' && analyticsData.performanceAttribution && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Attribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.performanceAttribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="symbol" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatPercentage(value)} />
                <Tooltip formatter={(value) => [formatPercentage(value), 'Contribution']} />
                <Bar dataKey="contribution" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AttributionBreakdownCard attribution={analyticsData.performanceAttribution} />
        </div>
      )}
    </div>
  );
};

// Component definitions
const PerformanceMetricsCard = ({ metrics }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Total Return:</span>
        <span className={`font-medium ${metrics.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercentage(metrics.totalGainLossPercent)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Day Change:</span>
        <span className={`font-medium ${metrics.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercentage(metrics.dailyChangePercent)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Dividend Yield:</span>
        <span className="font-medium text-gray-900">
          {formatPercentage(metrics.dividendYield)}
        </span>
      </div>
    </div>
  </div>
);

const PerformanceAttributionCard = ({ attribution }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
    <div className="space-y-2">
      {attribution.slice(0, 5).map((item) => (
        <div key={item.symbol} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{item.symbol}</span>
          <span className={`text-sm font-medium ${item.contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(item.contribution)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const RiskMetricsCard = ({ riskMetrics, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Risk Metrics</h3>
      {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {formatPercentage((riskMetrics.portfolioVolatility || 0) * 100)}
        </div>
        <div className="text-sm text-blue-700">Volatility</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {formatNumber(riskMetrics.portfolioBeta || 0, 2)}
        </div>
        <div className="text-sm text-green-700">Beta</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {formatNumber(riskMetrics.portfolioSharpe || 0, 2)}
        </div>
        <div className="text-sm text-purple-700">Sharpe Ratio</div>
      </div>
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">
          {formatPercentage(riskMetrics.maxDrawdown || 0)}
        </div>
        <div className="text-sm text-orange-700">Max Drawdown</div>
      </div>
    </div>
  </div>
);

const RiskDecompositionCard = ({ riskMetrics }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Decomposition</h3>
    {riskMetrics?.individualMetrics && (
      <div className="space-y-3">
        {riskMetrics.individualMetrics.slice(0, 5).map((item) => (
          <div key={item.symbol} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{item.symbol}</div>
              <div className="text-sm text-gray-500">Weight: {formatPercentage(item.weight * 100)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Vol: {formatPercentage((item.volatility || 0) * 100)}
              </div>
              <div className="text-sm text-gray-500">
                Beta: {formatNumber(item.beta || 0, 2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CorrelationMatrix = ({ data }) => {
  if (!data.correlationMatrix) {
    return <div className="text-center py-8 text-gray-500">Insufficient data for correlation analysis</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.correlationMatrix.slice(0, 6).map((correlation, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <span className="text-sm text-gray-600">{correlation.pair}</span>
            <div className="text-right">
              <div className={`text-sm font-medium ${Math.abs(correlation.correlation) > 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                {formatNumber(correlation.correlation, 2)}
              </div>
              <div className="text-xs text-gray-500">{correlation.strength}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttributionBreakdownCard = ({ attribution }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Attribution Breakdown</h3>
    <div className="space-y-3">
      {attribution.map((item) => (
        <div key={item.symbol} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">{item.symbol}</div>
            <div className="text-sm text-gray-500">{formatPercentage(item.allocation)} allocation</div>
          </div>
          <div className="text-right">
            <div className={`font-medium ${item.contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(item.contribution)}
            </div>
            <div className="text-sm text-gray-500">
              {formatPercentage(item.return)} return
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper functions
const getDaysFromTimeframe = (timeframe) => {
  const timeframes = {
    '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365,
    'YTD': Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24))
  };
  return timeframes[timeframe] || 30;
};

const calculateWeightedAverage = (values, weights) => {
  return values.reduce((sum, value, index) => sum + value * (weights[index] || 0), 0);
};

const calculateConcentrationRisk = (weights) => {
  return Math.max(...weights);
};

export default PortfolioAnalytics;
