#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';

const base = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const target = new URL('/health', base).toString();

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const res = await get(target);
    if (res.status !== 200) {
      console.error(`Health check failed: ${res.status}`);
      process.exit(1);
    }
    console.log('Health OK:', target);
  } catch (e) {
    console.error('Health check error:', e.message || e);
    process.exit(1);
  }
})();

