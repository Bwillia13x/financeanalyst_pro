import { TrendingUp, Percent } from 'lucide-react';
import React from 'react';

// Simplified test version of AnalysisResults to isolate React errors
const AnalysisResultsTest = ({
  data,
  adjustedValues,
  modelInputs,
  calculateDCF,
  formatCurrency,
  formatPercentage
}) => {
  console.log('AnalysisResultsTest - Props received:', {
    data: !!data,
    adjustedValues: !!adjustedValues,
    modelInputs: !!modelInputs,
    calculateDCF: !!calculateDCF,
    formatCurrency: !!formatCurrency,
    formatPercentage: !!formatPercentage
  });

  // Test MetricCard component in isolation
  const MetricCard = ({ title, value, trend, description, icon: Icon }) => {
    console.log('MetricCard rendering:', { title, value, trend, description, icon: !!Icon });

    if (!Icon) {
      console.error('MetricCard: Icon is missing!');
      return <div>Error: Missing icon for {title}</div>;
    }

    try {
      return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  trend === 'up'
                    ? 'bg-green-900/30 text-green-400'
                    : trend === 'down'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-300">{title}</div>
                <div className="text-xs text-gray-500 mt-1">{description}</div>
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
      );
    } catch (error) {
      console.error('MetricCard render error:', error);
      return <div>Error rendering MetricCard: {title}</div>;
    }
  };

  // Test basic data access
  try {
    if (!data?.statements?.incomeStatement) {
      return (
        <div className="p-6 text-white">
          <h2>No Data Available</h2>
          <p>Income statement data is missing.</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }

    // Test simple KPI rendering
    const testKpis = [
      {
        title: 'Test Metric 1',
        value: '10.5%',
        trend: 'up',
        description: 'Test description 1',
        icon: TrendingUp
      },
      {
        title: 'Test Metric 2',
        value: '25.3%',
        trend: 'down',
        description: 'Test description 2',
        icon: Percent
      }
    ];

    return (
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-3xl font-bold mb-4 text-white">Analysis Results Test</h2>
          <p className="text-gray-400">Testing basic rendering functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testKpis.map((kpi, index) => (
            <MetricCard key={index} {...kpi} />
          ))}
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Data Check</h3>
          <p className="text-gray-300">Data exists: {data ? 'Yes' : 'No'}</p>
          <p className="text-gray-300">
            Income statement: {data?.statements?.incomeStatement ? 'Yes' : 'No'}
          </p>
          <p className="text-gray-300">CalculateDCF function: {calculateDCF ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AnalysisResultsTest render error:', error);
    return (
      <div className="p-6 text-white">
        <h2>Error in AnalysisResultsTest</h2>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
};

export default AnalysisResultsTest;
