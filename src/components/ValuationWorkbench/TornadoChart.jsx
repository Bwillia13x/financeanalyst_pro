import React from 'react';

import { project, valueEquity, growthVector } from '../../utils/valuationUtils';

export const TornadoChart = ({ items }) => {
  const max = Math.max(...items.map(x => Math.abs(x.delta)), 1);

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const w = Math.abs(item.delta) / max;
        const pos = item.delta >= 0;
        return (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <div className="w-40 text-slate-700">{item.label}</div>
            <div className="relative h-5 flex-1 rounded bg-slate-100">
              <div
                className={`absolute top-0 h-5 rounded ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{
                  width: `${w * 100}%`,
                  left: pos ? '50%' : `${50 - w * 50}%`
                }}
              />
              <div className="absolute left-1/2 top-0 h-5 w-px bg-white/60" />
            </div>
            <div className={`w-20 text-right ${pos ? 'text-emerald-700' : 'text-rose-700'}`}>
              {item.delta >= 0 ? '+' : ''}
              {item.delta.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function generateTornadoData(assumptions, baseRows, basePerShare) {
  const one = (label, tweak) => {
    const aa = { ...assumptions };
    tweak(aa);
    const rows = project(
      aa,
      growthVector(
        aa.growthYears > 0 ? (aa.ebitMarginT > aa.ebitMargin0 ? 0.06 : 0.03) : 0,
        aa.years,
        aa.growthYears
      )
    );
    const v = valueEquity(aa, rows).perShare;
    return { label, delta: v - basePerShare };
  };

  const items = [
    one('WACC +100 bps', x => {
      if (x.capmMode === 'capm') x.rf += 0.01;
      else x.keManual += 0.01;
    }),
    one('WACC −100 bps', x => {
      if (x.capmMode === 'capm') x.rf -= 0.01;
      else x.keManual -= 0.01;
    }),
    one('Terminal g +50 bps', x => {
      x.terminalMethod = 'gordon';
      x.tg += 0.005;
    }),
    one('Terminal g −50 bps', x => {
      x.terminalMethod = 'gordon';
      x.tg -= 0.005;
    }),
    one('Exit multiple +1x', x => {
      x.terminalMethod = 'exitMultiple';
      x.exitEVMultiple += 1;
    }),
    one('Exit multiple −1x', x => {
      x.terminalMethod = 'exitMultiple';
      x.exitEVMultiple -= 1;
    }),
    one('EBIT margin +100 bps', x => {
      x.ebitMarginT += 0.01;
    }),
    one('EBIT margin −100 bps', x => {
      x.ebitMarginT -= 0.01;
    }),
    one('Sales‑to‑Capital +0.5', x => {
      x.reinvMethod = 'salesToCapital';
      x.salesToCapital += 0.5;
    }),
    one('Sales‑to‑Capital −0.5', x => {
      x.reinvMethod = 'salesToCapital';
      x.salesToCapital = Math.max(0.1, x.salesToCapital - 0.5);
    })
  ];

  // Sort by absolute impact desc
  return items.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
