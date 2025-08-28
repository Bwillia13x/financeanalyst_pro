import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, Cloud, CloudOff, Sync, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { useOfflineSync } from '../../hooks/useOfflineSync';

const OfflineIndicator = () => {
  const { isOnline, syncStatus, pendingChanges, forcSync } = useOfflineSync();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (syncStatus === 'syncing') return 'bg-yellow-500';
    if (pendingChanges > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-white" />;
    if (syncStatus === 'syncing') return <Sync className="w-4 h-4 text-white animate-spin" />;
    if (pendingChanges > 0) return <CloudOff className="w-4 h-4 text-white" />;
    return <Wifi className="w-4 h-4 text-white" />;
  };

  const getStatusMessage = () => {
    if (!isOnline) return 'Working offline';
    if (syncStatus === 'syncing') return 'Syncing changes...';
    if (pendingChanges > 0) return `${pendingChanges} pending changes`;
    return 'All data synced';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Status Indicator */}
        <motion.button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg text-white text-sm font-medium ${getStatusColor()} backdrop-blur-sm`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusMessage()}</span>
        </motion.button>

        {/* Detailed Status Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Connection Status
                  </h3>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                </div>

                <div className="space-y-3">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {syncStatus === 'syncing' ? (
                        <Sync className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : syncStatus === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Cloud className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {syncStatus === 'syncing'
                          ? 'Syncing...'
                          : syncStatus === 'error'
                            ? 'Sync Error'
                            : 'Synced'}
                      </span>
                    </div>
                    {pendingChanges > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-full">
                        {pendingChanges}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={forcSync}
                      disabled={!isOnline || syncStatus === 'syncing'}
                      className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Force Sync
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  {/* Offline Features Notice */}
                  {!isOnline && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Offline Mode Active
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Your work is being saved locally and will sync when connection is
                            restored.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OfflineIndicator;
