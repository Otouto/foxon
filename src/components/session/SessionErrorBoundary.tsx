'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary specifically for session-related components
 * Provides graceful error handling and recovery options for session workflows
 */
export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('SessionErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="px-6 py-8 min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/workout" className="p-2 -ml-2">
                <ArrowLeft size={24} className="text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>

            {/* Error Message */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Oops! Something unexpected happened
                </h2>
                <p className="text-gray-600 text-sm">
                  We encountered an error while processing your session. Don&apos;t worry, your workout data should still be safe.
                </p>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h3>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">Component Stack</summary>
                      <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-lime-400 text-black font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-lime-500 transition-colors"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                
                <Link
                  href="/workout"
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl text-center block hover:bg-gray-200 transition-colors"
                >
                  Back to Workouts
                </Link>
                
                <Link
                  href="/"
                  className="w-full text-gray-500 text-sm text-center block hover:text-gray-700 transition-colors"
                >
                  Go to Home
                </Link>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500">
              If this problem persists, please contact support or try refreshing the page.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
