import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AuditTrail = ({ calculations, errors, warnings }) => {
  const [activeTab, setActiveTab] = useState('calculations');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filterLevel, setFilterLevel] = useState('all');

  const mockAuditData = {
    calculations: [
      {
        id: 1,
        timestamp: new Date(Date.now() - 300000),
        type: 'calculation',
        operation: 'DCF Valuation',
        formula: 'NPV(FCFF_2024:2028, WACC)',
        result: 2547.5,
        inputs: {
          FCFF_2024: 187.5,
          FCFF_2025: 206.3,
          FCFF_2026: 226.9,
          FCFF_2027: 249.6,
          FCFF_2028: 274.6,
          WACC: 0.098
        },
        executionTime: 0.045,
        status: 'success'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 600000),
        type: 'calculation',
        operation: 'WACC Calculation',
        formula: 'WACC(cost_equity, cost_debt, tax_rate, debt_ratio)',
        result: 0.098,
        inputs: {
          cost_equity: 0.123,
          cost_debt: 0.045,
          tax_rate: 0.25,
          debt_ratio: 0.4
        },
        executionTime: 0.012,
        status: 'success'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 900000),
        type: 'calculation',
        operation: 'Terminal Value',
        formula: 'TERMINAL_VALUE(FCF_final, terminal_growth, WACC)',
        result: 1247.3,
        inputs: {
          FCF_final: 274.6,
          terminal_growth: 0.025,
          WACC: 0.098
        },
        executionTime: 0.008,
        status: 'success'
      }
    ],
    errors: [
      {
        id: 1,
        timestamp: new Date(Date.now() - 1200000),
        type: 'error',
        severity: 'high',
        message: 'Division by zero in WACC calculation',
        formula: 'WACC(cost_equity, cost_debt, tax_rate, debt_ratio)',
        location: 'Cell B15',
        suggestion: 'Ensure debt_ratio is not equal to 1.0',
        resolved: true
      }
    ],
    warnings: [
      {
        id: 1,
        timestamp: new Date(Date.now() - 180000),
        type: 'warning',
        severity: 'medium',
        message: 'Beta coefficient (1.15) is above industry average (0.95)',
        formula: 'CAPM(risk_free, beta, market_premium)',
        location: 'Assumptions',
        suggestion: 'Consider reviewing beta calculation or using industry average',
        acknowledged: false
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 420000),
        type: 'warning',
        severity: 'low',
        message: 'Terminal growth rate (2.5%) close to discount rate component',
        formula: 'TERMINAL_VALUE(FCF_final, terminal_growth, WACC)',
        location: 'Terminal Value',
        suggestion: 'Ensure terminal growth rate is reasonable for long-term GDP growth',
        acknowledged: true
      }
    ],
    validations: [
      {
        id: 1,
        timestamp: new Date(Date.now() - 60000),
        type: 'validation',
        check: 'Circular Reference Check',
        status: 'passed',
        details: 'No circular references detected in model'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 120000),
        type: 'validation',
        check: 'Balance Sheet Check',
        status: 'passed',
        details: 'Assets = Liabilities + Equity for all projection years'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 240000),
        type: 'validation',
        check: 'Cash Flow Consistency',
        status: 'warning',
        details: 'Minor rounding differences in cash flow statements (<$0.1M)'
      }
    ]
  };

  const tabs = [
    {
      id: 'calculations',
      label: 'Calculations',
      icon: 'Calculator',
      count: mockAuditData.calculations.length
    },
    { id: 'errors', label: 'Errors', icon: 'XCircle', count: mockAuditData.errors.length },
    {
      id: 'warnings',
      label: 'Warnings',
      icon: 'AlertTriangle',
      count: mockAuditData.warnings.length
    },
    {
      id: 'validations',
      label: 'Validations',
      icon: 'CheckCircle',
      count: mockAuditData.validations.length
    }
  ];

  const toggleExpanded = id => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'success':
        return { icon: 'CheckCircle', color: 'text-success' };
      case 'error':
        return { icon: 'XCircle', color: 'text-destructive' };
      case 'warning':
        return { icon: 'AlertTriangle', color: 'text-warning' };
      case 'passed':
        return { icon: 'CheckCircle', color: 'text-success' };
      default:
        return { icon: 'Info', color: 'text-muted-foreground' };
    }
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'medium':
        return 'text-warning bg-warning/10';
      case 'low':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatExecutionTime = time => {
    if (time < 0.001) return '<1ms';
    if (time < 1) return `${(time * 1000).toFixed(0)}ms`;
    return `${time.toFixed(2)}s`;
  };

  const renderCalculations = () => (
    <div className="space-y-3">
      {mockAuditData.calculations.map(calc => (
        <div key={calc.id} className="p-4 bg-background border border-border rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Calculator" size={16} className="text-primary" />
                <span className="font-medium text-foreground">{calc.operation}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusIcon(calc.status).color} bg-current/10`}
                >
                  {calc.status}
                </span>
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-foreground block mb-2">
                {calc.formula}
              </code>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{calc.timestamp.toLocaleTimeString()}</span>
                <span>Execution: {formatExecutionTime(calc.executionTime)}</span>
                <span>Result: ${calc.result.toFixed(2)}M</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconName={expandedItems.has(calc.id) ? 'ChevronUp' : 'ChevronDown'}
              onClick={() => toggleExpanded(calc.id)}
            />
          </div>

          {expandedItems.has(calc.id) && (
            <div className="mt-4 pt-4 border-t border-border">
              <h5 className="text-sm font-medium text-foreground mb-2">Input Values</h5>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(calc.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground font-mono">
                      {typeof value === 'number' ? value.toFixed(3) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderErrors = () => (
    <div className="space-y-3">
      {mockAuditData.errors.map(error => (
        <div key={error.id} className="p-4 bg-background border border-destructive/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="XCircle" size={16} className="text-destructive mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-foreground">{error.message}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(error.severity)}`}
                >
                  {error.severity}
                </span>
                {error.resolved && (
                  <span className="px-2 py-1 rounded-full text-xs text-success bg-success/10">
                    Resolved
                  </span>
                )}
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-foreground block mb-2">
                {error.formula}
              </code>
              <div className="text-sm text-muted-foreground mb-2">Location: {error.location}</div>
              <div className="text-sm text-foreground bg-muted/50 p-2 rounded">
                <strong>Suggestion:</strong> {error.suggestion}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {error.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderWarnings = () => (
    <div className="space-y-3">
      {mockAuditData.warnings.map(warning => (
        <div key={warning.id} className="p-4 bg-background border border-warning/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-foreground">{warning.message}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(warning.severity)}`}
                >
                  {warning.severity}
                </span>
                {warning.acknowledged && (
                  <span className="px-2 py-1 rounded-full text-xs text-muted-foreground bg-muted">
                    Acknowledged
                  </span>
                )}
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-foreground block mb-2">
                {warning.formula}
              </code>
              <div className="text-sm text-muted-foreground mb-2">Location: {warning.location}</div>
              <div className="text-sm text-foreground bg-muted/50 p-2 rounded">
                <strong>Suggestion:</strong> {warning.suggestion}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  {warning.timestamp.toLocaleString()}
                </div>
                {!warning.acknowledged && (
                  <Button variant="outline" size="sm">
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderValidations = () => (
    <div className="space-y-3">
      {mockAuditData.validations.map(validation => (
        <div key={validation.id} className="p-4 bg-background border border-border rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon
              name={getStatusIcon(validation.status).icon}
              size={16}
              className={`${getStatusIcon(validation.status).color} mt-0.5`}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-foreground">{validation.check}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusIcon(validation.status).color} bg-current/10`}
                >
                  {validation.status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{validation.details}</div>
              <div className="text-xs text-muted-foreground">
                {validation.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calculations':
        return renderCalculations();
      case 'errors':
        return renderErrors();
      case 'warnings':
        return renderWarnings();
      case 'validations':
        return renderValidations();
      default:
        return renderCalculations();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="FileText" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Audit Trail</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="Download">
            Export Log
          </Button>
          <Button variant="outline" size="sm" iconName="RefreshCw">
            Refresh
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
            {tab.count > 0 && (
              <span className="px-2 py-1 bg-current/20 rounded-full text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>Auto-refresh: ON</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span>Audit logging active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
