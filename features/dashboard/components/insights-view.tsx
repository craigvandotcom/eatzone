'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  LineChart,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
} from 'lucide-react';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';

interface InsightsViewProps {
  recentFoods?: any[];
  recentSymptoms?: any[];
}

export function InsightsView({
  recentFoods,
  recentSymptoms,
}: InsightsViewProps) {
  return (
    <div className="space-y-6">
      {/* Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Coming Soon
          </CardTitle>
          <CardDescription>
            Advanced insights and trend analysis for your health data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              What&apos;s Coming
            </h4>
            <p className="text-xs text-blue-700">
              This section will provide deep insights into your health patterns,
              correlations between different metrics, and trends over time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LineChart className="h-4 w-4" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Visualize how your health metrics change over time with
              interactive charts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Correlation Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Discover relationships between different health inputs and
              outputs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Get an overall health score based on your tracked metrics.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Pattern Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Identify recurring patterns and cycles in your health data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Data Summary
          </CardTitle>
          <CardDescription>
            A snapshot of your current tracking data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div
              className={`p-4 ${getZoneBgClass('green', 'light')} rounded-lg`}
            >
              <div
                className={`text-2xl font-bold ${getZoneTextClass('green')}`}
              >
                {recentFoods?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Foods</div>
            </div>
            <div className={`p-4 ${getZoneBgClass('red', 'light')} rounded-lg`}>
              <div className={`text-2xl font-bold ${getZoneTextClass('red')}`}>
                {recentSymptoms?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Symptoms</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
