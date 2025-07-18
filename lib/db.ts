import Dexie, { Table } from "dexie";
import { Food, Symptom, User, AuthSession } from "./types";
import bcrypt from "bcryptjs";
import * as jose from "jose";

export class HealthTrackerDB extends Dexie {
  foods!: Table<Food, string>;
  symptoms!: Table<Symptom, string>;
  users!: Table<User, string>;
  sessions!: Table<AuthSession, string>;

  constructor() {
    super("HealthTrackerDB");

    // Version 3 - Original schema with liquids and stools (deprecated)
    this.version(3).stores({
      foods: "id, timestamp",
      symptoms: "id, timestamp",
      users: "id, email",
      sessions: "userId, token, expiresAt",
      liquids: "id, timestamp", // Deprecated - will be removed
      stools: "id, timestamp", // Deprecated - will be removed
    });

    // Version 4 - Simplified schema (Foods + Symptoms only)
    this.version(4)
      .stores({
        foods: "id, timestamp",
        symptoms: "id, timestamp",
        users: "id, email",
        sessions: "userId, token, expiresAt",
        liquids: null, // Remove liquids table
        stools: null, // Remove stools table
      })
      .upgrade(async tx => {
        // Clean migration - remove deprecated tables
        console.log(
          "Migrating database to v4: Removing liquids and stools tables"
        );

        // The tables will be automatically removed by setting them to null
        // We can optionally log the migration
        try {
          const liquidCount = await tx.table("liquids").count();
          const stoolCount = await tx.table("stools").count();
          console.log(
            `Migration: Removed ${liquidCount} liquid entries and ${stoolCount} stool entries`
          );
        } catch (error) {
          console.log("Migration: Clean slate - no existing deprecated data");
        }
      });
  }
}

export const db = new HealthTrackerDB();

// Constants
const JWT_SECRET = "health-tracker-local-secret-key"; // For local storage only
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Helper function to encode the secret for jose
const getSecret = () => new TextEncoder().encode(JWT_SECRET);

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

// FOOD OPERATIONS
export const addFood = async (
  food: Omit<Food, "id" | "timestamp">
): Promise<string> => {
  const newFood: Food = {
    ...food,
    id: generateId(),
    timestamp: generateTimestamp(),
  };
  await db.foods.add(newFood);
  return newFood.id;
};

export const updateFood = async (
  id: string,
  updates: Partial<Omit<Food, "id">>
): Promise<void> => {
  await db.foods.update(id, updates);
};

export const deleteFood = async (id: string): Promise<void> => {
  await db.foods.delete(id);
};

export const getFoodById = async (id: string): Promise<Food | undefined> => {
  return await db.foods.get(id);
};

export const getAllFoods = async (): Promise<Food[]> => {
  return await db.foods.orderBy("timestamp").reverse().toArray();
};

export const getTodaysFoods = async (): Promise<Food[]> => {
  const today = getTodayDate();
  return await db.foods
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
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

// UTILITY OPERATIONS
export const clearAllData = async (): Promise<void> => {
  await db.transaction("rw", db.foods, db.symptoms, async () => {
    await db.foods.clear();
    await db.symptoms.clear();
  });
};

// Database reset utility - useful for handling migration issues
export const resetDatabase = async (): Promise<void> => {
  try {
    // Close the database first
    db.close();
    
    // Delete the entire database
    await db.delete();
    
    // Reopen the database (will create fresh with latest schema)
    await db.open();
    
    console.log("Database reset successfully");
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
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
  await db.transaction("rw", db.foods, db.symptoms, async () => {
    await db.foods.clear();
    await db.symptoms.clear();

    await db.foods.bulkAdd(data.foods);
    await db.symptoms.bulkAdd(data.symptoms);
  });
};

// AUTHENTICATION OPERATIONS

export const createUser = async (
  email: string,
  password: string
): Promise<User> => {
  // Check if user already exists
  const existingUser = await db.users.where("email").equals(email).first();
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser: User = {
    id: generateId(),
    email,
    passwordHash,
    createdAt: generateTimestamp(),
    settings: {
      theme: "system",
      waterGoal: 2000, // 2L default
      notifications: {
        reminders: true,
        dailySummary: true,
      },
    },
  };

  await db.users.add(newUser);
  return newUser;
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ user: User; token: string }> => {
  // Find user by email
  const user = await db.users.where("email").equals(email).first();
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Update last login
  await db.users.update(user.id, { lastLoginAt: generateTimestamp() });

  // Create session with jose
  const token = await new jose.SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();

  const session: AuthSession = {
    userId: user.id,
    token,
    expiresAt,
    createdAt: generateTimestamp(),
  };

  await db.sessions.add(session);

  return { user, token };
};

export const validateSession = async (token: string): Promise<User | null> => {
  try {
    // Find session
    const session = await db.sessions.where("token").equals(token).first();
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await db.sessions.where("token").equals(token).delete();
      return null;
    }

    // Verify JWT with jose
    const { payload } = await jose.jwtVerify(token, getSecret());
    const userId = payload.userId as string;

    // Get user
    const user = await db.users.get(userId);
    return user || null;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
};

export const logout = async (token: string): Promise<void> => {
  await db.sessions.where("token").equals(token).delete();
};

export const clearExpiredSessions = async (): Promise<void> => {
  const now = new Date().toISOString();
  await db.sessions.where("expiresAt").below(now).delete();
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  return await db.users.get(id);
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<User["settings"]>
): Promise<void> => {
  const user = await db.users.get(userId);
  if (user) {
    const currentSettings = user.settings || {
      theme: "system" as const,
      waterGoal: 2000,
      notifications: {
        reminders: true,
        dailySummary: true,
      },
    };

    await db.users.update(userId, {
      settings: { ...currentSettings, ...settings },
    });
  }
};

// DEVELOPMENT HELPERS
export const createDevUser = async (): Promise<{
  user: User;
  token: string;
}> => {
  const DEV_EMAIL = "dev@test.com";
  const DEV_PASSWORD = "password";

  try {
    // Check if dev user already exists
    const existingUser = await db.users
      .where("email")
      .equals(DEV_EMAIL)
      .first();

    if (existingUser) {
      // Clear any existing sessions for this user to avoid conflicts
      await db.sessions.where("userId").equals(existingUser.id).delete();

      // Dev user exists, just authenticate
      return await authenticateUser(DEV_EMAIL, DEV_PASSWORD);
    }

    // Create dev user
    await createUser(DEV_EMAIL, DEV_PASSWORD);

    // Authenticate and return token
    return await authenticateUser(DEV_EMAIL, DEV_PASSWORD);
  } catch (error) {
    console.error("Error creating dev user:", error);
    throw error;
  }
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

// Quick login function for development
export const quickDevLogin = async (): Promise<{
  user: User;
  token: string;
} | null> => {
  if (!isDevelopment()) {
    return null;
  }

  try {
    return await createDevUser();
  } catch (error) {
    console.error("Quick dev login failed:", error);
    return null;
  }
};

// Helper to reset dev user completely (for debugging)
export const resetDevUser = async (): Promise<void> => {
  if (!isDevelopment()) {
    return;
  }

  const DEV_EMAIL = "dev@test.com";

  try {
    // Find and delete dev user
    const existingUser = await db.users
      .where("email")
      .equals(DEV_EMAIL)
      .first();
    if (existingUser) {
      // Delete all sessions for this user
      await db.sessions.where("userId").equals(existingUser.id).delete();
      // Delete the user
      await db.users.delete(existingUser.id);
    }

    console.log("🔧 Dev user reset complete");
  } catch (error) {
    console.error("Error resetting dev user:", error);
  }
};
