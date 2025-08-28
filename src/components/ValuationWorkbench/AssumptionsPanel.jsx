import { Card, Pill, NumberInput, Switch } from 'src/components/ui/UIHelpers.jsx';

const AssumptionsPanel = ({ assumptions, setAssumptions }) => {
  const set = key => value => setAssumptions({ ...assumptions, [key]: value });

  return (
    <Card title="Assumptions" right={<Pill tone="blue">{assumptions.currency}</Pill>}>
      <div className="grid grid-cols-12 gap-4">
        {/* Business Fundamentals */}
        <div className="col-span-12">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Shares"
              value={assumptions.shares}
              onChange={set('shares')}
              suffix="sh"
              step={1000}
              min={1}
            />
            <NumberInput
              label="Price"
              value={assumptions.price}
              onChange={set('price')}
              suffix={assumptions.currency}
              step={0.01}
              min={0}
            />
            <NumberInput
              label="Net Debt"
              value={assumptions.netDebt}
              onChange={set('netDebt')}
              suffix={assumptions.currency}
              step={1_000_000}
            />
            <NumberInput
              label="Minority Interest"
              value={assumptions.minorityInterest}
              onChange={set('minorityInterest')}
              suffix={assumptions.currency}
              step={1_000_000}
            />
            <NumberInput
              label="Cash Adj."
              value={assumptions.cashAdjust}
              onChange={set('cashAdjust')}
              suffix={assumptions.currency}
              step={1_000_000}
            />
          </div>
        </div>

        {/* Operating Assumptions */}
        <div className="col-span-12 border-t pt-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Revenue₀"
              value={assumptions.rev0}
              onChange={set('rev0')}
              suffix={assumptions.currency}
              step={1_000_000}
            />
            <NumberInput
              label="Tax rate"
              value={assumptions.taxRate}
              onChange={set('taxRate')}
              suffix="ratio"
              step={0.005}
              min={0}
              max={0.6}
            />
            <NumberInput
              label="EBIT margin₀"
              value={assumptions.ebitMargin0}
              onChange={set('ebitMargin0')}
              suffix="ratio"
              step={0.005}
              min={0}
              max={0.6}
            />
            <NumberInput
              label="EBIT margin_T"
              value={assumptions.ebitMarginT}
              onChange={set('ebitMarginT')}
              suffix="ratio"
              step={0.005}
              min={0}
              max={0.6}
            />
            <NumberInput
              label="Projection years"
              value={assumptions.years}
              onChange={set('years')}
              step={1}
              min={3}
              max={30}
            />
            <NumberInput
              label="Growth horizon (yrs)"
              value={assumptions.growthYears}
              onChange={set('growthYears')}
              step={1}
              min={1}
              max={assumptions.years}
            />
          </div>
        </div>

        {/* Reinvestment */}
        <div className="col-span-12 border-t pt-3">
          <div className="mb-1 text-[12px] font-semibold text-slate-700">Reinvestment</div>
          <div className="grid grid-cols-2 gap-3">
            <Switch
              label="Use Sales‑to‑Capital"
              on={assumptions.reinvMethod === 'salesToCapital'}
              setOn={v => set('reinvMethod')(v ? 'salesToCapital' : 'components')}
            />
            {assumptions.reinvMethod === 'salesToCapital' ? (
              <NumberInput
                label="Sales‑to‑Capital"
                value={assumptions.salesToCapital}
                onChange={set('salesToCapital')}
                step={0.1}
                min={0.2}
                max={10}
              />
            ) : (
              <>
                <NumberInput
                  label="Capex % sales"
                  value={assumptions.capexPctSales}
                  onChange={set('capexPctSales')}
                  step={0.005}
                  min={0}
                  max={0.2}
                />
                <NumberInput
                  label="D&A % sales"
                  value={assumptions.depPctSales}
                  onChange={set('depPctSales')}
                  step={0.005}
                  min={0}
                  max={0.2}
                />
                <NumberInput
                  label="NWC % sales"
                  value={assumptions.nwcPctSales}
                  onChange={set('nwcPctSales')}
                  step={0.005}
                  min={0}
                  max={0.5}
                />
              </>
            )}
          </div>
        </div>

        {/* Capital Costs */}
        <div className="col-span-12 border-t pt-3">
          <div className="mb-1 text-[12px] font-semibold text-slate-700">Capital costs</div>
          <div className="grid grid-cols-2 gap-3">
            <Switch
              label="Use CAPM for Ke"
              on={assumptions.capmMode === 'capm'}
              setOn={v => set('capmMode')(v ? 'capm' : 'manualKe')}
            />
            {assumptions.capmMode === 'capm' ? (
              <>
                <NumberInput
                  label="Risk‑free (rf)"
                  value={assumptions.rf}
                  onChange={set('rf')}
                  step={0.0025}
                  min={0}
                  max={0.2}
                />
                <NumberInput
                  label="Beta"
                  value={assumptions.beta}
                  onChange={set('beta')}
                  step={0.05}
                  min={-1}
                  max={3}
                />
                <NumberInput
                  label="ERP"
                  value={assumptions.erp}
                  onChange={set('erp')}
                  step={0.005}
                  min={0}
                  max={0.15}
                />
              </>
            ) : (
              <NumberInput
                label="Ke (manual)"
                value={assumptions.keManual}
                onChange={set('keManual')}
                step={0.0025}
                min={0.02}
                max={0.3}
              />
            )}
            <NumberInput
              label="Kd (pre‑tax)"
              value={assumptions.kd}
              onChange={set('kd')}
              step={0.0025}
              min={0.01}
              max={0.2}
            />
            <NumberInput
              label="W_d"
              value={assumptions.wd}
              onChange={set('wd')}
              step={0.01}
              min={0}
              max={1}
            />
            <NumberInput
              label="W_e"
              value={assumptions.we}
              onChange={set('we')}
              step={0.01}
              min={0}
              max={1}
            />
          </div>
        </div>

        {/* Terminal Value */}
        <div className="col-span-12 border-t pt-3">
          <div className="mb-1 text-[12px] font-semibold text-slate-700">Terminal</div>
          <div className="grid grid-cols-2 gap-3">
            <Switch
              label="Gordon Growth"
              on={assumptions.terminalMethod === 'gordon'}
              setOn={v => set('terminalMethod')(v ? 'gordon' : 'exitMultiple')}
            />
            {assumptions.terminalMethod === 'gordon' ? (
              <NumberInput
                label="Terminal g"
                value={assumptions.tg}
                onChange={set('tg')}
                step={0.001}
                min={-0.02}
                max={0.05}
              />
            ) : (
              <>
                <NumberInput
                  label="Exit EV Multiple"
                  value={assumptions.exitEVMultiple}
                  onChange={set('exitEVMultiple')}
                  step={0.25}
                  min={2}
                  max={25}
                />
                <label className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-600">Metric</span>
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1"
                    value={assumptions.exitMetric}
                    onChange={e => set('exitMetric')(e.target.value)}
                  >
                    <option value="EBITDA">EBITDA</option>
                    <option value="EBIT">EBIT</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AssumptionsPanel;
