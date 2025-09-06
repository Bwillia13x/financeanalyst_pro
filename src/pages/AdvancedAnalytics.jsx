import { useState, useEffect } from 'react';

import CreditModeling from '../components/AdvancedAnalytics/CreditModeling';
import DerivativesModeling from '../components/AdvancedAnalytics/DerivativesModeling';
import FixedIncomeAnalytics from '../components/AdvancedAnalytics/FixedIncomeAnalytics';
import OptionsPricing from '../components/AdvancedAnalytics/OptionsPricing';
import ProductionErrorBoundary from '../components/ErrorBoundary/ProductionErrorBoundary';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState('options');

  // Listen for tab selection events from keyboard shortcuts
  useEffect(() => {
    const handleTabSelection = event => {
      setActiveTab(event.detail.tab);
    };

    window.addEventListener('select-tab', handleTabSelection);
    return () => window.removeEventListener('select-tab', handleTabSelection);
  }, []);

  const tabs = [
    { id: 'options', label: 'Options Pricing', component: OptionsPricing },
    { id: 'fixed-income', label: 'Fixed Income', component: FixedIncomeAnalytics },
    { id: 'credit', label: 'Credit Modeling', component: CreditModeling },
    { id: 'derivatives', label: 'Derivatives', component: DerivativesModeling }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Advanced Analytics</h1>
          <p className="text-foreground-secondary">
            Professional-grade pricing models and risk analytics for complex financial instruments
          </p>
        </div>

        <Card className="mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border-secondary'
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {ActiveComponent && (
              <ProductionErrorBoundary level="component">
                <ActiveComponent />
              </ProductionErrorBoundary>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
