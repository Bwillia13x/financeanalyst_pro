import React from 'react';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && (
          <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>
        )}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const DriverInspector = ({ model }) => {
  const map = {
    DCF: [
      { label: 'Revenue₀', affects: ['EBIT', 'NOPAT', 'FCFF', 'EV', 'Per‑share'] },
      { label: 'EBIT Margin', affects: ['EBIT', 'NOPAT', 'FCFF', 'EV', 'Per‑share'] },
      { label: 'Tax Rate', affects: ['NOPAT', 'FCFF', 'EV', 'Per‑share'] },
      { label: 'WACC', affects: ['PV', 'TV', 'EV', 'Per‑share'] },
      { label: 'Terminal g', affects: ['TV', 'EV', 'Per‑share'] },
      { label: 'Net Debt', affects: ['Equity', 'Per‑share'] },
      { label: 'Shares', affects: ['Per‑share'] }
    ],
    Comps: [
      { label: 'Metric', affects: ['EV', 'Per‑share'] },
      { label: 'EV/Metric', affects: ['EV', 'Per‑share'] },
      { label: 'Net Debt', affects: ['Equity', 'Per‑share'] },
      { label: 'Shares', affects: ['Per‑share'] }
    ],
    EPV: [
      { label: 'EBIT', affects: ['NOPAT', 'EV', 'Per‑share'] },
      { label: 'Tax Rate', affects: ['NOPAT', 'EV', 'Per‑share'] },
      { label: 'WACC', affects: ['EV', 'Per‑share'] },
      { label: 'Net Debt', affects: ['Equity', 'Per‑share'] },
      { label: 'Shares', affects: ['Per‑share'] }
    ],
    LBO: [
      { label: 'EBITDA₀', affects: ['Entry EV', 'Equity₀', 'IRR'] },
      { label: 'Entry/Exit multiples', affects: ['IRR'] },
      { label: 'Debt %', affects: ['Equity₀', 'IRR'] },
      { label: 'Hold (yrs)', affects: ['IRR'] },
      { label: 'EBITDA CAGR', affects: ['IRR'] }
    ]
  };

  const items = map[model.kind] || [];

  return (
    <Card title="Driver Inspector" right={<Pill tone="amber">{model.kind}</Pill>}>
      <ul className="space-y-1 text-[12px]">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1"
          >
            <span className="text-slate-700">{it.label}</span>
            <span className="text-slate-500">{it.affects.join(' • ')}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default DriverInspector;
