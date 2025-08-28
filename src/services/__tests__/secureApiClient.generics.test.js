import { describe, it, expect, vi, beforeEach } from 'vitest';

import secureApiClient from '../secureApiClient.js';

describe('secureApiClient generic methods', () => {
  beforeEach(() => {
    // Reset spies before each test
    vi.restoreAllMocks();
  });

  it('delegates get to axios instance', async () => {
    const spy = vi.spyOn(secureApiClient.client, 'get').mockResolvedValue({ data: { ok: true } });
    const res = await secureApiClient.get('/health');
    expect(spy).toHaveBeenCalledWith('/health', {});
    expect(res.data.ok).toBe(true);
  });

  it('delegates post to axios instance', async () => {
    const spy = vi.spyOn(secureApiClient.client, 'post').mockResolvedValue({ data: { ok: true } });
    const payload = { a: 1 };
    const res = await secureApiClient.post('/test', payload);
    expect(spy).toHaveBeenCalledWith('/test', payload, {});
    expect(res.data.ok).toBe(true);
  });

  it('delegates put to axios instance', async () => {
    const spy = vi.spyOn(secureApiClient.client, 'put').mockResolvedValue({ data: { ok: true } });
    const payload = { a: 2 };
    const res = await secureApiClient.put('/test', payload);
    expect(spy).toHaveBeenCalledWith('/test', payload, {});
    expect(res.data.ok).toBe(true);
  });

  it('delegates delete to axios instance', async () => {
    const spy = vi
      .spyOn(secureApiClient.client, 'delete')
      .mockResolvedValue({ data: { ok: true } });
    const res = await secureApiClient.delete('/test');
    expect(spy).toHaveBeenCalledWith('/test', {});
    expect(res.data.ok).toBe(true);
  });
});
