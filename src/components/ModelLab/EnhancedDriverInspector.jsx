import React, { useState, useMemo } from 'react';

import { computeModelOutputs } from '../../services/calculators';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
};

const NudgeButton = ({ label, onChange, currentValue, delta, suffix = '' }) => {
  const handleNudge = (direction) => {
    const newValue = currentValue + (delta * direction);
    onChange(newValue);
  };

  const calculateImpact = (direction) => {
    const testModel = {
      kind: 'DCF', // This would need to be passed in
      assumptions: { ...currentValue, [label.toLowerCase()]: currentValue + (delta * direction) }
    };
    // This is a simplified impact calculation - would need full model context
    return delta * direction;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleNudge(-1)}
        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs flex items-center justify-center transition-colors"
        title={`Decrease ${label} by ${delta}${suffix}`}
      >
        −
      </button>
      <button
        onClick={() => handleNudge(1)}
        className="w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-700 text-xs flex items-center justify-center transition-colors"
        title={`Increase ${label} by ${delta}${suffix}`}
      >
        +
      </button>
    </div>
  );
};

const EnhancedDriverInspector = ({ model, onModelUpdate, lastSavedModel }) => {
  const [expandedDrivers, setExpandedDrivers] = useState(new Set());
  const [showImpacts, setShowImpacts] = useState(false);

  const driverMapping = {
    DCF: [
      {
        key: 'rev0',
        label: 'Revenue₀',
        affects: ['EBIT', 'NOPAT', 'FCFF', 'EV', 'Per‑share'],
        nudgeDelta: 100_000_000,
        suffix: '$'
      },
      {
        key: 'margin',
        label: 'EBIT Margin',
        affects: ['EBIT', 'NOPAT', 'FCFF', 'EV', 'Per‑share'],
        nudgeDelta: 0.005,
        suffix: '%'
      },
      {
        key: 'tax',
        label: 'Tax Rate',
        affects: ['NOPAT', 'FCFF', 'EV', 'Per‑share'],
        nudgeDelta: 0.005,
        suffix: '%'
      },
      {
        key: 'wacc',
        label: 'WACC',
        affects: ['PV', 'TV', 'EV', 'Per‑share'],
        nudgeDelta: 0.0025,
        suffix: '%'
      },
      {
        key: 'tg',
        label: 'Terminal g',
        affects: ['TV', 'EV', 'Per‑share'],
        nudgeDelta: 0.001,
        suffix: '%'
      },
      {
        key: 'netDebt',
        label: 'Net Debt',
        affects: ['Equity', 'Per‑share'],
        nudgeDelta: 100_000_000,
        suffix: '$'
      },
      {
        key: 'shares',
        label: 'Shares',
        affects: ['Per‑share'],
        nudgeDelta: 10_000_000,
        suffix: ''
      }
    ],
    Comps: [
      {
        key: 'metric',
        label: 'Metric',
        affects: ['EV', 'Per‑share'],
        nudgeDelta: 50_000_000,
        suffix: '$'
      },
      {
        key: 'multiple',
        label: 'EV/Metric',
        affects: ['EV', 'Per‑share'],
        nudgeDelta: 0.5,
        suffix: 'x'
      },
      {
        key: 'netDebt',
        label: 'Net Debt',
        affects: ['Equity', 'Per‑share'],
        nudgeDelta: 100_000_000,
        suffix: '$'
      },
      {
        key: 'shares',
        label: 'Shares',
        affects: ['Per‑share'],
        nudgeDelta: 10_000_000,
        suffix: ''
      }
    ],
    EPV: [
      {
        key: 'ebit',
        label: 'EBIT',
        affects: ['NOPAT', 'EV', 'Per‑share'],
        nudgeDelta: 50_000_000,
        suffix: '$'
      },
      {
        key: 'tax',
        label: 'Tax Rate',
        affects: ['NOPAT', 'EV', 'Per‑share'],
        nudgeDelta: 0.005,
        suffix: '%'
      },
      {
        key: 'wacc',
        label: 'WACC',
        affects: ['EV', 'Per‑share'],
        nudgeDelta: 0.0025,
        suffix: '%'
      },
      {
        key: 'netDebt',
        label: 'Net Debt',
        affects: ['Equity', 'Per‑share'],
        nudgeDelta: 100_000_000,
        suffix: '$'
      },
      {
        key: 'shares',
        label: 'Shares',
        affects: ['Per‑share'],
        nudgeDelta: 10_000_000,
        suffix: ''
      }
    ],
    LBO: [
      {
        key: 'ebitda',
        label: 'EBITDA₀',
        affects: ['Entry EV', 'Equity₀', 'IRR'],
        nudgeDelta: 50_000_000,
        suffix: '$'
      },
      {
        key: 'entryX',
        label: 'Entry Multiple',
        affects: ['IRR'],
        nudgeDelta: 0.5,
        suffix: 'x'
      },
      {
        key: 'exitX',
        label: 'Exit Multiple',
        affects: ['IRR'],
        nudgeDelta: 0.5,
        suffix: 'x'
      },
      {
        key: 'debtPct',
        label: 'Debt %',
        affects: ['Equity₀', 'IRR'],
        nudgeDelta: 0.05,
        suffix: '%'
      },
      {
        key: 'years',
        label: 'Hold (yrs)',
        affects: ['IRR'],
        nudgeDelta: 1,
        suffix: ''
      },
      {
        key: 'ebitdaCAGR',
        label: 'EBITDA CAGR',
        affects: ['IRR'],
        nudgeDelta: 0.01,
        suffix: '%'
      }
    ]
  };

  const drivers = driverMapping[model.kind] || [];

  // Calculate impact of nudges
  const calculateNudgeImpact = (driverKey, delta) => {
    const testAssumptions = {
      ...model.assumptions,
      [driverKey]: (model.assumptions[driverKey] || 0) + delta
    };

    const testModel = { ...model, assumptions: testAssumptions };
    const testOutputs = computeModelOutputs(testModel);
    const currentOutputs = model.outputs || {};

    const impacts = {};
    if (testOutputs.ev !== undefined && currentOutputs.ev !== undefined) {
      impacts.ev = testOutputs.ev - currentOutputs.ev;
    }
    if (testOutputs.perShare !== undefined && currentOutputs.perShare !== undefined) {
      impacts.perShare = testOutputs.perShare - currentOutputs.perShare;
    }
    if (testOutputs.irr !== undefined && currentOutputs.irr !== undefined) {
      impacts.irr = testOutputs.irr - currentOutputs.irr;
    }

    return impacts;
  };

  // Track changes since last save
  const changedFields = useMemo(() => {
    if (!lastSavedModel) return new Set();

    const changed = new Set();
    Object.keys(model.assumptions).forEach(key => {
      if (model.assumptions[key] !== lastSavedModel.assumptions?.[key]) {
        changed.add(key);
      }
    });
    return changed;
  }, [model.assumptions, lastSavedModel]);

  const handleNudge = (driverKey, delta) => {
    const currentValue = model.assumptions[driverKey] || 0;
    const newValue = currentValue + delta;

    const updatedAssumptions = {
      ...model.assumptions,
      [driverKey]: newValue
    };

    onModelUpdate(updatedAssumptions);
  };

  const revertField = (driverKey) => {
    if (!lastSavedModel) return;

    const originalValue = lastSavedModel.assumptions[driverKey];
    const updatedAssumptions = {
      ...model.assumptions,
      [driverKey]: originalValue
    };

    onModelUpdate(updatedAssumptions);
  };

  const formatValue = (value, suffix) => {
    if (suffix === '$' && value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (suffix === '$' && value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    if (suffix === '%') return `${(value * 100).toFixed(1)}%`;
    return `${value}${suffix}`;
  };

  const formatImpact = (impact, type) => {
    if (impact === undefined) return '—';

    if (type === 'ev') {
      const sign = impact >= 0 ? '+' : '';
      if (Math.abs(impact) >= 1e9) return `${sign}$${(impact / 1e9).toFixed(1)}B`;
      if (Math.abs(impact) >= 1e6) return `${sign}$${(impact / 1e6).toFixed(0)}M`;
      return `${sign}$${impact.toFixed(0)}`;
    }

    if (type === 'perShare') {
      const sign = impact >= 0 ? '+' : '';
      return `${sign}$${impact.toFixed(2)}`;
    }

    if (type === 'irr') {
      const sign = impact >= 0 ? '+' : '';
      return `${sign}${(impact * 100).toFixed(1)}%`;
    }

    return impact.toFixed(2);
  };

  return (
    <Card
      title="Driver Inspector"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="amber">{model.kind}</Pill>
          <button
            onClick={() => setShowImpacts(!showImpacts)}
            className={`text-[11px] px-2 py-1 rounded transition-colors ${
              showImpacts ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Impacts
          </button>
        </div>
      }
    >
      <ul className="space-y-2 text-[12px]">
        {drivers.map((driver, i) => {
          const isChanged = changedFields.has(driver.key);
          const currentValue = model.assumptions[driver.key] || 0;
          const isExpanded = expandedDrivers.has(driver.key);

          return (
            <li
              key={i} className={`rounded border p-2 transition-colors ${
                isChanged ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedDrivers);
                      if (isExpanded) {
                        newExpanded.delete(driver.key);
                      } else {
                        newExpanded.add(driver.key);
                      }
                      setExpandedDrivers(newExpanded);
                    }}
                    className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-700"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                  <span className={`text-slate-700 ${isChanged ? 'font-semibold' : ''}`}>
                    {driver.label}
                  </span>
                  {isChanged && (
                    <span className="text-amber-600 text-[10px]">●</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">
                    {formatValue(currentValue, driver.suffix)}
                  </span>

                  {/* Nudge buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNudge(driver.key, -driver.nudgeDelta)}
                      className="w-5 h-5 rounded text-[10px] bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors"
                      title={`Decrease by ${formatValue(driver.nudgeDelta, driver.suffix)}`}
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleNudge(driver.key, driver.nudgeDelta)}
                      className="w-5 h-5 rounded text-[10px] bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors"
                      title={`Increase by ${formatValue(driver.nudgeDelta, driver.suffix)}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Revert button for changed fields */}
                  {isChanged && lastSavedModel && (
                    <button
                      onClick={() => revertField(driver.key)}
                      className="w-5 h-5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                      title="Revert to saved value"
                    >
                      ↶
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded view */}
              {isExpanded && (
                <div className="mt-2 pl-6 border-l-2 border-slate-200">
                  <div className="text-[11px] text-slate-600 mb-1">Affects:</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {driver.affects.map(affect => (
                      <span key={affect} className="bg-white px-2 py-1 rounded border text-[10px]">
                        {affect}
                      </span>
                    ))}
                  </div>

                  {/* Impact analysis */}
                  {showImpacts && (
                    <div className="mt-2">
                      <div className="text-[11px] text-slate-600 mb-1">
                        Impact of {formatValue(driver.nudgeDelta, driver.suffix)} change:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {['positive', 'negative'].map(direction => {
                          const delta = direction === 'positive' ? driver.nudgeDelta : -driver.nudgeDelta;
                          const impacts = calculateNudgeImpact(driver.key, delta);

                          return (
                            <div
                              key={direction} className={`p-2 rounded border ${
                                direction === 'positive' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div
                                className={`font-medium ${
                                  direction === 'positive' ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {direction === 'positive' ? '+' : '−'}{formatValue(Math.abs(delta), driver.suffix)}
                              </div>
                              {impacts.ev !== undefined && (
                                <div>EV: {formatImpact(impacts.ev, 'ev')}</div>
                              )}
                              {impacts.perShare !== undefined && (
                                <div>Per-share: {formatImpact(impacts.perShare, 'perShare')}</div>
                              )}
                              {impacts.irr !== undefined && (
                                <div>IRR: {formatImpact(impacts.irr, 'irr')}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {changedFields.size > 0 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[11px]">
          <div className="font-medium text-amber-800">
            {changedFields.size} field(s) changed since last save
          </div>
          <div className="text-amber-700">
            Changes: {Array.from(changedFields).join(', ')}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedDriverInspector;
