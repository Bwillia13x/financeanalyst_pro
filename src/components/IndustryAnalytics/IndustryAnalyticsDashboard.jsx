import { motion } from 'framer-motion';
import {
  TrendingUp,
  Building,
  Stethoscope,
  Zap,
  Home,
  Code,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import BankingAnalyticsService from '../../services/analytics/bankingAnalytics';
import EnergyAnalyticsService from '../../services/analytics/energyAnalytics';
import HealthcareAnalyticsService from '../../services/analytics/healthcareAnalytics';
import RealEstateAnalyticsService from '../../services/analytics/realEstateAnalytics';
import TechnologyAnalyticsService from '../../services/analytics/technologyAnalytics';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

const IndustryAnalyticsDashboard = ({ isOpen, onClose }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const industries = [
    {
      id: 'banking',
      name: 'Banking & Financial Services',
      icon: Building,
      description: 'Credit portfolio analysis, Basel III compliance, CECL calculations',
      color: 'blue',
      service: BankingAnalyticsService
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: Stethoscope,
      description: 'Hospital profitability, physician compensation, regulatory compliance',
      color: 'green',
      service: HealthcareAnalyticsService
    },
    {
      id: 'energy',
      name: 'Energy & Utilities',
      icon: Zap,
      description: 'Energy trading, pipeline economics, renewable energy analysis',
      color: 'yellow',
      service: EnergyAnalyticsService
    },
    {
      id: 'real-estate',
      name: 'Real Estate',
      icon: Home,
      description: 'Property valuation, REIT analysis, development economics',
      color: 'purple',
      service: RealEstateAnalyticsService
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: Code,
      description: 'SaaS metrics, startup valuation, software company analysis',
      color: 'indigo',
      service: TechnologyAnalyticsService
    }
  ];

  const [services] = useState(() => ({
    banking: BankingAnalyticsService,
    healthcare: HealthcareAnalyticsService,
    energy: EnergyAnalyticsService,
    realEstate: RealEstateAnalyticsService,
    technology: TechnologyAnalyticsService
  }));

  const runAnalysis = async industryId => {
    setIsAnalyzing(true);
    setSelectedIndustry(industryId);

    try {
      const service = services[industryId];
      let results;

      // Sample data for demonstration - in real usage this would come from user input
      switch (industryId) {
        case 'banking':
          results = await service.analyzeCreditPortfolio({
            loans: [
              { amount: 100000, riskRating: 'AAA', sector: 'corporate' },
              { amount: 50000, riskRating: 'BBB', sector: 'retail' }
            ]
          });
          break;

        case 'healthcare':
          results = await service.analyzeHospitalFinancials({
            revenue: 50000000,
            expenses: 45000000,
            patientDays: 50000,
            physicians: 25
          });
          break;

        case 'energy':
          results = await service.analyzeEnergyProject({
            capitalCost: 100000000,
            annualRevenue: 20000000,
            operatingCosts: 5000000,
            expectedLife: 25
          });
          break;

        case 'real-estate':
          results = await service.analyzePropertyInvestment({
            purchasePrice: 1000000,
            rentalIncome: 60000,
            operatingExpenses: 20000,
            financingRate: 0.04
          });
          break;

        case 'technology':
          results = await service.analyzeSaaSCompany({
            annualRecurringRevenue: 10000000,
            customerAcquisitionCost: 500,
            customerLifetimeValue: 5000,
            monthlyChurnRate: 0.05
          });
          break;

        default:
          results = { error: 'Industry not supported' };
      }

      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResults({ error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getColorClasses = color => ({
    bg: `bg-${color}-500`,
    hover: `hover:bg-${color}-600`,
    text: `text-${color}-600`,
    border: `border-${color}-200`,
    light: `bg-${color}-50`
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Industry Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Specialized financial analysis tools for different industries
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Industry Selection */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Industry
            </h3>
            <div className="space-y-3">
              {industries.map(industry => {
                const IconComponent = industry.icon;
                const colorClasses = getColorClasses(industry.color);
                const isSelected = selectedIndustry === industry.id;

                return (
                  <div
                    key={industry.id}
                    onClick={() => runAnalysis(industry.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? `${colorClasses.light} ${colorClasses.border} border-2`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${colorClasses.bg} text-white`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {industry.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {industry.description}
                        </p>
                        {isAnalyzing && selectedIndustry === industry.id && (
                          <div className="mt-2">
                            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-2 rounded" />
                            <p className="text-xs text-gray-500 mt-1">Analyzing...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            {analysisResults ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Results
                </h3>
                {analysisResults.error ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400">Error: {analysisResults.error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(analysisResults).map(([key, value]) => (
                      <Card key={key} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                            {key.replace(/_/g, ' ')}
                          </h4>
                          <Activity className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {typeof value === 'object' ? (
                            <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p>{String(value)}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select an Industry
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an industry from the left panel to run specialized financial analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IndustryAnalyticsDashboard;
