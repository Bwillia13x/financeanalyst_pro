/**
 * Backup Service
 * Handles data backup, restore, and synchronization operations
 */

import { CompressionUtils } from '../utils/CompressionUtils';
import { CryptoUtils } from '../utils/CryptoUtils';

import { persistenceManager } from './PersistenceManager';

export class BackupService {
  constructor() {
    this.cryptoUtils = new CryptoUtils();
    this.compressionUtils = new CompressionUtils();
    this.backupVersion = '1.0.0';
    this.maxBackupSize = 50 * 1024 * 1024; // 50MB
    this.maxBackups = 10; // Keep last 10 backups
  }

  /**
   * Create a complete backup of all user data
   */
  async createBackup(options = {}) {
    const {
      includeSettings = true,
      includeWatchlists = true,
      includeAlerts = true,
      includeHistory = true,
      includeCachedData = false,
      encrypt = false,
      compress = true,
      description = ''
    } = options;

    try {
      await persistenceManager.ensureInitialized();

      // Collect data to backup
      const backupData = {
        version: this.backupVersion,
        timestamp: new Date().toISOString(),
        description,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        data: {}
      };

      // Include user settings and preferences
      if (includeSettings) {
        backupData.data.settings = (await persistenceManager.retrieve('user_preferences')) || {};
        backupData.data.session = (await persistenceManager.retrieve('session_data')) || {};
      }

      // Include watchlists
      if (includeWatchlists) {
        backupData.data.watchlists = (await persistenceManager.retrieve('watchlists')) || {};
      }

      // Include alerts
      if (includeAlerts) {
        backupData.data.alerts = (await persistenceManager.retrieve('alerts')) || [];
      }

      // Include command and analysis history
      if (includeHistory) {
        backupData.data.commandHistory =
          (await persistenceManager.retrieve('command_history')) || [];
        backupData.data.analysisHistory =
          (await persistenceManager.retrieve('analysis_history')) || [];
      }

      // Include cached data (optional, can be large)
      if (includeCachedData) {
        backupData.data.cachedData = (await persistenceManager.retrieve('cached_data')) || {};
      }

      // Calculate backup size
      let backupString = JSON.stringify(backupData);
      const originalSize = backupString.length;

      if (originalSize > this.maxBackupSize) {
        throw new Error(
          `Backup too large: ${originalSize} bytes exceeds ${this.maxBackupSize} bytes`
        );
      }

      // Compress if requested
      if (compress) {
        backupString = await this.compressionUtils.compress(backupString);
        backupData.metadata.compressed = true;
        backupData.metadata.compressionRatio = backupString.length / originalSize;
      }

      // Encrypt if requested
      if (encrypt) {
        backupString = await this.cryptoUtils.encrypt(backupString);
        backupData.metadata.encrypted = true;
      }

      // Generate backup ID
      const backupId = this.generateBackupId();

      // Store backup
      await this.storeBackup(backupId, backupString, backupData.metadata);

      // Cleanup old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupId,
        size: backupString.length,
        originalSize,
        metadata: backupData.metadata,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(backupId, options = {}) {
    const {
      overwrite = false,
      selectiveRestore = null, // Array of data types to restore
      createBackupBeforeRestore = true
    } = options;

    try {
      await persistenceManager.ensureInitialized();

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        await this.createBackup({
          description: `Auto-backup before restore from ${backupId}`,
          compress: true
        });
      }

      // Retrieve backup data
      const backup = await this.retrieveBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      let backupString = backup.data;
      const metadata = backup.metadata;

      // Decrypt if needed
      if (metadata.encrypted) {
        backupString = await this.cryptoUtils.decrypt(backupString);
      }

      // Decompress if needed
      if (metadata.compressed) {
        backupString = await this.compressionUtils.decompress(backupString);
      }

      // Parse backup data
      const backupData = JSON.parse(backupString);

      // Validate backup version compatibility
      if (!this.isVersionCompatible(backupData.version)) {
        throw new Error(
          `Backup version ${backupData.version} is not compatible with current version ${this.backupVersion}`
        );
      }

      // Restore data selectively or completely
      const dataToRestore = selectiveRestore
        ? this.filterBackupData(backupData.data, selectiveRestore)
        : backupData.data;

      const restoreResults = {
        restored: 0,
        skipped: 0,
        errors: 0,
        details: {}
      };

      // Restore each data type
      for (const [dataType, data] of Object.entries(dataToRestore)) {
        try {
          // Check if data exists and overwrite setting
          const existing = await persistenceManager.retrieve(dataType);
          if (existing && !overwrite) {
            restoreResults.skipped++;
            restoreResults.details[dataType] = 'skipped (exists)';
            continue;
          }

          // Restore the data
          await persistenceManager.store(dataType, data, {
            storage: this.determineStorageType(dataType)
          });

          restoreResults.restored++;
          restoreResults.details[dataType] = 'restored';
        } catch (error) {
          console.error(`Failed to restore ${dataType}:`, error);
          restoreResults.errors++;
          restoreResults.details[dataType] = `error: ${error.message}`;
        }
      }

      return {
        success: true,
        backupId,
        backupTimestamp: backupData.timestamp,
        restoreTimestamp: new Date().toISOString(),
        results: restoreResults
      };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backupKeys = await persistenceManager.indexedDB.getKeys('export_data');
      const backups = [];

      for (const key of backupKeys) {
        if (key.startsWith('backup_')) {
          const backup = await persistenceManager.indexedDB.retrieve(key, {
            storeName: 'export_data'
          });
          if (backup) {
            backups.push({
              id: key,
              timestamp: backup.metadata.timestamp,
              description: backup.metadata.description || '',
              size: backup.metadata.size || 0,
              compressed: backup.metadata.compressed || false,
              encrypted: backup.metadata.encrypted || false
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId) {
    try {
      await persistenceManager.indexedDB.remove(backupId, { storeName: 'export_data' });
      return true;
    } catch (error) {
      console.error(`Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Export backup to file
   */
  async exportBackupToFile(backupId, filename = null) {
    try {
      const backup = await this.retrieveBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const exportData = {
        backupId,
        ...backup
      };

      const dataString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });

      const suggestedFilename =
        filename ||
        `financeanalyst_backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;

      return {
        blob,
        filename: suggestedFilename,
        size: blob.size,
        type: 'application/json'
      };
    } catch (error) {
      console.error('Failed to export backup to file:', error);
      throw error;
    }
  }

  /**
   * Import backup from file
   */
  async importBackupFromFile(fileContent) {
    try {
      const backupData = JSON.parse(fileContent);

      // Validate backup format
      if (!backupData.backupId || !backupData.data || !backupData.metadata) {
        throw new Error('Invalid backup file format');
      }

      // Store imported backup
      await this.storeBackup(backupData.backupId, backupData.data, backupData.metadata);

      return {
        success: true,
        backupId: backupData.backupId,
        timestamp: backupData.metadata.timestamp
      };
    } catch (error) {
      console.error('Failed to import backup from file:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();

      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + (backup.size || 0), 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
        newestBackup: backups.length > 0 ? backups[0].timestamp : null,
        encryptedBackups: backups.filter(b => b.encrypted).length,
        compressedBackups: backups.filter(b => b.compressed).length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return null;
    }
  }

  // Private methods

  /**
   * Store backup in IndexedDB
   */
  async storeBackup(backupId, data, metadata) {
    const backupRecord = {
      id: backupId,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        size: data.length
      },
      timestamp: Date.now(),
      type: 'backup'
    };

    await persistenceManager.indexedDB.store(backupId, backupRecord, {
      storeName: 'export_data',
      metadata: backupRecord.metadata
    });
  }

  /**
   * Retrieve backup from IndexedDB
   */
  async retrieveBackup(backupId) {
    return persistenceManager.indexedDB.retrieve(backupId, { storeName: 'export_data' });
  }

  /**
   * Generate unique backup ID
   */
  generateBackupId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `backup_${timestamp}_${random}`;
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);

        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }

        console.warn(`✅ Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Check if backup version is compatible
   */
  isVersionCompatible(backupVersion) {
    // For now, only exact version match
    // In the future, this could handle version compatibility matrix
    return backupVersion === this.backupVersion;
  }

  /**
   * Filter backup data for selective restore
   */
  filterBackupData(backupData, dataTypes) {
    const filtered = {};

    dataTypes.forEach(dataType => {
      if (backupData[dataType]) {
        filtered[dataType] = backupData[dataType];
      }
    });

    return filtered;
  }

  /**
   * Determine appropriate storage type for data
   */
  determineStorageType(dataType) {
    const localStorageTypes = ['settings', 'session', 'user_preferences'];
    return localStorageTypes.includes(dataType) ? 'localStorage' : 'indexedDB';
  }
}

// Export singleton instance
export const backupService = new BackupService();
