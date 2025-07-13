import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SimulationControlBar = ({ onRunSimulation, isSimulating, progress, onStopSimulation }) => {
  const [simulationParams, setSimulationParams] = useState({
    iterations: 10000,
    confidenceLevel: 0.95,
    randomSeed: 12345,
    method: 'monte_carlo'
  });

  const iterationOptions = [
    { value: 1000, label: '1,000 iterations' },
    { value: 5000, label: '5,000 iterations' },
    { value: 10000, label: '10,000 iterations' },
    { value: 25000, label: '25,000 iterations' },
    { value: 50000, label: '50,000 iterations' },
    { value: 100000, label: '100,000 iterations' }
  ];

  const methodOptions = [
    { value: 'monte_carlo', label: 'Monte Carlo Simulation' },
    { value: 'latin_hypercube', label: 'Latin Hypercube Sampling' },
    { value: 'sobol_sequence', label: 'Sobol Sequence' },
    { value: 'halton_sequence', label: 'Halton Sequence' }
  ];

  const confidenceOptions = [
    { value: 0.90, label: '90% Confidence' },
    { value: 0.95, label: '95% Confidence' },
    { value: 0.99, label: '99% Confidence' }
  ];

  const handleRunSimulation = () => {
    onRunSimulation(simulationParams);
  };

  const getEstimatedTime = () => {
    const baseTime = simulationParams.iterations / 1000; // seconds per 1000 iterations
    return baseTime < 60 ? `~${Math.ceil(baseTime)}s` : `~${Math.ceil(baseTime / 60)}m`;
  };

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Simulation Parameters */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <Select
              options={iterationOptions}
              value={simulationParams.iterations}
              onChange={(value) => setSimulationParams(prev => ({ ...prev, iterations: value }))}
              disabled={isSimulating}
              className="w-48"
            />
            
            <Select
              options={methodOptions}
              value={simulationParams.method}
              onChange={(value) => setSimulationParams(prev => ({ ...prev, method: value }))}
              disabled={isSimulating}
              className="w-56"
            />
            
            <Select
              options={confidenceOptions}
              value={simulationParams.confidenceLevel}
              onChange={(value) => setSimulationParams(prev => ({ ...prev, confidenceLevel: value }))}
              disabled={isSimulating}
              className="w-40"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={simulationParams.randomSeed}
              onChange={(e) => setSimulationParams(prev => ({ ...prev, randomSeed: parseInt(e.target.value) }))}
              disabled={isSimulating}
              className="w-24"
              placeholder="Seed"
            />
            <Button
              variant="ghost"
              size="sm"
              iconName="Shuffle"
              onClick={() => setSimulationParams(prev => ({ ...prev, randomSeed: Math.floor(Math.random() * 100000) }))}
              disabled={isSimulating}
              title="Generate random seed"
            />
          </div>
        </div>

        {/* Center Section - Progress */}
        {isSimulating && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {progress.toFixed(1)}%
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span className="font-mono">
                {Math.floor((progress / 100) * simulationParams.iterations).toLocaleString()}
              </span>
              <span className="mx-1">/</span>
              <span className="font-mono">
                {simulationParams.iterations.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Right Section - Controls */}
        <div className="flex items-center space-x-4">
          {!isSimulating && (
            <div className="text-sm text-muted-foreground">
              Est. time: {getEstimatedTime()}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {isSimulating ? (
              <Button
                variant="destructive"
                iconName="Square"
                onClick={onStopSimulation}
              >
                Stop Simulation
              </Button>
            ) : (
              <Button
                variant="default"
                iconName="Play"
                onClick={handleRunSimulation}
              >
                Run Simulation
              </Button>
            )}
            
            <Button
              variant="outline"
              iconName="RotateCcw"
              disabled={isSimulating}
              title="Reset parameters"
              onClick={() => setSimulationParams({
                iterations: 10000,
                confidenceLevel: 0.95,
                randomSeed: 12345,
                method: 'monte_carlo'
              })}
            />
            
            <Button
              variant="outline"
              iconName="Settings"
              disabled={isSimulating}
              title="Advanced settings"
            />
          </div>
        </div>
      </div>

      {/* Additional Info Bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Icon name="Cpu" size={16} />
            <span>Web Workers: 4 active</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="MemoryStick" size={16} />
            <span>Memory: 245MB allocated</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={16} />
            <span>Last run: 2 min ago</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            iconName="Download"
            disabled={isSimulating}
          >
            Export Config
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="Upload"
            disabled={isSimulating}
          >
            Import Config
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="History"
            disabled={isSimulating}
          >
            Run History
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulationControlBar;