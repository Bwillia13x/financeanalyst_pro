import React, { useState, useRef } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormulaBuilder = ({ onFormulaCreate, variables: _variables }) => {
  const [selectedCategory, setSelectedCategory] = useState('valuation');
  const [draggedFunction, setDraggedFunction] = useState(null);
  const [currentFormula, setCurrentFormula] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const dropZoneRef = useRef(null);

  const functionCategories = {
    valuation: {
      name: 'Valuation',
      icon: 'TrendingUp',
      functions: [
        {
          name: 'DCF',
          syntax: 'DCF(fcf_array, discount_rate, terminal_growth)',
          description: 'Discounted Cash Flow valuation'
        },
        {
          name: 'NPV',
          syntax: 'NPV(cash_flows, discount_rate)',
          description: 'Net Present Value calculation'
        },
        { name: 'IRR', syntax: 'IRR(cash_flows)', description: 'Internal Rate of Return' },
        {
          name: 'TERMINAL_VALUE',
          syntax: 'TERMINAL_VALUE(final_fcf, growth_rate, discount_rate)',
          description: 'Terminal value calculation'
        },
        {
          name: 'WACC',
          syntax: 'WACC(cost_equity, cost_debt, tax_rate, debt_ratio)',
          description: 'Weighted Average Cost of Capital'
        }
      ]
    },
    financial: {
      name: 'Financial Ratios',
      icon: 'Calculator',
      functions: [
        {
          name: 'ROE',
          syntax: 'ROE(net_income, shareholders_equity)',
          description: 'Return on Equity'
        },
        { name: 'ROA', syntax: 'ROA(net_income, total_assets)', description: 'Return on Assets' },
        {
          name: 'DEBT_TO_EQUITY',
          syntax: 'DEBT_TO_EQUITY(total_debt, total_equity)',
          description: 'Debt to Equity ratio'
        },
        {
          name: 'CURRENT_RATIO',
          syntax: 'CURRENT_RATIO(current_assets, current_liabilities)',
          description: 'Current ratio calculation'
        },
        {
          name: 'QUICK_RATIO',
          syntax: 'QUICK_RATIO(quick_assets, current_liabilities)',
          description: 'Quick ratio calculation'
        }
      ]
    },
    statistical: {
      name: 'Statistical',
      icon: 'BarChart3',
      functions: [
        {
          name: 'CORRELATION',
          syntax: 'CORRELATION(dataset1, dataset2)',
          description: 'Correlation coefficient'
        },
        {
          name: 'REGRESSION',
          syntax: 'REGRESSION(dependent_var, independent_var)',
          description: 'Linear regression analysis'
        },
        {
          name: 'VOLATILITY',
          syntax: 'VOLATILITY(returns, period)',
          description: 'Historical volatility'
        },
        {
          name: 'BETA',
          syntax: 'BETA(stock_returns, market_returns)',
          description: 'Beta coefficient calculation'
        },
        {
          name: 'SHARPE_RATIO',
          syntax: 'SHARPE_RATIO(returns, risk_free_rate)',
          description: 'Risk-adjusted return metric'
        }
      ]
    },
    mathematical: {
      name: 'Mathematical',
      icon: 'Sigma',
      functions: [
        { name: 'SUM', syntax: 'SUM(range)', description: 'Sum of values' },
        { name: 'AVERAGE', syntax: 'AVERAGE(range)', description: 'Average of values' },
        { name: 'MEDIAN', syntax: 'MEDIAN(range)', description: 'Median value' },
        { name: 'STDEV', syntax: 'STDEV(range)', description: 'Standard deviation' },
        {
          name: 'PERCENTILE',
          syntax: 'PERCENTILE(range, percentile)',
          description: 'Percentile calculation'
        }
      ]
    }
  };

  const savedFormulas = [
    {
      name: 'Custom_DCF_Tech',
      formula: 'DCF(FCFF_PROJECTIONS, WACC(0.12, 0.04, 0.25, 0.3), 0.025)',
      category: 'Custom'
    },
    {
      name: 'LBO_Returns',
      formula: 'IRR([INITIAL_INVESTMENT * -1, EXIT_VALUE])',
      category: 'Custom'
    },
    {
      name: 'Comp_Multiple',
      formula: 'AVERAGE(PEER_EV_REVENUE) * TARGET_REVENUE',
      category: 'Custom'
    }
  ];

  const handleDragStart = (e, func) => {
    setDraggedFunction(func);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = e => {
    e.preventDefault();
    if (draggedFunction) {
      const newFormula = currentFormula + (currentFormula ? ' + ' : '') + draggedFunction.syntax;
      setCurrentFormula(newFormula);
      setDraggedFunction(null);
    }
  };

  const addFunction = func => {
    const newFormula = currentFormula + (currentFormula ? ' + ' : '') + func.syntax;
    setCurrentFormula(newFormula);
  };

  const clearFormula = () => {
    setCurrentFormula('');
    setFormulaName('');
  };

  const saveFormula = () => {
    if (formulaName && currentFormula) {
      if (onFormulaCreate) {
        onFormulaCreate({
          name: formulaName,
          formula: currentFormula,
          timestamp: new Date()
        });
      }
      setFormulaName('');
      setCurrentFormula('');
      setIsBuilding(false);
    }
  };

  const validateFormula = () => {
    // Simple validation - check for balanced parentheses
    const openParens = (currentFormula.match(/\(/g) || []).length;
    const closeParens = (currentFormula.match(/\)/g) || []).length;
    return openParens === closeParens;
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Wrench" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Formula Builder</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={() => setIsBuilding(!isBuilding)}
          >
            New Formula
          </Button>
        </div>
      </div>

      {/* Function Categories */}
      <div className="flex border-b border-border">
        {Object.entries(functionCategories).map(([key, category]) => {
          const tabClasses = [
            'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-smooth',
            selectedCategory === key
              ? 'bg-primary text-primary-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          ].join(' ');
          return (
            <button key={key} onClick={() => setSelectedCategory(key)} className={tabClasses}>
              <Icon name={category.icon} size={16} />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Function Library */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {functionCategories[selectedCategory].functions.map((func, index) => (
            <div
              key={index}
              draggable
              onDragStart={e => handleDragStart(e, func)}
              className="p-3 bg-muted rounded-lg border border-border cursor-move hover:bg-muted/80 transition-smooth group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Icon
                      name="Move"
                      size={14}
                      className="text-muted-foreground group-hover:text-foreground"
                    />
                    <span className="font-medium text-foreground">{func.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{func.description}</p>
                  <code className="text-xs bg-background px-2 py-1 rounded mt-2 block font-mono text-foreground">
                    {func.syntax}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Plus"
                  onClick={() => addFunction(func)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Saved Formulas */}
        <div className="border-t border-border p-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center space-x-2">
            <Icon name="BookOpen" size={16} />
            <span>Saved Formulas</span>
          </h4>
          <div className="space-y-2">
            {savedFormulas.map((formula, index) => (
              <div
                key={index}
                className="p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                onClick={() => setCurrentFormula(formula.formula)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentFormula(formula.formula);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{formula.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {formula.category}
                  </span>
                </div>
                <code className="text-xs text-muted-foreground mt-1 block font-mono">
                  {formula.formula}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formula Builder Panel */}
      {isBuilding && (
        <div className="border-t border-border bg-background">
          <div className="p-4 space-y-4">
            <div>
              <label
                htmlFor="formula-name-input"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Formula Name
              </label>
              <input
                id="formula-name-input"
                type="text"
                value={formulaName}
                onChange={e => setFormulaName(e.target.value)}
                placeholder="Enter formula name..."
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="formula-expression-input"
                className="text-sm font-medium text-foreground mb-2 block"
              >
                Formula Expression
              </label>
              <div
                id="formula-expression-input"
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="min-h-[100px] p-3 bg-input border-2 border-dashed border-border rounded-lg focus-within:border-ring transition-colors"
              >
                <textarea
                  value={currentFormula}
                  onChange={e => setCurrentFormula(e.target.value)}
                  placeholder="Drag functions here or type formula manually..."
                  className="w-full h-20 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none font-mono text-sm"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {validateFormula() ? (
                    <div className="flex items-center space-x-1 text-success">
                      <Icon name="CheckCircle" size={14} />
                      <span className="text-xs">Valid syntax</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-destructive">
                      <Icon name="XCircle" size={14} />
                      <span className="text-xs">Invalid syntax</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentFormula.length} characters
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" iconName="Trash2" onClick={clearFormula}>
                Clear
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" iconName="Eye" disabled={!validateFormula()}>
                  Preview
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Save"
                  onClick={saveFormula}
                  disabled={!formulaName || !currentFormula || !validateFormula()}
                >
                  Save Formula
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaBuilder;
