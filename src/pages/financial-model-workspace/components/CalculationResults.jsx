import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CalculationResults = ({ results: _results, onExport }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedSections, setExpandedSections] = useState(new Set(['valuation']));

  const mockResults = {
    summary: {
      enterpriseValue: 2847.5,
      equityValue: 2547.5,
      sharePrice: 127.38,
      impliedReturn: 0.156,
      confidence: 0.87
    },
    cashFlows: [
      { year: 2024, revenue: 1250, ebitda: 312.5, fcf: 187.5, pv: 170.5 },
      { year: 2025, revenue: 1375, ebitda: 343.8, fcf: 206.3, pv: 172.8 },
      { year: 2026, revenue: 1513, ebitda: 378.2, fcf: 226.9, pv: 175.2 },
      { year: 2027, revenue: 1664, ebitda: 416.0, fcf: 249.6, pv: 177.7 },
      { year: 2028, revenue: 1830, ebitda: 457.6, fcf: 274.6, pv: 180.3 }
    ],
    sensitivity: {
      wacc: [0.08, 0.09, 0.1, 0.11, 0.12],
      growth: [0.015, 0.02, 0.025, 0.03, 0.035],
      matrix: [
        [145.2, 138.7, 132.8, 127.4, 122.5],
        [152.1, 144.9, 138.2, 132.1, 126.4],
        [159.8, 151.9, 144.6, 137.8, 131.6],
        [168.4, 159.7, 151.8, 144.4, 137.6],
        [178.1, 168.4, 159.7, 151.8, 144.4]
      ]
    },
    scenarios: [
      { name: 'Base Case', probability: 0.6, sharePrice: 127.38, irr: 0.156 },
      { name: 'Bull Case', probability: 0.25, sharePrice: 145.67, irr: 0.189 },
      { name: 'Bear Case', probability: 0.15, sharePrice: 98.42, irr: 0.087 }
    ],
    multiples: [
      { metric: 'EV/Revenue', current: 2.3, peer_avg: 2.8, premium: -17.9 },
      { metric: 'EV/EBITDA', current: 9.1, peer_avg: 11.2, premium: -18.8 },
      { metric: 'P/E Ratio', current: 18.5, peer_avg: 22.1, premium: -16.3 },
      { metric: 'P/B Ratio', current: 2.1, peer_avg: 2.6, premium: -19.2 }
    ]
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: 'BarChart3' },
    { id: 'cashflows', label: 'Cash Flows', icon: 'TrendingUp' },
    { id: 'sensitivity', label: 'Sensitivity', icon: 'Target' },
    { id: 'scenarios', label: 'Scenarios', icon: 'GitBranch' },
    { id: 'multiples', label: 'Multiples', icon: 'Layers' }
  ];

  const _toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercent = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const renderSummary = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Enterprise Value</span>
            <Icon name="Building" size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(mockResults.summary.enterpriseValue, 1)}M
            </span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Equity Value</span>
            <Icon name="PieChart" size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(mockResults.summary.equityValue, 1)}M
            </span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Share Price</span>
            <Icon name="DollarSign" size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(mockResults.summary.sharePrice)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Implied Return</span>
            <Icon name="TrendingUp" size={16} className="text-success" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-success">
              {formatPercent(mockResults.summary.impliedReturn)}
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="p-4 bg-background border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Model Confidence</span>
          <span className="text-sm text-muted-foreground">
            {formatPercent(mockResults.summary.confidence)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-success h-2 rounded-full transition-all duration-300"
            style={{ width: `${mockResults.summary.confidence * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Based on data quality, assumption validity, and sensitivity analysis
        </p>
      </div>
    </div>
  );

  const renderCashFlows = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Year</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Revenue</th>
              <th className="text-right py-2 text-muted-foreground font-medium">EBITDA</th>
              <th className="text-right py-2 text-muted-foreground font-medium">FCF</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Present Value</th>
            </tr>
          </thead>
          <tbody>
            {mockResults.cashFlows.map((cf, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-3 text-foreground font-medium">{cf.year}</td>
                <td className="py-3 text-right text-foreground">
                  {formatCurrency(cf.revenue, 0)}M
                </td>
                <td className="py-3 text-right text-foreground">{formatCurrency(cf.ebitda, 1)}M</td>
                <td className="py-3 text-right text-foreground">{formatCurrency(cf.fcf, 1)}M</td>
                <td className="py-3 text-right text-success font-medium">
                  {formatCurrency(cf.pv, 1)}M
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Terminal Value</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(1247.3, 1)}M</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          2.5% perpetual growth rate applied to 2028 FCF
        </p>
      </div>
    </div>
  );

  const renderSensitivity = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-medium text-foreground mb-2">
          Share Price Sensitivity Analysis
        </h4>
        <p className="text-xs text-muted-foreground">WACC vs Terminal Growth Rate</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted-foreground">WACC \ Growth</th>
              {mockResults.sensitivity.growth.map((growth, index) => (
                <th key={index} className="p-2 text-center text-muted-foreground">
                  {formatPercent(growth)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockResults.sensitivity.wacc.map((wacc, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border/50">
                <td className="p-2 text-muted-foreground font-medium">{formatPercent(wacc)}</td>
                {mockResults.sensitivity.matrix[rowIndex].map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className={`p-2 text-center font-medium ${
                      Math.abs(value - 127.38) < 5
                        ? 'bg-primary/20 text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderScenarios = () => (
    <div className="space-y-4">
      {mockResults.scenarios.map((scenario, index) => (
        <div key={index} className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-foreground">{scenario.name}</span>
              <span className="text-xs bg-background px-2 py-1 rounded text-muted-foreground">
                {formatPercent(scenario.probability)} probability
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(scenario.sharePrice)}
              </div>
              <div className="text-sm text-muted-foreground">{formatPercent(scenario.irr)} IRR</div>
            </div>
          </div>
          <div className="w-full bg-background rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full"
              style={{ width: `${scenario.probability * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderMultiples = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Multiple</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Current</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Peer Avg</th>
              <th className="text-right py-2 text-muted-foreground font-medium">
                Premium/Discount
              </th>
            </tr>
          </thead>
          <tbody>
            {mockResults.multiples.map((multiple, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-3 text-foreground font-medium">{multiple.metric}</td>
                <td className="py-3 text-right text-foreground">{multiple.current}x</td>
                <td className="py-3 text-right text-foreground">{multiple.peer_avg}x</td>
                <td
                  className={`py-3 text-right font-medium ${
                    multiple.premium > 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {multiple.premium > 0 ? '+' : ''}
                  {multiple.premium.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'cashflows':
        return renderCashFlows();
      case 'sensitivity':
        return renderSensitivity();
      case 'scenarios':
        return renderScenarios();
      case 'multiples':
        return renderMultiples();
      default:
        return renderSummary();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Calculator" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Calculation Results</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            onClick={() => onExport && onExport('excel')}
          >
            Export
          </Button>
          <Button variant="outline" size="sm" iconName="Share2">
            Share
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-smooth ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>Auto-refresh: ON</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span>Calculations current</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationResults;
