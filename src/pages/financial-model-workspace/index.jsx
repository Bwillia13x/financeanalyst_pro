import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TerminalInterface from './components/TerminalInterface';
import FormulaBuilder from './components/FormulaBuilder';
import CalculationResults from './components/CalculationResults';
import ModelTemplates from './components/ModelTemplates';
import VariableInputs from './components/VariableInputs';
import AuditTrail from './components/AuditTrail';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const FinancialModelWorkspace = () => {
  const [activeLayout, setActiveLayout] = useState('dual-pane');
  const [leftPanelContent, setLeftPanelContent] = useState('terminal');
  const [rightPanelContent, setRightPanelContent] = useState('results');
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [modelState, setModelState] = useState({
    name: 'DCF_Analysis_v2.3',
    saved: true,
    calculating: false,
    lastSaved: new Date()
  });
  const [calculationResults, setCalculationResults] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const layoutOptions = [
    { id: 'dual-pane', label: 'Dual Pane', icon: 'Columns' },
    { id: 'terminal-focus', label: 'Terminal Focus', icon: 'Terminal' },
    { id: 'results-focus', label: 'Results Focus', icon: 'BarChart3' },
    { id: 'full-screen', label: 'Full Screen', icon: 'Maximize' }
  ];

  const leftPanelOptions = [
    { id: 'terminal', label: 'Terminal', icon: 'Terminal' },
    { id: 'formula-builder', label: 'Formula Builder', icon: 'Wrench' },
    { id: 'templates', label: 'Templates', icon: 'FileTemplate' }
  ];

  const rightPanelOptions = [
    { id: 'results', label: 'Results', icon: 'Calculator' },
    { id: 'variables', label: 'Variables', icon: 'Sliders' },
    { id: 'audit', label: 'Audit Trail', icon: 'FileText' }
  ];

  const collaborators = [
    { id: 1, name: 'Sarah Chen', role: 'Senior Analyst', status: 'active', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: 2, name: 'Michael Rodriguez', role: 'VP Finance', status: 'viewing', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: 3, name: 'Emily Johnson', role: 'Junior Analyst', status: 'idle', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' }
  ];

  useEffect(() => {
    // Auto-save functionality
    const autoSaveInterval = setInterval(() => {
      if (!modelState.saved) {
        setModelState(prev => ({
          ...prev,
          saved: true,
          lastSaved: new Date()
        }));
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [modelState.saved]);

  const handleCommandExecute = (command, response) => {
    setModelState(prev => ({ ...prev, saved: false }));
    
    if (response.data) {
      setCalculationResults(response.data);
    }
  };

  const handleTemplateSelect = (template) => {
    setModelState(prev => ({
      ...prev,
      name: `${template.name}_${new Date().toISOString().split('T')[0]}`,
      saved: false
    }));
    setShowTemplates(false);
    setLeftPanelContent('terminal');
  };

  const handleVariableChange = (section, key, value) => {
    setModelState(prev => ({ ...prev, saved: false }));
  };

  const handleExport = (format) => {
    // Export functionality
    console.log(`Exporting model in ${format} format`);
  };

  const saveModel = () => {
    setModelState(prev => ({
      ...prev,
      saved: true,
      lastSaved: new Date()
    }));
  };

  const getLayoutClasses = () => {
    switch (activeLayout) {
      case 'dual-pane':
        return 'grid grid-cols-[60%_40%] gap-4';
      case 'terminal-focus':
        return 'grid grid-cols-[80%_20%] gap-4';
      case 'results-focus':
        return 'grid grid-cols-[30%_70%] gap-4';
      case 'full-screen':
        return 'grid grid-cols-1';
      default:
        return 'grid grid-cols-[60%_40%] gap-4';
    }
  };

  const renderLeftPanel = () => {
    switch (leftPanelContent) {
      case 'terminal':
        return (
          <TerminalInterface
            onCommandExecute={handleCommandExecute}
            calculationResults={calculationResults}
          />
        );
      case 'formula-builder':
        return (
          <FormulaBuilder
            onFormulaCreate={(formula) => console.log('Formula created:', formula)}
            variables={[]}
          />
        );
      case 'templates':
        return (
          <ModelTemplates
            onTemplateSelect={handleTemplateSelect}
            onTemplateCreate={() => console.log('Template created')}
          />
        );
      default:
        return <TerminalInterface onCommandExecute={handleCommandExecute} />;
    }
  };

  const renderRightPanel = () => {
    switch (rightPanelContent) {
      case 'results':
        return (
          <CalculationResults
            results={calculationResults}
            onExport={handleExport}
          />
        );
      case 'variables':
        return (
          <VariableInputs
            onVariableChange={handleVariableChange}
            onBulkEdit={() => console.log('Bulk edit')}
          />
        );
      case 'audit':
        return (
          <AuditTrail
            calculations={[]}
            errors={[]}
            warnings={[]}
          />
        );
      default:
        return <CalculationResults results={calculationResults} onExport={handleExport} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-[60px] h-screen flex flex-col">
        {/* Workspace Toolbar */}
        <div className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center space-x-4">
            {/* Layout Controls */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setActiveLayout(layout.id)}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-smooth ${
                    activeLayout === layout.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                  title={layout.label}
                >
                  <Icon name={layout.icon} size={16} />
                  <span className="hidden lg:inline">{layout.label}</span>
                </button>
              ))}
            </div>

            {/* Panel Controls */}
            <div className="flex items-center space-x-2">
              <select
                value={leftPanelContent}
                onChange={(e) => setLeftPanelContent(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {leftPanelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {activeLayout !== 'full-screen' && (
                <select
                  value={rightPanelContent}
                  onChange={(e) => setRightPanelContent(e.target.value)}
                  className="px-3 py-2 bg-input border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {rightPanelOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Model Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
              <div className={`w-2 h-2 rounded-full ${modelState.saved ? 'bg-success' : 'bg-warning'}`} />
              <span className="text-sm font-medium text-foreground">{modelState.name}</span>
              {!modelState.saved && (
                <span className="text-xs text-muted-foreground">Unsaved changes</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                iconName="Save"
                onClick={saveModel}
                disabled={modelState.saved}
              >
                Save
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                iconName="FileTemplate"
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>

              <Button
                variant="outline"
                size="sm"
                iconName="Users"
                onClick={() => setIsCollaborationOpen(!isCollaborationOpen)}
              >
                Collaborate
              </Button>

              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                onClick={() => handleExport('excel')}
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className={`h-full ${getLayoutClasses()}`}>
            {/* Left Panel */}
            <div className="h-full border border-border rounded-lg overflow-hidden">
              {renderLeftPanel()}
            </div>

            {/* Right Panel */}
            {activeLayout !== 'full-screen' && (
              <div className="h-full border border-border rounded-lg overflow-hidden">
                {renderRightPanel()}
              </div>
            )}
          </div>
        </div>

        {/* Collaboration Sidebar */}
        {isCollaborationOpen && (
          <div className="fixed right-0 top-[60px] bottom-0 w-80 bg-card border-l border-border shadow-elevation-2 z-40">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Collaboration</h3>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={() => setIsCollaborationOpen(false)}
              />
            </div>
            
            <div className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Active Collaborators</h4>
              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center space-x-3">
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{collaborator.name}</p>
                      <p className="text-xs text-muted-foreground">{collaborator.role}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      collaborator.status === 'active' ? 'bg-success' :
                      collaborator.status === 'viewing' ? 'bg-warning' : 'bg-muted-foreground'
                    }`} />
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Button variant="outline" size="sm" iconName="UserPlus" fullWidth>
                  Invite Collaborator
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-elevation-2 w-full max-w-4xl mx-4 h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Select Model Template</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={() => setShowTemplates(false)}
                />
              </div>
              <div className="h-[calc(80vh-80px)]">
                <ModelTemplates
                  onTemplateSelect={handleTemplateSelect}
                  onTemplateCreate={() => console.log('Template created')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialModelWorkspace;