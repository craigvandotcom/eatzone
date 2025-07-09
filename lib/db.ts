import Dexie, { Table } from "dexie";
import { Meal, Ingredient, Liquid, Symptom, Stool } from "./types";

export class HealthTrackerDB extends Dexie {
  meals!: Table<Meal, string>;
  liquids!: Table<Liquid, string>;
  symptoms!: Table<Symptom, string>;
  stools!: Table<Stool, string>;

  constructor() {
    super("HealthTrackerDB");
    this.version(1).stores({
      meals: "++id, timestamp",
      liquids: "++id, timestamp, type",
      symptoms: "++id, timestamp",
      stools: "++id, timestamp",
    });
  }
}

export const db = new HealthTrackerDB();

// Helper function to generate ISO timestamp
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

// Helper function to generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Helper function to check if a timestamp is from today
export const isToday = (timestamp: string): boolean => {
  const today = getTodayDate();
  return timestamp.startsWith(today);
};

// MEAL OPERATIONS
export const addMeal = async (
  meal: Omit<Meal, "id" | "timestamp">
): Promise<string> => {
  const newMeal: Meal = {
    ...meal,
    id: generateId(),
    timestamp: generateTimestamp(),
  };
  await db.meals.add(newMeal);
  return newMeal.id;
};

export const updateMeal = async (
  id: string,
  updates: Partial<Omit<Meal, "id">>
): Promise<void> => {
  await db.meals.update(id, updates);
};

export const deleteMeal = async (id: string): Promise<void> => {
  await db.meals.delete(id);
};

export const getMealById = async (id: string): Promise<Meal | undefined> => {
  return await db.meals.get(id);
};

export const getAllMeals = async (): Promise<Meal[]> => {
  return await db.meals.orderBy("timestamp").reverse().toArray();
};

export const getTodaysMeals = async (): Promise<Meal[]> => {
  const today = getTodayDate();
  return await db.meals
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
};

// LIQUID OPERATIONS
export const addLiquid = async (
  liquid: Omit<Liquid, "id" | "timestamp">
): Promise<string> => {
  const newLiquid: Liquid = {
    ...liquid,
    id: generateId(),
    timestamp: generateTimestamp(),
  };
  await db.liquids.add(newLiquid);
  return newLiquid.id;
};

export const updateLiquid = async (
  id: string,
  updates: Partial<Omit<Liquid, "id">>
): Promise<void> => {
  await db.liquids.update(id, updates);
};

export const deleteLiquid = async (id: string): Promise<void> => {
  await db.liquids.delete(id);
};

export const getLiquidById = async (
  id: string
): Promise<Liquid | undefined> => {
  return await db.liquids.get(id);
};

export const getAllLiquids = async (): Promise<Liquid[]> => {
  return await db.liquids.orderBy("timestamp").reverse().toArray();
};

export const getTodaysLiquids = async (): Promise<Liquid[]> => {
  const today = getTodayDate();
  return await db.liquids
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
};

export const getLiquidsByType = async (type: string): Promise<Liquid[]> => {
  return await db.liquids.where("type").equals(type).reverse().toArray();
};

// SYMPTOM OPERATIONS
export const addSymptom = async (
  symptom: Omit<Symptom, "id" | "timestamp">
): Promise<string> => {
  const newSymptom: Symptom = {
    ...symptom,
    id: generateId(),
    timestamp: generateTimestamp(),
  };
  await db.symptoms.add(newSymptom);
  return newSymptom.id;
};

export const updateSymptom = async (
  id: string,
  updates: Partial<Omit<Symptom, "id">>
): Promise<void> => {
  await db.symptoms.update(id, updates);
};

export const deleteSymptom = async (id: string): Promise<void> => {
  await db.symptoms.delete(id);
};

export const getSymptomById = async (
  id: string
): Promise<Symptom | undefined> => {
  return await db.symptoms.get(id);
};

export const getAllSymptoms = async (): Promise<Symptom[]> => {
  return await db.symptoms.orderBy("timestamp").reverse().toArray();
};

export const getTodaysSymptoms = async (): Promise<Symptom[]> => {
  const today = getTodayDate();
  return await db.symptoms
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
};

// STOOL OPERATIONS
export const addStool = async (
  stool: Omit<Stool, "id" | "timestamp">
): Promise<string> => {
  const newStool: Stool = {
    ...stool,
    id: generateId(),
    timestamp: generateTimestamp(),
  };
  await db.stools.add(newStool);
  return newStool.id;
};

export const updateStool = async (
  id: string,
  updates: Partial<Omit<Stool, "id">>
): Promise<void> => {
  await db.stools.update(id, updates);
};

export const deleteStool = async (id: string): Promise<void> => {
  await db.stools.delete(id);
};

export const getStoolById = async (id: string): Promise<Stool | undefined> => {
  return await db.stools.get(id);
};

export const getAllStools = async (): Promise<Stool[]> => {
  return await db.stools.orderBy("timestamp").reverse().toArray();
};

export const getTodaysStools = async (): Promise<Stool[]> => {
  const today = getTodayDate();
  return await db.stools
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
};

// UTILITY OPERATIONS
export const clearAllData = async (): Promise<void> => {
  await db.transaction(
    "rw",
    db.meals,
    db.liquids,
    db.symptoms,
    db.stools,
    async () => {
      await db.meals.clear();
      await db.liquids.clear();
      await db.symptoms.clear();
      await db.stools.clear();
    }
  );
};

export const exportAllData = async (): Promise<{
  meals: Meal[];
  liquids: Liquid[];
  symptoms: Symptom[];
  stools: Stool[];
  exportedAt: string;
}> => {
  const [meals, liquids, symptoms, stools] = await Promise.all([
    getAllMeals(),
    getAllLiquids(),
    getAllSymptoms(),
    getAllStools(),
  ]);

  return {
    meals,
    liquids,
    symptoms,
    stools,
    exportedAt: generateTimestamp(),
  };
};

export const importAllData = async (data: {
  meals: Meal[];
  liquids: Liquid[];
  symptoms: Symptom[];
  stools: Stool[];
}): Promise<void> => {
  await db.transaction(
    "rw",
    db.meals,
    db.liquids,
    db.symptoms,
    db.stools,
    async () => {
      await db.meals.clear();
      await db.liquids.clear();
      await db.symptoms.clear();
      await db.stools.clear();

      await db.meals.bulkAdd(data.meals);
      await db.liquids.bulkAdd(data.liquids);
      await db.symptoms.bulkAdd(data.symptoms);
      await db.stools.bulkAdd(data.stools);
    }
  );
};
