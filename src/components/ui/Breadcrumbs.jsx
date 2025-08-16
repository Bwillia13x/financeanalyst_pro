import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LABELS = {
  'financial-model-workspace': 'Workspace',
  'real-time-market-data-center': 'Market Data',
  'scenario-analysis-sensitivity-tools': 'Analysis',
  'private-analysis': 'Private Analysis',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const items = segments.map((seg, idx) => {
    const path = `/${segments.slice(0, idx + 1).join('/')}`;
    return {
      label: LABELS[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      path,
    };
  });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </li>
        {items.map((item, idx) => (
          <li key={item.path} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-muted-foreground">/</span>
            {idx < items.length - 1 ? (
              <Link to={item.path} className="hover:text-foreground">{item.label}</Link>
            ) : (
              <span className="text-foreground" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
