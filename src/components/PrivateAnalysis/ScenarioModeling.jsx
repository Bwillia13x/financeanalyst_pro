import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

const ScenarioModeling = ({ data, modelInputs, onModelInputChange, calculateDCF, formatCurrency, formatPercent }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const scenarios = modelInputs.scenario?.scenarios || [];

  // Calculate DCF for each scenario
  const scenarioResults = useMemo(() => {
    return scenarios.map(scenario => {
      try {
        // Apply scenario assumptions to base DCF calculation
        const incomeStatement = { ...data.statements.incomeStatement };

        // Apply revenue growth to revenue data (object format)
        const baseRevenue = incomeStatement.totalRevenue || {};
        const modifiedRevenue = {};
        Object.keys(baseRevenue).forEach(periodIndex => {
          const index = parseInt(periodIndex);
          if (index === 0) {
            modifiedRevenue[periodIndex] = baseRevenue[periodIndex]; // Base year unchanged
          } else {
            // Apply revenue growth for projection years
            const growthRate = 1 + (scenario.revenueGrowth / 100);
            modifiedRevenue[periodIndex] = baseRevenue[0] * Math.pow(growthRate, index);
          }
        });

        // Apply margin improvement to operating income
        const baseOperating = incomeStatement.operatingIncome || {};
        const modifiedOperating = {};
        Object.keys(baseOperating).forEach(periodIndex => {
          const index = parseInt(periodIndex);
          if (index === 0) {
            modifiedOperating[periodIndex] = baseOperating[periodIndex]; // Base year unchanged
          } else {
            // Apply margin improvement
            const baseRevenueValue = baseRevenue[periodIndex] || 0;
            const scenarioRevenue = modifiedRevenue[periodIndex] || 0;
            const baseIncome = baseOperating[periodIndex] || 0;

            if (baseRevenueValue > 0) {
              const baseMargin = baseIncome / baseRevenueValue;
              const adjustedMargin = baseMargin + (scenario.marginImprovement / 100);
              modifiedOperating[periodIndex] = scenarioRevenue * adjustedMargin;
            } else {
              modifiedOperating[periodIndex] = baseIncome;
            }
          }
        });

        const scenarioData = {
          ...data,
          statements: {
            ...data.statements,
            incomeStatement: {
              ...incomeStatement,
              totalRevenue: modifiedRevenue,
              operatingIncome: modifiedOperating
            }
          }
        };

        // Calculate DCF with scenario data
        const dcfResult = calculateDCF(scenarioData);

        return {
          ...scenario,
          ...dcfResult,
          weightedValue: dcfResult.enterpriseValue * (scenario.probability / 100)
        };
      } catch (error) {
        console.error('Scenario calculation error:', error);
        return {
          ...scenario,
          enterpriseValue: 0,
          equityValue: 0,
          weightedValue: 0
        };
      }
    });
  }, [scenarios, data, calculateDCF]);

  // Calculate probability-weighted average
  const weightedAverageValue = scenarioResults.reduce((sum, result) => sum + result.weightedValue, 0);

  const addScenario = () => {
    const newScenario = {
      name: `Scenario ${scenarios.length + 1}`,
      probability: Math.max(0, 100 - scenarios.reduce((sum, s) => sum + s.probability, 0)),
      revenueGrowth: 10,
      marginImprovement: 0
    };

    onModelInputChange('scenario', 'scenarios', [...scenarios, newScenario]);
    setShowAddForm(false);
  };

  const updateScenario = (index, field, value) => {
    const updatedScenarios = scenarios.map((scenario, i) =>
      i === index ? { ...scenario, [field]: value } : scenario
    );
    onModelInputChange('scenario', 'scenarios', updatedScenarios);
  };

  const deleteScenario = (index) => {
    const updatedScenarios = scenarios.filter((_, i) => i !== index);
    onModelInputChange('scenario', 'scenarios', updatedScenarios);
  };

  const ScenarioForm = ({ scenario, index }) => (
    <div className="border rounded-lg p-4 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor={`scenario-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Scenario Name
          </label>
          <input
            id={`scenario-name-${index}`}
            type="text"
            value={scenario.name}
            onChange={(e) => updateScenario(index, 'name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter scenario name"
          />
        </div>

        <div>
          <label htmlFor={`scenario-probability-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Probability (%)
          </label>
          <input
            id={`scenario-probability-${index}`}
            type="number"
            min="0"
            max="100"
            value={scenario.probability}
            onChange={(e) => updateScenario(index, 'probability', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`scenario-revenueGrowth-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Revenue Growth (%)
          </label>
          <input
            id={`scenario-revenueGrowth-${index}`}
            type="number"
            step="0.1"
            value={scenario.revenueGrowth}
            onChange={(e) => updateScenario(index, 'revenueGrowth', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`scenario-marginImprovement-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Margin Change (%)
          </label>
          <input
            id={`scenario-marginImprovement-${index}`}
            type="number"
            step="0.1"
            value={scenario.marginImprovement}
            onChange={(e) => updateScenario(index, 'marginImprovement', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={() => deleteScenario(index)}
          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Create and compare multiple financial scenarios with different assumptions and probabilities.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Add Scenario
        </button>
      </div>

      {/* Scenario Management */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Scenario Assumptions</h4>

        {scenarios.map((scenario, index) => (
          <ScenarioForm key={index} scenario={scenario} index={index} />
        ))}

        {showAddForm && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium">Add New Scenario</h5>
              <div className="flex gap-2">
                <button
                  onClick={addScenario}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Display */}
      {scenarioResults.length > 0 && (
        <div className="space-y-6">
          <h4 className="font-semibold text-lg">Scenario Analysis Results</h4>

          {/* Probability-Weighted Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-blue-600" />
              <h5 className="font-semibold text-blue-800">Probability-Weighted Valuation</h5>
            </div>
            <div className="text-3xl font-bold text-blue-800">
              {formatCurrency(weightedAverageValue)}
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Expected value based on scenario probabilities
            </p>
          </div>

          {/* Individual Scenario Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenarioResults.map((result, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h6 className="font-semibold text-gray-800">{result.name}</h6>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{result.probability}% probability</span>
                      {result.revenueGrowth > 15 ?
                        <TrendingUp size={14} className="text-green-500" /> :
                        result.revenueGrowth < 5 ?
                          <TrendingDown size={14} className="text-red-500" /> :
                          <Minus size={14} className="text-gray-500" />
                      }
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Enterprise Value</div>
                    <div className="text-xl font-bold text-gray-800">
                      {formatCurrency(result.enterpriseValue)}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Revenue Growth:</span>
                      <span className="font-medium">{formatPercent(result.revenueGrowth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin Change:</span>
                      <span className={`font-medium ${result.marginImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.marginImprovement >= 0 ? '+' : ''}{formatPercent(result.marginImprovement)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weighted Value:</span>
                      <span className="font-medium">{formatCurrency(result.weightedValue)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-lg border p-6">
            <h5 className="font-semibold mb-4">Scenario Statistics</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(Math.max(...scenarioResults.map(r => r.enterpriseValue)))}
                </div>
                <div className="text-sm text-gray-600">Best Case</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(Math.min(...scenarioResults.map(r => r.enterpriseValue)))}
                </div>
                <div className="text-sm text-gray-600">Worst Case</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(weightedAverageValue)}
                </div>
                <div className="text-sm text-gray-600">Expected Value</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {formatCurrency(Math.max(...scenarioResults.map(r => r.enterpriseValue)) - Math.min(...scenarioResults.map(r => r.enterpriseValue)))}
                </div>
                <div className="text-sm text-gray-600">Value Range</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <strong>Total Probability:</strong> {scenarios.reduce((sum, s) => sum + s.probability, 0)}%
                {scenarios.reduce((sum, s) => sum + s.probability, 0) !== 100 && (
                  <span className="text-orange-600 ml-2">⚠ Probabilities should sum to 100%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {scenarios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No scenarios created yet.</p>
          <p className="text-sm mt-2">Click &ldquo;Add Scenario&rdquo; to get started with scenario modeling.</p>
        </div>
      )}
    </div>
  );
};

export default ScenarioModeling;
