import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const isProd = import.meta.env.VITE_APP_ENV === 'production';

export default function MonitoringDebugPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [shouldCrash, setShouldCrash] = useState(false);

  const env = useMemo(() => ({
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    VITE_ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING,
    VITE_PERFORMANCE_MONITORING: import.meta.env.VITE_PERFORMANCE_MONITORING,
    VITE_GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
    VITE_HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ? 'SET' : 'MISSING'
  }), []);

  const addLog = useCallback((msg) => {
    setLogs((l) => [{ ts: new Date().toISOString(), msg }, ...l].slice(0, 50));
  }, []);

  const triggerPageview = useCallback(() => {
    const testPath = `/debug-path-${Date.now()}?from=monitoring-panel`;
    // Dynamically import monitoring to avoid side effects
    import('../utils/monitoring')
      .then((mod) => {
        if (mod?.default?.trackPageView) {
          mod.default.trackPageView(testPath);
          addLog(`Called monitoring.trackPageView('${testPath}')`);
        }
      })
      .catch(() => {
        addLog('Failed to load monitoring service');
      });
  }, [addLog]);

  const navigateAndTrack = useCallback(() => {
    const newPath = `${location.pathname}?pv=${Date.now()}`;
    navigate(newPath, { replace: false });
    addLog(`Navigated to '${newPath}' to test SPA pageview`);
  }, [location.pathname, navigate, addLog]);

  const captureSentry = useCallback(() => {
    try {
      throw new Error(`Sentry test error @ ${new Date().toISOString()}`);
    } catch (e) {
      // Dynamically import monitoring to avoid side effects
      import('../utils/monitoring')
        .then((mod) => {
          if (mod?.default?.trackError) {
            mod.default.trackError(e, 'debug_panel_capture');
            addLog('Sent error via monitoring.trackError(...)');
          }
        })
        .catch(() => {
          addLog('Failed to load monitoring service for error tracking');
        });
    }
  }, [addLog]);

  const crashComponent = useCallback(() => {
    // Cause an error during render so ErrorBoundary can catch it
    addLog('Setting crash flag to render CrashNow component...');
    setShouldCrash(true);
  }, [addLog]);

  const CrashNow = () => {
    throw new Error('ErrorBoundary crash test from MonitoringDebugPanel (render phase)');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {shouldCrash && <CrashNow />}
      <h1 className="text-2xl font-semibold mb-2">Monitoring Debug Panel</h1>
      <p className="text-sm text-neutral-600 mb-4">
        Environment: <span className="font-mono">{env.VITE_APP_ENV}</span>
      </p>

      {isProd && (
        <div className="p-3 mb-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-900">
          This panel is visible in production. Actions are still allowed, but use with caution.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded border bg-white">
          <h2 className="font-medium mb-2">Flags & IDs</h2>
          <ul className="text-sm space-y-1">
            <li>VITE_ENABLE_ANALYTICS: <b>{String(env.VITE_ENABLE_ANALYTICS)}</b></li>
            <li>VITE_ENABLE_ERROR_REPORTING: <b>{String(env.VITE_ENABLE_ERROR_REPORTING)}</b></li>
            <li>VITE_PERFORMANCE_MONITORING: <b>{String(env.VITE_PERFORMANCE_MONITORING)}</b></li>
            <li>GA_TRACKING_ID: <b>{env.VITE_GA_TRACKING_ID || 'MISSING'}</b></li>
            <li>HOTJAR_ID: <b>{env.VITE_HOTJAR_ID || 'MISSING'}</b></li>
            <li>SENTRY_DSN: <b>{env.VITE_SENTRY_DSN}</b></li>
          </ul>
        </div>

        <div className="p-4 rounded border bg-white">
          <h2 className="font-medium mb-2">Actions</h2>
          <div className="flex flex-col gap-2">
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={triggerPageview}>
              Trigger GA/Hotjar pageview (manual)
            </button>
            <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={navigateAndTrack}>
              Navigate (SPA) to trigger route-based pageview
            </button>
            <button className="px-3 py-2 rounded bg-rose-600 text-white" onClick={captureSentry}>
              Capture Sentry error (non-crashing)
            </button>
            <button className="px-3 py-2 rounded bg-red-700 text-white" onClick={crashComponent}>
              Crash component to test ErrorBoundary
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded border bg-white">
        <h2 className="font-medium mb-2">Logs</h2>
        <div className="max-h-64 overflow-auto text-sm font-mono space-y-1">
          {logs.length === 0 ? (
            <div className="text-neutral-500">No logs yet.</div>
          ) : (
            logs.map((l, i) => (
              <div key={i}>
                [{l.ts}] {l.msg}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-neutral-600">
        Tips:
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>Open DevTools Network tab and filter by &quot;collect&quot; to see GA hits.</li>
          <li>Look for WebSocket to <code>wss://*.hotjar.com</code> and requests to <code>in.hotjar.com</code>.</li>
          <li>Confirm Sentry events arrive in your project dashboard.</li>
        </ul>
      </div>
    </div>
  );
}
