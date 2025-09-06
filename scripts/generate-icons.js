#!/usr/bin/env node
// Generates PWA PNG icons from the existing SVG. Requires `sharp` (npm i -D sharp)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  let sharp;
  try { ({ default: sharp } = await import('sharp')); } catch (e) {
    console.error('Missing dependency: sharp. Install with `npm i -D sharp`');
    process.exit(1);
  }

  const src = path.join(__dirname, '..', 'public', 'assets', 'images', 'apple-touch-icon.svg');
  const outDir = path.join(__dirname, '..', 'public', 'assets', 'icons');
  if (!fs.existsSync(src)) {
    console.error('Source SVG not found at', src);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const sizes = [192, 512];
  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log('Generated', outPath);
  }
}

main();
