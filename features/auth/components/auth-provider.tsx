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

  const login = (token: string, userData: User) => {
    // Store in localStorage for client-side access
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_id", userData.id);

    // Also set as httpOnly cookie for middleware access
    document.cookie = `auth_token=${token}; Path=/; SameSite=strict; Secure=${window.location.protocol === "https:"}; Max-Age=604800`; // 7 days

    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        await dbLogout(token);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");

    // Clear the cookie as well
    document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";

    setUser(null);
  };

  const checkSession = async () => {
    setIsLoading(true);

    try {
      // Clean up expired sessions first
      await clearExpiredSessions();

      const token = localStorage.getItem("auth_token");
      if (!token) {
        // In demo mode (development or preview), auto-login if no session exists
        if (isDemoMode()) {
          const envType = getEnvironmentType();
          console.log(
            `🚀 ${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Auto-logging in with demo user`
          );
          const demoLogin = await quickDemoLogin();
          if (demoLogin) {
            login(demoLogin.token, demoLogin.user);
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
      } else {
        // Invalid session, clean up
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_id");
        document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";

        // In demo mode, try auto-login after cleanup
        if (isDemoMode()) {
          const envType = getEnvironmentType();
          console.log(
            `🔧 ${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Session invalid, auto-logging in with demo user`
          );
          const demoLogin = await quickDemoLogin();
          if (demoLogin) {
            login(demoLogin.token, demoLogin.user);
            return;
          }
        }

        setUser(null);
      }
    } catch (error) {
      console.error("Session validation error:", error);
      // Clean up on error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_id");
      document.cookie = "auth_token=; Path=/; SameSite=strict; Max-Age=0";
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
