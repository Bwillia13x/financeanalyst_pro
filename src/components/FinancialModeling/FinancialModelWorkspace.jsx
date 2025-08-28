import React, { useState, useEffect, useCallback } from 'react';

import { trackComponentRender } from '../../utils/performanceMonitoring';

const FinancialModelWorkspace = ({ initialModel, onModelChange, onSave }) => {
  const [model, setModel] = useState(
    initialModel || {
      name: 'New Financial Model',
      assumptions: {},
      calculations: {},
      outputs: {},
      scenarios: []
    }
  );

  const [activeTab, setActiveTab] = useState('assumptions');
  const [isDirty, setIsDirty] = useState(false);
  const [calculationResults, setCalculationResults] = useState({});

  useEffect(() => {
    // Track component performance
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      trackComponentRender('FinancialModelWorkspace', endTime - startTime);
    };
  }, []);

  const handleModelChange = useCallback(
    updates => {
      const newModel = { ...model, ...updates };
      setModel(newModel);
      setIsDirty(true);

      if (onModelChange) {
        onModelChange(newModel);
      }

      // Recalculate when model changes
      recalculateModel(newModel);
    },
    [model, onModelChange]
  );

  const recalculateModel = useCallback(modelData => {
    try {
      // Simulate financial calculations
      const results = {
        npv: calculateNPV(modelData),
        irr: calculateIRR(modelData),
        paybackPeriod: calculatePaybackPeriod(modelData),
        sensitivity: calculateSensitivity(modelData)
      };

      setCalculationResults(results);
    } catch (error) {
      console.error('Error calculating model:', error);
    }
  }, []);

  const calculateNPV = modelData => {
    // Simplified NPV calculation
    const cashFlows = modelData.cashFlows || [];
    const discountRate = modelData.discountRate || 0.1;

    return cashFlows.reduce((npv, cashFlow, year) => {
      return npv + cashFlow / Math.pow(1 + discountRate, year + 1);
    }, 0);
  };

  const calculateIRR = modelData => {
    // Simplified IRR calculation
    return modelData.discountRate || 0.15;
  };

  const calculatePaybackPeriod = modelData => {
    // Simplified payback period calculation
    const cashFlows = modelData.cashFlows || [];
    let cumulative = 0;
    const initialInvestment = Math.abs(cashFlows[0] || 0);

    for (let year = 1; year < cashFlows.length; year++) {
      cumulative += cashFlows[year];
      if (cumulative >= initialInvestment) {
        return year - 1 + (initialInvestment - (cumulative - cashFlows[year])) / cashFlows[year];
      }
    }

    return null;
  };

  const calculateSensitivity = () => {
    // Simplified sensitivity analysis
    return {
      price: 0.02,
      volume: 0.03,
      cost: -0.015
    };
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(model);
    }
    setIsDirty(false);
  };

  const tabs = [
    { id: 'assumptions', label: 'Assumptions', icon: '📊' },
    { id: 'calculations', label: 'Calculations', icon: '🧮' },
    { id: 'outputs', label: 'Outputs', icon: '📈' },
    { id: 'scenarios', label: 'Scenarios', icon: '🎯' }
  ];

  return (
    <div className="financial-model-workspace">
      <div className="workspace-header">
        <div className="model-info">
          <h2>{model.name}</h2>
          {isDirty && <span className="dirty-indicator">●</span>}
        </div>
        <div className="workspace-actions">
          <button onClick={handleSave} disabled={!isDirty}>
            Save Model
          </button>
        </div>
      </div>

      <div className="workspace-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="workspace-content">
        {activeTab === 'assumptions' && (
          <div className="assumptions-panel">
            <h3>Model Assumptions</h3>
            <div className="assumptions-grid">
              <div className="assumption-item">
                <label htmlFor="discountRate">Discount Rate (%)</label>
                <input
                  type="number"
                  value={model.discountRate || 10}
                  onChange={e =>
                    handleModelChange({
                      discountRate: parseFloat(e.target.value) / 100
                    })
                  }
                  step="0.1"
                  id="discountRate"
                />
              </div>
              <div className="assumption-item">
                <label htmlFor="initialInvestment">Initial Investment</label>
                <input
                  type="number"
                  value={model.initialInvestment || 0}
                  onChange={e =>
                    handleModelChange({
                      initialInvestment: parseFloat(e.target.value)
                    })
                  }
                  id="initialInvestment"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="calculations-panel">
            <h3>Calculation Results</h3>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">NPV</span>
                <span className="result-value">
                  ${calculationResults.npv?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">IRR</span>
                <span className="result-value">
                  {((calculationResults.irr || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Payback Period</span>
                <span className="result-value">
                  {calculationResults.paybackPeriod?.toFixed(1) || 'N/A'} years
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outputs' && (
          <div className="outputs-panel">
            <h3>Model Outputs</h3>
            <div className="outputs-content">
              <pre>{JSON.stringify(model.outputs, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="scenarios-panel">
            <h3>Sensitivity Scenarios</h3>
            <div className="sensitivity-analysis">
              {calculationResults.sensitivity && (
                <div className="sensitivity-grid">
                  <div className="sensitivity-item">
                    <span className="sensitivity-label">Price Change Impact</span>
                    <span className="sensitivity-value">
                      {((calculationResults.sensitivity.price || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="sensitivity-item">
                    <span className="sensitivity-label">Volume Change Impact</span>
                    <span className="sensitivity-value">
                      {((calculationResults.sensitivity.volume || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="sensitivity-item">
                    <span className="sensitivity-label">Cost Change Impact</span>
                    <span className="sensitivity-value">
                      {((calculationResults.sensitivity.cost || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
        .financial-model-workspace {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .model-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .model-info h2 {
          margin: 0;
          color: #1e293b;
        }

        .dirty-indicator {
          color: #f59e0b;
        }

        .workspace-actions button {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .workspace-actions button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .workspace-tabs {
          display: flex;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .workspace-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .assumptions-grid,
        .results-grid,
        .sensitivity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .assumption-item,
        .result-item,
        .sensitivity-item {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .assumption-item label,
        .result-item .result-label,
        .sensitivity-item .sensitivity-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }

        .assumption-item input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }

        .result-value,
        .sensitivity-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
        }

        .outputs-content pre {
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
      `}
      </style>
    </div>
  );
};

export default FinancialModelWorkspace;
