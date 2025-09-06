import React, { useEffect, useMemo, useState } from 'react';

import { Wifi, RefreshCw } from 'lucide-react';
import secureApiClient from 'src/services/secureApiClient';

const statusColor = (status) => {
  switch (status) {
    case 'available':
    case 'healthy':
      return 'text-green-600';
    case 'not_configured':
      return 'text-amber-600';
    case 'error':
    case 'degraded':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
};

const pretty = (id) => id.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const DataStatusMenu = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use backend health services endpoint
      const res = await secureApiClient.get('/health/services');
      setData(res.data);
    } catch (e) {
      setError('Failed to load data status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchStatus();
    const id = setInterval(fetchStatus, 60000);
    return () => clearInterval(id);
  }, [open]);

  const serviceEntries = useMemo(() => {
    if (!data?.data?.services) return [];
    return Object.entries(data.data.services);
  }, [data]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Data Status"
        aria-expanded={open}
        title="Data Status"
      >
        <Wifi size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-elevation-2 z-[1200]">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium">Data Status</div>
            <button
              onClick={fetchStatus}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="p-3 space-y-2 max-h-80 overflow-auto">
            {error && <div className="text-xs text-red-600">{error}</div>}
            {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
            {!loading && !error && serviceEntries.length === 0 && (
              <div className="text-xs text-muted-foreground">No provider data.</div>
            )}
            {!loading && serviceEntries.map(([service, info]) => (
              <div key={service} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusColor(info.status).replace('text-', 'bg-')}`}></span>
                  <span className="text-foreground">{pretty(service)}</span>
                </div>
                <div className={`text-xs ${statusColor(info.status)}`}>{info.status}</div>
              </div>
            ))}
            {data?.data?.timestamp && (
              <div className="pt-2 mt-1 border-t border-border text-[11px] text-muted-foreground">
                Last checked: {new Date(data.data.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataStatusMenu;

