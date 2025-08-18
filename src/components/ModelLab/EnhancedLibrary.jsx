import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { modelStore } from '../../services/modelStore';

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

const EnhancedLibrary = ({ models, setModels, onSelect, selectedModelId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'updated');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const searchInputRef = useRef(null);
  const modelListRef = useRef(null);
  const fileInputRef = useRef(null);

  const tags = Array.from(new Set(models.flatMap(m => m.tags))).sort();

  // URL state management
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (sortBy !== 'updated') params.set('sort', sortBy);

    const selectedIds = models.filter(m => m.selected).map(m => m.id);
    if (selectedIds.length > 0) params.set('compare', selectedIds.join(','));

    setSearchParams(params, { replace: true });
  }, [q, tag, sortBy, models, setSearchParams]);

  // Restore compare selection from URL
  useEffect(() => {
    const compareIds = searchParams.get('compare')?.split(',') || [];
    if (compareIds.length > 0) {
      setModels(models.map(m => ({ ...m, selected: compareIds.includes(m.id) })));
    }
  }, []); // Only run once on mount

  // Filter and sort models
  const filteredModels = models
    .filter(m => {
      const matchesQuery = !q || m.name.toLowerCase().includes(q.toLowerCase()) ||
                          m.tags.some(t => t.toLowerCase().includes(q.toLowerCase()));
      const matchesTag = !tag || m.tags.includes(tag);
      return matchesQuery && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'kind': return a.kind.localeCompare(b.kind);
        case 'updated': return new Date(b.updated) - new Date(a.updated);
        default: return 0;
      }
    });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Escape') {
          searchInputRef.current.blur();
          setSelectedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(0, i - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(filteredModels.length - 1, i + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredModels[selectedIndex]) {
            onSelect(filteredModels[selectedIndex].id);
          }
          break;
        case ' ':
          e.preventDefault();
          if (filteredModels[selectedIndex]) {
            toggleSelection(filteredModels[selectedIndex]);
          }
          break;
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredModels, onSelect]);

  // Actions
  const toggleSelection = useCallback((model) => {
    setModels(models.map(m => m.id === model.id ? { ...m, selected: !m.selected } : m));
  }, [models, setModels]);

  const deleteModel = useCallback((model) => {
    if (deleteConfirm === model.id) {
      modelStore.delete(model.id);
      setModels(models.filter(m => m.id !== model.id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(model.id);
    }
  }, [models, setModels, deleteConfirm]);

  const cloneModel = useCallback((model) => {
    const cloned = modelStore.clone(model.id);
    if (cloned) {
      setModels([cloned, ...models]);
      onSelect(cloned.id);
    }
  }, [models, setModels, onSelect]);

  const bumpVersion = useCallback((model) => {
    const updated = modelStore.bumpVersion(model.id);
    if (updated) {
      setModels(models.map(m => m.id === model.id ? updated : m));
    }
  }, [models, setModels]);

  const exportModels = useCallback((selectedOnly = false) => {
    const idsToExport = selectedOnly ?
      models.filter(m => m.selected).map(m => m.id) :
      null;

    const blob = modelStore.export(idsToExport);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valor-models-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [models]);

  const handleImport = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = modelStore.import(e.target.result);
        setModels([...imported, ...models]);
        setShowImportModal(false);
        // Show success message
        console.log(`Imported ${imported.length} models successfully`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`Import failed: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }, [models, setModels]);

  return (
    <>
      <Card
        title="Model Library"
        right={
          <div className="flex items-center gap-2">
            <Pill tone="blue">{models.filter(m => m.selected).length} selected</Pill>
            <Pill tone="slate">{filteredModels.length} / {models.length}</Pill>
          </div>
        }
      >
        {/* Search and Filter Controls */}
        <div className="mb-3 grid grid-cols-4 items-end gap-2">
          <label className="col-span-2 text-[12px]">
            <span className="mb-1 block text-slate-600">Search (⌘K)</span>
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or tag…"
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-slate-600">Filter tag</span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="">All</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-[12px]">
            <span className="mb-1 block text-slate-600">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="updated">Updated</option>
              <option value="name">Name</option>
              <option value="kind">Kind</option>
            </select>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mb-3 flex items-center gap-2 text-[12px]">
          <button
            onClick={() => exportModels(false)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 transition-colors"
          >
            Export All
          </button>
          <button
            onClick={() => exportModels(true)}
            disabled={models.filter(m => m.selected).length === 0}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Export Selected
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 transition-colors"
          >
            Import
          </button>
        </div>

        {/* Model List */}
        <div className="text-[11px] text-slate-500 mb-2">
          Use ↑/↓ to navigate, Enter to open, Space to select
        </div>

        <ul ref={modelListRef} className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {filteredModels.map((m, index) => (
            <li
              key={m.id}
              className={`flex items-center justify-between rounded-xl border p-3 transition-colors
                ${selectedModelId === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
                ${selectedIndex === index ? 'ring-2 ring-blue-200' : ''}
                ${deleteConfirm === m.id ? 'border-red-300 bg-red-50' : ''}
              `}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-800">{m.name}</span>
                  <Pill tone="amber">{m.version}</Pill>
                  <Pill tone="slate">{m.kind}</Pill>
                  {m.selected && <Pill tone="green">Compare</Pill>}
                  {m.tags.includes('imported') && <Pill tone="blue">Imported</Pill>}
                </div>
                <div className="text-[11px] text-slate-500">
                  Updated {new Date(m.updated).toLocaleString()} • {m.tags.map(t => <span key={t} className="mr-1">#{t}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(m.id)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleSelection(m)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
                >
                  {m.selected ? 'Unselect' : 'Select'}
                </button>
                <button
                  onClick={() => cloneModel(m)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
                >
                  Clone
                </button>
                <button
                  onClick={() => bumpVersion(m)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] hover:bg-slate-50 transition-colors"
                >
                  Bump
                </button>
                <button
                  onClick={() => deleteModel(m)}
                  className={`text-[12px] transition-colors ${
                    deleteConfirm === m.id
                      ? 'text-red-700 font-semibold'
                      : 'text-rose-600 hover:text-rose-700'
                  }`}
                >
                  {deleteConfirm === m.id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {filteredModels.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            {q || tag ? 'No models match your search criteria' : 'No models created yet'}
          </div>
        )}
      </Card>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import Models</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select a JSON file exported from Model Lab to import models.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleImport(file);
              }}
              className="w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedLibrary;
