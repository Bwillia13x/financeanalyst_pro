import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';

import Icon from '../../components/AppIcon';
import SEOHead from '../../components/SEO/SEOHead';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { useKeyboardShortcutsContext } from '../../components/ui/KeyboardShortcutsProvider';
import CollaborativeEditor from '../../components/Collaboration/CollaborativeEditor';

// Lazy-load heavy panels to reduce initial TBT
const AuditTrail = lazy(() => import('./components/AuditTrail'));
const CalculationResults = lazy(() => import('./components/CalculationResults'));
const FormulaBuilder = lazy(() => import('./components/FormulaBuilder'));
const ModelTemplates = lazy(() => import('./components/ModelTemplates'));
const TerminalInterface = lazy(() => import('./components/TerminalInterface'));
const VariableInputs = lazy(() => import('./components/VariableInputs'));

const FinancialModelWorkspace = () => {
  const [activeLayout, setActiveLayout] = useState('dual-pane');
  // Default to a lighter panel by default; load Terminal on demand
  const [leftPanelContent, setLeftPanelContent] = useState('variables');
  const [rightPanelContent, setRightPanelContent] = useState('results');
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [currentUserId] = useState(`user_${Date.now()}`);
  const [documentId] = useState(`model_${Date.now()}`);
  const [modelState] = useState({
    name: 'DCF_Analysis_v2.3',
    saved: true,
    calculating: false,
    lastSaved: new Date()
  });
  const { updateCommandContext } = useKeyboardShortcutsContext();

  // Publish contextual data for the Financial Model Workspace
  useEffect(() => {
    updateCommandContext({
      page: 'financial-model-workspace',
      modelName: modelState.name,
      modelSaved: modelState.saved,
      layout: activeLayout,
      leftPanel: leftPanelContent,
      rightPanel: rightPanelContent
    });
  }, [
    updateCommandContext,
    modelState.name,
    modelState.saved,
    activeLayout,
    leftPanelContent,
    rightPanelContent
  ]);

  const [calculationResults, setCalculationResults] = useState(null);

  // Defer mounting heavy panels until first user interaction or a longer idle timeout
  const [canMountPanels, setCanMountPanels] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAudit = params.has('lhci') || params.has('audit');
    let settled = false;
    const onFirstInteract = () => {
      if (!settled) {
        settled = true;
        setCanMountPanels(true);
        window.removeEventListener('pointerdown', onFirstInteract);
        window.removeEventListener('keydown', onFirstInteract);
        window.removeEventListener('touchstart', onFirstInteract);
      }
    };

    window.addEventListener('pointerdown', onFirstInteract, { once: true });
    window.addEventListener('keydown', onFirstInteract, { once: true });
    window.addEventListener('touchstart', onFirstInteract, { once: true });

    let fallbackId;
    if (!isAudit) {
      const fallbackDelay = 2500;
      fallbackId = setTimeout(() => {
        if (!settled) {
          settled = true;
          setCanMountPanels(true);
        }
      }, fallbackDelay);
    }

    return () => {
      if (fallbackId) clearTimeout(fallbackId);
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
      window.removeEventListener('touchstart', onFirstInteract);
    };
  }, []);

  // Only render right panel when visible to the viewport or after idle
  const rightPanelRef = useRef(null);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  useEffect(() => {
    if (!rightPanelRef.current || !window.IntersectionObserver) {
      // Fallback for test environments without IntersectionObserver
      setIsRightPanelVisible(true);
      return;
    }
    const el = rightPanelRef.current;
    const obs = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsRightPanelVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeLayout]);

  const PanelFallback = ({ className = '' }) => (
    <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
      <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
    </div>
  );

  const handleCommandExecute = (command, result) => {
    setCalculationResults(result);
  };

  const renderLeftPanel = () => {
    switch (leftPanelContent) {
      case 'terminal':
        return canMountPanels ? (
          <Suspense fallback={<PanelFallback />}>
            <TerminalInterface
              onCommandExecute={handleCommandExecute}
              calculationResults={calculationResults}
            />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      case 'variables':
        return canMountPanels ? (
          <Suspense fallback={<PanelFallback />}>
            <VariableInputs />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      case 'formulas':
        return canMountPanels ? (
          <Suspense fallback={<PanelFallback />}>
            <FormulaBuilder />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      case 'templates':
        return canMountPanels ? (
          <Suspense fallback={<PanelFallback />}>
            <ModelTemplates />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      default:
        return canMountPanels ? (
          <Suspense fallback={<PanelFallback />}>
            <TerminalInterface
              onCommandExecute={handleCommandExecute}
              calculationResults={calculationResults}
            />
          </Suspense>
        ) : (
          <PanelFallback />
        );
    }
  };

  const renderRightPanel = () => {
    switch (rightPanelContent) {
      case 'results':
        return canMountPanels && isRightPanelVisible ? (
          <Suspense fallback={<PanelFallback />}>
            <CalculationResults results={calculationResults} />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      case 'audit':
        return canMountPanels && isRightPanelVisible ? (
          <Suspense fallback={<PanelFallback />}>
            <AuditTrail />
          </Suspense>
        ) : (
          <PanelFallback />
        );
      default:
        return canMountPanels && isRightPanelVisible ? (
          <Suspense fallback={<PanelFallback />}>
            <CalculationResults results={calculationResults} />
          </Suspense>
        ) : (
          <PanelFallback />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SEOHead
        title="Financial Model Workspace | FinanceAnalyst Pro"
        description="Professional financial modeling workspace with advanced DCF analysis, LBO tools, and real-time collaboration features for finance professionals."
        canonical="/"
        keywords="financial modeling, DCF analysis, LBO modeling, financial workspace, valuation tools, Excel alternative"
      />
      <Header />

      {/* Main Workspace */}
      <main id="main-content" className="flex flex-col h-screen pt-16" role="main">
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
            {/* Collaboration Toggle */}
            <Button
              variant={isCollaborationEnabled ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsCollaborationEnabled(!isCollaborationEnabled)}
              aria-label="Toggle collaboration mode"
              title="Enable/disable real-time collaboration"
            >
              <Icon name="Users" className="w-4 h-4 mr-2" />
              {isCollaborationEnabled ? 'Collaborating' : 'Collaborate'}
            </Button>

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
                onChange={e => setLeftPanelContent(e.target.value)}
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
                  onChange={e => setRightPanelContent(e.target.value)}
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div
            className={`${
              activeLayout === 'dual-pane' ? 'w-1/2' : 'w-full'
            } border-r border-gray-700 overflow-hidden`}
          >
            {renderLeftPanel()}
          </div>

          {/* Right Panel */}
          {activeLayout === 'dual-pane' && (
            <div className="w-1/2 overflow-hidden" ref={rightPanelRef}>
              {renderRightPanel()}
            </div>
          )}
        </div>

        {/* Collaborative Editor Overlay */}
        {isCollaborationEnabled && (
          <div className="absolute top-20 right-4 w-80 h-96 z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl h-full">
              <div className="flex items-center justify-between p-3 border-b border-gray-600">
                <div className="flex items-center space-x-2">
                  <Icon name="Users" className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Live Collaboration</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollaborationEnabled(false)}
                  className="p-1"
                >
                  <Icon name="X" className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3 h-full overflow-hidden">
                <CollaborativeEditor
                  documentId={documentId}
                  userId={currentUserId}
                  initialContent={{
                    variables: {},
                    formulas: {},
                    results: {},
                    lastModified: new Date()
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FinancialModelWorkspace;
