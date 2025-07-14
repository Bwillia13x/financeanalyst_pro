import React from 'react';

import Icon from './AppIcon';
import Button from './ui/Button';

class EnhancedErrorBoundary extends React.Component {
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

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.generateErrorId();

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error details
    console.error('Error caught by enhanced boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      props: this.props,
      retryCount: this.state.retryCount
    });

    // Send to monitoring service in production
    if (import.meta.env.PROD && import.meta.env.VITE_MONITORING_ENDPOINT) {
      this.reportError(error, errorInfo, errorId);
    }
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async reportError(error, errorInfo, errorId) {
    try {
      await fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error_boundary',
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          retryCount: this.state.retryCount,
          fallbackComponent: this.props.fallback ? 'custom' : 'default'
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleRetry,
          this.state.errorId
        );
      }

      const { error, errorId, retryCount } = this.state;
      const isDevelopment = import.meta.env.DEV;
      const maxRetries = 3;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full bg-card border border-border shadow-elevation-2 rounded-lg p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-6">
                <Icon name="AlertTriangle" size={32} className="text-destructive" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {retryCount > 0 ? 'Still having trouble?' : 'Oops! Something went wrong'}
              </h1>

              {/* Error Description */}
              <p className="text-muted-foreground mb-6">
                {retryCount >= maxRetries
                  ? 'This error persists after multiple attempts. Please try reloading the page or contact support.'
                  : 'We encountered an unexpected error. Our team has been notified and is working on a fix.'}
              </p>

              {/* Retry Count */}
              {retryCount > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6">
                  <p className="text-sm text-warning-foreground">
                    Retry attempt: {retryCount}/{maxRetries}
                  </p>
                </div>
              )}

              {/* Error ID */}
              {errorId && (
                <div className="bg-muted/50 rounded-lg p-3 mb-6">
                  <p className="text-sm text-muted-foreground">
                    Error ID: <code className="font-mono text-foreground">{errorId}</code>
                  </p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(errorId)}
                    className="text-xs text-primary hover:text-primary/80 mt-1"
                  >
                    Copy to clipboard
                  </button>
                </div>
              )}

              {/* Development Error Details */}
              {isDevelopment && error && (
                <details className="text-left bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
                  <summary className="cursor-pointer font-medium text-destructive mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Message:</strong>
                      <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    <div>
                      <strong>Component:</strong>
                      <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto max-h-24">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {retryCount < maxRetries && (
                  <Button onClick={this.handleRetry} variant="default" iconName="RotateCcw">
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant={retryCount >= maxRetries ? 'default' : 'outline'}
                  iconName="RefreshCw"
                >
                  Reload Page
                </Button>

                <Button onClick={this.handleGoHome} variant="ghost" iconName="Home">
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-xs text-muted-foreground space-y-1">
                <p>If this problem persists, please contact support with the error ID above.</p>
                {import.meta.env.VITE_SUPPORT_EMAIL && (
                  <p>
                    Email:{' '}
                    <a
                      href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL}?subject=Error Report - ${errorId}`}
                      className="text-primary hover:underline"
                    >
                      {import.meta.env.VITE_SUPPORT_EMAIL}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, fallback = null) => {
  const WrappedComponent = props => (
    <EnhancedErrorBoundary fallback={fallback}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const reportError = React.useCallback((error, errorInfo = {}) => {
    console.error('Manual error report:', error, errorInfo);

    if (import.meta.env.PROD && import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual_error_report',
          message: error.message || String(error),
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          ...errorInfo
        })
      }).catch(console.error);
    }
  }, []);

  return { reportError };
};

export default EnhancedErrorBoundary;
