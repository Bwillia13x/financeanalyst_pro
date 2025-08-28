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

const Tag = ({ t }) => (
  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-[2px] text-[11px] text-slate-700">
    {t}
  </span>
);

const TemplateGallery = ({ onUse }) => {
  return (
    <Card title="Template Gallery">
      <div className="grid grid-cols-2 gap-3">
        {templates.map(t => (
          <div key={t.kind} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-1 text-[13px] font-semibold text-slate-800">{t.title}</div>
            <div className="mb-2 text-[12px] text-slate-600">{t.description}</div>
            <div className="mb-2 flex flex-wrap gap-1">
              {t.tags.map(x => (
                <Tag key={x} t={x} />
              ))}
            </div>
            <button
              onClick={() => onUse(t.kind)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TemplateGallery;
