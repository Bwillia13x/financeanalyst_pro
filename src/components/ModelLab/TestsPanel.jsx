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

const TestsPanel = ({ tests }) => {
  return (
    <Card title="Dev / Sanity Tests">
      <ul className="space-y-1 text-[13px]">
        {tests.map(t => (
          <li key={t.name} className="flex items-center justify-between">
            <span className="text-slate-700">{t.name}</span>
            <span className={`ml-2 ${t.pass ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.pass ? 'PASS' : 'FAIL'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default TestsPanel;
