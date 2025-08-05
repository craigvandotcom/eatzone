'use client';

import { Loader2 } from 'lucide-react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Loading spinner component
export function LoadingSpinner({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

// Data loading state with message
export function DataLoadingState({
  message = 'Loading...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-8', className)}
    >
      <LoadingSpinner />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Food entry skeleton for dashboard
export function FoodEntrySkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3 flex-1">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5 w-20">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

// Symptom entry skeleton for dashboard
export function SymptomEntrySkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3 flex-1">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  );
}

// Progress circle skeleton
export function ProgressCircleSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Skeleton className="w-48 h-48 rounded-full" />
      <div className="space-y-2 text-center">
        <Skeleton className="h-4 w-24 mx-auto" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>
    </div>
  );
}

// Form submission loading overlay
export function FormLoadingOverlay({
  isVisible,
  message = 'Saving...',
  className,
}: {
  isVisible: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border">
        <LoadingSpinner />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Network retry state
export function NetworkRetryState({
  onRetry,
  message = 'Connection failed. Tap to retry.',
  className,
}: {
  onRetry: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className="space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {message}
        </p>
        <button
          onClick={onRetry}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Empty state with loading option
export function EmptyOrLoadingState({
  isLoading,
  isEmpty,
  loadingMessage = 'Loading entries...',
  emptyTitle = 'No entries yet',
  emptyDescription = 'Get started by adding your first entry',
  emptyIcon = '📝',
  className,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  if (isLoading) {
    return <DataLoadingState message={loadingMessage} className={className} />;
  }

  if (isEmpty) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{emptyIcon}</span>
        </div>
        <p className="text-muted-foreground text-lg font-medium">
          {emptyTitle}
        </p>
        <p className="text-muted-foreground/70 text-sm mt-1">
          {emptyDescription}
        </p>
        {children}
      </div>
    );
  }

  return null;
}
