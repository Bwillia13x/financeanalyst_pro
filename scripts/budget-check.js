#!/usr/bin/env node
/*
  Simple Lighthouse budget checker for Valor-IVX
  Usage: node scripts/budget-check.js [lighthouse_json_path]
*/
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const lhPath = process.argv[2] || path.join(cwd, 'perf-results.json');
const budgetPath = path.join(cwd, 'performance-budgets.json');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ms(val) {
  return typeof val === 'number' ? `${Math.round(val)}ms` : String(val);
}

function main() {
  if (!fs.existsSync(lhPath)) {
    console.error(`Lighthouse results not found at ${lhPath}. Run: npm run perf:check`);
    process.exit(2);
  }
  if (!fs.existsSync(budgetPath)) {
    console.error(`Budgets file not found at ${budgetPath}`);
    process.exit(2);
  }

  const lh = readJSON(lhPath);
  const budgets = readJSON(budgetPath);

  const env = process.env.NODE_ENV === 'production' ? 'production' : (process.env.NODE_ENV || 'development');
  const multipliers = budgets.environments?.[env]?.multipliers || { performance: 1 };

  const audits = lh.audits || {};
  const categories = lh.categories || {};

  const perfScore = (categories.performance?.score ?? 0) * 100;
  const fcp = audits['first-contentful-paint']?.numericValue;
  const lcp = audits['largest-contentful-paint']?.numericValue;
  const cls = audits['cumulative-layout-shift']?.numericValue;

  const results = [];

  // Performance score target
  const targetScore = env === 'production' ? 90 : 70;
  if (perfScore < targetScore) {
    results.push({ level: 'error', name: 'Performance Score', details: `${perfScore.toFixed(0)} < ${targetScore}` });
  } else {
    results.push({ level: 'pass', name: 'Performance Score', details: `${perfScore.toFixed(0)} >= ${targetScore}` });
  }

  // Metric budgets
  const perfBudgets = (budgets.budgets?.performance?.budgets || []).reduce((acc, b) => {
    acc[b.metric] = b; return acc;
  }, {});

  function checkMetric(metric, value) {
    const b = perfBudgets[metric];
    if (!b || typeof value !== 'number') return; // skip missing
    const limit = (b.budget.value || 0) * (multipliers.performance || 1);
    const ok = metric === 'CLS' ? value <= limit : value <= limit;
    results.push({
      level: ok ? 'pass' : (b.severity === 'error' ? 'error' : 'warn'),
      name: metric,
      details: ok
        ? `${metric} ${metric === 'CLS' ? value.toFixed(3) : ms(value)} ≤ ${metric === 'CLS' ? limit : ms(limit)}`
        : `${metric} ${metric === 'CLS' ? value.toFixed(3) : ms(value)} > ${metric === 'CLS' ? limit : ms(limit)}`
    });
  }

  checkMetric('FCP', fcp);
  checkMetric('LCP', lcp);
  checkMetric('CLS', cls);

  const errors = results.filter(r => r.level === 'error');
  const warns = results.filter(r => r.level === 'warn');

  // Pretty print
  console.log(`\nLighthouse Budget Check (${env})\n--------------------------------`);
  for (const r of results) {
    const icon = r.level === 'pass' ? '✅' : r.level === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${r.name}: ${r.details}`);
  }

  if (errors.length) {
    console.error(`\nBudget check failed with ${errors.length} error(s).`);
    process.exit(1);
  }
  if (warns.length) {
    console.warn(`\nBudget check completed with ${warns.length} warning(s).`);
  }
}

main();

