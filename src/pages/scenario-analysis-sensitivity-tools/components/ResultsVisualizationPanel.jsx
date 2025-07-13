import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Line, Area, AreaChart } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const ResultsVisualizationPanel = ({ simulationResults, isSimulating }) => {
  const [activeChart, setActiveChart] = useState('distribution');
  const [selectedMetric, setSelectedMetric] = useState('enterprise_value');

  // Mock simulation results data
  const mockResults = {
    summary: {
      mean: 2847.5,
      median: 2823.1,
      stdDev: 456.2,
      min: 1654.3,
      max: 4521.8,
      percentile5: 2156.7,
      percentile95: 3687.4,
      iterations: 10000
    },
    distribution: Array.from({ length: 50 }, (_, i) => ({
      value: 1500 + (i * 60),
      frequency: Math.max(0, Math.round(200 * Math.exp(-Math.pow((i - 25) / 10, 2))))
    })),
    tornado: [
      { variable: 'Revenue Growth', impact: 847.2, direction: 'positive' },
      { variable: 'Terminal Growth', impact: 623.8, direction: 'positive' },
      { variable: 'WACC', impact: -567.4, direction: 'negative' },
      { variable: 'Margin Expansion', impact: 445.6, direction: 'positive' },
      { variable: 'CapEx Ratio', impact: -334.2, direction: 'negative' },
      { variable: 'Working Capital', impact: -187.9, direction: 'negative' }
    ],
    scatter: Array.from({ length: 1000 }, (_, i) => ({
      revenueGrowth: 0.05 + Math.random() * 0.3,
      enterpriseValue: 1800 + Math.random() * 2000 + (Math.random() - 0.5) * 500
    })),
    timeSeries: Array.from({ length: 20 }, (_, i) => ({
      iteration: (i + 1) * 500,
      mean: 2800 + Math.sin(i * 0.5) * 50 + Math.random() * 20,
      confidence95: 3600 + Math.sin(i * 0.5) * 60 + Math.random() * 30,
      confidence5: 2000 + Math.sin(i * 0.5) * 40 + Math.random() * 20
    }))
  };

  const results = simulationResults || mockResults;

  const chartTypes = [
    { value: 'distribution', label: 'Distribution', icon: 'BarChart3' },
    { value: 'tornado', label: 'Tornado Chart', icon: 'BarChart2' },
    { value: 'scatter', label: 'Scatter Plot', icon: 'Scatter3D' },
    { value: 'convergence', label: 'Convergence', icon: 'TrendingUp' }
  ];

  const metricOptions = [
    { value: 'enterprise_value', label: 'Enterprise Value ($M)' },
    { value: 'equity_value', label: 'Equity Value ($M)' },
    { value: 'share_price', label: 'Share Price ($)' },
    { value: 'irr', label: 'Internal Rate of Return (%)' },
    { value: 'multiple', label: 'EV/EBITDA Multiple' }
  ];

  const exportOptions = [
    { value: 'pdf', label: 'PDF Report' },
    { value: 'excel', label: 'Excel Workbook' },
    { value: 'csv', label: 'CSV Data' },
    { value: 'png', label: 'PNG Image' }
  ];

  const renderDistributionChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Value Distribution</h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" iconName="ZoomIn" />
          <Button variant="ghost" size="sm" iconName="ZoomOut" />
          <Button variant="ghost" size="sm" iconName="RotateCcw" />
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={results.distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="value" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}B`}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} simulations`, 'Frequency']}
              labelFormatter={(value) => `Value: $${(value / 1000).toFixed(1)}B`}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="frequency" 
              fill="var(--color-primary)" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTornadoChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Sensitivity Analysis</h3>
        <Select
          options={[
            { value: 'absolute', label: 'Absolute Impact' },
            { value: 'percentage', label: 'Percentage Impact' }
          ]}
          value="absolute"
          onChange={() => {}}
          className="w-40"
        />
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={results.tornado}
            layout="horizontal"
            margin={{ left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              type="number"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `$${Math.abs(value).toFixed(0)}M`}
            />
            <YAxis 
              type="category"
              dataKey="variable"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              width={90}
            />
            <Tooltip 
              formatter={(value, name) => [`$${Math.abs(value).toFixed(1)}M`, 'Impact']}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="impact" 
              fill={(entry) => entry.direction === 'positive' ? 'var(--color-success)' : 'var(--color-error)'}
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderScatterChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Variable Correlation</h3>
        <div className="flex items-center space-x-2">
          <Select
            options={[
              { value: 'revenue_growth', label: 'Revenue Growth' },
              { value: 'margin_expansion', label: 'Margin Expansion' },
              { value: 'terminal_growth', label: 'Terminal Growth' }
            ]}
            value="revenue_growth"
            onChange={() => {}}
            className="w-40"
          />
          <span className="text-sm text-muted-foreground">vs</span>
          <Select
            options={metricOptions}
            value={selectedMetric}
            onChange={setSelectedMetric}
            className="w-40"
          />
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={results.scatter}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="revenueGrowth"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <YAxis 
              dataKey="enterpriseValue"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}B`}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenueGrowth' ? `${(value * 100).toFixed(1)}%` : `$${(value / 1000).toFixed(1)}B`,
                name === 'revenueGrowth' ? 'Revenue Growth' : 'Enterprise Value'
              ]}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Scatter 
              dataKey="enterpriseValue" 
              fill="var(--color-secondary)"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderConvergenceChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Monte Carlo Convergence</h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="TrendingUp" size={16} />
          <span>Convergence achieved at 8,500 iterations</span>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={results.timeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="iteration"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}B`}
            />
            <Tooltip 
              formatter={(value, name) => [`$${(value / 1000).toFixed(2)}B`, name]}
              labelFormatter={(value) => `Iteration: ${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Area 
              dataKey="confidence95" 
              stroke="var(--color-primary)" 
              fill="var(--color-primary)"
              fillOpacity={0.1}
            />
            <Area 
              dataKey="confidence5" 
              stroke="var(--color-primary)" 
              fill="var(--color-background)"
              fillOpacity={1}
            />
            <Line 
              dataKey="mean" 
              stroke="var(--color-primary)" 
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Simulation Results</h2>
          <div className="flex items-center space-x-4">
            <Select
              options={metricOptions}
              value={selectedMetric}
              onChange={setSelectedMetric}
              className="w-48"
              disabled={isSimulating}
            />
            <Select
              options={exportOptions}
              value="pdf"
              onChange={() => {}}
              className="w-32"
              disabled={isSimulating}
            />
            <Button
              variant="outline"
              iconName="Download"
              disabled={isSimulating}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="border-b border-border">
        <div className="flex">
          {chartTypes.map((chart) => (
            <button
              key={chart.value}
              onClick={() => setActiveChart(chart.value)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-smooth ${
                activeChart === chart.value
                  ? 'border-b-2 border-primary text-primary' :'text-muted-foreground hover:text-foreground'
              }`}
              disabled={isSimulating}
            >
              <Icon name={chart.icon} size={16} />
              <span>{chart.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="grid grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${(results.summary.mean / 1000).toFixed(1)}B
            </div>
            <div className="text-sm text-muted-foreground">Mean Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${(results.summary.median / 1000).toFixed(1)}B
            </div>
            <div className="text-sm text-muted-foreground">Median Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ±${(results.summary.stdDev / 1000).toFixed(1)}B
            </div>
            <div className="text-sm text-muted-foreground">Std Deviation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              ${(results.summary.percentile95 / 1000).toFixed(1)}B
            </div>
            <div className="text-sm text-muted-foreground">95th Percentile</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">
              ${(results.summary.percentile5 / 1000).toFixed(1)}B
            </div>
            <div className="text-sm text-muted-foreground">5th Percentile</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {results.summary.iterations.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Iterations</div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isSimulating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-lg font-medium text-foreground">Running Simulation...</div>
              <div className="text-sm text-muted-foreground">
                Calculating Monte Carlo scenarios with {results.summary.iterations.toLocaleString()} iterations
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeChart === 'distribution' && renderDistributionChart()}
            {activeChart === 'tornado' && renderTornadoChart()}
            {activeChart === 'scatter' && renderScatterChart()}
            {activeChart === 'convergence' && renderConvergenceChart()}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsVisualizationPanel;