'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bell, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrackingStreak } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Food, Symptom } from '@/lib/types';

interface FullWidthHeaderProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
  allFoods?: Food[];
  allSymptoms?: Symptom[];
}

export function FullWidthHeader({
  selectedDate,
  onDateChange,
  className,
  allFoods,
  allSymptoms,
}: FullWidthHeaderProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const streak = useTrackingStreak(allFoods, allSymptoms);

  // Format date for display - memoized to prevent excessive re-renders
  const formatDate = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalize dates to midnight for accurate comparison
    const dateMidnight = new Date(date);
    dateMidnight.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    const yesterdayMidnight = new Date(yesterday);
    yesterdayMidnight.setHours(0, 0, 0, 0);

    const dateString = dateMidnight.toDateString();
    const todayString = todayMidnight.toDateString();
    const yesterdayString = yesterdayMidnight.toDateString();

    if (dateString === todayString) {
      return 'Today';
    } else if (dateString === yesterdayString) {
      return 'Yesterday';
    } else {
      // Calculate days difference
      const daysDiff = Math.floor(
        (todayMidnight.getTime() - dateMidnight.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 2 && daysDiff <= 7) {
        // Previous 6 days (2-7 days ago): Day name only
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
        });
      } else {
        // Earlier: Date format (Nov 6, Oct 1)
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    }
  }, []);

  // Initialize currentDate on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(selectedDate || new Date());
  }, [selectedDate]);

  // Don't render until currentDate is set (client-side only)
  if (!currentDate) {
    return (
      <div
        className={cn(
          // Fixed positioning - matches actual header (prevents iOS overscroll + no layout shift)
          'fixed top-0 left-0 right-0 z-40 w-full',
          'bg-gradient-to-br from-card to-card/90 text-card-foreground',
          'backdrop-blur-sm',
          'rounded-b-lg shadow-lg',
          'px-4 py-6 pt-4',
          className
        )}
      >
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-6 bg-muted rounded w-20"></div>
          <div className="h-6 bg-muted rounded w-16"></div>
          <div className="h-6 bg-muted rounded w-8"></div>
        </div>
      </div>
    );
  }

  const handlePreviousDay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
    // Remove focus after tap (prevents background color persistence on mobile Safari)
    e.currentTarget.blur();
  };

  const handleNextDay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
    // Remove focus after tap (prevents background color persistence on mobile Safari)
    e.currentTarget.blur();
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  // Check if we can go forward (not future dates)
  const canGoForward = () => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const today = new Date();
    return tomorrow.toDateString() <= today.toDateString();
  };

  return (
    <div
      className={cn(
        // Fixed positioning - locked to viewport top (prevents iOS overscroll pull-down)
        'fixed top-0 left-0 right-0 z-40 w-full',
        // Card styling with gradient
        'bg-gradient-to-br from-card to-card/90 text-card-foreground',
        // Backdrop blur for better visibility over scrolling content
        'backdrop-blur-sm',
        // Rounded corners only on bottom
        'rounded-b-lg shadow-lg',
        // Padding
        'px-4 py-2 pt-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Streak Counter (no text) */}
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-lg font-semibold text-foreground">
            {streak}
          </span>
        </div>

        {/* Center: Day Navigation - perfectly centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousDay}
            className="h-8 w-8 text-muted-foreground active:text-foreground active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            onClick={handleToday}
            className="min-w-[80px] px-3 py-1 text-lg font-semibold text-foreground transition-colors active:text-primary active:scale-95 text-center"
          >
            {formatDate(currentDate)}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={!canGoForward()}
            className="h-8 w-8 text-muted-foreground active:text-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Notifications Placeholder */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            disabled
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
