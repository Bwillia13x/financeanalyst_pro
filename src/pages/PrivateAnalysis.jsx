import { motion } from 'framer-motion';
import {
  FileText,
  Save,
  Upload,
  HelpCircle,
  Play,
  Database,
  Activity
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// OnboardingTour components will be added later
import Button from '../components/ui/Button';
import { HelpPanel } from '../components/ui/ContextualHelp';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Header from '../components/ui/Header';
import SEOHead from '../components/SEO/SEOHead';
import { LoadingWrapper, FinancialTableSkeleton } from '../components/ui/LoadingSkeleton';
import SecondaryNav from '../components/ui/SecondaryNav';
import defaultFinancialData from '../data/defaultFinancialData';
import { useCollaboration } from '../hooks/useCollaboration';
import {
  setFinancialData,
  setDcfResults,
  setLboResults,
  setThreeStatementResults,
  setMonteCarloResults,
  selectFinancialData,
  selectActiveModel,
  selectIsDirty
} from '../store/analysisStore';
import { formatCurrency, formatPercentage } from '../utils/dataTransformation';
import { calculateDCF } from '../utils/dcfCalculations';

// Lazy-loaded heavy modules to reduce initial bundle size for the Private Analysis route
const FinancialSpreadsheet = lazy(() => import('../components/PrivateAnalysis/FinancialSpreadsheet'));
const ModelingTools = lazy(() => import('../components/PrivateAnalysis/ModelingTools'));
const AnalysisResults = lazy(() => import('../components/PrivateAnalysis/AnalysisResults'));
const AdvancedLBOTool = lazy(() => import('../components/PrivateAnalysis/AdvancedLBOTool'));
const FinancialModelWorkspace = lazy(() => import('../components/PrivateAnalysis/FinancialModelWorkspace'));
const EnhancedScenarioAnalysis = lazy(() => import('../components/PrivateAnalysis/EnhancedScenarioAnalysis'));
const EnhancedMarketDataDashboard = lazy(() => import('../components/PrivateAnalysis/EnhancedMarketDataDashboard'));
const MonteCarloIntegrationHub = lazy(() => import('../components/PrivateAnalysis/MonteCarloIntegrationHub'));
const DataExportImport = lazy(() => import('../components/DataExportImport'));
const ContextualInsightsSidebar = lazy(() => import('../components/PrivateAnalysis/ContextualInsightsSidebar'));

const PrivateAnalysis = () => {
  // Redux hooks
  const dispatch = useDispatch();
  const financialData = useSelector(selectFinancialData);
  const _activeModel = useSelector(selectActiveModel);
  const _isDirty = useSelector(state => state.analysis.isDirty);

  // Collaboration hook - disabled during testing to prevent errors
  const isTestEnvironment = typeof window !== 'undefined' && (
    window.navigator?.webdriver === true ||
    window.location?.search?.includes('lhci') ||
    window.location?.search?.includes('ci') ||
    window.location?.search?.includes('audit')
  );

  const {
    isInitialized: isCollabInitialized,
    joinWorkspace
  } = useCollaboration('current-user-id', {
    name: 'Financial Analyst',
    role: 'analyst'
  });

  const [showCollaboration, _setShowCollaboration] = useState(false);
  const workspaceId = 'private-analysis-workspace';

  // Initialize collaboration workspace - skip during testing
  useEffect(() => {
    if (!isTestEnvironment && isCollabInitialized && !showCollaboration) {
      joinWorkspace(workspaceId, {
        name: 'Private Analysis Workspace',
        description: 'Collaborative financial modeling and analysis'
      }).catch(error => {
        console.error('Failed to join workspace:', error);
      });
    }
  }, [isCollabInitialized, workspaceId, joinWorkspace, showCollaboration, isTestEnvironment]);

  // Local state for UI
  const [activeTab, setActiveTab] = useState('spreadsheet');
  const [_showTour, setShowTour] = useState(false);

  // Onboarding and help state
  const [activeHelpPanel, setActiveHelpPanel] = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const quickStartDialogRef = useRef(null);
  const quickStartStartBtnRef = useRef(null);
  const quickStartSkipBtnRef = useRef(null);

  // Existing state management
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-start tour for new users
  useEffect(() => {
    const hasVisited = localStorage.getItem('fa-pro-visited-private-analysis');
    if (!hasVisited && !localStorage.getItem('privateAnalyses')) {
      setShowQuickStart(true);
      localStorage.setItem('fa-pro-visited-private-analysis', 'true');
    }
  }, []);

  // Focus management and keyboard support for Quick Start modal
  useEffect(() => {
    if (!showQuickStart) return;

    // Focus the Start button on open
    quickStartStartBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickStart(false);
        // Return focus to page title after closing
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.focus();
        return;
      }
      if (e.key === 'Tab') {
        const container = quickStartDialogRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickStart]);

  const handleStartTour = () => {
    setShowQuickStart(false);
    setShowTour(true);
    // Return focus to page title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.focus();
  };

  const handleSkipTour = () => {
    setShowQuickStart(false);
    // Return focus to page title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.focus();
  };

  const openHelpPanel = (helpKey) => {
    setActiveHelpPanel(helpKey);
  };

  const closeHelpPanel = () => {
    setActiveHelpPanel(null);
  };

  // Additional state management
  const [advancedResults, setAdvancedResults] = useState({
    lbo: null,
    threeStatement: null,
    scenarios: null,
    marketData: null,
    monteCarlo: null
  });
  const [adjustedValues, setAdjustedValues] = useState({});
  const [modelInputs] = useState({
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

  const saveAnalysis = useCallback(async(name) => {
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
  }, [financialData, adjustedValues, modelInputs, advancedResults, savedAnalyses]);

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

  // Initialize financial data if not already set
  useEffect(() => {
    if (!financialData || Object.keys(financialData).length === 0) {
      dispatch(setFinancialData(defaultFinancialData));
    }
  }, [dispatch, financialData]);

  // Function to handle data changes from components
  const handleDataChange = useCallback((newData, section = 'general') => {
    if (section === 'lbo') {
      dispatch(setLboResults(newData));
    } else if (section === 'threeStatement') {
      dispatch(setThreeStatementResults(newData));
    } else if (section === 'scenarios') {
      dispatch(setMonteCarloResults(newData));
    } else {
      dispatch(setFinancialData({ ...financialData, ...newData }));
    }
  }, [dispatch, financialData]);

  // Status indicator component
  // (Removed unused _WorkflowNavigation component)

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
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 relative">
      <SEOHead
        title="Private Analysis Suite | FinanceAnalyst Pro"
        description="Comprehensive financial analysis platform with advanced modeling tools, scenario analysis, Monte Carlo simulation, and private equity workflows."
        canonical="/private-analysis"
        keywords="private analysis, financial modeling, scenario analysis, Monte Carlo simulation, LBO analysis, private equity tools"
      />
      <Header />

      <main
        id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8" role="main"
        aria-label="Private Analysis Dashboard"
      >
        {/* Header Section */}
        <section className="mb-6 sm:mb-8" aria-labelledby="page-title">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 id="page-title" tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white">Private Analysis</h1>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    dataStatus === 'ready' ? 'bg-green-400' :
                      dataStatus === 'saving' ? 'bg-blue-400' : 'bg-yellow-400'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {dataStatus === 'ready' ? 'Ready' : dataStatus === 'saving' ? 'Saving...' : dataStatus}
                </span>
              </div>

              {lastSaved && (
                <Button
                  onClick={() => saveAnalysis()}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                  variant="primary"
                  size="sm"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Saved</span>
                  <span className="sm:hidden">{lastSaved.toLocaleTimeString()}</span>
                  <span className="hidden sm:inline">{lastSaved.toLocaleTimeString()}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Data Completeness</span>
                <span className="text-sm sm:text-base text-white font-semibold">{getDataCompleteness()}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getDataCompleteness()}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Analysis Progress</span>
                <span className="text-sm sm:text-base text-white font-semibold">{calculateAnalysisProgress()}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${calculateAnalysisProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Start Modal */}
          {showQuickStart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                ref={quickStartDialogRef}
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="quickstart-title"
                aria-describedby="quickstart-desc"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Play className="w-6 h-6 text-blue-600" />
                  <h3 id="quickstart-title" className="text-lg font-semibold text-slate-900">Welcome to Private Analysis</h3>
                </div>
                <p id="quickstart-desc" className="text-slate-700 mb-6">
                  Take a quick tour to learn how to build financial models, run DCF analysis, and export professional reports.
                </p>
                <div className="flex space-x-3">
                  <button
                    ref={quickStartStartBtnRef}
                    onClick={handleStartTour}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    aria-label="Start Tour"
                  >
                    Start Tour
                  </button>
                  <button
                    ref={quickStartSkipBtnRef}
                    onClick={handleSkipTour}
                    className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300"
                    aria-label="Skip"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Secondary Navigation - Analysis Tools */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <SecondaryNav
            variant="horizontal"
            navigation="analysisTools"
            activeItem={activeTab}
            onItemClick={(itemId) => setActiveTab(itemId)}
            className="flex-1"
            data-tour="financial-spreadsheet-tab"
          />

          {/* Help and Tour Controls */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => openHelpPanel(activeTab === 'modeling' ? 'dcf' : activeTab)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Get help with this feature"
              aria-label="Open help panel"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {!localStorage.getItem('privateAnalyses') && (
              <button
                onClick={() => setShowTour(true)}
                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg transition-colors"
                title="Take a guided tour"
                aria-label="Start Private Analysis tour"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Legacy Tab Navigation (keeping as fallback) */}
        <nav className="mb-6 hidden" aria-label="Analysis Tools">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-800 rounded-lg" role="tablist">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800
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
        </nav>

        {/* Main Content Area */}
        <section
          className="relative" role="tabpanel" id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'spreadsheet' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading spreadsheet. Please refresh the page.</div>}>
                <Suspense fallback={<FinancialTableSkeleton rows={12} columns={6} />}>
                  <LoadingWrapper
                    isLoading={isLoading}
                    skeleton={<FinancialTableSkeleton rows={12} columns={6} />}
                  >
                    <FinancialSpreadsheet
                      data={financialData}
                      onDataChange={handleDataChange}
                      onAdjustedValuesChange={setAdjustedValues}
                    />
                  </LoadingWrapper>
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'modeling' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading modeling tools. Please refresh the page.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <ModelingTools
                    data={financialData}
                    adjustedValues={adjustedValues}
                    onDataChange={handleDataChange}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'analysis' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading analysis results. Please check your data and refresh.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <AnalysisResults
                    data={financialData}
                    adjustedValues={adjustedValues}
                    modelInputs={modelInputs}
                    calculateDCF={(data) => calculateDCF(data, modelInputs)}
                    formatCurrency={formatCurrency}
                    formatPercentage={formatPercentage}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'lbo' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading LBO tool. Please check your data.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <AdvancedLBOTool
                    data={financialData}
                    onDataChange={(results) => handleDataChange(results, 'lbo')}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'threestatement' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading financial model workspace.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <FinancialModelWorkspace
                    data={financialData}
                    onDataChange={(results) => handleDataChange(results, 'threeStatement')}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'scenarios' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading scenario analysis.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <EnhancedScenarioAnalysis
                    data={financialData}
                    onDataChange={(results) => handleDataChange(results, 'scenarios')}
                    calculateDCF={(data) => calculateDCF(data, modelInputs)}
                    lboModelingEngine={null}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'marketdata' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading market data dashboard.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <EnhancedMarketDataDashboard
                    data={financialData}
                    onDataChange={(results) => handleDataChange(results, 'marketData')}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'montecarlo' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading Monte Carlo integration.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <MonteCarloIntegrationHub
                    data={financialData}
                    dcfResults={advancedResults.dcf}
                    lboResults={advancedResults.lbo}
                    financialModel={advancedResults.threeStatement}
                    scenarioResults={advancedResults.scenarios}
                    onDataChange={(results) => handleDataChange(results, 'monteCarlo')}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {activeTab === 'import-export' && (
              <ErrorBoundary fallback={<div className="p-8 text-center text-red-400">Error loading import/export tools.</div>}>
                <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
                  <DataExportImport
                    data={financialData}
                    onDataChange={handleDataChange}
                    savedAnalyses={savedAnalyses}
                    onAnalysesChange={setSavedAnalyses}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </motion.div>
          </Suspense>
        </section>

        {/* Contextual Insights Sidebar */}
        <Suspense fallback={null}>
          <ContextualInsightsSidebar
            financialData={financialData}
            currentMetric={currentMetricFocus}
            analysisContext={activeTab === 'analysis' ? 'dcf' : activeTab}
            onInsightClick={handleInsightClick}
            isVisible={insightsSidebarVisible}
            onToggle={toggleInsightsSidebar}
          />
        </Suspense>
      </main>

      {/* Help Panel */}
      <HelpPanel
        helpKey={activeHelpPanel}
        isOpen={!!activeHelpPanel}
        onClose={closeHelpPanel}
      />

      {/* OnboardingTour - temporarily disabled for integration focus */}
      </div>
    </ErrorBoundary>
  );
};

export default PrivateAnalysis;
