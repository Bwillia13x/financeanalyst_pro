import React, { Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import MobileLayout from './components/Mobile/MobileLayout';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { KeyboardShortcutsProvider } from './components/ui/KeyboardShortcutsProvider';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useTheme } from './components/ui/ThemeProvider';
import { useAuth } from './contexts/AuthContext';
import { useAccessibility } from './hooks/useAccessibility';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import Routes from './Routes';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import { initializePerformanceTracking } from './utils/performanceTracker';
import ShortcutsHelp from './components/ui/ShortcutsHelp';
import WhatsNew from './components/ui/WhatsNew';
import PersistentCLI from './components/CLI/PersistentCLI';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // local UI state
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [whatsNewForceOpen, setWhatsNewForceOpen] = React.useState(false);
  const [isCliOpen, setIsCliOpen] = React.useState(true);
  const isMac = React.useMemo(
    () => (typeof navigator !== 'undefined' ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || '') : true),
    []
  );
  // Initialize performance monitoring and tracking
  React.useEffect(() => {
    initializePerformanceMonitoring();
    initializePerformanceTracking();
  }, []);

  // Global Shortcut: Shift+/? toggles shortcuts help
  React.useEffect(() => {
    const handler = (e) => {
      const key = e.key || e.keyCode;
      if ((key === '?' || key === '/') && (e.shiftKey || e.key === '?')) {
        // Avoid typing in inputs
        const tag = (e.target?.tagName || '').toLowerCase();
        if (['input', 'textarea'].includes(tag) || e.target?.isContentEditable) return;
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Listen for global UI events from header/buttons
  React.useEffect(() => {
    const openShortcuts = () => setShortcutsOpen(true);
    const openWhatsNew = () => setWhatsNewForceOpen(true);
    window.addEventListener('open-shortcuts-help', openShortcuts);
    window.addEventListener('open-whats-new', openWhatsNew);
    return () => {
      window.removeEventListener('open-shortcuts-help', openShortcuts);
      window.removeEventListener('open-whats-new', openWhatsNew);
    };
  }, []);

  // Dev-only shortcut: Alt+D opens DevNav (/__dev/nav)
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e) => {
      // Avoid text inputs/typing contexts
      const tag = (e.target?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return;
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        navigate('/__dev/nav');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Global shortcut: Ctrl/⌘ + ` toggles CLI
  React.useEffect(() => {
    const handler = (e) => {
      const key = e.key || '';
      if ((e.ctrlKey || e.metaKey) && key === '`') {
        // avoid when typing
        const tag = (e.target?.tagName || '').toLowerCase();
        if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return;
        e.preventDefault();
        window.dispatchEvent(new Event('toggle-cli'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Initialize CLI open state from storage and preferences
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('fa_cli_state');
      if (raw) {
        const state = JSON.parse(raw);
        setIsCliOpen(state.isExpanded ?? true);
      } else {
        setIsCliOpen(true);
      }
      const prefsRaw = localStorage.getItem('financeanalyst_user_preferences');
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        if (prefs.alwaysShowCLI === true) setIsCliOpen(true);
      }
    } catch {}
  }, []);

  // Event-based control of CLI visibility
  React.useEffect(() => {
    const toggle = () => setIsCliOpen(v => {
      const next = !v;
      try {
        const raw = localStorage.getItem('fa_cli_state');
        const state = raw ? JSON.parse(raw) : {};
        state.isExpanded = next;
        state.lastUpdated = new Date().toISOString();
        localStorage.setItem('fa_cli_state', JSON.stringify(state));
      } catch {}
      return next;
    });
    const show = () => setIsCliOpen(v => (v ? v : (persistExpanded(true), true)));
    const hide = () => setIsCliOpen(v => (v ? (persistExpanded(false), false) : v));

    function persistExpanded(value) {
      try {
        const raw = localStorage.getItem('fa_cli_state');
        const state = raw ? JSON.parse(raw) : {};
        state.isExpanded = value;
        state.lastUpdated = new Date().toISOString();
        localStorage.setItem('fa_cli_state', JSON.stringify(state));
      } catch {}
    }

    window.addEventListener('toggle-cli', toggle);
    window.addEventListener('show-cli', show);
    window.addEventListener('hide-cli', hide);
    return () => {
      window.removeEventListener('toggle-cli', toggle);
      window.removeEventListener('show-cli', show);
      window.removeEventListener('hide-cli', hide);
    };
  }, []);

  // Respect Always Show CLI on route change
  React.useEffect(() => {
    try {
      const prefsRaw = localStorage.getItem('financeanalyst_user_preferences');
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        if (prefs.alwaysShowCLI === true) setIsCliOpen(true);
      }
    } catch {}
  }, [location.pathname]);

  return (
    <KeyboardShortcutsProvider>
      <div className="app" data-testid="app">
        {/* One-time What's New modal */}
        <WhatsNew forceOpen={whatsNewForceOpen} />
        {/* Keyboard Shortcuts Help */}
        <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} isMac={isMac} />
        <Routes />
        <PersistentCLI
          isExpanded={isCliOpen}
          onToggle={() => window.dispatchEvent(new Event('toggle-cli'))}
          currentContext={{ page: location.pathname }}
          onNavigate={(path) => navigate(path)}
        />
      </div>
    </KeyboardShortcutsProvider>
  );
}

export default App;
