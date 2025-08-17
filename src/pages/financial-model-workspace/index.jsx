import { useCallback, useEffect, useRef, useState } from 'react';

import Icon from '../../components/AppIcon';
import SEOHead from '../../components/SEO/SEOHead';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { persistenceManager } from '../../services/persistence/PersistenceManager';

import AuditTrail from './components/AuditTrail';
import CalculationResults from './components/CalculationResults';
import FormulaBuilder from './components/FormulaBuilder';
import ModelTemplates from './components/ModelTemplates';
import TerminalInterface from './components/TerminalInterface';
import VariableInputs from './components/VariableInputs';

const FinancialModelWorkspace = () => {
  const [activeLayout, setActiveLayout] = useState('dual-pane');
  const [leftPanelContent, setLeftPanelContent] = useState('terminal');
  const [rightPanelContent, setRightPanelContent] = useState('results');
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const gutterRef = useRef(null);

  const [modelState] = useState({
    name: 'DCF_Analysis_v2.3',
    saved: true,
    calculating: false,
    lastSaved: new Date()
  });

  const [calculationResults, setCalculationResults] = useState(null);

  const handleCommandExecute = (command, result) => {
    setCalculationResults(result);
  };

  const renderLeftPanel = () => {
    switch (leftPanelContent) {
      case 'terminal':
        return (
          <TerminalInterface
            onCommandExecute={handleCommandExecute}
            calculationResults={calculationResults}
          />
        );
      case 'variables':
        return <VariableInputs />;
      case 'formulas':
        return <FormulaBuilder />;
      case 'templates':
        return <ModelTemplates />;
      default:
        return (
          <TerminalInterface
            onCommandExecute={handleCommandExecute}
            calculationResults={calculationResults}
          />
        );
    }
  };

  const renderRightPanel = () => {
    switch (rightPanelContent) {
      case 'results':
        return <CalculationResults results={calculationResults} />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <CalculationResults results={calculationResults} />;
    }
  };

  // --- Persistence: hydrate on mount ---
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const ui = await persistenceManager.retrieve('ui_state', { storage: 'localStorage' });
        if (mounted && ui) {
          if (ui.workspace?.layout) setActiveLayout(ui.workspace.layout);
          if (typeof ui.workspace?.leftWidthPct === 'number') setLeftWidthPct(ui.workspace.leftWidthPct);
          if (ui.workspace?.leftPanelContent) setLeftPanelContent(ui.workspace.leftPanelContent);
          if (ui.workspace?.rightPanelContent) setRightPanelContent(ui.workspace.rightPanelContent);
        }
      } catch (e) {
        console.warn('UI state hydrate skipped:', e);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  // --- Persistence: store when relevant state changes (debounced) ---
  useEffect(() => {
    const id = setTimeout(() => {
      const ui = {
        workspace: {
          layout: activeLayout,
          leftWidthPct,
          leftPanelContent,
          rightPanelContent
        }
      };
      persistenceManager.store('ui_state', ui, { storage: 'localStorage' });
    }, 250);
    return () => clearTimeout(id);
  }, [activeLayout, leftPanelContent, rightPanelContent, leftWidthPct]);

  // --- Drag handlers for resizable split ---
  const onMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // px from left inside container
    const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
    setLeftWidthPct(pct);
  }, [isDragging]);

  const snap = (pct) => {
    const points = [30, 50, 70];
    let closest = points[0];
    let minDiff = Math.abs(pct - points[0]);
    for (let i = 1; i < points.length; i++) {
      const d = Math.abs(pct - points[i]);
      if (d < minDiff) {
        minDiff = d;
        closest = points[i];
      }
    }
    return closest;
  };

  const onMouseUp = useCallback((e) => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap unless Alt is held for fine control
    setLeftWidthPct(prev => (e.altKey ? prev : snap(prev)));
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging, onMouseMove]);

  const onMouseDown = useCallback(() => {
    setIsDragging(true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onMouseMove, onMouseUp]);

  const onGutterDoubleClick = useCallback(() => {
    setLeftWidthPct(50);
  }, []);

  // Global keyboard shortcuts via hook (scoped to workspace)
  const { registerScopedShortcut, unregisterScopedShortcut } = useKeyboardShortcuts({
    'resize-left': () => {
      setLeftWidthPct(prev => Math.max(20, Math.min(80, prev - 2)));
    },
    'resize-right': () => {
      setLeftWidthPct(prev => Math.max(20, Math.min(80, prev + 2)));
    },
    'resize-left-fast': () => {
      setLeftWidthPct(prev => Math.max(20, Math.min(80, prev - 10)));
    },
    'resize-right-fast': () => {
      setLeftWidthPct(prev => Math.max(20, Math.min(80, prev + 10)));
    },
    'toggle-layout': () => {
      setActiveLayout(prev => (prev === 'dual-pane' ? 'single-pane' : 'dual-pane'));
    },
    'focus-left-pane': () => {
      containerRef.current?.querySelector('[data-pane="left"]')?.focus();
    },
    'focus-right-pane': () => {
      containerRef.current?.querySelector('[data-pane="right"]')?.focus();
    }
  });

  // Register scoped shortcuts on mount
  useEffect(() => {
    // Resize
    registerScopedShortcut('alt+left', { action: 'resize-left', description: 'Resize panes left (Shift accelerates)' });
    registerScopedShortcut('alt+right', { action: 'resize-right', description: 'Resize panes right (Shift accelerates)' });
    registerScopedShortcut('alt+shift+left', { action: 'resize-left-fast', description: 'Resize panes left (fast)' });
    registerScopedShortcut('alt+shift+right', { action: 'resize-right-fast', description: 'Resize panes right (fast)' });
    // Layout toggle
    registerScopedShortcut('ctrl+shift+d', { action: 'toggle-layout', description: 'Toggle single/dual layout' });
    // Pane focus
    registerScopedShortcut('cmd+1', { action: 'focus-left-pane', description: 'Focus left pane' });
    registerScopedShortcut('cmd+2', { action: 'focus-right-pane', description: 'Focus right pane' });
    registerScopedShortcut('ctrl+1', { action: 'focus-left-pane', description: 'Focus left pane' });
    registerScopedShortcut('ctrl+2', { action: 'focus-right-pane', description: 'Focus right pane' });

    return () => {
      // Unregister
      ['alt+left', 'alt+right', 'alt+shift+left', 'alt+shift+right', 'ctrl+shift+d', 'cmd+1', 'cmd+2', 'ctrl+1', 'ctrl+2']
        .forEach(unregisterScopedShortcut);
    };
  }, [registerScopedShortcut, unregisterScopedShortcut]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SEOHead
        title="Financial Model Workspace | Valor-IVX"
        description="Professional financial modeling workspace with advanced DCF analysis, LBO tools, and real-time collaboration features for finance professionals."
        canonical="/"
        keywords="financial modeling, DCF analysis, LBO modeling, financial workspace, valuation tools, Excel alternative"
      />
      <Header />

      {/* Main Workspace */}
      <main id="main-content" className="flex flex-col h-screen pt-[88px]" role="main">
        {/* Accessible page heading only (breadcrumbs moved to Header status strip) */}
        <h1 className="sr-only">Financial Model Workspace</h1>
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="FileText" className="w-5 h-5 text-blue-400" />
              <span className="font-medium">{modelState.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  modelState.saved ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}
              >
                {modelState.saved ? 'Saved' : 'Unsaved'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Layout Controls */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <Button
                variant={activeLayout === 'single-pane' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveLayout('single-pane')}
                aria-label="Single-pane layout"
              >
                <Icon name="Square" className="w-4 h-4" />
              </Button>
              <Button
                variant={activeLayout === 'dual-pane' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveLayout('dual-pane')}
                aria-label="Dual-pane layout"
              >
                <Icon name="Columns" className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel Controls */}
            <div className="flex items-center space-x-1">
              <select
                value={leftPanelContent}
                onChange={(e) => setLeftPanelContent(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                aria-label="Select left panel content"
              >
                <option value="terminal">Terminal</option>
                <option value="variables">Variables</option>
                <option value="formulas">Formulas</option>
                <option value="templates">Templates</option>
              </select>

              {activeLayout === 'dual-pane' && (
                <select
                  value={rightPanelContent}
                  onChange={(e) => setRightPanelContent(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  aria-label="Select right panel content"
                >
                  <option value="results">Results</option>
                  <option value="audit">Audit Trail</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={containerRef}
          className={`flex-1 flex overflow-hidden ${isDragging ? 'select-none' : ''}`}
        >
          {/* Left Panel */}
          <div
            data-pane="left"
            tabIndex={0}
            className="border-r border-gray-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ flexBasis: activeLayout === 'dual-pane' ? `${leftWidthPct}%` : '100%' }}
            aria-label="Left panel"
          >
            {renderLeftPanel()}
          </div>

          {/* Gutter (only in dual-pane) */}
          {activeLayout === 'dual-pane' && (
            <div
              ref={gutterRef}
              role="separator"
              aria-orientation="vertical"
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={Math.round(leftWidthPct)}
              tabIndex={0}
              onMouseDown={onMouseDown}
              onDoubleClick={onGutterDoubleClick}
              className={`w-1.5 bg-gray-800 hover:bg-gray-700 cursor-col-resize ${isDragging ? 'bg-blue-700' : ''}`}
              title="Drag to resize • Double‑click to reset • Alt+←/→ fine resize • Shift accelerates"
            />
          )}

          {/* Right Panel */}
          {activeLayout === 'dual-pane' && (
            <div
              data-pane="right"
              tabIndex={0}
              className="overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ flexBasis: `${100 - leftWidthPct}%` }}
              aria-label="Right panel"
            >
              {renderRightPanel()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancialModelWorkspace;
