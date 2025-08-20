import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  Layout,
  Database,
  Bell,
  Calculator,
  Users,
  Zap,
  Navigation,
  X,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Save
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import userPreferencesService from '../../services/userPreferencesService';

const UserPreferences = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState({});
  const [activeCategory, setActiveCategory] = useState('appearance');
  const [hasChanges, setHasChanges] = useState(false);
  const [categories, setCategories] = useState({});
  const [themes, setThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async() => {
    setIsLoading(true);
    try {
      const prefs = userPreferencesService.getPreferences();
      const cats = userPreferencesService.getPreferenceCategories();
      const availableThemes = userPreferencesService.getThemes();

      setPreferences(prefs);
      setCategories(cats);
      setThemes(availableThemes);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    setHasChanges(true);
  };

  const savePreferences = async() => {
    setIsSaving(true);
    try {
      await userPreferencesService.updatePreferences(preferences);
      setHasChanges(false);

      // Show success notification
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          message: 'Preferences saved successfully',
          duration: 3000
        }
      }));
    } catch (error) {
      console.error('Error saving preferences:', error);
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          message: 'Failed to save preferences',
          duration: 5000
        }
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreferences = async() => {
    if (window.confirm('Reset all preferences to default? This action cannot be undone.')) {
      try {
        const reset = await userPreferencesService.resetPreferences();
        setPreferences(reset);
        setHasChanges(false);

        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            message: 'Preferences reset to default',
            duration: 3000
          }
        }));
      } catch (error) {
        console.error('Error resetting preferences:', error);
      }
    }
  };

  const exportSettings = () => {
    const settings = userPreferencesService.exportSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeanalyst_settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        const success = userPreferencesService.importSettings(settings);

        if (success) {
          loadPreferences();
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              type: 'success',
              message: 'Settings imported successfully',
              duration: 3000
            }
          }));
        } else {
          throw new Error('Invalid settings file');
        }
      } catch (error) {
        console.error('Error importing settings:', error);
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            message: 'Failed to import settings',
            duration: 5000
          }
        }));
      }
    };
    reader.readAsText(file);
  };

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      appearance: Palette,
      dashboard: Layout,
      data: Database,
      notifications: Bell,
      modeling: Calculator,
      collaboration: Users,
      performance: Zap,
      navigation: Navigation
    };
    return icons[categoryKey] || Settings;
  };

  const renderPreferenceInput = (key, value) => {
    const inputProps = {
      className: 'w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      value: value || '',
      onChange: (e) => updatePreference(key, e.target.value)
    };

    switch (key) {
      case 'theme':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
        );

      case 'fontSize':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra_large">Extra Large</option>
          </select>
        );

      case 'density':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        );

      case 'colorScheme':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        );

      case 'currency':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        );

      case 'dateFormat':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY</option>
          </select>
        );

      case 'numberFormat':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="standard">1,234.56</option>
            <option value="european">1.234,56</option>
            <option value="indian">1,23,456.78</option>
            <option value="scientific">1.23E+3</option>
          </select>
        );

      case 'defaultTimeHorizon':
        return (
          <select {...inputProps} onChange={(e) => updatePreference(key, e.target.value)}>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
            <option value="5Y">5 Years</option>
            <option value="10Y">10 Years</option>
          </select>
        );

      case 'precision':
      case 'autoSaveInterval':
      case 'refreshInterval':
      case 'riskFreeRate':
      case 'marketRiskPremium':
      case 'defaultDiscountRate':
      case 'confidenceLevel':
        return (
          <input
            {...inputProps}
            type="number"
            step={key.includes('Rate') || key.includes('Level') ? '0.001' : '1'}
            min={key.includes('Interval') ? '1000' : '0'}
            max={key.includes('Level') ? '1' : undefined}
            onChange={(e) => updatePreference(key, parseFloat(e.target.value) || 0)}
          />
        );

      case 'animations':
      case 'sidebarCollapsed':
      case 'widgetAnimations':
      case 'autoRefreshData':
      case 'enableNotifications':
      case 'emailNotifications':
      case 'soundEffects':
      case 'pushNotifications':
      case 'shareByDefault':
      case 'allowComments':
      case 'trackChanges':
      case 'notifyOnChanges':
      case 'enableCaching':
      case 'offlineMode':
      case 'dataValidation':
      case 'autoBackup':
      case 'keyboardShortcuts':
      case 'mouseNavigation':
      case 'touchGestures':
      case 'commandPalette':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => updatePreference(key, e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        );

      default:
        return <input {...inputProps} type="text" />;
    }
  };

  const getPreferenceLabel = (key) => {
    const labels = {
      theme: 'Theme',
      fontSize: 'Font Size',
      density: 'Display Density',
      colorScheme: 'Color Scheme',
      animations: 'Enable Animations',
      defaultView: 'Default View',
      sidebarCollapsed: 'Collapse Sidebar',
      gridSize: 'Grid Size',
      widgetAnimations: 'Widget Animations',
      autoSaveInterval: 'Auto Save Interval (ms)',
      currency: 'Default Currency',
      dateFormat: 'Date Format',
      numberFormat: 'Number Format',
      precision: 'Decimal Precision',
      autoRefreshData: 'Auto Refresh Data',
      refreshInterval: 'Refresh Interval (ms)',
      enableNotifications: 'Enable Notifications',
      emailNotifications: 'Email Notifications',
      soundEffects: 'Sound Effects',
      pushNotifications: 'Push Notifications',
      defaultTimeHorizon: 'Default Time Horizon',
      riskFreeRate: 'Risk-Free Rate',
      marketRiskPremium: 'Market Risk Premium',
      defaultDiscountRate: 'Default Discount Rate',
      confidenceLevel: 'Confidence Level',
      shareByDefault: 'Share by Default',
      allowComments: 'Allow Comments',
      trackChanges: 'Track Changes',
      notifyOnChanges: 'Notify on Changes',
      enableCaching: 'Enable Caching',
      offlineMode: 'Offline Mode',
      dataValidation: 'Data Validation',
      autoBackup: 'Auto Backup',
      keyboardShortcuts: 'Keyboard Shortcuts',
      mouseNavigation: 'Mouse Navigation',
      touchGestures: 'Touch Gestures',
      commandPalette: 'Command Palette'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-3" size={28} />
                User Preferences
              </h2>
              <p className="text-gray-600 mt-1">Customize your workspace and experience</p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Changes</span>
                </motion.button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex max-h-[calc(90vh-88px)]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 space-y-2">
                {Object.entries(categories).map(([key, category]) => {
                  const Icon = getCategoryIcon(key);
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveCategory(key)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeCategory === key
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{category.name}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Import/Export Actions */}
              <div className="border-t border-gray-200 p-4 space-y-2">
                <button
                  onClick={exportSettings}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Download size={16} />
                  <span>Export Settings</span>
                </button>
                <label className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <Upload size={16} />
                  <span>Import Settings</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={resetPreferences}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <RotateCcw size={16} />
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin" size={32} />
                </div>
              ) : (
                <div className="p-6">
                  {activeCategory && categories[activeCategory] && (
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          {React.createElement(getCategoryIcon(activeCategory), {
                            size: 24,
                            className: 'mr-2'
                          })}
                          {categories[activeCategory].name}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Configure {categories[activeCategory].name.toLowerCase()} settings
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {categories[activeCategory].preferences.map(prefKey => (
                          <motion.div
                            key={prefKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <label className="block font-medium text-gray-900">
                              {getPreferenceLabel(prefKey)}
                            </label>
                            {renderPreferenceInput(prefKey, preferences[prefKey])}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {hasChanges && (
            <div className="border-t border-gray-200 bg-yellow-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-700">
                  You have unsaved changes
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={loadPreferences}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={savePreferences}
                    disabled={isSaving}
                    className="text-sm bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserPreferences;
