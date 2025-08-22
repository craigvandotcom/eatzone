/**
 * Food submission service
 * Handles the complex logic for processing and zoning food entries
 */

import type { Food, Ingredient } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import {
  sanitizeText,
  sanitizeIngredientName,
  sanitizeUserNote,
} from '@/lib/security/sanitization';

export interface FoodSubmissionData {
  name: string;
  ingredients: Ingredient[];
  currentIngredient: string;
  notes: string;
  selectedDateTime: Date;
}

export interface FoodSubmissionResult {
  success: boolean;
  food?: Omit<Food, 'id'>;
  error?: {
    message: string;
    code: string;
    type: 'validation' | 'api' | 'network' | 'unknown';
  };
  warnings?: string[];
}

export interface ZoningResponse {
  ingredients: Array<{
    name: string;
    zone: string;
    category?: string;
    group?: string;
  }>;
}

/**
 * Validate and sanitize ingredients list
 */
function processIngredients(
  ingredients: Ingredient[],
  currentIngredient: string
): { ingredients: Ingredient[]; warnings: string[] } {
  const warnings: string[] = [];
  const finalIngredientsList = [...ingredients];

  // Add current ingredient if present
  if (currentIngredient.trim()) {
    const sanitizedName = sanitizeIngredientName(currentIngredient.trim());
    if (sanitizedName.length > 0) {
      finalIngredientsList.push({
        name: sanitizedName,
        organic: false,
        group: 'other',
        zone: 'unzoned', // Default zone - will be zoned during submission
      });
    } else {
      warnings.push(
        'Current ingredient could not be processed and was skipped'
      );
    }
  }

  // Sanitize all ingredient names
  const processedIngredients = finalIngredientsList
    .map(ing => {
      const sanitizedName = sanitizeIngredientName(ing.name);
      if (sanitizedName.length === 0) {
        warnings.push(
          `Ingredient "${ing.name}" was removed due to invalid characters`
        );
        return null;
      }
      return { ...ing, name: sanitizedName };
    })
    .filter((ing): ing is Ingredient => ing !== null);

  return { ingredients: processedIngredients, warnings };
}

/**
 * Call the zoning API to enrich ingredients
 */
async function zoneIngredients(ingredients: Ingredient[]): Promise<{
  enrichedIngredients: Ingredient[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    // Find ingredients that need zoning
    const ingredientsNeedingZoning = ingredients.filter(
      ing => ing.zone === 'unzoned' || !ing.category || !ing.group
    );

    if (ingredientsNeedingZoning.length === 0) {
      return { enrichedIngredients: ingredients, warnings };
    }

    logger.debug('Sending ingredients for zoning individually', {
      count: ingredientsNeedingZoning.length,
    });

    // Process each ingredient individually to avoid truncation issues
    const zoningPromises = ingredientsNeedingZoning.map(async ingredient => {
      try {
        const response = await fetch('/api/zone-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: [ingredient.name] }),
        });

        if (!response.ok) {
          logger.warn(`Failed to zone ingredient: ${ingredient.name}`, {
            status: response.status,
          });
          return { ingredient, zonedData: null };
        }

        const { ingredients: zonedArray }: ZoningResponse =
          await response.json();
        return {
          ingredient,
          zonedData: zonedArray && zonedArray.length > 0 ? zonedArray[0] : null,
        };
      } catch (error) {
        logger.warn(`Error zoning ingredient: ${ingredient.name}`, {
          error: error instanceof Error ? error.message : String(error),
          ingredient: ingredient.name
        });
        return { ingredient, zonedData: null };
      }
    });

    // Process all ingredients in parallel
    const zoningResults = await Promise.allSettled(zoningPromises);

    // Build zoned data map
    const zonedMap = new Map();
    let successCount = 0;

    zoningResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.zonedData) {
        zonedMap.set(result.value.ingredient.name, result.value.zonedData);
        successCount++;
      }
    });

    logger.debug('Individual zoning completed', {
      total: ingredientsNeedingZoning.length,
      successful: successCount,
      failed: ingredientsNeedingZoning.length - successCount,
    });

    if (successCount === 0) {
      warnings.push(
        'Could not zone any ingredients. Saving with default values.'
      );
      return { enrichedIngredients: ingredients, warnings };
    } else if (successCount < ingredientsNeedingZoning.length) {
      warnings.push(
        `Could only zone ${successCount} of ${ingredientsNeedingZoning.length} ingredients.`
      );
    }

    // Enrich ingredients with zoned data
    const enrichedIngredients = ingredients.map(ing => {
      const zonedData = zonedMap.get(ing.name);

      if (zonedData) {
        return {
          ...ing,
          zone: zonedData.zone as 'green' | 'yellow' | 'red',
          category: zonedData.category || ing.category || 'Other',
          group: zonedData.group || ing.group || 'other',
        };
      }

      return ing;
    });

    return { enrichedIngredients, warnings };
  } catch (error) {
    logger.error('Failed to zone ingredients', error);
    warnings.push('Could not process ingredient zones. Using default values.');
    return { enrichedIngredients: ingredients, warnings };
  }
}

/**
 * Create the final food object with all processing applied
 */
function createFoodEntry(
  data: FoodSubmissionData,
  enrichedIngredients: Ingredient[]
): Omit<Food, 'id'> {
  // Sanitize food name and notes
  const sanitizedName = sanitizeText(data.name.trim());
  const foodName =
    sanitizedName ||
    `Meal with ${sanitizeIngredientName(enrichedIngredients[0]?.name || 'unknown')}`;

  // Final validation and sanitization of enriched ingredients
  const validatedIngredients = enrichedIngredients.map(ing => ({
    name: sanitizeIngredientName(ing.name),
    organic: typeof ing.organic === 'boolean' ? ing.organic : false,
    category: ing.category,
    group: ing.group || 'other',
    zone: ing.zone || 'unzoned',
  })) as Ingredient[];

  return {
    name: foodName,
    ingredients: validatedIngredients,
    notes: sanitizeUserNote(data.notes.trim()),
    status: 'processed',
    timestamp: data.selectedDateTime.toISOString(),
  };
}

/**
 * Main function to process a food submission
 */
export async function processFoodSubmission(
  data: FoodSubmissionData
): Promise<FoodSubmissionResult> {
  try {
    logger.debug('Processing food submission', {
      ingredientCount: data.ingredients.length,
      hasCurrentIngredient: data.currentIngredient.trim().length > 0,
    });

    // Step 1: Process and validate ingredients
    const { ingredients: processedIngredients, warnings: processWarnings } =
      processIngredients(data.ingredients, data.currentIngredient);

    if (processedIngredients.length === 0) {
      return {
        success: false,
        error: {
          message: 'Please add at least one valid ingredient.',
          code: 'NO_VALID_INGREDIENTS',
          type: 'validation',
        },
      };
    }

    // Step 2: Zone ingredients through AI service
    const { enrichedIngredients, warnings: zoningWarnings } =
      await zoneIngredients(processedIngredients);

    // Step 3: Create final food entry
    const foodEntry = createFoodEntry(data, enrichedIngredients);

    logger.info('Food submission processed successfully', {
      finalIngredientCount: foodEntry.ingredients.length,
      warningCount: processWarnings.length + zoningWarnings.length,
    });

    return {
      success: true,
      food: foodEntry,
      warnings: [...processWarnings, ...zoningWarnings].filter(
        w => w.length > 0
      ),
    };
  } catch (error) {
    logger.error('Food submission processing failed', error);

    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to process food entry',
        code: 'PROCESSING_FAILED',
        type: 'unknown',
      },
    };
  }
}
