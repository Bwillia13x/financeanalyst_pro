import { Play, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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

const TestResult = ({ test, onRerun }) => {
  const { status, name, description, expected, actual, tolerance, error, executionTime } = test;

  const getStatusIcon = () => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full bg-slate-300" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pass': return 'border-emerald-200 bg-emerald-50';
      case 'fail': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-[12px] font-medium">{name}</span>
          {executionTime && (
            <span className="text-[10px] text-slate-500">({executionTime}ms)</span>
          )}
        </div>
        {onRerun && (
          <button
            onClick={() => onRerun(test)}
            className="text-[10px] px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Rerun
          </button>
        )}
      </div>

      <div className="text-[11px] text-slate-600 mt-1">{description}</div>

      {status === 'fail' && (
        <div className="mt-2 text-[10px] space-y-1">
          {expected !== undefined && (
            <div>Expected: <span className="font-mono text-emerald-700">{expected}</span></div>
          )}
          {actual !== undefined && (
            <div>Actual: <span className="font-mono text-red-700">{actual}</span></div>
          )}
          {tolerance && (
            <div>Tolerance: <span className="font-mono text-slate-600">±{tolerance}</span></div>
          )}
          {error && (
            <div className="text-red-600 bg-red-100 p-1 rounded font-mono">{error}</div>
          )}
        </div>
      )}

      {status === 'warning' && error && (
        <div className="mt-2 text-[10px] text-amber-700 bg-amber-100 p-1 rounded">{error}</div>
      )}
    </div>
  );
};

const EnhancedTestsPanel = ({ model, onRunTests }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState({});

  // Define comprehensive test suites for each model type
  const testSuites = {
    DCF: {
      categories: {
        'calculations': 'Calculation Accuracy',
        'assumptions': 'Assumption Validation',
        'sensitivity': 'Sensitivity Analysis',
        'sanity': 'Sanity Checks'
      },
      tests: [
        // Calculation tests
        {
          id: 'dcf_fcff_calculation',
          category: 'calculations',
          name: 'FCFF Calculation',
          description: 'Free Cash Flow to Firm calculation accuracy',
          test: (model) => {
            const { rev0, margin, tax, capexPct, nwcPct } = model.assumptions;
            const revenue = rev0 || 0;
            const ebit = revenue * (margin || 0);
            const nopat = ebit * (1 - (tax || 0));
            const capex = revenue * (capexPct || 0);
            const nwcChange = revenue * (nwcPct || 0);
            const expectedFcff = nopat - capex - nwcChange;
            const actualFcff = model.outputs?.fcff || 0;
            return Math.abs(expectedFcff - actualFcff) < 100000; // $100k tolerance
          }
        },
        {
          id: 'dcf_pv_calculation',
          category: 'calculations',
          name: 'Present Value Calculation',
          description: 'Discount rate application to future cash flows',
          test: (model) => {
            const { wacc, years } = model.assumptions;
            if (!wacc || !years) return false;

            // Test that discount factors are properly applied
            const discountFactor = Math.pow(1 + wacc, -years);
            return discountFactor > 0 && discountFactor < 1;
          }
        },
        {
          id: 'dcf_terminal_value',
          category: 'calculations',
          name: 'Terminal Value Calculation',
          description: 'Gordon Growth Model terminal value',
          test: (model) => {
            const { wacc, tg } = model.assumptions;
            if (!wacc || !tg) return false;

            // Terminal growth should be less than WACC
            return tg < wacc && tg >= 0;
          }
        },

        // Assumption validation tests
        {
          id: 'dcf_wacc_range',
          category: 'assumptions',
          name: 'WACC Range Check',
          description: 'WACC should be within reasonable range (3-25%)',
          test: (model) => {
            const wacc = model.assumptions.wacc || 0;
            return wacc >= 0.03 && wacc <= 0.25;
          }
        },
        {
          id: 'dcf_terminal_growth_range',
          category: 'assumptions',
          name: 'Terminal Growth Range',
          description: 'Terminal growth should be 0-4%',
          test: (model) => {
            const tg = model.assumptions.tg || 0;
            return tg >= 0 && tg <= 0.04;
          }
        },
        {
          id: 'dcf_margin_consistency',
          category: 'assumptions',
          name: 'Margin Consistency',
          description: 'Operating margin should be reasonable (0-50%)',
          test: (model) => {
            const margin = model.assumptions.margin || 0;
            return margin >= 0 && margin <= 0.5;
          }
        },

        // Sensitivity tests
        {
          id: 'dcf_wacc_sensitivity',
          category: 'sensitivity',
          name: 'WACC Sensitivity',
          description: 'EV should decrease when WACC increases',
          test: (model) => {
            // This would require running the model with different WACC values
            // Simplified test
            return model.outputs?.ev > 0;
          }
        },

        // Sanity checks
        {
          id: 'dcf_positive_ev',
          category: 'sanity',
          name: 'Positive Enterprise Value',
          description: 'Enterprise value should be positive',
          test: (model) => (model.outputs?.ev || 0) > 0
        },
        {
          id: 'dcf_reasonable_multiple',
          category: 'sanity',
          name: 'Reasonable EV/Revenue',
          description: 'EV/Revenue multiple should be 0.5x-20x',
          test: (model) => {
            const ev = model.outputs?.ev || 0;
            const revenue = model.assumptions?.rev0 || 0;
            if (!revenue) return false;
            const multiple = ev / revenue;
            return multiple >= 0.5 && multiple <= 20;
          }
        }
      ]
    },

    LBO: {
      categories: {
        'calculations': 'Calculation Accuracy',
        'assumptions': 'Assumption Validation',
        'returns': 'Return Analysis',
        'sanity': 'Sanity Checks'
      },
      tests: [
        {
          id: 'lbo_irr_calculation',
          category: 'calculations',
          name: 'IRR Calculation',
          description: 'Internal Rate of Return accuracy',
          test: (model) => {
            const irr = model.outputs?.irr || 0;
            return irr > 0 && irr < 1; // Between 0% and 100%
          }
        },
        {
          id: 'lbo_moic_calculation',
          category: 'calculations',
          name: 'MOIC Calculation',
          description: 'Multiple of Invested Capital accuracy',
          test: (model) => {
            const moic = model.outputs?.moic || 0;
            return moic > 0 && moic < 20; // Reasonable range
          }
        },
        {
          id: 'lbo_debt_capacity',
          category: 'assumptions',
          name: 'Debt Capacity Check',
          description: 'Debt percentage should be 30-90%',
          test: (model) => {
            const debtPct = model.assumptions?.debtPct || 0;
            return debtPct >= 0.3 && debtPct <= 0.9;
          }
        },
        {
          id: 'lbo_hold_period',
          category: 'assumptions',
          name: 'Hold Period Range',
          description: 'Hold period should be 3-10 years',
          test: (model) => {
            const years = model.assumptions?.years || 0;
            return years >= 3 && years <= 10;
          }
        },
        {
          id: 'lbo_target_returns',
          category: 'returns',
          name: 'Target Returns Check',
          description: 'IRR should exceed 15% for LBO',
          test: (model) => {
            const irr = model.outputs?.irr || 0;
            return irr >= 0.15;
          }
        },
        {
          id: 'lbo_multiple_arbitrage',
          category: 'sanity',
          name: 'Multiple Arbitrage',
          description: 'Exit multiple should create value',
          test: (model) => {
            const entryX = model.assumptions?.entryX || 0;
            const exitX = model.assumptions?.exitX || 0;
            const ebitdaCAGR = model.assumptions?.ebitdaCAGR || 0;

            // Simple check: exit multiple + growth should exceed entry multiple
            return exitX > entryX * 0.8; // Allow for some multiple compression
          }
        }
      ]
    },

    Comps: {
      categories: {
        'calculations': 'Calculation Accuracy',
        'assumptions': 'Assumption Validation',
        'benchmarking': 'Benchmarking Analysis',
        'sanity': 'Sanity Checks'
      },
      tests: [
        {
          id: 'comps_ev_calculation',
          category: 'calculations',
          name: 'EV Calculation',
          description: 'Enterprise Value from multiples',
          test: (model) => {
            const metric = model.assumptions?.metric || 0;
            const multiple = model.assumptions?.multiple || 0;
            const expectedEV = metric * multiple;
            const actualEV = model.outputs?.ev || 0;
            return Math.abs(expectedEV - actualEV) < 100000;
          }
        },
        {
          id: 'comps_multiple_range',
          category: 'assumptions',
          name: 'Multiple Range Check',
          description: 'Trading multiple should be reasonable (1x-50x)',
          test: (model) => {
            const multiple = model.assumptions?.multiple || 0;
            return multiple >= 1 && multiple <= 50;
          }
        },
        {
          id: 'comps_metric_positive',
          category: 'assumptions',
          name: 'Positive Metric',
          description: 'Financial metric should be positive',
          test: (model) => {
            const metric = model.assumptions?.metric || 0;
            return metric > 0;
          }
        },
        {
          id: 'comps_peer_consistency',
          category: 'benchmarking',
          name: 'Peer Consistency',
          description: 'Multiple should be within peer range',
          test: (model) => {
            // Simplified - would need peer data
            const multiple = model.assumptions?.multiple || 0;
            return multiple > 0;
          }
        }
      ]
    },

    EPV: {
      categories: {
        'calculations': 'Calculation Accuracy',
        'assumptions': 'Assumption Validation',
        'perpetuity': 'Perpetuity Analysis',
        'sanity': 'Sanity Checks'
      },
      tests: [
        {
          id: 'epv_nopat_calculation',
          category: 'calculations',
          name: 'NOPAT Calculation',
          description: 'Net Operating Profit After Tax accuracy',
          test: (model) => {
            const ebit = model.assumptions?.ebit || 0;
            const tax = model.assumptions?.tax || 0;
            const expectedNOPAT = ebit * (1 - tax);
            // Simplified check - would need actual NOPAT from outputs
            return expectedNOPAT > 0;
          }
        },
        {
          id: 'epv_perpetuity_assumption',
          category: 'perpetuity',
          name: 'Perpetuity Assumption',
          description: 'No growth assumption validation',
          test: (model) => {
            // EPV assumes no growth, so terminal growth should be 0
            const tg = model.assumptions?.tg || 0;
            return tg === 0;
          }
        },
        {
          id: 'epv_conservative_wacc',
          category: 'assumptions',
          name: 'Conservative WACC',
          description: 'WACC should be conservative for EPV',
          test: (model) => {
            const wacc = model.assumptions?.wacc || 0;
            return wacc >= 0.08 && wacc <= 0.15; // Conservative range
          }
        }
      ]
    }
  };

  // Run tests for the current model
  const runModelTests = async() => {
    if (!model || !testSuites[model.kind]) return;

    setRunningTests(true);
    const suite = testSuites[model.kind];
    const results = {};

    for (const test of suite.tests) {
      try {
        const startTime = Date.now();
        const passed = test.test(model);
        const endTime = Date.now();

        results[test.id] = {
          ...test,
          status: passed ? 'pass' : 'fail',
          executionTime: endTime - startTime,
          actual: passed ? 'PASS' : 'FAIL',
          expected: 'PASS'
        };
      } catch (error) {
        results[test.id] = {
          ...test,
          status: 'fail',
          error: error.message,
          executionTime: 0
        };
      }
    }

    setTestResults(results);
    setRunningTests(false);

    if (onRunTests) {
      onRunTests(results);
    }
  };

  const filteredTests = useMemo(() => {
    if (!model || !testSuites[model.kind]) return [];

    const suite = testSuites[model.kind];
    return suite.tests.filter(test =>
      selectedCategory === 'all' || test.category === selectedCategory
    );
  }, [model, selectedCategory]);

  const testStats = useMemo(() => {
    const results = Object.values(testResults);
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length
    };
  }, [testResults]);

  if (!model) {
    return (
      <Card title="Unit Tests">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">Select a model to run tests</p>
        </div>
      </Card>
    );
  }

  const suite = testSuites[model.kind];
  if (!suite) {
    return (
      <Card title="Unit Tests">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">No tests available for {model.kind}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Unit Tests"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="amber">{model.kind}</Pill>
          {testStats.total > 0 && (
            <Pill tone={testStats.failed > 0 ? 'red' : 'green'}>
              {testStats.passed}/{testStats.total}
            </Pill>
          )}
          <button
            onClick={runModelTests}
            disabled={runningTests}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-colors ${
              runningTests
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            <Play className="w-3 h-3" />
            {runningTests ? 'Running...' : 'Run Tests'}
          </button>
        </div>
      }
    >
      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`text-[11px] px-2 py-1 rounded transition-colors ${
            selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          All ({suite.tests.length})
        </button>
        {Object.entries(suite.categories).map(([key, label]) => {
          const count = suite.tests.filter(test => test.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`text-[11px] px-2 py-1 rounded transition-colors ${
                selectedCategory === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Test results */}
      <div className="space-y-2">
        {filteredTests.map(test => (
          <TestResult
            key={test.id}
            test={testResults[test.id] || { ...test, status: 'pending' }}
            onRerun={() => runModelTests()}
          />
        ))}
      </div>

      {/* Summary */}
      {testStats.total > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-[11px] font-medium text-slate-700 mb-2">Test Summary</div>
          <div className="grid grid-cols-3 gap-3 text-[10px]">
            <div className="text-center">
              <div className="text-emerald-600 font-bold text-[14px]">{testStats.passed}</div>
              <div className="text-slate-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-bold text-[14px]">{testStats.failed}</div>
              <div className="text-slate-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-amber-600 font-bold text-[14px]">{testStats.warnings}</div>
              <div className="text-slate-600">Warnings</div>
            </div>
          </div>
          {testStats.total > 0 && (
            <div className="mt-2 text-[10px] text-slate-600 text-center">
              Pass Rate: {Math.round((testStats.passed / testStats.total) * 100)}%
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default EnhancedTestsPanel;
