import { AlertTriangle, RefreshCw, Bug, Download } from 'lucide-react';
import React, { Component } from 'react';

import performanceMonitor from '../../services/performanceMonitor';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to performance monitor
    performanceMonitor.logError('React Error Boundary', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props
    });

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.logToService(error, errorInfo, errorId);
    }
  }

  logToService = (error, errorInfo, errorId) => {
    // In production, send to error tracking service
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: 'anonymous', // Would be actual user ID in production
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
    };

    // Example: Send to logging service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });

    console.error('Error logged with ID:', errorId, errorData);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  downloadErrorReport = () => {
    const report = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack
      },
      errorInfo: this.state.errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      performanceData: performanceMonitor.exportData()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-report-${this.state.errorId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <h1 className="text-lg font-semibold">Something went wrong</h1>
                  <p className="text-sm text-slate-600">
                    The Model Lab encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Error details */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xs font-medium text-red-800 mb-1">Error ID</div>
                <div className="text-xs font-mono text-red-700">{this.state.errorId}</div>
              </div>

              {this.state.error && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-800 mb-1">Error Message</div>
                  <div className="text-xs text-slate-700">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600">
                This error has been automatically logged. You can try the actions below to recover.
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.downloadErrorReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Error Report
                </button>
              </div>

              {/* Development details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                    <Bug className="w-3 h-3" />
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-slate-100 rounded border text-xs">
                    <div className="font-medium mb-2">Stack Trace:</div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-800 overflow-x-auto">
                      {this.state.error.stack}
                    </pre>

                    {this.state.errorInfo?.componentStack && (
                      <>
                        <div className="font-medium mb-2 mt-3">Component Stack:</div>
                        <pre className="whitespace-pre-wrap text-xs text-slate-800 overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for error boundaries
export const withErrorBoundary = (Component, fallback) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error reporting
export const useErrorHandler = () => {
  const reportError = (error, context = {}) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    performanceMonitor.logError('Manual Error Report', {
      errorId,
      message: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    return errorId;
  };

  const reportWarning = (message, context = {}) => {
    const warningId = `warn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    performanceMonitor.logWarning('Manual Warning Report', {
      warningId,
      message,
      context,
      timestamp: new Date().toISOString()
    });

    return warningId;
  };

  return { reportError, reportWarning };
};

// Async error boundary hook
export const useAsyncError = () => {
  const [, setError] = React.useState();

  return React.useCallback((error) => {
    setError(() => {
      throw error;
    });
  }, [setError]);
};

export default ErrorBoundary;
