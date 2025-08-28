import { motion } from 'framer-motion';
import { BookOpen, Calculator, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import React from 'react';

const ValuationToolDocs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Valuation Guide</h1>
          <p className="text-xl text-gray-600">
            Understanding DCF and LBO methodologies for private company valuation
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-6 h-6 mr-2" />
              Overview
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This tool provides professional-grade business valuation capabilities using two
              primary methodologies:
              <strong> Discounted Cash Flow (DCF)</strong> and{' '}
              <strong>Leveraged Buyout (LBO)</strong> analysis. These methods are widely used by
              investment professionals, private equity firms, and corporate finance teams to
              determine the intrinsic value of privately held companies.
            </p>
          </motion.div>

          {/* DCF Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-6 h-6 mr-2" />
              Discounted Cash Flow (DCF) Analysis
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What is DCF?</h3>
                <p className="text-gray-700 leading-relaxed">
                  DCF is a valuation method that estimates the value of an investment based on its
                  expected future cash flows. The model discounts these cash flows back to their
                  present value using a discount rate that reflects the risk and time value of
                  money.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Free Cash Flow Projections</h4>
                    <p className="text-sm text-blue-700">
                      Projected cash flows available to all capital providers (debt and equity
                      holders)
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Terminal Value</h4>
                    <p className="text-sm text-green-700">
                      Value of cash flows beyond the projection period, assuming perpetual growth
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Discount Rate</h4>
                    <p className="text-sm text-purple-700">
                      Rate used to discount future cash flows, reflecting risk and opportunity cost
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Enterprise Value</h4>
                    <p className="text-sm text-orange-700">
                      Total value of the business before considering capital structure
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Input Parameters</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Current Revenue</span>
                    <span className="text-sm text-gray-600">Starting point for projections</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Revenue Growth Rate</span>
                    <span className="text-sm text-gray-600">Annual growth assumption</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">EBITDA Margin</span>
                    <span className="text-sm text-gray-600">Profitability assumption</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Discount Rate</span>
                    <span className="text-sm text-gray-600">Risk-adjusted return requirement</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Terminal Growth Rate</span>
                    <span className="text-sm text-gray-600">Long-term growth assumption</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* LBO Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Leveraged Buyout (LBO) Analysis
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What is LBO?</h3>
                <p className="text-gray-700 leading-relaxed">
                  LBO analysis evaluates the potential returns from acquiring a company using
                  significant debt financing. The model projects the company&apos;s performance
                  under new ownership and calculates returns based on the exit strategy (typically
                  sale or IPO).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Equity Investment</h4>
                    <p className="text-sm text-blue-700">
                      Amount of equity capital invested in the transaction
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Debt Financing</h4>
                    <p className="text-sm text-green-700">
                      Leverage used to finance the acquisition
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Exit Value</h4>
                    <p className="text-sm text-purple-700">
                      Expected value at exit based on EBITDA multiple
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">IRR & MOIC</h4>
                    <p className="text-sm text-orange-700">
                      Internal Rate of Return and Multiple on Invested Capital
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Input Parameters</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Purchase Price</span>
                    <span className="text-sm text-gray-600">Total acquisition cost</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Equity Contribution</span>
                    <span className="text-sm text-gray-600">Percentage of equity vs debt</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Exit Multiple</span>
                    <span className="text-sm text-gray-600">EBITDA multiple at exit</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Exit Year</span>
                    <span className="text-sm text-gray-600">Holding period</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">EBITDA Growth</span>
                    <span className="text-sm text-gray-600">Operational improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Best Practices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Info className="w-6 h-6 mr-2" />
              Best Practices & Considerations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">DCF Best Practices</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Use conservative growth assumptions based on industry benchmarks
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Consider multiple scenarios (base, upside, downside)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Validate discount rate against comparable companies
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Ensure terminal growth rate is sustainable long-term
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">LBO Best Practices</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Model realistic operational improvements
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Consider debt capacity and interest coverage
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Account for transaction and management fees
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Validate exit multiple against market comparables
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Limitations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Limitations & Disclaimers
            </h2>

            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Important:</strong> This tool provides estimates based on simplified models
                and should not be considered as financial advice. Professional valuations require
                comprehensive analysis including:
              </p>

              <ul className="space-y-2 ml-4">
                <li>• Detailed financial modeling and scenario analysis</li>
                <li>• Industry-specific benchmarks and comparables</li>
                <li>• Due diligence on company operations and market position</li>
                <li>• Legal and regulatory considerations</li>
                <li>• Expert review by qualified professionals</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-800">
                  <strong>Disclaimer:</strong> The results generated by this tool are for
                  educational and preliminary analysis purposes only. Actual valuations should be
                  conducted by qualified professionals with access to complete company information
                  and market data.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Industry Benchmarks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Industry Benchmarks</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Discount Rates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Large Cap Public</span>
                    <span className="font-semibold">8-12%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Mid Cap Private</span>
                    <span className="font-semibold">12-18%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Small Cap Private</span>
                    <span className="font-semibold">15-25%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Early Stage</span>
                    <span className="font-semibold">25-40%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Exit Multiples by Sector
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Technology</span>
                    <span className="font-semibold">8-15x</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Manufacturing</span>
                    <span className="font-semibold">6-10x</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Healthcare</span>
                    <span className="font-semibold">8-12x</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Consumer</span>
                    <span className="font-semibold">6-9x</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ValuationToolDocs;
