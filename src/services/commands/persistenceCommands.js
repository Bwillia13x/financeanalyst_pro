/**
 * Persistence Commands
 * Commands for managing data persistence, backup, and privacy
 */

import { formatNumber, formatPercentage } from '../../utils/dataTransformation';
import { backupService } from '../persistence/BackupService';
import { persistenceManager } from '../persistence/PersistenceManager';
import { persistenceTestSuite } from '../persistence/PersistenceTestSuite';
import { privacyService } from '../persistence/PrivacyService';
import { syncService } from '../persistence/SyncService';

export const persistenceCommands = {
  BACKUP_CREATE: {
    execute: async (_parsedCommand, _context, _processor) => {
      const [description] = _parsedCommand.parameters;

      try {
        const backup = await backupService.createBackup({
          description: description || 'Manual backup',
          includeSettings: true,
          includeWatchlists: true,
          includeAlerts: true,
          includeHistory: true,
          compress: true,
          encrypt: false
        });

        const content = `💾 Backup Created Successfully\n\n📋 BACKUP DETAILS:\n• Backup ID: ${backup.backupId}\n• Size: ${formatNumber(backup.size / 1024, 1)} KB\n• Original Size: ${formatNumber(backup.originalSize / 1024, 1)} KB\n• Compression Ratio: ${formatPercentage(backup.metadata.compressionRatio || 0)}\n• Timestamp: ${backup.timestamp}\n• Description: ${description || 'Manual backup'}\n\n💡 BACKUP INCLUDES:\n• User preferences and settings\n• Watchlists and alerts\n• Command and analysis history\n• All user variables\n\n🔧 MANAGEMENT:\n• Use BACKUP_LIST() to view all backups\n• Use BACKUP_RESTORE(id) to restore from backup\n• Use BACKUP_EXPORT(id) to download backup file\n\n✅ Your data is now safely backed up and can be restored at any time.`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'backup_create',
            backup
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Backup creation failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: ['description']
    }
  },

  BACKUP_LIST: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const backups = await backupService.listBackups();
        const stats = await backupService.getBackupStats();

        if (backups.length === 0) {
          return {
            type: 'info',
            content:
              '📁 No Backups Found\n\nYou haven\'t created any backups yet.\n\n💡 CREATE YOUR FIRST BACKUP:\n• Use BACKUP_CREATE() to create a backup\n• Use BACKUP_CREATE("description") to add a description\n\nBackups help protect your data and allow you to restore previous states.'
          };
        }

        const content = `📁 Backup List (${backups.length} backups)\n\n📊 BACKUP STATISTICS:\n• Total Backups: ${stats.totalBackups}\n• Total Size: ${formatNumber(stats.totalSize / 1024, 1)} KB\n• Oldest: ${stats.oldestBackup ? new Date(stats.oldestBackup).toLocaleDateString() : 'N/A'}\n• Newest: ${stats.newestBackup ? new Date(stats.newestBackup).toLocaleDateString() : 'N/A'}\n• Encrypted: ${stats.encryptedBackups}\n• Compressed: ${stats.compressedBackups}\n\n📋 AVAILABLE BACKUPS:\n${backups
          .slice(0, 10)
          .map((backup, index) => {
            const date = new Date(backup.timestamp).toLocaleString();
            const size = formatNumber(backup.size / 1024, 1);
            const features = [];
            if (backup.compressed) features.push('📦 Compressed');
            if (backup.encrypted) features.push('🔒 Encrypted');

            return `${index + 1}. ${backup.id}\n   📅 ${date}\n   📏 ${size} KB\n   📝 ${backup.description || 'No description'}\n   ${features.join(' ')}`;
          })
          .join(
            '\n\n'
          )}\n\n🔧 BACKUP COMMANDS:\n• BACKUP_RESTORE(id) - Restore from backup\n• BACKUP_EXPORT(id) - Export backup to file\n• BACKUP_DELETE(id) - Delete backup\n• BACKUP_CREATE() - Create new backup\n\n💡 TIP: Use the backup ID (not the number) for restore operations.`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'backup_list',
            backups,
            stats
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Failed to list backups: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  BACKUP_RESTORE: {
    execute: async (_parsedCommand, _context, _processor) => {
      const [backupId, overwrite = 'false'] = _parsedCommand.parameters;

      if (!backupId) {
        return {
          type: 'error',
          content:
            'BACKUP_RESTORE requires a backup ID. Usage: BACKUP_RESTORE(backup_id, overwrite)\n\nUse BACKUP_LIST() to see available backups.'
        };
      }

      try {
        const shouldOverwrite = overwrite.toLowerCase() === 'true';

        const result = await backupService.restoreBackup(backupId, {
          overwrite: shouldOverwrite,
          createBackupBeforeRestore: true
        });

        const content = `🔄 Backup Restored Successfully\n\n📋 RESTORE DETAILS:\n• Backup ID: ${result.backupId}\n• Backup Date: ${new Date(result.backupTimestamp).toLocaleString()}\n• Restore Date: ${new Date(result.restoreTimestamp).toLocaleString()}\n• Overwrite Mode: ${shouldOverwrite ? 'Enabled' : 'Disabled'}\n\n📊 RESTORE RESULTS:\n• Items Restored: ${result.results.restored}\n• Items Skipped: ${result.results.skipped}\n• Errors: ${result.results.errors}\n\n📋 DETAILED RESULTS:\n${Object.entries(
          result.results.details
        )
          .map(([item, status]) => `• ${item}: ${status}`)
          .join(
            '\n'
          )}\n\n⚠️ IMPORTANT:\n• A backup was created before restore\n• Refresh the page to see all changes\n• Some settings may require restart to take effect\n\n✅ Your data has been restored from the selected backup.`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'backup_restore',
            result
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Backup restore failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['backupId'],
      optional: ['overwrite']
    }
  },

  STORAGE_STATS: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const stats = await persistenceManager.getStorageStats();

        if (!stats) {
          return {
            type: 'error',
            content:
              'Unable to retrieve storage statistics. Persistence layer may not be initialized.'
          };
        }

        const totalUsedMB = stats.total.used / (1024 * 1024);
        const totalAvailableMB = stats.total.available / (1024 * 1024);
        const quotaMB = stats.total.quota / (1024 * 1024);

        const content = `💾 Storage Statistics\n\n📊 OVERALL USAGE:\n• Total Used: ${formatNumber(totalUsedMB, 2)} MB\n• Total Available: ${formatNumber(totalAvailableMB, 2)} MB\n• Storage Quota: ${formatNumber(quotaMB, 2)} MB\n• Usage Percentage: ${formatPercentage(stats.total.usagePercentage / 100)}\n\n📱 LOCAL STORAGE:\n• Used: ${formatNumber(stats.localStorage.used / 1024, 1)} KB\n• Items: ${stats.localStorage.keys}\n• Usage: ${formatPercentage(stats.localStorage.usagePercentage / 100)}\n• Status: ${stats.localStorage.available ? '✅ Available' : '❌ Unavailable'}\n\n🗄️ INDEXED DB:\n• Used: ${formatNumber(stats.indexedDB.used / 1024, 1)} KB\n• Records: ${stats.indexedDB.total.records}\n• Stores: ${Object.keys(stats.indexedDB.stores).length}\n• Status: ${stats.indexedDB.available ? '✅ Available' : '❌ Unavailable'}\n\n📋 STORE BREAKDOWN:\n${Object.entries(
          stats.indexedDB.stores
        )
          .map(
            ([store, data]) =>
              `• ${store}: ${data.records} records (${formatNumber(data.size / 1024, 1)} KB)`
          )
          .join(
            '\n'
          )}\n\n⚠️ STORAGE HEALTH:\n${stats.total.usagePercentage > 90 ? '🔴 Critical: Storage almost full' : stats.total.usagePercentage > 75 ? '🟡 Warning: High storage usage' : '🟢 Good: Storage usage is healthy'}\n\n💡 OPTIMIZATION TIPS:\n${stats.total.usagePercentage > 75 ? '• Consider clearing old cached data\n• Delete unnecessary backups\n• Use PRIVACY_CLEANUP() to remove expired data\n' : ''}• Regular backups help manage storage\n• Use compression for large datasets\n• Monitor usage with this command\n\n🔧 MANAGEMENT COMMANDS:\n• PRIVACY_CLEANUP() - Clean expired data\n• BACKUP_LIST() - Manage backups\n• cache clear - Clear cached data`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'storage_stats',
            stats
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Failed to get storage statistics: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PRIVACY_CLEANUP: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const results = await privacyService.cleanupExpiredData();

        const content = `🧹 Privacy Cleanup Complete\n\n📊 CLEANUP RESULTS:\n• Items Cleaned: ${results.cleaned}\n• Errors: ${results.errors}\n\n📋 DETAILED RESULTS:\n${Object.entries(
          results.details
        )
          .map(
            ([dataType, result]) =>
              `• ${dataType}: ${typeof result === 'number' ? `${result} items cleaned` : result}`
          )
          .join(
            '\n'
          )}\n\n🔒 PRIVACY COMPLIANCE:\n• Expired data removed according to retention policies\n• User privacy preferences respected\n• Data minimization principles applied\n\n⚙️ CURRENT RETENTION POLICIES:\n${Object.entries(
          privacyService.getRetentionPolicies()
        )
          .map(([type, days]) => `• ${type}: ${days} days`)
          .join(
            '\n'
          )}\n\n💡 PRIVACY COMMANDS:\n• PRIVACY_SETTINGS() - View/update privacy settings\n• PRIVACY_EXPORT() - Export your data (GDPR)\n• PRIVACY_DELETE() - Delete all data (Right to be forgotten)\n\n✅ Your data has been cleaned according to privacy policies.`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'privacy_cleanup',
            results
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Privacy cleanup failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PRIVACY_SETTINGS: {
    execute: async (_parsedCommand, _context, _processor) => {
      const [setting, value] = _parsedCommand.parameters;

      try {
        if (!setting) {
          // Show current settings
          const settings = privacyService.getPrivacySettings();
          const policies = privacyService.getRetentionPolicies();

          const content = `🔒 Privacy Settings\n\n⚙️ CURRENT SETTINGS:\n${Object.entries(settings)
            .map(([key, val]) => `• ${key}: ${val ? '✅ Enabled' : '❌ Disabled'}`)
            .join('\n')}\n\n📅 RETENTION POLICIES:\n${Object.entries(policies)
            .map(([type, days]) => `• ${type}: ${days} days`)
            .join(
              '\n'
            )}\n\n🛡️ PRIVACY CONTROLS:\n• dataRetention: Keep historical data\n• analytics: Allow usage analytics\n• crashReporting: Send crash reports\n• dataSharing: Share data with partners\n• cookieConsent: Accept cookies\n• trackingConsent: Allow tracking\n\n💡 USAGE:\n• PRIVACY_SETTINGS() - Show all settings\n• PRIVACY_SETTINGS("setting", "true/false") - Update setting\n• PRIVACY_CLEANUP() - Clean expired data\n\nExample: PRIVACY_SETTINGS("analytics", "false")`;

          return {
            type: 'success',
            content,
            data: {
              analysis: 'privacy_settings_view',
              settings,
              policies
            }
          };
        }

        if (value === undefined) {
          const currentValue = privacyService.getPrivacySettings()[setting];
          return {
            type: 'info',
            content: `🔒 Privacy Setting: ${setting}\nCurrent Value: ${currentValue ? '✅ Enabled' : '❌ Disabled'}\n\nTo update: PRIVACY_SETTINGS("${setting}", "true/false")`
          };
        }

        // Update setting
        const boolValue = value.toLowerCase() === 'true';
        await privacyService.updatePrivacySettings({ [setting]: boolValue });

        return {
          type: 'success',
          content: `✅ Privacy Setting Updated\n\n• Setting: ${setting}\n• New Value: ${boolValue ? '✅ Enabled' : '❌ Disabled'}\n\nSetting has been saved and will take effect immediately.`,
          data: {
            analysis: 'privacy_settings_update',
            setting,
            value: boolValue
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Failed to manage privacy settings: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: ['setting', 'value']
    }
  },

  SYNC_STATUS: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const status = syncService.getSyncStatus();

        const content = `🔄 Sync Status\n\n📊 SYNC OVERVIEW:\n• Last Sync: ${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : 'Never'}\n• Sync In Progress: ${status.syncInProgress ? '🟡 Yes' : '🟢 No'}\n• Queue Size: ${status.queueSize} operations\n• Online Status: ${status.isOnline ? '🟢 Online' : '🔴 Offline'}\n• Endpoint Configured: ${status.hasEndpoint ? '✅ Yes' : '❌ No'}\n• Strategy: ${status.strategy}\n\n🔧 SYNC CONFIGURATION:\n${!status.hasEndpoint ? '⚠️ No sync endpoint configured - sync is disabled\n' : ''}${status.queueSize > 0 ? `📋 ${status.queueSize} operations waiting to sync\n` : ''}${!status.isOnline ? '📡 Device is offline - sync will resume when online\n' : ''}\n\n💡 SYNC COMMANDS:\n• SYNC_NOW() - Force immediate sync (when available)\n• SYNC_QUEUE() - View pending operations\n• BACKUP_CREATE() - Create local backup\n\n${!status.hasEndpoint ? '🚀 FUTURE FEATURE:\nCloud sync will be available in a future update.\nFor now, use BACKUP_CREATE() and BACKUP_EXPORT() for data portability.' : '✅ Sync is configured and ready.'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'sync_status',
            status
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Failed to get sync status: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  },

  PERSISTENCE_TEST: {
    execute: async (_parsedCommand, _context, _processor) => {
      try {
        const testResults = await persistenceTestSuite.runAllTests();

        const content = `🧪 Persistence Layer Test Results\n\n📊 TEST SUMMARY:\n• Total Tests: ${testResults.total}\n• Passed: ${testResults.passed} ✅\n• Failed: ${testResults.total - testResults.passed} ❌\n• Success Rate: ${formatPercentage(testResults.passed / testResults.total)}\n• Overall Status: ${testResults.success ? '✅ PASS' : '❌ FAIL'}\n\n📋 DETAILED RESULTS:\n${testResults.results
          .map((result, index) => {
            const status = result.passed ? '✅' : result.skipped ? '⏭️' : '❌';
            const details = result.error
              ? ` (${result.error})`
              : result.reason
                ? ` (${result.reason})`
                : '';
            return `${index + 1}. ${status} ${result.testName}${details}`;
          })
          .join(
            '\n'
          )}\n\n🔧 COMPONENT STATUS:\n• PersistenceManager: ${testResults.results.find(r => r.testName.includes('Persistence Manager'))?.passed ? '✅ Working' : '❌ Issues'}\n• BackupService: ${testResults.results.find(r => r.testName.includes('Backup'))?.passed ? '✅ Working' : '❌ Issues'}\n• PrivacyService: ${testResults.results.find(r => r.testName.includes('Privacy'))?.passed ? '✅ Working' : '❌ Issues'}\n• SyncService: ${testResults.results.find(r => r.testName.includes('Sync'))?.passed ? '✅ Working' : '❌ Issues'}\n\n💡 RECOMMENDATIONS:\n${testResults.success ? '• All tests passed - persistence layer is working correctly\n• Regular testing recommended to ensure continued functionality' : '• Some tests failed - check browser console for detailed error messages\n• Consider running individual component tests\n• Verify browser storage permissions and quotas'}\n\n🔍 DEBUGGING:\n• Check browser console for detailed test output\n• Use browser DevTools to inspect localStorage and IndexedDB\n• Run "STORAGE_STATS()" to check storage usage\n\n${testResults.success ? '✅ Persistence layer is fully functional and ready for production use!' : '⚠️ Issues detected - please review failed tests and resolve before production use.'}`;

        return {
          type: testResults.success ? 'success' : 'warning',
          content,
          data: {
            analysis: 'persistence_test',
            testResults
          }
        };
      } catch (error) {
        return {
          type: 'error',
          content: `Persistence test suite failed: ${error.message}\n\nCheck browser console for detailed error information.`
        };
      }
    },
    parameterSchema: {
      required: [],
      optional: []
    }
  }
};
