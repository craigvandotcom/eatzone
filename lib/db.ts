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

    // Current schema - Foods + Symptoms only
    this.version(4).stores({
      foods: "id, timestamp",
      symptoms: "id, timestamp",
      users: "id, email",
      sessions: "userId, token, expiresAt",
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

export const getAllFoods = async (): Promise<Food[]> => {
  return await db.foods.orderBy("timestamp").reverse().toArray();
};

export const getRecentFoods = async (limit: number = 10): Promise<Food[]> => {
  return await db.foods.orderBy("timestamp").reverse().limit(limit).toArray();
};

export const getTodaysFoods = async (): Promise<Food[]> => {
  const today = getTodayDate();
  const startRange = today + "T00:00:00.000Z";
  const endRange = today + "T23:59:59.999Z";

  return await db.foods
    .where("timestamp")
    .between(startRange, endRange)
    .reverse()
    .toArray();
};

export const getFoodById = async (id: string): Promise<Food | undefined> => {
  return await db.foods.get(id);
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

export const getAllSymptoms = async (): Promise<Symptom[]> => {
  return await db.symptoms.orderBy("timestamp").reverse().toArray();
};

export const getRecentSymptoms = async (
  limit: number = 10
): Promise<Symptom[]> => {
  return await db.symptoms
    .orderBy("timestamp")
    .reverse()
    .limit(limit)
    .toArray();
};

export const getTodaysSymptoms = async (): Promise<Symptom[]> => {
  const today = getTodayDate();
  return await db.symptoms
    .where("timestamp")
    .between(today + "T00:00:00.000Z", today + "T23:59:59.999Z")
    .reverse()
    .toArray();
};

export const getSymptomById = async (
  id: string
): Promise<Symptom | undefined> => {
  return await db.symptoms.get(id);
};

// UTILITY OPERATIONS
export const clearAllData = async (): Promise<void> => {
  await db.transaction("rw", db.foods, db.symptoms, async () => {
    await db.foods.clear();
    await db.symptoms.clear();
  });
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

// ===== ENHANCED ENVIRONMENT DETECTION & DEMO MODE =====

/**
 * Detects if the app is running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

/**
 * Detects if the app is running in a preview deployment (Vercel, Netlify, etc.)
 * This function checks various deployment platform patterns and URL parameters.
 */
export const isPreviewDeployment = (): boolean => {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  const searchParams = new URLSearchParams(window.location.search);

  return (
    // Vercel preview deployments
    hostname.includes(".vercel.app") ||
    // Netlify preview deployments
    hostname.includes("netlify.app") ||
    hostname.includes("netlify.live") ||
    // GitHub Codespaces
    hostname.includes("github.dev") ||
    hostname.includes("githubpreview.dev") ||
    // Other common preview platforms
    hostname.includes("surge.sh") ||
    hostname.includes("now.sh") ||
    // Explicit preview mode via URL parameter
    searchParams.has("preview") ||
    searchParams.has("demo")
  );
};

/**
 * Checks if the app should run in demo mode (development OR preview deployment)
 */
export const isDemoMode = (): boolean => {
  return isDevelopment() || isPreviewDeployment();
};

/**
 * Gets the current environment type for logging and UI display
 */
export const getEnvironmentType = ():
  | "development"
  | "preview"
  | "production" => {
  if (isDevelopment()) return "development";
  if (isPreviewDeployment()) return "preview";
  return "production";
};

// Demo accounts for preview deployments
const DEMO_ACCOUNTS = [
  {
    email: "demo@puls.app",
    password: "demo123",
    name: "Demo User",
    description: "General demo account for testing",
  },
  {
    email: "preview@puls.app",
    password: "preview123",
    name: "Preview User",
    description: "Preview deployment testing account",
  },
  {
    email: "test@puls.app",
    password: "test123",
    name: "Test User",
    description: "Testing and QA account",
  },
] as const;

/**
 * Creates or retrieves a demo user account for preview deployments
 * @param accountIndex - Index of the demo account to use (0-2)
 * @returns User and authentication token
 */
export const createDemoUser = async (
  accountIndex: number = 0
): Promise<{
  user: User;
  token: string;
}> => {
  const account = DEMO_ACCOUNTS[accountIndex] || DEMO_ACCOUNTS[0];
  const { email, password, name } = account;

  try {
    console.log(`🚀 Creating/retrieving demo user: ${name} (${email})`);

    // Check if demo user already exists
    const existingUser = await db.users.where("email").equals(email).first();

    if (existingUser) {
      // Clear any existing sessions to avoid conflicts
      await db.sessions.where("userId").equals(existingUser.id).delete();
      console.log(`✅ Found existing demo user: ${existingUser.email}`);

      // Demo user exists, just authenticate
      return await authenticateUser(email, password);
    }

    console.log(`🔧 Creating new demo user: ${email}`);

    // Create demo user
    await createUser(email, password);

    // Authenticate and return token
    const result = await authenticateUser(email, password);
    console.log(`✅ Demo user created and authenticated: ${result.user.email}`);

    return result;
  } catch (error) {
    console.error("Error creating demo user:", error);
    throw error;
  }
};

/**
 * Get available demo accounts information
 */
export const getDemoAccounts = () => DEMO_ACCOUNTS;

// DEVELOPMENT HELPERS (existing functions maintained for backward compatibility)
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

/**
 * Enhanced quick login function that works for both development and preview modes
 * @param accountIndex - Optional demo account index (only used for preview mode)
 * @returns User and authentication token, or null if not in demo mode
 */
export const quickDemoLogin = async (
  accountIndex?: number
): Promise<{
  user: User;
  token: string;
} | null> => {
  if (!isDemoMode()) {
    console.log("❌ Not in demo mode - quick login disabled");
    return null;
  }

  const envType = getEnvironmentType();
  console.log(`🚀 Quick ${envType} login initiated`);

  try {
    if (isDevelopment()) {
      // Use existing dev user in development
      console.log("🔧 Development mode: Using dev@test.com");
      return await createDevUser();
    } else {
      // Use demo account for preview deployments
      const selectedAccount = accountIndex ?? 0;
      console.log(`🌐 Preview mode: Using demo account ${selectedAccount}`);
      return await createDemoUser(selectedAccount);
    }
  } catch (error) {
    console.error(`Quick ${envType} login failed:`, error);
    return null;
  }
};

/**
 * Legacy function maintained for backward compatibility
 * @deprecated Use quickDemoLogin() instead
 */
export const quickDevLogin = quickDemoLogin;

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
