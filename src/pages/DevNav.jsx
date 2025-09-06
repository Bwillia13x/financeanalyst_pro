import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Core Pages',
    links: [
      ['Home', '/'],
      ['Workspace', '/financial-model-workspace'],
      ['Portfolio', '/portfolio-management'],
      ['Valuation Workbench', '/valuation-workbench'],
      ['AI Insights', '/ai-insights'],
      ['Analytics', '/analytics'],
      ['Dashboard', '/dashboard'],
      ['Performance', '/performance'],
      ['Security', '/security'],
    ]
  },
  {
    title: 'Data & Realtime',
    links: [
      ['Real-time Market Data', '/real-time-market-data'],
      ['Market Analysis', '/market-analysis'],
      ['Scenario Analysis', '/scenario-analysis'],
    ]
  },
  {
    title: 'Utilities',
    links: [
      ['Reports', '/reports'],
      ['Settings', '/settings'],
      ['Changelog', '/changelog'],
      ['Profile (requires auth)', '/profile'],
    ]
  }
];

const DevNav = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Dev Navigation</h1>
      <p className="text-sm text-muted-foreground mb-6">Quick links to verify lazy routes and navigation.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="p-4 border border-border rounded-lg bg-background">
            <h2 className="text-sm font-medium mb-2">{s.title}</h2>
            <ul className="space-y-1">
              {s.links.map(([label, path]) => (
                <li key={path}>
                  <Link className="text-blue-600 hover:underline" to={path}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevNav;
