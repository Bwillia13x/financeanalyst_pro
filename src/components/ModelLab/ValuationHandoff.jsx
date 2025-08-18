import { ArrowRight, Zap, Calculator, TrendingUp, FileText, Settings } from 'lucide-react';
import React, { useState } from 'react';

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
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
};

const HandoffOption = ({
  title,
  description,
  icon: Icon,
  tone,
  path,
  disabled = false,
  onClick,
  modelCompatibility
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
      disabled
        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`p-2 rounded-lg ${
          tone === 'blue' ? 'bg-blue-100 text-blue-600' :
            tone === 'green' ? 'bg-emerald-100 text-emerald-600' :
              tone === 'purple' ? 'bg-purple-100 text-purple-600' :
                tone === 'amber' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[13px] font-medium group-hover:text-blue-700 transition-colors">
            {title}
          </h4>
          {!disabled && (
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
          )}
        </div>

        <p className="text-[11px] text-slate-600 mb-2">{description}</p>

        <div className="flex flex-wrap gap-1">
          {modelCompatibility.map(model => (
            <Pill key={model} tone="slate" size="xs">{model}</Pill>
          ))}
        </div>
      </div>
    </div>
  </button>
);

const ValuationHandoff = ({ model, onHandoff }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [handoffConfig, setHandoffConfig] = useState({
    includeAssumptions: true,
    includeOutputs: true,
    includeHistory: false,
    analysisMode: 'standard'
  });

  const handoffOptions = [
    {
      id: 'private-analysis',
      title: 'Private Analysis Workspace',
      description: 'Transfer to comprehensive 3-statement modeling and scenario analysis',
      icon: Calculator,
      tone: 'blue',
      path: '/private-analysis',
      modelCompatibility: ['DCF', 'LBO', 'Comps', 'EPV'],
      disabled: false,
      features: [
        'Full 3-statement modeling',
        'Advanced scenario analysis',
        'Monte Carlo simulation',
        'Peer benchmarking',
        'Presentation-ready output'
      ]
    },
    {
      id: 'financial-workspace',
      title: 'Financial Model Workspace',
      description: 'Advanced integrated modeling with real-time validation',
      icon: TrendingUp,
      tone: 'green',
      path: '/financial-model-workspace',
      modelCompatibility: ['DCF', 'LBO'],
      disabled: false,
      features: [
        'Integrated 3-statement models',
        'Real-time cross-validation',
        'Advanced debt scheduling',
        'Sensitivity analysis',
        'Professional templates'
      ]
    },
    {
      id: 'lbo-tool',
      title: 'Advanced LBO Tool',
      description: 'Specialized LBO modeling with debt schedules and returns analysis',
      icon: Zap,
      tone: 'purple',
      path: '/advanced-lbo',
      modelCompatibility: ['LBO'],
      disabled: model?.kind !== 'LBO',
      features: [
        'Detailed debt schedules',
        'Multiple financing structures',
        'Returns waterfall',
        'Scenario modeling',
        'Credit metrics analysis'
      ]
    },
    {
      id: 'scenario-analysis',
      title: 'Enhanced Scenario Analysis',
      description: 'Cross-model scenario analysis with probability weighting',
      icon: Settings,
      tone: 'amber',
      path: '/scenario-analysis',
      modelCompatibility: ['DCF', 'LBO', 'Comps', 'EPV'],
      disabled: false,
      features: [
        'Multi-model scenarios',
        'Probability weighting',
        'Correlation analysis',
        'Risk assessment',
        'Decision trees'
      ]
    }
  ];

  const availableOptions = handoffOptions.filter(option =>
    !option.disabled && option.modelCompatibility.includes(model?.kind)
  );

  const handleHandoff = (option) => {
    if (!model) return;

    const handoffData = {
      sourceModel: {
        id: model.id,
        name: model.name,
        kind: model.kind,
        version: model.version,
        assumptions: handoffConfig.includeAssumptions ? model.assumptions : {},
        outputs: handoffConfig.includeOutputs ? model.outputs : {},
        metadata: {
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
          source: 'ModelLab'
        }
      },
      handoffConfig,
      timestamp: new Date().toISOString(),
      targetWorkspace: option.id
    };

    // Store handoff data for the target workspace
    localStorage.setItem('valuation_handoff', JSON.stringify(handoffData));

    // Navigate to target workspace
    if (onHandoff) {
      onHandoff(option, handoffData);
    } else {
      // Fallback navigation
      window.location.href = option.path + '?handoff=true';
    }
  };

  const formatValue = (value, type = 'currency') => {
    if (!value || value === 0) return '—';

    if (type === 'currency') {
      return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
        value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
          `$${value.toLocaleString()}`;
    }
    if (type === 'percentage') return `${(value * 100).toFixed(1)}%`;
    if (type === 'multiple') return `${value.toFixed(1)}x`;
    return value.toLocaleString();
  };

  if (!model) {
    return (
      <Card title="Valuation Handoff">
        <div className="text-center py-8 text-slate-500">
          <p className="text-[13px]">Select a model to enable handoff options</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Valuation Handoff"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="amber">{model.kind}</Pill>
          <Pill tone="blue">{availableOptions.length} options</Pill>
        </div>
      }
    >
      {/* Model summary */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-[11px] font-medium text-slate-700 mb-2">Current Model</div>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div>
            <div className="text-slate-600">Name</div>
            <div className="font-medium">{model.name || 'Untitled'}</div>
          </div>
          <div>
            <div className="text-slate-600">Type</div>
            <div className="font-medium">{model.kind}</div>
          </div>
          {model.outputs?.ev && (
            <div>
              <div className="text-slate-600">Enterprise Value</div>
              <div className="font-medium">{formatValue(model.outputs.ev)}</div>
            </div>
          )}
          {model.outputs?.perShare && (
            <div>
              <div className="text-slate-600">Per Share</div>
              <div className="font-medium">{formatValue(model.outputs.perShare)}</div>
            </div>
          )}
          {model.outputs?.irr && (
            <div>
              <div className="text-slate-600">IRR</div>
              <div className="font-medium">{formatValue(model.outputs.irr, 'percentage')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Handoff configuration */}
      <div className="mb-4 p-3 border border-slate-200 rounded-lg">
        <div className="text-[11px] font-medium text-slate-700 mb-2">Handoff Configuration</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              checked={handoffConfig.includeAssumptions}
              onChange={(e) => setHandoffConfig(prev => ({
                ...prev,
                includeAssumptions: e.target.checked
              }))}
              className="w-3 h-3"
            />
            Include assumptions
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              checked={handoffConfig.includeOutputs}
              onChange={(e) => setHandoffConfig(prev => ({
                ...prev,
                includeOutputs: e.target.checked
              }))}
              className="w-3 h-3"
            />
            Include calculated outputs
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              checked={handoffConfig.includeHistory}
              onChange={(e) => setHandoffConfig(prev => ({
                ...prev,
                includeHistory: e.target.checked
              }))}
              className="w-3 h-3"
            />
            Include version history
          </label>
        </div>
      </div>

      {/* Available handoff options */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium text-slate-700">
          Available Workspaces ({availableOptions.length})
        </div>

        {availableOptions.map(option => (
          <HandoffOption
            key={option.id}
            {...option}
            onClick={() => handleHandoff(option)}
            modelCompatibility={[model.kind]}
          />
        ))}

        {availableOptions.length === 0 && (
          <div className="text-center py-6 text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-[13px]">No compatible workspaces for {model.kind} model</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Try a different model type or check back later
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="text-[11px] font-medium text-slate-700 mb-2">Quick Actions</div>
        <div className="flex gap-2">
          <button
            onClick={() => handleHandoff(availableOptions[0])}
            disabled={!availableOptions[0]}
            className="flex-1 px-3 py-2 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Quick Handoff
          </button>
          <button
            onClick={() => {
              const data = {
                model,
                handoffConfig,
                timestamp: new Date().toISOString()
              };
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              alert('Model data copied to clipboard');
            }}
            className="px-3 py-2 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            Copy Data
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-blue-700">
        <strong>Tip:</strong> Handoff will transfer your model to the selected workspace while preserving all data and assumptions. You can return to Model Lab anytime to continue iterating.
      </div>
    </Card>
  );
};

export default ValuationHandoff;
