import { ChevronDown, MoreHorizontal } from 'lucide-react';
import React, { useState, memo, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { cn } from '../../utils/cn';

import Button from './Button';

/**
 * Secondary Navigation Component for tools and advanced features
 * Appears below primary navigation or within page contexts
 */
const SecondaryNav = ({
  items = [],
  className,
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'dropdown'
  showMoreButton = false,
  maxVisibleItems = 4,
  ariaLabel = 'Secondary navigation',
  navigation = null,
  activeItem = null,
  onItemClick = null
}) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [_isMobileMenuOpen, _setIsMobileMenuOpen] = useState(false);

  // Memoize computed navigation items to prevent unnecessary recalculations
  const visibleItems = useMemo(() =>
    showMoreButton && items.length > maxVisibleItems ? items.slice(0, maxVisibleItems) : items,
    [items, showMoreButton, maxVisibleItems]
  );

  const hiddenItems = useMemo(() =>
    showMoreButton && items.length > maxVisibleItems ? items.slice(maxVisibleItems) : [],
    [items, showMoreButton, maxVisibleItems]
  );

  // Memoize navigation items to prevent unnecessary recalculations
  const navigationItems = useMemo(() => {
    if (navigation === 'analysisTools') {
      return [
        {
          id: 'spreadsheet',
          label: 'Financial Spreadsheet',
          icon: '📊',
          'data-tour': 'financial-spreadsheet-tab'
        },
        {
          id: 'modeling',
          label: 'Financial Modeling',
          icon: '🧮',
          'data-tour': 'financial-modeling-tab'
        },
        {
          id: 'analysis',
          label: 'Analysis & Results',
          icon: '📈',
          'data-tour': 'analysis-results-tab'
        },
        { id: 'lbo', label: 'Advanced LBO', icon: '🏢' },
        { id: 'threestatement', label: '3-Statement Model', icon: '📑' },
        { id: 'scenarios', label: 'Scenario Analysis', icon: '🎯' },
        { id: 'marketdata', label: 'Market Data', icon: '📈' },
        { id: 'montecarlo', label: 'Monte Carlo', icon: '🎲' },
        { id: 'import-export', label: 'Import/Export', icon: '💾' }
      ];
    }
    if (navigation === 'portfolioViews') {
      return [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'builder', label: 'Builder', icon: '🔧' },
        { id: 'analytics', label: 'Analytics', icon: '📊' }
      ];
    }
    return items;
  }, [navigation, items]);

  const renderNavItem = useCallback((item, index) => {
    const isActive = activeItem ? activeItem === item.id : location.pathname === item.path;
    const handleClick = onItemClick ? () => onItemClick(item.id) : undefined;

    const content = (
      <button
        key={item.id || index}
        type="button"
        onKeyDown={(e) => e.key === 'Enter' && handleClick?.()}
        className={cn(
          'relative px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          variant === 'vertical' && 'block w-full text-left',
          item.className
        )}
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        title={item.tooltip}
        data-tour={item['data-tour']}
        data-tab={item.id}
      >
        {item.icon && (
          <span className="mr-2 text-sm" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="hidden sm:inline">{item.label}</span>
        <span className="sm:hidden">{item.label.split(' ')[0]}</span>
      </button>
    );

    if (item.path && !onItemClick) {
      return (
        <Link key={item.path || index} to={item.path}>
          {content}
        </Link>
      );
    }

    return content;
  }, [activeItem, location.pathname, onItemClick]);

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          Advanced Tools
          <ChevronDown
            className={cn('w-4 h-4 ml-1 transition-transform', isDropdownOpen && 'rotate-180')}
          />
        </Button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-popover border border-border rounded-xl shadow-elevation-3 py-3 z-50 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <nav role="navigation" aria-label={ariaLabel}>
              {items.map((item, index) => (
                <Link
                  key={item.path || index}
                  to={item.path}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm text-popover-foreground hover:bg-muted/80 hover:text-popover-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-md mx-1',
                    location.pathname === item.path && 'bg-primary/5 text-primary font-medium'
                  )}
                  onClick={() => setIsDropdownOpen(false)}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  {item.icon && <item.icon className="w-5 h-5 mr-3 text-muted-foreground" aria-hidden="true" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</div>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <nav
        className={cn(
          'flex items-center space-x-1 p-3 sm:p-2 bg-muted/30 rounded-lg overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
          className
        )}
        role="navigation"
        aria-label={ariaLabel}
      >
        <div className="flex items-center space-x-1 min-w-max">
          {navigationItems.map(renderNavItem)}
        </div>

        {hiddenItems.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                <div className="py-1">{hiddenItems.map(renderNavItem)}</div>
              </div>
            )}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex items-center',
        variant === 'vertical' && 'flex-col items-stretch space-y-1',
        className
      )}
      role="navigation"
      aria-label={ariaLabel}
    >
      {visibleItems.map(renderNavItem)}

      {showMoreButton && hiddenItems.length > 0 && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label={`Show ${hiddenItems.length} more tools`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-elevation-2 py-2 z-50">
              {hiddenItems.map(renderNavItem)}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

/**
 * Predefined secondary navigation for common tool sets
 */
export const AnalysisToolsNav = ({ className }) => {
  const tools = [
    {
      path: '/valuation-workbench',
      label: 'Valuation Workbench',
      tooltip: 'Advanced DCF valuation tools'
    },
    {
      path: '/model-lab',
      label: 'Model Lab',
      tooltip: 'Pre-built financial model templates'
    },
    {
      path: '/canvas',
      label: 'Canvas',
      tooltip: 'Investment thesis visualization'
    },
    {
      path: '/advanced-charts',
      label: 'Advanced Charts',
      tooltip: 'Professional data visualization'
    }
  ];

  return (
    <SecondaryNav
      items={tools}
      className={className}
      ariaLabel="Analysis tools"
      showMoreButton={true}
      maxVisibleItems={3}
    />
  );
};

// Memoize the SecondaryNav component to prevent unnecessary re-renders
export default memo(SecondaryNav);
