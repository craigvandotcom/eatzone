'use client';

import { useMemo } from 'react';
import type { TimelineEntry } from '@/lib/types';
import { getCategoryInfoSafe } from '@/lib/symptoms/symptom-index';
import { Card, CardContent } from '@/components/ui/card';

interface UnifiedTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

export function UnifiedTimeline({
  entries,
  className = '',
}: UnifiedTimelineProps) {
  const safeEntries = entries || [];
  const totalEntries = safeEntries.length;

  // Calculate unique ingredients count from food entries
  const uniqueIngredientsCount = useMemo(() => {
    const allIngredients = safeEntries.flatMap(entry =>
      entry.type === 'food' ? entry.data.ingredients || [] : []
    );

    // Count unique ingredients by name (case-insensitive)
    const uniqueNames = new Set(
      allIngredients.map(ing => ing.name.toLowerCase().trim())
    );

    return uniqueNames.size;
  }, [safeEntries]);

  // Calculate position as percentage of day
  const getTimelinePosition = (timestamp: string): number => {
    const date = new Date(timestamp);
    const hours = date.getHours() + date.getMinutes() / 60;
    return (hours / 24) * 100; // Returns percentage for left position
  };

  // Group entries by similar time positions to handle overlaps - memoized for performance
  const groupedEntries = useMemo(() => {
    return safeEntries.reduce(
      (groups, entry) => {
        const position = getTimelinePosition(entry.timestamp);
        const key = Math.round(position); // Round to nearest percentage for grouping

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push({ ...entry, position });
        return groups;
      },
      {} as Record<number, Array<TimelineEntry & { position: number }>>
    );
  }, [safeEntries]);

  // Time labels for the timeline
  const timeLabels = [
    { time: '12am', position: 0 },
    { time: '3am', position: 12.5 },
    { time: '6am', position: 25 },
    { time: '9am', position: 37.5 },
    { time: '12pm', position: 50 },
    { time: '3pm', position: 62.5 },
    { time: '6pm', position: 75 },
    { time: '9pm', position: 87.5 },
    { time: '12am', position: 100 },
  ];

  // Empty state
  if (totalEntries === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">Summary</h3>
          <span className="text-muted-foreground text-sm">
            {uniqueIngredientsCount} unique ingredient
            {uniqueIngredientsCount !== 1 ? 's' : ''}
          </span>
        </div>
        <Card>
          <CardContent className="pt-4">
            {/* Timeline container */}
            <div className="relative">
              {/* Timeline line */}
              <div className="relative h-12 mb-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" />

                {/* Time labels */}
                <div className="relative h-full">
                  {timeLabels.map((label, index) => (
                    <div
                      key={`${label.time}-${index}`}
                      className="absolute top-full transform -translate-x-1/2"
                      style={{ left: `${label.position}%` }}
                    >
                      {/* Tick mark */}
                      <div className="w-0.5 h-2 bg-border mx-auto mb-1" />
                      {/* Time label */}
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {label.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">Summary</h3>
        <span className="text-muted-foreground text-sm">
          {uniqueIngredientsCount} unique ingredient
          {uniqueIngredientsCount !== 1 ? 's' : ''}
        </span>
      </div>
      <Card>
        <CardContent className="pt-4">
          {/* Timeline container */}
          <div className="relative">
            {/* Timeline line with markers positioned on it */}
            <div className="relative h-12 mb-4">
              {/* Timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" />

              {/* Entry markers - positioned ON the timeline */}
              {Object.entries(groupedEntries).map(([_key, groupEntries]) => {
                const avgPosition =
                  groupEntries.reduce((sum, e) => sum + e.position, 0) /
                  groupEntries.length;

                return groupEntries.map((entry, index) => {
                  // Determine emoji and border color based on entry type
                  let emoji = '';
                  let borderColor = '';
                  let entryName = '';

                  if (entry.type === 'food') {
                    emoji = '🍽️';
                    borderColor = 'border-zone-green';
                    entryName = entry.data.name;
                  } else if (entry.type === 'signal') {
                    const categoryInfo = getCategoryInfoSafe(
                      entry.data.category
                    );
                    emoji = categoryInfo?.icon || '⚡';
                    borderColor = 'border-destructive';
                    entryName = entry.data.name;
                  }

                  // Limit stacking to prevent overflow - clamp offset between -48px (6 entries) and 0
                  const maxStackHeight = 6;
                  const stackOffset = Math.max(
                    index * -8,
                    -(maxStackHeight - 1) * 8
                  );

                  return (
                    <div
                      key={entry.id}
                      className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                      style={{
                        left: `${avgPosition}%`,
                        marginTop: `${stackOffset}px`, // Stack overlapping entries above timeline
                        zIndex: 10 + index,
                      }}
                      title={`${entryName} - ${new Date(
                        entry.timestamp
                      ).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 border-2 ${borderColor} bg-transparent rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer touch-manipulation`}
                      >
                        <span className="text-foreground text-xs sm:text-sm">
                          {emoji}
                        </span>
                      </div>
                    </div>
                  );
                });
              })}

              {/* Time labels */}
              <div className="relative h-full">
                {timeLabels.map((label, index) => (
                  <div
                    key={`${label.time}-${index}`}
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${label.position}%` }}
                  >
                    {/* Tick mark */}
                    <div className="w-0.5 h-2 bg-border mx-auto mb-1" />
                    {/* Time label */}
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {label.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
