"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      // Get the user profile from our database
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear the user state even if logout fails
      setUser(null);
    }
  };

  const checkSession = async () => {
    setIsLoading(true);

    try {
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Get the user profile from our database
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
      } else {
        logger.warn("Supabase session exists but no user profile found");
        // Sign out if we have a session but no profile
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      logger.error("Session check error", error);
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state changed', { event, hasSession: !!session });
        
        if (event === 'SIGNED_IN' && session) {
          const profile = await getCurrentUser();
          if (profile) {
            setUser(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic session check (every 5 minutes) - simplified for Supabase
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
      }
    }, 5 * 60 * 1000); // 5 minutes

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