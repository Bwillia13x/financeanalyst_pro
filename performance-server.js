#!/usr/bin/env node

/**
 * Performance Test Server
 * Simple static file server for Lighthouse performance testing
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4173;
const DIST_DIR = path.join(__dirname, 'dist');

// Create server
const server = http.createServer((req, res) => {
  // Handle root - serve index.html
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(DIST_DIR, url);

  // Basic security - prevent directory traversal
  if (path.relative(DIST_DIR, filePath).startsWith('..')) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try as .html file for clean URLs
      const htmlFilePath = path.join(DIST_DIR, url + '.html');
      fs.access(htmlFilePath, fs.constants.F_OK, (htmlErr) => {
        if (!htmlErr) {
          serveFile(htmlFilePath, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();

  // MIME type mapping
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Start server
console.log(`🔧 Starting performance test server...`);
console.log(`📁 Serving files from: ${DIST_DIR}`);
console.log(`🌐 URL: http://localhost:${PORT}`);

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📊 Ready for Lighthouse performance testing`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log(`\n🛑 Shutting down performance test server...`);
  server.close(() => {
    console.log(`✅ Server stopped`);
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});