import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, Plus, Search, DollarSign, Target, Filter } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const ComparableAnalysis = ({ data, formatCurrency, formatPercent: _formatPercent }) => {
  const [activeTab, setActiveTab] = useState('multiples');
  const [selectedMultiple, setSelectedMultiple] = useState('ev_revenue');
  const [showAddComp, setShowAddComp] = useState(false);

  // Sample comparable companies data (in practice, this would come from external API)
  const [comparableCompanies, setComparableCompanies] = useState([
    {
      id: 1,
      name: 'MedSpa Corp',
      ticker: 'MSPA',
      marketCap: 450000, // $450M
      enterpriseValue: 520000, // $520M
      revenue: 180000, // $180M
      ebitda: 45000, // $45M
      netIncome: 28000, // $28M
      employees: 1200,
      founded: 2015,
      geography: 'US',
      businessModel: 'B2C Medical Spa Chain'
    },
    {
      id: 2,
      name: 'Wellness Holdings',
      ticker: 'WELL',
      marketCap: 680000,
      enterpriseValue: 750000,
      revenue: 220000,
      ebitda: 55000,
      netIncome: 35000,
      employees: 1800,
      founded: 2012,
      geography: 'US',
      businessModel: 'Integrated Wellness Platform'
    },
    {
      id: 3,
      name: 'Aesthetic Solutions Inc',
      ticker: 'AEST',
      marketCap: 320000,
      enterpriseValue: 380000,
      revenue: 125000,
      ebitda: 32000,
      netIncome: 18000,
      employees: 850,
      founded: 2018,
      geography: 'US',
      businessModel: 'Medical Device & Services'
    },
    {
      id: 4,
      name: 'Premium Health Group',
      ticker: 'PHG',
      marketCap: 920000,
      enterpriseValue: 1050000,
      revenue: 310000,
      ebitda: 78000,
      netIncome: 48000,
      employees: 2500,
      founded: 2010,
      geography: 'US',
      businessModel: 'Premium Healthcare Services'
    }
  ]);

  // Calculate multiples for comparable companies
  const comparableMultiples = useMemo(() => {
    return comparableCompanies.map(comp => ({
      ...comp,
      multiples: {
        ev_revenue: comp.enterpriseValue / comp.revenue,
        ev_ebitda: comp.enterpriseValue / comp.ebitda,
        pe_ratio: comp.marketCap / comp.netIncome,
        revenue_per_employee: comp.revenue / comp.employees,
        market_cap_revenue: comp.marketCap / comp.revenue
      }
    }));
  }, [comparableCompanies]);

  // Calculate market statistics
  const marketStats = useMemo(() => {
    const multiples = comparableMultiples.map(c => c.multiples);

    const calculateStats = (values) => ({
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      min: Math.min(...values),
      max: Math.max(...values),
      p25: values.sort((a, b) => a - b)[Math.floor(values.length * 0.25)],
      p75: values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)]
    });

    return {
      ev_revenue: calculateStats(multiples.map(m => m.ev_revenue)),
      ev_ebitda: calculateStats(multiples.map(m => m.ev_ebitda)),
      pe_ratio: calculateStats(multiples.map(m => m.pe_ratio)),
      revenue_per_employee: calculateStats(multiples.map(m => m.revenue_per_employee)),
      market_cap_revenue: calculateStats(multiples.map(m => m.market_cap_revenue))
    };
  }, [comparableMultiples]);

  // Calculate implied valuation for target company
  const impliedValuation = useMemo(() => {
    const targetRevenue = data.statements.incomeStatement.totalRevenue?.[1] || 100000; // Year 1 revenue
    const targetEBITDA = (data.statements.incomeStatement.operatingIncome?.[1] || 50000) * 1.15; // Approx EBITDA
    const targetNetIncome = (data.statements.incomeStatement.operatingIncome?.[1] || 50000) * 0.7; // Approx net income

    return {
      ev_revenue: {
        mean: targetRevenue * marketStats.ev_revenue.mean,
        median: targetRevenue * marketStats.ev_revenue.median,
        p25: targetRevenue * marketStats.ev_revenue.p25,
        p75: targetRevenue * marketStats.ev_revenue.p75
      },
      ev_ebitda: {
        mean: targetEBITDA * marketStats.ev_ebitda.mean,
        median: targetEBITDA * marketStats.ev_ebitda.median,
        p25: targetEBITDA * marketStats.ev_ebitda.p25,
        p75: targetEBITDA * marketStats.ev_ebitda.p75
      },
      pe_ratio: {
        mean: targetNetIncome * marketStats.pe_ratio.mean,
        median: targetNetIncome * marketStats.pe_ratio.median,
        p25: targetNetIncome * marketStats.pe_ratio.p25,
        p75: targetNetIncome * marketStats.pe_ratio.p75
      }
    };
  }, [data, marketStats]);

  const multipleDefinitions = {
    ev_revenue: { name: 'EV/Revenue', description: 'Enterprise Value / Annual Revenue' },
    ev_ebitda: { name: 'EV/EBITDA', description: 'Enterprise Value / EBITDA' },
    pe_ratio: { name: 'P/E Ratio', description: 'Market Cap / Net Income' },
    revenue_per_employee: { name: 'Revenue/Employee', description: 'Revenue per Employee' },
    market_cap_revenue: { name: 'Market Cap/Revenue', description: 'Market Cap / Revenue' }
  };

  const addComparableCompany = (companyData) => {
    const newCompany = {
      id: Date.now(),
      ...companyData,
      marketCap: parseFloat(companyData.marketCap) || 0,
      enterpriseValue: parseFloat(companyData.enterpriseValue) || 0,
      revenue: parseFloat(companyData.revenue) || 0,
      ebitda: parseFloat(companyData.ebitda) || 0,
      netIncome: parseFloat(companyData.netIncome) || 0,
      employees: parseInt(companyData.employees) || 0,
      founded: parseInt(companyData.founded) || new Date().getFullYear()
    };
    setComparableCompanies([...comparableCompanies, newCompany]);
    setShowAddComp(false);
  };

  const removeComparable = (id) => {
    setComparableCompanies(comparableCompanies.filter(comp => comp.id !== id));
  };

  const tabs = [
    { id: 'multiples', label: 'Trading Multiples', icon: BarChart3 },
    { id: 'analysis', label: 'Valuation Analysis', icon: Target },
    { id: 'companies', label: 'Comparable Set', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Users size={20} />
            Comparable Company Analysis
          </h3>
          <p className="text-gray-600">
            Market-based valuation using trading multiples from similar public companies.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddComp(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Comparable
          </button>
        </div>
      </div>

      {/* Key Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={20} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">EV/REVENUE</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {marketStats.ev_revenue.median.toFixed(1)}x
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Median multiple
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">IMPLIED VALUE</span>
          </div>
          <div className="text-2xl font-bold text-green-800">
            {formatCurrency(impliedValuation.ev_revenue.median)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            EV/Revenue basis
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">VALUATION RANGE</span>
          </div>
          <div className="text-lg font-bold text-purple-800">
            {formatCurrency(impliedValuation.ev_revenue.p25)} - {formatCurrency(impliedValuation.ev_revenue.p75)}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            25th - 75th percentile
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className="text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">PEER COUNT</span>
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {comparableCompanies.length}
          </div>
          <div className="text-sm text-orange-600 mt-1">
            Comparable companies
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border p-6">
        {activeTab === 'multiples' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-lg">Trading Multiples Analysis</h4>
              <select
                value={selectedMultiple}
                onChange={(e) => setSelectedMultiple(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(multipleDefinitions).map(([key, def]) => (
                  <option key={key} value={key}>{def.name}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-right p-3 font-medium">Market Cap</th>
                    <th className="text-right p-3 font-medium">Enterprise Value</th>
                    <th className="text-right p-3 font-medium">Revenue</th>
                    <th className="text-right p-3 font-medium">EV/Revenue</th>
                    <th className="text-right p-3 font-medium">EV/EBITDA</th>
                    <th className="text-right p-3 font-medium">P/E Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {comparableMultiples.map((comp, _index) => (
                    <tr key={comp.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{comp.name}</div>
                          <div className="text-xs text-gray-500">{comp.ticker}</div>
                        </div>
                      </td>
                      <td className="p-3 text-right">{formatCurrency(comp.marketCap)}</td>
                      <td className="p-3 text-right">{formatCurrency(comp.enterpriseValue)}</td>
                      <td className="p-3 text-right">{formatCurrency(comp.revenue)}</td>
                      <td className="p-3 text-right font-medium">{comp.multiples.ev_revenue.toFixed(1)}x</td>
                      <td className="p-3 text-right font-medium">{comp.multiples.ev_ebitda.toFixed(1)}x</td>
                      <td className="p-3 text-right font-medium">{comp.multiples.pe_ratio.toFixed(1)}x</td>
                    </tr>
                  ))}

                  {/* Summary Statistics */}
                  <tr className="border-t-2 border-gray-300 bg-blue-50 font-semibold">
                    <td className="p-3">Market Statistics</td>
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3 text-right">{marketStats.ev_revenue.median.toFixed(1)}x</td>
                    <td className="p-3 text-right">{marketStats.ev_ebitda.median.toFixed(1)}x</td>
                    <td className="p-3 text-right">{marketStats.pe_ratio.median.toFixed(1)}x</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Multiple Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h6 className="font-medium mb-3">Multiple Distribution</h6>
                <div className="space-y-3">
                  {Object.entries(marketStats).slice(0, 3).map(([key, stats]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{multipleDefinitions[key].name}</span>
                        <span className="font-medium">{stats.median.toFixed(1)}x</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${((stats.median - stats.min) / (stats.max - stats.min)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{stats.min.toFixed(1)}x</span>
                        <span>{stats.max.toFixed(1)}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h6 className="font-medium mb-3">Key Statistics</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Companies Analyzed:</span>
                    <span className="font-medium">{comparableCompanies.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Market Cap:</span>
                    <span className="font-medium">{formatCurrency(comparableCompanies.sort((a, b) => a.marketCap - b.marketCap)[Math.floor(comparableCompanies.length / 2)]?.marketCap || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Revenue:</span>
                    <span className="font-medium">{formatCurrency(comparableCompanies.sort((a, b) => a.revenue - b.revenue)[Math.floor(comparableCompanies.length / 2)]?.revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Founded Year:</span>
                    <span className="font-medium">{Math.round(comparableCompanies.reduce((sum, c) => sum + c.founded, 0) / comparableCompanies.length)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h4 className="font-semibold text-lg">Valuation Analysis</h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Implied Valuation */}
              <div>
                <h5 className="font-medium mb-4">Implied Valuation by Multiple</h5>
                <div className="space-y-4">
                  {Object.entries(impliedValuation).map(([multiple, values]) => (
                    <div key={multiple} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{multipleDefinitions[multiple].name}</span>
                        <span className="text-sm text-gray-500">
                          {marketStats[multiple].median.toFixed(1)}x median
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>25th Percentile:</span>
                          <span className="font-medium">{formatCurrency(values.p25)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Median:</span>
                          <span className="font-bold text-blue-600">{formatCurrency(values.median)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>75th Percentile:</span>
                          <span className="font-medium">{formatCurrency(values.p75)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mean:</span>
                          <span className="font-medium">{formatCurrency(values.mean)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valuation Summary */}
              <div>
                <h5 className="font-medium mb-4">Valuation Summary</h5>
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-blue-600 font-medium mb-1">Recommended Range</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {formatCurrency((impliedValuation.ev_revenue.p25 + impliedValuation.ev_ebitda.p25) / 2)} -
                        {formatCurrency((impliedValuation.ev_revenue.p75 + impliedValuation.ev_ebitda.p75) / 2)}
                      </div>
                      <div className="text-sm text-blue-600">Blended 25th-75th percentile</div>
                    </div>

                    <div>
                      <div className="text-sm text-blue-600 font-medium mb-1">Midpoint Valuation</div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatCurrency((impliedValuation.ev_revenue.median + impliedValuation.ev_ebitda.median) / 2)}
                      </div>
                      <div className="text-sm text-blue-600">Average of median multiples</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Target size={16} className="text-yellow-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-yellow-800 mb-1">Valuation Considerations</h6>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Consider company-specific growth and margin profiles</li>
                        <li>• Adjust for differences in business model and scale</li>
                        <li>• Factor in market conditions and sector trends</li>
                        <li>• Apply appropriate discount for private company liquidity</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-lg">Comparable Company Set</h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {comparableCompanies.map((comp) => (
                <motion.div
                  key={comp.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h6 className="font-semibold text-gray-800">{comp.name}</h6>
                      <div className="text-sm text-gray-500">{comp.ticker} • {comp.geography}</div>
                    </div>
                    <button
                      onClick={() => removeComparable(comp.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Market Cap:</span>
                      <span className="font-medium">{formatCurrency(comp.marketCap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(comp.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EV/Revenue:</span>
                      <span className="font-medium">{(comp.enterpriseValue / comp.revenue).toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Founded:</span>
                      <span className="font-medium">{comp.founded}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-600">{comp.businessModel}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Comparable Modal */}
      {showAddComp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="font-semibold text-lg mb-4">Add Comparable Company</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addComparableCompany(Object.fromEntries(formData));
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    id="company-name"
                    name="name" type="text" required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
                  <input
                    id="ticker"
                    name="ticker" type="text" required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="marketCap" className="block text-sm font-medium text-gray-700 mb-1">Market Cap ($000s)</label>
                    <input
                      id="marketCap"
                      name="marketCap"
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="enterpriseValue" className="block text-sm font-medium text-gray-700 mb-1">Enterprise Value ($000s)</label>
                    <input
                      id="enterpriseValue"
                      name="enterpriseValue"
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">Revenue ($000s)</label>
                    <input
                      id="revenue"
                      name="revenue"
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="ebitda" className="block text-sm font-medium text-gray-700 mb-1">EBITDA ($000s)</label>
                    <input
                      id="ebitda"
                      name="ebitda"
                      type="number"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="businessModel" className="block text-sm font-medium text-gray-700 mb-1">Business Model</label>
                  <input
                    id="businessModel"
                    name="businessModel"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Company
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddComp(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparableAnalysis;
