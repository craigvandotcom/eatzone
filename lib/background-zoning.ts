import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { Food, Ingredient } from '@/lib/types';
import { APP_CONFIG } from '@/lib/config/constants';

// Type for zoning API response
interface ZonedIngredientData {
  name: string;
  zone: 'green' | 'yellow' | 'red' | 'unzoned';
  foodGroup: string;
  organic: boolean;
}

// Enhanced food type with retry tracking
interface FoodWithRetryInfo extends Food {
  retry_count?: number;
  last_retry_at?: string;
}

// Get Supabase client
const supabase = createClient();

// Exponential backoff delay calculation
function calculateRetryDelay(attemptNumber: number): number {
  const baseDelay = APP_CONFIG.BACKGROUND.BASE_RETRY_DELAY_MS;
  const multiplier = APP_CONFIG.BACKGROUND.RETRY_MULTIPLIER;
  const maxDelay = APP_CONFIG.BACKGROUND.MAX_RETRY_DELAY_MS;

  const delay = baseDelay * Math.pow(multiplier, attemptNumber - 1);
  return Math.min(delay, maxDelay);
}

// Check if enough time has passed since last retry
function shouldRetry(
  lastRetryAt: string | null,
  attemptNumber: number
): boolean {
  if (!lastRetryAt) return true;

  const lastRetry = new Date(lastRetryAt);
  const now = new Date();
  const timeSinceLastRetry = now.getTime() - lastRetry.getTime();
  const requiredDelay = calculateRetryDelay(attemptNumber);

  return timeSinceLastRetry >= requiredDelay;
}

/**
 * Enhanced background service with exponential backoff and monitoring
 * Tracks retry attempts and implements smart retry logic
 */
export async function retryFailedZoning(): Promise<void> {
  try {
    // Find foods that need zoning retry with retry tracking
    const { data: foodsToRetry, error } = await supabase
      .from('foods')
      .select(
        `
        *,
        retry_count,
        last_retry_at
      `
      )
      .eq('status', 'analyzing')
      .order('timestamp', { ascending: false })
      .limit(APP_CONFIG.BACKGROUND.BATCH_SIZE);

    if (error) {
      logger.error('Failed to fetch foods for retry', error);
      return;
    }

    if (!foodsToRetry || foodsToRetry.length === 0) {
      logger.debug('No foods need zoning retry');
      return;
    }

    logger.info(`Found ${foodsToRetry.length} foods needing zoning retry`);

    // Filter foods that are ready for retry (respecting exponential backoff)
    const foodsReadyForRetry = foodsToRetry.filter(
      (food: FoodWithRetryInfo) => {
        const retryCount = food.retry_count || 0;

        // Skip if max retries exceeded
        if (retryCount >= APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS) {
          logger.warn(
            `Food ${food.id} exceeded max retry attempts (${retryCount}/${APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS})`
          );
          return false;
        }

        // Check if enough time has passed since last retry
        return shouldRetry(food.last_retry_at || null, retryCount + 1);
      }
    );

    logger.info(
      `${foodsReadyForRetry.length} foods ready for retry after backoff filtering`
    );

    // Process each eligible food entry
    for (const food of foodsReadyForRetry) {
      await retryFoodZoning(food as FoodWithRetryInfo);
    }

    // Log monitoring information
    await logMonitoringStats();
  } catch (error) {
    logger.error('Background zoning retry failed', error);
  }
}

/**
 * Retry zoning for a specific food entry with retry tracking
 */
async function retryFoodZoning(food: FoodWithRetryInfo): Promise<void> {
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
      // Zoning failed again - increment retry counter
      const retryCount = (food.retry_count || 0) + 1;

      logger.warn(
        `Zoning retry failed for food ${food.id}: ${response.status} (attempt ${retryCount}/${APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS})`
      );

      // Update retry tracking
      await updateFoodRetryInfo(food.id, retryCount);

      // Mark as failed if max retries exceeded
      if (retryCount >= APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS) {
        logger.error(
          `Food ${food.id} marked as failed after ${retryCount} retry attempts`
        );
        await updateFoodStatus(
          food.id,
          'pending_review',
          food.ingredients as Ingredient[]
        );
      }
    }
  } catch (error) {
    logger.error(`Failed to retry zoning for food ${food.id}`, error);

    // Increment retry counter even on exception
    const retryCount = (food.retry_count || 0) + 1;
    await updateFoodRetryInfo(food.id, retryCount);

    // Mark as failed if max retries exceeded
    if (retryCount >= APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS) {
      logger.error(
        `Food ${food.id} marked as failed after ${retryCount} retry attempts due to error`
      );
      await updateFoodStatus(
        food.id,
        'pending_review',
        food.ingredients as Ingredient[]
      );
    }
  }
}

/**
 * Update food status and ingredients in database
 */
async function updateFoodStatus(
  foodId: string,
  status: 'pending_review' | 'analyzing' | 'processed',
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
      .select(
        `
        *,
        retry_count,
        last_retry_at
      `
      )
      .eq('id', foodId)
      .single();

    if (error || !food) {
      logger.error(`Failed to fetch food for manual retry: ${foodId}`, error);
      return false;
    }

    await retryFoodZoning(food as FoodWithRetryInfo);
    return true;
  } catch (error) {
    logger.error(`Manual retry failed for food ${foodId}`, error);
    return false;
  }
}

/**
 * Update food retry tracking information
 */
async function updateFoodRetryInfo(
  foodId: string,
  retryCount: number
): Promise<void> {
  const { error } = await supabase
    .from('foods')
    .update({
      retry_count: retryCount,
      last_retry_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', foodId);

  if (error) {
    logger.error(`Failed to update retry info for ${foodId}`, error);
  }
}

/**
 * Log monitoring statistics for stuck entries
 */
async function logMonitoringStats(): Promise<void> {
  try {
    // Count entries by retry status
    const { data: retryStats, error } = await supabase
      .from('foods')
      .select('retry_count, status')
      .eq('status', 'analyzing');

    if (error) {
      logger.error('Failed to fetch monitoring stats', error);
      return;
    }

    if (!retryStats || retryStats.length === 0) {
      return;
    }

    // Calculate stats
    const totalAnalyzing = retryStats.length;
    const highRetryCount = retryStats.filter(
      f => (f.retry_count || 0) >= APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS - 1
    ).length;
    const avgRetryCount =
      retryStats.reduce((sum, f) => sum + (f.retry_count || 0), 0) /
      totalAnalyzing;

    logger.info('Background zoning monitoring stats', {
      totalAnalyzing,
      highRetryCount,
      avgRetryCount: Math.round(avgRetryCount * 100) / 100,
      maxRetryLimit: APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS,
    });

    // Alert on concerning patterns
    if (highRetryCount > 0) {
      logger.warn(`⚠️ ${highRetryCount} entries approaching max retry limit`);
    }

    if (totalAnalyzing > APP_CONFIG.BACKGROUND.BATCH_SIZE * 3) {
      logger.warn(
        `⚠️ Large backlog detected: ${totalAnalyzing} entries stuck in analyzing state`
      );
    }
  } catch (error) {
    logger.error('Failed to generate monitoring stats', error);
  }
}

/**
 * Get detailed monitoring information for admin/debug purposes
 */
export async function getMonitoringInfo(): Promise<{
  stuckEntries: number;
  highRetryEntries: number;
  totalAnalyzing: number;
  oldestStuckEntry?: string;
}> {
  try {
    const { data: analyzingFoods, error } = await supabase
      .from('foods')
      .select(
        `
        id,
        created_at,
        retry_count,
        last_retry_at
      `
      )
      .eq('status', 'analyzing')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch monitoring info', error);
      return {
        stuckEntries: 0,
        highRetryEntries: 0,
        totalAnalyzing: 0,
      };
    }

    if (!analyzingFoods || analyzingFoods.length === 0) {
      return {
        stuckEntries: 0,
        highRetryEntries: 0,
        totalAnalyzing: 0,
      };
    }

    // Calculate monitoring metrics
    const now = new Date();
    const stuckThreshold = 24 * 60 * 60 * 1000; // 24 hours

    const stuckEntries = analyzingFoods.filter(food => {
      const createdAt = new Date(food.created_at);
      return now.getTime() - createdAt.getTime() > stuckThreshold;
    }).length;

    const highRetryEntries = analyzingFoods.filter(
      food =>
        (food.retry_count || 0) >= APP_CONFIG.BACKGROUND.MAX_RETRY_ATTEMPTS - 1
    ).length;

    return {
      stuckEntries,
      highRetryEntries,
      totalAnalyzing: analyzingFoods.length,
      oldestStuckEntry: analyzingFoods[0]?.id,
    };
  } catch (error) {
    logger.error('Failed to get monitoring info', error);
    return {
      stuckEntries: 0,
      highRetryEntries: 0,
      totalAnalyzing: 0,
    };
  }
}
