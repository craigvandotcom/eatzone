// Custom React hooks for reactive data binding with Supabase
// Uses Supabase real-time subscriptions for automatic UI updates

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Food, Symptom } from './types';
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

// FOOD HOOKS
export const useTodaysFoods = () => {
  const [foods, setFoods] = useState<Food[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchFoods = async () => {
      try {
        const data = await getTodaysFoods();
        setFoods(data);
      } catch (error) {
        logger.error("Error fetching today's foods", error);
        setFoods([]);
      }
    };

    fetchFoods();

    // Set up real-time subscription
    const subscription = supabase
      .channel('foods_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
        },
        () => {
          // Refetch data when any food changes
          fetchFoods();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return foods;
};

export const useAllFoods = () => {
  const [foods, setFoods] = useState<Food[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchFoods = async () => {
      try {
        const data = await getAllFoods();
        setFoods(data);
      } catch (error) {
        logger.error('Error fetching all foods', error);
        setFoods([]);
      }
    };

    fetchFoods();

    // Set up real-time subscription
    const subscription = supabase
      .channel('all_foods_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
        },
        () => {
          // Refetch data when any food changes
          fetchFoods();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return foods;
};

export const useFoodById = (id: string | null) => {
  const [food, setFood] = useState<Food | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setFood(null);
      return;
    }

    // Initial fetch
    const fetchFood = async () => {
      try {
        const data = await getFoodById(id);
        setFood(data || null);
      } catch (error) {
        logger.error('Error fetching food by id', error);
        setFood(null);
      }
    };

    fetchFood();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`food_${id}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
          filter: `id=eq.${id}`,
        },
        () => {
          // Refetch data when this specific food changes
          fetchFood();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  return food;
};

export const useRecentFoods = (limit: number = 5) => {
  const [foods, setFoods] = useState<Food[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchFoods = async () => {
      try {
        const data = await getAllFoods();
        setFoods(data.slice(0, limit));
      } catch (error) {
        logger.error('Error fetching recent foods', error);
        setFoods([]);
      }
    };

    fetchFoods();

    // Set up real-time subscription
    const subscription = supabase
      .channel('recent_foods_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
        },
        () => {
          // Refetch data when any food changes
          fetchFoods();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [limit]);

  return foods;
};

// SYMPTOM HOOKS
export const useTodaysSymptoms = () => {
  const [symptoms, setSymptoms] = useState<Symptom[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchSymptoms = async () => {
      try {
        const data = await getTodaysSymptoms();
        setSymptoms(data);
      } catch (error) {
        logger.error("Error fetching today's symptoms", error);
        setSymptoms([]);
      }
    };

    fetchSymptoms();

    // Set up real-time subscription
    const subscription = supabase
      .channel('symptoms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
        },
        () => {
          // Refetch data when any symptom changes
          fetchSymptoms();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return symptoms;
};

export const useAllSymptoms = () => {
  const [symptoms, setSymptoms] = useState<Symptom[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchSymptoms = async () => {
      try {
        const data = await getAllSymptoms();
        setSymptoms(data);
      } catch (error) {
        logger.error('Error fetching all symptoms', error);
        setSymptoms([]);
      }
    };

    fetchSymptoms();

    // Set up real-time subscription
    const subscription = supabase
      .channel('all_symptoms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
        },
        () => {
          // Refetch data when any symptom changes
          fetchSymptoms();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return symptoms;
};

export const useSymptomById = (id: string | null) => {
  const [symptom, setSymptom] = useState<Symptom | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setSymptom(null);
      return;
    }

    // Initial fetch
    const fetchSymptom = async () => {
      try {
        const data = await getSymptomById(id);
        setSymptom(data || null);
      } catch (error) {
        logger.error('Error fetching symptom by id', error);
        setSymptom(null);
      }
    };

    fetchSymptom();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`symptom_${id}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
          filter: `id=eq.${id}`,
        },
        () => {
          // Refetch data when this specific symptom changes
          fetchSymptom();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  return symptom;
};

export const useRecentSymptoms = (limit: number = 5) => {
  const [symptoms, setSymptoms] = useState<Symptom[] | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    const fetchSymptoms = async () => {
      try {
        const data = await getAllSymptoms();
        setSymptoms(data.slice(0, limit));
      } catch (error) {
        logger.error('Error fetching recent symptoms', error);
        setSymptoms([]);
      }
    };

    fetchSymptoms();

    // Set up real-time subscription
    const subscription = supabase
      .channel('recent_symptoms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
        },
        () => {
          // Refetch data when any symptom changes
          fetchSymptoms();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [limit]);

  return symptoms;
};

// ANALYTICS HOOKS
export const useFoodStats = () => {
  const [stats, setStats] = useState<
    | {
        greenIngredients: number;
        yellowIngredients: number;
        redIngredients: number;
        totalIngredients: number;
        organicCount: number;
        totalOrganicPercentage: number;
        isFromToday: boolean;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    // Function to calculate stats
    const calculateStats = async () => {
      try {
        let foodsToAnalyze = await getTodaysFoods();

        // If no foods today, fallback to recent foods for better UX
        if (!foodsToAnalyze || foodsToAnalyze.length === 0) {
          const recentFoods = await getAllFoods();
          foodsToAnalyze = recentFoods.slice(0, 5); // Get the 5 most recent foods

          // If still no foods, return empty stats
          if (!foodsToAnalyze || foodsToAnalyze.length === 0) {
            setStats({
              greenIngredients: 0,
              yellowIngredients: 0,
              redIngredients: 0,
              totalIngredients: 0,
              organicCount: 0,
              totalOrganicPercentage: 0,
              isFromToday: false,
            });
            return;
          }
        }

        // Check if we're analyzing today's foods or recent foods
        const todaysFoods = await getTodaysFoods();
        const isFromToday = todaysFoods.length > 0;

        const ingredients = foodsToAnalyze.flatMap(
          (food) => food.ingredients || [],
        );

        const greenIngredients = ingredients.filter(
          (ing) => ing.zone === 'green',
        ).length;
        const yellowIngredients = ingredients.filter(
          (ing) => ing.zone === 'yellow',
        ).length;
        const redIngredients = ingredients.filter(
          (ing) => ing.zone === 'red',
        ).length;

        const organicIngredientsCount = ingredients.filter(
          (ing) => ing.organic === true,
        ).length;
        const totalOrganicPercentage =
          ingredients.length > 0
            ? (organicIngredientsCount / ingredients.length) * 100
            : 0;

        setStats({
          greenIngredients,
          yellowIngredients,
          redIngredients,
          totalIngredients: ingredients.length,
          organicCount: organicIngredientsCount,
          totalOrganicPercentage,
          isFromToday,
        });
      } catch (error) {
        logger.error('Error calculating food stats', error);
        setStats({
          greenIngredients: 0,
          yellowIngredients: 0,
          redIngredients: 0,
          totalIngredients: 0,
          organicCount: 0,
          totalOrganicPercentage: 0,
          isFromToday: false,
        });
      }
    };

    // Initial calculation
    calculateStats();

    // Set up real-time subscription
    const subscription = supabase
      .channel('food_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
        },
        () => {
          // Recalculate stats when any food changes
          calculateStats();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return stats;
};

export const useSymptomTrends = (days: number = 7) => {
  const [trends, setTrends] = useState<
    | Array<{
        day: string;
        count: number;
        averageSeverity: number;
      }>
    | undefined
  >(undefined);

  useEffect(() => {
    // Function to calculate trends
    const calculateTrends = async () => {
      try {
        const allSymptoms = await getAllSymptoms();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSymptoms = allSymptoms.filter(
          (symptom) => new Date(symptom.timestamp) >= cutoffDate,
        );

        // Group symptoms by day
        const symptomsByDay: { [key: string]: Symptom[] } = {};
        recentSymptoms.forEach((symptom) => {
          const day = symptom.timestamp.split('T')[0];
          if (!symptomsByDay[day]) {
            symptomsByDay[day] = [];
          }
          symptomsByDay[day].push(symptom);
        });

        // Calculate average severity per day
        const trendData = Object.entries(symptomsByDay).map(
          ([day, symptoms]) => ({
            day,
            count: symptoms.length,
            averageSeverity:
              symptoms.reduce((sum, s) => sum + s.severity, 0) /
              symptoms.length,
          }),
        );

        setTrends(trendData.sort((a, b) => a.day.localeCompare(b.day)));
      } catch (error) {
        logger.error('Error calculating symptom trends', error);
        setTrends([]);
      }
    };

    // Initial calculation
    calculateTrends();

    // Set up real-time subscription
    const subscription = supabase
      .channel('symptom_trends_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
        },
        () => {
          // Recalculate trends when any symptom changes
          calculateTrends();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [days]);

  return trends;
};

// DAILY SUMMARY HOOK
export const useDailySummary = () => {
  const [summary, setSummary] = useState<
    | {
        foods: number;
        symptoms: number;
        totalEntries: number;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    // Function to calculate summary
    const calculateSummary = async () => {
      try {
        const [foods, symptoms] = await Promise.all([
          getTodaysFoods(),
          getTodaysSymptoms(),
        ]);

        setSummary({
          foods: foods.length,
          symptoms: symptoms.length,
          totalEntries: foods.length + symptoms.length,
        });
      } catch (error) {
        logger.error('Error calculating daily summary', error);
        setSummary({
          foods: 0,
          symptoms: 0,
          totalEntries: 0,
        });
      }
    };

    // Initial calculation
    calculateSummary();

    // Set up real-time subscriptions for both tables
    const foodsSubscription = supabase
      .channel('daily_summary_foods')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foods',
        },
        () => {
          calculateSummary();
        },
      )
      .subscribe();

    const symptomsSubscription = supabase
      .channel('daily_summary_symptoms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptoms',
        },
        () => {
          calculateSummary();
        },
      )
      .subscribe();

    return () => {
      foodsSubscription.unsubscribe();
      symptomsSubscription.unsubscribe();
    };
  }, []);

  return summary;
};
