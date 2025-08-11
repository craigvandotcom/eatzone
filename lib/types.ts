// TypeScript interfaces for the Health Tracker PWA
// Based on the PRD data structures

// Authentication types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string; // ISO 8601 string
  lastLoginAt?: string; // ISO 8601 string
  settings?: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  waterGoal: number; // in ml
  notifications: {
    reminders: boolean;
    dailySummary: boolean;
  };
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string; // ISO 8601 string
  createdAt: string; // ISO 8601 string
}

export interface Food {
  id: string;
  name: string; // e.g., "Lunch" or a user-defined name
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  ingredients: Ingredient[]; // A food entry is defined by its ingredients
  photo_url?: string; // Primary image for backward compatibility
  image_urls?: string[]; // Array of all image URLs (includes photo_url if present)
  notes?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'; // Optional meal categorization
  status: 'pending_review' | 'analyzing' | 'processed';
}

export interface Ingredient {
  name: string;
  organic: boolean; // Renamed from 'isOrganic' to match Supabase schema
  cookingMethod?:
    | 'raw'
    | 'fried'
    | 'steamed'
    | 'baked'
    | 'grilled'
    | 'roasted'
    | 'other';
  category?: string; // Main classification (e.g., "Proteins", "Vegetables", "Fruits")
  group: string; // Primary classification (e.g., "Low-Sugar Berries", "Quality Animal Proteins", "Leafy Greens")
  zone: 'green' | 'yellow' | 'red' | 'unzoned';
}

export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-5
  timestamp: string; // ISO 8601 string (e.g., "2025-07-04T22:15:00.000Z")
  notes?: string;
}

// Export types for backward compatibility with existing imports
export type { Symptom as SymptomType };
export type { Ingredient as IngredientType };

// OpenRouter API types for proper type safety
export interface OpenRouterTextContent {
  type: 'text';
  text: string;
}

export interface OpenRouterImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export type OpenRouterMessageContent =
  | OpenRouterTextContent
  | OpenRouterImageContent;

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterMessageContent[];
}

export interface OpenRouterChatCompletionRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

// Re-export common types for convenience
export type { Database } from './supabase/types';
