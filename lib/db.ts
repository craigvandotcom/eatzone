import { createClient } from "@/lib/supabase/client";
import { Food, Symptom, User } from "./types";

// Get Supabase client
const supabase = createClient();

// Helper function to generate ISO timestamp
export const generateTimestamp = (): string => {
  return new Date().toISOString();
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

// FOOD OPERATIONS
export const addFood = async (
  food: Omit<Food, "id" | "timestamp">
): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  const newFood = {
    ...food,
    user_id: user.user.id,
    timestamp: generateTimestamp(),
  };

  const { data, error } = await supabase
    .from("foods")
    .insert(newFood)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const updateFood = async (
  id: string,
  updates: Partial<Omit<Food, "id">>
): Promise<void> => {
  const { error } = await supabase
    .from("foods")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
};

export const deleteFood = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("foods")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const getAllFoods = async (): Promise<Food[]> => {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getRecentFoods = async (limit: number = 10): Promise<Food[]> => {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getTodaysFoods = async (): Promise<Food[]> => {
  const today = getTodayDate();
  const startRange = today + "T00:00:00.000Z";
  const endRange = today + "T23:59:59.999Z";

  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .gte("timestamp", startRange)
    .lte("timestamp", endRange)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getFoodById = async (id: string): Promise<Food | undefined> => {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // No rows returned
    throw error;
  }
  return data;
};

// SYMPTOM OPERATIONS
export const addSymptom = async (
  symptom: Omit<Symptom, "id" | "timestamp">
): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  const newSymptom = {
    ...symptom,
    user_id: user.user.id,
    timestamp: generateTimestamp(),
  };

  const { data, error } = await supabase
    .from("symptoms")
    .insert(newSymptom)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const updateSymptom = async (
  id: string,
  updates: Partial<Omit<Symptom, "id">>
): Promise<void> => {
  const { error } = await supabase
    .from("symptoms")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
};

export const deleteSymptom = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("symptoms")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const getAllSymptoms = async (): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from("symptoms")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getRecentSymptoms = async (
  limit: number = 10
): Promise<Symptom[]> => {
  const { data, error } = await supabase
    .from("symptoms")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getTodaysSymptoms = async (): Promise<Symptom[]> => {
  const today = getTodayDate();
  const startRange = today + "T00:00:00.000Z";
  const endRange = today + "T23:59:59.999Z";

  const { data, error } = await supabase
    .from("symptoms")
    .select("*")
    .gte("timestamp", startRange)
    .lte("timestamp", endRange)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSymptomById = async (
  id: string
): Promise<Symptom | undefined> => {
  const { data, error } = await supabase
    .from("symptoms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // No rows returned
    throw error;
  }
  return data;
};

// UTILITY OPERATIONS
export const clearAllData = async (): Promise<void> => {
  // Clear user's foods and symptoms
  const { error: foodsError } = await supabase
    .from("foods")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all user's records

  if (foodsError) throw foodsError;

  const { error: symptomsError } = await supabase
    .from("symptoms")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all user's records

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
  if (!user.user) throw new Error("User not authenticated");

  // Clear existing data first
  await clearAllData();

  // Import foods
  if (data.foods.length > 0) {
    const foodsToInsert = data.foods.map(food => ({
      ...food,
      user_id: user.user.id,
    }));

    const { error: foodsError } = await supabase
      .from("foods")
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
      .from("symptoms")
      .insert(symptomsToInsert);

    if (symptomsError) throw symptomsError;
  }
};

// USER OPERATIONS (Simplified since Supabase handles auth)
export const getUserById = async (id: string): Promise<User | undefined> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || undefined;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
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
  if (!data.user) throw new Error("Failed to create user");

  // Create user profile following Supabase best practice
  // Using upsert to handle any race conditions
  const { error: profileError } = await supabase
    .from("users")
    .upsert({
      id: data.user.id,
      email: data.user.email || email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) {
    console.error("Failed to create user profile:", profileError);
    throw new Error("Failed to create user profile");
  }

  // Fetch the profile to ensure consistency
  const profile = await getUserById(data.user.id);
  if (!profile) {
    throw new Error("Failed to create user profile");
  }

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
  if (!data.user || !data.session) throw new Error("Authentication failed");

  const profile = await getUserById(data.user.id);
  if (!profile) throw new Error("User profile not found");

  return {
    user: profile,
    token: data.session.access_token,
  };
};

export const validateSession = async (token?: string): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser(token);
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
  console.warn("generateId() is deprecated with Supabase - UUIDs are auto-generated");
  return crypto.randomUUID();
};

export const clearExpiredSessions = async (): Promise<void> => {
  console.warn("clearExpiredSessions() is deprecated - Supabase handles session management");
  // Supabase handles session expiration automatically
};

export const updateUserSettings = async (
  _userId: string,
  _settings: Partial<User["settings"]>
): Promise<void> => {
  console.warn("updateUserSettings() is deprecated - user settings moved to auth metadata");
  // User settings would now be handled through Supabase user metadata
  // This function is kept for backward compatibility but doesn't do anything
};

// Backwards compatibility - maintain the HealthTrackerDB class structure for any direct references
export class HealthTrackerDB {
  constructor() {
    console.warn("HealthTrackerDB class is deprecated - now using Supabase");
  }
}

export const db = new HealthTrackerDB();