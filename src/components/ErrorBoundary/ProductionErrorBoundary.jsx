import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import React from 'react';

import Button from '../ui/Button';

class ProductionErrorBoundary extends React.Component {
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
    const errorId = this.generateErrorId();

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to monitoring service
    this.logToMonitoring(error, errorInfo, errorId);

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  generateErrorId() {
    return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  logToMonitoring(error, errorInfo, errorId) {
    try {
      // Send to Sentry if available
      if (window.Sentry) {
        window.Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', true);
          scope.setContext('errorInfo', errorInfo);
          scope.setContext('errorId', errorId);
          scope.setLevel('error');
          window.Sentry.captureException(error);
        });
      }

      // Send to custom monitoring endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.props.userId || 'anonymous'
        })
      }).catch(err => {
        console.warn('Failed to send error to monitoring:', err);
      });

    } catch (monitoringError) {
      console.warn('Error in monitoring:', monitoringError);
    }
  }

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

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportIssue = () => {
    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@financeanalystpro.com?subject=${subject}&amp;body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, level = 'component' } = this.props;

      // If custom fallback provided, use it
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
          />
        );
      }

      // Component-level error (smaller footprint)
      if (level === 'component') {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-red-800">
                  Component Error
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  This component encountered an error and couldn&apos;t be displayed.
                </p>
                <div className="mt-3 flex space-x-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Page-level error (full page)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. An unexpected error occurred while loading this page.
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                <div className="text-xs text-gray-500 mb-1">Error ID</div>
                <div className="text-sm font-mono text-gray-800">{this.state.errorId}</div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <div className="flex space-x-3">
                  <Button
                    onClick={this.handleGoHome}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>

                  <Button
                    onClick={this.handleReportIssue}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </div>

                <Button
                  onClick={this.handleReload}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Debug Information
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error?.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
                    </div>
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

export default ProductionErrorBoundary;
