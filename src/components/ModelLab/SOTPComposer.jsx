import { Plus, Minus, Copy, Trash2, Calculator, PieChart, BarChart3, Target } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';

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
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
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

const SOTPComponent = ({
  component,
  onUpdate,
  onRemove,
  onDuplicate,
  availableModels = [],
  isEditable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
      value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
        `$${value.toLocaleString()}`;
  };

  const getComponentIcon = (type) => {
    switch (type) {
      case 'model': return <Calculator className="w-3 h-3" />;
      case 'manual': return <Target className="w-3 h-3" />;
      case 'adjustment': return <BarChart3 className="w-3 h-3" />;
      default: return <PieChart className="w-3 h-3" />;
    }
  };

  const getComponentColor = (type) => {
    switch (type) {
      case 'model': return 'blue';
      case 'manual': return 'green';
      case 'adjustment': return 'amber';
      default: return 'slate';
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[11px] transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>

            <div className="flex items-center gap-2">
              <Pill tone={getComponentColor(component.type)} size="xs">
                {getComponentIcon(component.type)}
                {component.type}
              </Pill>
              <span className="text-[12px] font-medium">{component.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-slate-700">
              {formatCurrency(component.value)}
            </span>
            <span className="text-[10px] text-slate-500">
              ({component.weight?.toFixed(1)}%)
            </span>

            {isEditable && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDuplicate(component)}
                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemove(component.id)}
                  className="w-5 h-5 rounded bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            {/* Component configuration */}
            {component.type === 'model' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Source Model
                </label>
                <select
                  value={component.modelId || ''}
                  onChange={(e) => onUpdate(component.id, { modelId: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                >
                  <option value="">Select model...</option>
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.kind}) - {formatCurrency(model.outputs?.ev)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {component.type === 'manual' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Manual Value
                </label>
                <input
                  type="number"
                  value={component.manualValue || 0}
                  onChange={(e) => onUpdate(component.id, { manualValue: parseFloat(e.target.value) || 0 })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                  placeholder="Enter value..."
                />
              </div>
            )}

            {component.type === 'adjustment' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={component.adjustmentType || 'add'}
                    onChange={(e) => onUpdate(component.id, { adjustmentType: e.target.value })}
                    className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                    disabled={!isEditable}
                  >
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                    <option value="multiply">Multiply</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={component.adjustmentValue || 0}
                    onChange={(e) => onUpdate(component.id, { adjustmentValue: parseFloat(e.target.value) || 0 })}
                    className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                    disabled={!isEditable}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={component.description || ''}
                onChange={(e) => onUpdate(component.id, { description: e.target.value })}
                className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded h-16 resize-none"
                disabled={!isEditable}
                placeholder="Component description..."
              />
            </div>

            {/* Component metadata */}
            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
              <div>ID: {component.id}</div>
              <div>Created: {new Date(component.createdAt).toLocaleDateString()}</div>
              {component.lastUpdated && (
                <div>Updated: {new Date(component.lastUpdated).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SOTPComposer = ({ models = [], onSave }) => {
  const [composition, setComposition] = useState({
    id: `sotp_${Date.now()}`,
    name: 'New SOTP Analysis',
    description: '',
    components: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponentType, setNewComponentType] = useState('model');

  // Calculate total value and component weights
  const totalValue = useMemo(() => {
    return composition.components.reduce((sum, component) => {
      let value = 0;

      if (component.type === 'model' && component.modelId) {
        const model = models.find(m => m.id === component.modelId);
        value = model?.outputs?.ev || 0;
      } else if (component.type === 'manual') {
        value = component.manualValue || 0;
      } else if (component.type === 'adjustment') {
        const baseValue = sum; // Apply to running total
        switch (component.adjustmentType) {
          case 'add': value = component.adjustmentValue || 0; break;
          case 'subtract': value = -(component.adjustmentValue || 0); break;
          case 'multiply': value = baseValue * ((component.adjustmentValue || 1) - 1); break;
          case 'discount': value = -baseValue * ((component.adjustmentValue || 0) / 100); break;
          default: value = 0;
        }
      }

      return sum + value;
    }, 0);
  }, [composition.components, models]);

  // Update component weights
  const componentsWithWeights = useMemo(() => {
    return composition.components.map(component => {
      let value = 0;

      if (component.type === 'model' && component.modelId) {
        const model = models.find(m => m.id === component.modelId);
        value = model?.outputs?.ev || 0;
      } else if (component.type === 'manual') {
        value = component.manualValue || 0;
      } else if (component.type === 'adjustment') {
        value = component.adjustmentValue || 0;
      }

      const weight = totalValue > 0 ? (Math.abs(value) / totalValue) * 100 : 0;

      return {
        ...component,
        value,
        weight
      };
    });
  }, [composition.components, totalValue, models]);

  const addComponent = useCallback((type) => {
    const newComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      name: `New ${type} component`,
      description: '',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...(type === 'model' && { modelId: null }),
      ...(type === 'manual' && { manualValue: 0 }),
      ...(type === 'adjustment' && { adjustmentType: 'add', adjustmentValue: 0 })
    };

    setComposition(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
      lastUpdated: new Date().toISOString()
    }));

    setShowAddComponent(false);
  }, []);

  const updateComponent = useCallback((componentId, updates) => {
    setComposition(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === componentId
          ? { ...comp, ...updates, lastUpdated: new Date().toISOString() }
          : comp
      ),
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const removeComponent = useCallback((componentId) => {
    setComposition(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const duplicateComponent = useCallback((component) => {
    const duplicated = {
      ...component,
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${component.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    setComposition(prev => ({
      ...prev,
      components: [...prev.components, duplicated],
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const saveComposition = () => {
    if (onSave) {
      onSave({
        ...composition,
        totalValue,
        components: componentsWithWeights
      });
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
      value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
        `$${value.toLocaleString()}`;
  };

  return (
    <Card
      title="SOTP Composer"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="purple">{composition.components.length} components</Pill>
          <Pill tone="green">{formatCurrency(totalValue)}</Pill>
          <button
            onClick={() => setShowAddComponent(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title="Add component"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      }
    >
      {/* Composition metadata */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={composition.name}
          onChange={(e) => setComposition(prev => ({ ...prev, name: e.target.value }))}
          className="w-full text-[13px] font-medium px-2 py-1 border border-slate-200 rounded"
          placeholder="SOTP Analysis Name"
        />
        <textarea
          value={composition.description}
          onChange={(e) => setComposition(prev => ({ ...prev, description: e.target.value }))}
          className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded h-16 resize-none"
          placeholder="Analysis description..."
        />
      </div>

      {/* Add component modal */}
      {showAddComponent && (
        <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium">Add Component</h4>
            <button
              onClick={() => setShowAddComponent(false)}
              className="w-5 h-5 rounded bg-white hover:bg-slate-50 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { type: 'model', label: 'Model', icon: Calculator },
              { type: 'manual', label: 'Manual', icon: Target },
              { type: 'adjustment', label: 'Adjustment', icon: BarChart3 }
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setNewComponentType(type)}
                className={`p-2 rounded border text-[11px] transition-colors ${
                  newComponentType === type
                    ? 'border-blue-300 bg-blue-100 text-blue-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3 h-3 mx-auto mb-1" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => addComponent(newComponentType)}
            className="w-full px-3 py-2 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add {newComponentType} Component
          </button>
        </div>
      )}

      {/* Components list */}
      <div className="space-y-3">
        {componentsWithWeights.map(component => (
          <SOTPComponent
            key={component.id}
            component={component}
            onUpdate={updateComponent}
            onRemove={removeComponent}
            onDuplicate={duplicateComponent}
            availableModels={models}
          />
        ))}

        {composition.components.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <PieChart className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-[13px]">No components added yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add models, manual values, or adjustments to build your SOTP analysis
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {composition.components.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-[11px] font-medium text-slate-700 mb-2">Composition Summary</div>
          <div className="grid grid-cols-3 gap-3 text-[10px]">
            <div className="text-center">
              <div className="font-bold text-[14px] text-purple-600">{composition.components.length}</div>
              <div className="text-slate-600">Components</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-[14px] text-green-600">{formatCurrency(totalValue)}</div>
              <div className="text-slate-600">Total Value</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-[14px] text-blue-600">
                {models.filter(m => composition.components.some(c => c.modelId === m.id)).length}
              </div>
              <div className="text-slate-600">Models Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={saveComposition}
          className="flex-1 px-3 py-2 text-[11px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
        >
          Save Composition
        </button>
        <button
          onClick={() => {
            const data = { ...composition, totalValue, components: componentsWithWeights };
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            alert('SOTP composition copied to clipboard');
          }}
          className="px-3 py-2 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
        >
          Export
        </button>
      </div>
    </Card>
  );
};

export default SOTPComposer;
