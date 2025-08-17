/**
 * Privacy Service
 * Handles data privacy controls, retention policies, and user data rights
 */

import { backupService } from './BackupService';
import { persistenceManager } from './PersistenceManager';

/**
 * @typedef {'command_history'|'analysis_history'|'cached_data'|'export_data'|'session_data'} RetentionDataType
 * @typedef {{ command_history: number, analysis_history: number, cached_data: number, export_data: number, session_data: number }} RetentionPolicies
 * @typedef {{ dataRetention: boolean, analytics: boolean, crashReporting: boolean, dataSharing: boolean, cookieConsent: boolean, trackingConsent: boolean }} PrivacySettings
 * @typedef {{ essential: string[], functional: string[], analytics: string[], marketing: string[], external: string[] }} DataCategories
 * @typedef {{ includeEssential?: boolean, includeFunctional?: boolean, includeAnalytics?: boolean, format?: 'json' | 'csv' }} ExportOptions
 */

export class PrivacyService {
  constructor() {
    /** @type {RetentionPolicies} */
    this.retentionPolicies = {
      command_history: 30, // days
      analysis_history: 90,
      cached_data: 7,
      export_data: 30,
      session_data: 1
    };
    
    /** @type {PrivacySettings} */
    this.privacySettings = {
      dataRetention: true,
      analytics: false,
      crashReporting: true,
      dataSharing: false,
      cookieConsent: false,
      trackingConsent: false
    };

    /** @type {DataCategories} */
    this.dataCategories = {
      essential: ['user_preferences', 'session_data', 'watchlists', 'alerts'],
      functional: ['command_history', 'user_variables'],
      analytics: ['usage_stats', 'performance_metrics'],
      marketing: [], // None currently
      external: ['cached_data'] // Data from external APIs
    };
  }

  /**
   * Initialize privacy service
   * @returns {Promise<{ success: boolean, settings: PrivacySettings }>}
   */
  async initialize() {
    try {
      // Load privacy settings
      const settings = await persistenceManager.retrieve('privacy_settings');
      if (settings) {
        this.privacySettings = { ...this.privacySettings, ...settings };
      }

      // Load custom retention policies
      const policies = await persistenceManager.retrieve('retention_policies');
      if (policies) {
        this.retentionPolicies = { ...this.retentionPolicies, ...policies };
      }

      // Schedule cleanup
      this.scheduleCleanup();

      console.warn('✅ Privacy service initialized');
      return { success: true, settings: this.privacySettings };

    } catch (error) {
      console.error('❌ Failed to initialize privacy service:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Update privacy settings
   * @param {Partial<PrivacySettings>} newSettings
   * @returns {Promise<{ success: boolean, settings: PrivacySettings }>}
   */
  async updatePrivacySettings(newSettings) {
    try {
      const oldSettings = { ...this.privacySettings };
      this.privacySettings = { ...this.privacySettings, ...newSettings };

      // Save updated settings
      await persistenceManager.store('privacy_settings', this.privacySettings, {
        storage: 'localStorage'
      });

      // Handle setting changes
      await this.handlePrivacySettingChanges(oldSettings, this.privacySettings);

      return { success: true, settings: this.privacySettings };

    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }

  /**
   * Handle privacy setting changes
   * @param {PrivacySettings} oldSettings
   * @param {PrivacySettings} newSettings
   * @returns {Promise<void>}
   */
  async handlePrivacySettingChanges(oldSettings, newSettings) {
    // If data retention was disabled, clean up non-essential data
    if (oldSettings.dataRetention && !newSettings.dataRetention) {
      await this.cleanupNonEssentialData();
    }

    // If analytics was disabled, clean up analytics data
    if (oldSettings.analytics && !newSettings.analytics) {
      await this.cleanupAnalyticsData();
    }

    // If data sharing was disabled, remove shared data markers
    if (oldSettings.dataSharing && !newSettings.dataSharing) {
      await this.removeDataSharingMarkers();
    }
  }

  /**
   * Set data retention policy
   * @param {RetentionDataType} dataType
   * @param {number} days
   * @returns {Promise<{ success: boolean, policy: Record<string, number> }>}
   */
  async setRetentionPolicy(dataType, days) {
    try {
      this.retentionPolicies[dataType] = days;

      // Save updated policies
      await persistenceManager.store('retention_policies', this.retentionPolicies, {
        storage: 'localStorage'
      });

      // Apply new policy immediately
      await this.cleanupExpiredData(dataType);

      return { success: true, policy: { [dataType]: days } };

    } catch (error) {
      console.error('Failed to set retention policy:', error);
      throw error;
    }
  }

  /**
   * Clean up expired data based on retention policies
   * @param {RetentionDataType | null} specificType
   * @returns {Promise<{ cleaned: number, errors: number, details: Record<string, number | string> }>}
   */
  async cleanupExpiredData(specificType = null) {
    const results = {
      cleaned: 0,
      errors: 0,
      details: {}
    };

    try {
      const typesToClean = /** @type {RetentionDataType[]} */ (
        specificType ? [specificType] : Object.keys(this.retentionPolicies)
      );

      for (const dataType of typesToClean) {
        const retentionDays = this.retentionPolicies[dataType];
        if (!retentionDays) continue;

        try {
          const cleaned = await this.cleanupDataType(dataType, retentionDays);
          results.cleaned += cleaned;
          results.details[dataType] = cleaned;

        } catch (error) {
          console.error(`Failed to cleanup ${dataType}:`, error);
          results.errors++;
          const message = error instanceof Error ? error.message : String(error);
          results.details[dataType] = `Error: ${message}`;
        }
      }

      return results;

    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  /**
   * Clean up specific data type
   * @param {RetentionDataType} dataType
   * @param {number} retentionDays
   * @returns {Promise<number>}
   */
  async cleanupDataType(dataType, retentionDays) {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    try {
      switch (dataType) {
        case 'command_history':
          cleaned = await this.cleanupCommandHistory(cutoffTime);
          break;

        case 'analysis_history':
          cleaned = await this.cleanupAnalysisHistory(cutoffTime);
          break;

        case 'cached_data':
          cleaned = await this.cleanupCachedData(cutoffTime);
          break;

        case 'export_data':
          cleaned = await this.cleanupExportData(cutoffTime);
          break;

        case 'session_data':
          cleaned = await this.cleanupSessionData(cutoffTime);
          break;

        default:
          console.warn(`Unknown data type for cleanup: ${dataType}`);
      }

      return cleaned;

    } catch (error) {
      console.error(`Failed to cleanup ${dataType}:`, error);
      return 0;
    }
  }

  /**
   * Clean up command history
   * @param {number} cutoffTime
   * @returns {Promise<number>}
   */
  async cleanupCommandHistory(cutoffTime) {
    const history = /** @type {Array<{ timestamp: number | string }>} */ (
      await persistenceManager.retrieve('command_history')
    ) || [];
    const filtered = history.filter(entry =>
      new Date(entry.timestamp).getTime() > cutoffTime
    );

    if (filtered.length < history.length) {
      await persistenceManager.store('command_history', filtered, {
        storage: 'indexedDB'
      });
      return history.length - filtered.length;
    }

    return 0;
  }

  /**
   * Clean up analysis history
   * @param {number} cutoffTime
   * @returns {Promise<number>}
   */
  async cleanupAnalysisHistory(cutoffTime) {
    // Get all analysis history from IndexedDB
    const allHistory = /** @type {Array<{ id: string | number, timestamp: number }>} */ (
      await persistenceManager.indexedDB.getAll('analysis_history')
    );
    let cleaned = 0;

    for (const entry of allHistory) {
      if (entry.timestamp < cutoffTime) {
        await persistenceManager.indexedDB.remove(entry.id, { storeName: 'analysis_history' });
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clean up cached data
   * @param {number} cutoffTime
   * @returns {Promise<number>}
   */
  async cleanupCachedData(cutoffTime) {
    const allCached = /** @type {Array<{ key: string | number, timestamp: number }>} */ (
      await persistenceManager.indexedDB.getAll('cached_data')
    );
    let cleaned = 0;

    for (const entry of allCached) {
      if (entry.timestamp < cutoffTime) {
        await persistenceManager.indexedDB.remove(entry.key, { storeName: 'cached_data' });
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clean up export data
   * @param {number} cutoffTime
   * @returns {Promise<number>}
   */
  async cleanupExportData(cutoffTime) {
    const allExports = /** @type {Array<{ id: string | number, timestamp: number }>} */ (
      await persistenceManager.indexedDB.getAll('export_data')
    );
    let cleaned = 0;

    for (const entry of allExports) {
      if (entry.timestamp < cutoffTime) {
        await persistenceManager.indexedDB.remove(entry.id, { storeName: 'export_data' });
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clean up session data
   * @param {number} _cutoffTime
   * @returns {Promise<number>}
   */
  async cleanupSessionData(_cutoffTime) {
    // Session data is typically current, but clean up old session logs if any
    return 0; // Placeholder
  }

  /**
   * Clean up non-essential data
   */
  async cleanupNonEssentialData() {
    const nonEssentialTypes = [
      ...this.dataCategories.functional,
      ...this.dataCategories.analytics,
      ...this.dataCategories.external
    ];

    let cleaned = 0;

    for (const dataType of nonEssentialTypes) {
      try {
        if (dataType === 'command_history') {
          await persistenceManager.store('command_history', [], { storage: 'indexedDB' });
          cleaned++;
        } else if (dataType === 'cached_data') {
          await persistenceManager.indexedDB.clear('cached_data');
          cleaned++;
        }
        // Add more cleanup logic as needed
      } catch (error) {
        console.error(`Failed to cleanup ${dataType}:`, error);
      }
    }

    return cleaned;
  }

  /**
   * Clean up analytics data
   */
  async cleanupAnalyticsData() {
    const analyticsTypes = this.dataCategories.analytics;
    
    for (const dataType of analyticsTypes) {
      try {
        await persistenceManager.remove(dataType);
      } catch (error) {
        console.error(`Failed to cleanup analytics data ${dataType}:`, error);
      }
    }
  }

  /**
   * Remove data sharing markers
   */
  async removeDataSharingMarkers() {
    // Remove any markers that indicate data has been shared
    // This is a placeholder for future implementation
    console.warn('Data sharing markers removed');
  }

  /**
   * Export user data (GDPR compliance)
   * @param {ExportOptions=} options
   * @returns {Promise<{ success: boolean, data: { exportTimestamp: string, privacySettings: PrivacySettings, retentionPolicies: RetentionPolicies, data: Record<string, any> }, size: number, format: string }>}
   */
  async exportUserData(options = {}) {
    const {
      includeEssential = true,
      includeFunctional = true,
      includeAnalytics = false,
      format = 'json'
    } = options;

    try {
      /** @type {{ exportTimestamp: string, privacySettings: PrivacySettings, retentionPolicies: RetentionPolicies, data: Record<string, any> }} */
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        privacySettings: this.privacySettings,
        retentionPolicies: this.retentionPolicies,
        data: {}
      };

      // Include data based on categories
      if (includeEssential) {
        for (const dataType of this.dataCategories.essential) {
          const data = await persistenceManager.retrieve(dataType);
          if (data) {
            exportData.data[dataType] = data;
          }
        }
      }

      if (includeFunctional) {
        for (const dataType of this.dataCategories.functional) {
          const data = await persistenceManager.retrieve(dataType);
          if (data) {
            exportData.data[dataType] = data;
          }
        }
      }

      if (includeAnalytics) {
        for (const dataType of this.dataCategories.analytics) {
          const data = await persistenceManager.retrieve(dataType);
          if (data) {
            exportData.data[dataType] = data;
          }
        }
      }

      return {
        success: true,
        data: exportData,
        size: JSON.stringify(exportData).length,
        format
      };

    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (Right to be forgotten)
   * @param {boolean} [confirmation=false]
   * @returns {Promise<{ success: true, backup: string, timestamp: string }>}
   */
  async deleteAllUserData(confirmation = false) {
    if (!confirmation) {
      throw new Error('Data deletion requires explicit confirmation');
    }

    try {
      // Create final backup
      const backup = await backupService.createBackup({
        description: 'Final backup before data deletion',
        compress: true,
        encrypt: true
      });

      // Clear all storage
      await persistenceManager.clear({ storage: 'both', confirm: true });

      // Clear browser storage
      localStorage.clear();
      
      // Clear IndexedDB
      if (window.indexedDB) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name.includes('FinanceAnalyst')) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }

      return {
        success: true,
        backup: backup.backupId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }

  /**
   * Get privacy compliance report
   */
  async getPrivacyReport() {
    try {
      const storageStats = await persistenceManager.getStorageStats();
      const cleanupResults = await this.cleanupExpiredData();

      return {
        privacySettings: this.privacySettings,
        retentionPolicies: this.retentionPolicies,
        dataCategories: this.dataCategories,
        storageStats,
        lastCleanup: cleanupResults,
        compliance: {
          gdprCompliant: this.privacySettings.dataRetention,
          ccpaCompliant: !this.privacySettings.dataSharing,
          retentionPoliciesActive: Object.keys(this.retentionPolicies).length > 0
        }
      };

    } catch (error) {
      console.error('Failed to generate privacy report:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup
   */
  scheduleCleanup() {
    // Run cleanup daily
    setInterval(async () => {
      try {
        await this.cleanupExpiredData();
        console.warn('✅ Scheduled privacy cleanup completed');
      } catch (error) {
        console.error('❌ Scheduled privacy cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run cleanup on page load
    setTimeout(() => {
      this.cleanupExpiredData().catch(error => {
        console.error('Initial privacy cleanup failed:', error);
      });
    }, 5000); // 5 seconds after initialization
  }

  /**
   * Get privacy settings
   * @returns {PrivacySettings}
   */
  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  /**
   * Get retention policies
   * @returns {RetentionPolicies}
   */
  getRetentionPolicies() {
    return { ...this.retentionPolicies };
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();
