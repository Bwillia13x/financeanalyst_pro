import { motion } from 'framer-motion';
import { Calculator, TrendingUp, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const ValuationToolDemo = () => {
  const exampleScenarios = [
    {
      title: 'Technology Startup',
      description: 'High-growth SaaS company with recurring revenue model',
      dcf: {
        revenue: 2000000,
        growth: 0.25,
        margin: 0.3,
        discount: 0.2
      },
      lbo: {
        price: 15000000,
        equity: 0.35,
        exit: 12,
        irr: '25-35%'
      }
    },
    {
      title: 'Manufacturing Company',
      description: 'Established manufacturer with stable cash flows',
      dcf: {
        revenue: 5000000,
        growth: 0.08,
        margin: 0.15,
        discount: 0.12
      },
      lbo: {
        price: 25000000,
        equity: 0.45,
        exit: 8,
        irr: '15-20%'
      }
    },
    {
      title: 'Healthcare Services',
      description: 'Medical practice with predictable patient volumes',
      dcf: {
        revenue: 3000000,
        growth: 0.1,
        margin: 0.2,
        discount: 0.15
      },
      lbo: {
        price: 18000000,
        equity: 0.4,
        exit: 10,
        irr: '18-25%'
      }
    }
  ];

  const features = [
    {
      icon: <Calculator className="w-6 h-6" />,
      title: 'DCF Analysis',
      description:
        'Complete discounted cash flow modeling with terminal value calculations and sensitivity analysis'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'LBO Modeling',
      description:
        'Leveraged buyout analysis with IRR and MOIC calculations for private equity scenarios'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Professional Results',
      description: 'Industry-standard calculations with detailed breakdowns and export capabilities'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Business Valuation Tool</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional-grade DCF and LBO analysis for privately held companies. Built for
            investment professionals, private equity firms, and corporate finance teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/valuation-tool"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Try the Tool
            </Link>
            <Link
              to="/valuation-tool/docs"
              className="inline-flex items-center px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              View Documentation
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Example Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Example Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exampleScenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{scenario.title}</h3>
                <p className="text-gray-600 mb-4">{scenario.description}</p>

                <div className="space-y-3">
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-900 mb-2">DCF Assumptions</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">
                          ${(scenario.dcf.revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth:</span>
                        <span className="font-medium">
                          {(scenario.dcf.growth * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-medium">
                          {(scenario.dcf.margin * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">
                          {(scenario.dcf.discount * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-900 mb-2">LBO Assumptions</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">
                          ${(scenario.lbo.price / 1000000).toFixed(0)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equity:</span>
                        <span className="font-medium">
                          {(scenario.lbo.equity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exit Multiple:</span>
                        <span className="font-medium">{scenario.lbo.exit}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected IRR:</span>
                        <span className="font-medium">{scenario.lbo.irr}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Methodology Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Valuation Methodologies
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Discounted Cash Flow (DCF)
              </h3>
              <p className="text-gray-600 mb-4">
                DCF analysis estimates the value of a business based on its expected future cash
                flows, discounted back to present value using a risk-adjusted rate.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Free cash flow projections for 5+ years
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Terminal value calculation using perpetuity growth
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Risk-adjusted discount rate application
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Enterprise value calculation
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Leveraged Buyout (LBO)
              </h3>
              <p className="text-gray-600 mb-4">
                LBO analysis evaluates potential returns from acquiring a company using significant
                debt financing and modeling the exit strategy.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Capital structure modeling (equity vs debt)
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Operational improvement projections
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Exit multiple-based valuation
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  IRR and MOIC calculations
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Valuation?</h2>
            <p className="text-xl mb-6 opacity-90">
              Access professional-grade financial modeling tools designed for private company
              analysis.
            </p>
            <Link
              to="/valuation-tool"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Launch Valuation Tool
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ValuationToolDemo;
