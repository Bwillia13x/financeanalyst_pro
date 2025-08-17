// @ts-check
/**
 * Persistence Test Suite
 * Browser-based integration tests for the persistence layer
 */

import { backupService } from './BackupService';
import { persistenceManager } from './PersistenceManager';
import { privacyService } from './PrivacyService';
import { syncService } from './SyncService';

/**
 * @typedef {Object} TestResult
 * @property {string} testName
 * @property {string} description
 * @property {boolean} passed
 * @property {any} [data]
 * @property {string} timestamp
 * @property {boolean} [skipped]
 * @property {string} [reason]
 * @property {string} [error]
 */

/**
 * @typedef {Object} TestSuiteSummary
 * @property {number} total
 * @property {number} passed
 * @property {number} failed
 * @property {number} skipped
 * @property {number} successRate
 * @property {TestResult[]} results
 */

/**
 * @typedef {Object} RunAllTestsResult
 * @property {number} passed
 * @property {number} total
 * @property {boolean} success
 * @property {TestResult[]} results
 * @property {string} [error]
 */

export class PersistenceTestSuite {
  constructor() {
    /** @type {TestResult[]} */
    this.testResults = [];
    /** @type {boolean} */
    this.isRunning = false;
  }

  /**
   * Run all persistence tests
   * @returns {Promise<RunAllTestsResult>}
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn('Tests are already running');
      const summary = this.getTestSummary();
      return {
        passed: summary.passed,
        total: summary.total,
        success: summary.failed === 0,
        results: summary.results
      };
    }

    this.isRunning = true;
    this.testResults = [];

    console.warn('🧪 Starting Persistence Layer Test Suite...');

    try {
      // Core persistence tests
      await this.testPersistenceManagerInitialization();
      await this.testDataStorageAndRetrieval();
      await this.testDataRemoval();
      await this.testStorageStatistics();

      // Backup service tests
      await this.testBackupCreation();
      await this.testBackupListing();
      await this.testBackupRestore();

      // Privacy service tests
      await this.testPrivacySettings();
      await this.testDataCleanup();

      // Sync service tests
      await this.testSyncStatus();

      // Integration tests
      await this.testDataLifecycle();
      await this.testErrorHandling();

      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;

      console.warn(`✅ Test Suite Complete: ${passed}/${total} tests passed`);

      return {
        passed,
        total,
        success: passed === total,
        results: this.testResults
      };

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      return {
        passed: 0,
        total: this.testResults.length,
        success: false,
        error: message,
        results: this.testResults
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Test persistence manager initialization
   * @returns {Promise<void>}
   */
  async testPersistenceManagerInitialization() {
    const testName = 'Persistence Manager Initialization';

    try {
      const result = await persistenceManager.initialize();

      this.assert(
        result.success === true,
        testName,
        'Should initialize successfully',
        result
      );

      this.assert(
        persistenceManager.isInitialized === true,
        testName,
        'Should set initialized flag',
        { isInitialized: persistenceManager.isInitialized }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test data storage and retrieval
   * @returns {Promise<void>}
   */
  async testDataStorageAndRetrieval() {
    const testName = 'Data Storage and Retrieval';

    try {
      const testData = {
        test: true,
        timestamp: Date.now(),
        data: ['item1', 'item2', 'item3']
      };

      // Test localStorage storage
      const storeResult = await persistenceManager.store('test_data', testData, {
        storage: 'localStorage'
      });

      this.assert(
        storeResult.success === true,
        testName,
        'Should store data successfully',
        storeResult
      );

      // Test data retrieval
      const retrievedData = await persistenceManager.retrieve('test_data');

      this.assert(
        JSON.stringify(retrievedData) === JSON.stringify(testData),
        testName,
        'Should retrieve stored data correctly',
        { stored: testData, retrieved: retrievedData }
      );

      // Test IndexedDB storage
      const indexedStoreResult = await persistenceManager.store('test_indexed_data', testData, {
        storage: 'indexedDB'
      });

      this.assert(
        indexedStoreResult.success === true,
        testName,
        'Should store data in IndexedDB',
        indexedStoreResult
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test data removal
   * @returns {Promise<void>}
   */
  async testDataRemoval() {
    const testName = 'Data Removal';

    try {
      // Store test data first
      await persistenceManager.store('test_removal', { data: 'to_be_removed' });

      // Remove the data
      const removeResult = await persistenceManager.remove('test_removal');

      this.assert(
        removeResult === true,
        testName,
        'Should remove data successfully',
        { removeResult }
      );

      // Verify data is gone
      const retrievedData = await persistenceManager.retrieve('test_removal');

      this.assert(
        retrievedData === null,
        testName,
        'Should return null for removed data',
        { retrievedData }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test storage statistics
   * @returns {Promise<void>}
   */
  async testStorageStatistics() {
    const testName = 'Storage Statistics';

    try {
      const stats = await persistenceManager.getStorageStats();

      this.assert(
        stats !== null && typeof stats === 'object',
        testName,
        'Should return storage statistics',
        stats
      );

      this.assert(
        typeof stats.total.used === 'number',
        testName,
        'Should include total usage',
        { totalUsed: stats.total.used }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test backup creation
   * @returns {Promise<void>}
   */
  async testBackupCreation() {
    const testName = 'Backup Creation';

    try {
      // Store some test data first
      await persistenceManager.store('backup_test_data', {
        test: 'backup_data',
        timestamp: Date.now()
      });

      const backup = await backupService.createBackup({
        description: 'Test backup',
        compress: true
      });

      this.assert(
        backup.success === true,
        testName,
        'Should create backup successfully',
        backup
      );

      this.assert(
        typeof backup.backupId === 'string',
        testName,
        'Should return backup ID',
        { backupId: backup.backupId }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test backup listing
   * @returns {Promise<void>}
   */
  async testBackupListing() {
    const testName = 'Backup Listing';

    try {
      const backups = await backupService.listBackups();

      this.assert(
        Array.isArray(backups),
        testName,
        'Should return array of backups',
        { backupsCount: backups.length }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test backup restore
   * @returns {Promise<void>}
   */
  async testBackupRestore() {
    const testName = 'Backup Restore';

    try {
      // Get available backups
      const backups = await backupService.listBackups();

      if (backups.length > 0) {
        const backupId = backups[0].id;

        const restoreResult = await backupService.restoreBackup(backupId, {
          overwrite: false
        });

        this.assert(
          restoreResult.success === true,
          testName,
          'Should restore backup successfully',
          restoreResult
        );
      } else {
        this.recordSkip(testName, 'No backups available for restore test');
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test privacy settings
   * @returns {Promise<void>}
   */
  async testPrivacySettings() {
    const testName = 'Privacy Settings';

    try {
      const settings = privacyService.getPrivacySettings();

      this.assert(
        typeof settings === 'object',
        testName,
        'Should return privacy settings',
        settings
      );

      // Test updating a setting
      await privacyService.updatePrivacySettings({ analytics: false });

      const updatedSettings = privacyService.getPrivacySettings();

      this.assert(
        updatedSettings.analytics === false,
        testName,
        'Should update privacy settings',
        { analytics: updatedSettings.analytics }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test data cleanup
   * @returns {Promise<void>}
   */
  async testDataCleanup() {
    const testName = 'Data Cleanup';

    try {
      const cleanupResult = await privacyService.cleanupExpiredData();

      this.assert(
        typeof cleanupResult.cleaned === 'number',
        testName,
        'Should return cleanup results',
        cleanupResult
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test sync status
   * @returns {Promise<void>}
   */
  async testSyncStatus() {
    const testName = 'Sync Status';

    try {
      const status = syncService.getSyncStatus();

      this.assert(
        typeof status === 'object',
        testName,
        'Should return sync status',
        status
      );

      this.assert(
        typeof status.isOnline === 'boolean',
        testName,
        'Should include online status',
        { isOnline: status.isOnline }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test complete data lifecycle
   * @returns {Promise<void>}
   */
  async testDataLifecycle() {
    const testName = 'Data Lifecycle';

    try {
      const testKey = 'lifecycle_test';
      const testData = { lifecycle: true, step: 1 };

      // Store
      await persistenceManager.store(testKey, testData);

      // Retrieve
      const retrieved = await persistenceManager.retrieve(testKey);

      // Update
      const updatedData = { ...testData, step: 2 };
      await persistenceManager.store(testKey, updatedData);

      // Retrieve updated
      const retrievedUpdated = await persistenceManager.retrieve(testKey);

      // Remove
      await persistenceManager.remove(testKey);

      // Verify removal
      const retrievedAfterRemoval = await persistenceManager.retrieve(testKey);

      this.assert(
        retrieved.step === 1 &&
        retrievedUpdated.step === 2 &&
        retrievedAfterRemoval === null,
        testName,
        'Should handle complete data lifecycle',
        {
          initial: retrieved?.step,
          updated: retrievedUpdated?.step,
          afterRemoval: retrievedAfterRemoval
        }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  /**
   * Test error handling
   * @returns {Promise<void>}
   */
  async testErrorHandling() {
    const testName = 'Error Handling';

    try {
      // Test invalid data retrieval
      const invalidResult = await persistenceManager.retrieve('non_existent_key_12345');

      this.assert(
        invalidResult === null,
        testName,
        'Should handle non-existent keys gracefully',
        { invalidResult }
      );

      // Test invalid backup restore
      try {
        await backupService.restoreBackup('invalid_backup_id');
        this.recordFailure(testName, 'Should have thrown error for invalid backup ID');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.assert(
          true,
          testName,
          'Should throw error for invalid backup ID',
          { error: message }
        );
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordFailure(testName, message);
    }
  }

  // Helper methods

  /**
   * @param {boolean} condition
   * @param {string} testName
   * @param {string} description
   * @param {any} [data]
   * @returns {void}
   */
  assert(condition, testName, description, data = null) {
    const result = {
      testName,
      description,
      passed: !!condition,
      data,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    if (condition) {
      console.warn(`✅ ${testName}: ${description}`);
    } else {
      console.error(`❌ ${testName}: ${description}`, data);
    }
  }

  /**
   * @param {string} testName
   * @param {string} error
   * @returns {void}
   */
  recordFailure(testName, error) {
    const result = {
      testName,
      description: 'Test failed with error',
      passed: false,
      error,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);
    console.error(`❌ ${testName}: ${error}`);
  }

  /**
   * @param {string} testName
   * @param {string} reason
   * @returns {void}
   */
  recordSkip(testName, reason) {
    const result = {
      testName,
      description: 'Test skipped',
      passed: true,
      skipped: true,
      reason,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);
    console.warn(`⏭️ ${testName}: Skipped - ${reason}`);
  }

  /**
   * Get test results summary
   * @returns {TestSuiteSummary}
   */
  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const skipped = this.testResults.filter(r => r.skipped).length;

    return {
      total,
      passed,
      failed,
      skipped,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      results: this.testResults
    };
  }
}

// Export singleton instance
export const persistenceTestSuite = new PersistenceTestSuite();

// Global test function for browser console
/** @type {any} */
(window).testPersistence = () => persistenceTestSuite.runAllTests();
