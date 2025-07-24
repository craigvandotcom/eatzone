// Custom React hooks for reactive data binding with IndexedDB
// Uses useLiveQuery from dexie-react-hooks for automatic UI updates

import { useLiveQuery } from "dexie-react-hooks";
import { Symptom } from "./types";
import {
  getAllFoods,
  getAllSymptoms,
  getTodaysFoods,
  getTodaysSymptoms,
  getFoodById,
  getSymptomById,
} from "./db";

// FOOD HOOKS
export const useTodaysFoods = () => {
  return useLiveQuery(async () => {
    return await getTodaysFoods();
  }, []);
};

export const useAllFoods = () => {
  return useLiveQuery(async () => {
    return await getAllFoods();
  }, []);
};

export const useFoodById = (id: string | null) => {
  return useLiveQuery(async () => {
    if (!id) return null;
    return await getFoodById(id);
  }, [id]);
};

export const useRecentFoods = (limit: number = 5) => {
  return useLiveQuery(async () => {
    const foods = await getAllFoods();
    return foods.slice(0, limit);
  }, [limit]);
};

// SYMPTOM HOOKS
export const useTodaysSymptoms = () => {
  return useLiveQuery(async () => {
    return await getTodaysSymptoms();
  }, []);
};

export const useAllSymptoms = () => {
  return useLiveQuery(async () => {
    return await getAllSymptoms();
  }, []);
};

export const useSymptomById = (id: string | null) => {
  return useLiveQuery(async () => {
    if (!id) return null;
    return await getSymptomById(id);
  }, [id]);
};

export const useRecentSymptoms = (limit: number = 5) => {
  return useLiveQuery(async () => {
    const symptoms = await getAllSymptoms();
    return symptoms.slice(0, limit);
  }, [limit]);
};

// ANALYTICS HOOKS
export const useFoodStats = () => {
  return useLiveQuery(async () => {
    try {
      let foodsToAnalyze = await getTodaysFoods();

      // If no foods today, fallback to recent foods for better UX
      if (!foodsToAnalyze || foodsToAnalyze.length === 0) {
        const recentFoods = await getAllFoods();
        foodsToAnalyze = recentFoods.slice(0, 5); // Get the 5 most recent foods

        // If still no foods, return empty stats
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

      // Check if we're analyzing today's foods or recent foods
      const todaysFoods = await getTodaysFoods();
      const isFromToday = todaysFoods.length > 0;

      const ingredients = foodsToAnalyze.flatMap(
        food => food.ingredients || []
      );

      const greenIngredients = ingredients.filter(
        ing => ing.zone === "green"
      ).length;
      const yellowIngredients = ingredients.filter(
        ing => ing.zone === "yellow"
      ).length;
      const redIngredients = ingredients.filter(
        ing => ing.zone === "red"
      ).length;

      const organicIngredientsCount = ingredients.filter(
        ing => ing.isOrganic === true
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
      console.error("Error calculating food stats:", error);
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
  }, []);
};

export const useSymptomTrends = (days: number = 7) => {
  return useLiveQuery(async () => {
    const allSymptoms = await getAllSymptoms();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentSymptoms = allSymptoms.filter(
      symptom => new Date(symptom.timestamp) >= cutoffDate
    );

    // Group symptoms by day
    const symptomsByDay: { [key: string]: Symptom[] } = {};
    recentSymptoms.forEach(symptom => {
      const day = symptom.timestamp.split("T")[0];
      if (!symptomsByDay[day]) {
        symptomsByDay[day] = [];
      }
      symptomsByDay[day].push(symptom);
    });

    // Calculate average severity per day
    const trendData = Object.entries(symptomsByDay).map(([day, symptoms]) => ({
      day,
      count: symptoms.length,
      averageSeverity:
        symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length,
    }));

    return trendData.sort((a, b) => a.day.localeCompare(b.day));
  }, [days]);
};

// DAILY SUMMARY HOOK
export const useDailySummary = () => {
  return useLiveQuery(async () => {
    const [foods, symptoms] = await Promise.all([
      getTodaysFoods(),
      getTodaysSymptoms(),
    ]);

    return {
      foods: foods.length,
      symptoms: symptoms.length,
      totalEntries: foods.length + symptoms.length,
    };
  }, []);
};
