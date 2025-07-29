import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Plus, Trash2, Calculator, TrendingUp, BarChart3 } from 'lucide-react';
import FinancialSpreadsheet from '../components/PrivateAnalysis/FinancialSpreadsheet';
import ModelingTools from '../components/PrivateAnalysis/ModelingTools';
import DataExportImport from '../components/DataExportImport';
import styles from './styles.module.css';

const PrivateAnalysis = () => {
  const [activeTab, setActiveTab] = useState('spreadsheet');
  const [financialData, setFinancialData] = useState({
    periods: ['Current Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4'],
    statements: {
      incomeStatement: {
        revenue: {},
        costOfGoodsSold: {},
        grossProfit: {},
        operatingExpenses: {},
        operatingIncome: {},
        otherIncomeExpense: {},
        netIncome: {}
      },
      balanceSheet: {
        assets: {},
        liabilities: {},
        equity: {}
      },
      cashFlow: {
        operating: {},
        investing: {},
        financing: {}
      }
    },
    assumptions: {},
    models: {}
  });

  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    const saved = localStorage.getItem('privateAnalyses');
    return saved ? JSON.parse(saved) : [];
  });

  const saveAnalysis = (name) => {
    const analysis = {
      id: Date.now(),
      name,
      data: financialData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    const updated = [...savedAnalyses, analysis];
    setSavedAnalyses(updated);
    localStorage.setItem('privateAnalyses', JSON.stringify(updated));
  };

  const loadAnalysis = (analysisId) => {
    const analysis = savedAnalyses.find(a => a.id === analysisId);
    if (analysis) {
      setFinancialData(analysis.data);
    }
  };

  const deleteAnalysis = (analysisId) => {
    const updated = savedAnalyses.filter(a => a.id !== analysisId);
    setSavedAnalyses(updated);
    localStorage.setItem('privateAnalyses', JSON.stringify(updated));
  };

  const tabs = [
    { id: 'spreadsheet', label: 'Financial Spreadsheet', icon: BarChart3 },
    { id: 'modeling', label: 'Financial Modeling', icon: Calculator },
    { id: 'analysis', label: 'Analysis Results', icon: TrendingUp }
  ];

  return (
    <div className={styles.container}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={styles.title}>Private Analysis</h1>
              <p className={styles.subtitle}>
                Build and analyze custom financial models with manual data input
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const name = prompt('Enter analysis name:');
                  if (name) saveAnalysis(name);
                }}
                className={`${styles.button} ${styles.primary}`}
              >
                <Save size={18} />
                Save Analysis
              </button>
              
              <button className={`${styles.button} ${styles.secondary}`}>
                <Upload size={18} />
                Import Data
              </button>
              
              <button className={`${styles.button} ${styles.tertiary}`}>
                <Download size={18} />
                Export Analysis
              </button>
            </div>
          </div>
        </motion.div>

        {/* Saved Analyses Quick Access */}
        {savedAnalyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-white rounded-lg shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-3">Saved Analyses</h3>
            <div className="flex gap-2 flex-wrap">
              {savedAnalyses.map((analysis) => (
                <div key={analysis.id} className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                  <button
                    onClick={() => loadAnalysis(analysis.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {analysis.name}
                  </button>
                  <button
                    onClick={() => deleteAnalysis(analysis.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.tabContainer}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.active : ''
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.tabContent}
        >
          {activeTab === 'spreadsheet' && (
            <FinancialSpreadsheet
              data={financialData}
              onDataChange={setFinancialData}
            />
          )}
          
          {activeTab === 'modeling' && (
            <ModelingTools
              data={financialData}
              onDataChange={setFinancialData}
            />
          )}
          
          {activeTab === 'analysis' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
              <p className="text-slate-600">
                Run financial models and view results here. This section will display:
              </p>
              <ul className="mt-3 list-disc list-inside text-slate-600 space-y-1">
                <li>DCF Valuation Results</li>
                <li>Ratio Analysis</li>
                <li>Sensitivity Analysis</li>
                <li>Scenario Modeling</li>
                <li>Monte Carlo Simulations</li>
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PrivateAnalysis;
