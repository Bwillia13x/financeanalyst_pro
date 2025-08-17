import React, { useState, useEffect, useCallback, useRef } from 'react';

import reactiveCalculationEngine from '../../services/reactiveCalculationEngine';
import realTimeDataService from '../../services/realTimeDataService';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';

import DynamicTimePeriodControl from './DynamicTimePeriodControl';


const LivingModelDCF = ({ symbol, onBack }) => {
  const [modelId] = useState(`dcf_${Date.now()}`);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const modelRef = useRef(null);

  // Model inputs with reactive updates
  const [inputs, setInputs] = useState({
    currentRevenue: 10000000000, // $10B
    projectionYears: 5,
    terminalGrowthRate: 0.025,
    discountRate: 0.12,
    symbol: symbol || 'AAPL',
    trackRealTime: true,
    yearlyData: {
      1: { revenueGrowth: 15, ebitdaMargin: 25, taxRate: 25, capexPercent: 4, daPercent: 3, workingCapitalChange: 2 },
      2: { revenueGrowth: 12, ebitdaMargin: 24, taxRate: 25, capexPercent: 4, daPercent: 3, workingCapitalChange: 2 },
      3: { revenueGrowth: 10, ebitdaMargin: 23, taxRate: 25, capexPercent: 3, daPercent: 3, workingCapitalChange: 1 },
      4: { revenueGrowth: 8, ebitdaMargin: 22, taxRate: 25, capexPercent: 3, daPercent: 3, workingCapitalChange: 1 },
      5: { revenueGrowth: 6, ebitdaMargin: 21, taxRate: 25, capexPercent: 3, daPercent: 3, workingCapitalChange: 1 }
    },
    balanceSheet: {
      cash: 100000000,
      totalDebt: 50000000,
      sharesOutstanding: 1000000000
    }
  });

  // Initialize the reactive model
  useEffect(() => {
    const model = reactiveCalculationEngine.createReactiveModel(
      modelId,
      'dcf',
      inputs,
      (newResult, newInputs, calcError) => {
        setResult(newResult);
        setError(calcError);
        setLastUpdateTime(new Date());
        setIsLoading(false);
      }
    );

    modelRef.current = model;

    // Setup real-time data feeds if enabled
    if (inputs.trackRealTime && inputs.symbol) {
      model.addDependency('stock_price', inputs.symbol);
      model.addDependency('interest_rates', 'USD_10Y');
      model.addDependency('bond_yields', 'US10Y');
    }

    return () => {
      if (modelRef.current) {
        modelRef.current.destroy();
      }
    };
  }, [modelId]);

  // Subscribe to real-time data for display
  useEffect(() => {
    if (!inputs.trackRealTime || !inputs.symbol) return;

    const subscriptions = [
      { dataType: 'stock_price', symbol: inputs.symbol },
      { dataType: 'interest_rates', symbol: 'USD_10Y' },
      { dataType: 'bond_yields', symbol: 'US10Y' },
      { dataType: 'volatility_index', symbol: 'VIX' }
    ];

    const unsubscribe = realTimeDataService.subscribeMultiple(
      subscriptions.map(({ dataType, symbol }) => ({
        dataType,
        symbol,
        callback: (data) => {
          setRealTimeData(prev => ({
            ...prev,
            [`${dataType}_${symbol}`]: data
          }));
        }
      }))
    );

    return unsubscribe;
  }, [inputs.trackRealTime, inputs.symbol]);

  // Handle input changes with instant recalculation
  const updateInput = useCallback((path, value) => {
    setIsLoading(true);
    if (modelRef.current) {
      modelRef.current.updateInput(path, value);
    }

    setInputs(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }, []);

  const updateYearlyData = useCallback((year, field, value) => {
    updateInput(`yearlyData.${year}.${field}`, parseFloat(value) || 0);
  }, [updateInput]);

  const handleProjectionYearsChange = useCallback((newYears) => {
    updateInput('projectionYears', newYears);

    // Extend or trim yearly data
    setInputs(prev => {
      const updated = { ...prev };
      updated.projectionYears = newYears;

      // Add new years with reasonable defaults
      for (let year = Object.keys(prev.yearlyData).length + 1; year <= newYears; year++) {
        if (!updated.yearlyData[year]) {
          const prevYear = updated.yearlyData[year - 1] || updated.yearlyData[Object.keys(updated.yearlyData).pop()];
          updated.yearlyData[year] = {
            revenueGrowth: Math.max(2, (prevYear?.revenueGrowth || 10) - 2),
            ebitdaMargin: prevYear?.ebitdaMargin || 20,
            taxRate: prevYear?.taxRate || 25,
            capexPercent: prevYear?.capexPercent || 3,
            daPercent: prevYear?.daPercent || 3,
            workingCapitalChange: prevYear?.workingCapitalChange || 1
          };
        }
      }

      // Remove years beyond the new projection period
      Object.keys(updated.yearlyData).forEach(year => {
        if (parseInt(year) > newYears) {
          delete updated.yearlyData[year];
        }
      });

      return updated;
    });
  }, [updateInput]);

  const toggleRealTimeTracking = useCallback(() => {
    const newValue = !inputs.trackRealTime;
    updateInput('trackRealTime', newValue);

    if (newValue && inputs.symbol && modelRef.current) {
      modelRef.current.addDependency('stock_price', inputs.symbol);
      modelRef.current.addDependency('interest_rates', 'USD_10Y');
    }
  }, [inputs.trackRealTime, inputs.symbol, updateInput]);

  const formatCurrency = (value, decimals = 0) => {
    if (!value) return '$0';
    const absValue = Math.abs(value);
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const getRealTimeIndicator = (dataType, symbol) => {
    const key = `${dataType}_${symbol}`;
    const data = realTimeData[key];
    if (!data) return null;

    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-gray-300">
          {dataType === 'stock_price' && `$${data.price?.toFixed(2)}`}
          {dataType === 'interest_rates' && `${data.rate?.toFixed(2)}%`}
          {dataType === 'bond_yields' && `${data.yield?.toFixed(2)}%`}
          {dataType === 'volatility_index' && `${data.volatility?.toFixed(1)}`}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600"
              size="sm"
            >
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Living Model DCF</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-400">Real-time, reactive financial modeling</p>
                {lastUpdateTime && (
                  <span className="text-xs text-green-400">
                    Updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleRealTimeTracking}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                inputs.trackRealTime
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Icon name={inputs.trackRealTime ? 'Zap' : 'ZapOff'} className="w-4 h-4" />
              <span>Real-time: {inputs.trackRealTime ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company & Basic Inputs */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Icon name="Building" className="w-5 h-5 mr-2 text-blue-400" />
                Company Basics
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol
                  </label>
                  <Input
                    value={inputs.symbol}
                    onChange={(e) => updateInput('symbol', e.target.value.toUpperCase())}
                    className="bg-gray-700 border-gray-600"
                    placeholder="AAPL"
                  />
                  {inputs.trackRealTime && getRealTimeIndicator('stock_price', inputs.symbol)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Revenue
                  </label>
                  <Input
                    type="number"
                    value={inputs.currentRevenue}
                    onChange={(e) => updateInput('currentRevenue', parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600"
                    step="1000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discount Rate (WACC)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={(inputs.discountRate * 100).toFixed(1)}
                      onChange={(e) => updateInput('discountRate', parseFloat(e.target.value) / 100 || 0)}
                      className="bg-gray-700 border-gray-600"
                      step="0.1"
                      min="0"
                      max="50"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  {inputs.trackRealTime && getRealTimeIndicator('interest_rates', 'USD_10Y')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Terminal Growth Rate
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={(inputs.terminalGrowthRate * 100).toFixed(1)}
                      onChange={(e) => updateInput('terminalGrowthRate', parseFloat(e.target.value) / 100 || 0)}
                      className="bg-gray-700 border-gray-600"
                      step="0.1"
                      min="0"
                      max="10"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Dynamic Time Period Control */}
            <DynamicTimePeriodControl
              initialYears={inputs.projectionYears}
              onYearsChange={handleProjectionYearsChange}
            />

            {/* Real-time Market Data */}
            {inputs.trackRealTime && (
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="Activity" className="w-5 h-5 mr-2 text-green-400" />
                  Live Market Data
                </h3>

                <div className="space-y-3">
                  {getRealTimeIndicator('stock_price', inputs.symbol) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Stock Price:</span>
                      {getRealTimeIndicator('stock_price', inputs.symbol)}
                    </div>
                  )}

                  {getRealTimeIndicator('bond_yields', 'US10Y') && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">10Y Treasury:</span>
                      {getRealTimeIndicator('bond_yields', 'US10Y')}
                    </div>
                  )}

                  {getRealTimeIndicator('volatility_index', 'VIX') && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">VIX:</span>
                      {getRealTimeIndicator('volatility_index', 'VIX')}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Middle Panel - Year-by-Year Inputs */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Icon name="Calendar" className="w-5 h-5 mr-2 text-blue-400" />
                Year-by-Year Projections
              </h3>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.from({ length: inputs.projectionYears }, (_, i) => i + 1).map(year => (
                  <div key={year} className="border border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-3">Year {year}</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rev Growth %</label>
                        <Input
                          type="number"
                          value={inputs.yearlyData[year]?.revenueGrowth || 0}
                          onChange={(e) => updateYearlyData(year, 'revenueGrowth', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-sm"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">EBITDA Margin %</label>
                        <Input
                          type="number"
                          value={inputs.yearlyData[year]?.ebitdaMargin || 0}
                          onChange={(e) => updateYearlyData(year, 'ebitdaMargin', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-sm"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tax Rate %</label>
                        <Input
                          type="number"
                          value={inputs.yearlyData[year]?.taxRate || 0}
                          onChange={(e) => updateYearlyData(year, 'taxRate', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-sm"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">CapEx % Rev</label>
                        <Input
                          type="number"
                          value={inputs.yearlyData[year]?.capexPercent || 0}
                          onChange={(e) => updateYearlyData(year, 'capexPercent', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-sm"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-1 space-y-6">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-2 text-gray-400">Calculating...</span>
              </div>
            )}

            {error && (
              <Card className="bg-red-900/20 border-red-700 p-6">
                <div className="flex items-center text-red-400">
                  <Icon name="AlertCircle" className="w-5 h-5 mr-2" />
                  <span>Calculation Error</span>
                </div>
                <p className="text-red-300 mt-2 text-sm">{error.message}</p>
              </Card>
            )}

            {result && (
              <>
                {/* Key Metrics */}
                <Card className="bg-gray-800 border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Icon name="TrendingUp" className="w-5 h-5 mr-2 text-green-400" />
                    Key Results
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Enterprise Value:</span>
                      <span className="font-semibold text-lg text-blue-400">
                        {formatCurrency(result.enterpriseValue, 1)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Equity Value:</span>
                      <span className="font-semibold text-lg text-green-400">
                        {formatCurrency(result.equityValue, 1)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                      <span className="text-gray-400">Share Price:</span>
                      <span className="font-bold text-xl text-yellow-400">
                        ${result.impliedSharePrice?.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Terminal Value:</span>
                      <span className="font-semibold">
                        {formatCurrency(result.terminalValue, 1)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Cash Flow Summary */}
                <Card className="bg-gray-800 border-gray-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Icon name="DollarSign" className="w-5 h-5 mr-2 text-blue-400" />
                    Cash Flow Summary
                  </h3>

                  <div className="space-y-2">
                    {result.years?.map((year, index) => (
                      <div key={year} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Year {year} FCF:</span>
                        <span className="font-mono">
                          {formatCurrency(result.freeCashFlows[index], 1)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-gray-700 pt-2 mt-3">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-gray-300">PV of FCFs:</span>
                        <span>{formatCurrency(result.cumulativePV, 1)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivingModelDCF;
