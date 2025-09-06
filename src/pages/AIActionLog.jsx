import React, { useEffect, useMemo, useState } from 'react';
import secureApiClient from 'src/services/secureApiClient';

const toCsv = (rows) => {
  if (!rows?.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v) => (v == null ? '' : String(v).replaceAll('"', '""'));
  return [keys.join(','), ...rows.map(r => keys.map(k => `"${esc(r[k])}"`).join(','))].join('\n');
};

const AIActionLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await secureApiClient.get('/ai-assistant/logs');
      setLogs(res.data?.data || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setError('Unauthorized: You do not have permission to view AI logs.');
      } else {
        setError('Failed to load logs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const download = (format) => {
    const name = `ai_action_logs_${Date.now()}.${format}`;
    let content = '';
    let type = 'text/plain';
    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      type = 'application/json';
    } else {
      content = toCsv(logs);
      type = 'text/csv';
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => [
    { key: 'ts', label: 'Timestamp' },
    { key: 'type', label: 'Type' },
    { key: 'message', label: 'Input' },
    { key: 'outputPreview', label: 'Output (preview)' },
  ], []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">AI Action Log</h1>
      <div className="flex gap-2 mb-3">
        <button onClick={fetchLogs} className="px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 text-sm">Refresh</button>
        <button onClick={() => download('json')} className="px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 text-sm">Download JSON</button>
        <button onClick={() => download('csv')} className="px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 text-sm">Download CSV</button>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && (
        <div className="text-sm text-red-600">
          {error}
          {(error?.startsWith('Unauthorized')) && (
            <div className="text-xs text-muted-foreground mt-2">
              In production, this page is restricted to admin users. Please sign in with an admin account.
            </div>
          )}
        </div>
      )}
      {!loading && !error && (
        <div className="overflow-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-foreground">
              <tr>
                {columns.map(c => (
                  <th key={c.key} className="text-left px-3 py-2 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  {columns.map(c => (
                    <td key={c.key} className="px-3 py-2 align-top text-foreground-secondary">
                      {typeof row[c.key] === 'string' ? row[c.key] : JSON.stringify(row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">No log entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AIActionLog;
