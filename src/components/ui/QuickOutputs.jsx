import React from 'react';

// Lightweight shared outputs summary for valuation/model pages
// Expects { ev, perShare } on outputs (numbers)
const QuickOutputs = ({ outputs }) => {
  const formatCurrency = (val) => {
    if (val === undefined || val === null || Number.isNaN(val)) return '—';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3 text-[13px]">
      <div className="rounded-xl border border-border p-3">
        <div className="text-muted-foreground">Enterprise Value</div>
        <div className="text-lg font-semibold">{formatCurrency(outputs?.ev)}</div>
      </div>
      <div className="rounded-xl border border-border p-3">
        <div className="text-muted-foreground">Per‑share</div>
        <div className="text-2xl font-bold">
          {outputs?.perShare === undefined || outputs?.perShare === null
            ? '—'
            : `$${outputs.perShare.toFixed(2)}`}
        </div>
      </div>
    </div>
  );
};

export default QuickOutputs;

