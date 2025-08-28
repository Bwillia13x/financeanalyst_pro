import { useState } from 'react';

import { Card, NumberInput } from 'src/components/ui/UIHelpers.jsx';

import { project, valueEquity, growthVector, wacc } from '../../utils/valuationUtils';

// Solver functions for reverse DCF
function solveForImpliedGrowth(assumptions, targetPrice, tolerance = 1e-6, maxIterations = 100) {
  let low = -0.05,
    high = 0.2;
  let iteration = 0;

  while (Math.abs(high - low) > tolerance && iteration < maxIterations) {
    const mid = (low + high) / 2;
    const testAssumptions = { ...assumptions, tg: mid, terminalMethod: 'gordon' };
    const growth = growthVector(0.05, testAssumptions.years, testAssumptions.growthYears);
    const rows = project(testAssumptions, growth);
    const valuation = valueEquity(testAssumptions, rows);

    if (valuation.perShare > targetPrice) {
      high = mid;
    } else {
      low = mid;
    }
    iteration++;
  }

  return (low + high) / 2;
}

function solveForImpliedWACC(assumptions, targetPrice, tolerance = 1e-6, maxIterations = 100) {
  let low = 0.01,
    high = 0.3;
  let iteration = 0;

  while (Math.abs(high - low) > tolerance && iteration < maxIterations) {
    const mid = (low + high) / 2;
    const testAssumptions = { ...assumptions, capmMode: 'manualKe', keManual: mid };
    const growth = growthVector(0.05, testAssumptions.years, testAssumptions.growthYears);
    const rows = project(testAssumptions, growth);
    const valuation = valueEquity(testAssumptions, rows);

    if (valuation.perShare > targetPrice) {
      low = mid;
    } else {
      high = mid;
    }
    iteration++;
  }

  return (low + high) / 2;
}

function solveForImpliedMargin(assumptions, targetPrice, tolerance = 1e-6, maxIterations = 100) {
  let low = 0.01,
    high = 0.5;
  let iteration = 0;

  while (Math.abs(high - low) > tolerance && iteration < maxIterations) {
    const mid = (low + high) / 2;
    const testAssumptions = { ...assumptions, ebitMarginT: mid };
    const growth = growthVector(0.05, testAssumptions.years, testAssumptions.growthYears);
    const rows = project(testAssumptions, growth);
    const valuation = valueEquity(testAssumptions, rows);

    if (valuation.perShare > targetPrice) {
      high = mid;
    } else {
      low = mid;
    }
    iteration++;
  }

  return (low + high) / 2;
}

function calculateTargetPrice(assumptions, targetMOS) {
  return assumptions.price * (1 + targetMOS);
}

const ReverseDCF = ({ _symbol, _onBack, _currentValuation }) => {
  // Default assumptions for reverse DCF
  const assumptions = {
    price: 150,
    shares: 1000000,
    cashAndInvestments: 50000000,
    debt: 25000000,
    tg: 0.025,
    years: 5,
    growthYears: 5
  };

  const [targetPrice, setTargetPrice] = useState(150);
  const [targetMOS, setTargetMOS] = useState(0);
  const [solveFor, setSolveFor] = useState('growth');
  const [results, setResults] = useState(null);
  const [_assumptionsState, setAssumptions] = useState(assumptions);

  const runReverseDCF = () => {
    try {
      let impliedValue, label, currentValue;

      switch (solveFor) {
        case 'growth':
          impliedValue = solveForImpliedGrowth(assumptions, targetPrice);
          label = 'Implied Terminal Growth';
          currentValue = assumptions.tg;
          break;
        case 'wacc':
          impliedValue = solveForImpliedWACC(assumptions, targetPrice);
          label = 'Implied WACC (Ke)';
          currentValue = wacc(assumptions);
          break;
        case 'margin':
          impliedValue = solveForImpliedMargin(assumptions, targetPrice);
          label = 'Implied Terminal Margin';
          currentValue = assumptions.ebitMarginT;
          break;
        case 'targetPrice':
          impliedValue = calculateTargetPrice(assumptions, targetMOS);
          label = 'Target Price for MOS';
          currentValue = assumptions.price;
          break;
        default:
          return;
      }

      setResults({ impliedValue, label, currentValue });
    } catch (error) {
      console.error('Reverse DCF solver error:', error);
      setResults({ error: 'Unable to solve - check assumptions' });
    }
  };

  const applyImpliedValue = () => {
    if (!results || results.error || solveFor === 'targetPrice') return;

    const newAssumptions = { ...assumptions };

    switch (solveFor) {
      case 'growth':
        newAssumptions.tg = results.impliedValue;
        newAssumptions.terminalMethod = 'gordon';
        break;
      case 'wacc':
        newAssumptions.keManual = results.impliedValue;
        newAssumptions.capmMode = 'manualKe';
        break;
      case 'margin':
        newAssumptions.ebitMarginT = results.impliedValue;
        break;
    }

    setAssumptions(newAssumptions);
  };

  const formatValue = (value, type) => {
    if (type === 'targetPrice') return `$${value.toFixed(2)}`;
    return `${(100 * value).toFixed(2)}%`;
  };

  return (
    <Card title="Reverse DCF / Implied Expectations">
      <div className="space-y-4">
        {/* Target Price Input */}
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Target Price"
            value={targetPrice}
            onChange={setTargetPrice}
            suffix={assumptions.currency}
            step={0.01}
            min={0.01}
          />
          <NumberInput
            label="Target MOS"
            value={targetMOS}
            onChange={setTargetMOS}
            suffix="ratio"
            step={0.01}
            min={-0.5}
            max={2.0}
          />
        </div>

        {/* Solve For Selection */}
        <div className="space-y-2">
          <div className="text-[12px] font-semibold text-slate-700">Solve For:</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'growth', label: 'Terminal Growth' },
              { value: 'wacc', label: 'WACC (Ke)' },
              { value: 'margin', label: 'Terminal Margin' },
              { value: 'targetPrice', label: 'Price for MOS' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSolveFor(option.value)}
                className={`px-3 py-2 text-[12px] rounded-md border transition-colors ${
                  solveFor === option.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Solve Button */}
        <button
          onClick={runReverseDCF}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Solve Reverse DCF
        </button>

        {/* Results */}
        {results && (
          <div className="rounded-lg border border-slate-200 p-3">
            {results.error ? (
              <div className="text-rose-600 text-[12px]">{results.error}</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-600">{results.label}</span>
                  <span className="font-mono font-semibold text-blue-600">
                    {formatValue(results.impliedValue, solveFor)}
                  </span>
                </div>

                {solveFor !== 'targetPrice' && (
                  <>
                    <div className="flex items-center justify-between text-[12px] text-slate-500">
                      <span>Current Value</span>
                      <span className="font-mono">
                        {formatValue(results.currentValue, solveFor)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-slate-500">
                      <span>Difference</span>
                      <span
                        className={`font-mono ${
                          results.impliedValue > results.currentValue
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {results.impliedValue > results.currentValue ? '+' : ''}
                        {formatValue(results.impliedValue - results.currentValue, solveFor)}
                      </span>
                    </div>

                    <button
                      onClick={applyImpliedValue}
                      className="w-full mt-2 px-3 py-1 bg-emerald-500 text-white text-[12px] rounded-md hover:bg-emerald-600 transition-colors"
                    >
                      Apply to Assumptions
                    </button>
                  </>
                )}

                {solveFor === 'targetPrice' && (
                  <div className="text-[11px] text-slate-500">
                    Price needed for {(targetMOS * 100).toFixed(1)}% margin of safety
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] text-slate-500">
          Solves for the implied value that makes DCF per-share equal target price, or calculates
          target price for desired margin of safety.
        </div>
      </div>
    </Card>
  );
};

export default ReverseDCF;
