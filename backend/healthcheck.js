import http from 'http';

const options = {
  host: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.warn(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.warn(`Health check failed: ${err.message}`);
  process.exit(1);
});

request.end();
