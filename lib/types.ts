// TypeScript interfaces for the Health Tracker PWA
// Based on the PRD data structures

export interface Meal {
  id: string;
  name: string; // e.g., "Chicken Salad & more"
  time: string; // "HH:mm"
  date: string; // "yyyy-MM-dd"
  category: string;
  healthCategory?: "green" | "yellow" | "red" | "analyzing";
  ingredients?: Ingredient[];
  image?: string; // base64 data URL from camera
  notes?: string;
}

export interface Ingredient {
  name: string;
  isOrganic: boolean;
  cookingMethod?: string; // "raw", "fried", "steamed", etc.
  healthCategory?: "green" | "yellow" | "red";
}

export interface Liquid {
  id: string;
  name: string;
  time: string;
  date: string;
  amount: number; // in ml
  type: string; // "water", "coffee", etc.
  notes?: string;
  image?: string;
}

export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-5
  time: string;
  date: string;
  notes?: string;
}

export interface Stool {
  id: string;
  time: string;
  date: string;
  type: number; // Bristol Stool Scale 1-7
  color: string;
  consistency: string;
  notes?: string;
  image?: string;
}

// Export types for backward compatibility with existing imports
export type { Meal as MealType };
export type { Liquid as LiquidType };
export type { Stool as StoolType };
export type { Symptom as SymptomType };
export type { Ingredient as IngredientType };
