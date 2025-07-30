import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Save, 
  Upload, 
  Download, 
  CheckCircle,
  Activity,
  FileText,
  BarChart3,
  AlertCircle,
  Clock,
  Database
} from 'lucide-react';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import FinancialSpreadsheet from '../components/PrivateAnalysis/FinancialSpreadsheet';
import ModelingTools from '../components/PrivateAnalysis/ModelingTools';
import AnalysisResults from '../components/PrivateAnalysis/AnalysisResults';
import WorkflowNavigation from '../components/PrivateAnalysis/WorkflowNavigation';
import defaultFinancialData from '../data/defaultFinancialData';
import { formatCurrency, formatPercentage } from '../utils/dataTransformation';
import { calculateDCF } from '../utils/dcfCalculations';

const PrivateAnalysis = () => {
  const [activeTab, setActiveTab] = useState('data');
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

  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    const saved = localStorage.getItem('privateAnalyses');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState('ready'); // ready, modified, saving, error
  const [, setLastSaved] = useState(null);
  
  // Progress tracking for workflow navigation
  const [modelingProgress, setModelingProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // Enhanced data completeness tracking
  const getDataCompleteness = () => {
    if (!financialData.statements) return 0;
    
    // Core required fields for basic analysis
    const coreIncomeFields = ['totalRevenue', 'totalCostOfGoodsSold', 'operatingIncome', 'netIncome'];
    const optionalBalanceFields = ['totalAssets', 'totalLiabilities', 'totalEquity'];
    const optionalCashFlowFields = ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow'];
    
    let completedFields = 0;
    let totalWeightedFields = 0;
    
    // Check core income statement fields (weighted more heavily)
    coreIncomeFields.forEach(field => {
      totalWeightedFields += 3; // Weight core fields 3x
      if (financialData.statements.incomeStatement?.[field]?.[2] !== undefined) {
        completedFields += 3;
      }
    });
    
    // Check for any revenue line items to boost completeness
    const revenueFields = ['energyDevices', 'injectables', 'wellness', 'weightloss', 'retailSales', 'surgery'];
    let revenueItemsFound = 0;
    revenueFields.forEach(field => {
      if (financialData.statements.incomeStatement?.[field]?.[2] !== undefined) {
        revenueItemsFound++;
      }
    });
    
    // Add bonus for detailed revenue breakdown
    if (revenueItemsFound >= 3) {
      completedFields += 2;
      totalWeightedFields += 2;
    }
    
    // Check optional balance sheet fields (lower weight)
    optionalBalanceFields.forEach(field => {
      totalWeightedFields += 1;
      if (financialData.statements.balanceSheet?.[field]?.[2] !== undefined) {
        completedFields += 1;
      }
    });
    
    // Check optional cash flow statement fields (lower weight)
    optionalCashFlowFields.forEach(field => {
      totalWeightedFields += 1;
      if (financialData.statements.cashFlowStatement?.[field]?.[2] !== undefined) {
        completedFields += 1;
      }
    });
    
    // Calculate completion percentage with minimum threshold for income statement
    const completionPercentage = Math.round((completedFields / totalWeightedFields) * 100);
    
    // If we have core income statement data, ensure minimum 80% completion
    const hasBasicIncomeData = financialData.statements.incomeStatement?.totalRevenue?.[2] !== undefined &&
                              financialData.statements.incomeStatement?.operatingIncome?.[2] !== undefined;
    
    return hasBasicIncomeData ? Math.max(completionPercentage, 80) : completionPercentage;
  };

  // Calculate modeling progress based on configured models and assumptions
  const calculateModelingProgress = () => {
    let progress = 0;
    
    // DCF Model completion - give credit for having basic parameters
    if (modelInputs.dcf.discountRate && modelInputs.dcf.terminalGrowthRate) {
      progress += 40;
    }
    
    // Additional credit for comprehensive financial data enabling modeling
    const dataCompleteness = getDataCompleteness();
    if (dataCompleteness >= 80) {
      progress += 20; // Comprehensive data enables modeling
    }
    
    // Scenario analysis completion
    if (modelInputs.scenario.scenarios && modelInputs.scenario.scenarios.length > 0) {
      progress += 20;
    }
    
    // Adjusted values completion
    if (adjustedValues && Object.keys(adjustedValues).length > 0) {
      progress += 20;
    }
    
    return Math.min(progress, 100);
  };

  // Calculate analysis progress based on generated results
  const calculateAnalysisProgress = () => {
    let progress = 0;
    
    // Basic progress based on data and modeling completion
    const dataComplete = getDataCompleteness();
    const modelingComplete = calculateModelingProgress();
    
    if (dataComplete > 50 && modelingComplete > 30) {
      progress = 60; // Base analysis available
    }
    
    if (dataComplete > 80 && modelingComplete > 60) {
      progress = 100; // Complete analysis available
    }
    
    return progress;
  };

  const saveAnalysis = async (name) => {
    if (!name) return;
    
    setIsLoading(true);
    setDataStatus('saving');
    
    try {
      const analysis = {
        id: Date.now(),
        name,
        data: financialData,
        adjustedValues,
        modelInputs,
        completeness: getDataCompleteness(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      const updated = [...savedAnalyses, analysis];
      setSavedAnalyses(updated);
      localStorage.setItem('privateAnalyses', JSON.stringify(updated));
      
      setDataStatus('ready');
      setLastSaved(new Date());
    } catch (error) {
      setDataStatus('error');
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalysis = (analysisId) => {
    const analysis = savedAnalyses.find(a => a.id === analysisId);
    if (analysis) {
      setFinancialData(analysis.data);
      setAdjustedValues(analysis.adjustedValues || {});
      setModelInputs(analysis.modelInputs || modelInputs);
      setDataStatus('ready');
    }
  };

  const deleteAnalysis = (analysisId) => {
    const updated = savedAnalyses.filter(a => a.id !== analysisId);
    setSavedAnalyses(updated);
    localStorage.setItem('privateAnalyses', JSON.stringify(updated));
  };

  // Map activeTab values to new workflow step IDs
  const mapTabToStep = (tab) => {
    switch (tab) {
      case 'data':
      case 'spreadsheet':
        return 'data';
      case 'modeling':
        return 'modeling';
      case 'analysis':
        return 'analysis';
      default:
        return 'data';
    }
  };

  const handleStepChange = (stepId) => {
    // Map new step IDs back to tab values for compatibility
    switch (stepId) {
      case 'data':
        setActiveTab('spreadsheet');
        break;
      case 'modeling':
        setActiveTab('modeling');
        break;
      case 'analysis':
        setActiveTab('analysis');
        break;
      default:
        setActiveTab('spreadsheet');
    }
  };

  const handleSave = () => {
    const name = prompt('Enter analysis name:');
    if (name) saveAnalysis(name);
  };

  const handleImport = () => {
    // Import data logic - placeholder
    console.log('Import functionality to be implemented');
  };

  const handleExport = () => {
    // Export analysis logic - placeholder
    console.log('Export functionality to be implemented');
  };

  // Validate data and track errors for workflow navigation
  const validateWorkflowData = () => {
    const errors = {};
    
    // Data validation
    const dataErrors = [];
    if (!financialData.statements) {
      dataErrors.push('No financial statements found');
    } else {
      if (!financialData.statements.incomeStatement?.totalRevenue) {
        dataErrors.push('Missing revenue data');
      }
      if (!financialData.statements.balanceSheet?.totalAssets) {
        dataErrors.push('Missing balance sheet data');
      }
      if (!financialData.statements.cashFlowStatement?.operatingCashFlow) {
        dataErrors.push('Missing cash flow data');
      }
    }
    if (dataErrors.length > 0) errors.data = dataErrors;
    
    // Modeling validation
    const modelingErrors = [];
    if (!modelInputs.dcf.discountRate || modelInputs.dcf.discountRate <= 0) {
      modelingErrors.push('Invalid discount rate');
    }
    if (!modelInputs.dcf.terminalGrowthRate || modelInputs.dcf.terminalGrowthRate < 0) {
      modelingErrors.push('Invalid terminal growth rate');
    }
    if (modelingErrors.length > 0) errors.modeling = modelingErrors;
    
    // Analysis validation
    const analysisErrors = [];
    const dataComplete = getDataCompleteness();
    const modelingComplete = calculateModelingProgress();
    if (dataComplete < 50) {
      analysisErrors.push('Insufficient data for analysis');
    }
    if (modelingComplete < 30) {
      analysisErrors.push('Models not configured');
    }
    if (analysisErrors.length > 0) errors.analysis = analysisErrors;
    
    return errors;
  };

  // Track data modifications and update progress
  useEffect(() => {
    setDataStatus('modified');
    setModelingProgress(calculateModelingProgress());
    setAnalysisProgress(calculateAnalysisProgress());
    setValidationErrors(validateWorkflowData());
  }, [financialData, adjustedValues, modelInputs]);

  // Status indicators
  const StatusIndicator = ({ status, label }) => {
    const statusConfig = {
      ready: { color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle },
      modified: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
      saving: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Activity },
      error: { color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
        <Icon size={14} className={config.color} />
        <span className={`text-sm ${config.color}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      
      {/* Main Workspace Container */}
      <div className="flex flex-col min-h-screen pt-16">
        
        {/* Enhanced Header Section */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
          <div className="px-8 py-6">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText size={24} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">Private Analysis</h1>
                  <p className="text-sm text-slate-400 mt-1">Professional financial modeling and valuation</p>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex items-center gap-4">
                <StatusIndicator 
                  status={dataStatus} 
                  label={
                    dataStatus === 'ready' ? 'Data Ready' :
                    dataStatus === 'modified' ? 'Unsaved Changes' :
                    dataStatus === 'saving' ? 'Saving...' :
                    'Error'
                  } 
                />
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500"
                  >
                    <Save size={16} />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImport}
                    className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500"
                  >
                    <Upload size={16} />
                    Import
                  </Button>
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={handleExport}
                    className="text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500"
                  >
                    <Download size={16} />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Workflow Navigation */}
            <WorkflowNavigation
              activeStep={mapTabToStep(activeTab)}
              onStepChange={handleStepChange}
              dataCompleteness={getDataCompleteness()}
              modelingProgress={modelingProgress}
              analysisProgress={analysisProgress}
              validationErrors={validationErrors}
            />
          </div>
        </div>

        {/* Saved Analyses Panel */}
        <AnimatePresence>
          {savedAnalyses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-800/50 border-b border-slate-700/50 px-8 py-4"
            >
              <div className="flex items-center gap-4 mb-3">
                <Database size={16} className="text-slate-400" />
                <h3 className="text-sm font-medium text-slate-300">Recent Analyses</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                {savedAnalyses.slice(-5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <button
                      onClick={() => loadAnalysis(analysis.id)}
                      className="text-slate-200 hover:text-white font-medium text-sm"
                    >
                      {analysis.name}
                    </button>
                    <div className="w-px h-4 bg-slate-600" />
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-900 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-full"
          >
            {activeTab === 'spreadsheet' && (
              <FinancialSpreadsheet
                data={financialData}
                onDataChange={setFinancialData}
                onAdjustedValuesChange={setAdjustedValues}
              />
            )}
            
            {activeTab === 'modeling' && (
              <ModelingTools
                data={financialData}
                adjustedValues={adjustedValues}
                onDataChange={setFinancialData}
              />
            )}
            
            {activeTab === 'analysis' && (
              <AnalysisResults
                data={financialData}
                adjustedValues={adjustedValues}
                modelInputs={modelInputs}
                calculateDCF={(data) => calculateDCF(data, modelInputs)}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PrivateAnalysis;
