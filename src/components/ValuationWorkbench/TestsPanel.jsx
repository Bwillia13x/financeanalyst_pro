import { Card } from 'src/components/ui/UIHelpers.jsx';

import { wacc, terminalValue, project, valueEquity, growthVector } from '../../utils/valuationUtils';

export function runTests(assumptions, rows, valuation) {
  const tests = [];
  const disc = wacc(assumptions);

  // Identity: EV ≈ PV(FCFF)+PV(TV)
  const pvFCFF = rows.reduce((acc, r, i) => acc + r.fcff / ((1 + disc) ** (i + 1)), 0);
  const tv = terminalValue(assumptions, rows, disc).tv;
  const pvTV = tv / ((1 + disc) ** rows.length);
  tests.push({
    name: 'EV identity (PV_FCFF + PV_TV)',
    pass: Math.abs((pvFCFF + pvTV) - valuation.ev) < 1e-6
  });

  // Gordon constraint if used: WACC>g
  if (assumptions.terminalMethod === 'gordon') {
    tests.push({
      name: 'WACC > g (Gordon)',
      pass: disc > assumptions.tg
    });
  }

  // WACC monotonicity (±50 bps)
  const aUp = { ...assumptions, rf: assumptions.rf + 0.005 };
  const aDn = { ...assumptions, rf: Math.max(0, assumptions.rf - 0.005) };
  const vsUp = valueEquity(aUp, project(aUp, growthVector(0.05, aUp.years, aUp.growthYears))).perShare;
  const vsDn = valueEquity(aDn, project(aDn, growthVector(0.05, aDn.years, aDn.growthYears))).perShare;
  tests.push({
    name: 'Per‑share ↓ when WACC ↑',
    pass: vsUp < valuation.perShare && vsDn > valuation.perShare
  });

  // Non‑negative reinvestment, FCFF defined
  tests.push({
    name: 'Reinvestment non‑negative',
    pass: rows.every(r => r.reinvest >= -1e-9)
  });
  tests.push({
    name: 'FCFF finite',
    pass: rows.every(r => Number.isFinite(r.fcff))
  });

  // Currency-scale invariance
  const scaledAssumptions = {
    ...assumptions,
    rev0: assumptions.rev0 * 10,
    netDebt: assumptions.netDebt * 10,
    minorityInterest: assumptions.minorityInterest * 10,
    cashAdjust: assumptions.cashAdjust * 10,
    price: assumptions.price * 10
  };
  const scaledRows = project(scaledAssumptions, growthVector(0.05, scaledAssumptions.years, scaledAssumptions.growthYears));
  const scaledValuation = valueEquity(scaledAssumptions, scaledRows);
  tests.push({
    name: 'Currency-scale invariance',
    pass: Math.abs(scaledValuation.perShare / 10 - valuation.perShare) < 1e-6
  });

  // Net cash case (negative net debt raises equity)
  if (assumptions.netDebt < 0) {
    const zeroCashAssumptions = { ...assumptions, netDebt: 0 };
    const zeroCashRows = project(zeroCashAssumptions, growthVector(0.05, zeroCashAssumptions.years, zeroCashAssumptions.growthYears));
    const zeroCashValuation = valueEquity(zeroCashAssumptions, zeroCashRows);
    tests.push({
      name: 'Net cash increases equity',
      pass: valuation.equity > zeroCashValuation.equity
    });
  }

  // Shares guard
  tests.push({
    name: 'Shares > 0 (division safe)',
    pass: assumptions.shares > 0
  });

  // Terminal method parity smoke test
  if (assumptions.terminalMethod === 'gordon' && assumptions.tg > 0 && disc > assumptions.tg) {
    const impliedMultiple = tv / rows[rows.length - 1].metricForExit;
    const multipleAssumptions = {
      ...assumptions,
      terminalMethod: 'exitMultiple',
      exitEVMultiple: impliedMultiple
    };
    const multipleRows = project(multipleAssumptions, growthVector(0.05, multipleAssumptions.years, multipleAssumptions.growthYears));
    const multipleValuation = valueEquity(multipleAssumptions, multipleRows);
    tests.push({
      name: 'Terminal method parity',
      pass: Math.abs(multipleValuation.perShare - valuation.perShare) < 0.01 // 1 cent tolerance
    });
  }

  return tests;
}

const TestsPanel = ({ tests }) => {
  return (
    <Card title="Dev / Sanity Tests">
      <ul className="space-y-1 text-[13px]">
        {tests.map(t => (
          <li key={t.name} className="flex items-center justify-between">
            <span className="text-slate-700">{t.name}</span>
            <span className={`ml-2 ${t.pass ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.pass ? 'PASS' : 'FAIL'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default TestsPanel;
