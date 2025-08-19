import { Activity, Settings, BarChart3, Plus, Minus } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const SensitivityAnalysis = ({ data, modelInputs, onModelInputChange, calculateDCF, formatCurrency, _formatPercent }) => {
  const [selectedVariable, _setSelectedVariable] = useState(null);

  const sensitivityConfig = modelInputs.sensitivity || {
    variables: ['revenue', 'grossMargin', 'discountRate'],
    ranges: {
      revenue: { min: -20, max: 20 },
      grossMargin: { min: -5, max: 5 },
      discountRate: { min: 8, max: 15 }
    }
  };

  // Variable definitions with display names and units
  const variableDefinitions = {
    revenue: {
      name: 'Revenue Growth',
      unit: '%',
      description: 'Annual revenue growth rate',
      baseValue: 15,
      isPercentage: true
    },
    grossMargin: {
      name: 'Gross Margin',
      unit: '%',
      description: 'Gross profit margin improvement',
      baseValue: 45,
      isPercentage: true
    },
    discountRate: {
      name: 'Discount Rate (WACC)',
      unit: '%',
      description: 'Weighted average cost of capital',
      baseValue: modelInputs.dcf?.discountRate || 10,
      isPercentage: true
    },
    terminalGrowthRate: {
      name: 'Terminal Growth Rate',
      unit: '%',
      description: 'Long-term growth rate assumption',
      baseValue: modelInputs.dcf?.terminalGrowthRate || 2.5,
      isPercentage: true
    },
    taxRate: {
      name: 'Tax Rate',
      unit: '%',
      description: 'Corporate tax rate',
      baseValue: modelInputs.dcf?.taxRate || 25,
      isPercentage: true
    }
  };

  // Calculate base case valuation
  const baseValuation = useMemo(() => {
    return calculateDCF();
  }, [data, modelInputs, calculateDCF]);

  // Generate sensitivity analysis data
  const sensitivityResults = useMemo(() => {
    const results = {};

    sensitivityConfig.variables.forEach(variable => {
      const range = sensitivityConfig.ranges[variable];
      const variableDef = variableDefinitions[variable];

      if (!range || !variableDef) return;

      const steps = 9; // Number of data points
      const stepSize = (range.max - range.min) / (steps - 1);
      const dataPoints = [];

      for (let i = 0; i < steps; i++) {
        const value = range.min + (stepSize * i);

        // Create modified DCF inputs based on variable type
        let modifiedData = { ...data };
        const dcfInputs = {
          ...modelInputs.dcf,
          [variable]: variableDef.isPercentage ? value : value
        };

        // For revenue and margin variables, we need to simulate the impact
        if (variable === 'revenue' || variable === 'grossMargin') {
          // Create a copy of the income statement with modified values
          const incomeStatement = { ...data.statements.incomeStatement };

          if (variable === 'revenue') {
            // Apply revenue growth change across periods
            const baseRevenue = incomeStatement.totalRevenue || {};
            const modifiedRevenue = {};

            Object.keys(baseRevenue).forEach(periodIndex => {
              const index = parseInt(periodIndex);
              if (index === 0) {
                modifiedRevenue[periodIndex] = baseRevenue[periodIndex];
              } else {
                const growthRate = 1 + (value / 100);
                modifiedRevenue[periodIndex] = baseRevenue[0] * Math.pow(growthRate, index);
              }
            });

            incomeStatement.totalRevenue = modifiedRevenue;
          }

          if (variable === 'grossMargin') {
            // Apply margin change to operating income
            const baseOperating = incomeStatement.operatingIncome || {};
            const baseRevenue = incomeStatement.totalRevenue || {};
            const modifiedOperating = {};

            Object.keys(baseOperating).forEach(periodIndex => {
              const revenue = baseRevenue[periodIndex] || 0;
              const originalIncome = baseOperating[periodIndex] || 0;
              if (revenue > 0) {
                const baseMargin = originalIncome / revenue;
                const adjustedMargin = baseMargin + (value / 100);
                modifiedOperating[periodIndex] = revenue * adjustedMargin;
              } else {
                modifiedOperating[periodIndex] = originalIncome;
              }
            });

            incomeStatement.operatingIncome = modifiedOperating;
          }

          modifiedData = {
            ...data,
            statements: {
              ...data.statements,
              incomeStatement
            }
          };
        }

        // Use a temporary calculateDCF with modified inputs
        const tempCalculateDCF = () => {
          try {
            const dcfParams = {
              discountRate: dcfInputs.discountRate || 10,
              terminalGrowthRate: dcfInputs.terminalGrowthRate || 2.5,
              projectionYears: dcfInputs.projectionYears || 5,
              taxRate: dcfInputs.taxRate || 25
            };

            const sourceData = modifiedData;
            const operatingIncomeData = sourceData.statements.incomeStatement.operatingIncome || {};

            // Extract operating incomes from object structure
            const operatingIncomes = [];
            Object.keys(operatingIncomeData).forEach(periodKey => {
              const index = parseInt(periodKey);
              if (index >= 0) {
                operatingIncomes.push(operatingIncomeData[periodKey] || 0);
              }
            });

            if (operatingIncomes.length === 0) return { enterpriseValue: 0, equityValue: 0 };

            let presentValue = 0;
            const discountFactor = 1 + (dcfParams.discountRate / 100);

            // Use available periods for projections
            operatingIncomes.forEach((income, index) => {
              if (index > 0 && index <= dcfParams.projectionYears) {
                const afterTaxIncome = income * (1 - dcfParams.taxRate / 100);
                const pv = afterTaxIncome / Math.pow(discountFactor, index);
                presentValue += pv;
              }
            });

            const lastYearIncome = operatingIncomes[operatingIncomes.length - 1] || 0;
            const terminalCashFlow = lastYearIncome * (1 + dcfParams.terminalGrowthRate / 100) * (1 - dcfParams.taxRate / 100);
            const terminalValue = terminalCashFlow / ((dcfParams.discountRate - dcfParams.terminalGrowthRate) / 100);
            const presentTerminalValue = terminalValue / Math.pow(discountFactor, dcfParams.projectionYears);

            const enterpriseValue = presentValue + presentTerminalValue;

            return {
              enterpriseValue,
              equityValue: enterpriseValue,
              presentValueOperations: presentValue,
              presentValueTerminal: presentTerminalValue,
              terminalValue
            };
          } catch (error) {
            console.error('DCF calculation error:', error);
            return { enterpriseValue: 0, equityValue: 0 };
          }
        };

        const result = tempCalculateDCF();

        dataPoints.push({
          variable: value,
          valuation: result.enterpriseValue,
          changeFromBase: ((result.enterpriseValue - baseValuation.enterpriseValue) / baseValuation.enterpriseValue) * 100
        });
      }

      results[variable] = {
        definition: variableDef,
        range,
        dataPoints
      };
    });

    return results;
  }, [data, modelInputs, sensitivityConfig, baseValuation, calculateDCF]);

  // Tornado chart data (impact ranking)
  const tornadoData = useMemo(() => {
    return Object.entries(sensitivityResults).map(([variable, result]) => {
      const maxImpact = Math.max(...result.dataPoints.map(d => Math.abs(d.changeFromBase)));
      return {
        variable,
        definition: result.definition,
        maxImpact,
        positiveImpact: Math.max(...result.dataPoints.map(d => d.changeFromBase)),
        negativeImpact: Math.min(...result.dataPoints.map(d => d.changeFromBase))
      };
    }).sort((a, b) => b.maxImpact - a.maxImpact);
  }, [sensitivityResults]);

  const updateSensitivityRange = (variable, field, value) => {
    const updatedRanges = {
      ...sensitivityConfig.ranges,
      [variable]: {
        ...sensitivityConfig.ranges[variable],
        [field]: parseFloat(value)
      }
    };
    onModelInputChange('sensitivity', 'ranges', updatedRanges);
  };

  const addVariable = (variableName) => {
    if (!sensitivityConfig.variables.includes(variableName) && variableDefinitions[variableName]) {
      const updatedVariables = [...sensitivityConfig.variables, variableName];
      const updatedRanges = {
        ...sensitivityConfig.ranges,
        [variableName]: { min: -10, max: 10 }
      };
      onModelInputChange('sensitivity', 'variables', updatedVariables);
      onModelInputChange('sensitivity', 'ranges', updatedRanges);
    }
  };

  const removeVariable = (variableName) => {
    const updatedVariables = sensitivityConfig.variables.filter(v => v !== variableName);
    const { [variableName]: _removed, ...updatedRanges } = sensitivityConfig.ranges;
    onModelInputChange('sensitivity', 'variables', updatedVariables);
    onModelInputChange('sensitivity', 'ranges', updatedRanges);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 mb-4">
            Analyze how changes in key variables impact enterprise valuation.
            Higher sensitivity indicates greater risk and importance for due diligence.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Base Case: {formatCurrency(baseValuation.enterpriseValue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span>{sensitivityConfig.variables.length} variables analyzed</span>
            </div>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Settings size={16} />
          Configure
        </button>
      </div>

      {/* Tornado Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Impact Ranking (Tornado Chart)
        </h4>

        <div className="space-y-3">
          {tornadoData.map((item, index) => (
            <div key={item.variable} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{index + 1}. {item.definition.name}</span>
                <span className="text-xs text-gray-500">±{item.maxImpact.toFixed(1)}%</span>
              </div>

              <div className="relative h-8 bg-gray-100 rounded">
                {/* Negative impact bar */}
                <div
                  className="absolute left-1/2 h-full bg-red-400 rounded-l"
                  style={{
                    width: `${Math.abs(item.negativeImpact) / Math.max(Math.abs(item.negativeImpact), item.positiveImpact) * 50}%`,
                    transform: 'translateX(-100%)'
                  }}
                />

                {/* Positive impact bar */}
                <div
                  className="absolute left-1/2 h-full bg-green-400 rounded-r"
                  style={{
                    width: `${item.positiveImpact / Math.max(Math.abs(item.negativeImpact), item.positiveImpact) * 50}%`
                  }}
                />

                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 transform -translate-x-0.5" />

                {/* Labels */}
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-white">
                  <span>{item.negativeImpact.toFixed(1)}%</span>
                  <span>+{item.positiveImpact.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variable Configuration */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="font-semibold text-lg mb-4">Variable Configuration</h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sensitivityConfig.variables.map(variable => {
            const result = sensitivityResults[variable];
            if (!result) return null;

            return (
              <div key={variable} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h6 className="font-medium">{result.definition.name}</h6>
                    <p className="text-xs text-gray-500">{result.definition.description}</p>
                  </div>
                  <button
                    onClick={() => removeVariable(variable)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Minus size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Value ({result.definition.unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={result.range.min}
                      onChange={(e) => updateSensitivityRange(variable, 'min', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Value ({result.definition.unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={result.range.max}
                      onChange={(e) => updateSensitivityRange(variable, 'max', e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Mini chart */}
                <div className="h-16 bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">Valuation Sensitivity</div>
                  <div className="flex items-end justify-between h-8">
                    {result.dataPoints.map((point, index) => (
                      <div
                        key={index}
                        className={`w-1 rounded-t ${
                          point.changeFromBase > 0 ? 'bg-green-400' :
                            point.changeFromBase < 0 ? 'bg-red-400' : 'bg-blue-400'
                        }`}
                        style={{
                          height: `${Math.abs(point.changeFromBase) / 50 * 100}%`,
                          minHeight: '2px'
                        }}
                        title={`${point.variable}${result.definition.unit}: ${formatCurrency(point.valuation)}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Variable */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <Plus size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-3">Add Variable</p>
              <div className="space-y-2">
                {Object.keys(variableDefinitions)
                  .filter(v => !sensitivityConfig.variables.includes(v))
                  .map(variable => (
                    <button
                      key={variable}
                      onClick={() => addVariable(variable)}
                      className="block w-full px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {variableDefinitions[variable].name}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      {selectedVariable && sensitivityResults[selectedVariable] && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold text-lg mb-4">
            Detailed Analysis: {sensitivityResults[selectedVariable].definition.name}
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h6 className="font-medium mb-3">Data Points</h6>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sensitivityResults[selectedVariable].dataPoints.map((point, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <span>{point.variable}{sensitivityResults[selectedVariable].definition.unit}</span>
                    <span className="font-medium">{formatCurrency(point.valuation)}</span>
                    <span
                      className={`font-medium ${
                        point.changeFromBase > 0 ? 'text-green-600' :
                          point.changeFromBase < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {point.changeFromBase > 0 ? '+' : ''}{point.changeFromBase.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h6 className="font-medium mb-3">Key Statistics</h6>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Range Impact:</span>
                  <span className="font-medium">
                    ±{Math.max(...sensitivityResults[selectedVariable].dataPoints.map(d => Math.abs(d.changeFromBase))).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Upside:</span>
                  <span className="font-medium text-green-600">
                    +{Math.max(...sensitivityResults[selectedVariable].dataPoints.map(d => d.changeFromBase)).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Downside:</span>
                  <span className="font-medium text-red-600">
                    {Math.min(...sensitivityResults[selectedVariable].dataPoints.map(d => d.changeFromBase)).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensitivityAnalysis;
