import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installPresenceMocks } from '../utils/presenceMock.js';
import { UserPresenceService } from '../../src/services/collaboration/userPresenceSystem.js';

describe('tests/utils/presenceMock - installPresenceMocks', () => {
  let service;
  let api;

  beforeEach(() => {
    service = new UserPresenceService();
    api = installPresenceMocks(service, vi);
  });

  afterEach(() => {
    // Restore any spies
    if (api && typeof api.uninstall === 'function') api.uninstall();
    vi.restoreAllMocks();
  });

  it('installs without throwing and returns uninstall handle', () => {
    expect(api).toBeTruthy();
    expect(typeof api.uninstall).toBe('function');
    expect(api._presenceStore).toBeInstanceOf(Map);
  });

  it('joinSession + getActiveUsers returns deterministic { id, name }', async () => {
    await service.joinSession('model-1', { id: 'u1', name: 'Alice' });
    const users = service.getActiveUsers('model-1');

    expect(Array.isArray(users)).toBe(true);
    expect(users).toEqual([{ id: 'u1', name: 'Alice' }]);
  });

  it('supports multiple users for same model', async () => {
    await service.joinSession('model-1', { id: 'u1', name: 'Alice' });
    await service.joinSession('model-1', { id: 'u2', name: 'Bob' });

    const users = service.getActiveUsers('model-1');
    // Order is not guaranteed by spec, so assert as a set
    expect(users).toHaveLength(2);
    const ids = users.map(u => u.id).sort();
    const names = users.map(u => u.name).sort();
    expect(ids).toEqual(['u1', 'u2']);
    expect(names).toEqual(['Alice', 'Bob']);
  });

  it('stubs heartbeat monitoring to avoid side-effects', async () => {
    // joinSession calls through to startSession which triggers heartbeat monitoring
    await service.joinSession('model-2', { id: 'u9', name: 'Zoe' });

    // Ensure methods are spied and callable (no timers started)
    expect(vi.isMockFunction(service.startHeartbeatMonitoring)).toBe(true);
    expect(vi.isMockFunction(service.stopHeartbeatMonitoring)).toBe(true);

    // The spy should have been invoked by startSession
    expect(service.startHeartbeatMonitoring).toHaveBeenCalledTimes(1);
    expect(service.startHeartbeatMonitoring).toHaveBeenCalledWith('u9');
  });
});
