import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowIndicator(true);
      // Hide after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
    };

    // Listen for custom network status events from PWA service
    const handleNetworkStatusChange = event => {
      const { online } = event.detail;
      setIsOffline(!online);
      setShowIndicator(true);

      if (online) {
        // Hide after 3 seconds when coming back online
        setTimeout(() => setShowIndicator(false), 3000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('network-status-change', handleNetworkStatusChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('network-status-change', handleNetworkStatusChange);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm transition-all duration-300 ${
        isOffline ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className={`rounded-lg shadow-lg p-3 border ${
          isOffline
            ? 'bg-red-900/95 border-red-700/50 text-red-100'
            : 'bg-green-900/95 border-green-700/50 text-green-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : (
              <Wifi className="w-4 h-4 text-green-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{isOffline ? "You're offline" : 'Back online'}</p>
            <p className="text-xs opacity-90">
              {isOffline
                ? 'Some features may be limited. Data will sync when connection returns.'
                : 'All features are now available.'}
            </p>
          </div>

          {isOffline && (
            <div className="flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
