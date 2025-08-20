import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react';
import Button from './Button';

/**
 * Enhanced Error Boundary with user-friendly error handling and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Send error to monitoring service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Integration point for error monitoring services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous'
    };

    // Example integration (replace with actual service)
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Fail silently if error reporting fails
      });
    } catch (e) {
      // Fail silently
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      component: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`FinanceAnalyst Pro Error Report - ${errorId}`);
    const body = encodeURIComponent(
      `Error Details:\n\n` +
      `Error ID: ${errorId}\n` +
      `Message: ${error?.message}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `URL: ${window.location.href}\n\n` +
      `Technical Details:\n${error?.stack}\n\n` +
      `Component Stack:\n${errorInfo?.componentStack}`
    );
    
    window.open(`mailto:support@financeanalystpro.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, variant = 'default' } = this.props;
      const { error, errorId, retryCount } = this.state;

      // Use custom fallback if provided
      if (FallbackComponent) {
        if (React.isValidElement(FallbackComponent)) {
          return FallbackComponent;
        }
        if (typeof FallbackComponent === 'function') {
          return <FallbackComponent error={error} retry={this.handleRetry} />;
        }
      }

      // Determine error severity and appropriate response
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      const isDataError = error?.message?.includes('Cannot read') || error?.message?.includes('undefined');
      const isCriticalError = retryCount > 2;

      if (variant === 'minimal') {
        return (
          <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 text-sm">Something went wrong</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleRetry}
              className="ml-3 text-red-700 hover:text-red-900"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        );
      }

      if (variant === 'inline') {
        return (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Unable to load this section
                </h4>
                <p className="text-sm text-red-700 mb-2">
                  {isNetworkError ? 'Check your internet connection and try again.' :
                   isDataError ? 'There was an issue with the data format.' :
                   'An unexpected error occurred.'}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Full-page error boundary (default)
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-slate-200 p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              {isCriticalError ? 'Application Error' : 'Something went wrong'}
            </h1>

            {/* Error Message */}
            <p className="text-slate-600 mb-6">
              {isCriticalError ? (
                'The application encountered a critical error. Please refresh the page or contact support.'
              ) : isNetworkError ? (
                'Unable to connect to our servers. Please check your internet connection and try again.'
              ) : isDataError ? (
                'There was an issue processing the data. This might be a temporary problem.'
              ) : (
                'An unexpected error occurred. Our team has been notified and is working on a fix.'
              )}
            </p>

            {/* Error ID for support */}
            {errorId && (
              <div className="bg-slate-100 rounded-lg p-3 mb-6 text-left">
                <div className="text-xs font-mono text-slate-500 mb-1">Error ID (for support):</div>
                <div className="text-sm font-mono text-slate-700 break-all">{errorId}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isCriticalError && (
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center"
                  variant="primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>

              <Button
                onClick={this.handleReportError}
                variant="ghost"
                className="flex items-center justify-center text-slate-600 hover:text-slate-800"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500">
              <p>
                Need immediate help?{' '}
                <a 
                  href="mailto:support@financeanalystpro.com" 
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </p>
            </div>

            {/* Development Info */}
            {import.meta.env.DEV && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
                  Show Technical Details
                </summary>
                <div className="mt-2 p-3 bg-slate-100 rounded text-xs font-mono text-slate-700 overflow-auto max-h-40">
                  <div className="mb-2 font-semibold">Error:</div>
                  <div className="mb-2">{error.message}</div>
                  <div className="mb-2 font-semibold">Stack:</div>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional component error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error, errorInfo = {}) => {
    console.error('Error captured:', error);
    setError({ error, errorInfo });
  }, []);

  React.useEffect(() => {
    if (error) {
      // Log error to monitoring service
      console.error('Captured error:', error);
    }
  }, [error]);

  return { error, resetError, captureError };
};

// Higher-order component for adding error boundaries
export const withErrorBoundary = (Component, errorBoundaryConfig = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;
