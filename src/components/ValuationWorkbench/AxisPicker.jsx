import { useState } from 'react';

import { NumberInput, Card } from 'src/components/ui/UIHelpers.jsx';
import PresetButton from '../ui/PresetButton';

// Axis configuration for sensitivity analysis
export const AxisPicker = ({ onAxisChange, currentConfig }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState(
    currentConfig || {
      wacc: { min: 0.06, max: 0.14, steps: 5 },
      growth: { min: 0.015, max: 0.035, steps: 5 },
      exitMultiple: { min: 8, max: 16, steps: 5 }
    }
  );

  const updateConfig = (axis, field, value) => {
    const newConfig = {
      ...config,
      [axis]: { ...config[axis], [field]: value }
    };
    setConfig(newConfig);
    onAxisChange?.(newConfig);
  };

  const presets = {
    conservative: {
      wacc: { min: 0.08, max: 0.12, steps: 5 },
      growth: { min: 0.02, max: 0.03, steps: 5 },
      exitMultiple: { min: 10, max: 14, steps: 5 }
    },
    aggressive: {
      wacc: { min: 0.06, max: 0.16, steps: 7 },
      growth: { min: 0.01, max: 0.05, steps: 7 },
      exitMultiple: { min: 6, max: 20, steps: 7 }
    },
    tight: {
      wacc: { min: 0.075, max: 0.105, steps: 4 },
      growth: { min: 0.02, max: 0.03, steps: 4 },
      exitMultiple: { min: 10, max: 14, steps: 4 }
    }
  };

  const applyPreset = presetName => {
    const preset = presets[presetName];
    setConfig(preset);
    onAxisChange?.(preset);
  };

  if (!isExpanded) {
    return (
      <Card className="p-3">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-[13px] text-foreground-secondary hover:text-foreground transition-colors"
        >
          ⚙️ Customize Sensitivity Ranges
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">Sensitivity Axis Configuration</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[12px] text-foreground-secondary hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <div className="text-[12px] font-medium text-foreground">Quick Presets</div>
        <div className="flex gap-2">
          {Object.keys(presets).map(preset => (
            <PresetButton key={preset} onClick={() => applyPreset(preset)} size="sm">
              {preset}
            </PresetButton>
          ))}
        </div>
      </div>

      {/* WACC Range */}
      <div className="space-y-2">
        <div className="text-[12px] font-medium text-foreground">WACC Range</div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="Min"
            value={config.wacc.min}
            onChange={val => updateConfig('wacc', 'min', val)}
            step={0.005}
            min={0.01}
            max={0.5}
            format="percent"
            placeholder="6%"
          />
          <NumberInput
            label="Max"
            value={config.wacc.max}
            onChange={val => updateConfig('wacc', 'max', val)}
            step={0.005}
            min={0.01}
            max={0.5}
            format="percent"
            placeholder="14%"
          />
          <NumberInput
            label="Steps"
            value={config.wacc.steps}
            onChange={val => updateConfig('wacc', 'steps', val)}
            step={1}
            min={3}
            max={10}
            format="integer"
            placeholder="5"
          />
        </div>
      </div>

      {/* Growth Range */}
      <div className="space-y-2">
        <div className="text-[12px] font-medium text-foreground">Terminal Growth Range</div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="Min"
            value={config.growth.min}
            onChange={val => updateConfig('growth', 'min', val)}
            step={0.0025}
            min={-0.02}
            max={0.1}
            format="percent"
            placeholder="1.5%"
          />
          <NumberInput
            label="Max"
            value={config.growth.max}
            onChange={val => updateConfig('growth', 'max', val)}
            step={0.0025}
            min={-0.02}
            max={0.1}
            format="percent"
            placeholder="3.5%"
          />
          <NumberInput
            label="Steps"
            value={config.growth.steps}
            onChange={val => updateConfig('growth', 'steps', val)}
            step={1}
            min={3}
            max={10}
            format="integer"
            placeholder="5"
          />
        </div>
      </div>

      {/* Exit Multiple Range */}
      <div className="space-y-2">
        <div className="text-[12px] font-medium text-foreground">Exit Multiple Range</div>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="Min"
            value={config.exitMultiple.min}
            onChange={val => updateConfig('exitMultiple', 'min', val)}
            step={0.5}
            min={1}
            max={50}
            format="number"
            placeholder="8x"
          />
          <NumberInput
            label="Max"
            value={config.exitMultiple.max}
            onChange={val => updateConfig('exitMultiple', 'max', val)}
            step={0.5}
            min={1}
            max={50}
            format="number"
            placeholder="16x"
          />
          <NumberInput
            label="Steps"
            value={config.exitMultiple.steps}
            onChange={val => updateConfig('exitMultiple', 'steps', val)}
            step={1}
            min={3}
            max={10}
            format="integer"
            placeholder="5"
          />
        </div>
      </div>

      {/* Current Ranges Preview */}
      <div className="pt-2 border-t border-border">
        <div className="text-[11px] text-foreground-secondary space-y-1">
          <div>
            WACC: {(config.wacc.min * 100).toFixed(1)}% → {(config.wacc.max * 100).toFixed(1)}% (
            {config.wacc.steps} steps)
          </div>
          <div>
            Growth: {(config.growth.min * 100).toFixed(1)}% → {(config.growth.max * 100).toFixed(1)}
            % ({config.growth.steps} steps)
          </div>
          <div>
            Exit Multiple: {config.exitMultiple.min.toFixed(1)}x →{' '}
            {config.exitMultiple.max.toFixed(1)}x ({config.exitMultiple.steps} steps)
          </div>
        </div>
      </div>
    </Card>
  );
};
