import { AxeBuilder } from '@axe-core/playwright';

/**
 * Run an axe-core accessibility scan against the current page.
 * @param {import('@playwright/test').Page} page
 * @param {Object} [options]
 * @param {Array<string|import('@axe-core/playwright').AxeSelector>} [options.include]
 * @param {Array<string|import('@axe-core/playwright').AxeSelector>} [options.exclude]
 * @param {string[]} [options.tags] e.g. ['wcag2a', 'wcag2aa']
 * @param {Record<string, any>} [options.rules]
 * @returns {Promise<import('axe-core').AxeResults>}
 */
export async function runA11yScan(page, options = {}) {
  const builder = new AxeBuilder({ page });
  if (options.include) builder.include(options.include);
  if (options.exclude) builder.exclude(options.exclude);
  if (options.tags) builder.withTags(options.tags);
  if (options.rules) builder.withRules(options.rules);
  return builder.analyze();
}

/**
 * Fail if there are critical/serious violations, with concise output.
 * @param {import('axe-core').AxeResults} results
 * @param {{ allow?: string[], impactLevels?: string[] }} [opts]
 */
export function assertNoSeriousViolations(results, opts = {}) {
  const allow = new Set(opts.allow || []);
  const impactLevels = new Set(opts.impactLevels || ['critical', 'serious']);
  const violations = (results.violations || []).filter(v => impactLevels.has(v.impact) && !allow.has(v.id));
  if (violations.length === 0) return;

  const lines = violations.flatMap(v => {
    const nodes = (v.nodes || []).slice(0, 5).map(n => `    - ${n.target?.join(' ')}${n.failureSummary ? ` -> ${n.failureSummary}` : ''}`);
    return [
      `• [${v.impact}] ${v.id}: ${v.help} (${v.helpUrl})`,
      ...nodes,
      nodes.length === 5 ? '    - … (truncated)' : undefined
    ].filter(Boolean);
  });

  const message = [
    `Accessibility violations (${violations.length}):`,
    ...lines
  ].join('\n');

  throw new Error(message);
}
