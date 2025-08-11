'use client';

import type { Ingredient } from '@/lib/types';
import {
  getZoneColor,
  getZoneBgClass,
  getZoneBgStyle,
} from '@/lib/utils/zone-colors';

interface FoodCompositionBarProps {
  ingredients: Ingredient[];
}

export function FoodCompositionBar({ ingredients }: FoodCompositionBarProps) {
  const safeIngredients = ingredients || [];
  const totalIngredients = safeIngredients.length;

  if (totalIngredients === 0) {
    // Still analyzing or no ingredients
    return (
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-400">
        <div className="h-full bg-gray-300 w-full animate-pulse"></div>
      </div>
    );
  }

  // Use 'zone' property instead of 'healthCategory' to match our data structure
  const greenCount = safeIngredients.filter(ing => ing.zone === 'green').length;
  const yellowCount = safeIngredients.filter(
    ing => ing.zone === 'yellow'
  ).length;
  const redCount = safeIngredients.filter(ing => ing.zone === 'red').length;
  const unzonedCount = safeIngredients.filter(
    ing => ing.zone === 'unzoned'
  ).length;
  const zonedCount = greenCount + yellowCount + redCount;

  if (zonedCount === 0 && unzonedCount > 0) {
    // Only unzoned ingredients, show all gray
    return (
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-400">
        <div
          className="transition-all duration-500"
          style={{
            backgroundColor: getZoneColor('unzoned', 'hex'),
            width: '100%',
            height: '100%',
          }}
          title={`${unzonedCount} unzoned ingredient${unzonedCount !== 1 ? 's' : ''} - zoning needed`}
        ></div>
      </div>
    );
  }

  if (zonedCount === 0) {
    // No ingredients at all
    return (
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-400">
        <div className="h-full bg-gray-300 w-full animate-pulse"></div>
      </div>
    );
  }

  // Calculate percentages for display
  const totalDisplayCount = totalIngredients; // Use all ingredients for display proportions
  const greenPercent = (greenCount / totalDisplayCount) * 100;
  const yellowPercent = (yellowCount / totalDisplayCount) * 100;
  const redPercent = (redCount / totalDisplayCount) * 100;
  const unzonedPercent = (unzonedCount / totalDisplayCount) * 100;

  return (
    <div
      className="flex h-3 w-full rounded-full overflow-hidden border border-gray-400 bg-gray-200"
      title={`Green: ${greenCount}, Yellow: ${yellowCount}, Red: ${redCount}${unzonedCount > 0 ? `, Unzoned: ${unzonedCount}` : ''}`}
    >
      {greenPercent > 0 && (
        <div
          className={`${getZoneBgClass('green')} transition-all duration-500`}
          style={{
            width: `${greenPercent}%`,
            minWidth: greenPercent > 0 ? '2px' : '0px',
            ...getZoneBgStyle('green'), // Fallback inline style
          }}
        />
      )}
      {yellowPercent > 0 && (
        <div
          className={`${getZoneBgClass('yellow')} transition-all duration-500`}
          style={{
            width: `${yellowPercent}%`,
            minWidth: yellowPercent > 0 ? '2px' : '0px',
            ...getZoneBgStyle('yellow'), // Fallback inline style
          }}
        />
      )}
      {redPercent > 0 && (
        <div
          className={`${getZoneBgClass('red')} transition-all duration-500`}
          style={{
            width: `${redPercent}%`,
            minWidth: redPercent > 0 ? '2px' : '0px',
            ...getZoneBgStyle('red'), // Fallback inline style
          }}
        />
      )}
      {unzonedPercent > 0 && (
        <div
          className={`${getZoneBgClass('unzoned')} transition-all duration-500`}
          style={{
            width: `${unzonedPercent}%`,
            minWidth: unzonedPercent > 0 ? '2px' : '0px',
            ...getZoneBgStyle('unzoned'), // Fallback inline style
          }}
        />
      )}
    </div>
  );
}
