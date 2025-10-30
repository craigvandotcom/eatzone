// Custom hook for persisting tab state across navigation
// Uses localStorage to remember the last active dashboard tab

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

type ViewType = 'insights' | 'entries' | 'settings';

const STORAGE_KEY = 'dashboard-active-tab';
const DEFAULT_TAB: ViewType = 'insights';

export function usePersistentTab(defaultValue: ViewType = DEFAULT_TAB) {
  const [currentTab, setCurrentTab] = useState<ViewType>(defaultValue);

  // Initialize tab from localStorage on mount
  useEffect(() => {
    try {
      const storedTab = localStorage.getItem(STORAGE_KEY);
      if (storedTab && isValidTab(storedTab)) {
        setCurrentTab(storedTab as ViewType);
      }
    } catch (error) {
      // localStorage may not be available (incognito mode, etc.)
      logger.warn('Failed to read tab state from localStorage', { error });
    }
  }, []);

  // Persist tab changes to localStorage
  const setPersistedTab = useCallback((newTab: ViewType) => {
    setCurrentTab(newTab);
    try {
      localStorage.setItem(STORAGE_KEY, newTab);
    } catch (error) {
      // localStorage may not be available or full
      logger.warn('Failed to save tab state to localStorage', { error });
    }
  }, []);

  return [currentTab, setPersistedTab] as const;
}

// Type guard to validate stored tab values
function isValidTab(value: string): value is ViewType {
  return ['insights', 'entries', 'settings'].includes(value);
}
