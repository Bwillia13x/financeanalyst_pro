import React from 'react';

import { wacc } from '../../utils/valuationUtils';

// Error validation and user guidance system
export function validateAssumptions(assumptions) {
  const errors = [];
  const warnings = [];
  const disc = wacc(assumptions);

  // Critical errors that prevent valuation
  if (assumptions.terminalMethod === 'gordon' && disc <= assumptions.tg) {
    errors.push({
      type: 'gordon_constraint',
      message: 'WACC ≤ Terminal Growth Rate',
      guidance: `WACC (${(disc * 100).toFixed(1)}%) must exceed terminal growth (${(assumptions.tg * 100).toFixed(1)}%). Try lowering terminal growth or increasing WACC components.`,
      severity: 'critical'
    });
  }

  if (assumptions.shares <= 0) {
    errors.push({
      type: 'shares_invalid',
      message: 'Invalid Share Count',
      guidance: 'Shares outstanding must be positive to calculate per-share value.',
      severity: 'critical'
    });
  }

  if (assumptions.price <= 0) {
    warnings.push({
      type: 'price_zero',
      message: 'Zero Stock Price',
      guidance: 'Margin of Safety calculation may be unreliable with zero price.',
      severity: 'warning'
    });
  }

  // Business logic warnings
  if (assumptions.salesToCapital < 0.5) {
    warnings.push({
      type: 'low_stc',
      message: 'Very Low Sales-to-Capital',
      guidance: `Sales-to-Capital of ${assumptions.salesToCapital.toFixed(1)}x implies very high reinvestment needs. Consider if this is realistic.`,
      severity: 'warning'
    });
  }

  if (assumptions.ebitMarginT > 0.4) {
    warnings.push({
      type: 'high_margin',
      message: 'Very High Terminal Margin',
      guidance: `Terminal EBIT margin of ${(assumptions.ebitMarginT * 100).toFixed(1)}% is unusually high. Verify competitive sustainability.`,
      severity: 'warning'
    });
  }

  // Terminal value sanity checks
  if (assumptions.terminalMethod === 'exitMultiple' && assumptions.exitEVMultiple > 20) {
    warnings.push({
      type: 'high_multiple',
      message: 'High Exit Multiple',
      guidance: `Exit multiple of ${assumptions.exitEVMultiple.toFixed(1)}x may produce unrealistic terminal values.`,
      severity: 'warning'
    });
  }

  if (assumptions.rf < 0) {
    warnings.push({
      type: 'negative_rf',
      message: 'Negative Risk-Free Rate',
      guidance:
        'Negative risk-free rates can create unusual WACC dynamics. Verify your rate source.',
      severity: 'warning'
    });
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

export const ErrorDisplay = ({ validation }) => {
  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {validation.errors.map((error, index) => (
        <div key={`error-${index}`} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">!</span>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-rose-800">{error.message}</div>
              <div className="text-[12px] text-rose-700 mt-1">{error.guidance}</div>
            </div>
          </div>
        </div>
      ))}

      {validation.warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">?</span>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-amber-800">{warning.message}</div>
              <div className="text-[12px] text-amber-700 mt-1">{warning.guidance}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
