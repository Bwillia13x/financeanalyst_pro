import React from 'react';

import { project, valueEquity, growthVector, clamp } from '../../utils/valuationUtils';

// Histogram component for Monte Carlo results
export const Histogram = ({ data }) => {
  const bins = 24;
  if (data.length === 0) return null;

  const lo = data[0], hi = data[data.length - 1];
  const step = (hi - lo) / (bins || 1);
  const counts = new Array(bins).fill(0);

  for (const v of data) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / (step || 1))));
    counts[i]++;
  }

  const maxC = Math.max(...counts, 1);

  return (
    <svg width={360} height={160} className="text-slate-600">
      {counts.map((c, i) => {
        const x = 10 + (i * (340 / bins));
        const h = (140) * (c / maxC);
        return (
          <rect
            key={i}
            x={x}
            y={150 - h}
            width={340 / bins - 2}
            height={h}
            fill="#60a5fa"
          />
        );
      })}
    </svg>
  );
};

// Triangular distribution random number generator
function triRand(t) {
  const u = Math.random();
  const c = (t.mid - t.min) / (t.max - t.min + 1e-9);
  if (u < c) {
    return t.min + Math.sqrt(u * (t.max - t.min) * (t.mid - t.min));
  }
  return t.max - Math.sqrt((1 - u) * (t.max - t.min) * (t.max - t.mid));
}

// Monte Carlo simulation function
export function runMonteCarlo(assumptions, priors, n = 1000) {
  const vals = [];

  for (let i = 0; i < n; i++) {
    const aa = { ...assumptions };
    const g = triRand(priors.g);
    const path = growthVector(g, aa.years, aa.growthYears);
    aa.ebitMarginT = clamp(triRand(priors.marginT), 0, 0.6);

    // WACC shift: apply to rf (capm) or keManual
    const wShift = triRand(priors.waccShifter);
    if (aa.capmMode === 'capm') {
      aa.rf = Math.max(0, aa.rf + wShift);
    } else {
      aa.keManual = Math.max(0.01, aa.keManual + wShift);
    }

    aa.salesToCapital = Math.max(0.2, triRand(priors.stc));

    if (aa.terminalMethod === 'gordon') {
      aa.tg = clamp(triRand(priors.tgOrExit), -0.01, 0.05);
    } else {
      aa.exitEVMultiple = Math.max(2, triRand(priors.tgOrExit));
    }

    const rows = project(aa, path);
    vals.push(valueEquity(aa, rows).perShare);
  }

  vals.sort((x, y) => x - y);
  const p = (q) => vals[Math.max(0, Math.min(vals.length - 1, Math.floor(q * (vals.length - 1))))];

  return {
    vals,
    p5: p(0.05),
    p50: p(0.50),
    p95: p(0.95)
  };
}

// Generate default priors for Monte Carlo
export function generatePriors(assumptions) {
  return {
    g: { min: 0.02, mid: 0.05, max: 0.08 },
    marginT: {
      min: assumptions.ebitMargin0,
      mid: assumptions.ebitMarginT,
      max: Math.max(assumptions.ebitMarginT + 0.05, 0.25)
    },
    waccShifter: { min: -0.01, mid: 0, max: 0.01 },
    stc: { min: 1.5, mid: assumptions.salesToCapital, max: 3.5 },
    tgOrExit: assumptions.terminalMethod === 'gordon'
      ? { min: 0.00, mid: assumptions.tg, max: 0.04 }
      : { min: 6, mid: assumptions.exitEVMultiple, max: 12 }
  };
}
