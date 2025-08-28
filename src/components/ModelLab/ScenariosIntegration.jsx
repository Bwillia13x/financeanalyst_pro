import { Layers, Play, BarChart3, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { computeModelOutputs } from '../../services/calculators';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && (
          <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>
        )}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate', size = 'sm' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    xs: 'text-[10px] px-1.5 py-0.5'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${tones[tone]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

const ScenarioCard = ({ scenario, onUpdate, onDelete, onRun, isRunning = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = value => {
    if (!value) return '—';
    return value >= 1e9
      ? `$${(value / 1e9).toFixed(1)}B`
      : value >= 1e6
        ? `$${(value / 1e6).toFixed(0)}M`
        : `$${value.toLocaleString()}`;
  };

  const getScenarioColor = type => {
    switch (type) {
      case 'bull':
        return 'green';
      case 'bear':
        return 'red';
      case 'base':
        return 'blue';
      case 'stress':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getScenarioIcon = type => {
    switch (type) {
      case 'bull':
        return <TrendingUp className="w-3 h-3" />;
      case 'bear':
        return <AlertTriangle className="w-3 h-3" />;
      case 'stress':
        return <Zap className="w-3 h-3" />;
      default:
        return <BarChart3 className="w-3 h-3" />;
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[11px] transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>

            <Pill tone={getScenarioColor(scenario.type)} size="xs">
              {getScenarioIcon(scenario.type)}
              {scenario.type}
            </Pill>

            <span className="text-[12px] font-medium">{scenario.name}</span>

            <Pill size="xs">{scenario.probability}%</Pill>
          </div>

          <div className="flex items-center gap-2">
            {scenario.results && (
              <span className="text-[11px] text-slate-600">
                {formatCurrency(scenario.results.ev)}
              </span>
            )}

            <button
              onClick={() => onRun(scenario)}
              disabled={isRunning}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                isRunning
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
              title="Run scenario"
            >
              <Play className="w-3 h-3" />
            </button>

            <button
              onClick={() => onDelete(scenario.id)}
              className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
              title="Delete scenario"
            >
              ×
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            {/* Basic settings */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor={`scenario-name-${scenario.id}`}
                  className="block text-[10px] font-medium text-slate-600 mb-1"
                >
                  Scenario Name
                </label>
                <input
                  id={`scenario-name-${scenario.id}`}
                  type="text"
                  value={scenario.name}
                  onChange={e => onUpdate(scenario.id, { name: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                />
              </div>
              <div>
                <label
                  htmlFor={`scenario-type-${scenario.id}`}
                  className="block text-[10px] font-medium text-slate-600 mb-1"
                >
                  Type
                </label>
                <select
                  id={`scenario-type-${scenario.id}`}
                  value={scenario.type}
                  onChange={e => onUpdate(scenario.id, { type: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                >
                  <option value="base">Base Case</option>
                  <option value="bull">Bull Case</option>
                  <option value="bear">Bear Case</option>
                  <option value="stress">Stress Test</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor={`scenario-prob-${scenario.id}`}
                  className="block text-[10px] font-medium text-slate-600 mb-1"
                >
                  Probability (%)
                </label>
                <input
                  id={`scenario-prob-${scenario.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={scenario.probability}
                  onChange={e =>
                    onUpdate(scenario.id, { probability: parseInt(e.target.value) || 0 })
                  }
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                />
              </div>
            </div>

            {/* Scenario adjustments */}
            <div>
              <div className="text-[11px] font-medium text-slate-700 mb-2">
                Assumption Adjustments
              </div>
              <div className="space-y-2">
                {Object.entries(scenario.adjustments || {}).map(([key, adjustment]) => (
                  <div
                    key={key}
                    className="grid grid-cols-4 gap-2 items-center p-2 bg-slate-50 rounded"
                  >
                    <div className="text-[10px] font-medium">{key}</div>
                    <select
                      value={adjustment.type}
                      onChange={e =>
                        onUpdate(scenario.id, {
                          adjustments: {
                            ...scenario.adjustments,
                            [key]: { ...adjustment, type: e.target.value }
                          }
                        })
                      }
                      className="text-[10px] px-1 py-1 border border-slate-200 rounded"
                    >
                      <option value="multiply">Multiply</option>
                      <option value="add">Add</option>
                      <option value="replace">Replace</option>
                      <option value="percentage">Percentage</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustment.value}
                      onChange={e =>
                        onUpdate(scenario.id, {
                          adjustments: {
                            ...scenario.adjustments,
                            [key]: { ...adjustment, value: parseFloat(e.target.value) || 0 }
                          }
                        })
                      }
                      className="text-[10px] px-1 py-1 border border-slate-200 rounded"
                    />
                    <button
                      onClick={() => {
                        const newAdjustments = { ...scenario.adjustments };
                        delete newAdjustments[key];
                        onUpdate(scenario.id, { adjustments: newAdjustments });
                      }}
                      className="text-[10px] text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newKey = prompt('Assumption key (e.g., rev0, margin, wacc):');
                    if (newKey) {
                      onUpdate(scenario.id, {
                        adjustments: {
                          ...scenario.adjustments,
                          [newKey]: { type: 'multiply', value: 1.0 }
                        }
                      });
                    }
                  }}
                  className="w-full px-2 py-1 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  + Add Adjustment
                </button>
              </div>
            </div>

            {/* Results display */}
            {scenario.results && (
              <div className="p-2 bg-emerald-50 rounded">
                <div className="text-[10px] font-medium text-emerald-800 mb-1">Results</div>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div>
                    <div className="text-slate-600">Enterprise Value</div>
                    <div className="font-medium">{formatCurrency(scenario.results.ev)}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Per Share</div>
                    <div className="font-medium">{formatCurrency(scenario.results.perShare)}</div>
                  </div>
                  {scenario.results.irr && (
                    <div>
                      <div className="text-slate-600">IRR</div>
                      <div className="font-medium">{(scenario.results.irr * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor={`scenario-desc-${scenario.id}`}
                className="block text-[10px] font-medium text-slate-600 mb-1"
              >
                Description
              </label>
              <textarea
                id={`scenario-desc-${scenario.id}`}
                value={scenario.description || ''}
                onChange={e => onUpdate(scenario.id, { description: e.target.value })}
                className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded h-12 resize-none"
                placeholder="Scenario description and assumptions..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ScenariosIntegration = ({ baseModel, onScenarioSave }) => {
  const [scenarios, setScenarios] = useState([]);
  const [runningScenario, setRunningScenario] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const createScenario = (type = 'base') => {
    const presets = {
      bull: {
        name: 'Bull Case',
        adjustments: {
          rev0: { type: 'multiply', value: 1.2 },
          margin: { type: 'multiply', value: 1.1 }
        },
        probability: 25
      },
      bear: {
        name: 'Bear Case',
        adjustments: {
          rev0: { type: 'multiply', value: 0.8 },
          margin: { type: 'multiply', value: 0.9 }
        },
        probability: 25
      },
      base: {
        name: 'Base Case',
        adjustments: {},
        probability: 50
      },
      stress: {
        name: 'Stress Test',
        adjustments: {
          rev0: { type: 'multiply', value: 0.6 },
          margin: { type: 'multiply', value: 0.7 },
          wacc: { type: 'add', value: 0.02 }
        },
        probability: 10
      }
    };

    const preset = presets[type] || presets.base;

    const newScenario = {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      name: preset.name,
      description: '',
      adjustments: preset.adjustments,
      probability: preset.probability,
      createdAt: new Date().toISOString(),
      results: null
    };

    setScenarios(prev => [...prev, newScenario]);
  };

  const updateScenario = (scenarioId, updates) => {
    setScenarios(prev =>
      prev.map(scenario => (scenario.id === scenarioId ? { ...scenario, ...updates } : scenario))
    );
  };

  const deleteScenario = scenarioId => {
    setScenarios(prev => prev.filter(scenario => scenario.id !== scenarioId));
  };

  const runScenario = async scenario => {
    if (!baseModel) return;

    setRunningScenario(scenario.id);

    try {
      // Apply scenario adjustments to base model
      const adjustedAssumptions = { ...baseModel.assumptions };

      Object.entries(scenario.adjustments).forEach(([key, adjustment]) => {
        const baseValue = adjustedAssumptions[key] || 0;

        switch (adjustment.type) {
          case 'multiply':
            adjustedAssumptions[key] = baseValue * adjustment.value;
            break;
          case 'add':
            adjustedAssumptions[key] = baseValue + adjustment.value;
            break;
          case 'replace':
            adjustedAssumptions[key] = adjustment.value;
            break;
          case 'percentage':
            adjustedAssumptions[key] = baseValue * (1 + adjustment.value / 100);
            break;
          default:
            break;
        }
      });

      // Create scenario model and compute outputs
      const scenarioModel = {
        ...baseModel,
        assumptions: adjustedAssumptions
      };

      const results = computeModelOutputs(scenarioModel);

      // Update scenario with results
      updateScenario(scenario.id, {
        results,
        lastRun: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error running scenario:', error);
      alert('Error running scenario: ' + error.message);
    } finally {
      setRunningScenario(null);
    }
  };

  const runAllScenarios = async () => {
    for (const scenario of scenarios) {
      await runScenario(scenario);
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Calculate scenario summary statistics
  const scenarioSummary = useMemo(() => {
    const scenariosWithResults = scenarios.filter(s => s.results);
    if (!scenariosWithResults.length) return null;

    const values = scenariosWithResults.map(s => ({
      ev: s.results.ev || 0,
      perShare: s.results.perShare || 0,
      probability: s.probability / 100
    }));

    // Probability-weighted values
    const weightedEV = values.reduce((sum, v) => sum + v.ev * v.probability, 0);
    const weightedPerShare = values.reduce((sum, v) => sum + v.perShare * v.probability, 0);

    // Min/Max values
    const evValues = values.map(v => v.ev).sort((a, b) => a - b);
    const perShareValues = values.map(v => v.perShare).sort((a, b) => a - b);

    return {
      count: scenariosWithResults.length,
      weightedEV,
      weightedPerShare,
      evRange: { min: evValues[0], max: evValues[evValues.length - 1] },
      perShareRange: { min: perShareValues[0], max: perShareValues[perShareValues.length - 1] },
      totalProbability: values.reduce((sum, v) => sum + v.probability, 0)
    };
  }, [scenarios]);

  const formatCurrency = value => {
    if (!value) return '—';
    return value >= 1e9
      ? `$${(value / 1e9).toFixed(1)}B`
      : value >= 1e6
        ? `$${(value / 1e6).toFixed(0)}M`
        : `$${value.toLocaleString()}`;
  };

  if (!baseModel) {
    return (
      <Card title="Scenarios Integration">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">Select a model to run scenarios</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Scenarios Integration"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="blue">{scenarios.length} scenarios</Pill>
          {scenarioSummary && (
            <Pill tone="green">{formatCurrency(scenarioSummary.weightedEV)}</Pill>
          )}

          <button
            onClick={() => setShowSummary(!showSummary)}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              showSummary ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Summary
          </button>

          <select
            onChange={e => e.target.value && createScenario(e.target.value)}
            value=""
            className="text-[11px] px-2 py-1 border border-slate-200 rounded bg-white"
          >
            <option value="">Add Scenario...</option>
            <option value="base">Base Case</option>
            <option value="bull">Bull Case</option>
            <option value="bear">Bear Case</option>
            <option value="stress">Stress Test</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      }
    >
      {/* Base model info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-[11px] font-medium text-blue-800 mb-1">Base Model</div>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div>
            <div className="text-blue-700">Name</div>
            <div className="font-medium">{baseModel.name || 'Untitled'}</div>
          </div>
          <div>
            <div className="text-blue-700">Type</div>
            <div className="font-medium">{baseModel.kind}</div>
          </div>
          <div>
            <div className="text-blue-700">Base Value</div>
            <div className="font-medium">{formatCurrency(baseModel.outputs?.ev)}</div>
          </div>
        </div>
      </div>

      {/* Scenario summary */}
      {showSummary && scenarioSummary && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <div className="text-[11px] font-medium text-purple-800 mb-2">Scenario Summary</div>
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <div className="text-purple-700">Probability-Weighted EV</div>
              <div className="font-bold text-[12px]">
                {formatCurrency(scenarioSummary.weightedEV)}
              </div>
            </div>
            <div>
              <div className="text-purple-700">Probability-Weighted Per Share</div>
              <div className="font-bold text-[12px]">
                {formatCurrency(scenarioSummary.weightedPerShare)}
              </div>
            </div>
            <div>
              <div className="text-purple-700">EV Range</div>
              <div className="font-medium">
                {formatCurrency(scenarioSummary.evRange.min)} -{' '}
                {formatCurrency(scenarioSummary.evRange.max)}
              </div>
            </div>
            <div>
              <div className="text-purple-700">Total Probability</div>
              <div className="font-medium">
                {(scenarioSummary.totalProbability * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios list */}
      <div className="space-y-3">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onUpdate={updateScenario}
            onDelete={deleteScenario}
            onRun={runScenario}
            isRunning={runningScenario === scenario.id}
          />
        ))}

        {scenarios.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-[13px]">No scenarios created yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add scenarios to explore different assumptions and outcomes
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {scenarios.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={runAllScenarios}
            disabled={!!runningScenario}
            className="flex-1 px-3 py-2 text-[11px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            {runningScenario ? 'Running...' : 'Run All Scenarios'}
          </button>
          <button
            onClick={() => {
              if (onScenarioSave) {
                onScenarioSave({
                  baseModelId: baseModel.id,
                  scenarios,
                  summary: scenarioSummary,
                  createdAt: new Date().toISOString()
                });
              }
            }}
            className="px-3 py-2 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Save Analysis
          </button>
        </div>
      )}
    </Card>
  );
};

export default ScenariosIntegration;
