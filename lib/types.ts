// TypeScript interfaces for the Health Tracker PWA
// Based on the PRD data structures

export interface Food {
  id: string;
  name: string; // e.g., "Lunch" or a user-defined name
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  ingredients: Ingredient[]; // A food entry is defined by its ingredients
  image?: string;
  notes?: string;
  status: "pending_review" | "analyzing" | "processed";
}

export interface Ingredient {
  name: string;
  isOrganic: boolean;
  cookingMethod?:
    | "raw"
    | "fried"
    | "steamed"
    | "baked"
    | "grilled"
    | "roasted"
    | "other";
  foodGroup:
    | "vegetable"
    | "fruit"
    | "protein"
    | "grain"
    | "dairy"
    | "fat"
    | "other";
  zone: "green" | "yellow" | "red";
}

export interface Liquid {
  id: string;
  name: string; // e.g. "Morning Coffee"
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  amount: number; // in ml
  type: "water" | "coffee" | "tea" | "juice" | "soda" | "dairy" | "other";
  notes?: string;
  image?: string;
}

export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-5
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  notes?: string;
}

export interface Stool {
  id: string;
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  bristolScale: number; // 1-7
  color: "brown" | "green" | "yellow" | "black" | "white" | "red" | "other";
  hasBlood: boolean;
  notes?: string;
  image?: string;
}

// Export types for backward compatibility with existing imports
export type { Liquid as LiquidType };
export type { Stool as StoolType };
export type { Symptom as SymptomType };
export type { Ingredient as IngredientType };
