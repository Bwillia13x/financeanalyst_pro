/**
 * Data Export/Import Component
 * Provides UI for exporting and importing financial data
 */

import {
  Download,
  Upload,
  FileText,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  FileSpreadsheet,
  Bookmark,
  Users,
  Clock,
  Eye,
  Edit3,
  Share,
  Save
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { financialDataStorage } from '../services/financialDataStorage.js';
import { apiLogger } from '../utils/apiLogger.js';

const DataExportImport = ({ data, onDataChange, savedAnalyses, onAnalysesChange }) => {
  const [activeTab, setActiveTab] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Standard 3-Statement Model', category: 'General', lastUsed: '2024-01-15', uses: 42 },
    { id: 2, name: 'SaaS DCF Template', category: 'Technology', lastUsed: '2024-01-10', uses: 28 },
    { id: 3, name: 'LBO Analysis Template', category: 'Private Equity', lastUsed: '2024-01-05', uses: 35 }
  ]);
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: 'John Smith', email: 'john@company.com', role: 'Analyst', lastActive: '2 min ago', avatar: 'JS' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'VP', lastActive: '1 hour ago', avatar: 'SJ' }
  ]);

  // Load storage statistics on component mount
  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async() => {
    try {
      const storageStats = await financialDataStorage.getFinancialDataStats();
      setStats(storageStats);
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to load storage stats', { error: error.message });
    }
  };

  const handleExport = async() => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const exportData = await financialDataStorage.exportAllData();

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financeanalyst_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus({
        type: 'success',
        message: 'Data exported successfully',
        details: {
          dcfModels: Object.keys(exportData.data.dcfModels).length,
          lboModels: Object.keys(exportData.data.lboModels).length,
          monteCarloResults: Object.keys(exportData.data.monteCarloResults).length,
          watchlists: Object.keys(exportData.data.watchlists).length
        }
      });

      apiLogger.log('INFO', 'Data export completed', {
        totalItems: Object.keys(exportData.data.dcfModels).length +
                   Object.keys(exportData.data.lboModels).length +
                   Object.keys(exportData.data.monteCarloResults).length +
                   Object.keys(exportData.data.watchlists).length
      });
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: 'Export failed',
        details: error.message
      });
      apiLogger.log('ERROR', 'Data export failed', { error: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async(event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.data || !importData.version) {
        throw new Error('Invalid backup file format');
      }

      const importCount = await financialDataStorage.importData(importData);

      setImportStatus({
        type: 'success',
        message: 'Data imported successfully',
        details: {
          importCount,
          timestamp: new Date(importData.timestamp).toLocaleString()
        }
      });

      // Refresh stats
      await loadStats();

      apiLogger.log('INFO', 'Data import completed', { importCount });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Import failed',
        details: error.message
      });
      apiLogger.log('ERROR', 'Data import failed', { error: error.message });
    } finally {
      setIsImporting(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'excel', label: 'Excel Integration', icon: FileSpreadsheet },
              { id: 'templates', label: 'Templates', icon: Bookmark },
              { id: 'collaboration', label: 'Collaboration', icon: Users },
              { id: 'export', label: 'Export', icon: Download },
              { id: 'import', label: 'Import', icon: Upload },
              { id: 'stats', label: 'Statistics', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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

        {/* Content */}
        <div className="p-6">

          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Excel Integration</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Connect your Excel spreadsheets to FinanceAnalyst for seamless data synchronization.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </>
                )}
              </button>

              {exportStatus && (
                <div
                  className={`border rounded-lg p-4 ${
                    exportStatus.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    {exportStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                    )}
                    <div>
                      <h4
                        className={`font-medium ${
                          exportStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {exportStatus.message}
                      </h4>
                      {exportStatus.type === 'success' && exportStatus.details && (
                        <div className="text-sm text-green-700 mt-2">
                          <p>Exported items:</p>
                          <ul className="list-disc list-inside ml-4">
                            <li>{exportStatus.details.dcfModels} DCF Models</li>
                            <li>{exportStatus.details.lboModels} LBO Models</li>
                            <li>{exportStatus.details.monteCarloResults} Monte Carlo Results</li>
                            <li>{exportStatus.details.watchlists} Watchlists</li>
                          </ul>
                        </div>
                      )}
                      {exportStatus.type === 'error' && (
                        <p className="text-sm text-red-700 mt-1">{exportStatus.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Templates</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.category}</p>
                    <p className="text-sm text-gray-600">Last used: {template.lastUsed}</p>
                    <p className="text-sm text-gray-600">Uses: {template.uses}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Collaboration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{collaborator.name}</h4>
                    <p className="text-sm text-gray-600">{collaborator.email}</p>
                    <p className="text-sm text-gray-600">Role: {collaborator.role}</p>
                    <p className="text-sm text-gray-600">Last active: {collaborator.lastActive}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Export Your Data</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download all your financial models, analysis results, and preferences as a backup file.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </>
                )}
              </button>

              {exportStatus && (
                <div
                  className={`border rounded-lg p-4 ${
                    exportStatus.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    {exportStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                    )}
                    <div>
                      <h4
                        className={`font-medium ${
                          exportStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {exportStatus.message}
                      </h4>
                      {exportStatus.type === 'success' && exportStatus.details && (
                        <div className="text-sm text-green-700 mt-2">
                          <p>Exported items:</p>
                          <ul className="list-disc list-inside ml-4">
                            <li>{exportStatus.details.dcfModels} DCF Models</li>
                            <li>{exportStatus.details.lboModels} LBO Models</li>
                            <li>{exportStatus.details.monteCarloResults} Monte Carlo Results</li>
                            <li>{exportStatus.details.watchlists} Watchlists</li>
                          </ul>
                        </div>
                      )}
                      {exportStatus.type === 'error' && (
                        <p className="text-sm text-red-700 mt-1">{exportStatus.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-amber-900">Import Data</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Import data from a backup file. This will add to your existing data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">
                    Choose backup file
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a JSON backup file to import
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>

              {isImporting && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Importing data...</span>
                </div>
              )}

              {importStatus && (
                <div
                  className={`border rounded-lg p-4 ${
                    importStatus.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    {importStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                    )}
                    <div>
                      <h4
                        className={`font-medium ${
                          importStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {importStatus.message}
                      </h4>
                      {importStatus.type === 'success' && importStatus.details && (
                        <div className="text-sm text-green-700 mt-2">
                          <p>Imported {importStatus.details.importCount} items</p>
                          <p>Backup created: {importStatus.details.timestamp}</p>
                        </div>
                      )}
                      {importStatus.type === 'error' && (
                        <p className="text-sm text-red-700 mt-1">{importStatus.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Storage Statistics</h3>

              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Storage Usage</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-medium">{formatBytes(stats.totalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <span className="font-medium">{stats.itemCount}</span>
                      </div>
                      {stats.quota && (
                        <div className="flex justify-between">
                          <span>Usage:</span>
                          <span className="font-medium">
                            {(stats.usageRatio * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Financial Data</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>DCF Models:</span>
                        <span className="font-medium">{stats.financialData.dcfModels}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LBO Models:</span>
                        <span className="font-medium">{stats.financialData.lboModels}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monte Carlo Results:</span>
                        <span className="font-medium">{stats.financialData.monteCarloResults}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Watchlists:</span>
                        <span className="font-medium">{stats.financialData.watchlists}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading statistics...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExportImport;
