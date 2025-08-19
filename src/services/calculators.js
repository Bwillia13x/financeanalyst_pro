// Calculator Plugin System for Model Lab

/**
 * DCF Calculator Plugin
 */
const DCFCalculator = {
  kind: 'DCF',

  compute(assumptions, _config = {}) {
    const a = assumptions;
    const warnings = [];

    // Extract key assumptions with defaults
    const rev0 = a.rev0 || 0;
    const margin = a.margin || 0.15;
    const tax = a.tax || 0.23;
    const g = a.g || 0.05;
    const tg = a.tg || 0.02;
    const wacc = a.wacc || 0.09;
    const netDebt = a.netDebt || 0;
    const shares = Math.max(1, a.shares || 1);

    // Gordon growth model guard
    if (wacc <= tg) {
      warnings.push('WACC must be greater than terminal growth rate');
      return { warnings };
    }

    // Calculate EBIT and NOPAT
    const EBIT = rev0 * margin;
    const NOPAT0 = EBIT * (1 - tax);

    // 5-year DCF projection
    const years = 5;
    let pv = 0;
    let fcff = NOPAT0;

    for (let t = 1; t <= years; t++) {
      fcff = fcff * (1 + g);
      pv += fcff / Math.pow(1 + wacc, t);
    }

    // Terminal value calculation
    const fcff5 = fcff;
    const tv = (fcff5 * (1 + tg)) / (wacc - tg);
    const pvTV = tv / Math.pow(1 + wacc, years);

    // Final valuation
    const ev = pv + pvTV;
    const equity = ev - netDebt;
    const perShare = equity / shares;

    // Add warnings for edge cases
    if (ev < 0) warnings.push('Negative enterprise value - check assumptions');
    if (perShare < 0) warnings.push('Negative per-share value - high net debt relative to EV');
    if (tv / ev > 0.8) warnings.push('Terminal value >80% of EV - consider longer projection period');

    return { ev, perShare, warnings };
  },

  validate(assumptions) {
    const issues = [];
    const a = assumptions;

    // Required fields
    if (!a.rev0 || a.rev0 <= 0) issues.push({ field: 'rev0', level: 'error', message: 'Revenue must be positive' });
    if (!a.shares || a.shares <= 0) issues.push({ field: 'shares', level: 'error', message: 'Shares outstanding must be positive' });

    // Range validations
    if (a.margin < 0 || a.margin > 0.6) issues.push({ field: 'margin', level: 'warn', message: 'EBIT margin outside typical range (0-60%)' });
    if (a.tax < 0 || a.tax > 0.6) issues.push({ field: 'tax', level: 'warn', message: 'Tax rate outside typical range (0-60%)' });
    if (a.wacc < 0.02 || a.wacc > 0.25) issues.push({ field: 'wacc', level: 'warn', message: 'WACC outside typical range (2-25%)' });
    if (a.g < -0.2 || a.g > 0.2) issues.push({ field: 'g', level: 'warn', message: 'Growth rate outside typical range (-20% to +20%)' });
    if (a.tg < -0.02 || a.tg > 0.05) issues.push({ field: 'tg', level: 'warn', message: 'Terminal growth outside typical range (-2% to +5%)' });

    // Domain rules
    if (a.wacc <= a.tg) issues.push({ field: 'wacc', level: 'error', message: 'WACC must be greater than terminal growth rate' });

    return issues;
  }
};

/**
 * Comps Calculator Plugin
 */
const CompsCalculator = {
  kind: 'Comps',

  compute(assumptions, _config = {}) {
    const a = assumptions;
    const warnings = [];

    const metric = a.metric || 0;
    const multiple = a.multiple || 8;
    const netDebt = a.netDebt || 0;
    const shares = Math.max(1, a.shares || 1);

    if (metric <= 0) {
      warnings.push('Metric (EBITDA) must be positive for meaningful valuation');
      return { warnings };
    }

    const ev = multiple * metric;
    const equity = ev - netDebt;
    const perShare = equity / shares;

    if (perShare < 0) warnings.push('Negative per-share value - high net debt relative to EV');
    if (multiple < 3 || multiple > 30) warnings.push('Multiple outside typical range (3x-30x)');

    return { ev, perShare, warnings };
  },

  validate(assumptions) {
    const issues = [];
    const a = assumptions;

    if (!a.metric || a.metric <= 0) issues.push({ field: 'metric', level: 'error', message: 'Metric must be positive' });
    if (!a.multiple || a.multiple <= 0) issues.push({ field: 'multiple', level: 'error', message: 'Multiple must be positive' });
    if (!a.shares || a.shares <= 0) issues.push({ field: 'shares', level: 'error', message: 'Shares outstanding must be positive' });

    if (a.multiple < 2 || a.multiple > 40) issues.push({ field: 'multiple', level: 'warn', message: 'Multiple outside typical range (2x-40x)' });

    return issues;
  }
};

/**
 * EPV Calculator Plugin
 */
const EPVCalculator = {
  kind: 'EPV',

  compute(assumptions, _config = {}) {
    const a = assumptions;
    const warnings = [];

    const ebit = a.ebit || 0;
    const tax = a.tax || 0.23;
    const wacc = Math.max(0.02, a.wacc || 0.09);
    const netDebt = a.netDebt || 0;
    const shares = Math.max(1, a.shares || 1);

    if (ebit <= 0) {
      warnings.push('EBIT must be positive for EPV calculation');
      return { warnings };
    }

    const nopat = ebit * (1 - tax);
    const ev = nopat / wacc;
    const equity = ev - netDebt;
    const perShare = equity / shares;

    if (perShare < 0) warnings.push('Negative per-share value - high net debt relative to EV');
    if (wacc < 0.05) warnings.push('Very low WACC may overstate EPV');

    return { ev, perShare, warnings };
  },

  validate(assumptions) {
    const issues = [];
    const a = assumptions;

    if (!a.ebit || a.ebit <= 0) issues.push({ field: 'ebit', level: 'error', message: 'EBIT must be positive' });
    if (!a.shares || a.shares <= 0) issues.push({ field: 'shares', level: 'error', message: 'Shares outstanding must be positive' });

    if (a.tax < 0 || a.tax > 0.6) issues.push({ field: 'tax', level: 'warn', message: 'Tax rate outside typical range (0-60%)' });
    if (a.wacc < 0.02 || a.wacc > 0.25) issues.push({ field: 'wacc', level: 'warn', message: 'WACC outside typical range (2-25%)' });

    return issues;
  }
};

/**
 * LBO Calculator Plugin
 */
const LBOCalculator = {
  kind: 'LBO',

  compute(assumptions, _config = {}) {
    const a = assumptions;
    const warnings = [];

    const ebitda0 = a.ebitda || 0;
    const entryX = a.entryX || 8;
    const exitX = a.exitX || 8;
    const debtPct = Math.min(0.9, Math.max(0, a.debtPct || 0.5));
    const years = Math.max(1, Math.min(10, Math.round(a.years || 5)));
    const ebitdaCAGR = a.ebitdaCAGR || 0.05;

    if (ebitda0 <= 0) {
      warnings.push('EBITDA must be positive for LBO analysis');
      return { warnings };
    }

    // Entry valuation
    const entryEV = ebitda0 * entryX;
    const debt0 = entryEV * debtPct;
    const equity0 = Math.max(1, entryEV - debt0);

    // Exit valuation
    const ebitdaN = ebitda0 * Math.pow(1 + ebitdaCAGR, years);
    const exitEV = ebitdaN * exitX;

    // Simplified debt paydown (10% per year from FCF)
    const debtN = Math.max(0, debt0 * Math.pow(0.9, years));
    const exitEquity = Math.max(1, exitEV - debtN);

    // Returns calculation
    const moic = exitEquity / equity0;
    const irr = Math.max(-0.99, Math.pow(moic, 1 / years) - 1);

    // Warnings
    if (irr < 0.15) warnings.push('IRR below typical PE target (15%+)');
    if (debtPct > 0.7) warnings.push('High leverage ratio may increase risk');
    if (entryX > exitX + 2) warnings.push('Entry multiple significantly higher than exit - check assumptions');

    return { irr, warnings };
  },

  validate(assumptions) {
    const issues = [];
    const a = assumptions;

    if (!a.ebitda || a.ebitda <= 0) issues.push({ field: 'ebitda', level: 'error', message: 'EBITDA must be positive' });
    if (!a.entryX || a.entryX <= 0) issues.push({ field: 'entryX', level: 'error', message: 'Entry multiple must be positive' });
    if (!a.exitX || a.exitX <= 0) issues.push({ field: 'exitX', level: 'error', message: 'Exit multiple must be positive' });

    if (a.debtPct < 0 || a.debtPct > 0.9) issues.push({ field: 'debtPct', level: 'error', message: 'Debt percentage must be between 0-90%' });
    if (a.years < 1 || a.years > 10) issues.push({ field: 'years', level: 'error', message: 'Hold period must be 1-10 years' });

    if (a.entryX < 2 || a.entryX > 30) issues.push({ field: 'entryX', level: 'warn', message: 'Entry multiple outside typical range (2x-30x)' });
    if (a.exitX < 2 || a.exitX > 30) issues.push({ field: 'exitX', level: 'warn', message: 'Exit multiple outside typical range (2x-30x)' });
    if (a.ebitdaCAGR < -0.3 || a.ebitdaCAGR > 0.5) issues.push({ field: 'ebitdaCAGR', level: 'warn', message: 'EBITDA growth outside typical range (-30% to +50%)' });

    return issues;
  }
};

/**
 * Plugin Registry
 */
export const plugins = {
  DCF: DCFCalculator,
  Comps: CompsCalculator,
  EPV: EPVCalculator,
  LBO: LBOCalculator
};

/**
 * Compute outputs for a model using appropriate plugin
 */
export function computeModelOutputs(model) {
  const plugin = plugins[model.kind];
  if (!plugin) {
    console.warn(`No calculator plugin found for model kind: ${model.kind}`);
    return { warnings: [`No calculator available for ${model.kind}`] };
  }

  try {
    return plugin.compute(model.assumptions);
  } catch (error) {
    console.error(`Calculator error for ${model.kind}:`, error);
    return { warnings: [`Calculation error: ${error.message}`] };
  }
}

/**
 * Validate model assumptions using appropriate plugin
 */
export function validateModelAssumptions(model) {
  const plugin = plugins[model.kind];
  if (!plugin || !plugin.validate) {
    return [];
  }

  try {
    return plugin.validate(model.assumptions);
  } catch (error) {
    console.error(`Validation error for ${model.kind}:`, error);
    return [{ field: 'general', level: 'error', message: `Validation error: ${error.message}` }];
  }
}
