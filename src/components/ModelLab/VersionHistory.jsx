import { Clock, RotateCcw, GitBranch, Download, Eye, AlertTriangle } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import versioningService from '../../services/versioningService';

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

const Pill = ({ children, tone = 'slate', size = 'sm' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    xs: 'text-[10px] px-1.5 py-0.5'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${tones[tone]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

const DiffViewer = ({ diff, onClose }) => {
  const formatValue = (value, type) => {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'number') {
      if (type === 'currency') {
        return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
          value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
            `$${value.toLocaleString()}`;
      }
      if (type === 'percentage') return `${(value * 100).toFixed(1)}%`;
      if (type === 'multiple') return `${value.toFixed(1)}x`;
      return value.toLocaleString();
    }
    return String(value);
  };

  const formatDifference = (difference) => {
    if (!difference) return null;

    const { absolute, percentage, direction } = difference;
    const sign = direction === 'increase' ? '+' : direction === 'decrease' ? '-' : '';
    const color = direction === 'increase' ? 'text-green-600' :
      direction === 'decrease' ? 'text-red-600' : 'text-slate-600';

    return (
      <span className={`text-[10px] ${color}`}>
        ({sign}{Math.abs(absolute).toLocaleString()}
        {percentage && `, ${sign}${Math.abs(percentage).toFixed(1)}%`})
      </span>
    );
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'added': return <span className="text-green-600">+</span>;
      case 'removed': return <span className="text-red-600">-</span>;
      case 'modified': return <span className="text-amber-600">~</span>;
      default: return null;
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'added': return 'border-green-200 bg-green-50';
      case 'removed': return 'border-red-200 bg-red-50';
      case 'modified': return 'border-amber-200 bg-amber-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-[15px] font-semibold">Version Comparison</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Summary */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-[12px] font-medium mb-2">Change Summary</div>
            <div className="grid grid-cols-4 gap-3 text-[11px]">
              <div className="text-center">
                <div className="font-bold text-[14px]">{diff.summary.totalChanges}</div>
                <div className="text-slate-600">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[14px] text-amber-600">{diff.summary.assumptionChanges}</div>
                <div className="text-slate-600">Assumptions</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[14px] text-blue-600">{diff.summary.outputChanges}</div>
                <div className="text-slate-600">Outputs</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-[14px] text-slate-600">{diff.summary.metadataChanges}</div>
                <div className="text-slate-600">Metadata</div>
              </div>
            </div>
          </div>

          {/* Metadata Changes */}
          {Object.keys(diff.metadata).length > 0 && (
            <div className="mb-4">
              <h4 className="text-[12px] font-medium mb-2 flex items-center gap-2">
                <GitBranch className="w-3 h-3" />
                Metadata Changes
              </h4>
              <div className="space-y-2">
                {Object.entries(diff.metadata).map(([key, change]) => (
                  <div key={key} className={`p-2 rounded border ${getChangeColor(change.type)}`}>
                    <div className="flex items-center gap-2 text-[11px]">
                      {getChangeIcon(change.type)}
                      <span className="font-medium">{key}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      <span className="line-through">{formatValue(change.from)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{formatValue(change.to)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumption Changes */}
          {Object.keys(diff.assumptions).length > 0 && (
            <div className="mb-4">
              <h4 className="text-[12px] font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Assumption Changes
              </h4>
              <div className="space-y-2">
                {Object.entries(diff.assumptions).map(([key, change]) => (
                  <div key={key} className={`p-2 rounded border ${getChangeColor(change.type)}`}>
                    <div className="flex items-center gap-2 text-[11px]">
                      {getChangeIcon(change.type)}
                      <span className="font-medium">{key}</span>
                      {formatDifference(change.difference)}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      {change.type !== 'added' && (
                        <span className="line-through">{formatValue(change.from, 'number')}</span>
                      )}
                      {change.type === 'modified' && <span className="mx-2">→</span>}
                      {change.type !== 'removed' && (
                        <span className="font-medium">{formatValue(change.to, 'number')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Changes */}
          {Object.keys(diff.outputs).length > 0 && (
            <div className="mb-4">
              <h4 className="text-[12px] font-medium mb-2 flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Output Changes
              </h4>
              <div className="space-y-2">
                {Object.entries(diff.outputs).map(([key, change]) => (
                  <div key={key} className={`p-2 rounded border ${getChangeColor(change.type)}`}>
                    <div className="flex items-center gap-2 text-[11px]">
                      {getChangeIcon(change.type)}
                      <span className="font-medium">{key}</span>
                      {formatDifference(change.difference)}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      {change.type !== 'added' && (
                        <span className="line-through">{formatValue(change.from, 'currency')}</span>
                      )}
                      {change.type === 'modified' && <span className="mx-2">→</span>}
                      {change.type !== 'removed' && (
                        <span className="font-medium">{formatValue(change.to, 'currency')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VersionHistory = ({ model, onRevert, onClose }) => {
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [showDiff, setShowDiff] = useState(null);
  const [loading, setLoading] = useState(false);

  const history = useMemo(() => {
    if (!model?.id) return [];
    return versioningService.getVersionHistory(model.id);
  }, [model?.id]);

  const stats = useMemo(() => {
    if (!model?.id) return null;
    return versioningService.getVersionStats(model.id);
  }, [model?.id]);

  const handleRevert = async(version) => {
    if (!window.confirm(`Revert to version ${version.version}? This will create a new version with the reverted state.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = versioningService.revertToVersion(model.id, version.id);
      onRevert(result.model, result.version);
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Error reverting version: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length !== 2) return;

    try {
      const diff = versioningService.calculateDiff(model.id, selectedVersions[1], selectedVersions[0]);
      setShowDiff(diff);
    } catch (error) {
      console.error('Error calculating diff:', error);
      alert('Error calculating diff: ' + error.message);
    }
  };

  const handleCompareWithCurrent = (version) => {
    try {
      const diff = versioningService.calculateDiffFromCurrent(model, version.id);
      setShowDiff(diff);
    } catch (error) {
      console.error('Error calculating diff:', error);
      alert('Error calculating diff: ' + error.message);
    }
  };

  const exportHistory = () => {
    const exportData = versioningService.exportVersionHistory(model.id);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name || 'model'}_version_history.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleVersionSelection = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]; // Keep only last selected and new one
      }
      return [...prev, versionId];
    });
  };

  if (!model) {
    return (
      <Card title="Version History">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">Select a model to view version history</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Version History"
        right={
          <div className="flex items-center gap-2">
            {stats && <Pill tone="blue">{stats.totalVersions} versions</Pill>}
            {selectedVersions.length === 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Compare
              </button>
            )}
            <button
              onClick={exportHistory}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
              title="Export history"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        }
      >
        {/* Statistics */}
        {stats && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-[11px] font-medium text-slate-700 mb-2">Statistics</div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <div className="text-slate-600">Oldest Version</div>
                <div>{stats.oldestVersion.age}</div>
              </div>
              <div>
                <div className="text-slate-600">Avg Changes/Day</div>
                <div>{stats.averageChangesPerDay}</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-3 text-[11px] text-slate-600 bg-blue-50 p-2 rounded">
          Select up to 2 versions to compare, or click actions to revert/diff with current.
        </div>

        {/* Version list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.map((version, index) => (
            <div
              key={version.id}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedVersions.includes(version.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={() => toggleVersionSelection(version.id)}
              role="button"
              tabIndex={0}
              aria-label={`Select version ${version.version}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleVersionSelection(version.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.id)}
                    onChange={() => toggleVersionSelection(version.id)}
                    className="w-3 h-3"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">v{version.version}</span>
                      {index === 0 && <Pill tone="green" size="xs">Current</Pill>}
                      <Pill size="xs">{versioningService.getTimeAgo(version.timestamp)}</Pill>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {version.changeDescription}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompareWithCurrent(version);
                    }}
                    className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
                    title="Compare with current"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevert(version);
                      }}
                      disabled={loading}
                      className="w-6 h-6 rounded bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Revert to this version"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-3">
                <span>By {version.author}</span>
                <span>Checksum: {version.checksum.slice(0, 8)}</span>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-[13px]">No version history yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Save changes to start building version history
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Diff viewer modal */}
      {showDiff && (
        <DiffViewer
          diff={showDiff}
          onClose={() => setShowDiff(null)}
        />
      )}
    </>
  );
};

export default VersionHistory;
