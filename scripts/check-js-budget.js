#!/usr/bin/env node
/*
 Checks gzipped JS sizes in dist/assets against performance-budgets.json.
 Currently enforces the 'total-js' budget (gzipped) across all JS files.
*/
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.join(process.cwd(), 'dist', 'assets');
const budgetFile = path.join(process.cwd(), 'performance-budgets.json');

function gzipSizeSync(buf) {
  return zlib.gzipSync(buf).length;
}

function bytesToKB(b) {
  return Math.round((b / 1024) * 100) / 100;
}

function parseSizeToBytes(sizeStr) {
  const m = /^(\d+)\s*(kb|mb|b)?$/i.exec(String(sizeStr).trim());
  if (!m) return null;
  const v = parseInt(m[1], 10);
  const unit = (m[2] || 'b').toLowerCase();
  if (unit === 'kb') return v * 1024;
  if (unit === 'mb') return v * 1024 * 1024;
  return v;
}

function getTotalJsGzipSize() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/assets not found. Run `npm run build:prod` first.');
    process.exit(2);
  }
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  let total = 0;
  for (const f of files) {
    const p = path.join(distDir, f);
    const buf = fs.readFileSync(p);
    total += gzipSizeSync(buf);
  }
  return { files, total };
}

function main() {
  const budgets = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));
  const totalJsBudget = budgets?.budgets?.bundle?.budgets?.find(b => b.name === 'total-js');
  if (!totalJsBudget && !process.env.TOTAL_JS_BUDGET_KB) {
    console.warn('No total-js budget found in performance-budgets.json');
    process.exit(0);
  }
  const envOverrideKB = parseInt(process.env.TOTAL_JS_BUDGET_KB || process.env.JS_TOTAL_BUDGET_KB || 'NaN', 10);
  const budgetBytes = Number.isFinite(envOverrideKB)
    ? envOverrideKB * 1024
    : parseSizeToBytes(totalJsBudget.budget.size);
  if (!budgetBytes) {
    console.warn('Invalid total-js budget size');
    process.exit(0);
  }
  const { files, total } = getTotalJsGzipSize();
  const totalKB = bytesToKB(total);
  const budgetKB = bytesToKB(budgetBytes);
  console.log(`Total gzipped JS: ${totalKB} KB across ${files.length} files (budget: ${budgetKB} KB)`);
  if (total > budgetBytes) {
    console.error(`Budget exceeded: total-js ${totalKB} KB > ${budgetKB} KB`);
    process.exit(1);
  }
}

main();
