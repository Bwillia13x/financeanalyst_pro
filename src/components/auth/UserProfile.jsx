/**
 * User Profile Component
 * Provides user profile management and preferences
 */

import {
  User,
  Settings,
  Shield,
  Moon,
  Sun,
  Save,
  LogOut,
  Key,
  Download,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { authService, USER_ROLES } from '../../services/authService.js';
import { financialDataStorage } from '../../services/financialDataStorage.js';

import { useAuth } from './ProtectedRoute.jsx';

const UserProfile = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async() => {
    try {
      setIsLoading(true);

      // Load user preferences
      const userPrefs = await financialDataStorage.getUserPreferences();
      setPreferences(userPrefs || {
        theme: 'light',
        notifications: {
          email: true,
          browser: true,
          modelUpdates: true,
          marketAlerts: false
        },
        privacy: {
          analytics: true,
          dataSharing: false,
          marketingEmails: false
        },
        autoSave: true,
        defaultCurrency: 'USD',
        dateFormat: 'MM/DD/YYYY'
      });

      // Load storage statistics
      const storageStats = await financialDataStorage.getFinancialDataStats();
      setStats(storageStats);
    } catch (_error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async() => {
    try {
      setIsLoading(true);
      setSaveStatus(null);

      await financialDataStorage.saveUserPreferences(preferences);

      setSaveStatus({
        type: 'success',
        message: 'Preferences saved successfully'
      });

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (_error) {
      setSaveStatus({
        type: 'error',
        message: 'Failed to save preferences'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async() => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  const updatePreference = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      const keys = path.split('.');
      let current = newPrefs;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN: return 'bg-red-100 text-red-800';
      case USER_ROLES.ANALYST: return 'bg-blue-100 text-blue-800';
      case USER_ROLES.VIEWER: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user || !preferences) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Settings },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'data', label: 'Data', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="font-medium">{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Permissions:</span>
                      <span className="font-medium">{authService.getUserPermissions().length}</span>
                    </div>
                  </div>
                </div>

                {stats && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Usage Statistics</h4>
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
                        <span>Storage Used:</span>
                        <span className="font-medium">{formatBytes(stats.totalSize)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Appearance</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => updatePreference('theme', 'light')}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      preferences.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </button>
                  <button
                    onClick={() => updatePreference('theme', 'dark')}
                    className={`flex items-center px-4 py-2 rounded-lg border ${
                      preferences.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Email notifications' },
                    { key: 'browser', label: 'Browser notifications' },
                    { key: 'modelUpdates', label: 'Model update alerts' },
                    { key: 'marketAlerts', label: 'Market alerts' }
                  ].map(setting => (
                    <label key={setting.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.notifications[setting.key]}
                        onChange={(e) => updatePreference(`notifications.${setting.key}`, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* General Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">General</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.autoSave}
                      onChange={(e) => updatePreference('autoSave', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-save models</span>
                  </label>

                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-700">Default Currency:</label>
                    <select
                      value={preferences.defaultCurrency}
                      onChange={(e) => updatePreference('defaultCurrency', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </button>

              {saveStatus && (
                <div
                  className={`flex items-center p-3 rounded-lg ${
                    saveStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {saveStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {saveStatus.message}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Demo Mode</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Security features are simulated in demo mode. In production, this would include password changes,
                      two-factor authentication, and session management.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </button>

                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </button>
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Data Management</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Export your data for backup or transfer to another account.
                </p>

                <div className="flex space-x-4">
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </button>

                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </button>
                </div>
              </div>

              {stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Storage Overview</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium ml-2">{stats.itemCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Storage Used:</span>
                      <span className="font-medium ml-2">{formatBytes(stats.totalSize)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
