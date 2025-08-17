/**
 * Source Transparency System
 * Every key data point traceable back to its source with a single click
 * Provides unshakeable foundation of trust for all financial data
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Search,
  Calendar,
  Building,
  TrendingUp,
  DollarSign,
  Database,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  Clock,
  Hash,
  MapPin
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

const SourceTransparency = ({ dataPoint, value, onClose }) => {
  const [activeTab, setActiveTab] = useState('source');
  const [verificationStatus, setVerificationStatus] = useState('verified');

  // Sample source data - in production this would come from your data service
  const sourceData = {
    'Total Revenue': {
      value: '$2.89B',
      source: {
        document: 'Form 10-K Annual Report',
        company: 'TechCorp Inc.',
        filingDate: '2024-03-15',
        fiscalPeriod: 'FY 2023',
        lineItem: 'Total Revenue',
        page: 47,
        section: 'Consolidated Statements of Income',
        secUrl: 'https://sec.gov/Archives/edgar/data/123456/000012345624000001/tech-10k_20231231.htm',
        xpath: '/html/body/div[1]/table[2]/tbody/tr[3]/td[2]',
        extractedText: 'Total revenue for fiscal year 2023 was $2,891,245,000',
        verificationHash: 'sha256:a1b2c3d4e5f6...',
        lastVerified: '2024-07-30T14:30:00Z'
      },
      methodology: {
        extractionMethod: 'Automated XBRL parsing',
        validationRules: ['Revenue recognition standards (ASC 606)', 'Cross-reference with quarterly filings'],
        dataQuality: 95,
        confidence: 'High'
      },
      lineage: [
        {
          step: 1,
          process: 'SEC EDGAR Database Import',
          timestamp: '2024-07-30T12:00:00Z',
          status: 'completed'
        },
        {
          step: 2,
          process: 'XBRL Data Extraction',
          timestamp: '2024-07-30T12:05:00Z',
          status: 'completed'
        },
        {
          step: 3,
          process: 'Financial Statement Mapping',
          timestamp: '2024-07-30T12:10:00Z',
          status: 'completed'
        },
        {
          step: 4,
          process: 'Data Validation & Quality Check',
          timestamp: '2024-07-30T12:15:00Z',
          status: 'completed'
        }
      ],
      relatedData: [
        { metric: 'Q4 2023 Revenue', value: '$756M', variance: '+12.3%' },
        { metric: 'Product Revenue', value: '$2.1B', percentage: '72.7%' },
        { metric: 'Service Revenue', value: '$789M', percentage: '27.3%' }
      ],
      auditTrail: [
        {
          action: 'Data Import',
          user: 'System',
          timestamp: '2024-07-30T12:00:00Z',
          details: 'Imported from SEC EDGAR'
        },
        {
          action: 'Manual Verification',
          user: 'J. Smith (Sr. Analyst)',
          timestamp: '2024-07-30T14:30:00Z',
          details: 'Cross-referenced with earnings call transcript'
        }
      ]
    }
  };

  const currentSource = sourceData[dataPoint] || sourceData['Total Revenue'];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getStatusColor(verificationStatus)}`}>
                  {getStatusIcon(verificationStatus)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{dataPoint}</h2>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{value || currentSource.value}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Verification Status */}
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">SEC Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">EDGAR Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Quality: {currentSource.methodology.dataQuality}%</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'source', label: 'Source Document', icon: FileText },
                { id: 'lineage', label: 'Data Lineage', icon: TrendingUp },
                { id: 'methodology', label: 'Methodology', icon: Search },
                { id: 'audit', label: 'Audit Trail', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'source' && (
              <div className="space-y-6">
                {/* Primary Source */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">{currentSource.source.document}</h3>
                        <p className="text-sm text-blue-700">{currentSource.source.company}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Filing Date:</span>
                      <p className="text-blue-900">{currentSource.source.filingDate}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Fiscal Period:</span>
                      <p className="text-blue-900">{currentSource.source.fiscalPeriod}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Section:</span>
                      <p className="text-blue-900">{currentSource.source.section}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Page:</span>
                      <p className="text-blue-900">{currentSource.source.page}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded border">
                    <span className="text-xs text-gray-600 font-medium">EXTRACTED TEXT:</span>
                    <p className="text-sm text-gray-900 mt-1 italic">"{currentSource.source.extractedText}"</p>
                  </div>
                </div>

                {/* Related Data Points */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Related Data Points</h4>
                  <div className="space-y-2">
                    {currentSource.relatedData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{item.metric}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{item.value}</span>
                          {item.percentage && (
                            <span className="text-xs text-gray-500">({item.percentage})</span>
                          )}
                          {item.variance && (
                            <span className="text-xs text-green-600">{item.variance}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lineage' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Data Processing Pipeline</h4>
                {currentSource.lineage.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{step.process}</p>
                      <p className="text-sm text-gray-500">{new Date(step.timestamp).toLocaleString()}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'methodology' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Extraction Method</h4>
                  <p className="text-gray-700">{currentSource.methodology.extractionMethod}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Validation Rules</h4>
                  <ul className="space-y-2">
                    {currentSource.methodology.validationRules.map((rule, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-900">Data Quality</h5>
                    <p className="text-2xl font-bold text-green-600 mt-1">{currentSource.methodology.dataQuality}%</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900">Confidence Level</h5>
                    <p className="text-lg font-semibold text-blue-600 mt-1">{currentSource.methodology.confidence}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Audit Trail</h4>
                {currentSource.auditTrail.map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{entry.action}</p>
                          <p className="text-sm text-gray-500">{entry.user}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{entry.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Hash className="w-3 h-3" />
                  <span>Hash: {currentSource.source.verificationHash.substring(0, 12)}...</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Last verified: {new Date(currentSource.source.lastVerified).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => window.open(currentSource.source.secUrl, '_blank')}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Original Filing
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SourceTransparency;
