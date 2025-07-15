/**
 * Storage Integration Example
 * Demonstrates how to integrate the new storage services with financial modeling components
 */

import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Download, Upload, Database } from 'lucide-react';
import { useDCFStorage, useUserPreferences, useStorageStats } from '../hooks/useFinancialStorage.js';
import DataExportImport from '../components/DataExportImport.jsx';

const StorageIntegrationExample = () => {
  const [showDataManager, setShowDataManager] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelData, setModelData] = useState({
    symbol: 'AAPL',
    assumptions: {
      revenueGrowthRate: 0.05,
      terminalGrowthRate: 0.025,
      discountRate: 0.1,
      taxRate: 0.21
    },
    projections: {
      revenues: [100, 105, 110.25, 115.76, 121.55],
      fcf: [20, 21, 22.05, 23.15, 24.31]
    },
    valuation: {
      intrinsicValue: 150.25,
      currentPrice: 140.50,
      upside: 0.069
    }
  });

  // Use storage hooks
  const { models, loading, error, saveModel, deleteModel, getModel } = useDCFStorage();
  const { preferences, updatePreference } = useUserPreferences();
  const { stats } = useStorageStats();

  // Auto-save functionality
  useEffect(() => {
    if (preferences?.autoSave && modelData.symbol) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveModel();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [modelData, preferences?.autoSave]);

  const handleSaveModel = async () => {
    const success = await saveModel(modelData.symbol, {
      ...modelData,
      metadata: {
        lastModified: Date.now(),
        autoSaved: true
      }
    });

    if (success) {
      console.log('Model saved successfully');
    } else {
      console.error('Failed to save model');
    }
  };

  const handleLoadModel = async (symbol) => {
    const model = await getModel(symbol);
    if (model) {
      setModelData(model);
      setSelectedModel(symbol);
    }
  };

  const handleDeleteModel = async (symbol) => {
    if (window.confirm(`Are you sure you want to delete the model for ${symbol}?`)) {
      const success = await deleteModel(symbol);
      if (success && selectedModel === symbol) {
        setSelectedModel(null);
      }
    }
  };

  const handleInputChange = (section, field, value) => {
    setModelData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Financial Model Workspace with Storage Integration
        </h1>

        {/* Storage Status Bar */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Storage Status:</span>
                <span className="text-sm text-gray-600 ml-2">
                  {stats ? `${stats.financialData.dcfModels} DCF models stored` : 'Loading...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences?.autoSave || false}
                  onChange={(e) => updatePreference('autoSave', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Auto-save</span>
              </label>
              <button
                onClick={() => setShowDataManager(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Data Manager
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Models Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FolderOpen className="w-4 h-4 mr-2" />
              Saved Models
            </h3>
            
            {loading ? (
              <div className="text-sm text-gray-500">Loading models...</div>
            ) : error ? (
              <div className="text-sm text-red-600">Error: {error}</div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      selectedModel === model.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div onClick={() => handleLoadModel(model.id)}>
                        <div className="font-medium text-sm">{model.symbol}</div>
                        <div className="text-xs text-gray-500">
                          Value: ${model.valuation?.intrinsicValue?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(model.metadata?.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModel(model.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {models.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No saved models
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Input Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">DCF Model Inputs</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  value={modelData.symbol}
                  onChange={(e) => setModelData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue Growth Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modelData.assumptions.revenueGrowthRate}
                  onChange={(e) => handleInputChange('assumptions', 'revenueGrowthRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modelData.assumptions.discountRate}
                  onChange={(e) => handleInputChange('assumptions', 'discountRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terminal Growth Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modelData.assumptions.terminalGrowthRate}
                  onChange={(e) => handleInputChange('assumptions', 'terminalGrowthRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <button
                onClick={handleSaveModel}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Model
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Valuation Results</h3>
            
            <div className="space-y-3">
              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Intrinsic Value</div>
                <div className="text-lg font-semibold text-green-600">
                  ${modelData.valuation.intrinsicValue.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Current Price</div>
                <div className="text-lg font-semibold">
                  ${modelData.valuation.currentPrice.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Upside/Downside</div>
                <div className={`text-lg font-semibold ${
                  modelData.valuation.upside > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(modelData.valuation.upside * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">5-Year Revenue CAGR</div>
                <div className="text-lg font-semibold">
                  {(modelData.assumptions.revenueGrowthRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Integration Demo */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Storage Integration Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Persistent Storage:</strong>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                <li>Models saved automatically</li>
                <li>Data persists across sessions</li>
                <li>Compression for large datasets</li>
              </ul>
            </div>
            <div>
              <strong>Data Management:</strong>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                <li>Export/import functionality</li>
                <li>Storage statistics</li>
                <li>Cleanup expired data</li>
              </ul>
            </div>
            <div>
              <strong>User Experience:</strong>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                <li>Auto-save preferences</li>
                <li>Offline capabilities</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export/Import Modal */}
      {showDataManager && (
        <DataExportImport onClose={() => setShowDataManager(false)} />
      )}
    </div>
  );
};

export default StorageIntegrationExample;
