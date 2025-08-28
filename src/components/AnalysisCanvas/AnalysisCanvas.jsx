import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Minimize2, Calculator, Target, Search, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';

import { calculateEnhancedDCF } from '../../utils/dcfCalculations';

import AnalysisModule from './AnalysisModule';
import CompanyOverview from './CompanyOverview';
import CompanySelector from './CompanySelector';

// Spring-based animation configuration for organic feel
const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

const AnalysisCanvas = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeModules, setActiveModules] = useState([]);
  const [canvasMode, setCanvasMode] = useState('overview'); // 'overview', 'analysis', 'focused'
  const [focusedModule, setFocusedModule] = useState(null);

  // Company data state with intelligent defaults
  const [_companyData, _setCompanyData] = useState({
    profile: null,
    financials: null,
    marketData: null,
    consensus: null
  });

  // Analysis state
  const [analysisInputs, setAnalysisInputs] = useState({
    dcf: {
      currentRevenue: 0,
      projectionYears: 5,
      terminalGrowthRate: 0.025,
      discountRate: 0.12,
      yearlyData: {},
      balanceSheet: {}
    }
  });

  const [analysisResults, setAnalysisResults] = useState({});

  // Available analysis modules
  const availableModules = [
    {
      id: 'dcf',
      name: 'DCF Analysis',
      icon: Calculator,
      description: 'Discounted Cash Flow valuation',
      color: 'blue',
      isPrimary: true
    },
    {
      id: 'comparables',
      name: 'Comparable Analysis',
      icon: BarChart3,
      description: 'Peer comparison analysis',
      color: 'green',
      isPrimary: true
    },
    {
      id: 'lbo',
      name: 'LBO Analysis',
      icon: Target,
      description: 'Leveraged buyout modeling',
      color: 'purple',
      isPrimary: false
    }
  ];

  // Handle company selection with intelligent data population
  const handleCompanySelect = useCallback(async company => {
    setSelectedCompany(company);
    setCanvasMode('analysis');

    // Populate with intelligent defaults based on company data
    if (company.financials?.revenue) {
      const latestRevenue = company.financials.revenue[company.financials.revenue.length - 1];
      const growthRates = calculateHistoricalGrowthRates(company.financials.revenue);

      setAnalysisInputs(prev => ({
        ...prev,
        dcf: {
          ...prev.dcf,
          currentRevenue: latestRevenue,
          yearlyData: generateIntelligentDefaults(growthRates, company.sector)
        }
      }));
    }

    // Auto-activate primary modules
    setActiveModules(['dcf']);
  }, []);

  // Calculate historical growth rates for intelligent defaults
  const calculateHistoricalGrowthRates = revenueData => {
    if (!revenueData || revenueData.length < 2) return [];

    const growthRates = [];
    for (let i = 1; i < revenueData.length; i++) {
      const growth = ((revenueData[i] - revenueData[i - 1]) / revenueData[i - 1]) * 100;
      growthRates.push(growth);
    }

    return growthRates;
  };

  // Generate intelligent defaults based on historical data and sector
  const generateIntelligentDefaults = (historicalGrowth, sector) => {
    const avgGrowth =
      historicalGrowth.length > 0
        ? historicalGrowth.reduce((a, b) => a + b, 0) / historicalGrowth.length
        : 10;

    const sectorDefaults = getSectorDefaults(sector);

    const yearlyData = {};
    for (let year = 1; year <= 5; year++) {
      // Declining growth model
      const yearGrowth = Math.max(
        avgGrowth * (1 - (year - 1) * 0.1),
        sectorDefaults.terminalGrowth
      );

      yearlyData[year] = {
        revenueGrowth: yearGrowth,
        ebitdaMargin: sectorDefaults.ebitdaMargin,
        taxRate: sectorDefaults.taxRate,
        capexPercent: sectorDefaults.capexPercent,
        daPercent: sectorDefaults.daPercent,
        workingCapitalChange: sectorDefaults.workingCapitalChange
      };
    }

    return yearlyData;
  };

  // Sector-specific defaults
  const getSectorDefaults = sector => {
    const defaults = {
      Technology: {
        ebitdaMargin: 25,
        taxRate: 21,
        capexPercent: 3,
        daPercent: 5,
        workingCapitalChange: 1,
        terminalGrowth: 3
      },
      Healthcare: {
        ebitdaMargin: 20,
        taxRate: 25,
        capexPercent: 4,
        daPercent: 4,
        workingCapitalChange: 2,
        terminalGrowth: 2.5
      },
      default: {
        ebitdaMargin: 18,
        taxRate: 25,
        capexPercent: 5,
        daPercent: 4,
        workingCapitalChange: 2,
        terminalGrowth: 2.5
      }
    };

    return defaults[sector] || defaults.default;
  };

  // Add analysis module to canvas
  const addModule = moduleId => {
    if (!activeModules.includes(moduleId)) {
      setActiveModules(prev => [...prev, moduleId]);
    }
  };

  // Remove module from canvas
  const removeModule = moduleId => {
    setActiveModules(prev => prev.filter(id => id !== moduleId));
    if (focusedModule === moduleId) {
      setFocusedModule(null);
      setCanvasMode('analysis');
    }
  };

  // Focus on specific module
  const focusModule = moduleId => {
    setFocusedModule(moduleId);
    setCanvasMode('focused');
  };

  // Update analysis inputs with real-time calculation
  const updateAnalysisInputs = useCallback(
    (moduleId, newInputs) => {
      setAnalysisInputs(prev => ({
        ...prev,
        [moduleId]: { ...prev[moduleId], ...newInputs }
      }));

      // Trigger real-time calculation
      if (moduleId === 'dcf') {
        const results = calculateEnhancedDCF({ ...analysisInputs.dcf, ...newInputs });
        setAnalysisResults(prev => ({ ...prev, dcf: results }));
      }
    },
    [analysisInputs]
  );

  // Canvas layout variants
  const canvasVariants = {
    overview: {
      scale: 1,
      y: 0,
      transition: springConfig
    },
    analysis: {
      scale: 1,
      y: 0,
      transition: springConfig
    },
    focused: {
      scale: 1.02,
      y: -20,
      transition: springConfig
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Minimal Header - Deference to Content */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {selectedCompany ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setSelectedCompany(null);
                    setCanvasMode('overview');
                    setActiveModules([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Minimize2 size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-light text-gray-900">{selectedCompany.name}</h1>
                  <p className="text-sm text-gray-500">
                    {selectedCompany.sector} • {selectedCompany.ticker}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-light text-gray-900">Analysis Canvas</h1>
            )}

            {/* Canvas Mode Controls */}
            {selectedCompany && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCanvasMode('analysis')}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    canvasMode === 'analysis'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analysis
                </button>
                {focusedModule && (
                  <button
                    onClick={() => setCanvasMode('focused')}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      canvasMode === 'focused'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Focus
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <motion.div
        variants={canvasVariants}
        animate={canvasMode}
        className="max-w-7xl mx-auto px-6 py-8"
      >
        <AnimatePresence mode="wait">
          {!selectedCompany ? (
            /* Company Selection State */
            <motion.div
              key="company-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springConfig}
              className="text-center py-12"
            >
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-light text-gray-900 mb-3">Begin Your Analysis</h2>
                  <p className="text-lg text-gray-600">
                    Select a company to start building your financial model
                  </p>
                </div>

                <CompanySelector onCompanySelect={handleCompanySelect} />
              </div>
            </motion.div>
          ) : canvasMode === 'focused' && focusedModule ? (
            /* Focused Module State */
            <motion.div
              key="focused-module"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springConfig}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCanvasMode('analysis')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h2 className="text-2xl font-light text-gray-900">
                    {availableModules.find(m => m.id === focusedModule)?.name}
                  </h2>
                </div>
                <button
                  onClick={() => removeModule(focusedModule)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>

              <AnalysisModule
                moduleId={focusedModule}
                companyData={selectedCompany}
                inputs={analysisInputs[focusedModule]}
                results={analysisResults[focusedModule]}
                onInputChange={newInputs => updateAnalysisInputs(focusedModule, newInputs)}
                isFullscreen={true}
              />
            </motion.div>
          ) : (
            /* Analysis Canvas State */
            <motion.div
              key="analysis-canvas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springConfig}
              className="space-y-8"
            >
              {/* Company Overview Section */}
              <CompanyOverview company={selectedCompany} compact={activeModules.length > 0} />

              {/* Analysis Modules Grid */}
              {activeModules.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeModules.map(moduleId => (
                    <motion.div
                      key={moduleId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={springConfig}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      <AnalysisModule
                        moduleId={moduleId}
                        companyData={selectedCompany}
                        inputs={analysisInputs[moduleId]}
                        results={analysisResults[moduleId]}
                        onInputChange={newInputs => updateAnalysisInputs(moduleId, newInputs)}
                        onFocus={() => focusModule(moduleId)}
                        onRemove={() => removeModule(moduleId)}
                        isCompact={true}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Available Modules */}
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Analysis Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableModules
                    .filter(module => !activeModules.includes(module.id))
                    .map(module => {
                      const Icon = module.icon;
                      return (
                        <motion.button
                          key={module.id}
                          onClick={() => addModule(module.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 text-left group"
                        >
                          <div
                            className={`inline-flex items-center justify-center w-12 h-12 bg-${module.color}-50 rounded-lg mb-3 group-hover:bg-${module.color}-100 transition-colors`}
                          >
                            <Icon className={`w-6 h-6 text-${module.color}-600`} />
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{module.name}</h4>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AnalysisCanvas;
