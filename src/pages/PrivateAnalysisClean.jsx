import React, { useState } from 'react';

import Header from '../components/ui/Header';

const PrivateAnalysis = () => {
  const [activeTab, _setActiveTab] = useState('spreadsheet');

  console.log('PrivateAnalysis component initializing...');

  // Simple test state
  const [testMessage, setTestMessage] = useState('Private Analysis is loading...');

  // Test if basic component renders
  console.log('Active tab:', activeTab);
  console.log('Test message:', testMessage);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Private Analysis Test (Fixed)</h1>
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-gray-300 mb-4">Active Tab: {activeTab}</p>
          <p className="text-gray-300 mb-4">Test Message: {testMessage}</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setTestMessage('Button clicked! Basic functionality working.')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateAnalysis;
