import { ChevronRight, Home } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { cn } from '../../utils/cn';

const Breadcrumb = ({ items, className }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={item.path || index} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="w-4 h-4 text-muted-foreground mx-2"
                aria-hidden="true"
              />
            )}

            {item.path && index < breadcrumbItems.length - 1 ? (
              <Link
                to={item.path}
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
                aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}
              >
                {index === 0 && item.icon && (
                  <item.icon className="w-4 h-4 mr-1 inline" aria-hidden="true" />
                )}
                {item.label}
              </Link>
            ) : (
              <span
                className="text-foreground font-medium"
                aria-current="page"
              >
                {index === 0 && item.icon && (
                  <item.icon className="w-4 h-4 mr-1 inline" aria-hidden="true" />
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Auto-generate breadcrumbs from URL path
const generateBreadcrumbsFromPath = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Home', path: '/', icon: Home }
  ];

  // Map common paths to user-friendly labels
  const pathLabels = {
    'financial-model-workspace': 'Workspace',
    'portfolio-management': 'Portfolio',
    'private-analysis': 'Private Analysis',
    'scenario-analysis-sensitivity-tools': 'Scenario Analysis',
    'real-time-market-data-center': 'Market Data',
    'valuation-workbench': 'Valuation Workbench',
    'model-lab': 'Model Lab',
    'canvas': 'Canvas'
  };

  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = pathLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    breadcrumbs.push({
      label,
      path: currentPath
    });
  });

  return breadcrumbs;
};

export default Breadcrumb;
