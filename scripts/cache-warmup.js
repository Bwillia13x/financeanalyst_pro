#!/usr/bin/env node
/*
  Cache warmup: hits common backend endpoints to populate caches, then prints cache stats.
*/
import http from 'node:http';

const base = process.env.API_BASE_URL || 'http://localhost:3001/api';

const endpoints = [
  '/market-data/quote/AAPL',
  '/market-data/quote/MSFT',
  '/financial-statements/income/AAPL?period=annual&limit=3',
  '/financial-statements/balance/AAPL?period=annual&limit=3',
  '/financial-statements/cash-flow/AAPL?period=annual&limit=3',
  '/economic-data/indicators',
  '/economic-data/treasury-rates'
];

function get(url) {
  return new Promise((resolve) => {
    http.get(url, res => {
      res.resume();
      resolve(res.statusCode || 0);
    }).on('error', () => resolve(0));
  });
}

(async () => {
  console.log('🔁 Warming backend caches...');
  for (const path of endpoints) {
    const url = base + path;
    const status = await get(url);
    console.log(`  ${status === 200 ? '✅' : '⚠️'} ${url} -> ${status}`);
  }
  const cacheUrl = base + '/health/cache';
  http.get(cacheUrl, res => {
    let data = '';
    res.on('data', c => (data += c));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('📦 Cache stats:', JSON.stringify(json, null, 2));
        // Basic assertion: expect at least one key in any cache after warmup
        const keys = json?.data?.cache?.cacheKeys || {};
        const total = Object.values(keys).reduce((a, b) => a + (b || 0), 0);
        if (!total) {
          console.error('❌ Cache warmup did not populate any cache keys.');
          process.exit(1);
        } else {
          console.log('✅ Cache warmup populated', total, 'keys');
        }
      } catch (e) {
        console.log('📦 Cache stats load failed');
        process.exit(1);
      }
    });
  }).on('error', () => { console.log('📦 Cache stats load failed'); process.exit(1); });
})();
