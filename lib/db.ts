import { createClient } from '@/lib/supabase/client';
import { Food, Symptom, User, SymptomCategory } from './types';
import { getSymptomById as getSymptomDefinition } from './symptoms/symptom-index';
import { sanitizeUserNote } from './security/sanitization';

// Type for zoning API response
interface ZonedIngredientData {
  name: string;
  zone: 'green' | 'yellow' | 'red' | 'unzoned';
  category?: string;
  group: string;
  organic: boolean;
}

// Get Supabase client
const supabase = createClient();

// Helper function to generate ISO timestamp
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to check if a timestamp is from today
export const isToday = (timestamp: string): boolean => {
  const today = getTodayDate();
  return timestamp.startsWith(today);
};

// FOOD OPERATIONS
export const addFood = async (
  food: Omit<Food, 'id' | 'timestamp'> & { image?: string; images?: string[] }
): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Generate food ID early for image naming
  const foodId = crypto.randomUUID();

  // Import image storage utilities
  const { uploadFoodImage, uploadFoodImages } = await import('./image-storage');

  let photo_url: string | undefined;
  let image_urls: string[] = [];
  let zonedIngredients = food.ingredients;

  // Parallel operations: image upload + ingredient zoning
  const operations: Promise<unknown>[] = [];

  // 1. Image upload (handle both single and multiple images)
  if (food.images && food.images.length > 0) {
    // Multiple images provided
    operations.push(
      uploadFoodImages(food.images, user.user.id, foodId)
        .then(urls => {
          image_urls = urls;
          photo_url = urls[0] || undefined; // First image as primary for backward compat
          return urls;
        })
        .catch(() => {
          // Graceful degradation - continue without images
          image_urls = [];
          photo_url = undefined;
          return [];
        })
    );
  } else if (food.image) {
    // Single image provided (backward compatibility)
    operations.push(
      uploadFoodImage(food.image, user.user.id)
        .then(url => {
          photo_url = url || undefined;
          if (url) image_urls = [url];
          return url;
        })
        .catch(() => {
          // Graceful degradation - continue without image
          photo_url = undefined;
          image_urls = [];
          return null;
        })
    );
  }

  // 2. Ingredient zoning (if ingredients need zoning)
  const unzonedIngredients = food.ingredients.filter(
    ing => ing.zone === 'unzoned'
  );
  let zoningSucceeded = true;

  if (unzonedIngredients.length > 0) {
    const ingredientNames = unzonedIngredients.map(ing => ing.name);

    operations.push(
      fetch('/api/zone-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientNames }),
      })
        .then(async response => {
          if (response.ok) {
            const {
              ingredients: zonedData,
            }: { ingredients: ZonedIngredientData[] } = await response.json();
            const zonedMap = new Map(zonedData.map(item => [item.name, item]));

            // Update ingredients with zoned data
            zonedIngredients = food.ingredients.map(ing => {
              if (ing.zone === 'unzoned') {
                const zonedData = zonedMap.get(ing.name);
                if (zonedData) {
                  return {
                    ...ing,
                    ...zonedData,
                    // Ensure required fields have proper types
                    category: zonedData.category,
                    group: zonedData.group || 'other',
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
            zoningSucceeded = true;
          } else {
            zoningSucceeded = false;
          }
          return zonedIngredients;
        })
        .catch(() => {
          // Graceful degradation - keep original ingredients but mark as failed
          zoningSucceeded = false;
          return zonedIngredients;
        })
    );
  }

  // Wait for both operations to complete
  if (operations.length > 0) {
    await Promise.allSettled(operations);
  }

  // Determine status based on zoning results
  const hasUnzonedIngredients = zonedIngredients.some(
    ing => ing.zone === 'unzoned'
  );
  let finalStatus: 'pending_review' | 'analyzing' | 'processed' = 'processed';

  if (hasUnzonedIngredients && !zoningSucceeded) {
    finalStatus = 'analyzing'; // Will be retried by background system
  } else {
    finalStatus = 'processed'; // All good
  }

  // Create food entry with results
  const newFood = {
    id: foodId, // Use the pre-generated ID
    name: food.name,
    ingredients: zonedIngredients,
    notes: food.notes,
    meal_type: food.meal_type,
    status: finalStatus,
    photo_url, // Keep for backward compatibility
    image_urls: image_urls.length > 0 ? image_urls : null, // New field for multiple images
    user_id: user.user.id,
    timestamp: generateTimestamp(),
  };

  const { data, error } = await supabase
    .from('foods')
    .insert(newFood)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const updateFood = async (
  id: string,
  updates: Partial<Omit<Food, 'id'>>
): Promise<void> => {
  const { error } = await supabase.from('foods').update(updates).eq('id', id);

  if (error) throw error;
};

export const deleteFood = async (id: string): Promise<void> => {
  const { error } = await supabase.from('foods').delete().eq('id', id);

  if (error) throw error;
};

export const getAllFoods = async (): Promise<Food[]> => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getRecentFoods = async (limit: number = 10): Promise<Food[]> => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getTodaysFoods = async (): Promise<Food[]> => {
  const today = getTodayDate();
  const startRange = today + 'T00:00:00.000Z';
  const endRange = today + 'T23:59:59.999Z';

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .gte('timestamp', startRange)
    .lte('timestamp', endRange)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getFoodById = async (id: string): Promise<Food | undefined> => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // No rows returned
    throw error;
  }
  return data;
};

// SYMPTOM OPERATIONS

/**
 * Validate symptom data before database insertion
 */
function validateSymptomData(symptom: Omit<Symptom, 'id' | 'timestamp'>): void {
  // Validate symptom_id exists in new symptom database
  const symptomDef = getSymptomDefinition(symptom.symptom_id);
  if (!symptomDef) {
    throw new Error(`Invalid symptom_id: ${symptom.symptom_id}`);
  }

  // Validate score is in valid delta range (-2 to +2)
  const validScores = [-2, -1, 0, 1, 2] as const;
  if (!validScores.includes(symptom.score)) {
    throw new Error(`Invalid score: ${symptom.score}. Must be -2 to +2`);
  }

  // Validate category matches symptom definition
  if (symptom.category !== symptomDef.category) {
    throw new Error(
      `Category mismatch for symptom_id: ${symptom.symptom_id}. Expected: ${symptomDef.category}, got: ${symptom.category}`
    );
  }

  // Validate name matches symptom definition
  if (symptom.name !== symptomDef.name) {
    throw new Error(
      `Name mismatch for symptom_id: ${symptom.symptom_id}. Expected: ${symptomDef.name}, got: ${symptom.name}`
    );
  }

  // Validate category is one of the allowed values
  const validCategories: SymptomCategory[] = [
    'digestion',
    'energy',
    'mind',
    'recovery',
  ];
  if (!validCategories.includes(symptom.category)) {
    throw new Error(
      `Invalid category: ${symptom.category}. Must be one of: ${validCategories.join(', ')}`
    );
  }
}

export const addSymptom = async (
  symptom: Omit<Symptom, 'id' | 'timestamp'>
): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Validate symptom data
  validateSymptomData(symptom);

  // Sanitize notes if present
  const sanitizedNotes = symptom.notes
    ? sanitizeUserNote(symptom.notes)
    : undefined;

  const newSymptom = {
    ...symptom,
    notes: sanitizedNotes,
    user_id: user.user.id,
    timestamp: generateTimestamp(),
  };

  const { data, error } = await supabase
    .from('symptoms')
    .insert(newSymptom)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const addSymptoms = async (
  symptoms: Omit<Symptom, 'id'>[]
): Promise<string[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  if (symptoms.length === 0) {
    throw new Error('No symptoms provided');
  }

  // Validate all symptom data
  symptoms.forEach(symptom => validateSymptomData(symptom));

  // Prepare symptoms for insertion
  const symptomsToInsert = symptoms.map(symptom => ({
    ...symptom,
    notes: symptom.notes ? sanitizeUserNote(symptom.notes) : undefined,
    user_id: user.user.id,
    timestamp: symptom.timestamp || generateTimestamp(),
  }));

  const { data, error } = await supabase
    .from('symptoms')
    .insert(symptomsToInsert)
    .select('id');

  if (error) throw error;
  return data.map(item => item.id);
};

export const updateSymptom = async (
  id: string,
  updates: Partial<Omit<Symptom, 'id'>>
): Promise<void> => {
  // Validate that we have valid updates
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No valid updates provided');
  }

  // If updating core symptom fields, validate them
  if (
    updates.symptom_id ||
    updates.category ||
    updates.name ||
    updates.score !== undefined
  ) {
    // Create a temporary symptom object for validation
    // We need to get the existing symptom first to merge with updates
    const { data: existingSymptom, error: fetchError } = await supabase
      .from('symptoms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingSymptom) throw new Error('Symptom not found');

    // Merge existing data with updates for validation
    const mergedSymptom = {
      symptom_id: updates.symptom_id ?? existingSymptom.symptom_id,
      category: updates.category ?? existingSymptom.category,
      name: updates.name ?? existingSymptom.name,
      score:
        updates.score !== undefined ? updates.score : existingSymptom.score,
    };

    // Validate the merged symptom data
    validateSymptomData(mergedSymptom);
  }

  // Sanitize updates to prevent invalid fields
  const allowedFields = [
    'symptom_id',
    'category',
    'name',
    'score',
    'timestamp',
    'notes',
  ] as const;
  const sanitizedUpdates = Object.keys(updates).reduce(
    (acc, key) => {
      if (allowedFields.includes(key as (typeof allowedFields)[number])) {
        acc[key] = updates[key as keyof typeof updates];
      }
      return acc;
    },
    {} as Record<string, unknown>
  );

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const { error } = await supabase
    .from('symptoms')
    .update(sanitizedUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteSymptom = async (id: string): Promise<void> => {
  const { error } = await supabase.from('symptoms').delete().eq('id', id);

  if (error) throw error;
};

export const getAllSymptoms = async (): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getRecentSymptoms = async (
  limit: number = 10
): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getTodaysSymptoms = async (): Promise<Symptom[]> => {
  const today = getTodayDate();
  const startRange = today + 'T00:00:00.000Z';
  const endRange = today + 'T23:59:59.999Z';

  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .gte('timestamp', startRange)
    .lte('timestamp', endRange)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSymptomById = async (
  id: string
): Promise<Symptom | undefined> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // No rows returned
    throw error;
  }
  return data;
};

// CATEGORY-BASED SYMPTOM OPERATIONS

export const getSymptomsByCategory = async (
  category: string
): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('category', category)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSymptomsByCategoryToday = async (
  category: string
): Promise<Symptom[]> => {
  const today = getTodayDate();
  const startRange = today + 'T00:00:00.000Z';
  const endRange = today + 'T23:59:59.999Z';

  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('category', category)
    .gte('timestamp', startRange)
    .lte('timestamp', endRange)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSymptomsByScoreRange = async (
  minScore: number,
  maxScore: number,
  limit?: number
): Promise<Symptom[]> => {
  let query = supabase
    .from('symptoms')
    .select('*')
    .gte('score', minScore)
    .lte('score', maxScore)
    .order('timestamp', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getCategoryScoreSummary = async (dateRange?: {
  start: string;
  end: string;
}): Promise<
  Record<string, { total: number; count: number; average: number }>
> => {
  let query = supabase.from('symptoms').select('category, score');

  if (dateRange) {
    query = query
      .gte('timestamp', dateRange.start)
      .lte('timestamp', dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Group by category and calculate summary stats
  const summary: Record<
    string,
    { total: number; count: number; average: number }
  > = {};

  data?.forEach(symptom => {
    if (!summary[symptom.category]) {
      summary[symptom.category] = { total: 0, count: 0, average: 0 };
    }
    summary[symptom.category].total += symptom.score;
    summary[symptom.category].count += 1;
  });

  // Calculate averages
  Object.keys(summary).forEach(category => {
    summary[category].average =
      summary[category].total / summary[category].count;
  });

  return summary;
};

export const getSymptomsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
};

// UTILITY OPERATIONS
export const clearAllData = async (): Promise<void> => {
  // Clear user's foods and symptoms
  const { error: foodsError } = await supabase
    .from('foods')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's records

  if (foodsError) throw foodsError;

  const { error: symptomsError } = await supabase
    .from('symptoms')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's records

  if (symptomsError) throw symptomsError;
};

export const exportAllData = async (): Promise<{
  foods: Food[];
  symptoms: Symptom[];
  exportedAt: string;
}> => {
  const [foods, symptoms] = await Promise.all([
    getAllFoods(),
    getAllSymptoms(),
  ]);

  return {
    foods,
    symptoms,
    exportedAt: generateTimestamp(),
  };
};

export const importAllData = async (data: {
  foods: Food[];
  symptoms: Symptom[];
}): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Clear existing data first
  await clearAllData();

  // Import foods
  if (data.foods.length > 0) {
    const foodsToInsert = data.foods.map(food => ({
      ...food,
      user_id: user.user.id,
    }));

    const { error: foodsError } = await supabase
      .from('foods')
      .insert(foodsToInsert);

    if (foodsError) throw foodsError;
  }

  // Import symptoms
  if (data.symptoms.length > 0) {
    const symptomsToInsert = data.symptoms.map(symptom => ({
      ...symptom,
      user_id: user.user.id,
    }));

    const { error: symptomsError } = await supabase
      .from('symptoms')
      .insert(symptomsToInsert);

    if (symptomsError) throw symptomsError;
  }
};

// USER OPERATIONS (Simplified since Supabase handles auth)
export const getUserById = async (id: string): Promise<User | undefined> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || undefined;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 results

  if (error) throw error;
  return data;
};

// AUTHENTICATION OPERATIONS (Simplified - using Supabase Auth)
export const createUser = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Failed to create user');

  // The user profile is automatically created by the trigger
  const profile = await getUserById(data.user.id);
  if (!profile) throw new Error('Failed to create user profile');

  return profile;
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ user: User; token: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Authentication failed');

  const profile = await getUserById(data.user.id);
  if (!profile) throw new Error('User profile not found');

  return {
    user: profile,
    token: data.session.access_token,
  };
};

export const validateSession = async (token?: string): Promise<User | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  const profile = await getUserById(user.id);
  return profile || null;
};

export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// LEGACY COMPATIBILITY EXPORTS
export const generateId = (): string => {
  console.warn(
    'generateId() is deprecated with Supabase - UUIDs are auto-generated'
  );
  return crypto.randomUUID();
};

export const clearExpiredSessions = async (): Promise<void> => {
  console.warn(
    'clearExpiredSessions() is deprecated - Supabase handles session management'
  );
  // Supabase handles session expiration automatically
};

export const updateUserSettings = async (
  _userId: string,
  _settings: Partial<User['settings']>
): Promise<void> => {
  console.warn(
    'updateUserSettings() is deprecated - user settings moved to auth metadata'
  );
  // User settings would now be handled through Supabase user metadata
  // This function is kept for backward compatibility but doesn't do anything
};

// Backwards compatibility - maintain the HealthTrackerDB class structure for any direct references
export class HealthTrackerDB {
  constructor() {
    console.warn('HealthTrackerDB class is deprecated - now using Supabase');
  }
}

export const db = new HealthTrackerDB();
