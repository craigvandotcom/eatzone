"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import {
  validateSession,
  logout as dbLogout,
  clearExpiredSessions,
  quickDemoLogin,
  isDemoMode,
  getEnvironmentType,
} from "@/lib/db";
import { 
  pwaStorage, 
  setPWAItem, 
  getPWAItem, 
  removePWAItem, 
  clearPWAStorage,
  isPWAContext,
  isIOSDevice 
} from "@/lib/pwa-storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (token: string, userData: User) => {
    const isPWA = isPWAContext();
    const isIOS = isIOSDevice();
    
    // Enhanced storage for PWA, especially iOS
    if (isPWA) {
      console.log(`🔐 PWA Login - iOS: ${isIOS}, storing token with enhanced persistence`);
      
      // Use PWA storage with 7 days expiration
      await setPWAItem("auth_token", token, 7 * 24 * 60 * 60 * 1000);
      await setPWAItem("user_id", userData.id, 7 * 24 * 60 * 60 * 1000);
      
      // Store user data for quick access
      await setPWAItem("user_data", JSON.stringify(userData), 7 * 24 * 60 * 60 * 1000);
    } else {
      // Standard storage for regular web access
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_id", userData.id);
    }

    // Cookie strategy: Different approach for iOS PWA
    if (isPWA && isIOS) {
      // For iOS PWA, use less strict cookie settings
      document.cookie = `auth_token=${token}; Path=/; SameSite=lax; Secure=${window.location.protocol === "https:"}; Max-Age=604800`;
    } else {
      // Standard cookie for regular web
      document.cookie = `auth_token=${token}; Path=/; SameSite=strict; Secure=${window.location.protocol === "https:"}; Max-Age=604800`;
    }

    setUser(userData);
  };

  const logout = async () => {
    // Get token from enhanced storage
    const token = await getPWAItem("auth_token") || localStorage.getItem("auth_token");
    
    if (token) {
      try {
        await dbLogout(token);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    // Clear all storage mechanisms
    await removePWAItem("auth_token");
    await removePWAItem("user_id");
    await removePWAItem("user_data");
    
    // Also clear localStorage for compatibility
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_id");
    } catch (error) {
      console.warn("localStorage clear failed during logout:", error);
    }

    // Clear cookies
    document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";
    document.cookie = "auth_token=; Path=/; SameSite=lax; Max-Age=0"; // Also clear lax version

    setUser(null);
  };

  const checkSession = async () => {
    setIsLoading(true);
    const isPWA = isPWAContext();
    const isIOS = isIOSDevice();

    try {
      // Clean up expired sessions first
      await clearExpiredSessions();
      
      // Clean up expired PWA storage
      await pwaStorage.cleanupExpired();

      // Enhanced token retrieval for PWA
      let token: string | null = null;
      
      if (isPWA) {
        // Try PWA storage first
        token = await getPWAItem("auth_token");
        console.log(`🔍 PWA Session Check - iOS: ${isIOS}, Token found: ${!!token}`);
      }
      
      // Fallback to localStorage
      if (!token) {
        token = localStorage.getItem("auth_token");
      }

      if (!token) {
        // In demo mode (development or preview), auto-login if no session exists
        if (isDemoMode()) {
          const envType = getEnvironmentType();
          console.log(
            `🚀 ${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Auto-logging in with demo user`
          );
          const demoLogin = await quickDemoLogin();
          if (demoLogin) {
            await login(demoLogin.token, demoLogin.user);
            return;
          }
        }

        setUser(null);
        setIsLoading(false);
        return;
      }

      // Validate the session
      const validatedUser = await validateSession(token);
      if (validatedUser) {
        setUser(validatedUser);
        
        // For PWA, ensure user data is stored for quick access
        if (isPWA) {
          await setPWAItem("user_data", JSON.stringify(validatedUser), 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        console.warn("🚫 Session validation failed, cleaning up storage");
        
        // Invalid session, clean up all storage
        await removePWAItem("auth_token");
        await removePWAItem("user_id");
        await removePWAItem("user_data");
        
        try {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
        } catch (error) {
          console.warn("localStorage cleanup failed:", error);
        }
        
        document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";
        document.cookie = "auth_token=; Path=/; SameSite=lax; Max-Age=0";

        // In demo mode, try auto-login after cleanup
        if (isDemoMode()) {
          const envType = getEnvironmentType();
          console.log(
            `🔧 ${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Session invalid, auto-logging in with demo user`
          );
          const demoLogin = await quickDemoLogin();
          if (demoLogin) {
            await login(demoLogin.token, demoLogin.user);
            return;
          }
        }

        setUser(null);
      }
    } catch (error) {
      console.error("Session validation error:", error);
      
      // Clean up on error - all storage mechanisms
      await removePWAItem("auth_token");
      await removePWAItem("user_id");
      await removePWAItem("user_data");
      
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_id");
      } catch (cleanupError) {
        console.warn("Storage cleanup failed:", cleanupError);
      }
      
      document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";
      document.cookie = "auth_token=; Path=/; SameSite=lax; Max-Age=0";
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      () => {
        checkSession();
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
