import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, BarChart3, Activity, DollarSign, Users, Zap } from 'lucide-react';
import ScenarioModeling from './ScenarioModeling.jsx';
import SensitivityAnalysis from './SensitivityAnalysis.jsx';
import AdvancedDCF from './AdvancedDCF.jsx';
import ComparableAnalysis from './ComparableAnalysis.jsx';
import MonteCarloSimulation from './MonteCarloSimulation.jsx';
import styles from './styles.module.css';

const ModelingTools = ({ data, onDataChange }) => {
  const [activeModel, setActiveModel] = useState('dcf');
  const [modelInputs, setModelInputs] = useState({
    dcf: {
      discountRate: 10,
      terminalGrowthRate: 2.5,
      projectionYears: 5,
      terminalValueMultiple: 10,
      taxRate: 25,
      sharesOutstanding: 1000,
      workingCapital: {
        receivablesDays: 45,
        inventoryDays: 60,
        payablesDays: 30,
        receivablesGrowth: 2,
        inventoryGrowth: 1.5,
        payablesGrowth: 1.8
      },
      capex: {
        capexAsPercentOfRevenue: 3.5,
        depreciationRate: 7,
        maintenanceCapex: 2.0
      }
    },
    ratios: {
      compareToIndustry: true,
      industryAverages: {
        grossMargin: 45,
        operatingMargin: 15,
        netMargin: 8,
        currentRatio: 2.1,
        debtToEquity: 0.5
      }
    },
    sensitivity: {
      variables: ['revenue', 'grossMargin', 'discountRate'],
      ranges: {
        revenue: { min: -20, max: 20 },
        grossMargin: { min: -5, max: 5 },
        discountRate: { min: 8, max: 15 }
      }
    },
    scenario: {
      scenarios: [
        { name: 'Base Case', probability: 50, revenueGrowth: 15, marginImprovement: 0 },
        { name: 'Bull Case', probability: 25, revenueGrowth: 25, marginImprovement: 2 },
        { name: 'Bear Case', probability: 25, revenueGrowth: 5, marginImprovement: -2 }
      ]
    }
  });

  // Calculate financial metrics from the spreadsheet data
  const calculatedMetrics = useMemo(() => {
    const statements = data.statements.incomeStatement;
    const periods = data.periods;
    
    const metrics = {
      revenue: [],
      grossProfit: [],
      operatingIncome: [],
      margins: {
        gross: [],
        operating: [],
        net: []
      },
      growth: {
        revenue: [],
        operating: []
      }
    };

    periods.forEach((_, index) => {
      // Revenue metrics
      const revenue = statements.totalRevenue?.[index] || 0;
      const grossProfit = revenue - (statements.totalCOGS?.[index] || 0);
      const operatingIncome = statements.operatingIncome?.[index] || 0;
      
      metrics.revenue.push(revenue);
      metrics.grossProfit.push(grossProfit);
      metrics.operatingIncome.push(operatingIncome);
      
      // Margin calculations
      metrics.margins.gross.push(revenue ? (grossProfit / revenue) * 100 : 0);
      metrics.margins.operating.push(revenue ? (operatingIncome / revenue) * 100 : 0);
      
      // Growth calculations
      if (index > 0) {
        const prevRevenue = statements.totalRevenue?.[index - 1] || 0;
        const prevOperating = statements.operatingIncome?.[index - 1] || 0;
        
        metrics.growth.revenue.push(prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0);
        metrics.growth.operating.push(prevOperating ? ((operatingIncome - prevOperating) / prevOperating) * 100 : 0);
      }
    });

    return metrics;
  }, [data]);

  // DCF Calculation - Enhanced to work with scenario data
  const calculateDCF = (inputData = null) => {
    const { discountRate, terminalGrowthRate, projectionYears, taxRate } = modelInputs.dcf;
    const sourceData = inputData || data;
    
    // Use either scenario data or calculated metrics
    let operatingIncomes;
    if (inputData) {
      // For scenario data, extract operating incomes directly
      operatingIncomes = [];
      sourceData.periods.forEach((_, index) => {
        if (index > 0 && index <= projectionYears) {
          operatingIncomes.push(sourceData.statements.incomeStatement.operatingIncome?.[index] || 0);
        }
      });
    } else {
      // For regular calculation, use calculated metrics
      operatingIncomes = calculatedMetrics.operatingIncome.slice(1, projectionYears + 1);
    }
    
    if (operatingIncomes.length === 0) return { enterpriseValue: 0, equityValue: 0, sharePrice: 0 };

    let presentValue = 0;
    const discountFactor = 1 + (discountRate / 100);

    // Calculate present value of cash flows
    operatingIncomes.forEach((income, index) => {
      const afterTaxIncome = income * (1 - taxRate / 100);
      const pv = afterTaxIncome / Math.pow(discountFactor, index + 1);
      presentValue += pv;
    });

    // Terminal value
    const lastYearIncome = operatingIncomes[operatingIncomes.length - 1] || 0;
    const terminalCashFlow = lastYearIncome * (1 + terminalGrowthRate / 100) * (1 - taxRate / 100);
    const terminalValue = terminalCashFlow / ((discountRate - terminalGrowthRate) / 100);
    const presentTerminalValue = terminalValue / Math.pow(discountFactor, projectionYears);

    const enterpriseValue = presentValue + presentTerminalValue;
    
    return {
      enterpriseValue,
      equityValue: enterpriseValue, // Simplified - would subtract net debt
      presentValueOperations: presentValue,
      presentValueTerminal: presentTerminalValue,
      terminalValue
    };
  };

  const dcfResults = calculateDCF();

  const modelTypes = [
    { id: 'dcf', label: 'DCF Valuation', icon: DollarSign, description: 'Discounted Cash Flow analysis' },
    { id: 'ratios', label: 'Ratio Analysis', icon: BarChart3, description: 'Financial ratio comparison' },
    { id: 'sensitivity', label: 'Sensitivity Analysis', icon: Activity, description: 'Variable impact analysis' },
    { id: 'scenario', label: 'Scenario Modeling', icon: Target, description: 'Multi-scenario projections' },
    { id: 'comparable', label: 'Comparable Analysis', icon: Users, description: 'Market-based valuation' },
    { id: 'montecarlo', label: 'Monte Carlo', icon: Zap, description: 'Probabilistic risk analysis' }
  ];

  const updateModelInput = (modelType, field, value) => {
    setModelInputs(prev => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        [field]: value
      }
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value * 1000); // Convert from thousands
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles.modelingContainer}>
      <div className={styles.modelingHeader}>
        <h2 className={styles.modelingTitle}>Financial Modeling Tools</h2>
        <div className={styles.modelingDescription}>
          Build sophisticated models from your spreadsheet data
        </div>
      </div>

      {/* Model Type Selection */}
      <div className={styles.modelSelector}>
        {modelTypes.map((model) => {
          const Icon = model.icon;
          return (
            <motion.button
              key={model.id}
              onClick={() => setActiveModel(model.id)}
              className={`${styles.modelButton} ${
                activeModel === model.id ? styles.active : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={24} className="mx-auto mb-2" />
              <h3>{model.label}</h3>
              <p>{model.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Model Content */}
      <div className={styles.modelContent}>
        {activeModel === 'dcf' && (
          <AdvancedDCF
            data={data}
            modelInputs={modelInputs}
            onModelInputChange={updateModelInput}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}

        {activeModel === 'ratios' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Financial Ratio Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profitability Ratios */}
              <div>
                <h4 className="font-semibold mb-3">Profitability Ratios</h4>
                <div className="space-y-3">
                  {calculatedMetrics.margins.gross.map((margin, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{data.periods[index + 1]} Gross Margin:</span>
                      <span className="font-medium">{formatPercent(margin)}</span>
                    </div>
                  ))}
                  {calculatedMetrics.margins.operating.map((margin, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{data.periods[index + 1]} Operating Margin:</span>
                      <span className="font-medium">{formatPercent(margin)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Ratios */}
              <div>
                <h4 className="font-semibold mb-3">Growth Rates</h4>
                <div className="space-y-3">
                  {calculatedMetrics.growth.revenue.map((growth, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{data.periods[index + 1]} Revenue Growth:</span>
                      <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(growth)}
                      </span>
                    </div>
                  ))}
                  {calculatedMetrics.growth.operating.map((growth, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{data.periods[index + 1]} Operating Growth:</span>
                      <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(growth)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industry Comparison */}
              <div>
                <h4 className="font-semibold mb-3">Industry Comparison</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Industry Avg</div>
                    <div className="text-sm">Gross Margin: {formatPercent(modelInputs.ratios.industryAverages.grossMargin)}</div>
                    <div className="text-sm">Operating Margin: {formatPercent(modelInputs.ratios.industryAverages.operatingMargin)}</div>
                    <div className="text-sm">Net Margin: {formatPercent(modelInputs.ratios.industryAverages.netMargin)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModel === 'sensitivity' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity size={20} />
              Sensitivity Analysis
            </h3>
            
            <SensitivityAnalysis
              data={data}
              modelInputs={modelInputs}
              onModelInputChange={updateModelInput}
              calculateDCF={calculateDCF}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </div>
        )}

        {activeModel === 'scenario' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target size={20} />
              Scenario Modeling
            </h3>
            
            <ScenarioModeling
              data={data}
              modelInputs={modelInputs}
              onModelInputChange={updateModelInput}
              calculateDCF={calculateDCF}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </div>
        )}

        {activeModel === 'comparable' && (
          <div className="p-6">
            <ComparableAnalysis
              data={data}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </div>
        )}

        {activeModel === 'montecarlo' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap size={20} />
              Monte Carlo Simulation
            </h3>
            
            <MonteCarloSimulation
              data={data}
              onDataChange={onDataChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelingTools;
