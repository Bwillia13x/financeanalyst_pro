import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VariableInputs = ({ onVariableChange, onBulkEdit }) => {
  const [activeSection, setActiveSection] = useState('assumptions');
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [variables, setVariables] = useState({
    assumptions: {
      revenue_growth: {
        value: 0.052,
        unit: '%',
        description: 'Annual revenue growth rate',
        category: 'Growth'
      },
      ebitda_margin: {
        value: 0.235,
        unit: '%',
        description: 'EBITDA as % of revenue',
        category: 'Profitability'
      },
      tax_rate: { value: 0.25, unit: '%', description: 'Corporate tax rate', category: 'Tax' },
      capex_revenue: {
        value: 0.035,
        unit: '%',
        description: 'CapEx as % of revenue',
        category: 'Investment'
      },
      working_capital_revenue: {
        value: 0.02,
        unit: '%',
        description: 'Working capital as % of revenue',
        category: 'Working Capital'
      },
      terminal_growth: {
        value: 0.025,
        unit: '%',
        description: 'Long-term growth rate',
        category: 'Terminal'
      }
    },
    cost_of_capital: {
      risk_free_rate: {
        value: 0.032,
        unit: '%',
        description: 'Risk-free rate (10Y Treasury)',
        category: 'Market'
      },
      market_premium: {
        value: 0.065,
        unit: '%',
        description: 'Equity risk premium',
        category: 'Market'
      },
      beta: { value: 1.15, unit: 'x', description: 'Asset beta coefficient', category: 'Risk' },
      cost_of_debt: {
        value: 0.045,
        unit: '%',
        description: 'Pre-tax cost of debt',
        category: 'Debt'
      },
      debt_equity_ratio: {
        value: 0.4,
        unit: 'x',
        description: 'Target debt-to-equity ratio',
        category: 'Capital Structure'
      }
    },
    market_data: {
      current_share_price: {
        value: 125.5,
        unit: '$',
        description: 'Current trading price',
        category: 'Market'
      },
      shares_outstanding: {
        value: 20.0,
        unit: 'M',
        description: 'Shares outstanding',
        category: 'Equity'
      },
      market_cap: {
        value: 2510,
        unit: '$M',
        description: 'Current market capitalization',
        category: 'Valuation'
      },
      enterprise_value: {
        value: 2810,
        unit: '$M',
        description: 'Current enterprise value',
        category: 'Valuation'
      },
      net_debt: { value: 300, unit: '$M', description: 'Net debt position', category: 'Debt' }
    }
  });

  const sections = [
    { id: 'assumptions', label: 'Key Assumptions', icon: 'Settings' },
    { id: 'cost_of_capital', label: 'Cost of Capital', icon: 'Percent' },
    { id: 'market_data', label: 'Market Data', icon: 'TrendingUp' }
  ];

  const handleVariableChange = (section, key, newValue) => {
    const updatedVariables = {
      ...variables,
      [section]: {
        ...variables[section],
        [key]: {
          ...variables[section][key],
          value: parseFloat(newValue) || 0
        }
      }
    };
    setVariables(updatedVariables);

    if (onVariableChange) {
      onVariableChange(section, key, newValue);
    }
  };

  const formatValue = (value, unit) => {
    if (unit === '%') {
      return (value * 100).toFixed(1);
    } else if (unit === '$' || unit === '$M') {
      return value.toFixed(2);
    } else {
      return value.toFixed(3);
    }
  };

  const getVariablesByCategory = sectionData => {
    const categories = {};
    Object.entries(sectionData).forEach(([key, variable]) => {
      const category = variable.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ key, ...variable });
    });
    return categories;
  };

  const filteredVariables = sectionData => {
    if (!searchTerm) return sectionData;

    const filtered = {};
    Object.entries(sectionData).forEach(([key, variable]) => {
      if (
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        filtered[key] = variable;
      }
    });
    return filtered;
  };

  const resetToDefaults = () => {
    // Reset to default values
    const defaultVariables = { ...variables };
    // This would typically reset to saved defaults
    setVariables(defaultVariables);
  };

  const exportVariables = () => {
    const exportData = JSON.stringify(variables, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model_variables.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Sliders" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Variable Inputs</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName={editMode ? 'Check' : 'Edit'}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
          <Button
            variant="outline" size="sm" iconName="Download"
            onClick={exportVariables}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-smooth ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon name={section.icon} size={16} />
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Variables Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(getVariablesByCategory(filteredVariables(variables[activeSection]))).map(
          ([category, categoryVariables]) => (
            <div key={category} className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center space-x-2">
                <Icon name="Folder" size={16} />
                <span>{category}</span>
              </h4>
              <div className="space-y-3">
                {categoryVariables.map(variable => (
                  <div
                    key={variable.key}
                    className="p-3 bg-background border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-foreground capitalize">
                          {variable.key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-xs text-muted-foreground">{variable.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {editMode ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={formatValue(variable.value, variable.unit)}
                              onChange={e =>
                                handleVariableChange(activeSection, variable.key, e.target.value)
                              }
                              step={variable.unit === '%' ? '0.1' : '0.01'}
                              className="w-20 px-2 py-1 text-sm bg-input border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <span className="text-sm text-muted-foreground">{variable.unit}</span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-lg font-semibold text-foreground">
                              {formatValue(variable.value, variable.unit)}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">
                              {variable.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variable Impact Indicator */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full" />
                        <span className="text-muted-foreground">Within range</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Icon name="TrendingUp" size={12} />
                        <span>High impact</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {Object.keys(filteredVariables(variables[activeSection])).length === 0 && (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No variables found</h4>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={12} />
            <span>Changes auto-save every 30 seconds</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" size="sm" iconName="RotateCcw"
              onClick={resetToDefaults}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Grid"
              onClick={() => onBulkEdit && onBulkEdit()}
            >
              Bulk Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableInputs;
