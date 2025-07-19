import React, { useState, useEffect } from 'react';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';

import ResultsVisualizationPanel from './components/ResultsVisualizationPanel';
import ScenarioConfigPanel from './components/ScenarioConfigPanel';
import SimulationControlBar from './components/SimulationControlBar';
import StatisticalSummaryTable from './components/StatisticalSummaryTable';

const ScenarioAnalysisSensitivityTools = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResults, setSimulationResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [rightPanelView, setRightPanelView] = useState('visualization');
  const [modelSyncStatus, setModelSyncStatus] = useState({
    connected: true,
    lastSync: new Date(Date.now() - 120000), // 2 minutes ago
    baseModel: 'DCF_Analysis_v2.3'
  });

  // Simulate Monte Carlo calculation with Web Workers
  const runSimulation = async params => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResults(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 200);

    // Simulate completion after progress reaches 100%
    setTimeout(() => {
      clearInterval(progressInterval);
      setSimulationProgress(100);

      // Mock results
      const mockResults = {
        summary: {
          mean: 2847.5,
          median: 2823.1,
          stdDev: 456.2,
          min: 1654.3,
          max: 4521.8,
          percentile5: 2156.7,
          percentile95: 3687.4,
          iterations: params.iterations
        },
        completedAt: new Date(),
        parameters: params
      };

      setSimulationResults(mockResults);
      setIsSimulating(false);
    }, 8000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulationProgress(0);
  };

  const handleScenarioUpdate = updatedScenarios => {
    setScenarios(updatedScenarios);
  };

  const rightPanelViews = [
    { id: 'visualization', label: 'Charts', icon: 'BarChart3' },
    { id: 'statistics', label: 'Statistics', icon: 'Calculator' }
  ];

  useEffect(() => {
    // Simulate model sync status updates
    const syncInterval = setInterval(() => {
      setModelSyncStatus(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    }, 60000); // Update every minute

    return () => clearInterval(syncInterval);
  }, []);

  const formatTimeAgo = date => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-[60px] h-screen flex flex-col">
        {/* Simulation Control Bar */}
        <SimulationControlBar
          onRunSimulation={runSimulation}
          isSimulating={isSimulating}
          progress={simulationProgress}
          onStopSimulation={stopSimulation}
        />

        {/* Model Sync Status Bar */}
        <div className="bg-muted/50 border-b border-border px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${modelSyncStatus.connected ? 'bg-success' : 'bg-error'}`}
                />
                <span className="text-sm text-muted-foreground">
                  Base Model: {modelSyncStatus.baseModel}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="RefreshCw" size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last sync: {formatTimeAgo(modelSyncStatus.lastSync)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Users" size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">3 collaborators active</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost" size="sm" iconName="Sync"
                disabled={isSimulating}
              >
                Sync Now
              </Button>
              <Button
                variant="ghost" size="sm" iconName="History"
                disabled={isSimulating}
              >
                Version History
              </Button>
              <Button
                variant="ghost" size="sm" iconName="Share2"
                disabled={isSimulating}
              >
                Share Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Scenario Configuration (40%) */}
          <div className="w-2/5 min-w-[480px]">
            <ScenarioConfigPanel
              onScenarioUpdate={handleScenarioUpdate}
              isSimulating={isSimulating}
            />
          </div>

          {/* Right Panel - Results (60%) */}
          <div className="flex-1 flex flex-col">
            {/* Right Panel Header */}
            <div className="bg-card border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {rightPanelViews.map(view => (
                    <button
                      key={view.id}
                      onClick={() => setRightPanelView(view.id)}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-smooth ${
                        rightPanelView === view.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      disabled={isSimulating}
                    >
                      <Icon name={view.icon} size={16} />
                      <span>{view.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  {simulationResults && (
                    <div className="text-sm text-muted-foreground">
                      Completed: {simulationResults.completedAt.toLocaleTimeString()}
                    </div>
                  )}
                  <Button
                    variant="ghost" size="sm" iconName="Maximize2"
                    title="Fullscreen view"
                  />
                  <Button
                    variant="ghost" size="sm" iconName="Settings"
                    title="Display settings"
                  />
                </div>
              </div>
            </div>

            {/* Right Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelView === 'visualization' ? (
                <ResultsVisualizationPanel
                  simulationResults={simulationResults}
                  isSimulating={isSimulating}
                />
              ) : (
                <StatisticalSummaryTable
                  simulationResults={simulationResults}
                  isSimulating={isSimulating}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Status Bar */}
        <div className="bg-muted/30 border-t border-border px-6 py-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-6">
              <span>Scenarios: {scenarios.length}</span>
              <span>Variables: 4 active</span>
              <span>Correlations: 3 defined</span>
              {simulationResults && (
                <span>Iterations: {simulationResults.summary.iterations.toLocaleString()}</span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span>© {new Date().getFullYear()} FinanceAnalyst Pro</span>
              <span>•</span>
              <span>SOX Compliant</span>
              <span>•</span>
              <span>Audit Trail: Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysisSensitivityTools;
