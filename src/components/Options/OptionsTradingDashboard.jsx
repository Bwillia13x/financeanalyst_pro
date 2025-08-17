/**
 * Options Trading Dashboard
 * Comprehensive options pricing, Greeks analysis, and volatility modeling
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Calculator, Target, Shield, Activity,
  BarChart3, Zap, Clock, DollarSign, Percent, AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, Surface
} from 'recharts';

import OptionsEngine from '../../services/optionsEngine';

const OptionsTradingDashboard = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionChain, setOptionChain] = useState([]);
  const [volSurface, setVolSurface] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [activeTab, setActiveTab] = useState('pricing');
  const [pricingResults, setPricingResults] = useState(null);

  const engine = useMemo(() => new OptionsEngine(), []);

  // Sample option data
  const sampleOptions = [
    {
      id: 'AAPL_CALL_170_30DTE',
      symbol: 'AAPL',
      optionType: 'call',
      strike: 170,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      marketPrice: 5.25,
      bid: 5.20,
      ask: 5.30,
      volume: 1250,
      openInterest: 8900
    },
    {
      id: 'AAPL_PUT_170_30DTE',
      symbol: 'AAPL',
      optionType: 'put',
      strike: 170,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      marketPrice: 3.75,
      bid: 3.70,
      ask: 3.80,
      volume: 980,
      openInterest: 5600
    },
    {
      id: 'AAPL_CALL_175_30DTE',
      symbol: 'AAPL',
      optionType: 'call',
      strike: 175,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      marketPrice: 2.90,
      bid: 2.85,
      ask: 2.95,
      volume: 2100,
      openInterest: 12500
    }
  ];

  const marketParams = {
    spotPrice: 172.50,
    riskFreeRate: 0.045,
    dividendYield: 0.005
  };

  useEffect(() => {
    // Calculate theoretical prices and Greeks for all options
    const enrichedOptions = sampleOptions.map(option => {
      const timeToExpiry = (option.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);

      try {
        const theoretical = engine.blackScholes(
          option.optionType,
          marketParams.spotPrice,
          option.strike,
          timeToExpiry,
          marketParams.riskFreeRate,
          0.25, // Initial volatility guess
          marketParams.dividendYield
        );

        const greeks = engine.calculateGreeks(
          option.optionType,
          marketParams.spotPrice,
          option.strike,
          timeToExpiry,
          marketParams.riskFreeRate,
          0.25,
          marketParams.dividendYield
        );

        const impliedVol = engine.calculateImpliedVolatility(
          option.optionType,
          option.marketPrice,
          marketParams.spotPrice,
          option.strike,
          timeToExpiry,
          marketParams.riskFreeRate,
          marketParams.dividendYield
        );

        return {
          ...option,
          timeToExpiry,
          theoretical: theoretical.optionPrice,
          impliedVolatility: impliedVol.impliedVolatility,
          ...greeks,
          moneyness: marketParams.spotPrice / option.strike
        };
      } catch (error) {
        return {
          ...option,
          timeToExpiry,
          theoretical: option.marketPrice,
          impliedVolatility: 0.25,
          delta: 0,
          gamma: 0,
          theta: 0,
          vega: 0,
          rho: 0
        };
      }
    });

    setOptionChain(enrichedOptions);
  }, [engine]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);

    // Calculate detailed analytics
    const timeToExpiry = (option.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);

    try {
      const pricing = engine.blackScholes(
        option.optionType,
        marketParams.spotPrice,
        option.strike,
        timeToExpiry,
        marketParams.riskFreeRate,
        option.impliedVolatility,
        marketParams.dividendYield
      );

      const greeks = engine.calculateGreeks(
        option.optionType,
        marketParams.spotPrice,
        option.strike,
        timeToExpiry,
        marketParams.riskFreeRate,
        option.impliedVolatility,
        marketParams.dividendYield
      );

      const americanPricing = engine.americanOptionBinomial(
        option.optionType,
        marketParams.spotPrice,
        option.strike,
        timeToExpiry,
        marketParams.riskFreeRate,
        option.impliedVolatility,
        marketParams.dividendYield
      );

      setPricingResults({
        ...option,
        ...pricing,
        ...greeks,
        american: americanPricing,
        payoffChart: generatePayoffChart(option, marketParams.spotPrice)
      });
    } catch (error) {
      console.error('Error calculating option analytics:', error);
    }
  };

  const generatePayoffChart = (option, currentSpot) => {
    const spotRange = [];
    const payoffs = [];
    const minSpot = currentSpot * 0.7;
    const maxSpot = currentSpot * 1.3;
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const spot = minSpot + (maxSpot - minSpot) * (i / steps);
      let payoff;

      if (option.optionType.toLowerCase() === 'call') {
        payoff = Math.max(spot - option.strike, 0) - option.marketPrice;
      } else {
        payoff = Math.max(option.strike - spot, 0) - option.marketPrice;
      }

      spotRange.push(spot);
      payoffs.push({
        spot: spot.toFixed(2),
        payoff: payoff.toFixed(2),
        breakeven: payoff >= 0
      });
    }

    return payoffs;
  };

  const OptionsPricingCalculator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Calculator className="mr-2" />
        Options Pricing Calculator
      </h3>

      {selectedOption && pricingResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-3">
              {selectedOption.symbol} {selectedOption.strike} {selectedOption.optionType.toUpperCase()}
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Market Price</span>
                <p className="text-lg font-bold">${selectedOption.marketPrice}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Theoretical</span>
                <p className="text-lg font-bold">${pricingResults.optionPrice.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Implied Vol</span>
                <p className="text-lg font-bold">{(selectedOption.impliedVolatility * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Moneyness</span>
                <p className="text-lg font-bold">{selectedOption.moneyness.toFixed(3)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold">Greeks</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Delta:</span>
                  <span className="font-medium">{pricingResults.delta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gamma:</span>
                  <span className="font-medium">{pricingResults.gamma.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Theta:</span>
                  <span className="font-medium">{pricingResults.theta.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vega:</span>
                  <span className="font-medium">{pricingResults.vega.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rho:</span>
                  <span className="font-medium">{pricingResults.rho.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lambda:</span>
                  <span className="font-medium">{pricingResults.lambda.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-semibold mb-3">Payoff Diagram</h5>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={pricingResults.payoffChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="spot" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`$${value}`, 'P&L']} />
                <Line
                  type="monotone" dataKey="payoff" stroke="#2563eb"
                  strokeWidth={2}
                />
                <Line
                  type="monotone" dataKey="0" stroke="#ef4444"
                  strokeWidth={1} strokeDasharray="2 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );

  const OptionsChain = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <BarChart3 className="mr-2" />
        Options Chain - {marketParams.spotPrice}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Strike</th>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Last</th>
              <th className="text-left py-2">Bid/Ask</th>
              <th className="text-left py-2">IV</th>
              <th className="text-left py-2">Delta</th>
              <th className="text-left py-2">Gamma</th>
              <th className="text-left py-2">Theta</th>
              <th className="text-left py-2">Volume</th>
              <th className="text-left py-2">OI</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {optionChain.map((option) => (
              <tr key={option.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{option.strike}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      option.optionType === 'call' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {option.optionType.toUpperCase()}
                  </span>
                </td>
                <td className="py-2">${option.marketPrice}</td>
                <td className="py-2 text-sm">${option.bid} / ${option.ask}</td>
                <td className="py-2">{(option.impliedVolatility * 100).toFixed(1)}%</td>
                <td className="py-2">{option.delta?.toFixed(3) || '-'}</td>
                <td className="py-2">{option.gamma?.toFixed(4) || '-'}</td>
                <td className="py-2">{option.theta?.toFixed(3) || '-'}</td>
                <td className="py-2">{option.volume.toLocaleString()}</td>
                <td className="py-2">{option.openInterest.toLocaleString()}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleOptionSelect(option)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const VolatilitySurface = () => {
    const volData = optionChain.map(option => ({
      strike: option.strike,
      impliedVol: option.impliedVolatility * 100,
      moneyness: option.moneyness,
      type: option.optionType
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="mr-2" />
          Volatility Surface & Smile
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Implied Volatility by Strike</h4>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart data={volData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strike" label={{ value: 'Strike', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Implied Vol (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name) => [`${value}%`, 'Implied Vol']} />
                <Scatter dataKey="impliedVol" fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Volatility Metrics</h4>
            <div className="space-y-3">
              {[
                { label: 'ATM Implied Vol', value: '25.2%', icon: Target },
                { label: 'Vol Skew (25Δ)', value: '3.8%', icon: TrendingUp },
                { label: 'Vol Convexity', value: '0.15', icon: Activity },
                { label: 'Term Structure Slope', value: '2.1%', icon: BarChart3 }
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2 text-blue-600" />
                      <span>{metric.label}</span>
                    </div>
                    <span className="font-bold">{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const RiskAnalysis = () => {
    const portfolioGreeks = optionChain.reduce((acc, option) => {
      const position = portfolio.find(p => p.id === option.id);
      const quantity = position?.quantity || 0;

      return {
        delta: acc.delta + (option.delta || 0) * quantity,
        gamma: acc.gamma + (option.gamma || 0) * quantity,
        theta: acc.theta + (option.theta || 0) * quantity,
        vega: acc.vega + (option.vega || 0) * quantity,
        totalValue: acc.totalValue + option.marketPrice * quantity
      };
    }, { delta: 0, gamma: 0, theta: 0, vega: 0, totalValue: 0 });

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Shield className="mr-2" />
          Portfolio Risk Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Portfolio Delta', value: portfolioGreeks.delta.toFixed(2), icon: TrendingUp, risk: Math.abs(portfolioGreeks.delta) > 50 },
            { label: 'Portfolio Gamma', value: portfolioGreeks.gamma.toFixed(3), icon: Activity, risk: Math.abs(portfolioGreeks.gamma) > 0.1 },
            { label: 'Daily Theta', value: portfolioGreeks.theta.toFixed(2), icon: Clock, risk: portfolioGreeks.theta < -50 },
            { label: 'Vega Exposure', value: portfolioGreeks.vega.toFixed(2), icon: Zap, risk: Math.abs(portfolioGreeks.vega) > 100 }
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label} className={`p-4 rounded-lg border-2 ${
                  metric.risk ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${metric.risk ? 'text-red-600' : 'text-blue-600'}`} />
                  {metric.risk && <AlertTriangle className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-xl font-bold">{metric.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Risk Scenarios</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { scenario: '1% Spot Move', pnl: portfolioGreeks.delta * marketParams.spotPrice * 0.01, color: 'blue' },
              { scenario: '5% Vol Increase', pnl: portfolioGreeks.vega * 5, color: 'green' },
              { scenario: '1 Day Time Decay', pnl: portfolioGreeks.theta, color: 'red' }
            ].map((scenario) => (
              <div key={scenario.scenario} className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{scenario.scenario}</span>
                <p className={`text-lg font-bold text-${scenario.color}-600`}>
                  ${scenario.pnl.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Options Trading Dashboard</h1>
          <p className="text-gray-600">Advanced options pricing, Greeks analysis, and volatility modeling</p>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-blue-50 p-1 rounded-lg">
            {[
              { id: 'chain', label: 'Options Chain', icon: BarChart3 },
              { id: 'pricing', label: 'Pricing Calculator', icon: Calculator },
              { id: 'volatility', label: 'Volatility Surface', icon: TrendingUp },
              { id: 'risk', label: 'Risk Analysis', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'chain' && <OptionsChain />}
          {activeTab === 'pricing' && <OptionsPricingCalculator />}
          {activeTab === 'volatility' && <VolatilitySurface />}
          {activeTab === 'risk' && <RiskAnalysis />}
        </AnimatePresence>

        {/* Market Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Spot Price', value: `$${marketParams.spotPrice}`, icon: DollarSign, color: 'blue' },
            { label: 'Risk-Free Rate', value: `${(marketParams.riskFreeRate * 100).toFixed(2)}%`, icon: Percent, color: 'green' },
            { label: 'Dividend Yield', value: `${(marketParams.dividendYield * 100).toFixed(2)}%`, icon: Target, color: 'orange' },
            { label: 'Avg Implied Vol', value: '25.2%', icon: Activity, color: 'purple' }
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-xl font-bold">{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 text-${metric.color}-600`} />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default OptionsTradingDashboard;
