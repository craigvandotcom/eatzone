"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import {
  validateSession,
  logout as dbLogout,
  clearExpiredSessions,
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
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_id", userData.id);
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
    setUser(null);
  };

  const checkSession = async () => {
    setIsLoading(true);

    try {
      // Clean up expired sessions first
      await clearExpiredSessions();

      const token = localStorage.getItem("auth_token");
      if (!token) {
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
        setUser(null);
      }
    } catch (error) {
      console.error("Session validation error:", error);
      // Clean up on error
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_id");
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
