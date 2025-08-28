import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { validateModelAssumptions } from '../../services/calculators';
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

function ValidatedNumberInput({
  label,
  value,
  onChange,
  suffix,
  step = 0.01,
  min,
  max,
  fieldKey,
  validationIssues = [],
  onFocus,
  onBlur,
  isDirty = false
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const issues = validationIssues.filter(issue => issue.field === fieldKey);
  const hasError = issues.some(issue => issue.level === 'error');
  const hasWarning = issues.some(issue => issue.level === 'warn');

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = e => {
    const newValue = parseFloat(e.target.value || '0');
    setLocalValue(newValue);
    const clampedValue = clamp(newValue, min ?? -Infinity, max ?? Infinity);
    onChange(clampedValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.(fieldKey);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.(fieldKey);
  };

  const stepUp = () => onChange(clamp((value || 0) + step, min ?? -Infinity, max ?? Infinity));
  const stepDown = () => onChange(clamp((value || 0) - step, min ?? -Infinity, max ?? Infinity));

  return (
    <div className="relative">
      <label className="flex items-center justify-between gap-3 text-[13px]">
        <span className={`text-slate-600 ${isDirty ? 'font-medium' : ''}`}>
          {label}
          {isDirty && <span className="ml-1 text-amber-500">•</span>}
        </span>
        <div className="flex items-center gap-1">
          <div className="relative">
            <input
              type="number"
              className={`w-32 rounded-md border px-2 py-1 text-right transition-colors
                ${
                  hasError
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                    : hasWarning
                      ? 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-200'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-200'
                }
                ${isFocused ? 'ring-2' : ''}
              `}
              value={Number((localValue ?? 0).toFixed(6))}
              step={step}
              min={min}
              max={max}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={e => {
                if (e.shiftKey && e.key === 'ArrowUp') {
                  e.preventDefault();
                  onChange(clamp((value || 0) + step * 10, min ?? -Infinity, max ?? Infinity));
                } else if (e.shiftKey && e.key === 'ArrowDown') {
                  e.preventDefault();
                  onChange(clamp((value || 0) - step * 10, min ?? -Infinity, max ?? Infinity));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  stepUp();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  stepDown();
                }
              }}
            />
            {(hasError || hasWarning) && (
              <div
                className={`absolute -right-2 -top-2 w-3 h-3 rounded-full
                ${hasError ? 'bg-red-500' : 'bg-amber-500'}
              `}
              />
            )}
          </div>
          {suffix && <span className="text-slate-500">{suffix}</span>}
        </div>
      </label>

      {/* Field-level error/warning messages */}
      {issues.length > 0 && isFocused && (
        <div className="absolute z-10 mt-1 p-2 bg-white border rounded-md shadow-lg text-[11px] min-w-48">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`${issue.level === 'error' ? 'text-red-700' : 'text-amber-700'}`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ValidatedAssumptionsForm = ({
  model,
  onChange,
  onValidationChange,
  autoSave = true,
  undoStack = [],
  onUndo
}) => {
  const [validationIssues, setValidationIssues] = useState([]);
  const [dirtyFields, setDirtyFields] = useState(new Set());
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const tmpl = templates.find(t => t.kind === model.kind);

  // Validate on assumptions change
  useEffect(() => {
    const issues = validateModelAssumptions(model);
    setValidationIssues(issues);
    onValidationChange?.(issues);
  }, [model, onValidationChange]);

  // Auto-save with debounce
  useEffect(() => {
    if (!autoSave || dirtyFields.size === 0) return;

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(() => {
      setLastSaved(new Date());
      setDirtyFields(new Set());
      // Auto-save would call modelStore.save(model) here
    }, 500);

    setSaveTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [model.assumptions, autoSave, dirtyFields.size]);

  const set = useCallback(
    key => value => {
      setDirtyFields(prev => new Set(prev).add(key));
      onChange({ ...model.assumptions, [key]: value });
    },
    [model.assumptions, onChange]
  );

  // Derived hints calculation
  const derivedHints = useMemo(() => {
    const hints = [];
    const a = model.assumptions;

    if (model.kind === 'DCF' && a.rev0 && a.margin) {
      const ebit = a.rev0 * a.margin;
      hints.push(`EBIT: $${(ebit / 1e6).toFixed(0)}M`);

      if (a.wacc && a.tg) {
        const tvMultiple = 1 / (a.wacc - a.tg);
        hints.push(`TV Multiple: ${tvMultiple.toFixed(1)}x`);
      }
    }

    if (model.kind === 'Comps' && a.metric && a.multiple) {
      const ev = a.metric * a.multiple;
      hints.push(`Implied EV: $${(ev / 1e9).toFixed(1)}B`);
    }

    if (model.outputs?.perShare && a.price) {
      const mos = ((model.outputs.perShare - a.price) / a.price) * 100;
      hints.push(`MOS: ${mos > 0 ? '+' : ''}${mos.toFixed(1)}%`);
    }

    return hints;
  }, [model]);

  // Get validation summary
  const validationSummary = useMemo(() => {
    const errors = validationIssues.filter(i => i.level === 'error');
    const warnings = validationIssues.filter(i => i.level === 'warn');
    return { errors: errors.length, warnings: warnings.length };
  }, [validationIssues]);

  if (!tmpl) return null;

  return (
    <Card
      title="Assumptions"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="slate">Schema‑driven</Pill>
          {validationSummary.errors > 0 && (
            <Pill tone="red">{validationSummary.errors} errors</Pill>
          )}
          {validationSummary.warnings > 0 && (
            <Pill tone="amber">{validationSummary.warnings} warnings</Pill>
          )}
          {dirtyFields.size > 0 && <Pill tone="blue">Unsaved</Pill>}
        </div>
      }
    >
      {/* Global validation banner */}
      {validationSummary.errors > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-[13px] font-medium text-red-800 mb-1">
            {validationSummary.errors} validation error(s) found
          </div>
          <div className="text-[12px] text-red-700">Fix errors to enable calculations</div>
        </div>
      )}

      {/* Undo button */}
      {undoStack.length > 0 && (
        <div className="mb-3">
          <button
            onClick={onUndo}
            className="text-[12px] text-blue-600 hover:text-blue-700 underline"
          >
            ↶ Undo ({undoStack.length})
          </button>
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-3">
        {tmpl.schema.map(f => (
          <div key={f.key}>
            {(f.kind === 'number' || f.kind === 'percent') && (
              <ValidatedNumberInput
                label={f.label}
                value={Number(model.assumptions[f.key] || 0)}
                onChange={set(f.key)}
                step={f.step}
                min={f.min}
                max={f.max}
                suffix={f.suffix}
                fieldKey={f.key}
                validationIssues={validationIssues}
                isDirty={dirtyFields.has(f.key)}
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

      {/* Derived hints */}
      {derivedHints.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-[11px] text-slate-600 mb-1">Derived Metrics</div>
          <div className="flex flex-wrap gap-2">
            {derivedHints.map((hint, idx) => (
              <span key={idx} className="text-[11px] bg-white px-2 py-1 rounded border">
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Auto-save status */}
      {autoSave && (
        <div className="mt-3 text-[11px] text-slate-500">
          {dirtyFields.size > 0
            ? 'Auto-saving...'
            : lastSaved
              ? `Last saved: ${lastSaved.toLocaleTimeString()}`
              : 'All changes saved'}
        </div>
      )}
    </Card>
  );
};

export default ValidatedAssumptionsForm;
