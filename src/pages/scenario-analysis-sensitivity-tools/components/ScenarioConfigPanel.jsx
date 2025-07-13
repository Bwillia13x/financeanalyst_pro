import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ScenarioConfigPanel = ({ onScenarioUpdate, isSimulating }) => {
  const [activeTab, setActiveTab] = useState('variables');
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: "Base Case",
      probability: 0.4,
      variables: {
        revenueGrowth: 0.15,
        marginExpansion: 0.02,
        capexRatio: 0.08,
        terminalGrowth: 0.025
      }
    },
    {
      id: 2,
      name: "Bull Case",
      probability: 0.3,
      variables: {
        revenueGrowth: 0.25,
        marginExpansion: 0.05,
        capexRatio: 0.06,
        terminalGrowth: 0.035
      }
    },
    {
      id: 3,
      name: "Bear Case",
      probability: 0.3,
      variables: {
        revenueGrowth: 0.05,
        marginExpansion: -0.01,
        capexRatio: 0.12,
        terminalGrowth: 0.015
      }
    }
  ]);

  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [correlationMatrix, setCorrelationMatrix] = useState([
    { var1: 'Revenue Growth', var2: 'Margin Expansion', correlation: 0.65 },
    { var1: 'Revenue Growth', var2: 'CapEx Ratio', correlation: -0.45 },
    { var1: 'Margin Expansion', var2: 'Terminal Growth', correlation: 0.35 }
  ]);

  const distributionTypes = [
    { value: 'normal', label: 'Normal Distribution' },
    { value: 'triangular', label: 'Triangular Distribution' },
    { value: 'uniform', label: 'Uniform Distribution' },
    { value: 'lognormal', label: 'Log-Normal Distribution' }
  ];

  const variableTemplates = [
    { value: 'dcf_standard', label: 'DCF Standard Variables' },
    { value: 'lbo_analysis', label: 'LBO Analysis Variables' },
    { value: 'comps_analysis', label: 'Comparable Analysis Variables' },
    { value: 'custom', label: 'Custom Variable Set' }
  ];

  const tabs = [
    { id: 'variables', label: 'Variables', icon: 'Settings' },
    { id: 'distributions', label: 'Distributions', icon: 'BarChart3' },
    { id: 'correlations', label: 'Correlations', icon: 'Network' },
    { id: 'templates', label: 'Templates', icon: 'FileTemplate' }
  ];

  const handleVariableChange = (variableName, value) => {
    const updatedScenario = {
      ...selectedScenario,
      variables: {
        ...selectedScenario.variables,
        [variableName]: parseFloat(value)
      }
    };
    setSelectedScenario(updatedScenario);
    
    const updatedScenarios = scenarios.map(s => 
      s.id === selectedScenario.id ? updatedScenario : s
    );
    setScenarios(updatedScenarios);
    onScenarioUpdate(updatedScenarios);
  };

  const addNewScenario = () => {
    const newScenario = {
      id: scenarios.length + 1,
      name: `Scenario ${scenarios.length + 1}`,
      probability: 0.1,
      variables: { ...selectedScenario.variables }
    };
    setScenarios([...scenarios, newScenario]);
  };

  const renderVariablesTab = () => (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Scenario Configuration</h3>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={addNewScenario}
            disabled={isSimulating}
          >
            Add Scenario
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className={`p-3 rounded-lg border text-left transition-smooth ${
                selectedScenario.id === scenario.id
                  ? 'border-primary bg-primary/5 text-primary' :'border-border hover:border-primary/50'
              }`}
              disabled={isSimulating}
            >
              <div className="font-medium text-sm">{scenario.name}</div>
              <div className="text-xs text-muted-foreground">
                P: {(scenario.probability * 100).toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Variable Inputs */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Key Variables</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Revenue Growth Rate"
              type="number"
              value={selectedScenario.variables.revenueGrowth}
              onChange={(e) => handleVariableChange('revenueGrowth', e.target.value)}
              placeholder="0.15"
              disabled={isSimulating}
              description="Annual revenue growth rate"
            />
            <Input
              label="Margin Expansion"
              type="number"
              value={selectedScenario.variables.marginExpansion}
              onChange={(e) => handleVariableChange('marginExpansion', e.target.value)}
              placeholder="0.02"
              disabled={isSimulating}
              description="EBITDA margin improvement"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CapEx Ratio"
              type="number"
              value={selectedScenario.variables.capexRatio}
              onChange={(e) => handleVariableChange('capexRatio', e.target.value)}
              placeholder="0.08"
              disabled={isSimulating}
              description="CapEx as % of revenue"
            />
            <Input
              label="Terminal Growth Rate"
              type="number"
              value={selectedScenario.variables.terminalGrowth}
              onChange={(e) => handleVariableChange('terminalGrowth', e.target.value)}
              placeholder="0.025"
              disabled={isSimulating}
              description="Long-term growth rate"
            />
          </div>
        </div>
      </div>

      {/* Probability Weights */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Probability Weights</h4>
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium text-sm">{scenario.name}</span>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={scenario.probability}
                  onChange={(e) => {
                    const updatedScenarios = scenarios.map(s =>
                      s.id === scenario.id ? { ...s, probability: parseFloat(e.target.value) } : s
                    );
                    setScenarios(updatedScenarios);
                  }}
                  className="w-20"
                  disabled={isSimulating}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDistributionsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Distribution Parameters</h3>
      
      <div className="space-y-4">
        {Object.keys(selectedScenario.variables).map((variable) => (
          <div key={variable} className="p-4 border border-border rounded-lg space-y-3">
            <h4 className="font-medium text-foreground capitalize">
              {variable.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Distribution Type"
                options={distributionTypes}
                value="normal"
                onChange={() => {}}
                disabled={isSimulating}
              />
              <Input
                label="Standard Deviation"
                type="number"
                placeholder="0.05"
                disabled={isSimulating}
                description="Volatility parameter"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Min Value"
                type="number"
                placeholder="-0.1"
                disabled={isSimulating}
              />
              <Input
                label="Most Likely"
                type="number"
                value={selectedScenario.variables[variable]}
                disabled={isSimulating}
              />
              <Input
                label="Max Value"
                type="number"
                placeholder="0.5"
                disabled={isSimulating}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCorrelationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Variable Correlations</h3>
      
      <div className="space-y-4">
        {correlationMatrix.map((correlation, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm">{correlation.var1}</div>
              <div className="text-xs text-muted-foreground">vs {correlation.var2}</div>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                value={correlation.correlation}
                onChange={(e) => {
                  const updatedMatrix = correlationMatrix.map((c, i) =>
                    i === index ? { ...c, correlation: parseFloat(e.target.value) } : c
                  );
                  setCorrelationMatrix(updatedMatrix);
                }}
                className="w-24"
                disabled={isSimulating}
                min="-1"
                max="1"
                step="0.01"
              />
              <div className={`w-3 h-3 rounded-full ${
                correlation.correlation > 0.5 ? 'bg-success' :
                correlation.correlation < -0.5 ? 'bg-error' : 'bg-warning'
              }`} />
            </div>
          </div>
        ))}
      </div>
      
      <Button
        variant="outline"
        iconName="Plus"
        disabled={isSimulating}
        className="w-full"
      >
        Add Correlation Pair
      </Button>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Scenario Templates</h3>
      
      <Select
        label="Load Template"
        options={variableTemplates}
        value="dcf_standard"
        onChange={() => {}}
        disabled={isSimulating}
        description="Pre-configured variable sets for common analyses"
      />
      
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Template Actions</h4>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            iconName="Download"
            disabled={isSimulating}
            className="w-full"
          >
            Import from Excel
          </Button>
          <Button
            variant="outline"
            iconName="Upload"
            disabled={isSimulating}
            className="w-full"
          >
            Export Template
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">Saved Templates</h4>
        <div className="space-y-2">
          {['Tech Company DCF', 'REIT Analysis', 'Energy Sector Model'].map((template, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium text-sm">{template}</div>
                <div className="text-xs text-muted-foreground">Last modified: 2 days ago</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" iconName="Eye" disabled={isSimulating} />
                <Button variant="ghost" size="sm" iconName="Download" disabled={isSimulating} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Scenario Configuration</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-warning' : 'bg-success'}`} />
            <span className="text-sm text-muted-foreground">
              {isSimulating ? 'Simulating...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-smooth ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary' :'text-muted-foreground hover:text-foreground'
              }`}
              disabled={isSimulating}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'distributions' && renderDistributionsTab()}
        {activeTab === 'correlations' && renderCorrelationsTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
      </div>
    </div>
  );
};

export default ScenarioConfigPanel;