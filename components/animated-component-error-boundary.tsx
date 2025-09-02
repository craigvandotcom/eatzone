'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './error-boundary';

interface AnimatedComponentErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

// Specialized error fallback for animated components
function AnimatedComponentErrorFallback({
  error,
  resetError,
}: AnimatedComponentErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60px] p-3 text-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
      </div>

      <h4 className="text-sm font-medium text-gray-900 mb-1">Display Error</h4>

      <p className="text-xs text-gray-600 mb-3 max-w-xs">
        Unable to render this component. The data may be corrupted.
      </p>

      {isDevelopment && (
        <details className="mb-2 text-left">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
            Error details
          </summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-xs">
            {error.message}
          </pre>
        </details>
      )}

      <Button
        onClick={resetError}
        size="sm"
        variant="outline"
        className="flex items-center gap-1 text-xs"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}

interface AnimatedComponentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<AnimatedComponentErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary specifically designed for animated components like progress bars
 * Provides a compact fallback UI that doesn't break the layout
 */
export function AnimatedComponentErrorBoundary({
  children,
  fallback = AnimatedComponentErrorFallback,
  onError,
}: AnimatedComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Higher-order component to wrap animated components with error boundaries
 */
export function withAnimatedComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedAnimatedComponent(props: P) {
    return (
      <AnimatedComponentErrorBoundary>
        <Component {...props} />
      </AnimatedComponentErrorBoundary>
    );
  };
}
