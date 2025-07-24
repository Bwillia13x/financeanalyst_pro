/**
 * Data Migration Service
 * Handles data migrations between different versions and storage formats
 */

export class DataMigrationService {
  constructor() {
    this.currentVersion = '1.0.0';
    this.migrationKey = 'financeanalyst_migration_version';
    this.backupKey = 'financeanalyst_migration_backup';
    
    // Define migration paths
    this.migrations = {
      '0.0.0': {
        to: '1.0.0',
        description: 'Initial migration to structured persistence layer',
        migrate: this.migrateToV1_0_0.bind(this)
      }
      // Future migrations will be added here
    };
  }

  /**
   * Check if migration is needed and perform it
   */
  async checkAndMigrate() {
    try {
      const currentStoredVersion = localStorage.getItem(this.migrationKey);
      
      if (!currentStoredVersion) {
        // First time setup - check for legacy data
        await this.performInitialMigration();
      } else if (currentStoredVersion !== this.currentVersion) {
        // Version mismatch - perform migration
        await this.performVersionMigration(currentStoredVersion, this.currentVersion);
      }

      // Update stored version
      localStorage.setItem(this.migrationKey, this.currentVersion);
      
      console.log(`✅ Data migration complete - version ${this.currentVersion}`);
      return { success: true, version: this.currentVersion };

    } catch (error) {
      console.error('❌ Data migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform initial migration from legacy data
   */
  async performInitialMigration() {
    console.log('🔄 Performing initial data migration...');
    
    try {
      // Check for legacy data patterns
      const legacyData = await this.detectLegacyData();
      
      if (Object.keys(legacyData).length > 0) {
        // Create backup before migration
        await this.createMigrationBackup(legacyData);
        
        // Migrate legacy data to new format
        await this.migrateToV1_0_0(legacyData);
        
        console.log('✅ Legacy data migrated successfully');
      } else {
        console.log('ℹ️ No legacy data found - clean installation');
      }

    } catch (error) {
      console.error('Failed to perform initial migration:', error);
      throw error;
    }
  }

  /**
   * Perform version-to-version migration
   */
  async performVersionMigration(fromVersion, toVersion) {
    console.log(`🔄 Migrating data from ${fromVersion} to ${toVersion}...`);
    
    try {
      // Find migration path
      const migrationPath = this.findMigrationPath(fromVersion, toVersion);
      
      if (!migrationPath.length) {
        throw new Error(`No migration path found from ${fromVersion} to ${toVersion}`);
      }

      // Create backup before migration
      const currentData = await this.exportCurrentData();
      await this.createMigrationBackup(currentData, fromVersion);

      // Execute migrations in sequence
      for (const migration of migrationPath) {
        console.log(`🔄 Applying migration: ${migration.description}`);
        await migration.migrate();
      }

      console.log('✅ Version migration completed successfully');

    } catch (error) {
      console.error('Failed to perform version migration:', error);
      
      // Attempt to restore from backup
      await this.restoreFromBackup();
      throw error;
    }
  }

  /**
   * Detect legacy data in localStorage
   */
  async detectLegacyData() {
    const legacyData = {};
    
    try {
      // Check for old command processor data
      const oldVariables = localStorage.getItem('commandProcessor_variables');
      if (oldVariables) {
        legacyData.variables = JSON.parse(oldVariables);
      }

      // Check for old settings
      const oldSettings = localStorage.getItem('commandProcessor_settings');
      if (oldSettings) {
        legacyData.settings = JSON.parse(oldSettings);
      }

      // Check for old watchlists (if stored differently)
      const oldWatchlists = localStorage.getItem('watchlists');
      if (oldWatchlists) {
        legacyData.watchlists = JSON.parse(oldWatchlists);
      }

      // Check for old alerts
      const oldAlerts = localStorage.getItem('alerts');
      if (oldAlerts) {
        legacyData.alerts = JSON.parse(oldAlerts);
      }

      // Check for any other financeanalyst_ prefixed items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('financeanalyst_') && 
            !key.includes('migration') && 
            !key.includes('session') && 
            !key.includes('user') &&
            !key.includes('crypto_key')) {
          try {
            legacyData[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            legacyData[key] = localStorage.getItem(key);
          }
        }
      });

      return legacyData;

    } catch (error) {
      console.error('Failed to detect legacy data:', error);
      return {};
    }
  }

  /**
   * Migration to version 1.0.0
   */
  async migrateToV1_0_0(legacyData = null) {
    try {
      const dataToMigrate = legacyData || await this.detectLegacyData();
      
      // Migrate watchlists to new format
      if (dataToMigrate.watchlists) {
        const migratedWatchlists = this.migrateWatchlistsFormat(dataToMigrate.watchlists);
        localStorage.setItem('financeanalyst_watchlists', JSON.stringify(migratedWatchlists));
      }

      // Migrate alerts to new format
      if (dataToMigrate.alerts) {
        const migratedAlerts = this.migrateAlertsFormat(dataToMigrate.alerts);
        localStorage.setItem('financeanalyst_alerts', JSON.stringify(migratedAlerts));
      }

      // Migrate user preferences
      if (dataToMigrate.settings) {
        const migratedPreferences = this.migratePreferencesFormat(dataToMigrate.settings);
        localStorage.setItem('financeanalyst_preferences', JSON.stringify(migratedPreferences));
      }

      // Migrate variables to new storage
      if (dataToMigrate.variables) {
        const migratedVariables = this.migrateVariablesFormat(dataToMigrate.variables);
        localStorage.setItem('financeanalyst_user_variables', JSON.stringify(migratedVariables));
      }

      // Clean up old data
      await this.cleanupLegacyData(dataToMigrate);

      console.log('✅ Migration to v1.0.0 completed');

    } catch (error) {
      console.error('Failed to migrate to v1.0.0:', error);
      throw error;
    }
  }

  /**
   * Migrate watchlists to new format
   */
  migrateWatchlistsFormat(oldWatchlists) {
    const migrated = {};
    
    if (Array.isArray(oldWatchlists)) {
      // Old format was array, convert to object
      oldWatchlists.forEach((watchlist, index) => {
        const name = watchlist.name || `Watchlist ${index + 1}`;
        migrated[name] = {
          tickers: watchlist.tickers || watchlist.stocks || [],
          created: watchlist.created || new Date().toISOString().split('T')[0],
          lastUpdated: watchlist.lastUpdated || null
        };
      });
    } else if (typeof oldWatchlists === 'object') {
      // Already in object format, just ensure structure
      Object.entries(oldWatchlists).forEach(([name, data]) => {
        migrated[name] = {
          tickers: data.tickers || data.stocks || [],
          created: data.created || new Date().toISOString().split('T')[0],
          lastUpdated: data.lastUpdated || null
        };
      });
    }

    return migrated;
  }

  /**
   * Migrate alerts to new format
   */
  migrateAlertsFormat(oldAlerts) {
    if (!Array.isArray(oldAlerts)) {
      return [];
    }

    return oldAlerts.map(alert => ({
      id: alert.id || Date.now() + Math.random(),
      ticker: alert.ticker,
      condition: alert.condition,
      value: alert.value,
      created: alert.created || new Date().toISOString().split('T')[0],
      triggered: alert.triggered || false
    }));
  }

  /**
   * Migrate preferences to new format
   */
  migratePreferencesFormat(oldSettings) {
    return {
      currency: oldSettings.currency || 'USD',
      precision: oldSettings.precision || 2,
      dateFormat: oldSettings.dateFormat || 'YYYY-MM-DD',
      theme: oldSettings.theme || 'dark',
      notifications: oldSettings.notifications !== false,
      autoSave: oldSettings.autoSave !== false,
      commandHistory: oldSettings.commandHistory !== false,
      dataRetention: oldSettings.dataRetention || 30,
      privacy: {
        analytics: oldSettings.analytics || false,
        crashReporting: oldSettings.crashReporting !== false,
        dataSharing: oldSettings.dataSharing || false
      }
    };
  }

  /**
   * Migrate variables to new format
   */
  migrateVariablesFormat(oldVariables) {
    // Variables format should remain mostly the same
    return { ...oldVariables };
  }

  /**
   * Clean up legacy data after migration
   */
  async cleanupLegacyData(legacyData) {
    try {
      // Remove old localStorage keys
      const keysToRemove = [
        'commandProcessor_variables',
        'commandProcessor_settings',
        'watchlists',
        'alerts'
      ];

      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });

      // Remove other legacy keys found in detection
      Object.keys(legacyData).forEach(key => {
        if (key.startsWith('financeanalyst_') && 
            !key.includes('migration') && 
            !key.includes('session') && 
            !key.includes('user') &&
            !key.includes('crypto_key')) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ Legacy data cleanup completed');

    } catch (error) {
      console.error('Failed to cleanup legacy data:', error);
      // Don't throw - cleanup failure shouldn't break migration
    }
  }

  /**
   * Create backup before migration
   */
  async createMigrationBackup(data, version = 'legacy') {
    try {
      const backup = {
        version,
        timestamp: new Date().toISOString(),
        data
      };

      localStorage.setItem(this.backupKey, JSON.stringify(backup));
      console.log(`✅ Migration backup created for version ${version}`);

    } catch (error) {
      console.error('Failed to create migration backup:', error);
      // Don't throw - backup failure shouldn't prevent migration
    }
  }

  /**
   * Restore from migration backup
   */
  async restoreFromBackup() {
    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        throw new Error('No migration backup found');
      }

      const backup = JSON.parse(backupData);
      
      // Restore data based on backup version
      if (backup.version === 'legacy') {
        // Restore legacy format
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      console.log('✅ Data restored from migration backup');
      return true;

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Export current data for backup
   */
  async exportCurrentData() {
    const data = {};
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('financeanalyst_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    });

    return data;
  }

  /**
   * Find migration path between versions
   */
  findMigrationPath(fromVersion, toVersion) {
    // For now, simple direct migration
    // In the future, this could handle complex migration chains
    const migration = this.migrations[fromVersion];
    
    if (migration && migration.to === toVersion) {
      return [migration];
    }

    return [];
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    const storedVersion = localStorage.getItem(this.migrationKey);
    const hasBackup = !!localStorage.getItem(this.backupKey);
    
    return {
      currentVersion: this.currentVersion,
      storedVersion,
      needsMigration: storedVersion !== this.currentVersion,
      hasBackup,
      availableMigrations: Object.keys(this.migrations)
    };
  }

  /**
   * Clear migration backup
   */
  clearBackup() {
    localStorage.removeItem(this.backupKey);
    console.log('✅ Migration backup cleared');
  }
}
