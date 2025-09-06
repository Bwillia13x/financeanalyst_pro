import { useCallback, useEffect, useMemo, useState } from 'react';

import { Pill } from 'src/components/ui/UIHelpers.jsx';
import QuickOutputs from '../components/ui/QuickOutputs';

import Compare from '../components/ModelLab/Compare';
import DriverInspector from '../components/ModelLab/DriverInspector';
import EnhancedLibrary from '../components/ModelLab/EnhancedLibrary';
import TemplateGallery from '../components/ModelLab/TemplateGallery';
import TestsPanel from '../components/ModelLab/TestsPanel';
import ValidatedAssumptionsForm from '../components/ModelLab/ValidatedAssumptionsForm';
import { computeModelOutputs } from '../services/calculators';
import { modelStore } from '../services/modelStore';
import { runTests } from '../utils/modelLabCalculations';

const ModelLab = () => {
  const [models, setModels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  const active = useMemo(() => models.find(m => m.id === activeId), [models, activeId]);

  // Load models from store on mount
  useEffect(() => {
    const storedModels = modelStore.list();
    if (storedModels.length === 0) {
      // Create default models if none exist
      const defaultModels = [
        modelStore.createFromTemplate('DCF', 'DCF Model 1'),
        modelStore.createFromTemplate('Comps', 'Comps Model 1'),
        modelStore.createFromTemplate('EPV', 'EPV Model 1'),
        modelStore.createFromTemplate('LBO', 'LBO Model 1')
      ];
      setModels(defaultModels);
      setActiveId(defaultModels[0]?.id);
    } else {
      setModels(storedModels);
      setActiveId(storedModels[0]?.id);
    }
  }, []);

  // Subscribe to model store changes
  useEffect(() => {
    const unsubscribe = modelStore.subscribe(updatedModels => {
      setModels(updatedModels);
    });
    return unsubscribe;
  }, []);

  const onUseTemplate = useCallback(
    kind => {
      const existing = models.filter(m => m.kind === kind).length;
      const newModel = modelStore.createFromTemplate(kind, `${kind} Model ${existing + 1}`);
      setModels([newModel, ...models]);
      setActiveId(newModel.id);
    },
    [models]
  );

  const updateActiveAssumptions = useCallback(
    assumptions => {
      if (!active) return;

      // Add to undo stack
      setUndoStack(prev => [...prev.slice(-4), active.assumptions]); // Keep last 5 states

      const updatedModel = {
        ...active,
        assumptions,
        outputs: computeModelOutputs({ ...active, assumptions }),
        updated: new Date().toISOString()
      };

      // Update in store
      modelStore.save(updatedModel);

      // Update local state
      setModels(models.map(m => (m.id === active.id ? updatedModel : m)));
    },
    [active, models]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !active) return;

    const previousAssumptions = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    const restoredModel = {
      ...active,
      assumptions: previousAssumptions,
      outputs: computeModelOutputs({ ...active, assumptions: previousAssumptions }),
      updated: new Date().toISOString()
    };

    modelStore.save(restoredModel);
    setModels(models.map(m => (m.id === active.id ? restoredModel : m)));
  }, [undoStack, active, models]);

  const handleValidationChange = useCallback(issues => {
    setValidationIssues(issues);
  }, []);

  const tests = useMemo(() => runTests(), []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* Main Content */}
      <div>
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
                  <path
                    d="M4 6h16M4 12h10M4 18h7"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs tracking-wide text-muted-foreground">
                  FinanceAnalyst Pro
                </div>
                <div className="text-[13px] font-semibold text-foreground">Model Lab</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <Pill tone="blue">{models.length} models</Pill>
              <Pill tone="green">Route /model-lab</Pill>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Library + Templates */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <EnhancedLibrary
                models={models}
                setModels={setModels}
                onSelect={setActiveId}
                selectedModelId={activeId}
              />
              <TemplateGallery onUse={onUseTemplate} />
            </div>

            {/* Center: Assumptions editor for active model */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              {active ? (
                <>
                  <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                      <h3 className="text-[13px] font-semibold tracking-wide text-foreground">
                        Model Header
                      </h3>
                      <div className="flex items-center gap-2">
                        <Pill tone="amber">{active.version}</Pill>
                        {validationIssues.filter(i => i.level === 'error').length > 0 && (
                          <Pill tone="red">Blocked</Pill>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 text-[13px]">
                        <label
                          htmlFor="model-name"
                          className="flex items-center justify-between gap-3 text-[13px]"
                        >
                          <span className="text-muted-foreground">Name</span>
                          <input
                            id="model-name"
                            className="w-48 rounded-md border border-border bg-background px-2 py-1 text-right text-foreground"
                            value={active.name}
                            onChange={e => {
                              const updatedModel = { ...active, name: e.target.value };
                              modelStore.save(updatedModel);
                              setModels(models.map(m => (m.id === active.id ? updatedModel : m)));
                            }}
                          />
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Kind</span>
                          <span className="text-[12px] font-semibold text-foreground">
                            {active.kind}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ValidatedAssumptionsForm
                    model={active}
                    onChange={updateActiveAssumptions}
                    onValidationChange={handleValidationChange}
                    autoSave={true}
                    undoStack={undoStack}
                    onUndo={handleUndo}
                  />
                  <div className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                      <h3 className="text-[13px] font-semibold tracking-wide text-foreground">
                        Quick Outputs
                      </h3>
                      <div className="flex items-center gap-2">
                        <Pill
                          tone={
                            validationIssues.filter(i => i.level === 'error').length === 0
                              ? 'green'
                              : 'red'
                          }
                        >
                          {validationIssues.filter(i => i.level === 'error').length === 0
                            ? 'Computed'
                            : 'Blocked'}
                        </Pill>
                        {active.outputs?.warnings?.length > 0 && (
                          <Pill tone="amber">{active.outputs.warnings.length} warnings</Pill>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {validationIssues.filter(i => i.level === 'error').length > 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          Fix validation errors to see outputs
                        </div>
                      ) : (
                        <>
                          {active.kind !== 'LBO' ? (
                            <QuickOutputs outputs={active.outputs} />
                          ) : (
                              <div className="rounded-xl border border-border p-3">
                                <div className="text-muted-foreground">Equity IRR (sketch)</div>
                                <div className="text-2xl font-bold">
                                  {active.outputs?.irr !== undefined
                                    ? `${(100 * active.outputs.irr).toFixed(1)}%`
                                    : '—'}
                                </div>
                              </div>
                          )}
                          {active.outputs?.warnings?.length > 0 && (
                            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[11px]">
                              <div className="font-medium text-amber-800 mb-1">Warnings:</div>
                              {active.outputs.warnings.map((warning, idx) => (
                                <div key={idx} className="text-amber-700">
                                  {warning}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <h3 className="text-[13px] font-semibold tracking-wide text-foreground">
                      Model Editor
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="text-[12px] text-muted-foreground">
                      Select a model from the library or create one from a template.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Inspector + Compare */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              {active && <DriverInspector model={active} />}
              <Compare models={models} />
              <TestsPanel tests={tests} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelLab;
