import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Upload,
  Download,
  CheckCircle,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  Database,
  Sidebar
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import DataExportImport from '../components/DataExportImport';
import AdvancedLBOTool from '../components/PrivateAnalysis/AdvancedLBOTool';
import AnalysisResults from '../components/PrivateAnalysis/AnalysisResults';
import ContextualInsightsSidebar from '../components/PrivateAnalysis/ContextualInsightsSidebar';
import EnhancedMarketDataDashboard from '../components/PrivateAnalysis/EnhancedMarketDataDashboard';
import EnhancedScenarioAnalysis from '../components/PrivateAnalysis/EnhancedScenarioAnalysis';
import FinancialModelWorkspace from '../components/PrivateAnalysis/FinancialModelWorkspace';
import FinancialSpreadsheet from '../components/PrivateAnalysis/FinancialSpreadsheet';
import ModelingTools from '../components/PrivateAnalysis/ModelingTools';
import MonteCarloIntegrationHub from '../components/PrivateAnalysis/MonteCarloIntegrationHub';
import WorkflowNavigation from '../components/PrivateAnalysis/WorkflowNavigation';
import SEOHead from '../components/SEO/SEOHead';
import Button from '../components/ui/Button';
import Header from '../components/ui/Header';
import defaultFinancialData from '../data/defaultFinancialData';
import { formatCurrency, formatPercentage } from '../utils/dataTransformation';
import { calculateDCF } from '../utils/dcfCalculations';

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center text-red-400">
          Something went wrong. Please refresh the page.
        </div>
      );
    }

    return this.props.children;
  }
}

const PrivateAnalysis = () => {
  const [activeTab, setActiveTab] = useState('spreadsheet');
  const [advancedResults, setAdvancedResults] = useState({
    lbo: null,
    threeStatement: null,
    scenarios: null,
    marketData: null,
    monteCarlo: null
  });
  const [financialData, setFinancialData] = useState(defaultFinancialData);
  const [adjustedValues, setAdjustedValues] = useState({});
  const [modelInputs, setModelInputs] = useState({
    dcf: {
      discountRate: 10,
      terminalGrowthRate: 2.5,
      projectionYears: 5,
      taxRate: 25
    },
    scenario: {
      scenarios: []
    }
  });

  // Insights sidebar state
  const [insightsSidebarVisible, setInsightsSidebarVisible] = useState(false);
  const [currentMetricFocus, setCurrentMetricFocus] = useState(null);

  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      const saved = localStorage.getItem('privateAnalyses');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved analyses:', error);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState('ready');
  const [lastSaved, setLastSaved] = useState(null);

  // Enhanced data completeness tracking
  const getDataCompleteness = () => {
    if (!financialData?.statements) return 0;

    const coreIncomeFields = ['totalRevenue', 'totalCostOfGoodsSold', 'operatingIncome', 'netIncome'];
    const optionalBalanceFields = ['totalAssets', 'totalLiabilities', 'totalEquity'];
    const optionalCashFlowFields = ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'];

    let completedFields = 0;
    let totalWeightedFields = 0;

    // Check core income statement fields (weighted more heavily)
    coreIncomeFields.forEach(field => {
      totalWeightedFields += 3; // Core fields worth 3 points each
      if (financialData.statements.incomeStatement?.[field]?.[2] !== undefined) {
        completedFields += 3;
      }
    });

    // Check optional balance sheet fields
    optionalBalanceFields.forEach(field => {
      totalWeightedFields += 2; // Optional fields worth 2 points each
      if (financialData.statements.balanceSheet?.[field]?.[2] !== undefined) {
        completedFields += 2;
      }
    });

    // Check cash flow fields
    optionalCashFlowFields.forEach(field => {
      totalWeightedFields += 2;
      if (financialData.statements.cashFlow?.[field]?.[2] !== undefined) {
        completedFields += 2;
      }
    });

    const completionPercentage = Math.round((completedFields / totalWeightedFields) * 100);

    // If we have core income statement data, ensure minimum 80% completion
    const hasBasicIncomeData = financialData?.statements?.incomeStatement?.totalRevenue?.[2] !== undefined &&
                              financialData?.statements?.incomeStatement?.operatingIncome?.[2] !== undefined;

    return hasBasicIncomeData ? Math.max(completionPercentage, 80) : completionPercentage;
  };

  const calculateModelingProgress = () => {
    let progress = 0;

    // DCF Model completion
    if (modelInputs?.dcf?.discountRate && modelInputs?.dcf?.terminalGrowthRate) {
      progress += 40;
    }

    // Enhanced data completeness boost
    const dataCompleteness = getDataCompleteness();
    if (dataCompleteness >= 80) {
      progress += 20; // Comprehensive data gets boost
    }

    // Scenario analysis completion
    if (modelInputs?.scenario?.scenarios && modelInputs.scenario.scenarios.length > 0) {
      progress += 20;
    }

    // Advanced tools usage
    if (advancedResults.lbo || advancedResults.threeStatement || advancedResults.monteCarlo) {
      progress += 20;
    }

    return Math.min(progress, 100);
  };

  const calculateAnalysisProgress = () => {
    let progress = 0;

    // Basic DCF analysis
    if (financialData?.statements?.incomeStatement) {
      progress += 30;
    }

    // Advanced modeling results
    if (advancedResults.lbo) progress += 20;
    if (advancedResults.threeStatement) progress += 20;
    if (advancedResults.scenarios) progress += 15;
    if (advancedResults.monteCarlo) progress += 15;

    return Math.min(progress, 100);
  };

  const saveAnalysis = async(name) => {
    try {
      setIsLoading(true);
      setDataStatus('saving');

      const analysis = {
        id: Date.now().toString(),
        name: name || `Analysis ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        financialData,
        adjustedValues,
        modelInputs,
        advancedResults,
        dataCompleteness: getDataCompleteness(),
        modelingProgress: calculateModelingProgress(),
        analysisProgress: calculateAnalysisProgress()
      };

      const updated = [...savedAnalyses, analysis];
      setSavedAnalyses(updated);

      try {
        localStorage.setItem('privateAnalyses', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving analysis:', error);
        throw new Error('Failed to save analysis to localStorage');
      }

      setDataStatus('ready');
      setLastSaved(new Date());

    } catch (error) {
      console.error('Save failed:', error);
      setDataStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalysis = (analysisId) => {
    const analysis = savedAnalyses.find(a => a.id === analysisId);
    if (analysis) {
      setFinancialData(analysis.financialData);
      setAdjustedValues(analysis.adjustedValues);
      setModelInputs(analysis.modelInputs);
      setAdvancedResults(analysis.advancedResults || {
        lbo: null, threeStatement: null, scenarios: null, marketData: null, monteCarlo: null
      });
    }
  };

  const deleteAnalysis = (analysisId) => {
    try {
      const updated = savedAnalyses.filter(a => a.id !== analysisId);
      setSavedAnalyses(updated);
      localStorage.setItem('privateAnalyses', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const handleInsightClick = (insight) => {
    setCurrentMetricFocus(insight.metric);
  };

  const toggleInsightsSidebar = () => {
    setInsightsSidebarVisible(!insightsSidebarVisible);
  };

  // Auto-show insights sidebar when analysis becomes available
  useEffect(() => {
    if (calculateAnalysisProgress() > 60 && !insightsSidebarVisible) {
      setInsightsSidebarVisible(true);
    }
  }, [financialData, advancedResults, insightsSidebarVisible]);

  // Status indicator component
  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'ready': return 'text-green-400';
        case 'modified': return 'text-yellow-400';
        case 'saving': return 'text-blue-400';
        case 'error': return 'text-red-400';
        default: return 'text-gray-400';
      }
    };

    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="text-sm">{label}</span>
      </div>
    );
  };

  const tabs = [
    { id: 'spreadsheet', label: 'Financial Spreadsheet', icon: Database },
    { id: 'modeling', label: 'Financial Modeling', icon: Activity },
    { id: 'analysis', label: 'Analysis & Results', icon: FileText },
    { id: 'lbo', label: 'Advanced LBO', icon: Activity },
    { id: 'threestatement', label: '3-Statement Model', icon: Database },
    { id: 'scenarios', label: 'Scenario Analysis', icon: Activity },
    { id: 'marketdata', label: 'Market Data', icon: Activity },
    { id: 'montecarlo', label: 'Monte Carlo', icon: Activity },
    { id: 'import-export', label: 'Import/Export', icon: Upload }
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative">
      <SEOHead
        title="Private Analysis Suite | FinanceAnalyst Pro"
        description="Comprehensive financial analysis platform with advanced modeling tools, scenario analysis, Monte Carlo simulation, and private equity workflows."
        canonical="/private-analysis"
        keywords="private analysis, financial modeling, scenario analysis, Monte Carlo simulation, LBO analysis, private equity tools"
      />
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Private Analysis</h1>

            <div className="flex items-center gap-4">
              <StatusIndicator
                status={dataStatus}
                label={dataStatus === 'ready' ? 'Ready' : dataStatus === 'saving' ? 'Saving...' : 'Modified'}
              />

              {lastSaved && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              <Button
                onClick={() => saveAnalysis()}
                disabled={isLoading}
                className="flex items-center gap-2"
                variant="primary"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Data Completeness</span>
                <span className="text-white font-semibold">{getDataCompleteness()}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getDataCompleteness()}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Analysis Progress</span>
                <span className="text-white font-semibold">{calculateAnalysisProgress()}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${calculateAnalysisProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-800 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200
                    ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'spreadsheet' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading spreadsheet. Please refresh the page.</div>}>
                <FinancialSpreadsheet
                  data={financialData}
                  onDataChange={setFinancialData}
                  onAdjustedValuesChange={setAdjustedValues}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'modeling' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading modeling tools. Please refresh the page.</div>}>
                <ModelingTools
                  data={financialData}
                  adjustedValues={adjustedValues}
                  onDataChange={setFinancialData}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'analysis' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading analysis results. Please check your data and refresh.</div>}>
                <AnalysisResults
                  data={financialData}
                  adjustedValues={adjustedValues}
                  modelInputs={modelInputs}
                  calculateDCF={(data) => calculateDCF(data, modelInputs)}
                  formatCurrency={formatCurrency}
                  formatPercentage={formatPercentage}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'lbo' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading LBO tool. Please check your data.</div>}>
                <AdvancedLBOTool
                  data={financialData}
                  onDataChange={(results) => setAdvancedResults(prev => ({ ...prev, lbo: results }))}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'threestatement' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading financial model workspace.</div>}>
                <FinancialModelWorkspace
                  data={financialData}
                  onDataChange={(results) => setAdvancedResults(prev => ({ ...prev, threeStatement: results }))}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'scenarios' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading scenario analysis.</div>}>
                <EnhancedScenarioAnalysis
                  data={financialData}
                  onDataChange={(results) => setAdvancedResults(prev => ({ ...prev, scenarios: results }))}
                  calculateDCF={(data) => calculateDCF(data, modelInputs)}
                  lboModelingEngine={null}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'marketdata' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading market data dashboard.</div>}>
                <EnhancedMarketDataDashboard
                  data={financialData}
                  onDataChange={(results) => setAdvancedResults(prev => ({ ...prev, marketData: results }))}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'montecarlo' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading Monte Carlo integration.</div>}>
                <MonteCarloIntegrationHub
                  data={financialData}
                  dcfResults={advancedResults.dcf}
                  lboResults={advancedResults.lbo}
                  financialModel={advancedResults.threeStatement}
                  scenarioResults={advancedResults.scenarios}
                  onDataChange={(results) => setAdvancedResults(prev => ({ ...prev, monteCarlo: results }))}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'import-export' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading import/export tools.</div>}>
                <DataExportImport
                  data={financialData}
                  onDataChange={setFinancialData}
                  savedAnalyses={savedAnalyses}
                  onAnalysesChange={setSavedAnalyses}
                />
              </ErrorBoundary>
            )}
          </motion.div>
        </div>

        {/* Contextual Insights Sidebar */}
        <ContextualInsightsSidebar
          financialData={financialData}
          currentMetric={currentMetricFocus}
          analysisContext={activeTab === 'analysis' ? 'dcf' : activeTab}
          onInsightClick={handleInsightClick}
          isVisible={insightsSidebarVisible}
          onToggle={toggleInsightsSidebar}
        />
      </main>
    </div>
  );
};

export default PrivateAnalysis;
