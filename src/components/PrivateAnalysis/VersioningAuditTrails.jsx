/**
 * Versioning & Audit Trails Component
 * Provides model versioning, audit trails, and compliance features
 */

import { motion } from 'framer-motion';
import {
  Clock,
  GitBranch,
  Users,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  RotateCcw,
  Tag,
  MessageSquare,
  Calendar
} from 'lucide-react';
import React, { useState } from 'react';

const VersioningAuditTrails = ({ _modelId, _modelData, _onDataChange }) => {
  const [activeTab, setActiveTab] = useState('versions');
  const [versions, _setVersions] = useState([
    {
      id: 'v1.0.3',
      timestamp: '2024-01-15T14:30:00Z',
      author: 'Sarah Johnson',
      changes: ['Updated WACC assumptions', 'Revised terminal growth rate'],
      status: 'approved',
      comments: 5,
      reviewers: ['John Smith', 'Mike Chen'],
      size: '1.2MB',
      checksum: 'a1b2c3d4'
    },
    {
      id: 'v1.0.2',
      timestamp: '2024-01-14T09:15:00Z',
      author: 'John Smith',
      changes: ['Added scenario analysis', 'Updated DCF model'],
      status: 'draft',
      comments: 2,
      reviewers: ['Sarah Johnson'],
      size: '1.1MB',
      checksum: 'e5f6g7h8'
    }
  ]);

  const [auditLogs, _setAuditLogs] = useState([
    {
      id: 1,
      timestamp: '2024-01-15T14:35:22Z',
      user: 'Sarah Johnson',
      action: 'model_updated',
      details: 'Updated DCF assumptions - WACC changed from 8.5% to 9.2%',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/119.0.0.0',
      severity: 'info'
    },
    {
      id: 2,
      timestamp: '2024-01-15T14:30:15Z',
      user: 'Sarah Johnson',
      action: 'version_created',
      details: 'Created version v1.0.3 with approval workflow',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/119.0.0.0',
      severity: 'info'
    },
    {
      id: 3,
      timestamp: '2024-01-15T11:22:08Z',
      user: 'John Smith',
      action: 'model_accessed',
      details: 'Viewed LBO model for Company ABC',
      ipAddress: '192.168.1.101',
      userAgent: 'Safari/17.0',
      severity: 'info'
    },
    {
      id: 4,
      timestamp: '2024-01-14T16:45:33Z',
      user: 'System',
      action: 'backup_created',
      details: 'Automated backup created for model portfolio',
      ipAddress: 'internal',
      userAgent: 'FinanceAnalyst-BackupService/1.0',
      severity: 'info'
    }
  ]);

  const [complianceStatus, _setComplianceStatus] = useState({
    sox: { compliant: true, lastAudit: '2024-01-01', nextAudit: '2024-04-01' },
    gdpr: { compliant: true, lastReview: '2024-01-10', dataRetention: '7 years' },
    ifrs: { compliant: true, standards: ['IFRS 9', 'IFRS 16'], lastUpdate: '2024-01-05' }
  });

  const formatDate = dateString => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Version Control & Audit Trails</h2>
          <p className="text-purple-100 mt-2">
            Track model changes, maintain compliance, and ensure data integrity
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'versions', label: 'Version History', icon: GitBranch },
              { id: 'audit', label: 'Audit Logs', icon: FileText },
              { id: 'compliance', label: 'Compliance', icon: Lock },
              { id: 'compare', label: 'Compare Versions', icon: RotateCcw }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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

        {/* Tab Content */}
        <div className="p-6">
          {/* Version History Tab */}
          {activeTab === 'versions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Model Versions</h3>
                <div className="flex space-x-3">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Create Version
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export History
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {versions.map(version => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusIcon(version.status)}
                          <h4 className="font-medium text-gray-900">{version.id}</h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              version.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : version.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {version.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <div className="flex items-center mb-2">
                              <Clock className="w-4 h-4 mr-2" />
                              {formatDate(version.timestamp)}
                            </div>
                            <div className="flex items-center mb-2">
                              <Users className="w-4 h-4 mr-2" />
                              by {version.author}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              {version.comments} comments
                            </div>
                          </div>
                          <div>
                            <div className="mb-2">
                              <span className="font-medium">Changes:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {version.changes.map((change, index) => (
                                  <li key={index}>{change}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium">Reviewers:</span>
                              <span className="ml-2">{version.reviewers.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button className="text-gray-400 hover:text-blue-600 p-2">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-green-600 p-2">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-purple-600 p-2">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Audit Trail</h3>
                <div className="flex space-x-3">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Actions</option>
                    <option>Model Updates</option>
                    <option>Access Logs</option>
                    <option>System Events</option>
                  </select>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.user}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}
                            >
                              {log.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Compliance Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SOX Compliance */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-green-900">SOX Compliance</h4>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <div>
                      Status: <span className="font-medium">Compliant</span>
                    </div>
                    <div>Last Audit: {complianceStatus.sox.lastAudit}</div>
                    <div>Next Audit: {complianceStatus.sox.nextAudit}</div>
                  </div>
                </div>

                {/* GDPR Compliance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-blue-900">GDPR Compliance</h4>
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div>
                      Status: <span className="font-medium">Compliant</span>
                    </div>
                    <div>Last Review: {complianceStatus.gdpr.lastReview}</div>
                    <div>Data Retention: {complianceStatus.gdpr.dataRetention}</div>
                  </div>
                </div>

                {/* IFRS Compliance */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-purple-900">IFRS Standards</h4>
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="space-y-2 text-sm text-purple-700">
                    <div>
                      Status: <span className="font-medium">Compliant</span>
                    </div>
                    <div>Standards: {complianceStatus.ifrs.standards.join(', ')}</div>
                    <div>Last Update: {complianceStatus.ifrs.lastUpdate}</div>
                  </div>
                </div>
              </div>

              {/* Compliance Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Compliance Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Generate Compliance Report</div>
                        <div className="text-sm text-gray-600">
                          Create comprehensive audit report
                        </div>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                  <button className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Archive Old Versions</div>
                        <div className="text-sm text-gray-600">Clean up historical data</div>
                      </div>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compare Versions Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Compare Model Versions</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="baseVersion"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Base Version
                  </label>
                  <select
                    id="baseVersion"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>v1.0.3 (Current)</option>
                    <option>v1.0.2</option>
                    <option>v1.0.1</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="compareAgainst"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Compare Against
                  </label>
                  <select
                    id="compareAgainst"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>v1.0.2</option>
                    <option>v1.0.1</option>
                    <option>v1.0.0</option>
                  </select>
                </div>
              </div>

              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center">
                <RotateCcw className="w-5 h-5 mr-2" />
                Generate Comparison Report
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Version Comparison</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Select two versions to see detailed differences in assumptions, calculations,
                      and results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersioningAuditTrails;
