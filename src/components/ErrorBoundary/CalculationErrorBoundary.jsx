import React from 'react';

import ErrorBoundaryProvider from './ErrorBoundaryProvider';

// Specialized Error Boundary for Financial Calculations
const CalculationErrorBoundary = ({ children, calculationType, onError }) => {
  const CalculationErrorFallback = ({ error, retry, retryCount }) => {
    const getCalculationErrorInfo = () => {
      const type = calculationType || 'calculation';

      if (error.message.includes('division by zero') || error.message.includes('Infinity')) {
        return {
          title: 'Invalid Calculation Input',
          message: `The ${type} contains invalid values (division by zero or infinite values). Please check your input data.`,
          suggestion: 'Verify that all denominators have non-zero values',
          canRetry: false
        };
      }

      if (error.message.includes('NaN') || error.message.includes('invalid number')) {
        return {
          title: 'Invalid Number Format',
          message: `Some input values for the ${type} are not valid numbers.`,
          suggestion: 'Check that all inputs contain only numeric values',
          canRetry: false
        };
      }

      if (error.message.includes('timeout') || error.message.includes('performance')) {
        return {
          title: 'Calculation Timeout',
          message: `The ${type} is taking too long to complete. This might be due to complex data.`,
          suggestion: 'Try reducing the data size or simplifying the model',
          canRetry: true
        };
      }

      return {
        title: 'Calculation Error',
        message: `An error occurred during the ${type}. Your input data has been preserved.`,
        suggestion: 'Please try again or contact support if the issue persists',
        canRetry: true
      };
    };

    const errorInfo = getCalculationErrorInfo();

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              {errorInfo.title}
            </h3>

            <p className="text-red-700 mb-4">
              {errorInfo.message}
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-yellow-800 text-sm">
                  <strong>Suggestion:</strong> {errorInfo.suggestion}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              {errorInfo.canRetry && (
                <button
                  onClick={retry}
                  disabled={retryCount >= 2}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400
                           text-white px-4 py-2 rounded-md text-sm font-medium
                           disabled:cursor-not-allowed transition-colors"
                >
                  {retryCount >= 2 ? 'Max retries reached' : 'Retry Calculation'}
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white
                         px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reset Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-red-600 text-sm cursor-pointer">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundaryProvider
      fallback={CalculationErrorFallback}
      onError={onError}
    >
      {children}
    </ErrorBoundaryProvider>
  );
};

export default CalculationErrorBoundary;
