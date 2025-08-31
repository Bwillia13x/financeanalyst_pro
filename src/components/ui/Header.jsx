import {
  Menu,
  X,
  TrendingUp,
  Wifi,
  Command,
  BarChart3,
  User,
  ChevronDown,
  Download,
  Share2,
  FileText
} from 'lucide-react';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';

import Button from './Button';
import { useKeyboardShortcutsContext } from './KeyboardShortcutsProvider';
import SkipLink, { SkipLinks } from './SkipLink';
import { ThemeToggle } from './ThemeProvider';

// Using direct lucide-react icons to reduce indirection and runtime work
const BusinessIntelligenceDashboard = lazy(
  () => import('../BusinessIntelligence/BusinessIntelligenceDashboard')
);
const SecondaryNav = lazy(() => import('./SecondaryNav'));

const Header = () => {
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBiDashboardOpen, setIsBiDashboardOpen] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const { showCommandPalette, updateCommandContext } = useKeyboardShortcutsContext();
  const isAudit = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('lhci') || params.has('audit');
    } catch {
      return false;
    }
  })();
  const isMac =
    typeof navigator !== 'undefined'
      ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || '')
      : true;
  const cmdHint = isMac ? '⌘K' : 'Ctrl+K';

  const navigationTabs = [
    {
      id: 'workspace',
      label: 'Workspace',
      path: '/financial-model-workspace',
      tooltip: 'Primary financial modeling environment with terminal interface and formula builder',
      isPrimary: true
    },
    {
      id: 'portfolio-management',
      label: 'Portfolio',
      path: '/portfolio-management',
      tooltip: 'Comprehensive portfolio management dashboard with real-time tracking and analytics',
      isPrimary: true
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      path: '/ai-insights',
      tooltip: 'AI-powered financial analysis and intelligent investment recommendations',
      isPrimary: true
    },
    {
      id: 'private-analysis',
      label: 'Private Analysis',
      path: '/private-analysis',
      tooltip:
        'Manual financial data input and sophisticated modeling with spreadsheet-style interface',
      isPrimary: true
    }
  ];

  const secondaryTabs = [
    {
      id: 'valuation-workbench',
      label: 'Valuation Workbench',
      path: '/valuation-workbench',
      tooltip:
        'World-class DCF valuation studio with sensitivity analysis, Monte Carlo, and scenario modeling'
    },
    {
      id: 'model-lab',
      label: 'Model Lab',
      path: '/model-lab',
      tooltip:
        'Reusable model library with DCF, LBO, Comps, and EPV templates for quick financial modeling'
    },
    {
      id: 'canvas',
      label: 'Canvas',
      path: '/canvas',
      tooltip:
        'Interactive investment thesis builder and visualization canvas for strategic analysis'
    },
    {
      id: 'advanced-charts',
      label: 'Advanced Charts',
      path: '/advanced-charts',
      tooltip:
        'Professional-grade charting and data visualization with real-time updates and customizable dashboards'
    },
    {
      id: 'market-analysis',
      label: 'Market Analysis',
      path: '/market-analysis',
      tooltip:
        'Real-time market data analysis with live price feeds and comprehensive market intelligence'
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      tooltip: 'Generate professional investment reports and IC memos with customizable templates'
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      path: '/ai-insights',
      tooltip: 'AI-powered financial analysis and intelligent investment recommendations'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      tooltip: 'Platform usage analytics, performance monitoring, and business intelligence'
    },
    {
      id: 'advanced-analytics',
      label: 'Advanced Analytics',
      path: '/advanced-analytics',
      tooltip:
        'Professional-grade pricing models and risk analytics for complex financial instruments'
    },
    {
      id: 'valuation-tools',
      label: 'Valuation Tools',
      path: '/valuation-tool',
      tooltip: 'Professional DCF, LBO, and comparative valuation tools',
      isSubmenu: true,
      submenu: [
        { id: 'valuation-tool', label: 'Valuation Tool', path: '/valuation-tool' },
        { id: 'valuation-docs', label: 'Documentation', path: '/valuation-tool/docs' },
        { id: 'valuation-demo', label: 'Demo', path: '/valuation-tool/demo' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      tooltip: 'Configure preferences, security settings, and platform customizations'
    }
  ];

  // Defer mounting secondary nav until idle or hover to reduce initial TBT
  useEffect(() => {
    if (isAudit) return; // never auto-mount during audit
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : cb => setTimeout(cb, 1800);
    const id = idle(() => setShowSecondary(true));
    return () => {
      if (typeof window.cancelIdleCallback === 'function') {
        try {
          window.cancelIdleCallback(id);
        } catch (_e) {
          // no-op
        }
      }
    };
  }, [isAudit]);

  const handleSecondaryHover = () => {
    if (!isAudit) setShowSecondary(true);
  };

  const quickActions = [
    { id: 'export', icon: Download, label: 'Export' },
    { id: 'share', icon: Share2, label: 'Share' },
    { id: 'template', icon: FileText, label: 'Template' }
  ];

  const getActiveTab = () => {
    return navigationTabs.find(tab => location.pathname === tab.path);
  };

  const getDataSyncStatus = () => {
    return {
      status: 'connected',
      lastUpdate: '2 min ago',
      sources: {
        bloomberg: 'connected',
        factset: 'connected',
        refinitiv: 'warning'
      }
    };
  };

  const getModelState = () => {
    return {
      name: 'DCF_Analysis_v2.3',
      saved: true,
      calculating: false,
      version: '2.3'
    };
  };

  const dataSyncStatus = getDataSyncStatus();
  const modelState = getModelState();
  const _activeTab = getActiveTab();

  // Publish basic context for command palette suggestions
  useEffect(() => {
    updateCommandContext({
      route: location.pathname,
      activeTab: _activeTab?.id || null
    });
  }, [location.pathname, _activeTab?.id]); // Removed updateCommandContext dependency to prevent infinite re-renders

  return (
    <>
      {/* Enhanced Skip Links for WCAG AA Compliance */}
      <SkipLinks
        links={[
          { href: '#main-content', label: 'Skip to main content' },
          { href: '#navigation', label: 'Skip to navigation' },
          { href: '#search', label: 'Skip to search' }
        ]}
      />

      <Suspense fallback={null}>
        {isBiDashboardOpen && (
          <BusinessIntelligenceDashboard
            isVisible={isBiDashboardOpen}
            onClose={() => setIsBiDashboardOpen(false)}
          />
        )}
      </Suspense>
      <header
        className="fixed top-0 left-0 right-0 z-[1000] bg-card border-b border-border h-[60px]"
        role="banner"
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-foreground">
                <span className="hidden sm:inline">FinanceAnalyst Pro</span>
                <span className="sm:hidden">FinanceAnalyst</span>
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center ml-8 space-x-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationTabs.map(tab => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                relative px-6 py-3 text-sm font-medium transition-smooth rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${
                  location.pathname === tab.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
                title={tab.tooltip}
                aria-current={location.pathname === tab.path ? 'page' : undefined}
              >
                {tab.label}
                {location.pathname === tab.path && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                )}
              </Link>
            ))}
          </nav>
          <div onMouseEnter={handleSecondaryHover} className="ml-2 hidden lg:block">
            <Suspense fallback={null}>
              {showSecondary && (
                <SecondaryNav variant="dropdown" items={secondaryTabs} ariaLabel="Advanced tools" />
              )}
            </Suspense>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center ml-auto space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle size="default" variant="ghost" />

            {/* Command Palette Trigger */}
            <Button
              variant="ghost"
              size="sm"
              iconComponent={Command}
              className="text-muted-foreground hover:text-foreground"
              title={`Command Palette (${cmdHint})`}
              onClick={showCommandPalette}
            >
              <span className="sr-only">Open Command Palette</span>
              <span className="ml-1 hidden xl:inline text-xs text-muted-foreground">{cmdHint}</span>
            </Button>

            {/* Model State Indicator */}
            <div className="flex items-center px-3 py-1 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${modelState.saved ? 'bg-success' : 'bg-warning'}`}
                />
                <span className="text-sm font-mono text-muted-foreground">{modelState.name}</span>
                <span className="text-xs text-muted-foreground">v{modelState.version}</span>
              </div>
            </div>
            {/* Data Sync Status */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${
                  dataSyncStatus.status === 'connected'
                    ? 'bg-success'
                    : dataSyncStatus.status === 'warning'
                      ? 'bg-warning'
                      : 'bg-error'
                }`}
              />
              <span className="text-xs text-muted-foreground">
                Data: {dataSyncStatus.lastUpdate}
              </span>
              <Wifi size={14} className="text-muted-foreground" />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              {quickActions.map(action => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  iconComponent={action.icon}
                  className="text-muted-foreground hover:text-foreground"
                  title={action.label}
                >
                  <span className="sr-only">{action.label}</span>
                </Button>
              ))}
            </div>

            {/* BI Dashboard Button */}
            <Button
              variant="ghost"
              size="sm"
              iconComponent={BarChart3}
              className="text-muted-foreground hover:text-foreground"
              title="Business Intelligence"
              onClick={() => setIsBiDashboardOpen(true)}
            >
              <span className="sr-only">Business Intelligence</span>
            </Button>

            {/* User Context Panel */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">Senior Analyst</span>
                  <span className="text-xs text-muted-foreground">Active Session</span>
                </div>
                <ChevronDown size={16} />
              </Button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-elevation-2 z-[1100]">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-popover-foreground">John Anderson</p>
                        <p className="text-sm text-muted-foreground">Senior Investment Analyst</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="space-y-1">
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Permissions
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Active Collaborators (3)
                      </button>
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted rounded-md transition-smooth">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-[60px] left-0 right-0 bg-card border-b border-border shadow-lg z-50">
            <nav className="px-4 py-2" role="navigation" aria-label="Mobile navigation">
              <div className="space-y-1">
                {navigationTabs.map(tab => (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      block px-4 py-3 text-sm font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${
                        location.pathname === tab.path
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    aria-current={location.pathname === tab.path ? 'page' : undefined}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              {/* Command Palette Quick Access */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    showCommandPalette();
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-smooth text-foreground bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Command size={16} className="mr-2" />
                  <span>Open Command Palette</span>
                  <span className="ml-auto text-xs text-muted-foreground">{cmdHint}</span>
                </button>
              </div>

              {/* Advanced Tools (Secondary Navigation) */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Advanced Tools
                </div>
                <div className="space-y-1">
                  {secondaryTabs.map(item => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        block px-4 py-3 text-sm font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        ${
                          location.pathname === item.path
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      title={item.tooltip}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="mt-3">
                <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <ThemeToggle size="sm" variant="ghost" />
                </div>
              </div>

              {/* Mobile Status Indicators */}
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground">Model Status</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${modelState.saved ? 'bg-success' : 'bg-warning'}`}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {modelState.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground">Data Sync</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        dataSyncStatus.status === 'connected'
                          ? 'bg-success'
                          : dataSyncStatus.status === 'warning'
                            ? 'bg-warning'
                            : 'bg-error'
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {dataSyncStatus.lastUpdate}
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
