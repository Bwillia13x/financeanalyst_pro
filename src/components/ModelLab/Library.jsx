import React, { useState } from 'react';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>}
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
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Library = ({ models, setModels, onSelect }) => {
  const [q, setQ] = useState('');
  const tags = Array.from(new Set(models.flatMap(m => m.tags)));
  const [tag, setTag] = useState(undefined);

  const filtered = models.filter(m =>
    (!q || m.name.toLowerCase().includes(q.toLowerCase())) &&
    (!tag || m.tags.includes(tag))
  );

  const toggleSel = (m) => {
    setModels(models.map(x => x.id === m.id ? ({ ...x, selected: !x.selected }) : x));
  };

  const del = (m) => setModels(models.filter(x => x.id !== m.id));

  const bump = (m) => {
    const [v, patch] = m.version.split('v')[1].split('.');
    const newV = `v${v}.${Number(patch || 0) + 1}`;
    setModels(models.map(x => x.id === m.id ? ({ ...x, version: newV, updated: new Date().toISOString() }) : x));
  };

  return (
    <Card
      title="Model Library"
      right={<Pill tone="blue">{models.filter(m => m.selected).length} selected</Pill>}
    >
      <div className="mb-3 grid grid-cols-3 items-end gap-2">
        <label className="col-span-2 text-[12px]">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or tag…"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
          />
        </label>
        <label className="text-[12px]">
          <span className="mb-1 block text-slate-600">Filter tag</span>
          <select
            value={tag || ''}
            onChange={(e) => setTag(e.target.value || undefined)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">All</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <ul className="grid grid-cols-1 gap-2">
        {filtered.map(m => (
          <li key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-800">{m.name}</span>
                <Pill tone="amber">{m.version}</Pill>
                <Pill tone="slate">{m.kind}</Pill>
                {m.selected && <Pill tone="green">Compare</Pill>}
              </div>
              <div className="text-[11px] text-slate-500">
                Updated {new Date(m.updated).toLocaleString()} • {m.tags.map(t => <span key={t} className="mr-1">#{t}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect(m.id)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => toggleSel(m)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
              >
                {m.selected ? 'Unselect' : 'Select'}
              </button>
              <button
                onClick={() => bump(m)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
              >
                Bump
              </button>
              <button
                onClick={() => del(m)}
                className="text-[12px] text-rose-600 hover:text-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Library;
