# Tests

This directory contains unit, integration, and E2E-oriented test files.

## Presence Mocks

For collaboration-related tests that need deterministic user presence, use the helper documented here:

- docs/testing-presence-mocks.md

Quick start:

```js
import { installPresenceMocks } from '../utils/presenceMock';
import { userPresenceService } from '../../src/services/collaboration/userPresenceSystem';
import { vi } from 'vitest';

installPresenceMocks(userPresenceService, vi);
```
