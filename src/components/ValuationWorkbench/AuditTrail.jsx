import { useState } from 'react';

import { Card } from 'src/components/ui/UIHelpers.jsx';

// Generate audit log entry
function createAuditEntry(field, oldValue, newValue, timestamp = new Date()) {
  return {
    id: Date.now() + Math.random(),
    timestamp,
    field,
    oldValue,
    newValue,
    change: getChangeDescription(field, oldValue, newValue),
    user: 'Current User' // In production, this would be from auth context
  };
}

// Get human-readable change description
function getChangeDescription(field, oldValue, newValue) {
  const fieldNames = {
    ebitMargin0: 'EBIT Margin Y0',
    ebitMarginT: 'EBIT Margin Terminal',
    taxRate: 'Tax Rate',
    salesToCapital: 'Sales-to-Capital',
    rf: 'Risk-Free Rate',
    erp: 'Equity Risk Premium',
    beta: 'Beta',
    wd: 'Weight of Debt',
    kd: 'Cost of Debt',
    tg: 'Terminal Growth',
    exitEVMultiple: 'Exit Multiple',
    terminalMethod: 'Terminal Method',
    price: 'Current Stock Price',
    shares: 'Shares Outstanding',
    netDebt: 'Net Debt',
    cashAdjust: 'Cash Adjustment'
  };

  const fieldName = fieldNames[field] || field;

  if (typeof oldValue === 'number' && typeof newValue === 'number') {
    const change = newValue - oldValue;
    const changeStr = change >= 0 ? `+${change.toFixed(4)}` : change.toFixed(4);
    return `${fieldName}: ${oldValue.toFixed(4)} → ${newValue.toFixed(4)} (${changeStr})`;
  }

  return `${fieldName}: ${oldValue} → ${newValue}`;
}

// Audit trail hook for tracking assumption changes
export function useAuditTrail(assumptions, setAssumptions) {
  const [auditLog, setAuditLog] = useState([]);
  const [previousAssumptions, setPreviousAssumptions] = useState(assumptions);

  const updateAssumptions = (newAssumptions) => {
    const entries = [];

    // Compare each field and create audit entries for changes
    Object.keys(newAssumptions).forEach(field => {
      const oldValue = previousAssumptions[field];
      const newValue = newAssumptions[field];

      if (oldValue !== newValue && field !== 'timestamp') {
        entries.push(createAuditEntry(field, oldValue, newValue));
      }
    });

    if (entries.length > 0) {
      setAuditLog(prev => [...entries, ...prev]);
    }

    setPreviousAssumptions(newAssumptions);
    setAssumptions(newAssumptions);
  };

  const clearAuditLog = () => setAuditLog([]);

  const exportAuditLog = (format = 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valuation-audit-log-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Field', 'Old Value', 'New Value', 'User'];
      const rows = auditLog.map(entry => [
        entry.timestamp.toISOString(),
        entry.field,
        entry.oldValue,
        entry.newValue,
        entry.user
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valuation-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    auditLog,
    updateAssumptions,
    clearAuditLog,
    exportAuditLog
  };
}

// Audit trail display component
export const AuditTrail = ({ auditLog, onClear, onExport }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!isExpanded) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-left text-[13px] text-slate-600 hover:text-slate-800 transition-colors"
          >
            📋 Audit Trail ({auditLog.length} changes)
          </button>
          {auditLog.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport?.('json')}
                className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
              >
                JSON
              </button>
              <button
                onClick={() => onExport?.('csv')}
                className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
              >
                CSV
              </button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-slate-800">Audit Trail</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-slate-600 hover:text-slate-800"
          >
            {showDetails ? 'Simple' : 'Detailed'}
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-[12px] text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      </div>

      {auditLog.length === 0 ? (
        <div className="text-[12px] text-slate-500 text-center py-4">
          No changes recorded yet
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-slate-600">
              {auditLog.length} changes recorded
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onExport?.('json')}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => onExport?.('csv')}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
              >
                Export CSV
              </button>
              <button
                onClick={onClear}
                className="px-2 py-1 text-[11px] bg-rose-100 hover:bg-rose-200 rounded text-rose-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {auditLog.map((entry, index) => (
              <div key={entry.id} className="border-b border-slate-100 pb-2 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-slate-800">
                      {showDetails ? entry.change : entry.field}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {entry.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    #{auditLog.length - index}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
