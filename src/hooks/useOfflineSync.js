import { useState, useEffect, useCallback, useRef } from 'react';

// Enhanced offline sync hook for financial data
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [pendingChanges, setPendingChanges] = useState(0);
  const syncIntervalRef = useRef(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic sync when online
    if (isOnline) {
      syncIntervalRef.current = setInterval(processSyncQueue, 30000); // Every 30 seconds
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline]);

  // Load sync queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('financeanalyst_sync_queue');
    if (savedQueue) {
      try {
        const queue = JSON.parse(savedQueue);
        setSyncQueue(queue);
        setPendingChanges(queue.length);
      } catch (error) {
        console.error('Failed to load sync queue:', error);
      }
    }
  }, []);

  // Save sync queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('financeanalyst_sync_queue', JSON.stringify(syncQueue));
    setPendingChanges(syncQueue.length);
  }, [syncQueue]);

  // Add item to sync queue
  const queueSync = useCallback((action) => {
    const syncItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      action,
      retries: 0,
      maxRetries: 3
    };

    setSyncQueue(prev => [...prev, syncItem]);

    // If online, try to sync immediately
    if (isOnline) {
      setTimeout(processSyncQueue, 100);
    }
  }, [isOnline]);

  // Process the sync queue
  const processSyncQueue = useCallback(async() => {
    if (!isOnline || syncQueue.length === 0) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');

    const itemsToProcess = [...syncQueue];
    const processedItems = [];
    const failedItems = [];

    for (const item of itemsToProcess) {
      try {
        await executeSync(item.action);
        processedItems.push(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);

        if (item.retries < item.maxRetries) {
          failedItems.push({
            ...item,
            retries: item.retries + 1,
            lastError: error.message
          });
        } else {
          // Max retries reached, remove from queue
          console.error('Max retries reached for sync item:', item.id);
          processedItems.push(item.id);
        }
      }
    }

    // Update queue - remove processed items, keep failed items for retry
    setSyncQueue(prev => {
      const remaining = prev.filter(item => !processedItems.includes(item.id));
      return [...remaining, ...failedItems];
    });

    setSyncStatus(syncQueue.length > 0 ? 'error' : 'idle');
  }, [isOnline, syncQueue]);

  // Execute individual sync action
  const executeSync = async(action) => {
    const { type, data, endpoint, method = 'POST' } = action;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if available
        ...(localStorage.getItem('auth_token') && {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        })
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  // Clear sync queue (for manual reset)
  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
    localStorage.removeItem('financeanalyst_sync_queue');
  }, []);

  // Save data offline with automatic queuing for sync
  const saveOffline = useCallback((key, data, syncAction = null) => {
    // Save to localStorage immediately
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      synced: isOnline && !syncAction
    }));

    // Queue for sync if sync action provided
    if (syncAction) {
      queueSync(syncAction);
    }
  }, [isOnline, queueSync]);

  // Load data from offline storage
  const loadOffline = useCallback((key) => {
    const stored = localStorage.getItem(`offline_${key}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse offline data:', error);
      }
    }
    return null;
  }, []);

  // Remove offline data
  const removeOffline = useCallback((key) => {
    localStorage.removeItem(`offline_${key}`);
  }, []);

  // Get all offline data keys
  const getOfflineKeys = useCallback(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_')) {
        keys.push(key.replace('offline_', ''));
      }
    }
    return keys;
  }, []);

  // Manual sync trigger
  const forcSync = useCallback(async() => {
    if (isOnline) {
      await processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  return {
    isOnline,
    syncStatus,
    pendingChanges,
    queueSync,
    saveOffline,
    loadOffline,
    removeOffline,
    getOfflineKeys,
    clearSyncQueue,
    forcSync
  };
};
