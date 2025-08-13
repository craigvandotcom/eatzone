// Optimized Custom React hooks for reactive data binding with Supabase
// Uses shared subscriptions and better error handling patterns

import { useEffect, useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { Symptom, Food } from './types';
import {
  getAllFoods,
  getAllSymptoms,
  getTodaysFoods,
  getTodaysSymptoms,
  getFoodById,
  getSymptomById,
} from './db';
import { logger } from './utils/logger';

// Create a shared supabase client for all hooks
const supabase = createClient();

// Type for Supabase subscription configuration
// Based on Supabase Realtime postgres_changes configuration
type SubscriptionConfig = {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
};

// Type for Supabase RealtimeChannel (from Supabase client)
type RealtimeChannel = ReturnType<typeof supabase.channel>;

// Shared subscription management to prevent duplicate subscriptions
class SubscriptionManager {
  private subscriptions = new Map<string, RealtimeChannel>();
  private listeners = new Map<string, Set<() => void>>();

  subscribe(
    key: string,
    subscriptionConfig: SubscriptionConfig,
    callback: () => void
  ) {
    // Add callback to listeners
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(key)) {
      const subscription = supabase
        .channel(key)
        .on(
          'postgres_changes' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          subscriptionConfig,
          () => {
            // Notify all listeners
            this.listeners.get(key)?.forEach(listener => listener());
          }
        )
        .subscribe();

      this.subscriptions.set(key, subscription);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);

        // If no more listeners, clean up subscription
        if (listeners.size === 0) {
          const subscription = this.subscriptions.get(key);
          if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
            this.listeners.delete(key);
          }
        }
      }
    };
  }
}

const subscriptionManager = new SubscriptionManager();

// Enhanced hook with retry logic and better error handling
function useSupabaseData<T>(
  fetchFn: () => Promise<T>,
  subscriptionKey: string,
  subscriptionConfig: SubscriptionConfig,
  _dependencies: React.DependencyList = []
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryCount = useRef(0);

  const fetchData = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        setData(result);
        retryCount.current = 0; // Reset retry count on success
      } catch (error) {
        logger.error(`Error fetching data for ${subscriptionKey}`, error);

        // No automatic retries - only allow manual retries to prevent infinite loops
        setError(
          `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        setData(undefined); // Ensure we show error state
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [fetchFn, subscriptionKey]
  );

  useEffect(() => {
    // Initial fetch
    fetchData(true); // Show loading for initial fetch

    // Set up real-time subscription through manager
    const unsubscribe = subscriptionManager.subscribe(
      subscriptionKey,
      subscriptionConfig,
      () => fetchData(false) // Don't show loading on real-time updates
    );

    return unsubscribe;
  }, [fetchData, subscriptionConfig, subscriptionKey]);

  const retry = useCallback(() => {
    retryCount.current = 0;
    fetchData(true); // Show loading for manual retry
  }, [fetchData]);

  return { data, error, isLoading, retry };
}

// OPTIMIZED FOOD HOOKS
export const useTodaysFoods = () => {
  return useSupabaseData(getTodaysFoods, 'todays_foods', {
    event: '*',
    schema: 'public',
    table: 'foods',
  });
};

export const useAllFoods = () => {
  return useSupabaseData(getAllFoods, 'all_foods', {
    event: '*',
    schema: 'public',
    table: 'foods',
  });
};

export const useFoodById = (id: string | null) => {
  return useSupabaseData(
    () => (id ? getFoodById(id) : Promise.resolve(null)),
    `food_${id}`,
    {
      event: '*',
      schema: 'public',
      table: 'foods',
      filter: id ? `id=eq.${id}` : undefined,
    },
    [id]
  );
};

export const useRecentFoods = (limit: number = 5) => {
  return useSupabaseData(
    async () => {
      const data = await getAllFoods();
      return data.slice(0, limit);
    },
    'recent_foods',
    {
      event: '*',
      schema: 'public',
      table: 'foods',
    },
    [limit]
  );
};

// OPTIMIZED SYMPTOM HOOKS
export const useTodaysSymptoms = () => {
  return useSupabaseData(getTodaysSymptoms, 'todays_symptoms', {
    event: '*',
    schema: 'public',
    table: 'symptoms',
  });
};

export const useAllSymptoms = () => {
  return useSupabaseData(getAllSymptoms, 'all_symptoms', {
    event: '*',
    schema: 'public',
    table: 'symptoms',
  });
};

export const useSymptomById = (id: string | null) => {
  return useSupabaseData(
    () => (id ? getSymptomById(id) : Promise.resolve(null)),
    `symptom_${id}`,
    {
      event: '*',
      schema: 'public',
      table: 'symptoms',
      filter: id ? `id=eq.${id}` : undefined,
    },
    [id]
  );
};

export const useRecentSymptoms = (limit: number = 5) => {
  return useSupabaseData(
    async () => {
      const data = await getAllSymptoms();
      return data.slice(0, limit);
    },
    'recent_symptoms',
    {
      event: '*',
      schema: 'public',
      table: 'symptoms',
    },
    [limit]
  );
};

// OPTIMIZED ANALYTICS HOOKS
export const useFoodStats = () => {
  return useSupabaseData(
    async () => {
      try {
        let foodsToAnalyze = await getTodaysFoods();

        // If no foods today, fallback to recent foods for better UX
        if (!foodsToAnalyze || foodsToAnalyze.length === 0) {
          const recentFoods = await getAllFoods();
          foodsToAnalyze = recentFoods.slice(0, 5);

          if (!foodsToAnalyze || foodsToAnalyze.length === 0) {
            return {
              greenIngredients: 0,
              yellowIngredients: 0,
              redIngredients: 0,
              totalIngredients: 0,
              organicCount: 0,
              totalOrganicPercentage: 0,
              isFromToday: false,
            };
          }
        }

        const todaysFoods = await getTodaysFoods();
        const isFromToday = todaysFoods.length > 0;

        const ingredients = foodsToAnalyze.flatMap(
          food => food.ingredients || []
        );

        const greenIngredients = ingredients.filter(
          ing => ing.zone === 'green'
        ).length;
        const yellowIngredients = ingredients.filter(
          ing => ing.zone === 'yellow'
        ).length;
        const redIngredients = ingredients.filter(
          ing => ing.zone === 'red'
        ).length;

        const organicIngredientsCount = ingredients.filter(
          ing => ing.organic === true
        ).length;
        const totalOrganicPercentage =
          ingredients.length > 0
            ? (organicIngredientsCount / ingredients.length) * 100
            : 0;

        return {
          greenIngredients,
          yellowIngredients,
          redIngredients,
          totalIngredients: ingredients.length,
          organicCount: organicIngredientsCount,
          totalOrganicPercentage,
          isFromToday,
        };
      } catch (error) {
        logger.error('Error calculating food stats', error);
        return {
          greenIngredients: 0,
          yellowIngredients: 0,
          redIngredients: 0,
          totalIngredients: 0,
          organicCount: 0,
          totalOrganicPercentage: 0,
          isFromToday: false,
        };
      }
    },
    'food_stats',
    {
      event: '*',
      schema: 'public',
      table: 'foods',
    }
  );
};

export const useSymptomTrends = (days: number = 7) => {
  return useSupabaseData(
    async () => {
      try {
        const allSymptoms = await getAllSymptoms();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSymptoms = allSymptoms.filter(
          symptom => new Date(symptom.timestamp) >= cutoffDate
        );

        // Group symptoms by day
        const symptomsByDay: { [key: string]: Symptom[] } = {};
        recentSymptoms.forEach(symptom => {
          const day = symptom.timestamp.split('T')[0];
          if (!symptomsByDay[day]) {
            symptomsByDay[day] = [];
          }
          symptomsByDay[day].push(symptom);
        });

        // Calculate average score per day (MSQ 0-4 scale)
        const trendData = Object.entries(symptomsByDay).map(
          ([day, symptoms]) => ({
            day,
            count: symptoms.length,
            averageScore:
              symptoms.reduce((sum, s) => sum + s.score, 0) /
              symptoms.length,
          })
        );

        return trendData.sort((a, b) => a.day.localeCompare(b.day));
      } catch (error) {
        logger.error('Error calculating symptom trends', error);
        return [];
      }
    },
    'symptom_trends',
    {
      event: '*',
      schema: 'public',
      table: 'symptoms',
    },
    [days]
  );
};

// DAILY SUMMARY HOOK - Using shared subscription for both tables
export const useDailySummary = () => {
  const { data: foods } = useTodaysFoods();
  const { data: symptoms } = useTodaysSymptoms();

  const [summary, setSummary] = useState<
    | {
        foods: number;
        symptoms: number;
        totalEntries: number;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (foods !== undefined && symptoms !== undefined) {
      setSummary({
        foods: foods.length,
        symptoms: symptoms.length,
        totalEntries: foods.length + symptoms.length,
      });
    }
  }, [foods, symptoms]);

  return summary;
};

// CONSOLIDATED DASHBOARD DATA HOOK - Fixes infinite loop by batching requests
export const useDashboardData = () => {
  return useSWR(
    'dashboard-data',
    async () => {
      try {
        // Batch all data requests with Promise.all for coordinated fetching
        const [allFoods, allSymptoms, todaysFoods, todaysSymptoms] =
          await Promise.all([
            getAllFoods(),
            getAllSymptoms(),
            getTodaysFoods(),
            getTodaysSymptoms(),
          ]);

        // Process data client-side to avoid additional API calls
        const recentFoods = allFoods.slice(0, 5);
        const recentSymptoms = allSymptoms.slice(0, 5);

        // Calculate food stats client-side (eliminates duplicate getAllFoods call)
        const foodsToAnalyze =
          todaysFoods.length > 0 ? todaysFoods : allFoods.slice(0, 5);
        const isFromToday = todaysFoods.length > 0;

        const ingredients = foodsToAnalyze.flatMap(
          food => food.ingredients || []
        );

        const greenIngredients = ingredients.filter(
          ing => ing.zone === 'green'
        ).length;
        const yellowIngredients = ingredients.filter(
          ing => ing.zone === 'yellow'
        ).length;
        const redIngredients = ingredients.filter(
          ing => ing.zone === 'red'
        ).length;

        const organicIngredientsCount = ingredients.filter(
          ing => ing.organic === true
        ).length;
        const totalOrganicPercentage =
          ingredients.length > 0
            ? (organicIngredientsCount / ingredients.length) * 100
            : 0;

        const foodStats = {
          greenIngredients,
          yellowIngredients,
          redIngredients,
          totalIngredients: ingredients.length,
          organicCount: organicIngredientsCount,
          totalOrganicPercentage,
          isFromToday,
        };

        return {
          recentFoods,
          recentSymptoms,
          todaysSymptoms,
          foodStats,
        };
      } catch (error) {
        logger.error('Error fetching dashboard data', error);
        // Return empty data structure to prevent crashes
        return {
          recentFoods: [] as Food[],
          recentSymptoms: [] as Symptom[],
          todaysSymptoms: [] as Symptom[],
          foodStats: {
            greenIngredients: 0,
            yellowIngredients: 0,
            redIngredients: 0,
            totalIngredients: 0,
            organicCount: 0,
            totalOrganicPercentage: 0,
            isFromToday: false,
          },
        };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Prevent duplicate requests for 30 seconds
      errorRetryCount: 2, // Limit retry attempts to prevent infinite loops
      errorRetryInterval: 2000, // 2 second delay between retries
    }
  );
};
