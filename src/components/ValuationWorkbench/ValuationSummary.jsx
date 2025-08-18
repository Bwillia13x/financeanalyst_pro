import React from 'react';

import { Cur, Pct } from '../../utils/valuationUtils';

const ValuationSummary = ({ valuation, assumptions }) => {
  const tvEvRatio = valuation.tv / (valuation.ev || 1e-9);
  const getTvEvColor = (ratio) => {
    if (ratio > 0.8) return 'text-amber-600'; // High TV dependency - warning
    if (ratio > 0.6) return 'text-slate-600'; // Moderate
    return 'text-emerald-600'; // Conservative
  };

  return (
    <div className="grid grid-cols-2 gap-3 text-[13px]">
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="text-slate-500">PV(FCFF)</div>
        <div className="text-lg font-semibold">{Cur(valuation.pvFCFF, 0)}</div>
        <div className="text-slate-500">PV(Terminal)</div>
        <div className="text-lg font-semibold">{Cur(valuation.pvTV, 0)}</div>
        <div className="text-slate-500">EV</div>
        <div className="text-lg font-semibold">{Cur(valuation.ev, 0)}</div>
        <div className="text-slate-500">TV/EV Ratio</div>
        <div className={`text-sm font-medium ${getTvEvColor(tvEvRatio)}`}>
          {Pct(tvEvRatio, 1)}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="text-slate-500">EV − Net Debt − MI + Cash Adj.</div>
        <div className="text-lg font-semibold">{Cur(valuation.equity, 0)}</div>
        <div className="text-slate-500">Per Share</div>
        <div className={`text-2xl font-bold ${valuation.perShare >= assumptions.price ? 'text-emerald-600' : 'text-rose-600'}`}>
          {assumptions.currency} {valuation.perShare.toFixed(2)}
        </div>
        <div className="text-slate-500">Margin of Safety vs Price</div>
        <div className={`text-lg font-semibold ${valuation.mos >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {Pct(valuation.mos, 1)}
        </div>
      </div>
    </div>
  );
};

export default ValuationSummary;
