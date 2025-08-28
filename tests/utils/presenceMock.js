// tests/utils/presenceMock.js
// Deterministic user presence mocks for Vitest integration tests

/**
 * Install deterministic presence mocks on a UserPresenceService instance.
 * - Stubs heartbeat monitors
 * - Overrides joinSession to populate a local in-memory presence map
 * - Overrides getActiveUsers to return simplified { id, name } shape
 *
 * @param {any} userPresenceService
 * @param {import('vitest').Vi} vi
 */
export function installPresenceMocks(userPresenceService, vi) {
  const __originals = {
    getActiveUsers:
      typeof userPresenceService.getActiveUsers === 'function'
        ? userPresenceService.getActiveUsers.bind(userPresenceService)
        : null
  };

  const __presenceByModel = new Map(); // modelId -> [{ id, name }]

  // Prevent timers/heartbeats side-effects in tests
  if (userPresenceService.startHeartbeatMonitoring) {
    vi.spyOn(userPresenceService, 'startHeartbeatMonitoring').mockImplementation(() => {});
  }
  if (userPresenceService.stopHeartbeatMonitoring) {
    vi.spyOn(userPresenceService, 'stopHeartbeatMonitoring').mockImplementation(() => {});
  }

  // Install joinSession mock
  userPresenceService.joinSession = vi.fn(async(modelId, user) => {
    const name = user?.name || user?.displayName || user?.username || user?.userInfo?.name || 'Test User';

    // Call through to real startSession if available so internal state stays consistent
    let session = undefined;
    if (typeof userPresenceService.startSession === 'function') {
      session = await userPresenceService.startSession(user.id, user, modelId);
    } else {
      // Fallback stubbed session
      session = {
        sessionId: `session_${Date.now()}`,
        modelId,
        user,
        status: 'active',
        connectedAt: new Date().toISOString(),
        capabilities: { canComment: true, canEdit: true, canView: true }
      };
    }

    // Populate local presence store deterministically
    const list = __presenceByModel.get(modelId) || [];
    if (!list.find((u) => u.id === user.id)) list.push({ id: user.id, name });
    __presenceByModel.set(modelId, list);

    return session;
  });

  const __getActiveUsersImpl = (modelId) => {
    // Prefer local deterministic store
    const local = __presenceByModel.get(modelId) || [];
    if (local.length) {
      return local.map((u) => ({ id: u.id, name: u.name || 'Test User' }));
    }

    // Fallback to original impl if present
    if (__originals.getActiveUsers) {
      try {
        const sessions = __originals.getActiveUsers(modelId) || [];
        return sessions
          .map((s) => ({ id: s.userId || s.id, name: s.userInfo?.name || s.user?.name || s.name }))
          .filter((u) => !!u.id);
      } catch {
        return [];
      }
    }
    return [];
  };

  userPresenceService.getActiveUsers = vi.fn(__getActiveUsersImpl);

  return {
    uninstall() {
      if (__originals.getActiveUsers) userPresenceService.getActiveUsers = __originals.getActiveUsers;
      // Best-effort restore for joinSession
      if (userPresenceService.joinSession && userPresenceService.joinSession.mockRestore) {
        userPresenceService.joinSession.mockRestore();
      }
    },
    _presenceStore: __presenceByModel
  };
}
