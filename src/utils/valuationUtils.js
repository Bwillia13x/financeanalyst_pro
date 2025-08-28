// Valuation Workbench - Core utilities and mathematical functions
// Formatting utilities
export const Num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const Cur = (x, c = 0) =>
  x >= 1e9
    ? `$${(x / 1e9).toFixed(c)}B`
    : x >= 1e6
      ? `$${(x / 1e6).toFixed(c)}M`
      : `$${x.toFixed(c)}`;
export const Pct = (x, d = 1) => `${(100 * x).toFixed(d)}%`;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Core valuation math functions
export function wacc(assumptions) {
  const ke =
    assumptions.capmMode === 'capm'
      ? assumptions.rf + assumptions.beta * assumptions.erp
      : assumptions.keManual;
  return assumptions.wd * assumptions.kd * (1 - assumptions.taxRate) + assumptions.we * ke;
}

export function project(assumptions, growthPath) {
  const rows = [];
  let rev = assumptions.rev0;
  const years = assumptions.years;

  for (let y = 1; y <= years; y++) {
    const g = growthPath[Math.min(y - 1, growthPath.length - 1)] || 0;
    const revPrev = rev;
    rev = rev * (1 + g);

    // margin glide: linear from ebitMargin0 → ebitMarginT over growthYears, then flat
    const t = clamp((y - 1) / Math.max(1, assumptions.growthYears - 1), 0, 1);
    const ebitMargin = assumptions.ebitMargin0 * (1 - t) + assumptions.ebitMarginT * t;
    const ebit = rev * ebitMargin;
    const nopat = ebit * (1 - assumptions.taxRate);

    let reinvest = 0,
      dep = rev * assumptions.depPctSales,
      capex = rev * assumptions.capexPctSales,
      dNWC = (rev - revPrev) * assumptions.nwcPctSales;

    if (assumptions.reinvMethod === 'salesToCapital') {
      const deltaSales = rev - revPrev;
      const reinvSales = deltaSales / (assumptions.salesToCapital || 1e-9);
      reinvest = Math.max(0, reinvSales);
      // Treat reinvestment as inclusive of ΔNWC; for display, infer components proportionally
      dNWC = Math.max(0, (rev - revPrev) * assumptions.nwcPctSales);
      const capMaint = Math.max(0, reinvest - dNWC);
      capex = capMaint + dep; // simple split
      dep = rev * assumptions.depPctSales;
    } else {
      reinvest = Math.max(0, capex - dep + dNWC); // components method: Reinv = (Capex - D&A) + ΔNWC
    }

    const fcff = nopat - reinvest;
    const metricForExit = assumptions.exitMetric === 'EBITDA' ? ebit + dep : ebit;

    rows.push({
      year: y,
      revenue: rev,
      ebitMargin,
      ebit,
      nopat,
      reinvest,
      fcff,
      dep,
      capex,
      dNWC,
      metricForExit
    });
  }
  return rows;
}

export function terminalValue(assumptions, rows, disc) {
  const last = rows[rows.length - 1];
  if (assumptions.terminalMethod === 'gordon') {
    const fcf1 = last.fcff * (1 + assumptions.tg);
    const tv = fcf1 / (disc - assumptions.tg);
    return { tv, basis: 'FCFF', label: 'Gordon: FCFFₙ₊₁/(WACC−g)' };
  } else {
    const tv = last.metricForExit * assumptions.exitEVMultiple;
    const label = `Exit ${assumptions.exitMetric}×`;
    return { tv, basis: assumptions.exitMetric, label };
  }
}

export function discount(rows, disc) {
  let pv = 0;
  const pvSeries = [];
  for (let i = 0; i < rows.length; i++) {
    const t = i + 1;
    const p = rows[i].fcff / (1 + disc) ** t;
    pv += p;
    pvSeries.push(p);
  }
  return { pv, pvSeries };
}

export function valueEquity(assumptions, rows) {
  const disc = wacc(assumptions);
  const { pv } = discount(rows, disc);
  const { tv } = terminalValue(assumptions, rows, disc);
  const pvTV = tv / (1 + disc) ** rows.length;

  const ev = pv + pvTV;
  const equity = ev - assumptions.netDebt - assumptions.minorityInterest + assumptions.cashAdjust;
  const perShare = equity / (assumptions.shares || 1e-9);
  const mos = (perShare - assumptions.price) / (assumptions.price || 1e-9);

  return { ev, pvTV, pvFCFF: pv, tv, equity, perShare, mos };
}

// Build growth vector: first growthYears use gMid, then fade to 0 by Year 10 unless user specifies
export function growthVector(gStart, years, fadeAfter) {
  const v = [];
  for (let y = 1; y <= years; y++) {
    const t = y <= fadeAfter ? 1 : Math.max(0, 1 - (y - fadeAfter) / (years - fadeAfter));
    v.push(gStart * t);
  }
  return v;
}
