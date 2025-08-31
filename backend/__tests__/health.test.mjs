import app from '../app.js';

// Skip in environments where binding sockets is prohibited (e.g., certain CI sandboxes)
const canBind = process.env.ALLOW_BIND !== 'false';

describe('API Health endpoint', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    if (!canBind) return;
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (!canBind) return;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  const maybeIt = canBind ? it : it.skip;
  maybeIt('returns healthy status with metadata', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('status', 'healthy');
    expect(json.data).toHaveProperty('timestamp');
    expect(typeof json.data.uptime).toBe('number');
  });
});
