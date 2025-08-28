import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900">
      <section className="px-6 py-12 text-center max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">FinanceAnalyst Pro</h1>
        <p className="mt-3 text-slate-600">
          Professional financial modeling and valuation platform. Start your analysis in the
          Workspace.
        </p>
        <div className="mt-6">
          <Link
            to="/financial-model-workspace"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Go to Financial Model Workspace"
          >
            Open Workspace
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Landing;
