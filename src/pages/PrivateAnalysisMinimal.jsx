import React, { useState } from 'react';

import Header from '../components/ui/Header';

const PrivateAnalysisMinimal = () => {
  const [activeTab] = useState('spreadsheet');

  console.log('PrivateAnalysisMinimal component initializing...');

  // Simple test state
  const [testMessage, setTestMessage] = useState('Private Analysis is loading...');

  // Test if basic component renders
  console.log('Active tab:', activeTab);
  console.log('Test message:', testMessage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Private Analysis Test</h1>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-foreground-secondary mb-4">Active Tab: {activeTab}</p>
          <p className="text-foreground-secondary mb-4">Test Message: {testMessage}</p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-smooth"
            onClick={() => setTestMessage('Button clicked! Basic functionality working.')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateAnalysisMinimal;
