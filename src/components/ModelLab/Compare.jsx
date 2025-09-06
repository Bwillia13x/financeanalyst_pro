import React from 'react';

import { computeOutputs } from '../../utils/modelLabCalculations';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        {title && (
          <h3 className="text-[13px] font-semibold tracking-wide text-foreground">{title}</h3>
        )}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-muted text-foreground border-border',
    blue: 'bg-primary/10 text-primary border-primary/30',
    amber: 'bg-warning/10 text-warning border-warning/30',
    green: 'bg-success/10 text-success border-success/30',
    red: 'bg-destructive/10 text-destructive border-destructive/30'
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Cur = (x, c = 0) =>
  x >= 1e9
    ? `$${(x / 1e9).toFixed(c)}B`
    : x >= 1e6
      ? `$${(x / 1e6).toFixed(c)}M`
      : `$${x.toFixed(c)}`;
const Pct = (x, d = 1) => `${(100 * x).toFixed(d)}%`;

const Compare = ({ models }) => {
  const selected = models.filter(m => m.selected);
  const rows = selected.map(m => ({
    id: m.id,
    name: m.name,
    kind: m.kind,
    out: computeOutputs(m)
  }));

  return (
    <Card title="Cross‑Model Compare" right={<Pill tone="green">{selected.length} models</Pill>}>
      {selected.length === 0 ? (
        <div className="text-[12px] text-slate-600">Select models in the library to compare.</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="min-w-[640px] text-right text-[12px]">
            <thead className="bg-muted/40 text-foreground">
              <tr>
                <th className="px-2 py-1 text-left">Model</th>
                <th className="px-2 py-1">Kind</th>
                <th className="px-2 py-1">EV</th>
                <th className="px-2 py-1">Per‑share</th>
                <th className="px-2 py-1">IRR (LBO)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="odd:bg-card even:bg-muted/20">
                  <td className="px-2 py-1 text-left">{r.name}</td>
                  <td className="px-2 py-1">{r.kind}</td>
                  <td className="px-2 py-1">{r.out.ev !== undefined ? Cur(r.out.ev, 0) : '—'}</td>
                  <td className="px-2 py-1">
                    {r.out.perShare !== undefined ? `$${r.out.perShare.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-2 py-1">{r.out.irr !== undefined ? Pct(r.out.irr, 1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default Compare;
