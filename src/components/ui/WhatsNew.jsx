import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'valorivx_whatsnew_2025_09';

const WhatsNew = ({ forceOpen = false }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const id = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(id);
    }
  }, [forceOpen]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background-overlay" onClick={dismiss} />
      <div className="relative w-full max-w-xl mx-4 bg-background border border-border rounded-xl shadow-elevation-2 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">What’s New in Valor‑IVX</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground" onClick={dismiss}>Close</button>
        </div>
        <ul className="list-disc pl-5 text-sm text-foreground">
          <li className="mb-1">Unified loading skeletons for faster perceived performance.</li>
          <li className="mb-1">Demo routes are hidden by default in production.</li>
          <li className="mb-1">Performance budgets with Lighthouse checks in CI.</li>
          <li className="mb-1">Mobile header density improvements.</li>
        </ul>
        <div className="mt-3 text-xs text-muted-foreground">
          View details in CHANGELOG or Pre‑Launch docs.
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <a
            href="/CHANGELOG.md"
            className="px-3 py-2 text-sm rounded-md border border-border bg-muted hover:bg-muted/80"
          >
            View changelog
          </a>
          <button
            onClick={dismiss}
            className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNew;

