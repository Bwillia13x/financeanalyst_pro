import React from 'react';

import { templates } from '../../utils/modelLabCalculations';

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

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function NumberInput({ label, value, onChange, suffix, step = 0.01, min, max }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-slate-600">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1 text-right"
          value={Number((value ?? 0).toFixed(6))}
          step={step}
          min={min}
          max={max}
          onChange={e =>
            onChange(clamp(parseFloat(e.target.value || '0'), min ?? -Infinity, max ?? Infinity))
          }
        />
        {suffix && <span className="text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}

const AssumptionsForm = ({ model, onChange }) => {
  const tmpl = templates.find(t => t.kind === model.kind);
  const set = k => v => onChange({ ...model.assumptions, [k]: v });

  if (!tmpl) return null;

  return (
    <Card title="Assumptions" right={<Pill tone="slate">Schema‑driven</Pill>}>
      <div className="grid grid-cols-2 gap-3">
        {tmpl.schema.map(f => (
          <div key={f.key}>
            {(f.kind === 'number' || f.kind === 'percent') && (
              <NumberInput
                label={f.label}
                value={Number(model.assumptions[f.key] || 0)}
                onChange={set(f.key)}
                step={f.step}
                min={f.min}
                max={f.max}
                suffix={f.suffix}
              />
            )}
            {f.kind === 'select' && (
              <label className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">{f.label}</span>
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                  value={model.assumptions[f.key] || ''}
                  onChange={e => set(f.key)(e.target.value)}
                >
                  {(f.options || []).map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AssumptionsForm;
