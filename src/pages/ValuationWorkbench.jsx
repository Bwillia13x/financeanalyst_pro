import { useState, useMemo, useEffect } from 'react';

import { Card, Pill } from 'src/components/ui/UIHelpers.jsx';

import Header from '../components/ui/Header';
import AssumptionsPanel from '../components/ValuationWorkbench/AssumptionsPanel';
import { AuditTrail, useAuditTrail } from '../components/ValuationWorkbench/AuditTrail';
import { AxisPicker } from '../components/ValuationWorkbench/AxisPicker';
import { validateAssumptions, ErrorDisplay } from '../components/ValuationWorkbench/ErrorHandler';
import { Histogram, runMonteCarlo, generatePriors } from '../components/ValuationWorkbench/MonteCarloAnalysis';
import ProjectionsTable from '../components/ValuationWorkbench/ProjectionsTable';
import ReverseDCF from '../components/ValuationWorkbench/ReverseDCF';
import ScenarioLibrary from '../components/ValuationWorkbench/ScenarioLibrary';
import { Heatmap, generateHeatmapsWithConfig } from '../components/ValuationWorkbench/SensitivityAnalysis';
import TestsPanel, { runTests } from '../components/ValuationWorkbench/TestsPanel';
import { TornadoChart, generateTornadoData } from '../components/ValuationWorkbench/TornadoChart';
import ValuationSummary from '../components/ValuationWorkbench/ValuationSummary';
import { project, valueEquity, growthVector, wacc, Pct } from '../utils/valuationUtils';

// Default assumptions
const defaults = {
  name: 'VALR demo',
  currency: 'USD',
  shares: 300_000_000,
  price: 25,
  netDebt: 2_000_000_000,
  minorityInterest: 0,
  cashAdjust: 0,
  rev0: 5_000_000_000,
  growthYears: 5,
  years: 10,
  taxRate: 0.23,
  ebitMargin0: 0.12,
  ebitMarginT: 0.18,
  reinvMethod: 'salesToCapital',
  salesToCapital: 2.5,
  capexPctSales: 0.05,
  depPctSales: 0.04,
  nwcPctSales: 0.10,
  capmMode: 'capm',
  rf: 0.04,
  beta: 1.1,
  erp: 0.05,
  keManual: 0.10,
  kd: 0.06,
  wd: 0.25,
  we: 0.75,
  terminalMethod: 'gordon',
  tg: 0.025,
  exitEVMultiple: 9.0,
  exitMetric: 'EBITDA'
};

const ValuationWorkbench = () => {
  const [assumptions, setAssumptions] = useState({ ...defaults });
  const [scenarios, setScenarios] = useState([]);
  const [mc, setMc] = useState(null);
  const [axisConfig, setAxisConfig] = useState({
    wacc: { min: 0.06, max: 0.14, steps: 5 },
    growth: { min: 0.015, max: 0.035, steps: 5 },
    exitMultiple: { min: 8, max: 16, steps: 5 }
  });

  // Audit trail integration
  const { auditLog, updateAssumptions, clearAuditLog, exportAuditLog } = useAuditTrail(assumptions, setAssumptions);

  // Core calculations
  const growth = useMemo(() => growthVector(0.05, assumptions.years, assumptions.growthYears), [assumptions.years, assumptions.growthYears]);
  const rows = useMemo(() => project(assumptions, growth), [assumptions, growth]);
  const valuation = useMemo(() => valueEquity(assumptions, rows), [assumptions, rows]);
  const disc = useMemo(() => wacc(assumptions), [assumptions]);

  // Sensitivity analysis data with custom axis configuration
  const heatmapData = useMemo(() => generateHeatmapsWithConfig(assumptions, axisConfig), [assumptions, axisConfig]);

  // Tornado analysis
  const tornData = useMemo(() => generateTornadoData(assumptions, rows, valuation.perShare), [assumptions, rows, valuation.perShare]);

  // Monte Carlo priors
  const priors = useMemo(() => generatePriors(assumptions), [assumptions]);

  // Tests
  const tests = useMemo(() => runTests(assumptions, rows, valuation), [assumptions, rows, valuation]);

  // Validation
  const validation = useMemo(() => validateAssumptions(assumptions), [assumptions]);

  // Reset MC when assumptions change
  useEffect(() => {
    setMc(null);
  }, [assumptions]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Header />

      <div className="pt-[60px]">
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
                  <path
                    d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="2"
                    fill="none" strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs tracking-wide text-muted-foreground">FinanceAnalyst Pro</div>
                <div className="text-[13px] font-semibold text-foreground">Valuation Workbench</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <Pill tone="green">{`WACC ${Pct(disc, 1)}`}</Pill>
              <Pill tone="amber">
                {assumptions.terminalMethod === 'gordon'
                  ? `g ${Pct(assumptions.tg, 1)}`
                  : `Exit ×${assumptions.exitEVMultiple.toFixed(1)} ${assumptions.exitMetric}`}
              </Pill>
              <Pill tone="blue">
                {valuation.perShare >= assumptions.price ? 'Undervalued' : 'Overvalued'}
              </Pill>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="mb-4 grid grid-cols-12 gap-6">

            {/* Left Column: Assumptions & Scenarios */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <AssumptionsPanel assumptions={assumptions} setAssumptions={updateAssumptions} />

              {/* Error Handling & Validation */}
              <ErrorDisplay validation={validation} />

              <ReverseDCF
                assumptions={assumptions}
                setAssumptions={updateAssumptions}
                currentValuation={valuation}
              />

              {/* Audit Trail */}
              <AuditTrail
                auditLog={auditLog}
                onClear={clearAuditLog}
                onExport={exportAuditLog}
              />

              <ScenarioLibrary
                scenarios={scenarios}
                setScenarios={setScenarios}
                assumptions={assumptions}
                setAssumptions={updateAssumptions}
                rows={rows}
                valuation={valuation}
              />
            </div>

            {/* Center Column: Projections & Valuation */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              <Card title="10‑Year Projections (FCFF)">
                <ProjectionsTable rows={rows} currency={assumptions.currency} />
              </Card>

              <Card title="Enterprise → Equity Bridge">
                <ValuationSummary valuation={valuation} assumptions={assumptions} />
              </Card>
            </div>

            {/* Right Column: Results & Analysis */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {/* Sensitivity Analysis */}
              <Card className="p-4">
                <h3 className="text-[16px] font-semibold text-foreground mb-4">Sensitivity Analysis</h3>

                {/* Axis Configuration */}
                <div className="mb-4">
                  <AxisPicker
                    currentConfig={axisConfig}
                    onAxisChange={setAxisConfig}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground mb-2">{heatmapData.waccGrowth.title}</h4>
                    <Heatmap
                      grid={heatmapData.waccGrowth.grid}
                      xLabels={heatmapData.waccGrowth.xLabels}
                      yLabels={heatmapData.waccGrowth.yLabels}
                    />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground mb-2">{heatmapData.waccExit.title}</h4>
                    <Heatmap
                      grid={heatmapData.waccExit.grid}
                      xLabels={heatmapData.waccExit.xLabels}
                      yLabels={heatmapData.waccExit.yLabels}
                    />
                  </div>
                </div>
              </Card>

              <Card title="Tornado (Δ per‑share)">
                <TornadoChart items={tornData} />
              </Card>

              <Card
                title="Monte Carlo (1000 runs)"
                right={
                  <button
                    onClick={() => setMc(runMonteCarlo(assumptions, priors, 1000))}
                    className="rounded-md border border-border bg-card px-2 py-1 text-[12px] hover:bg-muted"
                  >
                    Run
                  </button>
                }
              >
                {mc ? (
                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span>P5</span>
                      <span className="font-mono">{mc.p5.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>P50</span>
                      <span className="font-mono">{mc.p50.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>P95</span>
                      <span className="font-mono">{mc.p95.toFixed(2)}</span>
                    </div>
                    <Histogram data={mc.vals} />
                  </div>
                ) : (
                  <div className="text-[12px] text-muted-foreground">
                    Stochastic valuation with triangular priors on g, margins, WACC shift, S/C, terminal. Click Run.
                  </div>
                )}
              </Card>
            </div>
          </div>

          <TestsPanel tests={tests} />
          <div className="mt-2 text-[11px] text-muted-foreground">
            Tip: to feed real tickers, pipe reported revenue, margins, share count, and balance sheet into the assumptions; set priors from historical distributions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationWorkbench;
