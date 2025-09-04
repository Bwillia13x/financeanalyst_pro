import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  X,
  Target,
  Zap
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { RiskAssessmentService } from '../../services/risk/riskAssessmentTools';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

const RiskManagementDashboard = ({ isOpen, onClose, portfolioData }) => {
  const [selectedFramework, setSelectedFramework] = useState('basel_iii');
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [stressTestResults, setStressTestResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [riskService] = useState(() => new RiskAssessmentService());

  const frameworks = [
    {
      id: 'basel_iii',
      name: 'Basel III Framework',
      description: 'Banking risk management standards',
      icon: Shield,
      color: 'blue'
    },
    {
      id: 'coso',
      name: 'COSO ERM',
      description: 'Enterprise risk management framework',
      icon: Target,
      color: 'green'
    },
    {
      id: 'iso_31000',
      name: 'ISO 31000',
      description: 'International risk management standard',
      icon: Activity,
      color: 'purple'
    }
  ];

  const runRiskAssessment = async () => {
    setIsAnalyzing(true);
    try {
      // Sample portfolio data - in real usage this would come from props
      const samplePortfolio = portfolioData || {
        assets: [
          { type: 'equity', value: 500000, riskRating: 'medium', sector: 'technology' },
          { type: 'bond', value: 300000, riskRating: 'low', sector: 'government' },
          { type: 'derivative', value: 100000, riskRating: 'high', sector: 'commodity' }
        ],
        liabilities: [
          { type: 'debt', value: 200000, interestRate: 0.05, maturity: 5 },
          { type: 'equity', value: 700000, dividend: 0.03 }
        ],
        marketConditions: {
          volatility: 0.25,
          interestRate: 0.045,
          gdpGrowth: 0.025
        }
      };

      // Run comprehensive risk assessment
      const assessment = await riskService.performComprehensiveRiskAssessment(
        samplePortfolio,
        selectedFramework
      );

      setRiskAssessment(assessment);

      // Run stress tests
      const stressResults = await riskService.runStressTests(samplePortfolio, {
        scenarios: ['recession', 'market_crash', 'interest_rate_hike'],
        confidenceLevel: 0.95
      });

      setStressTestResults(stressResults);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      setRiskAssessment({ error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskLevelColor = level => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = level => {
    switch (level) {
      case 'low':
        return CheckCircle;
      case 'medium':
        return AlertTriangle;
      case 'high':
        return AlertCircle;
      default:
        return Activity;
    }
  };

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-6 h-6 mr-3 text-red-500" />
                Risk Management Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive risk assessment and stress testing tools
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Risk Framework
              </h3>
              <div className="space-y-2">
                {frameworks.map(framework => {
                  const IconComponent = framework.icon;
                  const isSelected = selectedFramework === framework.id;

                  return (
                    <div
                      key={framework.id}
                      onClick={() => setSelectedFramework(framework.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent
                          className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {framework.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {framework.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <Button onClick={runRiskAssessment} disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing Risk...
                  </div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Risk Assessment
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'stress-tests', label: 'Stress Tests', icon: TrendingDown },
                { id: 'recommendations', label: 'Recommendations', icon: Target }
              ].map(tab => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Risk Assessment Overview
                  </h3>

                  {riskAssessment ? (
                    riskAssessment.error ? (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-400">
                          Error: {riskAssessment.error}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(riskAssessment.overallRisk || {}).map(
                          ([category, data]) => {
                            const RiskIcon = getRiskIcon(data.level);
                            const colorClasses = getRiskLevelColor(data.level);

                            return (
                              <Card key={category} className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                    {category.replace(/_/g, ' ')}
                                  </h4>
                                  <div
                                    className={`p-2 rounded-full ${colorClasses.replace('text-', 'bg-').replace('-600', '-100')}`}
                                  >
                                    <RiskIcon className={`w-5 h-5 ${colorClasses.split(' ')[0]}`} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      Risk Level
                                    </span>
                                    <span
                                      className={`text-sm font-medium capitalize ${colorClasses.split(' ')[0]}`}
                                    >
                                      {data.level}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      Score
                                    </span>
                                    <span className="text-sm font-medium">
                                      {(data.score * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </Card>
                            );
                          }
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Run Risk Assessment
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Select a framework and run a comprehensive risk assessment of your portfolio
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stress-tests' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Stress Test Results
                  </h3>

                  {stressTestResults ? (
                    <div className="space-y-6">
                      {Object.entries(stressTestResults.scenarios || {}).map(
                        ([scenario, result]) => (
                          <Card key={scenario} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                {scenario.replace(/_/g, ' ')} Scenario
                              </h4>
                              <div className="flex items-center space-x-2">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Loss: {(result.portfolioLoss * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Portfolio Value
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  ${result.finalValue?.toLocaleString() || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Recovery Time
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {result.recoveryTime || 'N/A'} months
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Stress Test Results
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Run a risk assessment first to see stress test results
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Risk Management Recommendations
                  </h3>

                  {riskAssessment && riskAssessment.recommendations ? (
                    <div className="space-y-4">
                      {riskAssessment.recommendations.map((rec, index) => (
                        <Card key={index} className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <Target className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {rec.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {rec.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Impact: {rec.impact}</span>
                                <span className="text-sm text-gray-500">Effort: {rec.effort}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Recommendations Available
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Run a risk assessment to get personalized recommendations
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RiskManagementDashboard;
