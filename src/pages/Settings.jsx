import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Palette } from 'lucide-react';
import Header from '../components/ui/Header';
import SEOHead from '../components/SEO/SEOHead';
import UserPreferences from '../components/Settings/UserPreferences';
import SecurityDashboard from '../components/Security/SecurityDashboard';
import { Card } from '../components/ui/Card';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');

  const tabs = [
    { id: 'preferences', label: 'User Preferences', icon: User },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEOHead
        title="Settings & Preferences | FinanceAnalyst Pro"
        description="Configure your user preferences, security settings, notifications, and platform customizations for optimal workflow and compliance."
        canonical="/settings"
        keywords="user settings, security preferences, platform configuration, compliance settings, notifications, customization"
      />
      
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <SettingsIcon className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
            Configure your workspace, security settings, and preferences to optimize your financial analysis workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'preferences' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  User Preferences
                </h2>
                <UserPreferences />
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Security & Access Control
                </h2>
                <SecurityDashboard />
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="text-slate-600 dark:text-slate-400">
                    Configure alerts, email notifications, and system messages.
                  </div>
                  {/* Notification settings will be implemented */}
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center text-slate-500 dark:text-slate-400">
                    Notification settings coming soon
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Appearance & Theme
                </h2>
                <div className="space-y-4">
                  <div className="text-slate-600 dark:text-slate-400">
                    Customize the platform appearance, themes, and layout preferences.
                  </div>
                  {/* Appearance settings will be implemented */}
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center text-slate-500 dark:text-slate-400">
                    Appearance settings coming soon
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;