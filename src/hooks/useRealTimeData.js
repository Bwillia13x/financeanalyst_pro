import { useState, useEffect, useRef, useCallback } from 'react';

import realTimeDataService from '../services/realTimeDataService';

/**
 * Hook for managing real-time data subscriptions
 * Provides clean lifecycle management and automatic cleanup
 */

export const useRealTimeData = (dataType, symbol, options = {}) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const unsubscribeRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Handle data updates
  const handleDataUpdate = useCallback(
    newData => {
      setData(newData);
      setLastUpdated(new Date());
      setError(null);

      if (!isConnected) {
        setIsConnected(true);
      }

      // Call external update handler if provided
      if (optionsRef.current.onUpdate) {
        optionsRef.current.onUpdate(newData);
      }
    },
    [isConnected]
  );

  // Handle connection errors
  const handleError = useCallback(err => {
    setError(err);
    setIsConnected(false);

    if (optionsRef.current.onError) {
      optionsRef.current.onError(err);
    }

    // Auto-reconnect if enabled
    if (optionsRef.current.autoReconnect !== false) {
      const delay = optionsRef.current.reconnectDelay || 5000;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (dataType && symbol) {
          subscribe();
        }
      }, delay);
    }
  }, []);

  // Subscribe to data feed
  const subscribe = useCallback(() => {
    if (!dataType || !symbol) return;

    try {
      unsubscribeRef.current = realTimeDataService.subscribe(dataType, symbol, handleDataUpdate);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      handleError(err);
    }
  }, [dataType, symbol, handleDataUpdate, handleError]);

  // Unsubscribe from data feed
  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Setup subscription on mount and when dependencies change
  useEffect(() => {
    if (dataType && symbol && optionsRef.current.enabled !== false) {
      subscribe();
    }

    return unsubscribe;
  }, [dataType, symbol, subscribe, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    data,
    isConnected,
    error,
    lastUpdated,
    subscribe,
    unsubscribe,
    reconnect: subscribe
  };
};

/**
 * Hook for managing multiple real-time data subscriptions
 */
export const useMultipleRealTimeData = (subscriptions = []) => {
  const [dataMap, setDataMap] = useState(new Map());
  const [connectionStates, setConnectionStates] = useState(new Map());
  const [errors, setErrors] = useState(new Map());

  const unsubscribeRef = useRef(null);

  const updateData = useCallback((key, data) => {
    setDataMap(prev => new Map(prev.set(key, data)));
  }, []);

  const updateConnectionState = useCallback((key, isConnected) => {
    setConnectionStates(prev => new Map(prev.set(key, isConnected)));
  }, []);

  const updateError = useCallback((key, error) => {
    setErrors(prev => new Map(prev.set(key, error)));
  }, []);

  useEffect(() => {
    if (subscriptions.length === 0) return;

    const subscriptionConfigs = subscriptions.map(({ dataType, symbol, options = {} }) => ({
      dataType,
      symbol,
      callback: data => {
        const key = `${dataType}_${symbol}`;
        updateData(key, data);
        updateConnectionState(key, true);
        updateError(key, null);

        if (options.onUpdate) {
          options.onUpdate(data);
        }
      }
    }));

    try {
      unsubscribeRef.current = realTimeDataService.subscribeMultiple(subscriptionConfigs);

      // Initialize connection states
      subscriptions.forEach(({ dataType, symbol }) => {
        const key = `${dataType}_${symbol}`;
        updateConnectionState(key, true);
      });
    } catch (error) {
      console.error('Failed to subscribe to multiple feeds:', error);
      subscriptions.forEach(({ dataType, symbol }) => {
        const key = `${dataType}_${symbol}`;
        updateError(key, error);
        updateConnectionState(key, false);
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscriptions, updateData, updateConnectionState, updateError]);

  const getData = useCallback(
    (dataType, symbol) => {
      const key = `${dataType}_${symbol}`;
      return dataMap.get(key);
    },
    [dataMap]
  );

  const getConnectionState = useCallback(
    (dataType, symbol) => {
      const key = `${dataType}_${symbol}`;
      return connectionStates.get(key) || false;
    },
    [connectionStates]
  );

  const getError = useCallback(
    (dataType, symbol) => {
      const key = `${dataType}_${symbol}`;
      return errors.get(key);
    },
    [errors]
  );

  return {
    getData,
    getConnectionState,
    getError,
    allData: Object.fromEntries(dataMap),
    connectionStates: Object.fromEntries(connectionStates),
    errors: Object.fromEntries(errors),
    isAllConnected: Array.from(connectionStates.values()).every(state => state),
    hasAnyErrors: Array.from(errors.values()).some(error => error !== null)
  };
};

export default useRealTimeData;
