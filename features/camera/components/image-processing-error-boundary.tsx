'use client';

import React from 'react';
import { Camera, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ErrorBoundary,
  type ErrorFallbackProps,
} from '@/components/error-boundary';

interface ImageProcessingErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
  onRetry?: () => void;
  onCancel?: () => void;
}

function ImageProcessingErrorFallback({
  error,
  resetError,
  onRetry,
  onCancel,
}: ImageProcessingErrorFallbackProps) {
  const isCompressionError =
    error.message.includes('compression') ||
    error.message.includes('canvas') ||
    error.message.includes('toDataURL');

  const isValidationError =
    error.message.includes('validation') ||
    error.message.includes('invalid') ||
    error.message.includes('size');

  const isCameraError =
    error.message.includes('camera') ||
    error.message.includes('getUserMedia') ||
    error.message.includes('MediaStream');

  const isUploadError =
    error.message.includes('upload') ||
    error.message.includes('fetch') ||
    error.message.includes('network');

  const getErrorDetails = () => {
    if (isCameraError) {
      return {
        title: 'Camera Access Problem',
        description:
          'Unable to access your camera. Please check permissions and try again.',
        icon: <Camera className="h-8 w-8 text-orange-600" />,
        bgColor: 'bg-orange-100',
      };
    }

    if (isCompressionError) {
      return {
        title: 'Image Processing Failed',
        description:
          'Unable to process the captured image. This might be due to browser limitations.',
        icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
        bgColor: 'bg-red-100',
      };
    }

    if (isValidationError) {
      return {
        title: 'Invalid Image',
        description:
          "The image doesn't meet our requirements. Please try with a different image.",
        icon: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
        bgColor: 'bg-yellow-100',
      };
    }

    if (isUploadError) {
      return {
        title: 'Upload Failed',
        description:
          'Unable to upload your image. Please check your connection and try again.',
        icon: <AlertTriangle className="h-8 w-8 text-blue-600" />,
        bgColor: 'bg-blue-100',
      };
    }

    return {
      title: 'Image Processing Error',
      description:
        'Something went wrong while processing your image. Please try again.',
      icon: <AlertTriangle className="h-8 w-8 text-gray-600" />,
      bgColor: 'bg-gray-100',
    };
  };

  const { title, description, icon, bgColor } = getErrorDetails();

  const handleRetry = () => {
    resetError();
    onRetry?.();
  };

  const handleCancel = () => {
    resetError();
    onCancel?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
        <div
          className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-4 mx-auto`}
        >
          {icon}
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        <div className="flex gap-3 justify-center">
          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
          )}

          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground active:text-foreground transition-colors">
              Show error details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

interface ImageProcessingErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onCancel?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ImageProcessingErrorBoundary({
  children,
  onRetry,
  onCancel,
  onError,
}: ImageProcessingErrorBoundaryProps) {
  const fallbackComponent = React.useCallback(
    (props: ErrorFallbackProps) => (
      <ImageProcessingErrorFallback
        {...props}
        onRetry={onRetry}
        onCancel={onCancel}
      />
    ),
    [onRetry, onCancel]
  );

  return (
    <ErrorBoundary fallback={fallbackComponent} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
