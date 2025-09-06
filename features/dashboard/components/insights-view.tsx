'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, BarChart3, Flame } from 'lucide-react';
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
          <div className="grid grid-cols-2 gap-4 text-center">
            {/* Total Foods */}
            <div
              className={`p-4 ${getZoneBgClass('green', 'light')} rounded-lg`}
            >
              <div
                className={`text-2xl font-bold ${getZoneTextClass('green')}`}
              >
                {metrics.totalFoods}
              </div>
              <div className="text-sm text-gray-600">Total Foods</div>
            </div>

            {/* Total Symptoms */}
            <div className={`p-4 ${getZoneBgClass('red', 'light')} rounded-lg`}>
              <div className={`text-2xl font-bold ${getZoneTextClass('red')}`}>
                {metrics.totalSymptoms}
              </div>
              <div className="text-sm text-gray-600">Total Symptoms</div>
            </div>

            {/* Total Days with Entries */}
            <div
              className={`p-4 ${getZoneBgClass('unzoned', 'light')} rounded-lg`}
            >
              <div
                className={`text-2xl font-bold ${getZoneTextClass('unzoned')}`}
              >
                {metrics.totalDays}
              </div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </div>

            {/* Current Streak */}
            <div
              className={`p-4 ${getZoneBgClass('yellow', 'light')} rounded-lg`}
            >
              <div
                className={`text-2xl font-bold ${getZoneTextClass('yellow')} flex items-center justify-center gap-1`}
              >
                <Flame className="h-6 w-6" />
                {metrics.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Analytics Coming Soon
          </CardTitle>
          <CardDescription>
            Deeper insights and correlations are in development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Soon you'll see trend analysis, food-symptom correlations, and
              personalized health insights based on your data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
