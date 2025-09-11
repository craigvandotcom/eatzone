'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, Flame, Utensils, Activity } from 'lucide-react';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';
import { Food, Symptom } from '@/lib/types';

interface InsightsViewProps {
  recentFoods?: Food[];
  recentSymptoms?: Symptom[];
  allFoods?: Food[];
  allSymptoms?: Symptom[];
}

export function InsightsView({ allFoods, allSymptoms }: InsightsViewProps) {
  // Calculate metrics using useMemo for performance
  const metrics = useMemo(() => {
    const totalFoods = allFoods?.length || 0;
    const totalSymptoms = allSymptoms?.length || 0;

    // Calculate total days with any entries
    const allEntries = [
      ...(allFoods || []).map(f => ({ timestamp: f.timestamp, type: 'food' })),
      ...(allSymptoms || []).map(s => ({
        timestamp: s.timestamp,
        type: 'symptom',
      })),
    ];

    const uniqueDays = new Set(
      allEntries.map(entry => {
        const date = new Date(entry.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    const totalDays = uniqueDays.size;

    // Calculate current streak (consecutive days from yesterday backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    while (true) {
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (uniqueDays.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      // Prevent infinite loops - max reasonable streak is 365 days
      if (currentStreak > 365) break;
    }

    return {
      totalFoods,
      totalSymptoms,
      totalDays,
      currentStreak,
    };
  }, [allFoods, allSymptoms]);

  return (
    <div className="space-y-6">
      {/* Current Data Summary - Moved to top with enhanced metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Health Data Overview
          </CardTitle>
          <CardDescription>
            Complete summary of your tracking progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Day Streak */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors">
              <div className={`${getZoneBgClass('yellow', 'light')} p-3 rounded-full`}>
                <Flame className={`h-5 w-5 ${getZoneTextClass('yellow')}`} />
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getZoneTextClass('yellow')}`}>
                  {metrics.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>

            {/* Days Tracked */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors">
              <div className={`${getZoneBgClass('unzoned', 'light')} p-3 rounded-full`}>
                <BarChart3 className={`h-5 w-5 ${getZoneTextClass('unzoned')}`} />
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getZoneTextClass('unzoned')}`}>
                  {metrics.totalDays}
                </div>
                <div className="text-sm text-muted-foreground">Days Tracked</div>
              </div>
            </div>

            {/* Total Foods */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors">
              <div className={`${getZoneBgClass('green', 'light')} p-3 rounded-full`}>
                <Utensils className={`h-5 w-5 ${getZoneTextClass('green')}`} />
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getZoneTextClass('green')}`}>
                  {metrics.totalFoods}
                </div>
                <div className="text-sm text-muted-foreground">Total Foods</div>
              </div>
            </div>

            {/* Total Signals */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors">
              <div className={`${getZoneBgClass('red', 'light')} p-3 rounded-full`}>
                <Activity className={`h-5 w-5 ${getZoneTextClass('red')}`} />
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getZoneTextClass('red')}`}>
                  {metrics.totalSymptoms}
                </div>
                <div className="text-sm text-muted-foreground">Total Signals</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
