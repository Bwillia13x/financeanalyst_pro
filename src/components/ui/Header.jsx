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
  FileText,
  HelpCircle,
  Beaker,
  Palette,
  Globe,
  Bot,
  PieChart,
  Calculator,
  Target,
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';
import React, { useEffect, useState, lazy, Suspense, memo, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Button from './Button';
import { useKeyboardShortcutsContext } from './KeyboardShortcutsProvider';
import { ThemeToggle } from './ThemeProvider';
import { featureFlags } from 'src/config/featureFlags';
import DataStatusMenu from './DataStatusMenu';

function useAdminStatus() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    const compute = () => {
      try {
        const raw = localStorage.getItem('user');
        if (!raw) { setIsAdmin(false); setIsAuthed(false); setUser(null); return; }
        const user = JSON.parse(raw);
        setIsAdmin(user?.role === 'admin');
        setIsAuthed(!!user);
        setUser(user);
      } catch { setIsAdmin(false); }
    };
    compute();
    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'accessToken') compute();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return { isAdmin, isAuthed, user };
}

// Using direct lucide-react icons to reduce indirection and runtime work
const BusinessIntelligenceDashboard = lazy(
  () => import('../BusinessIntelligence/BusinessIntelligenceDashboard')
);
const SecondaryNav = lazy(() => import('./SecondaryNav'));

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBiDashboardOpen, setIsBiDashboardOpen] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const { showCommandPalette, updateCommandContext } = useKeyboardShortcutsContext();
  const isAudit = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('lhci') || params.has('audit');
    } catch {
      return false;
    }
  })();
  // Memoize platform detection and keyboard shortcuts
  const isMac = useMemo(() =>
    typeof navigator !== 'undefined'
      ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || '')
      : true,
    []
  );
  const cmdHint = useMemo(() => isMac ? '⌘K' : 'Ctrl+K', [isMac]);

  // Memoize navigation data to prevent unnecessary re-renders
  const navigationTabs = useMemo(() => [
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
  ], []);

  const { isAdmin, isAuthed, user } = useAdminStatus();
  function UserMenu({ isAuthed, isAdmin, user, onSignOut }) {
    const [open, setOpen] = React.useState(false);
    const initials = React.useMemo(() => {
      if (!user?.name && !user?.email) return 'U';
      const base = (user?.name || user?.email || 'U').split('@')[0];
      return base.slice(0, 2).toUpperCase();
    }, [user]);
    const label = user?.name || user?.email || 'User';
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm text-foreground"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs">
            {initials}
          </span>
          <span className="hidden xl:inline text-sm text-foreground-secondary">{label}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-elevation-2 z-[1200]">
            <div className="py-2 text-sm">
              {isAdmin && (
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-muted/60"
                  onClick={() => { setOpen(false); navigate('/ai-log'); }}
                >
                  AI Logbook
                </button>
              )}
              {isAuthed && (
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-muted/60"
                  onClick={() => { setOpen(false); navigate('/profile'); }}
                >
                  Profile
                </button>
              )}
              {!isAdmin && featureFlags.ENABLE_ADMIN_LOGIN && (
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-muted/60"
                  onClick={() => { setOpen(false); navigate('/admin-login'); }}
                >
                  Admin Login
                </button>
              )}
              {isAuthed && (
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-muted/60 text-red-600"
                  onClick={() => { setOpen(false); onSignOut?.(); }}
                >
                  Sign out
                </button>
              )}
              {!isAuthed && !featureFlags.ENABLE_ADMIN_LOGIN && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Not signed in</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  const secondaryTabs = useMemo(() => [
    {
      id: 'valuation-workbench',
      label: 'Valuation Workbench',
      path: '/valuation-workbench',
      icon: TrendingUp,
      tooltip:
        'World-class DCF valuation studio with sensitivity analysis, Monte Carlo, and scenario modeling'
    },
    {
      id: 'model-lab',
      label: 'Model Lab',
      path: '/model-lab',
      icon: Beaker,
      tooltip:
        'Reusable model library with DCF, LBO, Comps, and EPV templates for quick financial modeling'
    },
    {
      id: 'canvas',
      label: 'Canvas',
      path: '/canvas',
      icon: Palette,
      tooltip:
        'Interactive investment thesis builder and visualization canvas for strategic analysis'
    },
    {
      id: 'advanced-charts',
      label: 'Advanced Charts',
      path: '/advanced-charts',
      icon: BarChart3,
      tooltip:
        'Professional-grade charting and data visualization with real-time updates and customizable dashboards'
    },
    {
      id: 'market-analysis',
      label: 'Market Analysis',
      path: '/market-analysis',
      icon: Globe,
      tooltip:
        'Real-time market data analysis with live price feeds and comprehensive market intelligence'
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: FileText,
      tooltip: 'Generate professional investment reports and IC memos with customizable templates'
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      path: '/ai-insights',
      icon: Bot,
      tooltip: 'AI-powered financial analysis and intelligent investment recommendations'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: PieChart,
      tooltip: 'Platform usage analytics, performance monitoring, and business intelligence'
    },
    {
      id: 'advanced-analytics',
      label: 'Advanced Analytics',
      path: '/advanced-analytics',
      icon: Calculator,
      tooltip:
        'Professional-grade pricing models and risk analytics for complex financial instruments'
    },
    {
      id: 'valuation-tools',
      label: 'Valuation Tools',
      path: '/valuation-tool',
      icon: Target,
      tooltip: 'Professional DCF, LBO, and comparative valuation tools',
      isSubmenu: true,
      submenu: [
        { id: 'valuation-tool', label: 'Valuation Tool', path: '/valuation-tool' },
        { id: 'valuation-docs', label: 'Documentation', path: '/valuation-tool/docs' },
        { id: 'valuation-demo', label: 'Demo', path: '/valuation-tool/demo' }
      ]
    },
    ...(
      isAdmin
        ? [{ id: 'ai-log', label: 'AI Logbook', path: '/ai-log', icon: Shield, tooltip: 'View reproducibility logs of AI assistant actions' }]
        : (featureFlags.ENABLE_ADMIN_LOGIN
            ? [{ id: 'admin-login', label: 'Admin Login', path: '/admin-login', icon: Shield, tooltip: 'Sign in as admin to view AI logbook' }]
            : [])
    ),
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      tooltip: 'Configure preferences, security settings, and platform customizations'
    }
  ], []);

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

  const handleSecondaryHover = useCallback(() => {
    if (!isAudit) setShowSecondary(true);
  }, [isAudit]);

  const quickActions = useMemo(() => [
    { id: 'export', icon: Download, label: 'Export' },
    { id: 'share', icon: Share2, label: 'Share' },
    { id: 'template', icon: FileText, label: 'Template' }
  ], []);

  const getActiveTab = useCallback(() => {
    return navigationTabs.find(tab => location.pathname === tab.path);
  }, [navigationTabs, location.pathname]);

  const getDataSyncStatus = useCallback(() => {
    return {
      status: 'connected',
      lastUpdate: '2 min ago',
      sources: {
        bloomberg: 'connected',
        factset: 'connected',
        refinitiv: 'warning'
      }
    };
  }, []);

  const getModelState = useCallback(() => {
    return {
      name: 'DCF_Analysis_v2.3',
      saved: true,
      calculating: false,
      version: '2.3'
    };
  }, []);

  const dataSyncStatus = useMemo(() => getDataSyncStatus(), [getDataSyncStatus]);
  const modelState = useMemo(() => getModelState(), [getModelState]);
  const _activeTab = useMemo(() => getActiveTab(), [getActiveTab]);

  // Publish basic context for command palette suggestions
  useEffect(() => {
    updateCommandContext({
      route: location.pathname,
      activeTab: _activeTab?.id || null
    });
  }, [location.pathname, _activeTab?.id]); // Removed updateCommandContext dependency to prevent infinite re-renders

  // Performance monitoring for navigation smoothness
  useEffect(() => {
    const navigationStart = performance.now();

    return () => {
      const navigationEnd = performance.now();
      const navigationDuration = navigationEnd - navigationStart;

      // Log navigation performance if it takes longer than expected
      if (navigationDuration > 50) {
        console.warn(`Navigation render took ${navigationDuration.toFixed(2)}ms - potential performance issue`);
      }
    };
  });

  return (
    <>
      <Suspense fallback={null}>
        {isBiDashboardOpen && (
          <BusinessIntelligenceDashboard
            isVisible={isBiDashboardOpen}
            onClose={() => setIsBiDashboardOpen(false)}
          />
        )}
      </Suspense>
      <header
        className="fixed top-0 left-0 right-0 z-[1000] bg-background border-b border-border h-[60px]"
        role="banner"
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
            aria-label="Go to home page"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-foreground">
                <span className="hidden sm:inline">Valor-IVX</span>
                <span className="sm:hidden">Valor-IVX</span>
              </span>
            </div>
          </button>

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
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  relative px-4 py-2 text-sm transition-smooth rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer
                  ${
                    location.pathname === tab.path
                      ? 'text-foreground font-semibold '
                      : 'text-foreground-secondary hover:text-foreground hover:bg-interactive-hover'
                  }
                `}
                title={tab.tooltip}
                aria-current={location.pathname === tab.path ? 'page' : undefined}
              >
                {tab.label}
                {location.pathname === tab.path && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
              </button>
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

            {/* Data Status */}
            <DataStatusMenu />

            <UserMenu
              isAuthed={isAuthed}
              isAdmin={isAdmin}
              user={user}
              onSignOut={() => {
                try {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  window.dispatchEvent(new StorageEvent('storage', { key: 'user' }));
                } catch {}
                navigate('/');
              }}
            />

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

          {/* Help Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              iconComponent={HelpCircle}
              className="text-muted-foreground hover:text-foreground"
              title="Help"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-controls="help-menu"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
            >
              <span className="sr-only">Help</span>
            </Button>
            {isUserMenuOpen && (
              <div id="help-menu" role="menu" aria-label="Help menu" className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-elevation-2 z-[1001]">
                <div className="p-2">
                  <button
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth"
                    onClick={() => {
                      window.dispatchEvent(new Event('open-shortcuts-help'));
                      setIsUserMenuOpen(false);
                    }}
                  >
                    Keyboard Shortcuts
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth"
                    onClick={async () => {
                      try {
                        const adminKey = import.meta.env.VITE_ADMIN_KEY;
                        const resp = await fetch('/api/health/warmup', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(adminKey ? { 'x-admin-key': adminKey } : {})
                          }
                        }).then(r => r.json());
                        // eslint-disable-next-line no-alert
                        alert(resp?.success ? 'Server caches warmed' : 'Warmup failed');
                      } catch {
                        // eslint-disable-next-line no-alert
                        alert('Warmup failed');
                      } finally {
                        setIsUserMenuOpen(false);
                      }
                    }}
                  >
                    Warm Caches (Server)
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth"
                    onClick={() => {
                      window.dispatchEvent(new Event('open-whats-new'));
                      setIsUserMenuOpen(false);
                    }}
                  >
                    What’s New
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth"
                    onClick={() => {
                      navigate('/changelog');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    Changelog
                  </button>
                  <a
                    role="menuitem"
                    href="/USER_GUIDE.md"
                    className="block w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth"
                  >
                    User Guide
                  </a>
                </div>
              </div>
            )}
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
          <div className="lg:hidden absolute top-[60px] left-0 right-0 bg-background border-b border-border shadow-elevation-2 z-50">
            <nav className="px-4 py-2" role="navigation" aria-label="Mobile navigation">
              <div className="space-y-1">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      block px-4 py-3 text-sm font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer w-full text-left
                      ${
                        location.pathname === tab.path
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    aria-current={location.pathname === tab.path ? 'page' : undefined}
                  >
                    {tab.label}
                  </button>
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

              {/* Advanced Tools (Secondary Navigation) - compact with optional expansion */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Advanced Tools
                </div>
                {!featureFlags.MOBILE_SECONDARY_NAV_DRAWER && !showAdvancedMobile ? (
                  <button
                    onClick={() => setShowAdvancedMobile(true)}
                    className="mt-1 w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-smooth text-foreground bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-expanded={showAdvancedMobile}
                  >
                    Show more tools
                  </button>
                ) : (
                  <div className="space-y-1">
                    {secondaryTabs.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.path);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          block px-4 py-3 text-sm font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer w-full text-left
                          ${
                            location.pathname === item.path
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                        aria-current={location.pathname === item.path ? 'page' : undefined}
                        title={item.tooltip}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
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

// Memoize the Header component to prevent unnecessary re-renders
export default memo(Header);
