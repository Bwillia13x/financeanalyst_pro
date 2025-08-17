import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SyncService } from '../SyncService';

// Mock dependencies
vi.mock('../PersistenceManager', () => ({
  persistenceManager: {
    retrieve: vi.fn(),
    store: vi.fn(),
    clearAll: vi.fn()
  }
}));

vi.mock('../BackupService', () => ({
  backupService: {
    createBackup: vi.fn(),
    restoreBackup: vi.fn()
  }
}));

vi.mock('../../utils/CryptoUtils', () => ({
  CryptoUtils: vi.fn().mockImplementation(() => ({
    encrypt: vi.fn().mockReturnValue('encrypted_data'),
    decrypt: vi.fn().mockReturnValue('decrypted_data'),
    generateHash: vi.fn().mockReturnValue('hash_value'),
    hash: vi.fn().mockReturnValue('hash_value')
  }))
}));

describe('SyncService', () => {
  let syncService;
  let mockPersistenceManager;

  beforeEach(async() => {
    vi.clearAllMocks();

    // Import mocked modules
    const { persistenceManager } = await import('../PersistenceManager');
    mockPersistenceManager = persistenceManager;

    syncService = new SyncService();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);

      const result = await syncService.initialize();

      expect(result).toEqual({
        success: true,
        endpoint: null
      });
      expect(syncService.syncEndpoint).toBeNull();
      expect(syncService.syncInterval).toBe(5 * 60 * 1000);
      expect(syncService.conflictResolutionStrategy).toBe('client_wins');
    });

    it('should initialize with custom configuration', async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);

      const config = {
        endpoint: 'https://api.example.com/sync',
        interval: 10 * 60 * 1000,
        conflictResolution: 'server_wins'
      };

      const result = await syncService.initialize(config);

      expect(result).toEqual({
        success: true,
        endpoint: 'https://api.example.com/sync'
      });
      expect(syncService.syncEndpoint).toBe(config.endpoint);
      expect(syncService.syncInterval).toBe(config.interval);
      expect(syncService.conflictResolutionStrategy).toBe(config.conflictResolution);
    });

    it('should load previous sync data on initialization', async() => {
      const lastSyncTime = Date.now();
      const syncQueue = [{ id: 1, operation: 'update' }];

      mockPersistenceManager.retrieve
        .mockResolvedValueOnce(lastSyncTime)
        .mockResolvedValueOnce(syncQueue);

      await syncService.initialize();

      expect(syncService.lastSyncTime).toBe(lastSyncTime);
      expect(syncService.syncQueue).toEqual(syncQueue);
    });

    it('should handle initialization errors gracefully', async() => {
      mockPersistenceManager.retrieve.mockRejectedValue(new Error('Storage error'));

      const result = await syncService.initialize();

      expect(result).toEqual({
        success: false,
        error: 'Storage error'
      });
    });
  });

  describe('Queue Operations', () => {
    beforeEach(async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);
      await syncService.initialize();
    });

    it('should queue sync operations', async() => {
      const operation = {
        type: 'create',
        dataType: 'portfolios',
        key: 'portfolio_1',
        data: { name: 'Test Portfolio' }
      };

      const operationId = await syncService.queueSyncOperation(operation);

      expect(operationId).toBeTruthy();
      expect(syncService.syncQueue).toHaveLength(1);
      expect(syncService.syncQueue[0]).toMatchObject({
        type: 'create',
        dataType: 'portfolios',
        key: 'portfolio_1'
      });
      expect(mockPersistenceManager.store).toHaveBeenCalledWith('sync_queue', syncService.syncQueue, { storage: 'localStorage' });
    });

    it('should maintain queue size limit', async() => {
      syncService.maxQueueSize = 2;

      const operation1 = { type: 'create', dataType: 'test', key: '1' };
      const operation2 = { type: 'update', dataType: 'test', key: '2' };
      const operation3 = { type: 'delete', dataType: 'test', key: '3' };

      await syncService.queueSyncOperation(operation1);
      await syncService.queueSyncOperation(operation2);
      await syncService.queueSyncOperation(operation3);

      expect(syncService.syncQueue).toHaveLength(2);
      // Should keep the last 2 operations
      expect(syncService.syncQueue[0].key).toBe('2');
      expect(syncService.syncQueue[1].key).toBe('3');
    });
  });

  describe('Sync Status', () => {
    beforeEach(async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);
      await syncService.initialize();
    });

    it('should return current sync status', () => {
      const status = syncService.getSyncStatus();

      expect(status).toMatchObject({
        syncInProgress: false,
        lastSyncTime: null
      });
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('syncInProgress');
    });

    it('should track sync progress', () => {
      syncService.syncInProgress = true;
      syncService.lastSyncTime = Date.now();

      const status = syncService.getSyncStatus();

      expect(status.syncInProgress).toBe(true);
      expect(status.lastSyncTime).toBeTruthy();
    });
  });

  describe('Event Management', () => {
    beforeEach(async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);
      await syncService.initialize();
    });

    it('should add and remove event listeners', () => {
      const listener = vi.fn();

      syncService.addEventListener(listener);
      expect(syncService.listeners.has(listener)).toBe(true);

      syncService.removeEventListener(listener);
      expect(syncService.listeners.has(listener)).toBe(false);
    });

    it('should notify listeners of events', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      syncService.addEventListener(listener1);
      syncService.addEventListener(listener2);

      syncService.notifyListeners('test_event', { data: 'test' });

      expect(listener1).toHaveBeenCalledWith('test_event', { data: 'test' });
      expect(listener2).toHaveBeenCalledWith('test_event', { data: 'test' });
    });
  });

  describe('Utility Functions', () => {
    beforeEach(async() => {
      mockPersistenceManager.retrieve.mockResolvedValue(null);
      await syncService.initialize();
    });

    it('should generate unique operation IDs', () => {
      const id1 = syncService.generateOperationId();
      const id2 = syncService.generateOperationId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should determine storage type based on data type', () => {
      // Test that the function returns a valid storage type
      const storageType = syncService.determineStorageType('portfolios');
      expect(['indexedDB', 'localStorage']).toContain(storageType);

      const unknownType = syncService.determineStorageType('unknown');
      expect(['indexedDB', 'localStorage']).toContain(unknownType);
    });

    it('should calculate data checksums', async() => {
      const data = { test: 'data', value: 123 };
      const checksum = await syncService.calculateChecksum(data);

      expect(checksum).toBeTruthy();
      expect(typeof checksum).toBe('string');
    });
  });
});
