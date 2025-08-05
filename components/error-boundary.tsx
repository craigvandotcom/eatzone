'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>

      <p className="text-sm text-gray-600 mb-4 max-w-md">
        We&apos;re sorry, but something unexpected happened. Please try
        refreshing the page.
      </p>

      {isDevelopment && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Show error details
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-w-md">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      )}

      <Button onClick={resetError} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

// Supabase-specific error fallback
export function SupabaseErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('connection');

  const isAuthError =
    error.message.includes('auth') ||
    error.message.includes('unauthorized') ||
    error.message.includes('session');

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        {isNetworkError ? (
          <span className="text-2xl">📡</span>
        ) : isAuthError ? (
          <span className="text-2xl">🔐</span>
        ) : (
          <AlertTriangle className="h-8 w-8 text-blue-600" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isNetworkError
          ? 'Connection Problem'
          : isAuthError
            ? 'Authentication Required'
            : 'Database Error'}
      </h3>

      <p className="text-sm text-gray-600 mb-4 max-w-md">
        {isNetworkError
          ? 'Unable to connect to the server. Please check your internet connection.'
          : isAuthError
            ? 'Your session has expired. Please log in again.'
            : 'There was a problem loading your data. Please try again.'}
      </p>

      <Button onClick={resetError} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        {isAuthError ? 'Go to Login' : 'Retry'}
      </Button>
    </div>
  );
}

// Main Error Boundary class component
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for Supabase operations
export function withSupabaseErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={SupabaseErrorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(String(error)));
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by Error Boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}
