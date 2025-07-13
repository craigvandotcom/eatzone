// Custom React hooks for reactive data binding with IndexedDB
// Uses useLiveQuery from dexie-react-hooks for automatic UI updates

import { useLiveQuery } from "dexie-react-hooks";
import { Symptom, Stool } from "./types";
import {
  getAllFoods,
  getAllLiquids,
  getAllSymptoms,
  getAllStools,
  getTodaysFoods,
  getTodaysLiquids,
  getTodaysSymptoms,
  getTodaysStools,
  getLiquidsByType,
  getFoodById,
  getLiquidById,
  getSymptomById,
  getStoolById,
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

// LIQUID HOOKS
export const useTodaysLiquids = () => {
  return useLiveQuery(async () => {
    return await getTodaysLiquids();
  }, []);
};

export const useAllLiquids = () => {
  return useLiveQuery(async () => {
    return await getAllLiquids();
  }, []);
};

export const useLiquidById = (id: string | null) => {
  return useLiveQuery(async () => {
    if (!id) return null;
    return await getLiquidById(id);
  }, [id]);
};

export const useRecentLiquids = (limit: number = 5) => {
  return useLiveQuery(async () => {
    const liquids = await getAllLiquids();
    return liquids.slice(0, limit);
  }, [limit]);
};

export const useLiquidsByType = (type: string) => {
  return useLiveQuery(async () => {
    return await getLiquidsByType(type);
  }, [type]);
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

// STOOL HOOKS
export const useTodaysStools = () => {
  return useLiveQuery(async () => {
    return await getTodaysStools();
  }, []);
};

export const useAllStools = () => {
  return useLiveQuery(async () => {
    return await getAllStools();
  }, []);
};

export const useStoolById = (id: string | null) => {
  return useLiveQuery(async () => {
    if (!id) return null;
    return await getStoolById(id);
  }, [id]);
};

export const useRecentStools = (limit: number = 5) => {
  return useLiveQuery(async () => {
    const stools = await getAllStools();
    return stools.slice(0, limit);
  }, [limit]);
};

// ANALYTICS HOOKS
export const useWaterStats = () => {
  return useLiveQuery(async () => {
    try {
      const todaysLiquids = await getTodaysLiquids();
      const waterGoal = 2000; // 2L in ml
      const otherGoal = 1000; // 1L additional liquids goal
      const waterTypes = ["water"];

      if (!todaysLiquids) {
        return {
          waterAmount: 0,
          otherAmount: 0,
          waterPercentage: 0,
          otherPercentage: 0,
          waterGoal,
          otherGoal,
          totalAmount: 0,
        };
      }

      const waterAmount = todaysLiquids
        .filter(liquid => waterTypes.includes(liquid.type.toLowerCase()))
        .reduce((sum, liquid) => sum + liquid.amount, 0);

      const otherAmount = todaysLiquids
        .filter(liquid => !waterTypes.includes(liquid.type.toLowerCase()))
        .reduce((sum, liquid) => sum + liquid.amount, 0);

      const waterPercentage = Math.min((waterAmount / waterGoal) * 100, 100);
      const otherPercentage = Math.min((otherAmount / otherGoal) * 100, 100);

      return {
        waterAmount,
        otherAmount,
        waterPercentage,
        otherPercentage,
        waterGoal,
        otherGoal,
        totalAmount: waterAmount + otherAmount,
      };
    } catch (error) {
      console.error("Error calculating water stats:", error);
      return {
        waterAmount: 0,
        otherAmount: 0,
        waterPercentage: 0,
        otherPercentage: 0,
        waterGoal: 2000,
        otherGoal: 1000,
        totalAmount: 0,
      };
    }
  }, []);
};

export const useFoodStats = () => {
  return useLiveQuery(async () => {
    try {
      const todaysFoods = await getTodaysFoods();

      if (!todaysFoods || todaysFoods.length === 0) {
        return {
          greenIngredients: 0,
          yellowIngredients: 0,
          redIngredients: 0,
          totalIngredients: 0,
          organicCount: 0,
          totalOrganicPercentage: 0,
        };
      }

      const todaysIngredients = todaysFoods.flatMap(
        food => food.ingredients || []
      );

      const greenIngredients = todaysIngredients.filter(
        ing => ing.zone === "green"
      ).length;
      const yellowIngredients = todaysIngredients.filter(
        ing => ing.zone === "yellow"
      ).length;
      const redIngredients = todaysIngredients.filter(
        ing => ing.zone === "red"
      ).length;

      const organicIngredientsCount = todaysIngredients.filter(
        ing => ing.isOrganic === true
      ).length;
      const totalOrganicPercentage =
        todaysIngredients.length > 0
          ? (organicIngredientsCount / todaysIngredients.length) * 100
          : 0;

      return {
        greenIngredients,
        yellowIngredients,
        redIngredients,
        totalIngredients: todaysIngredients.length,
        organicCount: organicIngredientsCount,
        totalOrganicPercentage,
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

export const useStoolTrends = (days: number = 7) => {
  return useLiveQuery(async () => {
    const allStools = await getAllStools();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentStools = allStools.filter(
      stool => new Date(stool.timestamp) >= cutoffDate
    );

    // Group stools by day
    const stoolsByDay: { [key: string]: Stool[] } = {};
    recentStools.forEach(stool => {
      const day = stool.timestamp.split("T")[0];
      if (!stoolsByDay[day]) {
        stoolsByDay[day] = [];
      }
      stoolsByDay[day].push(stool);
    });

    // Calculate metrics per day
    const trendData = Object.entries(stoolsByDay).map(([day, stools]) => ({
      day,
      count: stools.length,
      averageBristolScale:
        stools.reduce((sum, s) => sum + s.bristolScale, 0) / stools.length,
      hasBloodCount: stools.filter(s => s.hasBlood).length,
    }));

    return trendData.sort((a, b) => a.day.localeCompare(b.day));
  }, [days]);
};

// DAILY SUMMARY HOOK
export const useDailySummary = () => {
  return useLiveQuery(async () => {
    const [foods, liquids, symptoms, stools] = await Promise.all([
      getTodaysFoods(),
      getTodaysLiquids(),
      getTodaysSymptoms(),
      getTodaysStools(),
    ]);

    return {
      foods: foods.length,
      liquids: liquids.length,
      symptoms: symptoms.length,
      stools: stools.length,
      totalEntries:
        foods.length + liquids.length + symptoms.length + stools.length,
    };
  }, []);
};
