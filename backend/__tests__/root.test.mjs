import request from 'supertest';
import app from '../app.js';

const canBind = process.env.ALLOW_BIND !== 'false';

describe('Root endpoint', () => {
  const maybeIt = canBind ? it : it.skip;
  maybeIt('returns API info', async() => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: expect.any(String),
      status: 'running',
      endpoints: expect.any(Object)
    });
  });
});
