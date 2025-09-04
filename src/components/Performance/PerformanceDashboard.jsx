import React, { useState, useEffect } from 'react';

import { bundleOptimizerService } from '../../services/performance/BundleOptimizerService';
import { cachingService } from '../../services/performance/CachingService';
import { memoryManagerService } from '../../services/performance/MemoryManagerService';
import { performanceMonitorService } from '../../services/performance/PerformanceMonitorService';
import { performanceTestingService } from '../../services/performance/PerformanceTestingService';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const PerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [bundleData, setBundleData] = useState(null);
  const [cacheData, setCacheData] = useState(null);
  const [memoryData, setMemoryData] = useState(null);
  const [testData, setTestData] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadPerformanceData();

    // Set up periodic updates
    const interval = setInterval(() => {
      loadPerformanceData();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = () => {
    try {
      const performance = performanceMonitorService.getPerformanceSummary();
      const bundle = bundleOptimizerService.getBundleStats();
      const cache = cachingService.getStats();
      const memory = memoryManagerService.getMemoryStats();
      const tests = performanceTestingService.getStats();

      setPerformanceData(performance);
      setBundleData(bundle);
      setCacheData(cache);
      setMemoryData(memory);
      setTestData(tests);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const runPerformanceTests = async () => {
    setIsRunningTests(true);
    try {
      await performanceTestingService.runAutomatedTestSuite();
      loadPerformanceData(); // Refresh data after tests
    } catch (error) {
      console.error('Performance tests failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearCache = async () => {
    try {
      await cachingService.clear();
      loadPerformanceData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const forceGarbageCollection = () => {
    if (window.gc) {
      window.gc();
      loadPerformanceData();
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

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = trend => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'degrading':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Dashboard</h2>
          <p className="text-foreground-secondary mt-1">
            Monitor and optimize application performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-foreground-secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <Button onClick={runPerformanceTests} disabled={isRunningTests} variant="outline">
            {isRunningTests ? 'Running Tests...' : 'Run Tests'}
          </Button>

          <Button onClick={clearCache} variant="outline">
            Clear Cache
          </Button>

          <Button onClick={forceGarbageCollection} variant="outline">
            Force GC
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      {performanceData?.coreWebVitals && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {performanceData.coreWebVitals.lcp?.current?.toFixed(0) || 'N/A'}ms
                </div>
                <div className="text-sm text-foreground-secondary">Largest Contentful Paint</div>
                <div
                  className={`text-xs mt-1 ${getStatusColor(
                    performanceData.coreWebVitals.lcp?.current || 0,
                    { good: 2500, warning: 4000 }
                  )}`}
                >
                  {performanceData.coreWebVitals.lcp?.trend &&
                    getTrendIcon(performanceData.coreWebVitals.lcp.trend)}
                  {performanceData.coreWebVitals.lcp?.trend || 'stable'}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {performanceData.coreWebVitals.fid?.current?.toFixed(0) || 'N/A'}ms
                </div>
                <div className="text-sm text-foreground-secondary">First Input Delay</div>
                <div
                  className={`text-xs mt-1 ${getStatusColor(
                    performanceData.coreWebVitals.fid?.current || 0,
                    { good: 100, warning: 300 }
                  )}`}
                >
                  {performanceData.coreWebVitals.fid?.trend &&
                    getTrendIcon(performanceData.coreWebVitals.fid.trend)}
                  {performanceData.coreWebVitals.fid?.trend || 'stable'}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {performanceData.coreWebVitals.cls?.current?.toFixed(3) || 'N/A'}
                </div>
                <div className="text-sm text-foreground-secondary">Cumulative Layout Shift</div>
                <div
                  className={`text-xs mt-1 ${getStatusColor(
                    performanceData.coreWebVitals.cls?.current || 0,
                    { good: 0.1, warning: 0.25 }
                  )}`}
                >
                  {performanceData.coreWebVitals.cls?.trend &&
                    getTrendIcon(performanceData.coreWebVitals.cls.trend)}
                  {performanceData.coreWebVitals.cls?.trend || 'stable'}
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {performanceData.coreWebVitals.fcp?.current?.toFixed(0) || 'N/A'}ms
                </div>
                <div className="text-sm text-foreground-secondary">First Contentful Paint</div>
                <div
                  className={`text-xs mt-1 ${getStatusColor(
                    performanceData.coreWebVitals.fcp?.current || 0,
                    { good: 1800, warning: 3000 }
                  )}`}
                >
                  {performanceData.coreWebVitals.fcp?.trend &&
                    getTrendIcon(performanceData.coreWebVitals.fcp.trend)}
                  {performanceData.coreWebVitals.fcp?.trend || 'stable'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        {memoryData && (
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Heap Used</span>
                  <span className="font-medium">{formatBytes(memoryData.heapUsed)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Heap Total</span>
                  <span className="font-medium">{formatBytes(memoryData.heapTotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Heap Limit</span>
                  <span className="font-medium">{formatBytes(memoryData.heapLimit)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Usage Ratio</span>
                  <span
                    className={`font-medium ${
                      memoryData.heapUsagePercent > 80
                        ? 'text-red-600'
                        : memoryData.heapUsagePercent > 60
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {memoryData.heapUsagePercent}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Tracked Objects</span>
                  <span className="font-medium">{memoryData.registrySize}</span>
                </div>

                {memoryData.memoryPressure && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                    ⚠️ Memory pressure detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cache Performance */}
        {cacheData && (
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Entries</span>
                  <span className="font-medium">{cacheData.totalEntries}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Cache Size</span>
                  <span className="font-medium">{cacheData.cacheSizeMB} MB</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Hit Rate</span>
                  <span
                    className={`font-medium ${
                      parseFloat(cacheData.hitRate) > 70
                        ? 'text-green-600'
                        : parseFloat(cacheData.hitRate) > 40
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {cacheData.hitRate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Cache Utilization</span>
                  <span className="font-medium">{cacheData.utilizationPercent}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Evictions</span>
                  <span className="font-medium">{cacheData.evictions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bundle Optimization */}
        {bundleData && (
          <Card>
            <CardHeader>
              <CardTitle>Bundle Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Chunks</span>
                  <span className="font-medium">{bundleData.totalChunks}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Loaded Chunks</span>
                  <span className="font-medium text-green-600">{bundleData.loadedChunks}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Prefetched Chunks</span>
                  <span className="font-medium text-blue-600">{bundleData.prefetchedChunks}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Loaded Resources</span>
                  <span className="font-medium text-green-600">{bundleData.loadedResources}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Prefetch Queue</span>
                  <span className="font-medium">{bundleData.prefetchQueue}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Testing */}
        {testData && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Test Suites</span>
                  <span className="font-medium">{testData.totalTestSuites}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Benchmarks Available</span>
                  <span className="font-medium">{testData.totalBenchmarks}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Running Tests</span>
                  <span className="font-medium">{testData.runningTests}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Average Score</span>
                  <span
                    className={`font-medium ${
                      testData.averageScore > 80
                        ? 'text-green-600'
                        : testData.averageScore > 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {testData.averageScore?.toFixed(1) || 'N/A'}
                  </span>
                </div>

                {testData.lastTestSuite && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-sm text-foreground-secondary mb-1">Last Test Suite</div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span
                        className={`font-medium ${
                          testData.lastTestSuite.status === 'completed'
                            ? 'text-green-600'
                            : testData.lastTestSuite.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {testData.lastTestSuite.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {memoryData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {memoryData.heapUsagePercent > 80 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                  <div className="font-medium">🚨 Critical: High Memory Usage</div>
                  <div className="text-sm mt-1">
                    Memory usage is {memoryData.heapUsagePercent}%. Consider reducing cached data or
                    implementing pagination.
                  </div>
                </div>
              )}

              {cacheData && parseFloat(cacheData.hitRate) < 50 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <div className="font-medium">⚠️ Warning: Low Cache Hit Rate</div>
                  <div className="text-sm mt-1">
                    Cache hit rate is {cacheData.hitRate}. Consider optimizing cache keys or
                    increasing cache size.
                  </div>
                </div>
              )}

              {performanceData?.coreWebVitals?.lcp?.current > 4000 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <div className="font-medium">⚠️ Warning: Slow LCP</div>
                  <div className="text-sm mt-1">
                    Largest Contentful Paint is {performanceData.coreWebVitals.lcp.current}ms.
                    Consider optimizing images and critical resources.
                  </div>
                </div>
              )}

              {memoryData.leakCandidates > 5 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-orange-800">
                  <div className="font-medium">🔍 Info: Potential Memory Leaks</div>
                  <div className="text-sm mt-1">
                    {memoryData.leakCandidates} potential memory leaks detected. Review object
                    lifecycle management.
                  </div>
                </div>
              )}

              {!memoryData.heapUsagePercent > 80 &&
                !cacheData?.hitRate < 50 &&
                !performanceData?.coreWebVitals?.lcp?.current > 4000 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
                    <div className="font-medium">✅ Performance is Good</div>
                    <div className="text-sm mt-1">
                      All performance metrics are within acceptable ranges. Keep monitoring for
                      optimal user experience.
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Violations */}
      {performanceData?.budgets?.exceeded?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Performance Budget Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceData.budgets.exceeded.map((violation, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 border border-red-200 rounded text-red-800"
                >
                  <div className="font-medium">🚨 {violation} Budget Exceeded</div>
                  <div className="text-sm mt-1">
                    Performance budget for {violation} has been exceeded. This may impact user
                    experience.
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;
