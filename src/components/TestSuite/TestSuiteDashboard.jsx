import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Download,
  Activity,
  Shield,
  Zap,
  Settings,
  Info
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import testingService from '../../services/testingService';
import Button from '../ui/Button';

const TestSuiteDashboard = ({ isVisible, onClose }) => {
  const [testSuites, setTestSuites] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(new Set());
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isVisible) {
      loadTestData();
    }
  }, [isVisible]);

  const loadTestData = async () => {
    try {
      const suites = testingService.getTestSuites();
      const results = testingService.getTestResults();
      const performance = testingService.getPerformanceMetrics();

      setTestSuites(suites);
      setTestResults(results);
      setPerformanceMetrics(performance);
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  };

  const runTestSuite = async suiteId => {
    setRunningTests(prev => new Set([...prev, suiteId]));

    try {
      const result = await testingService.runTestSuite(suiteId);
      setTestResults(prev => [result, ...prev]);

      // Refresh test data
      await loadTestData();
    } catch (error) {
      console.error('Error running test suite:', error);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    const allSuiteIds = testSuites.map(suite => suite.id);
    setRunningTests(new Set(allSuiteIds));

    try {
      await testingService.runAllTests();
      await loadTestData();
    } catch (error) {
      console.error('Error running all tests:', error);
    } finally {
      setRunningTests(new Set());
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = category => {
    switch (category) {
      case 'unit':
        return <Settings className="w-5 h-5" />;
      case 'integration':
        return <Activity className="w-5 h-5" />;
      case 'performance':
        return <Zap className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getLatestResult = suiteId => {
    return testResults.find(result => result.suiteId === suiteId);
  };

  const generateReport = () => {
    const report = testingService.generateTestReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `test-report-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Test Suite Dashboard</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={generateReport}
                className="text-slate-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadTestData}
                className="text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {['overview', 'results', 'performance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={runAllTests}
                  disabled={runningTests.size > 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </Button>
                <Button
                  variant="outline"
                  onClick={loadTestData}
                  className="border-slate-600 text-slate-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Test Suites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testSuites.map(suite => {
                  const latestResult = getLatestResult(suite.id);
                  const isRunning = runningTests.has(suite.id);

                  return (
                    <motion.div
                      key={suite.id}
                      layout
                      className="bg-slate-700 rounded-lg p-4 hover:bg-slate-650 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(suite.category)}
                          <div>
                            <h3 className="text-lg font-semibold text-white">{suite.name}</h3>
                            <p className="text-sm text-slate-300">{suite.description}</p>
                          </div>
                        </div>
                        {latestResult && getStatusIcon(latestResult.status)}
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                        <span>{suite.tests.length} tests</span>
                        {latestResult && (
                          <span>
                            Last run: {new Date(latestResult.startTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {latestResult && (
                        <div className="flex space-x-4 text-xs mb-4">
                          <span className="text-green-400">✓ {latestResult.summary.passed}</span>
                          <span className="text-red-400">✗ {latestResult.summary.failed}</span>
                          <span className="text-yellow-400">⊖ {latestResult.summary.skipped}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          onClick={() => runTestSuite(suite.id)}
                          disabled={isRunning}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isRunning ? (
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {isRunning ? 'Running...' : 'Run Tests'}
                        </Button>
                        {latestResult && (
                          <button
                            onClick={() => setSelectedSuite(suite)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Test Results</h3>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No test results available yet.</p>
                  <p className="text-sm mt-1">Run some tests to see results here.</p>
                </div>
              ) : (
                testResults.slice(0, 10).map(result => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <h4 className="font-medium text-white">{result.suiteName}</h4>
                      </div>
                      <span className="text-sm text-slate-400">
                        {new Date(result.startTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex space-x-6 text-sm">
                      <span className="text-green-400">✓ {result.summary.passed}</span>
                      <span className="text-red-400">✗ {result.summary.failed}</span>
                      <span className="text-yellow-400">⊖ {result.summary.skipped}</span>
                      {result.duration && (
                        <span className="text-slate-400">{result.duration}ms</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              {performanceMetrics.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No performance metrics available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceMetrics.slice(-6).map((metric, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-slate-400">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {metric.memory && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-300">Memory Used:</span>
                            <span className="text-white">
                              {(metric.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Memory Total:</span>
                            <span className="text-white">
                              {(metric.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Suite Modal */}
        <AnimatePresence>
          {selectedSuite && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
              onClick={() => setSelectedSuite(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{selectedSuite.name}</h3>
                  <button
                    onClick={() => setSelectedSuite(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <p className="text-slate-300 mb-4">{selectedSuite.description}</p>

                <div className="space-y-3">
                  <h4 className="font-medium text-white">Test Cases:</h4>
                  {selectedSuite.tests.map(test => (
                    <div key={test.id} className="bg-slate-700 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white">{test.name}</span>
                        {test.critical && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Timeout: {test.timeout}ms</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TestSuiteDashboard;
