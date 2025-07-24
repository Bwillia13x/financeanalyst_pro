/**
 * Sync Service
 * Handles data synchronization for future cloud storage integration
 */

import { persistenceManager } from './PersistenceManager';
import { backupService } from './BackupService';
import { CryptoUtils } from '../utils/CryptoUtils';

export class SyncService {
  constructor() {
    this.cryptoUtils = new CryptoUtils();
    this.syncEndpoint = null; // Future cloud endpoint
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.conflictResolutionStrategy = 'client_wins'; // client_wins, server_wins, merge
    this.listeners = new Set();
    
    // Sync queue for offline operations
    this.syncQueue = [];
    this.maxQueueSize = 100;
  }

  /**
   * Initialize sync service
   */
  async initialize(config = {}) {
    try {
      this.syncEndpoint = config.endpoint || null;
      this.syncInterval = config.interval || this.syncInterval;
      this.conflictResolutionStrategy = config.conflictResolution || this.conflictResolutionStrategy;

      // Load last sync time
      this.lastSyncTime = await persistenceManager.retrieve('last_sync_time');
      
      // Load sync queue
      const queue = await persistenceManager.retrieve('sync_queue');
      if (queue && Array.isArray(queue)) {
        this.syncQueue = queue;
      }

      // Setup periodic sync if endpoint is configured
      if (this.syncEndpoint) {
        this.setupPeriodicSync();
      }

      console.log('✅ Sync service initialized');
      return { success: true, endpoint: this.syncEndpoint };

    } catch (error) {
      console.error('❌ Failed to initialize sync service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue a sync operation
   */
  async queueSyncOperation(operation) {
    try {
      const syncOperation = {
        id: this.generateOperationId(),
        type: operation.type, // 'create', 'update', 'delete'
        dataType: operation.dataType,
        key: operation.key,
        data: operation.data,
        timestamp: Date.now(),
        retries: 0
      };

      this.syncQueue.push(syncOperation);

      // Trim queue if too large
      if (this.syncQueue.length > this.maxQueueSize) {
        this.syncQueue = this.syncQueue.slice(-this.maxQueueSize);
      }

      // Save queue
      await persistenceManager.store('sync_queue', this.syncQueue, {
        storage: 'localStorage'
      });

      // Attempt immediate sync if online
      if (navigator.onLine && this.syncEndpoint) {
        this.processSyncQueue().catch(error => {
          console.error('Failed to process sync queue:', error);
        });
      }

      return syncOperation.id;

    } catch (error) {
      console.error('Failed to queue sync operation:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncInProgress || !this.syncEndpoint || !navigator.onLine) {
      return { processed: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let processed = 0;
    let failed = 0;

    try {
      // Process operations in order
      const operations = [...this.syncQueue];
      
      for (const operation of operations) {
        try {
          await this.syncOperation(operation);
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          processed++;

        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          
          // Increment retry count
          operation.retries++;
          
          // Remove if too many retries
          if (operation.retries > 3) {
            this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
            failed++;
          }
        }
      }

      // Save updated queue
      await persistenceManager.store('sync_queue', this.syncQueue, {
        storage: 'localStorage'
      });

      // Update last sync time
      this.lastSyncTime = Date.now();
      await persistenceManager.store('last_sync_time', this.lastSyncTime, {
        storage: 'localStorage'
      });

      // Notify listeners
      this.notifyListeners('syncCompleted', { processed, failed });

      return { processed, failed };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single operation (placeholder for future implementation)
   */
  async syncOperation(operation) {
    // This is a placeholder for future cloud sync implementation
    // For now, we'll simulate the operation
    
    if (!this.syncEndpoint) {
      throw new Error('No sync endpoint configured');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In a real implementation, this would:
    // 1. Send the operation to the cloud endpoint
    // 2. Handle authentication
    // 3. Manage conflicts
    // 4. Return success/failure

    console.log(`Simulated sync operation: ${operation.type} ${operation.dataType}:${operation.key}`);
    
    return { success: true, operation: operation.id };
  }

  /**
   * Perform full sync with cloud
   */
  async performFullSync() {
    if (this.syncInProgress || !this.syncEndpoint) {
      return { success: false, reason: 'Sync in progress or no endpoint' };
    }

    this.syncInProgress = true;

    try {
      // Create backup before sync
      const backup = await backupService.createBackup({
        description: 'Pre-sync backup',
        compress: true
      });

      // Get local data
      const localData = await this.getLocalSyncData();
      
      // Get remote data (placeholder)
      const remoteData = await this.getRemoteData();

      // Resolve conflicts
      const mergedData = await this.resolveConflicts(localData, remoteData);

      // Apply merged data locally
      await this.applyMergedData(mergedData);

      // Update last sync time
      this.lastSyncTime = Date.now();
      await persistenceManager.store('last_sync_time', this.lastSyncTime, {
        storage: 'localStorage'
      });

      // Clear sync queue
      this.syncQueue = [];
      await persistenceManager.store('sync_queue', this.syncQueue, {
        storage: 'localStorage'
      });

      // Notify listeners
      this.notifyListeners('fullSyncCompleted', { backup: backup.backupId });

      return { 
        success: true, 
        timestamp: this.lastSyncTime,
        backup: backup.backupId 
      };

    } catch (error) {
      console.error('Full sync failed:', error);
      
      // Notify listeners
      this.notifyListeners('syncFailed', { error: error.message });
      
      throw error;

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get local data for sync
   */
  async getLocalSyncData() {
    const data = {};
    
    // Get all syncable data types
    const syncableTypes = [
      'watchlists',
      'alerts', 
      'user_preferences',
      'user_variables'
    ];

    for (const type of syncableTypes) {
      const typeData = await persistenceManager.retrieve(type);
      if (typeData) {
        data[type] = {
          data: typeData,
          lastModified: Date.now(), // In real implementation, track actual modification times
          checksum: await this.calculateChecksum(typeData)
        };
      }
    }

    return data;
  }

  /**
   * Get remote data (placeholder)
   */
  async getRemoteData() {
    // Placeholder for future cloud implementation
    // This would fetch data from the cloud endpoint
    return {};
  }

  /**
   * Resolve conflicts between local and remote data
   */
  async resolveConflicts(localData, remoteData) {
    const merged = {};

    // Get all data types from both sources
    const allTypes = new Set([
      ...Object.keys(localData),
      ...Object.keys(remoteData)
    ]);

    for (const type of allTypes) {
      const local = localData[type];
      const remote = remoteData[type];

      if (!local && remote) {
        // Only remote data exists
        merged[type] = remote;
      } else if (local && !remote) {
        // Only local data exists
        merged[type] = local;
      } else if (local && remote) {
        // Both exist - resolve conflict
        merged[type] = await this.resolveDataConflict(type, local, remote);
      }
    }

    return merged;
  }

  /**
   * Resolve conflict for a specific data type
   */
  async resolveDataConflict(type, local, remote) {
    switch (this.conflictResolutionStrategy) {
      case 'client_wins':
        return local;
      
      case 'server_wins':
        return remote;
      
      case 'merge':
        return await this.mergeData(type, local, remote);
      
      case 'latest_wins':
        return local.lastModified > remote.lastModified ? local : remote;
      
      default:
        return local;
    }
  }

  /**
   * Merge data intelligently
   */
  async mergeData(type, local, remote) {
    // Intelligent merging based on data type
    switch (type) {
      case 'watchlists':
        return this.mergeWatchlists(local.data, remote.data);
      
      case 'alerts':
        return this.mergeAlerts(local.data, remote.data);
      
      case 'user_preferences':
        return { ...remote.data, ...local.data }; // Local preferences win
      
      default:
        return local; // Default to local data
    }
  }

  /**
   * Merge watchlists
   */
  mergeWatchlists(local, remote) {
    const merged = { ...remote };
    
    // Add local watchlists, keeping newer versions
    Object.entries(local).forEach(([name, watchlist]) => {
      if (!merged[name] || 
          new Date(watchlist.lastUpdated) > new Date(merged[name].lastUpdated)) {
        merged[name] = watchlist;
      }
    });

    return merged;
  }

  /**
   * Merge alerts
   */
  mergeAlerts(local, remote) {
    const merged = [...remote];
    const remoteIds = new Set(remote.map(alert => alert.id));
    
    // Add local alerts that don't exist remotely
    local.forEach(alert => {
      if (!remoteIds.has(alert.id)) {
        merged.push(alert);
      }
    });

    return merged;
  }

  /**
   * Apply merged data locally
   */
  async applyMergedData(mergedData) {
    for (const [type, data] of Object.entries(mergedData)) {
      await persistenceManager.store(type, data.data, {
        storage: this.determineStorageType(type)
      });
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  async calculateChecksum(data) {
    const dataString = JSON.stringify(data);
    return await this.cryptoUtils.hash(dataString);
  }

  /**
   * Setup periodic sync
   */
  setupPeriodicSync() {
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.processSyncQueue().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, this.syncInterval);

    // Sync when coming online
    window.addEventListener('online', () => {
      this.processSyncQueue().catch(error => {
        console.error('Online sync failed:', error);
      });
    });
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      queueSize: this.syncQueue.length,
      isOnline: navigator.onLine,
      hasEndpoint: !!this.syncEndpoint,
      strategy: this.conflictResolutionStrategy
    };
  }

  /**
   * Add event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  // Private methods

  generateOperationId() {
    return 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  determineStorageType(dataType) {
    const localStorageTypes = ['user_preferences', 'user_variables'];
    return localStorageTypes.includes(dataType) ? 'localStorage' : 'indexedDB';
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const syncService = new SyncService();
