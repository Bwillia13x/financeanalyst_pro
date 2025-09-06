import React from 'react';

const items = [
  {
    date: '2025-09-05',
    title: 'Performance & UX Foundation',
    points: [
      'Added performance budgets with Lighthouse checks in CI',
      'Gated demo routes behind feature flags',
      'Unified route skeletons and improved mobile header density',
      'Optional self-hosted fonts with fast fallbacks',
    ],
  },
  {
    date: '2025-09-04',
    title: 'Routing & Monitoring Stabilization',
    points: [
      'Lazy-loaded routes and idle-mounted secondary nav',
      'Sentry initialization guards and automated env detection',
    ],
  },
];

const Changelog = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Changelog</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Highlights of recent platform updates. For full history, see CHANGELOG.md in the repo.
      </p>
      <div className="space-y-6">
        {items.map((it, idx) => (
          <div key={idx} className="border border-border rounded-xl p-4 bg-card">
            <div className="text-xs text-muted-foreground">{it.date}</div>
            <div className="text-lg font-medium">{it.title}</div>
            <ul className="list-disc pl-5 mt-2 text-sm text-foreground-secondary">
              {it.points.map((p, i) => (
                <li key={i} className="mb-1">{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Changelog;

