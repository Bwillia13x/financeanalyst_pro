import React, { useState, useEffect } from 'react';

import { mobileNavigationService } from '../../services/mobile/MobileNavigationService';
import { mobilePerformanceService } from '../../services/mobile/MobilePerformanceService';
import { mobileResponsiveService } from '../../services/mobile/MobileResponsiveService';
import { offlineStorageService } from '../../services/mobile/OfflineStorageService';
import { pushNotificationService } from '../../services/mobile/PushNotificationService';
import { pwaService } from '../../services/mobile/PWAService';
import { touchInteractionService } from '../../services/mobile/TouchInteractionService';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const MobileDashboard = () => {
  const [mobileData, setMobileData] = useState({});
  const [pwaData, setPwaData] = useState({});
  const [touchData, setTouchData] = useState({});
  const [navigationData, setNavigationData] = useState({});
  const [notificationData, setNotificationData] = useState({});
  const [storageData, setStorageData] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize all mobile services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setIsLoading(true);

      // Initialize all services
      await Promise.all([
        mobileResponsiveService.initialize?.(),
        pwaService.initialize?.(),
        touchInteractionService.initialize?.(),
        mobileNavigationService.initialize?.(),
        pushNotificationService.initialize?.(),
        offlineStorageService.initialize?.(),
        mobilePerformanceService.initialize?.()
      ]);

      // Load initial data
      await loadAllData();

      // Setup event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize mobile services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [
        mobileStatus,
        pwaStatus,
        touchState,
        navState,
        notificationStatus,
        storageStats,
        performanceStatus
      ] = await Promise.all([
        mobileResponsiveService.getDeviceInfo?.(),
        pwaService.getPWAStatus?.(),
        touchInteractionService.getTouchState?.(),
        mobileNavigationService.getNavigationState?.(),
        pushNotificationService.getStatus?.(),
        offlineStorageService.getStorageStats?.(),
        mobilePerformanceService.getPerformanceStatus?.()
      ]);

      setMobileData(mobileStatus || {});
      setPwaData(pwaStatus || {});
      setTouchData(touchState || {});
      setNavigationData(navState || {});
      setNotificationData(notificationStatus || {});
      setStorageData(storageStats || {});
      setPerformanceData(performanceStatus || {});
    } catch (error) {
      console.error('Failed to load mobile data:', error);
    }
  };

  const setupEventListeners = () => {
    // Listen for mobile responsive events
    mobileResponsiveService.on?.('orientationChange', data => {
      setMobileData(prev => ({ ...prev, orientation: data.to }));
    });

    mobileResponsiveService.on?.('breakpointChange', data => {
      setMobileData(prev => ({ ...prev, breakpoint: data.to }));
    });

    // Listen for PWA events
    pwaService.on?.('notificationSent', () => loadAllData());
    pwaService.on?.('appInstalled', () => loadAllData());

    // Listen for performance events
    mobilePerformanceService.on?.('performanceMetrics', metrics => {
      setPerformanceData(prev => ({ ...prev, currentMetrics: metrics }));
    });
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const getStatusColor = status => {
    switch (status) {
      case 'supported':
      case 'granted':
      case 'initialized':
        return 'text-green-600';
      case 'denied':
      case 'failed':
        return 'text-red-600';
      case 'default':
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatBytes = bytes => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = value => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4" />
          <p className="text-foreground-secondary">Initializing mobile services...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📱' },
    { id: 'responsive', name: 'Responsive', icon: '📐' },
    { id: 'pwa', name: 'PWA', icon: '⚡' },
    { id: 'touch', name: 'Touch', icon: '👆' },
    { id: 'navigation', name: 'Navigation', icon: '🧭' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'storage', name: 'Storage', icon: '💾' },
    { id: 'performance', name: 'Performance', icon: '⚡' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mobile Dashboard</h2>
          <p className="text-foreground-secondary mt-1">
            Comprehensive mobile optimization and PWA management
          </p>
        </div>

        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-foreground-secondary hover:text-foreground'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Device Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Type</span>
                    <span className="text-sm font-medium capitalize">
                      {mobileData?.device?.category || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Orientation</span>
                    <span className="text-sm font-medium capitalize">
                      {mobileData?.orientation?.type || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Touch</span>
                    <span
                      className={`text-sm font-medium ${
                        mobileData?.device?.touchSupport ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mobileData?.device?.touchSupport ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PWA Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PWA Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Installed</span>
                    <span
                      className={`text-sm font-medium ${
                        pwaData?.isInstalled ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {pwaData?.isInstalled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Online</span>
                    <span
                      className={`text-sm font-medium ${
                        pwaData?.isOnline ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {pwaData?.isOnline ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Service Worker</span>
                    <span
                      className={`text-sm font-medium ${
                        pwaData?.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {pwaData?.serviceWorkerRegistered ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Memory Used</span>
                    <span className="text-sm font-medium">
                      {performanceData?.currentMetrics?.memory?.usedMB || 0}MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Frame Rate</span>
                    <span className="text-sm font-medium">
                      {performanceData?.currentMetrics?.frameRate || 0} FPS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Network</span>
                    <span className="text-sm font-medium capitalize">
                      {performanceData?.currentMetrics?.network || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Used</span>
                    <span className="text-sm font-medium">
                      {formatBytes(storageData?.quota?.used || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Available</span>
                    <span className="text-sm font-medium">
                      {formatBytes(storageData?.quota?.available || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Utilization</span>
                    <span className="text-sm font-medium">
                      {formatPercentage(storageData?.quota?.percentage / 100 || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'responsive' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Device Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Type</span>
                        <span className="font-medium capitalize">
                          {mobileData?.device?.category || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">User Agent</span>
                        <span className="font-medium text-xs">
                          {mobileData?.device?.userAgent?.substring(0, 30)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Screen Size</span>
                        <span className="font-medium">
                          {mobileData?.device?.screenWidth}x{mobileData?.device?.screenHeight}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Pixel Ratio</span>
                        <span className="font-medium">{mobileData?.device?.pixelRatio}x</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3">Capabilities</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Touch Support</span>
                        <span
                          className={`font-medium ${
                            mobileData?.device?.touchSupport ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {mobileData?.device?.touchSupport ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Retina Display</span>
                        <span
                          className={`font-medium ${
                            mobileData?.device?.isRetina ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          {mobileData?.device?.isRetina ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Orientation</span>
                        <span className="font-medium capitalize">
                          {mobileData?.orientation?.type || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Breakpoint</span>
                        <span className="font-medium capitalize">
                          {mobileData?.breakpoint || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pwa' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>PWA Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Supported</span>
                      <span
                        className={`font-medium ${
                          pwaData?.isSupported ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pwaData?.isSupported ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Installed</span>
                      <span
                        className={`font-medium ${
                          pwaData?.isInstalled ? 'text-green-600' : 'text-yellow-600'
                        }`}
                      >
                        {pwaData?.isInstalled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Online</span>
                      <span
                        className={`font-medium ${
                          pwaData?.isOnline ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pwaData?.isOnline ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Service Worker</span>
                      <span
                        className={`font-medium ${
                          pwaData?.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pwaData?.serviceWorkerRegistered ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PWA Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => pwaService.showInstallPrompt?.()}
                    disabled={!pwaService.installPrompt}
                    className="w-full"
                  >
                    Install App
                  </Button>
                  <Button
                    onClick={() => pwaService.updatePWA?.()}
                    variant="outline"
                    className="w-full"
                  >
                    Update App
                  </Button>
                  <Button
                    onClick={() => pwaService.exportSecurityData?.()}
                    variant="outline"
                    className="w-full"
                  >
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'touch' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Touch Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Active Touches</h4>
                    <div className="space-y-2">
                      {touchData?.activeTouches?.map((touch, index) => (
                        <div key={touch.id} className="p-2 bg-background-secondary rounded">
                          <div className="text-sm">
                            Touch {index + 1}: ({touch.currentX}, {touch.currentY})
                          </div>
                        </div>
                      )) || <div className="text-foreground-secondary">No active touches</div>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3">Gesture State</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Active</span>
                        <span
                          className={`font-medium ${
                            touchData?.gestureState?.isActive ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          {touchData?.gestureState?.isActive ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Type</span>
                        <span className="font-medium">
                          {touchData?.gestureState?.type || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Velocity</span>
                        <span className="font-medium">
                          {touchData?.gestureState?.velocity?.x?.toFixed(2) || 0},{' '}
                          {touchData?.gestureState?.velocity?.y?.toFixed(2) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Navigation State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Current State</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Current Route</span>
                        <span className="font-medium">{navigationData?.currentRoute || '/'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">History Length</span>
                        <span className="font-medium">
                          {navigationData?.navigationHistory?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Device Type</span>
                        <span className="font-medium capitalize">
                          {navigationData?.deviceInfo?.isMobile
                            ? 'Mobile'
                            : navigationData?.deviceInfo?.isTablet
                              ? 'Tablet'
                              : 'Desktop'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3">Navigation Actions</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={() => mobileNavigationService?.goBack()}
                        disabled={!(navigationData?.navigationHistory?.length > 0)}
                        className="w-full"
                      >
                        Go Back
                      </Button>
                      <Button
                        onClick={() => mobileNavigationService?.navigateTo('/dashboard')}
                        variant="outline"
                        className="w-full"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Permission</span>
                      <span
                        className={`font-medium ${getStatusColor(notificationData?.permission)}`}
                      >
                        {notificationData?.permission || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Subscribed</span>
                      <span
                        className={`font-medium ${
                          notificationData?.subscribed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {notificationData?.subscribed ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Scheduled</span>
                      <span className="font-medium">{notificationData?.scheduledCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => pushNotificationService?.requestPermission()}
                    disabled={notificationData?.permission === 'granted'}
                    className="w-full"
                  >
                    Request Permission
                  </Button>
                  <Button
                    onClick={() => pushNotificationService?.subscribe()}
                    disabled={!notificationData?.permission === 'granted'}
                    variant="outline"
                    className="w-full"
                  >
                    Subscribe
                  </Button>
                  <Button
                    onClick={() => {
                      pushNotificationService?.sendNotification({
                        title: 'Test Notification',
                        body: 'This is a test push notification from FinanceAnalyst Pro'
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send Test Notification
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Storage Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Used</span>
                        <span className="font-medium">
                          {formatBytes(storageData?.quota?.used || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Available</span>
                        <span className="font-medium">
                          {formatBytes(storageData?.quota?.available || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Utilization</span>
                        <span className="font-medium">
                          {formatPercentage(storageData?.quota?.percentage / 100 || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3">Data Stores</h4>
                    <div className="space-y-2">
                      {Object.entries(storageData?.data || {}).map(([store, count]) => (
                        <div key={store} className="flex justify-between">
                          <span className="text-foreground-secondary capitalize">
                            {store.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-medium">{count || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Current Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Memory Used</span>
                        <span className="font-medium">
                          {performanceData?.currentMetrics?.memory?.usedMB || 0}MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Frame Rate</span>
                        <span className="font-medium">
                          {performanceData?.currentMetrics?.frameRate || 0} FPS
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Network Type</span>
                        <span className="font-medium capitalize">
                          {performanceData?.currentMetrics?.network || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">DOM Nodes</span>
                        <span className="font-medium">
                          {performanceData?.currentMetrics?.domNodes || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-3">Device Capabilities</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Low End Device</span>
                        <span
                          className={`font-medium ${
                            performanceData?.deviceCapabilities?.isLowEnd
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}
                        >
                          {performanceData?.deviceCapabilities?.isLowEnd ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">WebGL Support</span>
                        <span
                          className={`font-medium ${
                            performanceData?.deviceCapabilities?.hasWebGL
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData?.deviceCapabilities?.hasWebGL ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">CPU Cores</span>
                        <span className="font-medium">
                          {performanceData?.deviceCapabilities?.cores || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Memory</span>
                        <span className="font-medium">
                          {performanceData?.deviceCapabilities?.memory?.totalMB || 0}MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {performanceData?.recommendations && performanceData.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-foreground mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {performanceData.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded ${
                            rec.severity === 'critical'
                              ? 'bg-red-50 text-red-800'
                              : rec.severity === 'warning'
                                ? 'bg-yellow-50 text-yellow-800'
                                : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          <div className="font-medium">{rec.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
