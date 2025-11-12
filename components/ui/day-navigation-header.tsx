'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bell, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrackingStreak } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Food, Symptom } from '@/lib/types';

interface DayNavigationHeaderProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
  allFoods?: Food[];
  allSymptoms?: Symptom[];
}

export function DayNavigationHeader({
  selectedDate,
  onDateChange,
  className,
  allFoods,
  allSymptoms,
}: DayNavigationHeaderProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const streak = useTrackingStreak(allFoods, allSymptoms);

  // Format date for display - memoized to prevent excessive re-renders
  const formatDate = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateString = date.toDateString();
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    if (dateString === todayString) {
      return 'Today';
    } else if (dateString === yesterdayString) {
      return 'Yesterday';
    } else {
      // Format as "Mon, Jan 15"
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
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
          'mt-[-1.5rem] mb-6',
          'bg-gradient-to-br from-card to-card/90 text-card-foreground',
          'rounded-b-lg shadow-lg',
          'px-4 py-6 pt-8', // Match the actual component padding
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

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
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
        // Extend only to the top, keep same width as other cards
        'mt-[-1.5rem] mb-6',
        // Card styling with gradient
        'bg-gradient-to-br from-card to-card/90 text-card-foreground',
        // Rounded corners only on bottom
        'rounded-b-lg shadow-lg',
        // Padding - extra top padding to compensate for negative margin
        'px-4 py-6 pt-8',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Streak Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-lg font-semibold text-foreground">
              {streak}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            day{streak !== 1 ? 's' : ''} streak
          </span>
        </div>

        {/* Center: Day Navigation */}
        <div className="flex items-center gap-2">
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
            className="px-3 py-1 text-sm font-medium text-foreground transition-colors active:text-primary active:scale-95"
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
