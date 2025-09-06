#!/usr/bin/env node
import fs from 'node:fs';

function normalize(name) {
  // Remove Vite hash patterns: -<hash>.js
  return name.replace(/-[a-f0-9]{8,}(?=\.js$)/i, '');
}

function load(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function toMap(report) {
  const map = new Map();
  for (const f of report.files || []) {
    map.set(normalize(f.file), f);
  }
  return map;
}

function bytesToKB(b) { return Math.round((b/1024)*100)/100; }

function main() {
  const basePath = process.argv[2];
  const prPath = process.argv[3];
  if (!basePath || !prPath) {
    console.error('Usage: compare-gzip-sizes <base.json> <pr.json>');
    process.exit(2);
  }
  const base = load(basePath);
  const pr = load(prPath);
  const baseMap = toMap(base);
  const prMap = toMap(pr);

  const names = new Set([...baseMap.keys(), ...prMap.keys()]);
  const rows = [];
  for (const name of names) {
    const b = baseMap.get(name)?.bytesGzip || 0;
    const p = prMap.get(name)?.bytesGzip || 0;
    const delta = p - b;
    rows.push({ name, base: b, pr: p, delta });
  }
  rows.sort((a,b)=>b.pr - a.pr);

  const topN = rows.slice(0, 15);
  let md = '';
  md += `## Bundle Size Comparison (gzipped)\n\n`;
  md += `Total Base: ${bytesToKB(base.totalBytesGzip)} KB\n\n`;
  md += `Total PR: ${bytesToKB(pr.totalBytesGzip)} KB\n\n`;
  md += `Top 15 Chunks by PR Size (KB):\n\n`;
  md += `| Chunk | Base | PR | Δ |\n|---|---:|---:|---:|\n`;
  for (const r of topN) {
    md += `| ${r.name} | ${bytesToKB(r.base)} | ${bytesToKB(r.pr)} | ${bytesToKB(r.delta)} |\n`;
  }

  fs.writeFileSync('bundle-diff.md', md);
  console.log('Wrote bundle-diff.md');
}

main();

