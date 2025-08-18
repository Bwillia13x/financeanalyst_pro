import React from 'react';

import { project, valueEquity, growthVector } from '../../utils/valuationUtils';

// Heatmap component for visualizing sensitivity analysis
export const Heatmap = ({ grid, xLabels, yLabels }) => {
  const vMin = Math.min(...grid.flat());
  const vMax = Math.max(...grid.flat());

  const color = (v) => {
    const t = (v - vMin) / (vMax - vMin + 1e-9);
    const h = 220 - 220 * t;
    return `hsl(${h} 80% 55%)`;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid" style={{ gridTemplateColumns: `auto repeat(${xLabels.length}, minmax(0,1fr))` }}>
        <div className="bg-slate-50 px-2 py-1 text-[11px] text-slate-600" />
        {xLabels.map((x, i) => (
          <div key={i} className="bg-slate-50 px-2 py-1 text-center text-[11px] text-slate-600">
            {x}
          </div>
        ))}
        {yLabels.map((y, ri) => (
          <React.Fragment key={ri}>
            <div className="bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{y}</div>
            {grid[ri].map((v, ci) => (
              <div
                key={ci}
                className="h-7 text-center text-[11px] flex items-center justify-center text-white font-medium"
                style={{ background: color(v) }}
              >
                {v.toFixed(2)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Helper to generate range arrays
function generateRange(min, max, steps) {
  if (steps === 1) return [min];
  const step = (max - min) / (steps - 1);
  return Array.from({ length: steps }, (_, i) => min + i * step);
}

// Function to generate heatmap data for sensitivity analysis
export function generateHeatmap(assumptions, waccVals, termVals, termIsGrowth) {
  const grid = [];

  for (let i = 0; i < waccVals.length; i++) {
    const row = [];
    for (let j = 0; j < termVals.length; j++) {
      const aa = { ...assumptions };
      const growth = growthVector(
        aa.growthYears > 0 ? (aa.ebitMarginT > aa.ebitMargin0 ? 0.06 : 0.03) : 0,
        aa.years,
        aa.growthYears
      );

      if (termIsGrowth) {
        aa.terminalMethod = 'gordon';
        aa.tg = termVals[j];
      } else {
        aa.terminalMethod = 'exitMultiple';
        aa.exitEVMultiple = termVals[j];
      }

      // Force wacc for the run by overriding keManual to hit target
      const ke = aa.capmMode === 'capm' ? (aa.rf + aa.beta * aa.erp) : aa.keManual;
      const curW = aa.wd * aa.kd * (1 - aa.taxRate) + aa.we * ke;
      const deltaKe = (waccVals[i] - (aa.wd * aa.kd * (1 - aa.taxRate))) / (aa.we || 1e-9);
      aa.capmMode = 'manualKe';
      aa.keManual = deltaKe;

      const rows = project(aa, growth);
      const val = valueEquity(aa, rows).perShare;
      row.push(val);
    }
    grid.push(row);
  }
  return grid;
}

// Enhanced heatmap generation with custom axis configuration
export function generateHeatmapsWithConfig(assumptions, axisConfig = null) {
  const config = axisConfig || {
    wacc: { min: 0.06, max: 0.14, steps: 5 },
    growth: { min: 0.015, max: 0.035, steps: 5 },
    exitMultiple: { min: 8, max: 16, steps: 5 }
  };

  const waccVals = generateRange(config.wacc.min, config.wacc.max, config.wacc.steps);
  const growthVals = generateRange(config.growth.min, config.growth.max, config.growth.steps);
  const exitMultipleVals = generateRange(config.exitMultiple.min, config.exitMultiple.max, config.exitMultiple.steps);

  return {
    waccGrowth: {
      grid: generateHeatmap(assumptions, waccVals, growthVals, true),
      xLabels: growthVals.map(g => (g * 100).toFixed(1) + '%'),
      yLabels: waccVals.map(w => (w * 100).toFixed(1) + '%'),
      title: 'WACC × Terminal Growth'
    },
    waccExit: {
      grid: generateHeatmap(assumptions, waccVals, exitMultipleVals, false),
      xLabels: exitMultipleVals.map(m => m.toFixed(1) + 'x'),
      yLabels: waccVals.map(w => (w * 100).toFixed(1) + '%'),
      title: 'WACC × Exit Multiple'
    }
  };
}
