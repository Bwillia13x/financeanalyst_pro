#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const PREVIEW_PORT = process.env.PREVIEW_PORT || 4173;
const URL = `http://localhost:${PREVIEW_PORT}`;

function waitForServer(url, timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, res => {
          if (res.statusCode && res.statusCode < 500) {
            resolve(true);
          } else {
            res.resume();
            if (Date.now() - start > timeoutMs) return reject(new Error('Timeout'));
            setTimeout(tryOnce, intervalMs);
          }
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) return reject(new Error('Timeout'));
          setTimeout(tryOnce, intervalMs);
        });
    };
    tryOnce();
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} failed with ${code}`))));
  });
}

async function main() {
  try {
    await run('npm', ['run', 'build:prod']);

    const preview = spawn('npm', ['run', 'preview', '--', '--port', String(PREVIEW_PORT)], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Ensure we clean up the preview process
    const cleanup = () => {
      if (!preview.killed) {
        try { preview.kill('SIGTERM'); } catch {}
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(1); });
    process.on('SIGTERM', () => { cleanup(); process.exit(1); });

    await waitForServer(URL, 45000, 750);

    const routes = [
      '/',
      '/financial-model-workspace',
      '/portfolio-management',
      '/valuation-workbench',
      '/ai-insights',
      '/analytics'
    ];

    for (const route of routes) {
      const url = URL + route;
      const safe = route === '/' ? 'root' : route.replace(/\//g, '-').replace(/^-/, '');
      const outPath = `perf-results-${safe}.json`;
      console.log(`\nRunning Lighthouse for ${url}`);
      await run('npx', [
        'lighthouse',
        url,
        '--output', 'json',
        '--output-path', outPath,
        '--quiet',
        '--chrome-flags=--headless=new',
      ]);
      await run('node', ['scripts/budget-check.js', outPath]);
    }

    cleanup();
    console.log('\n✅ Local performance audit passed with budgets for all routes');
  } catch (e) {
    console.error('\n❌ Performance audit failed:', e.message || e);
    process.exit(1);
  }
}

main();
