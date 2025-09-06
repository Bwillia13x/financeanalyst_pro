import { Settings as SettingsIcon, User, Shield, Bell, Palette } from 'lucide-react';
import React, { useState } from 'react';

import SecurityDashboard from '../components/Security/SecurityDashboard';
import SEOHead from '../components/SEO/SEOHead';
import UserPreferences from '../components/Settings/UserPreferences';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');

  const tabs = [
    { id: 'preferences', label: 'User Preferences', icon: User },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <SettingsIcon className="w-8 h-8 text-accent mr-3" />
            <h1 className="text-3xl font-bold text-foreground">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-foreground-secondary max-w-3xl">
            Configure your workspace, security settings, and preferences to optimize your financial
            analysis workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary border-r-2 border-primary'
                          : 'text-foreground-secondary hover:bg-muted hover:text-foreground'
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
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  User Preferences
                </h2>
                <UserPreferences />
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Security & Access Control
                </h2>
                <SecurityDashboard />
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="text-foreground-secondary">
                    Configure alerts, email notifications, and system messages.
                  </div>
                  {/* Notification settings will be implemented */}
                  <div className="bg-muted rounded-lg p-4 text-center text-foreground-secondary">
                    Notification settings coming soon
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Appearance & Theme
                </h2>
                <div className="space-y-4">
                  <div className="text-foreground-secondary">
                    Customize the platform appearance, themes, and layout preferences.
                  </div>
                  {/* Appearance settings will be implemented */}
                  <div className="bg-muted rounded-lg p-4 text-center text-foreground-secondary">
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
