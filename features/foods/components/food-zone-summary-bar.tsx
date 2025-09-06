'use client';

import type { Ingredient } from '@/lib/types';
import { getZoneBgClass, getZoneBgStyle } from '@/lib/utils/zone-colors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface FoodZoneSummaryBarProps {
  ingredients: Ingredient[];
  className?: string;
}

export function FoodZoneSummaryBar({
  ingredients,
  className = '',
}: FoodZoneSummaryBarProps) {
  const safeIngredients = ingredients || [];
  const totalIngredients = safeIngredients.length;

  // Calculate zone counts
  const greenCount = safeIngredients.filter(ing => ing.zone === 'green').length;
  const yellowCount = safeIngredients.filter(
    ing => ing.zone === 'yellow'
  ).length;
  const redCount = safeIngredients.filter(ing => ing.zone === 'red').length;
  const unzonedCount = safeIngredients.filter(
    ing => ing.zone === 'unzoned'
  ).length;

  // Calculate organic count
  const organicCount = safeIngredients.filter(
    ing => ing.organic === true
  ).length;

  // Calculate percentages for display
  const greenPercent =
    totalIngredients > 0 ? (greenCount / totalIngredients) * 100 : 0;
  const yellowPercent =
    totalIngredients > 0 ? (yellowCount / totalIngredients) * 100 : 0;
  const redPercent =
    totalIngredients > 0 ? (redCount / totalIngredients) * 100 : 0;
  const unzonedPercent =
    totalIngredients > 0 ? (unzonedCount / totalIngredients) * 100 : 0;
  const organicPercent =
    totalIngredients > 0 ? (organicCount / totalIngredients) * 100 : 0;

  // Empty state
  if (totalIngredients === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Today's Food Zones</CardTitle>
          <CardDescription>(0 ingredients total)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Zone distribution bar - empty state */}
          <div className="h-4 sm:h-5 w-full bg-muted rounded-full border">
            <div className="h-full bg-muted-foreground/20 w-full animate-pulse rounded-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground px-2">
                No foods tracked today
              </span>
            </div>
          </div>
          {/* Organic percentage bar - empty state */}
          <div className="h-2.5 sm:h-3 w-full bg-muted rounded-full border">
            <div className="h-full bg-muted-foreground/20 w-full animate-pulse rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Today's Food Zones</CardTitle>
        <CardDescription>
          ({totalIngredients} ingredient{totalIngredients !== 1 ? 's' : ''}{' '}
          total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Zone distribution bar */}
        <div
          className="flex h-4 sm:h-5 w-full rounded-full overflow-hidden border bg-muted"
          title={`Green: ${greenCount}, Yellow: ${yellowCount}, Red: ${redCount}${unzonedCount > 0 ? `, Unzoned: ${unzonedCount}` : ''}`}
        >
          {greenPercent > 0 && (
            <div
              className={`${getZoneBgClass('green')} transition-all duration-500 ease-out`}
              style={{
                width: `${greenPercent}%`,
                minWidth: greenPercent > 0 ? '2px' : '0px',
                willChange: 'transform, width',
                ...getZoneBgStyle('green'),
              }}
            />
          )}
          {yellowPercent > 0 && (
            <div
              className={`${getZoneBgClass('yellow')} transition-all duration-500 ease-out`}
              style={{
                width: `${yellowPercent}%`,
                minWidth: yellowPercent > 0 ? '2px' : '0px',
                willChange: 'transform, width',
                ...getZoneBgStyle('yellow'),
              }}
            />
          )}
          {redPercent > 0 && (
            <div
              className={`${getZoneBgClass('red')} transition-all duration-500 ease-out`}
              style={{
                width: `${redPercent}%`,
                minWidth: redPercent > 0 ? '2px' : '0px',
                willChange: 'transform, width',
                ...getZoneBgStyle('red'),
              }}
            />
          )}
          {unzonedPercent > 0 && (
            <div
              className={`${getZoneBgClass('unzoned')} transition-all duration-500 ease-out zone-bar-loading relative`}
              style={{
                width: `${unzonedPercent}%`,
                minWidth: unzonedPercent > 0 ? '2px' : '0px',
                willChange: 'transform, width, opacity',
                ...getZoneBgStyle('unzoned'),
              }}
              title={`${unzonedCount} ingredient${unzonedCount !== 1 ? 's' : ''} analyzing...`}
            >
              <div className="absolute inset-0 zone-bar-shimmer" />
            </div>
          )}
        </div>

        {/* Organic percentage bar */}
        <div
          className="relative flex h-2.5 sm:h-3 w-full rounded-full overflow-hidden bg-muted border"
          title={`Organic: ${organicCount}/${totalIngredients} (${Math.round(organicPercent)}%)`}
        >
          {organicPercent > 0 && (
            <div
              className={`${getZoneBgClass('green')} transition-all duration-500 ease-out`}
              style={{
                width: `${organicPercent}%`,
                minWidth: organicPercent > 0 ? '2px' : '0px',
                willChange: 'transform, width',
                ...getZoneBgStyle('green'),
              }}
            />
          )}
          {/* Empty state indicator for organic */}
          {organicCount === 0 && (
            <div className="absolute right-0 w-1 h-full bg-muted-foreground opacity-50" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
