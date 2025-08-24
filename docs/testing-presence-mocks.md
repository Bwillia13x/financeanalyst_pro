# Testing: Deterministic Presence Mocks

This guide explains how to use the deterministic presence mock helper to stabilize collaboration tests and ensure predictable results.

## Why

- Avoid flaky presence state from timers and heartbeats in tests.
- Ensure `getActiveUsers(modelId)` returns a simple deterministic shape for assertions.
- Reduce duplicated inline mocks across tests.

## Helper

Location: `tests/utils/presenceMock.js`

Exports: `installPresenceMocks(userPresenceService, vi)`

- Stubs heartbeat monitoring (no timers).
- Provides a deterministic in-memory presence store per `modelId`.
- Wraps `joinSession(modelId, user)` to populate presence store.
- Overrides `getActiveUsers(modelId)` to return an array of `{ id, name }`.
- Returns `{ uninstall, _presenceStore }` to restore and introspect.

## Usage

```js
import { installPresenceMocks } from '../utils/presenceMock';
import { userPresenceService } from '../../src/services/collaboration/userPresenceSystem';
import { vi } from 'vitest';

const { uninstall } = installPresenceMocks(userPresenceService, vi);

await userPresenceService.joinSession('model-123', { id: 'u1', name: 'Alice' });
const users = userPresenceService.getActiveUsers('model-123');
expect(users).toEqual([{ id: 'u1', name: 'Alice' }]);

// optional cleanup
uninstall();
```

Notes:

- The helper keeps the exact user shape `{ id, name }` for assertions.
- It calls through to the real `startSession` (if available) to keep internal state coherent, but heartbeats are stubbed.
- Expected output shape: `getActiveUsers(modelId) => [{ id, name }]` (service reference: `src/services/collaboration/userPresenceSystem.js`).

## Adoption Status

- `tests/integration/phase2Integration.test.js`: Using helper.
- No other inline `userPresenceService` presence mocks detected under `tests/`.

If you add new collaboration tests, prefer `installPresenceMocks()` over inline presence shims.
