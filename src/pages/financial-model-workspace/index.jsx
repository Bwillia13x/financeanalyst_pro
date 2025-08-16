import { useState } from 'react';

import Icon from '../../components/AppIcon';
import SEOHead from '../../components/SEO/SEOHead';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';

import AuditTrail from './components/AuditTrail';
import CalculationResults from './components/CalculationResults';
import FormulaBuilder from './components/FormulaBuilder';
import ModelTemplates from './components/ModelTemplates';
import TerminalInterface from './components/TerminalInterface';
import VariableInputs from './components/VariableInputs';

const FinancialModelWorkspace = () => {
  const [activeLayout, setActiveLayout] = useState('dual-pane');
  const [leftPanelContent, setLeftPanelContent] = useState('terminal');
  const [rightPanelContent, setRightPanelContent] = useState('results');
  const [modelState] = useState({
    name: 'DCF_Analysis_v2.3',
    saved: true,
    calculating: false,
    lastSaved: new Date()
  });

  const [calculationResults, setCalculationResults] = useState(null);

  const handleCommandExecute = (command, result) => {
    setCalculationResults(result);
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
      case 'variables':
        return <VariableInputs />;
      case 'formulas':
        return <FormulaBuilder />;
      case 'templates':
        return <ModelTemplates />;
      default:
        return (
          <TerminalInterface
            onCommandExecute={handleCommandExecute}
            calculationResults={calculationResults}
          />
        );
    }
  };

  const renderRightPanel = () => {
    switch (rightPanelContent) {
      case 'results':
        return <CalculationResults results={calculationResults} />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <CalculationResults results={calculationResults} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SEOHead
        title="Financial Model Workspace | Valor-IVX"
        description="Professional financial modeling workspace with advanced DCF analysis, LBO tools, and real-time collaboration features for finance professionals."
        canonical="/"
        keywords="financial modeling, DCF analysis, LBO modeling, financial workspace, valuation tools, Excel alternative"
      />
      <Header />

      {/* Main Workspace */}
      <main id="main-content" className="flex flex-col h-screen pt-16" role="main">
        {/* Breadcrumbs and accessible page heading */}
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-800">
          <h1 className="sr-only">Financial Model Workspace</h1>
          <Breadcrumbs />
        </div>
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="FileText" className="w-5 h-5 text-blue-400" />
              <span className="font-medium">{modelState.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  modelState.saved ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}
              >
                {modelState.saved ? 'Saved' : 'Unsaved'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Layout Controls */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <Button
                variant={activeLayout === 'single-pane' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveLayout('single-pane')}
                aria-label="Single-pane layout"
              >
                <Icon name="Square" className="w-4 h-4" />
              </Button>
              <Button
                variant={activeLayout === 'dual-pane' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveLayout('dual-pane')}
                aria-label="Dual-pane layout"
              >
                <Icon name="Columns" className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel Controls */}
            <div className="flex items-center space-x-1">
              <select
                value={leftPanelContent}
                onChange={(e) => setLeftPanelContent(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                aria-label="Select left panel content"
              >
                <option value="terminal">Terminal</option>
                <option value="variables">Variables</option>
                <option value="formulas">Formulas</option>
                <option value="templates">Templates</option>
              </select>

              {activeLayout === 'dual-pane' && (
                <select
                  value={rightPanelContent}
                  onChange={(e) => setRightPanelContent(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  aria-label="Select right panel content"
                >
                  <option value="results">Results</option>
                  <option value="audit">Audit Trail</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div
            className={`${
              activeLayout === 'dual-pane' ? 'w-1/2' : 'w-full'
            } border-r border-gray-700 overflow-hidden`}
          >
            {renderLeftPanel()}
          </div>

          {/* Right Panel */}
          {activeLayout === 'dual-pane' && (
            <div className="w-1/2 overflow-hidden">
              {renderRightPanel()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancialModelWorkspace;
