import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

// Enhanced Icons
import {
  ChevronRight,
  Home,
  MoreHorizontal,
  Folder,
  FileText,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  PieChart,
  Calculator,
  BookOpen,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';

/**
 * Enhanced Breadcrumb Navigation Component
 * Provides clear navigation context and way-finding throughout the application
 */

// Icon mapping for different page types
const pageIcons = {
  dashboard: Home,
  home: Home,
  portfolio: Folder,
  analysis: BarChart3,
  reports: FileText,
  settings: Settings,
  users: Users,
  performance: TrendingUp,
  allocation: PieChart,
  valuation: Calculator,
  help: BookOpen,
  search: Search,
  filter: Filter
};

// Label mapping for breadcrumb items
const breadcrumbLabels = {
  dashboard: 'Dashboard',
  home: 'Home',
  portfolio: 'Portfolio',
  'portfolio-manager': 'Portfolio Manager',
  'valuation-workbench': 'Valuation Workbench',
  'portfolio-management': 'Portfolio Management',
  'financial-model-workspace': 'Workspace',
  'private-analysis': 'Private Analysis',
  'scenario-analysis-sensitivity-tools': 'Scenario Analysis',
  'real-time-market-data-center': 'Market Data',
  'model-lab': 'Model Lab',
  canvas: 'Canvas',
  reports: 'Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  help: 'Help',
  search: 'Search',
  users: 'Users',
  performance: 'Performance',
  allocation: 'Allocation',
  valuation: 'Valuation',
  analysis: 'Analysis'
};

/**
 * Individual Breadcrumb Item Component
 */
export const BreadcrumbItem = ({
  href,
  label,
  icon,
  isLast = false,
  isActive = false,
  onClick,
  className = '',
  ...props
}) => {
  const IconComponent = pageIcons[icon] || FileText;

  const itemContent = (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
        'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive && 'bg-primary/10 text-primary font-medium',
        !isLast && 'cursor-pointer',
        isLast && 'text-foreground font-medium cursor-default',
        className
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn(
            'w-4 h-4 flex-shrink-0',
            isActive ? 'text-primary' : 'text-foreground-secondary'
          )}
        />
      )}
      <span className="truncate max-w-32" title={label}>
        {label}
      </span>
    </div>
  );

  if (isLast || !href) {
    return itemContent;
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex-shrink-0"
      aria-label={`Navigate to ${label}`}
      {...props}
    >
      {itemContent}
    </Link>
  );
};

/**
 * Breadcrumb Separator Component
 */
export const BreadcrumbSeparator = ({ className = '', ...props }) => (
  <div
    className={cn('flex items-center justify-center w-6 h-6 text-foreground-secondary', className)}
    {...props}
  >
    <ChevronRight className="w-4 h-4" />
  </div>
);

/**
 * Collapsed Breadcrumb Items Component
 */
export const BreadcrumbCollapsed = ({ items = [], onExpand, className = '', ...props }) => (
  <button
    onClick={onExpand}
    className={cn(
      'flex items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200',
      'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'cursor-pointer',
      className
    )}
    aria-label={`Show ${items.length} more navigation items`}
    {...props}
  >
    <MoreHorizontal className="w-4 h-4 text-foreground-secondary" />
  </button>
);

/**
 * Enhanced Main Breadcrumb Component
 */
const Breadcrumb = ({
  items,
  maxItems = 5,
  showHome = true,
  homeHref = '/',
  className,
  ...props
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  // Add home item if requested and not already present
  const itemsWithHome =
    showHome && breadcrumbItems.length > 0 && breadcrumbItems[0]?.path !== homeHref
      ? [{ path: homeHref, label: 'Home', icon: Home }, ...breadcrumbItems]
      : breadcrumbItems;

  // Handle collapsing for long breadcrumb trails
  const shouldCollapse = itemsWithHome.length > maxItems;
  const visibleItems = shouldCollapse
    ? [
        itemsWithHome[0],
        { collapsed: true, items: itemsWithHome.slice(1, -2) },
        ...itemsWithHome.slice(-2)
      ]
    : itemsWithHome;

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center flex-wrap gap-1', className)}
      {...props}
    >
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        if (item.collapsed) {
          return (
            <React.Fragment key="collapsed">
              <BreadcrumbCollapsed items={item.items} />
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={item.path || item.label || index}>
            <BreadcrumbItem
              href={item.path}
              label={breadcrumbLabels[item.label] || item.label}
              icon={item.icon}
              isLast={isLast}
              isActive={isLast}
            />
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Auto-generate breadcrumbs from URL path
const generateBreadcrumbsFromPath = pathname => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', path: '/', icon: Home }];

  // Map common paths to user-friendly labels
  const pathLabels = {
    'financial-model-workspace': 'Workspace',
    'portfolio-management': 'Portfolio',
    'private-analysis': 'Private Analysis',
    'scenario-analysis-sensitivity-tools': 'Scenario Analysis',
    'real-time-market-data-center': 'Market Data',
    'valuation-workbench': 'Valuation Workbench',
    'model-lab': 'Model Lab',
    canvas: 'Canvas'
  };

  let currentPath = '';
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`;
    const label =
      pathLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    breadcrumbs.push({
      label,
      path: currentPath
    });
  });

  return breadcrumbs;
};

/**
 * Compact Breadcrumb for Mobile
 */
export const BreadcrumbCompact = ({
  items = [],
  currentLabel,
  onBack,
  className = '',
  ...props
}) => {
  const breadcrumbItems = items || generateBreadcrumbsFromPath(window.location.pathname);
  const IconComponent = pageIcons[breadcrumbItems[breadcrumbItems.length - 1]?.icon] || FileText;

  return (
    <div
      className={cn('flex items-center gap-3 px-4 py-3 bg-card border-b border-border', className)}
      {...props}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-background-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {IconComponent && <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {currentLabel || breadcrumbItems[breadcrumbItems.length - 1]?.label}
          </h1>
          {breadcrumbItems.length > 1 && (
            <p className="text-sm text-foreground-secondary truncate">
              {breadcrumbItems
                .slice(0, -1)
                .map(item => breadcrumbLabels[item.label] || item.label)
                .join(' / ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Breadcrumb with Search Integration
 */
export const BreadcrumbWithSearch = ({
  items,
  onSearch,
  searchPlaceholder = 'Search...',
  className = '',
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 py-4 px-6 bg-card border-b border-border',
      className
    )}
    {...props}
  >
    <Breadcrumb items={items} maxItems={4} />

    {onSearch && (
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={e => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     text-foreground placeholder:text-foreground-secondary"
        />
      </div>
    )}
  </div>
);

/**
 * Breadcrumb with Actions
 */
export const BreadcrumbWithActions = ({ items, actions = [], className = '', ...props }) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 py-4 px-6 bg-card border-b border-border',
      className
    )}
    {...props}
  >
    <Breadcrumb items={items} maxItems={4} />

    {actions.length > 0 && (
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="px-3 py-2 text-sm font-medium text-foreground-secondary
                       hover:text-foreground hover:bg-background-secondary
                       rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            title={action.label}
          >
            {action.icon && <action.icon className="w-4 h-4" />}
            {action.label && <span className="ml-2">{action.label}</span>}
          </button>
        ))}
      </div>
    )}
  </div>
);

/**
 * Navigation Context Provider
 * Provides breadcrumb state management across the application
 */
export const NavigationContext = React.createContext({
  breadcrumbs: [],
  setBreadcrumbs: () => {},
  addBreadcrumb: () => {},
  clearBreadcrumbs: () => {}
});

export const NavigationProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = React.useState([]);

  const addBreadcrumb = React.useCallback(item => {
    setBreadcrumbs(prev => {
      // Avoid duplicates
      const exists = prev.some(b => b.path === item.path);
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

  const clearBreadcrumbs = React.useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const value = React.useMemo(
    () => ({
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      clearBreadcrumbs
    }),
    [breadcrumbs, addBreadcrumb, clearBreadcrumbs]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

/**
 * Hook for using navigation context
 */
export const useNavigation = () => {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

/**
 * Hook for managing page breadcrumbs
 */
export const useBreadcrumbs = (pageConfig = {}) => {
  const { setBreadcrumbs, addBreadcrumb } = useNavigation();

  React.useEffect(() => {
    if (pageConfig.items) {
      setBreadcrumbs(pageConfig.items);
    } else if (pageConfig.item) {
      addBreadcrumb(pageConfig.item);
    }
  }, [pageConfig, setBreadcrumbs, addBreadcrumb]);

  return { setBreadcrumbs, addBreadcrumb };
};

/**
 * Page Breadcrumb Wrapper
 * Automatically manages breadcrumbs for a page
 */
export const PageWithBreadcrumbs = ({
  children,
  title,
  icon,
  breadcrumbs: customBreadcrumbs,
  showSearch = false,
  searchPlaceholder,
  onSearch,
  actions = [],
  ...props
}) => {
  // Generate breadcrumbs from current location if not provided
  const breadcrumbs =
    customBreadcrumbs ||
    React.useMemo(() => {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      return pathSegments.map((segment, index) => ({
        path: '/' + pathSegments.slice(0, index + 1).join('/'),
        label: segment,
        icon: index === 0 ? 'dashboard' : segment
      }));
    }, []);

  const currentItem = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Breadcrumb */}
      <div className="hidden md:block">
        {showSearch ? (
          <BreadcrumbWithSearch
            items={breadcrumbs}
            searchPlaceholder={searchPlaceholder}
            onSearch={onSearch}
          />
        ) : actions.length > 0 ? (
          <BreadcrumbWithActions items={breadcrumbs} actions={actions} />
        ) : (
          <div className="px-6 py-4 bg-card border-b border-border">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
      </div>

      {/* Mobile Breadcrumb */}
      <div className="md:hidden">
        <BreadcrumbCompact
          items={breadcrumbs}
          currentLabel={title || currentItem?.label}
          onBack={() => window.history.back()}
        />
      </div>

      <main className="flex-1" {...props}>
        {children}
      </main>
    </div>
  );
};

export default Breadcrumb;
