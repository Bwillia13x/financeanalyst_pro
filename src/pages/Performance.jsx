import React, { useState, useEffect } from 'react';

import PerformanceDashboard from '../components/Performance/PerformanceDashboard';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { bundleOptimizerService } from '../services/performance/BundleOptimizerService';
import { cachingService } from '../services/performance/CachingService';
import { memoryManagerService } from '../services/performance/MemoryManagerService';
import { performanceMonitorService } from '../services/performance/PerformanceMonitorService';
import { performanceTestingService } from '../services/performance/PerformanceTestingService';

const Performance = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState({});
  const [customMetric, setCustomMetric] = useState('');
  const [customMetricValue, setCustomMetricValue] = useState('');
  const [customMetricCategory, setCustomMetricCategory] = useState('custom');

  // Initialize all performance services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    const status = {};

    try {
      await performanceMonitorService.initialize();
      status.monitor = 'initialized';
    } catch (error) {
      status.monitor = 'failed';
      console.error('Failed to initialize Performance Monitor:', error);
    }

    try {
      await bundleOptimizerService.initialize();
      status.bundle = 'initialized';
    } catch (error) {
      status.bundle = 'failed';
      console.error('Failed to initialize Bundle Optimizer:', error);
    }

    try {
      await cachingService.initialize();
      status.cache = 'initialized';
    } catch (error) {
      status.cache = 'failed';
      console.error('Failed to initialize Caching Service:', error);
    }

    try {
      await memoryManagerService.initialize();
      status.memory = 'initialized';
    } catch (error) {
      status.memory = 'failed';
      console.error('Failed to initialize Memory Manager:', error);
    }

    try {
      await performanceTestingService.initialize();
      status.testing = 'initialized';
    } catch (error) {
      status.testing = 'failed';
      console.error('Failed to initialize Performance Testing:', error);
    }

    setInitializationStatus(status);
    setIsInitialized(Object.values(status).every(s => s === 'initialized'));
  };

  const recordCustomMetric = () => {
    if (customMetric && customMetricValue) {
      const value = parseFloat(customMetricValue);
      if (!isNaN(value)) {
        performanceMonitorService.trackCustomMetric(customMetric, value, customMetricCategory);
        setCustomMetric('');
        setCustomMetricValue('');
        alert('Custom metric recorded successfully!');
      }
    }
  };

  const exportPerformanceData = () => {
    const data = {
      monitor: performanceMonitorService.exportData(),
      bundle: bundleOptimizerService.exportOptimizationData(),
      cache: cachingService.exportCacheData(),
      memory: memoryManagerService.exportMemoryData(),
      testing: performanceTestingService.exportTestData(),
      exportTimestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'monitoring', name: 'Monitoring', icon: '📈' },
    { id: 'optimization', name: 'Optimization', icon: '⚡' },
    { id: 'testing', name: 'Testing', icon: '🧪' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Performance System</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4" />
            <p className="text-foreground-secondary mb-6">Initializing performance services...</p>

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
      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-accent text-white'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>

            <Button onClick={exportPerformanceData} variant="outline">
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <PerformanceDashboard />}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Performance Monitoring</h2>
                <p className="text-foreground-secondary mt-1">
                  Real-time performance metrics and monitoring
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(
                      performanceMonitorService.getPerformanceSummary().coreWebVitals,
                      null,
                      2
                    )}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(memoryManagerService.getMemoryStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bundle Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(bundleOptimizerService.getBundleStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(cachingService.getStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Performance Optimization</h2>
                <p className="text-foreground-secondary mt-1">
                  Bundle optimization, caching, and memory management
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    Optimize code splitting and lazy loading
                  </div>
                  <Button
                    onClick={() => bundleOptimizerService.preloadCriticalResources()}
                    className="w-full"
                  >
                    Preload Critical Resources
                  </Button>
                  <Button
                    onClick={() => bundleOptimizerService.detectAndOptimizeConnection()}
                    variant="outline"
                    className="w-full"
                  >
                    Optimize for Connection
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    Manage application caching strategies
                  </div>
                  <Button
                    onClick={() => cachingService.clear()}
                    variant="outline"
                    className="w-full"
                  >
                    Clear All Cache
                  </Button>
                  <Button
                    onClick={() => cachingService.invalidateByTags(['api'])}
                    variant="outline"
                    className="w-full"
                  >
                    Invalidate API Cache
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    Memory leak prevention and optimization
                  </div>
                  <Button
                    onClick={() => memoryManagerService.aggressiveCleanup()}
                    variant="outline"
                    className="w-full"
                  >
                    Aggressive Cleanup
                  </Button>
                  <Button
                    onClick={() => memoryManagerService.forceCleanup()}
                    variant="outline"
                    className="w-full"
                  >
                    Force Cleanup
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Hints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-foreground-secondary">
                    Resource hints and optimization suggestions
                  </div>
                  <div className="space-y-2">
                    {memoryManagerService.getMemoryRecommendations().map((rec, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded text-sm ${
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Performance Testing</h2>
                <p className="text-foreground-secondary mt-1">
                  Automated performance testing and benchmarking
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Suite Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background-secondary p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(performanceTestingService.getStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Benchmarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      'core-web-vitals',
                      'memory-usage',
                      'api-performance',
                      'bundle-loading',
                      'component-rendering',
                      'database-performance'
                    ].map(benchmark => (
                      <div
                        key={benchmark}
                        className="flex items-center justify-between p-2 border border-border rounded"
                      >
                        <span className="text-sm capitalize">{benchmark.replace('-', ' ')}</span>
                        <Button
                          onClick={() => performanceTestingService.runBenchmark(benchmark)}
                          size="sm"
                          variant="outline"
                        >
                          Run
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Test History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {performanceTestingService.getTestHistory(5).map((testSuite, index) => (
                      <div key={index} className="p-3 border border-border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Suite #{testSuite.id}</span>
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              testSuite.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : testSuite.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {testSuite.status}
                          </span>
                        </div>
                        <div className="text-sm text-foreground-secondary">
                          Duration: {(testSuite.duration / 1000).toFixed(2)}s | Score:{' '}
                          {testSuite.analysis?.score || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Performance Settings</h2>
                <p className="text-foreground-secondary mt-1">
                  Configure performance monitoring and optimization settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      Metric Name
                    </label>
                    <Input
                      value={customMetric}
                      onChange={e => setCustomMetric(e.target.value)}
                      placeholder="e.g., user_interaction_time"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      Value
                    </label>
                    <Input
                      type="number"
                      value={customMetricValue}
                      onChange={e => setCustomMetricValue(e.target.value)}
                      placeholder="e.g., 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      Category
                    </label>
                    <select
                      value={customMetricCategory}
                      onChange={e => setCustomMetricCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                    >
                      <option value="custom">Custom</option>
                      <option value="user-interaction">User Interaction</option>
                      <option value="api">API</option>
                      <option value="rendering">Rendering</option>
                    </select>
                  </div>

                  <Button onClick={recordCustomMetric} className="w-full">
                    Record Metric
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">User Agent:</span>
                      <span className="font-medium">{navigator.userAgent.substring(0, 50)}...</span>
                    </div>

                    <div className="flex justify-between mt-2">
                      <span className="text-foreground-secondary">Connection:</span>
                      <span className="font-medium">
                        {navigator.connection?.effectiveType || 'unknown'}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2">
                      <span className="text-foreground-secondary">Memory:</span>
                      <span className="font-medium">
                        {performance.memory
                          ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB used`
                          : 'Not available'}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2">
                      <span className="text-foreground-secondary">Service Worker:</span>
                      <span className="font-medium">
                        {'serviceWorker' in navigator ? 'Supported' : 'Not supported'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
