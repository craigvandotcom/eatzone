'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

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
      if (!data.user) throw new Error('Login failed');

      // Get the user profile from our database
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
    } catch (error) {
      logger.error('Logout error', error);
      // Still clear the user state even if logout fails
      setUser(null);
    }
  };

  const checkSession = async () => {
    setIsLoading(true);

    try {
      // Check Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Get the user profile from our database
      let profile = await getCurrentUser();
      
      // If no profile exists but we have a valid session, attempt to create one
      if (!profile && session.user) {
        logger.warn('Supabase session exists but no user profile found. Attempting to create profile...');
        
        // Retry logic for profile creation
        let retries = 3;
        while (retries > 0 && !profile) {
          try {
            // Create user profile as a fallback
            const { error: profileError } = await supabase
              .from('users')
              .upsert({
                id: session.user.id,
                email: session.user.email || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (!profileError) {
              // Try to fetch the profile again
              profile = await getCurrentUser();
              if (profile) {
                logger.info('Successfully created fallback user profile');
                break;
              }
            }
          } catch (retryError) {
            logger.error(`Profile creation retry ${4 - retries} failed:`, retryError);
          }
          
          retries--;
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
        
        // If we still don't have a profile after retries, sign out
        if (!profile) {
          logger.error('Failed to create user profile after retries. Signing out.');
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          return;
        }
      }
      
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      logger.error('Session check error', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed', { event, hasSession: !!session });

      if (event === 'SIGNED_IN' && session) {
        let profile = await getCurrentUser();
        
        // Apply same retry logic for auth state changes
        if (!profile && session.user) {
          logger.warn('Auth state SIGNED_IN but no profile found. Attempting to create profile...');
          
          let retries = 3;
          while (retries > 0 && !profile) {
            try {
              const { error: profileError } = await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (!profileError) {
                profile = await getCurrentUser();
                if (profile) {
                  logger.info('Successfully created fallback user profile on auth state change');
                  break;
                }
              }
            } catch (retryError) {
              logger.error(`Profile creation retry ${4 - retries} failed on auth state change:`, retryError);
            }
            
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
            }
          }
        }
        
        if (profile) {
          setUser(profile);
        } else {
          logger.error('Failed to get/create user profile on SIGNED_IN event');
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic session check (every 5 minutes) - simplified for Supabase
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
        }
      },
      5 * 60 * 1000,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
