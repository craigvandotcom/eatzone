import Dexie, { Table } from "dexie";
import {
  Food,
  Liquid,
  Symptom,
  Stool,
  User,
  AuthSession,
} from "./types";
import bcrypt from "bcryptjs";
import * as jose from "jose";

export class HealthTrackerDB extends Dexie {
  foods!: Table<Food, string>;
  liquids!: Table<Liquid, string>;
  symptoms!: Table<Symptom, string>;
  stools!: Table<Stool, string>;
  users!: Table<User, string>;
  sessions!: Table<AuthSession, string>;

  constructor() {
    super("HealthTrackerDB");
    this.version(2).stores({
      foods: "++id, timestamp",
      liquids: "++id, timestamp, type",
      symptoms: "++id, timestamp",
      stools: "++id, timestamp",
      users: "++id, email",
      sessions: "++userId, token, expiresAt",
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
    db.foods,
    db.liquids,
    db.symptoms,
    db.stools,
    async () => {
      await db.foods.clear();
      await db.liquids.clear();
      await db.symptoms.clear();
      await db.stools.clear();
    }
  );
};

export const exportAllData = async (): Promise<{
  foods: Food[];
  liquids: Liquid[];
  symptoms: Symptom[];
  stools: Stool[];
  exportedAt: string;
}> => {
  const [foods, liquids, symptoms, stools] = await Promise.all([
    getAllFoods(),
    getAllLiquids(),
    getAllSymptoms(),
    getAllStools(),
  ]);

  return {
    foods,
    liquids,
    symptoms,
    stools,
    exportedAt: generateTimestamp(),
  };
};

export const importAllData = async (data: {
  foods: Food[];
  liquids: Liquid[];
  symptoms: Symptom[];
  stools: Stool[];
}): Promise<void> => {
  await db.transaction(
    "rw",
    db.foods,
    db.liquids,
    db.symptoms,
    db.stools,
    async () => {
      await db.foods.clear();
      await db.liquids.clear();
      await db.symptoms.clear();
      await db.stools.clear();

      await db.foods.bulkAdd(data.foods);
      await db.liquids.bulkAdd(data.liquids);
      await db.symptoms.bulkAdd(data.symptoms);
      await db.stools.bulkAdd(data.stools);
    }
  );
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
export const createDevUser = async (): Promise<{ user: User; token: string }> => {
  const DEV_EMAIL = "dev@test.com";
  const DEV_PASSWORD = "password";

  try {
    // Check if dev user already exists
    const existingUser = await db.users.where("email").equals(DEV_EMAIL).first();
    
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
export const quickDevLogin = async (): Promise<{ user: User; token: string } | null> => {
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
    const existingUser = await db.users.where("email").equals(DEV_EMAIL).first();
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
