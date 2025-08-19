/**
 * Industry-Specific Modeling Modules Component
 * Provides specialized financial modeling templates and industry-specific analytics
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Smartphone,
  Heart,
  Landmark,
  Home,
  Zap,
  ShoppingCart,
  Settings,
  Download,
  BookOpen,
  Target,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const IndustrySpecificModules = ({ currentIndustry, _modelData, _onDataChange }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(currentIndustry || 'technology');
  const [activeModule, setActiveModule] = useState('overview');

  const industries = [
    {
      id: 'technology',
      name: 'Technology',
      icon: Smartphone,
      description: 'SaaS, Software, Hardware, AI/ML',
      color: 'bg-blue-600',
      modules: ['saas-metrics', 'customer-analytics', 'recurring-revenue'],
      keyMetrics: ['ARR', 'CAC', 'LTV', 'Churn Rate', 'NRR'],
      valuationMultiples: ['EV/Revenue', 'EV/ARR', 'P/E', 'PEG'],
      specialFeatures: ['Subscription modeling', 'Cohort analysis', 'Unit economics']
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: Heart,
      description: 'Biotech, Pharma, Medical Devices',
      color: 'bg-green-600',
      modules: ['drug-development', 'clinical-trials', 'regulatory-analysis'],
      keyMetrics: ['Peak Sales', 'Probability of Success', 'R&D Efficiency'],
      valuationMultiples: ['EV/Peak Sales', 'EV/Pipeline Value', 'P/E'],
      specialFeatures: ['Risk-adjusted NPV', 'Clinical trial modeling', 'Patent analysis']
    },
    {
      id: 'financial',
      name: 'Financial Services',
      icon: Landmark,
      description: 'Banking, Insurance, FinTech',
      color: 'bg-purple-600',
      modules: ['credit-modeling', 'regulatory-capital', 'fintech-metrics'],
      keyMetrics: ['ROE', 'ROA', 'NIM', 'Efficiency Ratio'],
      valuationMultiples: ['P/B', 'P/E', 'P/TBV', 'EV/Revenue'],
      specialFeatures: ['Regulatory capital', 'Credit risk analysis', 'Basel III']
    },
    {
      id: 'real-estate',
      name: 'Real Estate',
      icon: Home,
      description: 'REITs, Development, Property Management',
      color: 'bg-orange-600',
      modules: ['property-valuation', 'reit-analysis', 'development-modeling'],
      keyMetrics: ['NOI', 'Cap Rate', 'FFO', 'AFFO', 'Occupancy'],
      valuationMultiples: ['P/FFO', 'EV/EBITDA', 'P/NAV'],
      specialFeatures: ['Property-level modeling', 'Lease roll modeling', 'Development waterfall']
    },
    {
      id: 'energy',
      name: 'Energy',
      icon: Zap,
      description: 'Oil & Gas, Renewables, Utilities',
      color: 'bg-yellow-600',
      modules: ['commodity-modeling', 'reserve-valuation', 'renewable-projects'],
      keyMetrics: ['Production', 'Reserves', 'EBITDAX', 'LCOE'],
      valuationMultiples: ['EV/EBITDA', 'EV/Production', 'EV/Reserves'],
      specialFeatures: ['Commodity modeling', 'Reserve valuation', 'Project finance']
    },
    {
      id: 'retail',
      name: 'Retail & Consumer',
      icon: ShoppingCart,
      description: 'E-commerce, Traditional Retail, Consumer Products',
      color: 'bg-pink-600',
      modules: ['store-modeling', 'ecommerce-metrics', 'brand-valuation'],
      keyMetrics: ['SSS', 'Conversion Rate', 'AOV', 'Inventory Turns'],
      valuationMultiples: ['EV/EBITDA', 'P/E', 'EV/Revenue'],
      specialFeatures: ['Store-level economics', 'Seasonal modeling', 'Channel analytics']
    }
  ];

  const saasData = [
    { year: '2022', arr: 28, customers: 850 },
    { year: '2023', arr: 35, customers: 1100 },
    { year: '2024', arr: 45, customers: 1250 },
    { year: '2025', arr: 58, customers: 1650 },
    { year: '2026', arr: 75, customers: 2100 }
  ];

  const currentIndustryData = industries.find(ind => ind.id === selectedIndustry);

  const renderSaaSMetrics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">SaaS Key Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">$45.0M</div>
          <div className="text-sm text-gray-600">Annual Recurring Revenue</div>
          <div className="text-xs text-green-600 mt-1">+35% YoY</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">$3.8K</div>
          <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          <div className="text-xs text-green-600 mt-1">+3.2% MoM</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">7.7x</div>
          <div className="text-sm text-gray-600">LTV:CAC Ratio</div>
          <div className="text-xs text-gray-500 mt-1">Target: &gt;3x</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">5.0%</div>
          <div className="text-sm text-gray-600">Monthly Churn Rate</div>
          <div className="text-xs text-red-600 mt-1">Target: &lt;5%</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">ARR Growth Projection</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={saasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="arr"
              stroke="#3B82F6"
              strokeWidth={2}
              name="ARR ($M)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="customers"
              stroke="#10B981"
              strokeWidth={2}
              name="Customers"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderIndustryOverview = () => {
    if (!currentIndustryData) return null;
    const Icon = currentIndustryData.icon;

    return (
      <div className="space-y-6">
        <div className={`${currentIndustryData.color} rounded-lg p-6 text-white`}>
          <div className="flex items-center mb-4">
            <Icon className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-xl font-bold">{currentIndustryData.name} Industry</h3>
              <p className="opacity-90">{currentIndustryData.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Key Metrics
            </h4>
            <div className="space-y-2">
              {currentIndustryData.keyMetrics.map((metric, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                  {metric}
                </div>))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Valuation Multiples
            </h4>
            <div className="space-y-2">
              {currentIndustryData.valuationMultiples.map((multiple, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                  {multiple}
                </div>))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Special Features
            </h4>
            <div className="space-y-2">
              {currentIndustryData.specialFeatures.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2" />
                  {feature}
                </div>))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Available Modules</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentIndustryData.modules.map((module, index) => (
              <button
                key={index}
                onClick={() => setActiveModule(module)}
                className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-gray-900 capitalize">
                  {module.replace('-', ' ')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Industry-specific analysis module
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Building2 className="w-6 h-6 mr-3" />
            Industry-Specific Modeling
          </h2>
          <p className="text-emerald-100 mt-2">
            Specialized financial models and analytics tailored to your industry
          </p>
        </div>

        {/* Industry Selector */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Select Industry</h3>
            <div className="flex space-x-2">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Template
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <motion.div
                  key={industry.id}
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedIndustry === industry.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedIndustry(industry.id)}
                >
                  <div className="flex items-center mb-3">
                    <div className={`${industry.color} p-2 rounded-lg mr-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>            <div>
                      <h4 className="font-medium text-gray-900">{industry.name}</h4>
                      <p className="text-xs text-gray-600">{industry.description}</p>
                    </div>
                  </div>          <div className="text-xs text-gray-500">
                    {industry.modules.length} specialized modules
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Module Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'metrics', label: 'Key Metrics', icon: BarChart3 },
              { id: 'analysis', label: 'Analysis', icon: TrendingUp },
              { id: 'benchmarks', label: 'Benchmarks', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeModule === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Module Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedIndustry}-${activeModule}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'overview' && renderIndustryOverview()}
              {activeModule === 'metrics' && selectedIndustry === 'technology' && renderSaaSMetrics()}

              {((activeModule === 'metrics' || activeModule === 'analysis') && selectedIndustry !== 'technology') ||
               (activeModule === 'benchmarks') && (
                 <div className="text-center py-12">
                   <div className={`w-16 h-16 ${currentIndustryData?.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                     {currentIndustryData && React.createElement(currentIndustryData.icon, { className: 'w-8 h-8 text-white' })}
                   </div>           <h3 className="text-lg font-medium text-gray-900 mb-2">
                     {currentIndustryData?.name} Module Coming Soon
                   </h3>
                   <p className="text-gray-600 mb-4">
                     Specialized {activeModule} for the {currentIndustryData?.name.toLowerCase()} industry are in development.
                   </p>
                   <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium">
                     Request Early Access
                   </button>
                 </div>)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IndustrySpecificModules;
