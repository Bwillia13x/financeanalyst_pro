import React, { Component, createContext, useContext } from 'react';

// Error Boundary Context for advanced error handling
const ErrorBoundaryContext = createContext({
  reportError: () => {},
  clearError: () => {},
  errorHistory: []
});

export const useErrorBoundary = () => useContext(ErrorBoundaryContext);

// Enhanced Error Boundary with financial application specific handling
class ErrorBoundaryProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorHistory: [],
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger error UI
    return {
      hasError: true,
      error,
      errorId: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with financial context
    const enhancedError = this.enhanceErrorWithContext(error, errorInfo);

    // Track error for monitoring
    import('../../utils/performanceMonitoring')
      .then(mod => {
        if (mod?.trackError) {
          mod.trackError(error, errorInfo);
        }
      })
      .catch(() => {
        // Performance monitoring is optional; ignore errors
      });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Enhanced Context:', enhancedError);
      console.groupEnd();
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorHistory: [
        ...prevState.errorHistory.slice(-4), // Keep last 5 errors
        {
          error: error.message,
          timestamp: new Date().toISOString(),
          errorId: prevState.errorId,
          component: errorInfo.componentStack?.split('\n')[1]?.trim()
        }
      ]
    }));

    // Send error to monitoring service
    this.reportErrorToService(enhancedError);
  }

  enhanceErrorWithContext = (error, errorInfo) => {
    // Add financial application specific context
    const financialContext = {
      // Current financial data state
      hasFinancialData: this.hasFinancialDataInDOM(),

      // Active calculations
      activeCalculations: this.getActiveCalculations(),

      // User interaction context
      lastUserAction: this.getLastUserAction(),

      // Performance context
      memoryUsage: this.getMemoryUsage(),

      // Network status
      isOnline: navigator.onLine,

      // App state
      currentRoute: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    return {
      originalError: error,
      errorInfo,
      financialContext,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack
    };
  };

  hasFinancialDataInDOM = () => {
    // Check if financial data components are present
    return !!(
      document.querySelector('[data-financial-component]') ||
      document.querySelector('.financial-spreadsheet') ||
      document.querySelector('.dcf-calculator')
    );
  };

  getActiveCalculations = () => {
    // Extract active calculation context
    const calculations = [];

    // Check for DCF calculations
    if (document.querySelector('[data-dcf-active]')) {
      calculations.push('DCF');
    }

    // Check for Monte Carlo simulations
    if (document.querySelector('[data-montecarlo-active]')) {
      calculations.push('Monte Carlo');
    }

    // Check for LBO modeling
    if (document.querySelector('[data-lbo-active]')) {
      calculations.push('LBO');
    }

    return calculations;
  };

  getLastUserAction = () => {
    // Get last recorded user action from session storage
    try {
      return JSON.parse(sessionStorage.getItem('lastUserAction') || '{}');
    } catch {
      return {};
    }
  };

  getMemoryUsage = () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  };

  reportErrorToService = async enhancedError => {
    try {
      // In production, send to your error monitoring service
      if (import.meta.env.PROD) {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enhancedError)
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: true,
      retryCount: prevState.retryCount + 1
    }));

    // Clear error state after a brief moment
    setTimeout(() => {
      this.setState({ isRecovering: false });
    }, 1000);
  };

  handleReportFeedback = feedback => {
    // Collect user feedback about the error
    const errorReport = {
      errorId: this.state.errorId,
      feedback,
      timestamp: new Date().toISOString()
    };

    // Store locally and optionally send to server
    try {
      const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingReports.push(errorReport);
      localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-10)));
    } catch (e) {
      console.error('Failed to save error report:', e);
    }
  };

  clearError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false
    });
  };

  reportError = (error, context = {}) => {
    // Allow manual error reporting from components
    const enhancedError = this.enhanceErrorWithContext(error, { context });
    this.reportErrorToService(enhancedError);
  };

  render() {
    const { hasError, error, isRecovering, retryCount } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    // Context value for child components
    const contextValue = {
      reportError: this.reportError,
      clearError: this.clearError,
      errorHistory: this.state.errorHistory
    };

    if (hasError && !isRecovering) {
      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <ErrorBoundaryContext.Provider value={contextValue}>
            <CustomFallback
              error={error}
              retry={this.handleRetry}
              retryCount={retryCount}
              onReportFeedback={this.handleReportFeedback}
            />
          </ErrorBoundaryContext.Provider>
        );
      }

      // Default financial application error UI
      return (
        <ErrorBoundaryContext.Provider value={contextValue}>
          <FinancialErrorFallback
            error={error}
            retry={this.handleRetry}
            retryCount={retryCount}
            onReportFeedback={this.handleReportFeedback}
          />
        </ErrorBoundaryContext.Provider>
      );
    }

    return (
      <ErrorBoundaryContext.Provider value={contextValue}>{children}</ErrorBoundaryContext.Provider>
    );
  }
}

// Financial Application Specific Error UI
const FinancialErrorFallback = ({ error, retry, retryCount, onReportFeedback }) => {
  const isDataError =
    error?.message?.toLowerCase().includes('data') ||
    error?.message?.toLowerCase().includes('calculation') ||
    error?.message?.toLowerCase().includes('financial');

  const isNetworkError =
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    !navigator.onLine;

  const getErrorType = () => {
    if (isNetworkError) return 'network';
    if (isDataError) return 'data';
    return 'application';
  };

  const getErrorMessage = () => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Issue',
          message: 'Unable to load financial data. Please check your internet connection.',
          action: 'Retry Connection'
        };
      case 'data':
        return {
          title: 'Data Processing Error',
          message: 'There was an issue processing your financial data. Your work has been saved.',
          action: 'Reload Data'
        };
      default:
        return {
          title: 'Application Error',
          message: "Something went wrong. Don't worry - your financial data is safe.",
          action: 'Try Again'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-800 rounded-lg shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-white mb-4">{errorInfo.title}</h1>
        <p className="text-gray-300 mb-8 leading-relaxed">{errorInfo.message}</p>

        {/* Data Safety Assurance */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-green-400 mb-2">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Your data is secure</span>
          </div>
          <p className="text-green-300 text-sm">
            All financial models and calculations are automatically saved
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={retry}
            disabled={retryCount >= 3}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                     text-white font-medium py-3 px-6 rounded-lg transition-colors
                     disabled:cursor-not-allowed"
          >
            {retryCount >= 3 ? 'Maximum retries reached' : errorInfo.action}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white
                     font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Refresh Page
          </button>

          <details className="mt-6">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-3 p-3 bg-slate-700 rounded text-left text-xs text-gray-300 font-mono">
              <p>
                <strong>Error:</strong> {error.message}
              </p>
              <p>
                <strong>Retry Count:</strong> {retryCount}
              </p>
              <p>
                <strong>Time:</strong> {new Date().toLocaleString()}
              </p>
            </div>
          </details>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-gray-400 text-sm mb-3">Was this error unexpected?</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => onReportFeedback('helpful')}
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              👍 This helped
            </button>
            <button
              onClick={() => onReportFeedback('confusing')}
              className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
            >
              🤔 Confusing
            </button>
            <button
              onClick={() => onReportFeedback('unhelpful')}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              👎 Not helpful
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryProvider;
