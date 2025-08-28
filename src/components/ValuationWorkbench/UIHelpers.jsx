// Card component for consistent section layouts
export const Card = ({ title, right, children, className = '' }) => (
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

// Pill component for status indicators and labels
export const Pill = ({ children, tone = 'slate' }) => {
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

// NumberInput component for numerical form inputs
export const NumberInput = ({ label, value, onChange, suffix, step = 0.01, min, max }) => {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          className="w-28 rounded-md border border-border bg-background px-2 py-1 text-right text-foreground"
          value={Number(value.toFixed(6))}
          step={step}
          min={min}
          max={max}
          onChange={e =>
            onChange(
              Math.max(
                min ?? -Infinity,
                Math.min(max ?? Infinity, parseFloat(e.target.value || '0'))
              )
            )
          }
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
};

// Switch component for toggle functionality
export const Switch = ({ label, on, setOn }) => {
  return (
    <label className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`h-5 w-9 rounded-full border ${on ? 'bg-emerald-500 border-emerald-500' : 'bg-muted border-border'}`}
      >
        <span
          className={`block h-4 w-4 translate-y-[2px] rounded-full bg-white shadow transition ${on ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </label>
  );
};
