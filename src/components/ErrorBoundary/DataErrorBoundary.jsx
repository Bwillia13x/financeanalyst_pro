import React from 'react';

import ErrorBoundaryProvider from './ErrorBoundaryProvider';

// Specialized Error Boundary for Data Loading and API Operations
const DataErrorBoundary = ({ children, dataSource, onError }) => {
  const DataErrorFallback = ({ error, retry, retryCount }) => {
    const getDataErrorInfo = () => {
      const source = dataSource || 'data source';

      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return {
          type: 'not-found',
          title: 'Data Not Available',
          message: `The requested ${source} could not be found.`,
          suggestion: 'The data may have been moved or is temporarily unavailable.',
          canRetry: true
        };
      }

      if (error.message.includes('403') || error.message.includes('Unauthorized')) {
        return {
          type: 'unauthorized',
          title: 'Access Denied',
          message: `You don't have permission to access this ${source}.`,
          suggestion: 'Please check your subscription or contact support.',
          canRetry: false
        };
      }

      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return {
          type: 'rate-limit',
          title: 'Rate Limit Exceeded',
          message: `Too many requests to ${source}. Please wait before retrying.`,
          suggestion: 'The system will automatically retry in a few moments.',
          canRetry: true,
          autoRetry: true
        };
      }

      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        return {
          type: 'timeout',
          title: 'Request Timeout',
          message: `The ${source} is taking too long to respond.`,
          suggestion: 'This may be due to network issues or high server load.',
          canRetry: true
        };
      }

      if (error.message.includes('network') || error.message.includes('NetworkError')) {
        return {
          type: 'network',
          title: 'Network Connection Error',
          message: `Unable to connect to ${source}.`,
          suggestion: 'Check your internet connection and try again.',
          canRetry: true
        };
      }

      if (error.message.includes('parse') || error.message.includes('JSON')) {
        return {
          type: 'parse',
          title: 'Data Format Error',
          message: `The ${source} returned invalid data format.`,
          suggestion: 'This is likely a temporary server issue.',
          canRetry: true
        };
      }

      return {
        type: 'unknown',
        title: 'Data Loading Error',
        message: `Unable to load data from ${source}.`,
        suggestion: 'Please try again or contact support if the issue persists.',
        canRetry: true
      };
    };

    const errorInfo = getDataErrorInfo();

    // Auto-retry for certain error types
    React.useEffect(() => {
      if (errorInfo.autoRetry && retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
        const timer = setTimeout(() => {
          retry();
        }, delay);

        return () => clearTimeout(timer);
      }
    }, [errorInfo.autoRetry, retryCount, retry]);

    const getIconForErrorType = () => {
      switch (errorInfo.type) {
        case 'network':
          return (
            <svg
              className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          );
        case 'unauthorized':
          return (
            <svg
              className="h-6 w-6 text-red-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          );
        case 'rate-limit':
          return (
            <svg
              className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        default:
          return (
            <svg
              className="h-6 w-6 text-red-600" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          );
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 m-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIconForErrorType()}
          </div>

          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {errorInfo.title}
            </h3>

            <p className="text-gray-600 mb-4">
              {errorInfo.message}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-blue-800 text-sm">
                  {errorInfo.suggestion}
                </p>
              </div>
            </div>

            {/* Network Status Indicator */}
            <div className="flex items-center mb-4 text-sm">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  navigator.onLine ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-gray-600">
                Network: {navigator.onLine ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {errorInfo.canRetry && (
                <button
                  onClick={retry}
                  disabled={retryCount >= 3 || errorInfo.autoRetry}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                           text-white px-4 py-2 rounded-md text-sm font-medium
                           disabled:cursor-not-allowed transition-colors"
                >
                  {errorInfo.autoRetry ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25" cx="12" cy="12"
                          r="10" stroke="currentColor" strokeWidth="4"
                        />
                        <path
                          className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Auto-retrying...
                    </span>
                  ) : retryCount >= 3 ? (
                    'Max retries reached'
                  ) : (
                    `Retry (${retryCount}/3)`
                  )}
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white
                         px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Refresh Page
              </button>

              <button
                onClick={() => {
                  // Try to work offline
                  window.history.back();
                }}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Go Back
              </button>
            </div>

            {/* Offline Mode Notice */}
            {!navigator.onLine && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-orange-600 mr-2" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-orange-800 text-sm">
                    You're currently offline. Some features may not work until your connection is restored.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundaryProvider
      fallback={DataErrorFallback}
      onError={onError}
    >
      {children}
    </ErrorBoundaryProvider>
  );
};

export default DataErrorBoundary;
