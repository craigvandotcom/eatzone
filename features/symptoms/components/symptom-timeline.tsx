'use client';

import type { Symptom } from '@/lib/types';
import { getCategoryInfo } from '@/lib/symptoms/symptom-index';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SymptomTimelineProps {
  symptoms: Symptom[];
  className?: string;
}

export function SymptomTimeline({
  symptoms,
  className = '',
}: SymptomTimelineProps) {
  const safeSymptoms = symptoms || [];
  const totalSymptoms = safeSymptoms.length;

  // Calculate position as percentage of day
  const getTimelinePosition = (timestamp: string): number => {
    const date = new Date(timestamp);
    const hours = date.getHours() + date.getMinutes() / 60;
    return (hours / 24) * 100; // Returns percentage for left position
  };

  // Group symptoms by similar time positions to handle overlaps
  const groupedSymptoms = safeSymptoms.reduce(
    (groups, symptom) => {
      const position = getTimelinePosition(symptom.timestamp);
      const key = Math.round(position); // Round to nearest percentage for grouping

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...symptom, position });
      return groups;
    },
    {} as Record<number, Array<Symptom & { position: number }>>
  );

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
  if (totalSymptoms === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Today's Symptoms</CardTitle>
          <CardDescription>(0 recorded)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Timeline container */}
          <div className="relative">
            {/* Timeline line */}
            <div className="relative h-12 mb-4">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" />

              {/* Empty state message positioned on timeline */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="text-sm text-muted-foreground bg-card px-3 py-1 rounded border">
                  No symptoms recorded today
                </span>
              </div>

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
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Today's Symptoms</CardTitle>
        <CardDescription>({totalSymptoms} recorded)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Timeline container */}
        <div className="relative">
          {/* Timeline line with markers positioned on it */}
          <div className="relative h-12 mb-4">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" />

            {/* Symptom markers - positioned ON the timeline */}
            {Object.entries(groupedSymptoms).map(([_key, groupSymptoms]) => {
              const avgPosition =
                groupSymptoms.reduce((sum, s) => sum + s.position, 0) /
                groupSymptoms.length;

              return groupSymptoms.map((symptom, index) => {
                const categoryInfo = getCategoryInfo(symptom.category);
                const emoji = categoryInfo?.icon || '⚡';

                return (
                  <div
                    key={symptom.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                    style={{
                      left: `${avgPosition}%`,
                      top: `50%`, // Center on the timeline
                      transform: `translate(-50%, calc(-50% + ${index * -8}px))`, // Stack overlapping symptoms above timeline
                      zIndex: 10 + index,
                    }}
                    title={`${symptom.name} - ${new Date(
                      symptom.timestamp
                    ).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary bg-transparent rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer touch-manipulation">
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
  );
}
