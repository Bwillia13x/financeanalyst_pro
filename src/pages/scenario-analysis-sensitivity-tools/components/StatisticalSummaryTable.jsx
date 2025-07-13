import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const StatisticalSummaryTable = ({ simulationResults, isSimulating }) => {
  const [selectedMetric, setSelectedMetric] = useState('enterprise_value');
  const [viewMode, setViewMode] = useState('summary');

  // Mock statistical data
  const mockStatistics = {
    enterprise_value: {
      descriptive: {
        count: 10000,
        mean: 2847.5,
        median: 2823.1,
        mode: 2798.3,
        stdDev: 456.2,
        variance: 208118.44,
        skewness: 0.12,
        kurtosis: 2.98,
        min: 1654.3,
        max: 4521.8,
        range: 2867.5,
        iqr: 615.7
      },
      percentiles: {
        p1: 1876.4,
        p5: 2156.7,
        p10: 2287.9,
        p25: 2534.2,
        p50: 2823.1,
        p75: 3149.9,
        p90: 3456.8,
        p95: 3687.4,
        p99: 4123.6
      },
      confidence: {
        ci90_lower: 2156.7,
        ci90_upper: 3687.4,
        ci95_lower: 2034.8,
        ci95_upper: 3798.2,
        ci99_lower: 1789.3,
        ci99_upper: 4021.7
      },
      risk: {
        var95: 1034.8,
        var99: 1456.2,
        cvar95: 1287.6,
        cvar99: 1678.9,
        probabilityOfLoss: 0.023,
        expectedShortfall: 1456.8
      }
    }
  };

  const metricOptions = [
    { value: 'enterprise_value', label: 'Enterprise Value ($M)' },
    { value: 'equity_value', label: 'Equity Value ($M)' },
    { value: 'share_price', label: 'Share Price ($)' },
    { value: 'irr', label: 'Internal Rate of Return (%)' },
    { value: 'multiple', label: 'EV/EBITDA Multiple' }
  ];

  const viewModeOptions = [
    { value: 'summary', label: 'Summary Statistics' },
    { value: 'percentiles', label: 'Percentile Analysis' },
    { value: 'confidence', label: 'Confidence Intervals' },
    { value: 'risk', label: 'Risk Metrics' }
  ];

  const statistics = simulationResults?.statistics || mockStatistics[selectedMetric];

  const formatValue = (value, metric = selectedMetric) => {
    if (metric === 'irr') return `${(value * 100).toFixed(2)}%`;
    if (metric === 'multiple') return `${value.toFixed(2)}x`;
    if (metric === 'share_price') return `$${value.toFixed(2)}`;
    return `$${(value / 1000).toFixed(1)}B`;
  };

  const renderSummaryStatistics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Descriptive Statistics</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Central Tendency */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Central Tendency</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Mean</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.mean)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Median</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.median)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Mode</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.mode)}</span>
            </div>
          </div>
        </div>

        {/* Dispersion */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Dispersion</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Standard Deviation</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.stdDev)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Variance</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.variance)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Range</span>
              <span className="font-mono text-sm">{formatValue(statistics.descriptive.range)}</span>
            </div>
          </div>
        </div>

        {/* Shape */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Distribution Shape</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Skewness</span>
              <span className="font-mono text-sm">{statistics.descriptive.skewness.toFixed(3)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Kurtosis</span>
              <span className="font-mono text-sm">{statistics.descriptive.kurtosis.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Extremes */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Extremes</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Minimum</span>
              <span className="font-mono text-sm text-error">{formatValue(statistics.descriptive.min)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Maximum</span>
              <span className="font-mono text-sm text-success">{formatValue(statistics.descriptive.max)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPercentileAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Percentile Analysis</h3>
      
      <div className="space-y-4">
        {Object.entries(statistics.percentiles).map(([percentile, value]) => {
          const pct = percentile.replace('p', '');
          const isExtreme = pct === '1' || pct === '99';
          const isQuartile = ['25', '50', '75'].includes(pct);
          
          return (
            <div 
              key={percentile}
              className={`flex justify-between items-center p-4 rounded-lg border ${
                isExtreme ? 'border-warning bg-warning/5' : isQuartile ?'border-primary bg-primary/5': 'border-border bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">
                  {pct === '50' ? 'Median' : `${pct}th Percentile`}
                </span>
                {isQuartile && (
                  <div className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                    Q{pct === '25' ? '1' : pct === '50' ? '2' : '3'}
                  </div>
                )}
              </div>
              <span className="font-mono text-sm font-medium">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium text-foreground mb-3">Interpretation</h4>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• 50% of outcomes fall below {formatValue(statistics.percentiles.p50)}</p>
          <p>• 90% of outcomes fall between {formatValue(statistics.percentiles.p5)} and {formatValue(statistics.percentiles.p95)}</p>
          <p>• Interquartile range: {formatValue(statistics.descriptive.iqr)}</p>
        </div>
      </div>
    </div>
  );

  const renderConfidenceIntervals = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Confidence Intervals</h3>
      
      <div className="space-y-4">
        {[
          { level: '90%', lower: statistics.confidence.ci90_lower, upper: statistics.confidence.ci90_upper },
          { level: '95%', lower: statistics.confidence.ci95_lower, upper: statistics.confidence.ci95_upper },
          { level: '99%', lower: statistics.confidence.ci99_lower, upper: statistics.confidence.ci99_upper }
        ].map((ci) => (
          <div key={ci.level} className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-foreground">{ci.level} Confidence Interval</span>
              <span className="text-sm text-muted-foreground">
                Width: {formatValue(ci.upper - ci.lower)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Lower Bound</div>
                <div className="font-mono text-sm font-medium text-error">{formatValue(ci.lower)}</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-muted rounded-full relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-error via-warning to-success rounded-full" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Upper Bound</div>
                <div className="font-mono text-sm font-medium text-success">{formatValue(ci.upper)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRiskMetrics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Risk Assessment</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Value at Risk */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Value at Risk (VaR)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-error/10 border border-error/20 rounded-lg">
              <span className="text-sm font-medium">95% VaR</span>
              <span className="font-mono text-sm text-error">{formatValue(statistics.risk.var95)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-error/10 border border-error/20 rounded-lg">
              <span className="text-sm font-medium">99% VaR</span>
              <span className="font-mono text-sm text-error">{formatValue(statistics.risk.var99)}</span>
            </div>
          </div>
        </div>

        {/* Conditional VaR */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Conditional VaR (CVaR)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <span className="text-sm font-medium">95% CVaR</span>
              <span className="font-mono text-sm text-warning">{formatValue(statistics.risk.cvar95)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <span className="text-sm font-medium">99% CVaR</span>
              <span className="font-mono text-sm text-warning">{formatValue(statistics.risk.cvar99)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Risk Metrics */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Additional Risk Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Probability of Loss</span>
            <span className="font-mono text-sm">{(statistics.risk.probabilityOfLoss * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Expected Shortfall</span>
            <span className="font-mono text-sm">{formatValue(statistics.risk.expectedShortfall)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium text-foreground mb-3">Risk Interpretation</h4>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• There is a 5% chance of losing more than {formatValue(statistics.risk.var95)}</p>
          <p>• In the worst 5% of scenarios, average loss is {formatValue(statistics.risk.cvar95)}</p>
          <p>• Probability of any loss: {(statistics.risk.probabilityOfLoss * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );

  if (isSimulating) {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-lg font-medium text-foreground">Calculating Statistics...</div>
          <div className="text-sm text-muted-foreground">
            Processing simulation results and computing risk metrics
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Statistical Analysis</h2>
          <div className="flex items-center space-x-4">
            <Select
              options={metricOptions}
              value={selectedMetric}
              onChange={setSelectedMetric}
              className="w-48"
            />
            <Select
              options={viewModeOptions}
              value={viewMode}
              onChange={setViewMode}
              className="w-48"
            />
            <Button
              variant="outline"
              iconName="Download"
              size="sm"
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'summary' && renderSummaryStatistics()}
        {viewMode === 'percentiles' && renderPercentileAnalysis()}
        {viewMode === 'confidence' && renderConfidenceIntervals()}
        {viewMode === 'risk' && renderRiskMetrics()}
      </div>
    </div>
  );
};

export default StatisticalSummaryTable;