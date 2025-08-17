/**
 * Fixed Income Analytics Dashboard
 * Comprehensive bond analysis, yield curve modeling, and portfolio analytics
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, TrendingUp, BarChart3, DollarSign, Percent,
  Calendar, Target, Shield, AlertTriangle, Info
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area
} from 'recharts';

import FixedIncomeEngine from '../../services/fixedIncomeEngine';

const FixedIncomeAnalytics = () => {
  const [selectedBond, setSelectedBond] = useState(null);
  const [yieldCurve, setYieldCurve] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [activeTab, setActiveTab] = useState('bonds');
  const [bondPricing, setBondPricing] = useState(null);
  const [marketData, setMarketData] = useState({
    bonds: [],
    yieldCurves: {},
    creditSpreads: {}
  });

  const engine = useMemo(() => new FixedIncomeEngine(), []);

  // Sample bond data
  const sampleBonds = [
    {
      id: 'UST_10Y',
      name: 'US Treasury 10Y',
      issuer: 'US Treasury',
      couponRate: 0.025,
      faceValue: 1000,
      maturityDate: '2034-08-15',
      paymentFrequency: 2,
      creditRating: 'AAA',
      sector: 'Government',
      callable: false
    },
    {
      id: 'CORP_AAPL',
      name: 'Apple Inc. 2.45%',
      issuer: 'Apple Inc.',
      couponRate: 0.0245,
      faceValue: 1000,
      maturityDate: '2029-08-04',
      paymentFrequency: 2,
      creditRating: 'AA+',
      sector: 'Technology',
      callable: false
    },
    {
      id: 'UST_5Y',
      name: 'US Treasury 5Y',
      issuer: 'US Treasury',
      couponRate: 0.02,
      faceValue: 1000,
      maturityDate: '2029-08-15',
      paymentFrequency: 2,
      creditRating: 'AAA',
      sector: 'Government',
      callable: false
    }
  ];

  const samplePrices = [985.50, 1024.75, 992.25];

  useEffect(() => {
    // Initialize with sample data
    setMarketData(prev => ({
      ...prev,
      bonds: sampleBonds.map((bond, index) => ({
        ...bond,
        marketPrice: samplePrices[index],
        analytics: engine.calculateBondPrice(bond, 0.03)
      }))
    }));

    // Calculate yield curve
    const curveData = engine.bootstrapYieldCurve(sampleBonds, samplePrices);
    setYieldCurve(curveData);
  }, [engine]);

  const handleBondSelect = (bond) => {
    setSelectedBond(bond);
    const pricing = engine.calculateBondPrice(bond, 0.03);
    const ytm = engine.calculateYieldToMaturity(bond, bond.marketPrice);
    setBondPricing({ ...pricing, ...ytm });
  };

  const BondPricingCalculator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Calculator className="mr-2" />
        Bond Pricing Calculator
      </h3>

      {selectedBond && bondPricing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-3">{selectedBond.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Issuer:</span>
                <span className="font-medium">{selectedBond.issuer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coupon Rate:</span>
                <span className="font-medium">{(selectedBond.couponRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maturity:</span>
                <span className="font-medium">{selectedBond.maturityDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credit Rating:</span>
                <span className="font-medium">{selectedBond.creditRating}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3">Pricing & Analytics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Clean Price:</span>
                <span className="font-medium">${bondPricing.cleanPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dirty Price:</span>
                <span className="font-medium">${bondPricing.dirtyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yield to Maturity:</span>
                <span className="font-medium">{(bondPricing.yieldToMaturity * 100).toFixed(3)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modified Duration:</span>
                <span className="font-medium">{bondPricing.modifiedDuration.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Convexity:</span>
                <span className="font-medium">{bondPricing.convexity.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DV01:</span>
                <span className="font-medium">${bondPricing.dv01.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const YieldCurveChart = () => {
    if (!yieldCurve) return null;

    const chartData = yieldCurve.curve.map(point => ({
      maturity: point.maturity.toFixed(1),
      'Zero Coupon Rate': (point.zeroCouponRate * 100).toFixed(2),
      'Bond YTM': (point.bondYTM * 100).toFixed(2)
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="mr-2" />
          Yield Curve Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="maturity" label={{ value: 'Years to Maturity', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone" dataKey="Zero Coupon Rate" stroke="#2563eb"
                  strokeWidth={2}
                />
                <Line
                  type="monotone" dataKey="Bond YTM" stroke="#dc2626"
                  strokeWidth={2} strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3">Curve Metrics</h4>
            {yieldCurve.curveMetrics && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shape:</span>
                  <span className="font-medium capitalize">{yieldCurve.curveMetrics.shape}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slope:</span>
                  <span className="font-medium">{(yieldCurve.curveMetrics.slope * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium">{(yieldCurve.curveMetrics.level * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2Y-10Y Spread:</span>
                  <span className="font-medium">{(yieldCurve.curveMetrics.spread_2y10y * 100).toFixed(0)}bp</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">3M-10Y Spread:</span>
                  <span className="font-medium">{(yieldCurve.curveMetrics.spread_3m10y * 100).toFixed(0)}bp</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const BondsList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <BarChart3 className="mr-2" />
        Bond Universe
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Bond</th>
              <th className="text-left py-2">Issuer</th>
              <th className="text-left py-2">Coupon</th>
              <th className="text-left py-2">Maturity</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">YTM</th>
              <th className="text-left py-2">Duration</th>
              <th className="text-left py-2">Rating</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {marketData.bonds.map((bond) => (
              <tr key={bond.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{bond.name}</td>
                <td className="py-2">{bond.issuer}</td>
                <td className="py-2">{(bond.couponRate * 100).toFixed(2)}%</td>
                <td className="py-2">{bond.maturityDate}</td>
                <td className="py-2">${bond.marketPrice}</td>
                <td className="py-2">{(bond.analytics.yieldToMaturity * 100).toFixed(3)}%</td>
                <td className="py-2">{bond.analytics.modifiedDuration.toFixed(2)}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      bond.creditRating === 'AAA' ? 'bg-green-100 text-green-800' :
                        bond.creditRating.startsWith('AA') ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {bond.creditRating}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => handleBondSelect(bond)}
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

  const CreditAnalysis = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Shield className="mr-2" />
        Credit Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-lg mb-3">Credit Spreads by Sector</h4>
          <div className="space-y-3">
            {[
              { sector: 'Government', spread: 0, rating: 'AAA' },
              { sector: 'Technology', spread: 85, rating: 'AA+' },
              { sector: 'Financial', spread: 120, rating: 'A+' },
              { sector: 'Energy', spread: 180, rating: 'BBB+' }
            ].map((item) => (
              <div key={item.sector} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{item.sector}</span>
                  <span className="ml-2 text-sm text-gray-600">({item.rating})</span>
                </div>
                <span className="font-bold text-blue-600">{item.spread}bp</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-3">Credit Quality Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { rating: 'AAA', count: 15, percentage: 25 },
                { rating: 'AA', count: 20, percentage: 33 },
                { rating: 'A', count: 18, percentage: 30 },
                { rating: 'BBB', count: 7, percentage: 12 }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fixed Income Analytics</h1>
          <p className="text-gray-600">Comprehensive bond analysis, yield curve modeling, and credit analytics</p>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-blue-50 p-1 rounded-lg">
            {[
              { id: 'bonds', label: 'Bond Universe', icon: BarChart3 },
              { id: 'pricing', label: 'Pricing Calculator', icon: Calculator },
              { id: 'curves', label: 'Yield Curves', icon: TrendingUp },
              { id: 'credit', label: 'Credit Analysis', icon: Shield }
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
          {activeTab === 'bonds' && <BondsList />}
          {activeTab === 'pricing' && <BondPricingCalculator />}
          {activeTab === 'curves' && <YieldCurveChart />}
          {activeTab === 'credit' && <CreditAnalysis />}
        </AnimatePresence>

        {/* Key Metrics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Avg Portfolio Duration', value: '4.2 years', icon: Calendar, color: 'blue' },
            { label: 'Portfolio Yield', value: '3.15%', icon: Percent, color: 'green' },
            { label: 'Credit Spread', value: '125bp', icon: Target, color: 'orange' },
            { label: 'Total Market Value', value: '$2.4M', icon: DollarSign, color: 'purple' }
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

export default FixedIncomeAnalytics;
