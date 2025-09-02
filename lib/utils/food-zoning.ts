import type { Food } from '@/lib/types';

/**
 * Determines if a food entry needs zoning retry based on its status and ingredients
 * @param food - The food entry to check
 * @returns true if the food needs zoning retry, false otherwise
 */
export function needsZoningRetry(food: Food): boolean {
  return (
    food.status === 'analyzing' ||
    food.ingredients?.some(ing => ing.zone === 'unzoned') ||
    false
  );
}

/**
 * Checks if a food has any unzoned ingredients
 * @param food - The food entry to check
 * @returns true if the food has unzoned ingredients, false otherwise
 */
export function hasUnzonedIngredients(food: Food): boolean {
  return food.ingredients?.some(ing => ing.zone === 'unzoned') || false;
}

/**
 * Gets the count of ingredients by zone for a food entry
 * @param food - The food entry to analyze
 * @returns Object with counts for each zone
 */
export function getIngredientZoneCounts(food: Food) {
  const ingredients = food.ingredients || [];

  return {
    green: ingredients.filter(ing => ing.zone === 'green').length,
    yellow: ingredients.filter(ing => ing.zone === 'yellow').length,
    red: ingredients.filter(ing => ing.zone === 'red').length,
    unzoned: ingredients.filter(ing => ing.zone === 'unzoned').length,
    total: ingredients.length,
  };
}

/**
 * Determines if a food is ready for manual retry based on retry limits
 * @param food - The food entry to check
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns true if the food can be manually retried, false otherwise
 */
export function canManuallyRetryZoning(
  food: Food,
  maxRetries: number = 3
): boolean {
  const retryCount = food.retry_count || 0;
  return retryCount < maxRetries && needsZoningRetry(food);
}

/**
 * Gets a human-readable status message for a food's zoning state
 * @param food - The food entry to analyze
 * @returns Status message string
 */
export function getZoningStatusMessage(food: Food): string {
  if (food.status === 'analyzing') {
    return 'Analyzing ingredients...';
  }

  if (food.status === 'pending_review') {
    return 'Needs manual review';
  }

  if (food.status === 'processed') {
    const counts = getIngredientZoneCounts(food);
    if (counts.unzoned > 0) {
      return `${counts.unzoned} ingredient${counts.unzoned !== 1 ? 's' : ''} need zoning`;
    }
    return 'Analysis complete';
  }

  return 'Unknown status';
}
