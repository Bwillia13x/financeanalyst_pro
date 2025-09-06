#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.join(process.cwd(), 'dist', 'assets');

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/assets not found. Run `npm run build:prod` first.');
    process.exit(2);
  }
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const entries = files.map(f => {
    const p = path.join(distDir, f);
    const gz = gzipSize(fs.readFileSync(p));
    return { file: f, bytesGzip: gz, kbGzip: Math.round((gz/1024)*100)/100 };
  }).sort((a,b) => b.bytesGzip - a.bytesGzip);
  const totalGzip = entries.reduce((a,b)=>a+b.bytesGzip,0);
  const out = { totalBytesGzip: totalGzip, files: entries };
  const outPath = process.argv[2] || 'bundle-sizes.json';
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${entries.length} entries to ${outPath}`);
}

main();

