import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { Food, Ingredient } from '@/lib/types';

// Type for zoning API response
interface ZonedIngredientData {
  name: string;
  zone: 'green' | 'yellow' | 'red' | 'unzoned';
  foodGroup: string;
  organic: boolean;
}

// Get Supabase client
const supabase = createClient();

// Maximum retry attempts per food entry (reserved for future use)
// const MAX_RETRY_ATTEMPTS = 3;

/**
 * Background service to retry failed zoning operations
 * This is a simple MVP implementation that can be called periodically
 */
export async function retryFailedZoning(): Promise<void> {
  try {
    // Find foods that need zoning retry (status = 'analyzing')
    const { data: foodsToRetry, error } = await supabase
      .from('foods')
      .select('*')
      .eq('status', 'analyzing')
      .order('timestamp', { ascending: false })
      .limit(10); // Process max 10 at a time to avoid overwhelming API

    if (error) {
      logger.error('Failed to fetch foods for retry', error);
      return;
    }

    if (!foodsToRetry || foodsToRetry.length === 0) {
      return; // Nothing to retry
    }

    logger.info(`Found ${foodsToRetry.length} foods needing zoning retry`);

    // Process each food entry
    for (const food of foodsToRetry) {
      await retryFoodZoning(food);
    }
  } catch (error) {
    logger.error('Background zoning retry failed', error);
  }
}

/**
 * Retry zoning for a specific food entry
 */
async function retryFoodZoning(food: Food): Promise<void> {
  try {
    const ingredients = food.ingredients as Ingredient[];
    const unzonedIngredients = ingredients.filter(
      ing => ing.zone === 'unzoned'
    );

    if (unzonedIngredients.length === 0) {
      // All ingredients are already zoned, mark as processed
      await updateFoodStatus(food.id, 'processed', ingredients);
      return;
    }

    // Try to zone the unzoned ingredients
    const ingredientNames = unzonedIngredients.map(ing => ing.name);

    const response = await fetch('/api/zone-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ingredientNames }),
    });

    if (response.ok) {
      const { ingredients: zonedData }: { ingredients: ZonedIngredientData[] } =
        await response.json();
      const zonedMap = new Map(zonedData.map(item => [item.name, item]));

      // Update ingredients with zoned data
      const updatedIngredients = ingredients.map(ing => {
        if (ing.zone === 'unzoned') {
          const zonedData = zonedMap.get(ing.name);
          if (zonedData) {
            return {
              ...ing,
              ...zonedData,
              // Ensure required fields have proper types
              foodGroup: zonedData.foodGroup || 'other',
              zone: zonedData.zone || 'unzoned',
              organic:
                typeof zonedData.organic === 'boolean'
                  ? zonedData.organic
                  : ing.organic,
            };
          }
          // If no zoned data found, keep original ingredient
          return ing;
        }
        return ing;
      });

      // Check if all ingredients are now zoned
      const stillUnzoned = updatedIngredients.some(
        ing => ing.zone === 'unzoned'
      );
      const newStatus = stillUnzoned ? 'analyzing' : 'processed';

      await updateFoodStatus(food.id, newStatus, updatedIngredients);

      if (newStatus === 'processed') {
        logger.info(`Successfully zoned food entry ${food.id}`);
      } else {
        logger.warn(`Some ingredients still unzoned for food ${food.id}`);
      }
    } else {
      // Zoning failed again - could implement retry limit here
      logger.warn(
        `Zoning retry failed for food ${food.id}: ${response.status}`
      );

      // For now, keep it as 'analyzing' for future retries
      // In a more sophisticated system, you could increment a retry counter
    }
  } catch (error) {
    logger.error(`Failed to retry zoning for food ${food.id}`, error);
  }
}

/**
 * Update food status and ingredients in database
 */
async function updateFoodStatus(
  foodId: string,
  status: 'analyzing' | 'processed',
  ingredients: Ingredient[]
): Promise<void> {
  const { error } = await supabase
    .from('foods')
    .update({
      status,
      ingredients,
      updated_at: new Date().toISOString(),
    })
    .eq('id', foodId);

  if (error) {
    logger.error(`Failed to update food status for ${foodId}`, error);
    throw error;
  }
}

/**
 * Get count of foods needing zoning retry
 */
export async function getFailedZoningCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('foods')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'analyzing');

    if (error) {
      logger.error('Failed to count foods needing retry', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Failed to get failed zoning count', error);
    return 0;
  }
}

/**
 * Manual retry function for specific food entry (for UI button)
 */
export async function retryFoodZoningManually(
  foodId: string
): Promise<boolean> {
  try {
    const { data: food, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', foodId)
      .single();

    if (error || !food) {
      logger.error(`Failed to fetch food for manual retry: ${foodId}`, error);
      return false;
    }

    await retryFoodZoning(food);
    return true;
  } catch (error) {
    logger.error(`Manual retry failed for food ${foodId}`, error);
    return false;
  }
}
