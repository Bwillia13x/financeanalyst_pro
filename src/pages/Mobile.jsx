import React, { useState, useEffect } from 'react';

import MobileDashboard from '../components/Mobile/MobileDashboard';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { mobileNavigationService } from '../services/mobile/MobileNavigationService';
import { mobilePerformanceService } from '../services/mobile/MobilePerformanceService';
import { mobileResponsiveService } from '../services/mobile/MobileResponsiveService';
import { offlineStorageService } from '../services/mobile/OfflineStorageService';
import { pushNotificationService } from '../services/mobile/PushNotificationService';
import { pwaService } from '../services/mobile/PWAService';
import { touchInteractionService } from '../services/mobile/TouchInteractionService';

const Mobile = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState({});
  const [deviceInfo, setDeviceInfo] = useState({});
  const [serviceStatuses, setServiceStatuses] = useState({});

  // Initialize all mobile services
  useEffect(() => {
    initializeServices();
    detectDevice();
  }, []);

  const initializeServices = async () => {
    const status = {};

    try {
      await mobileResponsiveService.initialize();
      status.responsive = 'initialized';
    } catch (error) {
      status.responsive = 'failed';
      console.error('Failed to initialize Mobile Responsive Service:', error);
    }

    try {
      await pwaService.initialize();
      status.pwa = 'initialized';
    } catch (error) {
      status.pwa = 'failed';
      console.error('Failed to initialize PWA Service:', error);
    }

    try {
      await touchInteractionService.initialize();
      status.touch = 'initialized';
    } catch (error) {
      status.touch = 'failed';
      console.error('Failed to initialize Touch Interaction Service:', error);
    }

    try {
      await mobileNavigationService.initialize();
      status.navigation = 'initialized';
    } catch (error) {
      status.navigation = 'failed';
      console.error('Failed to initialize Mobile Navigation Service:', error);
    }

    try {
      await pushNotificationService.initialize();
      status.notifications = 'initialized';
    } catch (error) {
      status.notifications = 'failed';
      console.error('Failed to initialize Push Notification Service:', error);
    }

    try {
      await offlineStorageService.initialize();
      status.storage = 'initialized';
    } catch (error) {
      status.storage = 'failed';
      console.error('Failed to initialize Offline Storage Service:', error);
    }

    try {
      await mobilePerformanceService.initialize();
      status.performance = 'initialized';
    } catch (error) {
      status.performance = 'failed';
      console.error('Failed to initialize Mobile Performance Service:', error);
    }

    setInitializationStatus(status);
    setIsInitialized(Object.values(status).every(s => s === 'initialized'));

    // Get initial service statuses
    updateServiceStatuses();
  };

  const detectDevice = () => {
    const info = mobileResponsiveService.getDeviceInfo?.() || {};
    setDeviceInfo(info);
  };

  const updateServiceStatuses = async () => {
    const statuses = {};

    try {
      statuses.pwa = pwaService.getPWAStatus?.() || {};
      statuses.notifications = pushNotificationService.getStatus?.() || {};
      statuses.storage = (await offlineStorageService.getStorageStats?.()) || {};
      statuses.performance = mobilePerformanceService.getPerformanceStatus?.() || {};
    } catch (error) {
      console.error('Failed to get service statuses:', error);
    }

    setServiceStatuses(statuses);
  };

  const handleServiceAction = async (service, action) => {
    try {
      switch (service) {
        case 'pwa':
          if (action === 'install') {
            await pwaService.showInstallPrompt();
          } else if (action === 'update') {
            await pwaService.updatePWA();
          }
          break;
        case 'notifications':
          if (action === 'requestPermission') {
            await pushNotificationService.requestPermission();
          } else if (action === 'subscribe') {
            await pushNotificationService.subscribe();
          } else if (action === 'testNotification') {
            await pushNotificationService.sendNotification({
              title: 'Test Notification',
              body: 'This is a test notification from FinanceAnalyst Pro'
            });
          }
          break;
        case 'storage':
          if (action === 'clearCache') {
            await offlineStorageService.clear('cache');
          } else if (action === 'exportData') {
            const data = await offlineStorageService.exportData();
            downloadData(data, 'mobile-data-export.json');
          }
          break;
        case 'performance':
          if (action === 'forceCheck') {
            await mobilePerformanceService.forcePerformanceCheck();
          }
          break;
      }

      // Update statuses after action
      await updateServiceStatuses();
    } catch (error) {
      console.error(`Failed to execute ${service} action ${action}:`, error);
    }
  };

  const downloadData = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
      description: 'Overview of all mobile services'
    },
    {
      id: 'responsive',
      name: 'Responsive Design',
      icon: '📱',
      description: 'Device detection and responsive behavior'
    },
    {
      id: 'pwa',
      name: 'PWA Features',
      icon: '⚡',
      description: 'Progressive Web App capabilities'
    },
    {
      id: 'touch',
      name: 'Touch Interactions',
      icon: '👆',
      description: 'Touch gestures and interactions'
    },
    {
      id: 'navigation',
      name: 'Navigation',
      icon: '🧭',
      description: 'Mobile navigation and routing'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: '🔔',
      description: 'Push notifications and alerts'
    },
    {
      id: 'storage',
      name: 'Offline Storage',
      icon: '💾',
      description: 'Offline data storage and sync'
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: '🚀',
      description: 'Mobile performance optimization'
    }
  ];

  if (!isInitialized && Object.keys(initializationStatus).length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mobile Services</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4" />
            <p className="text-foreground-secondary mb-6">
              Initializing mobile optimization services...
            </p>

            <div className="max-w-md mx-auto space-y-2">
              {Object.entries(initializationStatus).map(([service, status]) => (
                <div
                  key={service}
                  className="flex items-center justify-between p-2 border border-border rounded"
                >
                  <span className="capitalize">{service} Service</span>
                  <span
                    className={`text-sm ${
                      status === 'initialized'
                        ? 'text-green-600'
                        : status === 'failed'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
                    {status === 'initialized' ? '✅' : status === 'failed' ? '❌' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mobile Optimization</h1>
              <p className="text-foreground-secondary mt-1">
                Comprehensive mobile-first features and PWA capabilities
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-foreground-secondary">
                Device:{' '}
                <span className="font-medium capitalize">
                  {deviceInfo?.device?.category || 'Unknown'}
                </span>
              </div>
              <Button onClick={updateServiceStatuses} variant="outline">
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-4 border border-border rounded-lg text-left transition-all ${
                activeSection === section.id
                  ? 'border-brand-accent bg-brand-accent-light'
                  : 'hover:border-brand-accent hover:bg-background-secondary'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="font-medium text-foreground">{section.name}</h3>
              </div>
              <p className="text-sm text-foreground-secondary">{section.description}</p>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeSection === 'dashboard' && <MobileDashboard />}

          {activeSection === 'responsive' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile Responsive Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Device Detection</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Device Type</span>
                          <span className="font-medium capitalize">
                            {deviceInfo?.device?.category || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Screen Size</span>
                          <span className="font-medium">
                            {deviceInfo?.device?.screenWidth}x{deviceInfo?.device?.screenHeight}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Touch Support</span>
                          <span
                            className={`font-medium ${
                              deviceInfo?.device?.touchSupport ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {deviceInfo?.device?.touchSupport ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Orientation</span>
                          <span className="font-medium capitalize">
                            {deviceInfo?.orientation?.type || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Responsive Features</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Adaptive Images</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Touch Optimization</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Lazy Loading</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Gesture Support</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'pwa' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>PWA Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">PWA Capabilities</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Supported</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.pwa?.isSupported ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {serviceStatuses?.pwa?.isSupported ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Installed</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.pwa?.isInstalled
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {serviceStatuses?.pwa?.isInstalled ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Online</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.pwa?.isOnline ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {serviceStatuses?.pwa?.isOnline ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Service Worker</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.pwa?.serviceWorkerRegistered
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {serviceStatuses?.pwa?.serviceWorkerRegistered ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleServiceAction('pwa', 'install')}
                          disabled={!pwaService.installPrompt}
                          className="w-full"
                        >
                          Install App
                        </Button>
                        <Button
                          onClick={() => handleServiceAction('pwa', 'update')}
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'touch' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Touch Interaction Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Touch Features</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Multi-touch</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Gestures</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Momentum Scrolling</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Haptic Feedback</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Supported Gestures</h4>
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">Single Touch:</div>
                        <div className="text-sm text-foreground-secondary ml-4">
                          Tap, Long Press, Pan, Swipe
                        </div>
                        <div className="font-medium text-foreground">Multi-touch:</div>
                        <div className="text-sm text-foreground-secondary ml-4">
                          Pinch, Rotate, Two-finger Pan
                        </div>
                        <div className="font-medium text-foreground">Advanced:</div>
                        <div className="text-sm text-foreground-secondary ml-4">
                          Double Tap, Momentum, Velocity
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'navigation' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile Navigation Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Navigation Features</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Bottom Navigation</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Swipe Navigation</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Breadcrumb Navigation</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Back Button Handling</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Current State</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Current Route</span>
                          <span className="font-medium">/mobile</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Navigation History</span>
                          <span className="font-medium">0 entries</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Active Section</span>
                          <span className="font-medium capitalize">{activeSection}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Push Notification Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Notification Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Permission</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.notifications?.permission === 'granted'
                                ? 'text-green-600'
                                : serviceStatuses?.notifications?.permission === 'denied'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                            }`}
                          >
                            {serviceStatuses?.notifications?.permission || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Subscribed</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.notifications?.subscribed
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {serviceStatuses?.notifications?.subscribed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Scheduled</span>
                          <span className="font-medium">
                            {serviceStatuses?.notifications?.scheduledCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleServiceAction('notifications', 'requestPermission')}
                          disabled={serviceStatuses?.notifications?.permission === 'granted'}
                          className="w-full"
                        >
                          Request Permission
                        </Button>
                        <Button
                          onClick={() => handleServiceAction('notifications', 'subscribe')}
                          disabled={serviceStatuses?.notifications?.permission !== 'granted'}
                          variant="outline"
                          className="w-full"
                        >
                          Subscribe
                        </Button>
                        <Button
                          onClick={() => handleServiceAction('notifications', 'testNotification')}
                          variant="outline"
                          className="w-full"
                        >
                          Send Test Notification
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'storage' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offline Storage Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Storage Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Used</span>
                          <span className="font-medium">
                            {serviceStatuses?.storage?.quota?.used
                              ? `${(serviceStatuses.storage.quota.used / 1024 / 1024).toFixed(1)}MB`
                              : '0MB'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Available</span>
                          <span className="font-medium">
                            {serviceStatuses?.storage?.quota?.available
                              ? `${(serviceStatuses.storage.quota.available / 1024 / 1024).toFixed(1)}MB`
                              : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Utilization</span>
                          <span className="font-medium">
                            {serviceStatuses?.storage?.quota?.percentage
                              ? `${(serviceStatuses.storage.quota.percentage / 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleServiceAction('storage', 'clearCache')}
                          variant="outline"
                          className="w-full"
                        >
                          Clear Cache
                        </Button>
                        <Button
                          onClick={() => handleServiceAction('storage', 'exportData')}
                          variant="outline"
                          className="w-full"
                        >
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile Performance Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Current Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Memory Used</span>
                          <span className="font-medium">
                            {serviceStatuses?.performance?.currentMetrics?.memory?.usedMB || 0}MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Frame Rate</span>
                          <span className="font-medium">
                            {serviceStatuses?.performance?.currentMetrics?.frameRate || 0} FPS
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Network</span>
                          <span className="font-medium capitalize">
                            {serviceStatuses?.performance?.currentMetrics?.network || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Device Type</span>
                          <span
                            className={`font-medium ${
                              serviceStatuses?.performance?.deviceCapabilities?.isLowEnd
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {serviceStatuses?.performance?.deviceCapabilities?.isLowEnd
                              ? 'Low-End'
                              : 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleServiceAction('performance', 'forceCheck')}
                          className="w-full"
                        >
                          Force Performance Check
                        </Button>
                      </div>

                      {serviceStatuses?.performance?.recommendations && (
                        <div className="mt-4">
                          <h5 className="font-medium text-foreground mb-2">Recommendations</h5>
                          <div className="space-y-2">
                            {serviceStatuses.performance.recommendations.map((rec, index) => (
                              <div
                                key={index}
                                className={`text-sm p-2 rounded ${
                                  rec.severity === 'critical'
                                    ? 'bg-red-50 text-red-800'
                                    : rec.severity === 'warning'
                                      ? 'bg-yellow-50 text-yellow-800'
                                      : 'bg-blue-50 text-blue-800'
                                }`}
                              >
                                {rec.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mobile;
