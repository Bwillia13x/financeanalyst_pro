#!/usr/bin/env node
/**
 * Offline a11y smoke: builds app then uses Puppeteer to load built HTML
 * via file:// and injects axe-core to audit key pages. No network/server needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// Minimal axe-core bundle inline to avoid network install at runtime.
// We will load axe-core from node_modules locally if present, else fail gracefully.
function loadAxeSource() {
  const local = path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js');
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  throw new Error('axe-core not found locally. Please ensure dev deps are installed.');
}

function resolveFileUrl(route) {
  // Support SPA: always load index.html via file:// and set SPA route via history API.
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) throw new Error('Build output missing. Run `npm run build:prod`.');
  return 'file://' + indexHtml;
}

async function runA11y(route) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(resolveFileUrl(route), { waitUntil: 'load' });
    // Simulate SPA navigation
    if (route && route !== '/') {
      await page.evaluate((r) => {
        history.pushState({}, '', r);
        window.dispatchEvent(new Event('popstate'));
      }, route);
      await page.waitForTimeout(300);
    }
    const axe = loadAxeSource();
    await page.addScriptTag({ content: axe });
    const results = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        resultTypes: ['violations'],
        rules: { 'color-contrast': { enabled: true } }
      });
    });
    return results;
  } finally {
    await browser.close();
  }
}

function printResults(route, results) {
  if (!results || !results.violations || results.violations.length === 0) {
    console.log(`✅ ${route}: no axe violations`);
    return 0;
  }
  console.log(`❌ ${route}: ${results.violations.length} violation(s)`);
  for (const v of results.violations) {
    console.log(`- ${v.id}: ${v.help} [impact=${v.impact}]`);
    const nodes = v.nodes?.slice(0, 5) || [];
    for (const n of nodes) {
      console.log(`  • ${n.target?.[0]}: ${n.failureSummary?.split('\n')[0] || ''}`);
    }
  }
  return results.violations.length;
}

async function main() {
  try {
    const routes = ['/', '/analytics', '/performance'];
    let failures = 0;
    for (const r of routes) {
      const res = await runA11y(r);
      failures += printResults(r, res);
    }
    if (failures) process.exit(1);
    console.log('✅ Offline a11y smoke passed');
  } catch (e) {
    console.error('A11y offline smoke failed:', e.message || e);
    process.exit(2);
  }
}

main();

