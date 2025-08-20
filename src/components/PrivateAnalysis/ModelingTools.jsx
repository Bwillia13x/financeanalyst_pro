import {
  DollarSign,
  Target,
  Activity,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import AdvancedDCF from './AdvancedDCF.jsx';
import ComparableAnalysis from './ComparableAnalysis.jsx';
import MonteCarloSimulation from './MonteCarloSimulation.jsx';
import ScenarioModeling from './ScenarioModeling.jsx';
import SensitivityAnalysis from './SensitivityAnalysis.jsx';

// Add contextual integration points for Advanced Analytics
const AdvancedAnalyticsIntegration = ({ onOpenOptions, onOpenBonds, onOpenCredit }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <h4 className="font-semibold text-blue-900 mb-2">Advanced Analytics Tools</h4>
    <p className="text-sm text-blue-700 mb-3">
      Send your current analysis assumptions to advanced pricing models:
    </p>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onOpenOptions}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        Options Pricer
      </button>
      <button
        onClick={onOpenBonds}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        Bond Analytics
      </button>
      <button
        onClick={onOpenCredit}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        Credit Modeling
      </button>
    </div>
  </div>
);

const ModelingTools = ({ data, adjustedValues, onDataChange }) => {
  const [activeModel, setActiveModel] = useState('dcf');

  // Handlers for Advanced Analytics integration
  const handleOpenOptions = () => {
    window.dispatchEvent(new CustomEvent('open-options-pricer'));
  };

  const handleOpenBonds = () => {
    window.dispatchEvent(new CustomEvent('open-bond-analytics'));
  };

  const handleOpenCredit = () => {
    window.dispatchEvent(new CustomEvent('open-credit-modeling'));
  };
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
      // Revenue metrics - Use adjusted values for latest period when available
      const isLatestPeriod = index === periods.length - 1;
      const revenue = isLatestPeriod && adjustedValues?.totalRevenue
        ? adjustedValues.totalRevenue
        : statements.totalRevenue?.[index] || 0;
      const totalCOGS = isLatestPeriod && adjustedValues?.totalCostOfGoodsSold
        ? adjustedValues.totalCostOfGoodsSold
        : statements.totalCostOfGoodsSold?.[index] || 0;
      const grossProfit = isLatestPeriod && adjustedValues?.grossProfit
        ? adjustedValues.grossProfit
        : statements.grossProfit?.[index] || (revenue - totalCOGS);
      const operatingIncome = isLatestPeriod && adjustedValues?.operatingIncome
        ? adjustedValues.operatingIncome
        : statements.operatingIncome?.[index] || 0;

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

  const _dcfResults = calculateDCF();

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
    <div className="h-full bg-gray-900 text-white p-6">
      {/* Advanced Analytics Integration */}
      <AdvancedAnalyticsIntegration 
        onOpenOptions={handleOpenOptions}
        onOpenBonds={handleOpenBonds}
        onOpenCredit={handleOpenCredit}
      />

      {/* Streamlined Model Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Financial Modeling</h2>
            <p className="text-gray-400 text-sm mt-1">Select a modeling approach to analyze your financial data</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {modelTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveModel(type.id)}
                className={`${
                  activeModel === type.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white hover:border-gray-600'
                } flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200`}
              >
                <Icon size={18} className={activeModel === type.id ? 'text-white' : 'text-blue-400'} />
                <span className="font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Model Description */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {React.createElement(modelTypes.find(t => t.id === activeModel)?.icon, {
              size: 20,
              className: 'text-blue-400'
            })}
            <div>
              <h3 className="font-medium text-white">
                {modelTypes.find(t => t.id === activeModel)?.label}
              </h3>
              <p className="text-gray-400 text-sm">
                {modelTypes.find(t => t.id === activeModel)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Content */}
      <div>
        {activeModel === 'dcf' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <DollarSign size={20} className="text-blue-400" />
              DCF Valuation Model
            </h3>

            <AdvancedDCF
              data={data}
              modelInputs={modelInputs}
              onModelInputChange={updateModelInput}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          </div>
        )}

        {activeModel === 'ratios' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <BarChart3 size={20} />
              Financial Ratio Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profitability Ratios */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-200">Profitability Ratios</h4>
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
                <h4 className="font-semibold mb-3 text-gray-200">Growth Rates</h4>
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
                <h4 className="font-semibold mb-3 text-gray-200">Industry Comparison</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Industry Avg</div>
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
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
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
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
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
