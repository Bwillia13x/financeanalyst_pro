#!/usr/bin/env node
/*
 Per-chunk gzipped JS budget checker.
 Fails if any single JS file in dist/assets exceeds JS_FILE_BUDGET_KB (default 150KB) gzipped.
*/
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.join(process.cwd(), 'dist', 'assets');
const limitKB = parseInt(process.env.JS_FILE_BUDGET_KB || '150', 10);

// Optional per-file exceptions: comma-separated pattern=limitKB pairs via env,
// e.g. JS_FILE_BUDGET_EXCEPTIONS="vendor-exceljs=300,vendor-pptxgenjs=300"
// Defaults include a reasonable allowance for heavy export vendors.
const defaultExceptions = {
  'vendor-exceljs': 300,
  'vendor-pptxgenjs': 300,
};

function parseExceptionsEnv() {
  const map = { ...defaultExceptions };
  const raw = process.env.JS_FILE_BUDGET_EXCEPTIONS;
  if (!raw) return map;
  for (const entry of raw.split(',')) {
    const [pat, kb] = entry.split('=').map(s => s && s.trim());
    if (pat && kb && !Number.isNaN(parseInt(kb, 10))) {
      map[pat] = parseInt(kb, 10);
    }
  }
  return map;
}

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function fmtKB(bytes) { return Math.round((bytes / 1024) * 100) / 100; }

function main() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/assets not found. Run `npm run build:prod` first.');
    process.exit(2);
  }
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const exceptions = parseExceptionsEnv();
  let failed = [];
  for (const f of files) {
    const buf = fs.readFileSync(path.join(distDir, f));
    const gz = gzipSize(buf);
    // Determine the limit for this file (exceptional or default)
    const limitForFileKB = Object.entries(exceptions).some(([pat]) => f.includes(pat))
      ? Math.max(...Object.entries(exceptions).filter(([pat]) => f.includes(pat)).map(([, kb]) => kb))
      : limitKB;
    if (gz > limitForFileKB * 1024) {
      failed.push({ file: f, kb: fmtKB(gz), limitKB: limitForFileKB });
    }
  }
  if (failed.length) {
    console.error(`❌ ${failed.length} chunk(s) exceed per-file gzipped limits:`);
    for (const e of failed) console.error(`  - ${e.file}: ${e.kb} KB (limit: ${e.limitKB} KB)`);
    process.exit(1);
  }
  console.log(`✅ All JS chunks within gzipped limits (default ${limitKB}KB)`);
}

main();
