import { motion } from 'framer-motion';
import { Calculator, TrendingUp, BarChart3, Target, FileSpreadsheet, Download } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';

const Models = () => {
  const [activeModel, setActiveModel] = useState(null);

  const models = [
    {
      id: 'dcf',
      title: 'DCF Model',
      description: 'Discounted Cash Flow valuation model with terminal value',
      icon: Calculator,
      color: 'bg-blue-500',
      features: ['Multi-stage growth', 'WACC calculation', 'Terminal value', 'Sensitivity analysis']
    },
    {
      id: 'lbo',
      title: 'LBO Model',
      description: 'Leveraged Buyout analysis with returns calculation',
      icon: TrendingUp,
      color: 'bg-green-500',
      features: ['Debt capacity analysis', 'IRR calculation', 'Exit multiples', 'Cash flow timing']
    },
    {
      id: 'comps',
      title: 'Comparable Analysis',
      description: 'Trading and transaction multiples comparison',
      icon: BarChart3,
      color: 'bg-purple-500',
      features: [
        'Trading multiples',
        'Transaction multiples',
        'Peer selection',
        'Statistical analysis'
      ]
    },
    {
      id: 'epv',
      title: 'EPV Model',
      description: 'Earnings Power Value for conservative valuation',
      icon: Target,
      color: 'bg-orange-500',
      features: [
        'Normalized earnings',
        'Conservative approach',
        'Asset adjustment',
        'Margin of safety'
      ]
    }
  ];

  const handleModelSelect = useCallback(modelId => {
    setActiveModel(modelId);
  }, []);

  const renderModelInterface = () => {
    if (!activeModel) {
      return (
        <div className="text-center py-12">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Model</h3>
          <p className="text-gray-500">Choose a valuation model to begin your analysis</p>
        </div>
      );
    }

    const model = models.find(m => m.id === activeModel);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${model.color}`}>
              <model.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{model.title}</h3>
              <p className="text-gray-600">{model.description}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Model Inputs</h4>
              <div className="space-y-4">
                {model.id === 'dcf' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="dcf-fcf"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Free Cash Flow (Year 1)
                        </label>
                        <input
                          id="dcf-fcf"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter FCF"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="dcf-growth"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Growth Rate (%)
                        </label>
                        <input
                          id="dcf-growth"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter growth rate"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="dcf-wacc"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          WACC (%)
                        </label>
                        <input
                          id="dcf-wacc"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter WACC"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="dcf-terminal-growth"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Terminal Growth (%)
                        </label>
                        <input
                          id="dcf-terminal-growth"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter terminal growth"
                        />
                      </div>
                    </div>
                  </>
                )}

                {model.id === 'lbo' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lbo-ev"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Enterprise Value
                        </label>
                        <input
                          id="lbo-ev"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter EV"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lbo-debt-equity"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Debt/Equity Ratio
                        </label>
                        <input
                          id="lbo-debt-equity"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter D/E ratio"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="lbo-exit-multiple"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Exit Multiple
                        </label>
                        <input
                          id="lbo-exit-multiple"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter exit multiple"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lbo-hold-period"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Hold Period (Years)
                        </label>
                        <input
                          id="lbo-hold-period"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter hold period"
                        />
                      </div>
                    </div>
                  </>
                )}

                {model.id === 'comps' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="comps-revenue"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Revenue
                        </label>
                        <input
                          id="comps-revenue"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter revenue"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="comps-ebitda"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          EBITDA
                        </label>
                        <input
                          id="comps-ebitda"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter EBITDA"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="comps-net-income"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Net Income
                        </label>
                        <input
                          id="comps-net-income"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter net income"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="comps-book-value"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Book Value
                        </label>
                        <input
                          id="comps-book-value"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter book value"
                        />
                      </div>
                    </div>
                  </>
                )}

                {model.id === 'epv' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="epv-normalized-earnings"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Normalized Earnings
                        </label>
                        <input
                          id="epv-normalized-earnings"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter normalized earnings"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="epv-cost-of-capital"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Cost of Capital (%)
                        </label>
                        <input
                          id="epv-cost-of-capital"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter cost of capital"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="epv-asset-adjustment"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Asset Adjustment
                        </label>
                        <input
                          id="epv-asset-adjustment"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter asset adjustment"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="epv-shares-outstanding"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Shares Outstanding
                        </label>
                        <input
                          id="epv-shares-outstanding"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter shares outstanding"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <Button className="w-full">Calculate Valuation</Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Results</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium">Intrinsic Value</span>
                  <span className="text-lg font-bold text-green-600">$--</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium">Current Price</span>
                  <span className="text-lg font-bold">$--</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Upside/Downside</span>
                  <span className="text-lg font-bold text-blue-600">--%</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">Model Features</h4>
              <ul className="space-y-2">
                {model.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full ${model.color} mr-2`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Valuation Models</h1>
            <p className="text-gray-600">
              Professional-grade financial models for comprehensive company analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {models.map(model => (
              <motion.div key={model.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`p-6 cursor-pointer transition-all duration-200 ${
                    activeModel === model.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-lg ${model.color}`}>
                      <model.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{model.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                  <div className="space-y-2">
                    {model.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-500">
                        <div className={`w-1.5 h-1.5 rounded-full ${model.color} mr-2`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="p-8">{renderModelInterface()}</Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Models;
