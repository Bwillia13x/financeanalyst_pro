import { Download, RotateCcw, DollarSign, Globe } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
};

const EnhancedCompare = ({ models = [] }) => {
  const [currency, setCurrency] = useState('USD');
  const [showPercentages, setShowPercentages] = useState(false);
  const [sortBy, setSortBy] = useState('ev');
  const [sortOrder, setSortOrder] = useState('desc');

  const currencies = {
    USD: { symbol: '$', rate: 1, label: 'US Dollar' },
    EUR: { symbol: '€', rate: 0.92, label: 'Euro' },
    GBP: { symbol: '£', rate: 0.81, label: 'British Pound' },
    JPY: { symbol: '¥', rate: 149.50, label: 'Japanese Yen' },
    CAD: { symbol: 'C$', rate: 1.35, label: 'Canadian Dollar' }
  };

  const formatCurrency = (value, compact = true) => {
    if (!value || value === 0) return '—';

    const convertedValue = value * currencies[currency].rate;
    const { symbol } = currencies[currency];

    if (currency === 'JPY') {
      return `${symbol}${Math.round(convertedValue).toLocaleString()}`;
    }

    if (compact) {
      if (Math.abs(convertedValue) >= 1e9) {
        return `${symbol}${(convertedValue / 1e9).toFixed(1)}B`;
      }
      if (Math.abs(convertedValue) >= 1e6) {
        return `${symbol}${(convertedValue / 1e6).toFixed(0)}M`;
      }
    }

    return `${symbol}${convertedValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPercentage = (value) => {
    if (!value) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatMultiple = (value) => {
    if (!value) return '—';
    return `${value.toFixed(1)}x`;
  };

  // Sort models
  const sortedModels = useMemo(() => {
    if (!models.length) return [];

    return [...models].sort((a, b) => {
      const aVal = a.outputs?.[sortBy] || 0;
      const bVal = b.outputs?.[sortBy] || 0;

      if (sortOrder === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }, [models, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!models.length) return {};

    const values = {
      ev: models.map(m => m.outputs?.ev || 0).filter(v => v !== 0),
      perShare: models.map(m => m.outputs?.perShare || 0).filter(v => v !== 0),
      irr: models.map(m => m.outputs?.irr || 0).filter(v => v !== 0),
      moic: models.map(m => m.outputs?.moic || 0).filter(v => v !== 0)
    };

    const calcStats = (arr) => {
      if (!arr.length) return { min: 0, max: 0, avg: 0, median: 0 };

      const sorted = [...arr].sort((a, b) => a - b);
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sorted.reduce((sum, val) => sum + val, 0) / sorted.length,
        median: sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
      };
    };

    return {
      ev: calcStats(values.ev),
      perShare: calcStats(values.perShare),
      irr: calcStats(values.irr),
      moic: calcStats(values.moic)
    };
  }, [models]);

  const exportToCSV = () => {
    if (!models.length) return;

    const headers = [
      'Model Name',
      'Type',
      `Enterprise Value (${currency})`,
      `Per Share (${currency})`,
      'IRR (%)',
      'MOIC (x)',
      'Version',
      'Last Updated'
    ];

    const rows = sortedModels.map(model => [
      model.name || 'Untitled',
      model.kind,
      model.outputs?.ev ? (model.outputs.ev * currencies[currency].rate).toFixed(0) : '—',
      model.outputs?.perShare ? (model.outputs.perShare * currencies[currency].rate).toFixed(2) : '—',
      model.outputs?.irr ? (model.outputs.irr * 100).toFixed(1) : '—',
      model.outputs?.moic ? model.outputs.moic.toFixed(1) : '—',
      model.version || '1.0.0',
      model.updatedAt ? new Date(model.updatedAt).toLocaleDateString() : '—'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `model-comparison-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetComparison = () => {
    setCurrency('USD');
    setShowPercentages(false);
    setSortBy('ev');
    setSortOrder('desc');
  };

  const handleSort = (metric) => {
    if (sortBy === metric) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(metric);
      setSortOrder('desc');
    }
  };

  if (!models.length) {
    return (
      <Card title="Cross-Model Compare">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">Select 2+ models to compare</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Cross-Model Compare"
      right={
        <div className="flex items-center gap-2">
          {models.length > 0 && (
            <Pill tone="blue">{models.length} models</Pill>
          )}

          {/* Currency selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-white"
          >
            {Object.entries(currencies).map(([code, info]) => (
              <option key={code} value={code}>
                {code} ({info.symbol})
              </option>
            ))}
          </select>

          {/* Export button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>

          {/* Reset button */}
          <button
            onClick={resetComparison}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={showPercentages}
              onChange={(e) => setShowPercentages(e.target.checked)}
              className="w-3 h-3"
            />
            Show % differences
          </label>
        </div>

        <div className="text-[11px] text-slate-500">
          Currency: {currencies[currency].label} ({currencies[currency].symbol})
          {currency !== 'USD' && ` • Rate: ${currencies[currency].rate}`}
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 font-medium text-slate-700">Model</th>
              <th
                className="text-right py-2 px-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('ev')}
              >
                <div className="flex items-center justify-end gap-1">
                  Enterprise Value
                  {sortBy === 'ev' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right py-2 px-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('perShare')}
              >
                <div className="flex items-center justify-end gap-1">
                  Per Share
                  {sortBy === 'perShare' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right py-2 px-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('irr')}
              >
                <div className="flex items-center justify-end gap-1">
                  IRR
                  {sortBy === 'irr' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
              <th
                className="text-right py-2 px-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('moic')}
              >
                <div className="flex items-center justify-end gap-1">
                  MOIC
                  {sortBy === 'moic' && (
                    <span className="text-[10px]">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedModels.map((model, i) => (
              <tr key={model.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name || 'Untitled'}</span>
                    <Pill
                      tone={
                        model.kind === 'DCF' ? 'blue' :
                          model.kind === 'LBO' ? 'green' :
                            model.kind === 'Comps' ? 'amber' : 'slate'
                      }
                    >
                      {model.kind}
                    </Pill>
                  </div>
                </td>
                <td className="py-2 px-2 text-right">
                  <div>{formatCurrency(model.outputs?.ev)}</div>
                  {showPercentages && stats.ev.avg && (
                    <div className="text-[10px] text-slate-500">
                      {((model.outputs?.ev || 0) / stats.ev.avg * 100 - 100).toFixed(0)}% vs avg
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  <div>{formatCurrency(model.outputs?.perShare, false)}</div>
                  {showPercentages && stats.perShare.avg && (
                    <div className="text-[10px] text-slate-500">
                      {((model.outputs?.perShare || 0) / stats.perShare.avg * 100 - 100).toFixed(0)}% vs avg
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  <div>{formatPercentage(model.outputs?.irr)}</div>
                  {showPercentages && stats.irr.avg && (
                    <div className="text-[10px] text-slate-500">
                      {(((model.outputs?.irr || 0) - stats.irr.avg) * 100).toFixed(0)}bp vs avg
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  <div>{formatMultiple(model.outputs?.moic)}</div>
                  {showPercentages && stats.moic.avg && (
                    <div className="text-[10px] text-slate-500">
                      {((model.outputs?.moic || 0) / stats.moic.avg * 100 - 100).toFixed(0)}% vs avg
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistics summary */}
      {models.length > 1 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-[11px] font-medium text-slate-700 mb-2">Summary Statistics</div>
          <div className="grid grid-cols-4 gap-3 text-[10px]">
            <div>
              <div className="text-slate-600">Enterprise Value</div>
              <div className="space-y-1">
                <div>Min: {formatCurrency(stats.ev.min)}</div>
                <div>Max: {formatCurrency(stats.ev.max)}</div>
                <div>Avg: {formatCurrency(stats.ev.avg)}</div>
              </div>
            </div>
            <div>
              <div className="text-slate-600">Per Share</div>
              <div className="space-y-1">
                <div>Min: {formatCurrency(stats.perShare.min, false)}</div>
                <div>Max: {formatCurrency(stats.perShare.max, false)}</div>
                <div>Avg: {formatCurrency(stats.perShare.avg, false)}</div>
              </div>
            </div>
            <div>
              <div className="text-slate-600">IRR</div>
              <div className="space-y-1">
                <div>Min: {formatPercentage(stats.irr.min)}</div>
                <div>Max: {formatPercentage(stats.irr.max)}</div>
                <div>Avg: {formatPercentage(stats.irr.avg)}</div>
              </div>
            </div>
            <div>
              <div className="text-slate-600">MOIC</div>
              <div className="space-y-1">
                <div>Min: {formatMultiple(stats.moic.min)}</div>
                <div>Max: {formatMultiple(stats.moic.max)}</div>
                <div>Avg: {formatMultiple(stats.moic.avg)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedCompare;
