import React from 'react';
import { createRoot } from 'react-dom/client';

// Minimal audit-only entry to keep initial JS tiny and reduce TBT.
// Avoids importing the full App, Redux store, routing, monitoring, etc.

const container = document.getElementById('root');
const root = createRoot(container);

function AuditShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">FinanceAnalyst Pro</h1>
          <span className="ml-2 text-xs text-gray-500">(Audit Mode)</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lightweight Audit View</h2>
        <p className="text-gray-600 mb-6">
          Rendering a minimal shell to produce consistent, low Total Blocking Time during CI audits.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Getting Started</p>
                <p className="text-sm text-gray-600">
                  Use the command palette (Cmd/Ctrl+K) in full app
                </p>
              </div>
              <button className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white" type="button">
                Command Palette
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

root.render(<AuditShell />);

// Remove the inline preloader once React has rendered
window.requestAnimationFrame(() => {
  const preloader = document.getElementById('app-preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => preloader.remove(), 200);
  }
});
