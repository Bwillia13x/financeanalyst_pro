// Model Lab Calculation Utilities

// const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Template definitions
export const templates = [
  {
    kind: 'DCF',
    title: 'Discounted Cash Flow',
    description: 'Intrinsic value from projected FCFF and terminal assumptions.',
    tags: ['intrinsic', 'long‑horizon', 'fundamental'],
    schema: [
      { key: 'price', label: 'Market Price', kind: 'number', step: 0.01, min: 0, suffix: '$' },
      { key: 'shares', label: 'Diluted Shares', kind: 'number', step: 1, min: 1 },
      { key: 'netDebt', label: 'Net Debt', kind: 'number', step: 1_000_000 },
      { key: 'rev0', label: 'Revenue₀', kind: 'number', step: 1_000_000, min: 0, suffix: '$' },
      { key: 'margin', label: 'EBIT Margin', kind: 'percent', step: 0.005, min: 0, max: 0.6 },
      { key: 'tax', label: 'Tax Rate', kind: 'percent', step: 0.005, min: 0, max: 0.6 },
      { key: 'g', label: 'Growth (yrs 1‑5)', kind: 'percent', step: 0.005, min: -0.2, max: 0.2 },
      { key: 'tg', label: 'Terminal g', kind: 'percent', step: 0.001, min: -0.02, max: 0.05 },
      { key: 'wacc', label: 'WACC', kind: 'percent', step: 0.0025, min: 0.02, max: 0.25 }
    ]
  },
  {
    kind: 'Comps',
    title: 'Trading Comps',
    description: 'Value via market multiple on a chosen metric.',
    tags: ['relative', 'peer‑set'],
    schema: [
      { key: 'price', label: 'Market Price', kind: 'number', step: 0.01, min: 0, suffix: '$' },
      { key: 'shares', label: 'Diluted Shares', kind: 'number', step: 1, min: 1 },
      { key: 'netDebt', label: 'Net Debt', kind: 'number', step: 1_000_000 },
      { key: 'metric', label: 'Metric (EBITDA)', kind: 'number', step: 1_000_000, min: 0, suffix: '$' },
      { key: 'multiple', label: 'EV/Metric', kind: 'number', step: 0.25, min: 2, max: 40 }
    ]
  },
  {
    kind: 'EPV',
    title: 'Earnings Power Value',
    description: 'Steady‑state value = NOPAT / WACC (g≈0).',
    tags: ['steady‑state', 'quality'],
    schema: [
      { key: 'price', label: 'Market Price', kind: 'number', step: 0.01, min: 0, suffix: '$' },
      { key: 'shares', label: 'Diluted Shares', kind: 'number', step: 1, min: 1 },
      { key: 'netDebt', label: 'Net Debt', kind: 'number', step: 1_000_000 },
      { key: 'ebit', label: 'EBIT (normalized)', kind: 'number', step: 1_000_000, min: 0, suffix: '$' },
      { key: 'tax', label: 'Tax Rate', kind: 'percent', step: 0.005, min: 0, max: 0.6 },
      { key: 'wacc', label: 'WACC', kind: 'percent', step: 0.0025, min: 0.02, max: 0.25 }
    ]
  },
  {
    kind: 'LBO',
    title: 'LBO Sketch',
    description: 'Entry/exit multiples with leverage; quick equity IRR view.',
    tags: ['private‑equity', 'leverage'],
    schema: [
      { key: 'ebitda', label: 'EBITDA₀', kind: 'number', step: 1_000_000, min: 0, suffix: '$' },
      { key: 'entryX', label: 'Entry EV/EBITDA', kind: 'number', step: 0.25, min: 2, max: 30 },
      { key: 'exitX', label: 'Exit EV/EBITDA', kind: 'number', step: 0.25, min: 2, max: 30 },
      { key: 'debtPct', label: 'Debt % EV (t₀)', kind: 'percent', step: 0.01, min: 0, max: 0.9 },
      { key: 'years', label: 'Hold (yrs)', kind: 'number', step: 1, min: 1, max: 10 },
      { key: 'ebitdaCAGR', label: 'EBITDA CAGR', kind: 'percent', step: 0.005, min: -0.3, max: 0.5 }
    ]
  }
];

// Calculation functions
export function calcDCF(a) {
  const EBIT = a.rev0 * (a.margin ?? 0.15);
  const NOPAT0 = EBIT * (1 - (a.tax ?? 0.23));
  const g = a.g ?? 0.05, tg = a.tg ?? 0.02, w = a.wacc ?? 0.09;
  const years = 5;
  let pv = 0;
  let fcff = NOPAT0;

  for (let t = 1; t <= years; t++) {
    fcff = fcff * (1 + g);
    pv += fcff / ((1 + w) ** t);
  }

  const fcff5 = fcff;
  const tv = (fcff5 * (1 + tg)) / (w - tg);
  const pvTV = tv / ((1 + w) ** years);
  const EV = pv + pvTV;
  const equity = EV - (a.netDebt || 0);
  const perShare = equity / Math.max(1, (a.shares || 1));

  return { ev: EV, perShare };
}

export function calcComps(a) {
  const EV = (a.multiple || 8) * (a.metric || 0);
  const equity = EV - (a.netDebt || 0);
  const perShare = equity / Math.max(1, (a.shares || 1));
  return { ev: EV, perShare };
}

export function calcEPV(a) {
  const NOPAT = (a.ebit || 0) * (1 - (a.tax || 0.23));
  const w = Math.max(0.02, (a.wacc || 0.09));
  const EV = NOPAT / w;
  const equity = EV - (a.netDebt || 0);
  const perShare = equity / Math.max(1, (a.shares || 1));
  return { ev: EV, perShare };
}

export function calcLBO(a) {
  const ebitda0 = a.ebitda || 0;
  const entryEV = ebitda0 * (a.entryX || 8);
  const debt0 = entryEV * (a.debtPct || 0.5);
  const eq0 = Math.max(1, entryEV - debt0);
  const years = Math.max(1, Math.round(a.years || 5));
  const ebitdaN = ebitda0 * ((1 + (a.ebitdaCAGR || 0.05)) ** years);
  const exitEV = ebitdaN * (a.exitX || 8);
  const debtN = Math.max(0, debt0 * (0.9 ** years));
  const exitEq = Math.max(1, exitEV - debtN);
  const moic = exitEq / eq0;
  const irr = Math.max(-0.99, moic ** (1 / years) - 1);
  return { irr };
}

export function computeOutputs(m) {
  if (m.kind === 'DCF') return calcDCF(m.assumptions);
  if (m.kind === 'Comps') return calcComps(m.assumptions);
  if (m.kind === 'EPV') return calcEPV(m.assumptions);
  if (m.kind === 'LBO') return calcLBO(m.assumptions);
  return {};
}

// Seed model generator
export function seedModel(kind, i) {
  const base = { price: 25, shares: 300_000_000, netDebt: 2_000_000_000 };

  if (kind === 'DCF') Object.assign(base, {
    rev0: 5_000_000_000, margin: 0.16, tax: 0.23, g: 0.05, tg: 0.02, wacc: 0.09
  });
  if (kind === 'Comps') Object.assign(base, {
    metric: 800_000_000, multiple: 9
  });
  if (kind === 'EPV') Object.assign(base, {
    ebit: 700_000_000, tax: 0.23, wacc: 0.09
  });
  if (kind === 'LBO') Object.assign(base, {
    ebitda: 600_000_000, entryX: 9, exitX: 9, debtPct: 0.55, years: 5, ebitdaCAGR: 0.06
  });

  return {
    id: Math.random().toString(36).slice(2),
    name: `${kind} Model ${i}`,
    kind,
    tags: ['demo', kind.toLowerCase()],
    version: 'v1.0',
    updated: new Date().toISOString(),
    assumptions: base,
    outputs: computeOutputs({ kind, assumptions: base })
  };
}

// Test functions
export function runTests() {
  const tests = [];

  // Comps identity
  const comps = calcComps({ metric: 100, multiple: 10, netDebt: 200, shares: 10 });
  tests.push({
    name: 'Comps per‑share = (EV−Debt)/shares',
    pass: Math.abs(comps.perShare - ((100 * 10 - 200) / 10)) < 1e-9
  });

  // EPV near NOPAT/W
  const epv = calcEPV({ ebit: 100, tax: 0.2, wacc: 0.10, netDebt: 0, shares: 10 });
  tests.push({
    name: 'EPV EV ≈ NOPAT/W',
    pass: Math.abs(epv.ev - (100 * (1 - 0.2)) / 0.10) < 1e-6
  });

  // DCF monotonicity (wacc down -> value up)
  const d1 = calcDCF({ rev0: 1000, margin: 0.2, tax: 0.2, g: 0.05, tg: 0.02, wacc: 0.10, netDebt: 0, shares: 100 });
  const d2 = calcDCF({ rev0: 1000, margin: 0.2, tax: 0.2, g: 0.05, tg: 0.02, wacc: 0.09, netDebt: 0, shares: 100 });
  tests.push({
    name: 'DCF per‑share ↑ when WACC ↓',
    pass: (d2.perShare > d1.perShare)
  });

  return tests;
}
