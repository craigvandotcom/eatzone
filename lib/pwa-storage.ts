/**
 * PWA Storage Utility - Handles iOS PWA storage limitations
 * 
 * iOS PWAs have restrictions on localStorage and cookies, especially when
 * the app is launched from the home screen. This utility provides:
 * - Fallback storage using IndexedDB
 * - PWA context detection
 * - Robust token persistence across iOS app state changes
 */

interface PWAStorageItem {
  key: string;
  value: string;
  timestamp: number;
  expiresAt?: number;
}

class PWAStorageManager {
  private dbName = 'puls-pwa-storage';
  private storeName = 'auth-tokens';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Detect if we're running in a PWA context
   */
  isPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if launched from home screen (iOS)
    const isIOSPWA = (window.navigator as any).standalone === true;
    
    // Check if display mode is standalone (Android/Desktop)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if launched from home screen with manifest
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    return isIOSPWA || isStandalone || isMinimalUI;
  }

  /**
   * Detect if we're on iOS
   */
  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Initialize IndexedDB for PWA storage
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store a value with multiple fallback mechanisms
   */
  async setItem(key: string, value: string, expiresIn?: number): Promise<void> {
    const timestamp = Date.now();
    const expiresAt = expiresIn ? timestamp + expiresIn : undefined;
    
    const item: PWAStorageItem = {
      key,
      value,
      timestamp,
      expiresAt
    };

    // Strategy 1: Try localStorage first (works in most cases)
    try {
      localStorage.setItem(key, value);
      if (expiresAt) {
        localStorage.setItem(`${key}_expires`, expiresAt.toString());
      }
    } catch (error) {
      console.warn('localStorage failed, using IndexedDB fallback:', error);
    }

    // Strategy 2: Always store in IndexedDB as backup (especially important for iOS PWA)
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB storage failed:', error);
    }

    // Strategy 3: For critical auth tokens, also try sessionStorage
    if (key.includes('auth_token') || key.includes('user_id')) {
      try {
        sessionStorage.setItem(key, value);
        if (expiresAt) {
          sessionStorage.setItem(`${key}_expires`, expiresAt.toString());
        }
      } catch (error) {
        console.warn('sessionStorage failed:', error);
      }
    }
  }

  /**
   * Retrieve a value with multiple fallback mechanisms
   */
  async getItem(key: string): Promise<string | null> {
    // Strategy 1: Try localStorage first
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Check expiration
        const expiresAt = localStorage.getItem(`${key}_expires`);
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          await this.removeItem(key);
          return null;
        }
        return value;
      }
    } catch (error) {
      console.warn('localStorage read failed:', error);
    }

    // Strategy 2: Try IndexedDB fallback
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const item = await new Promise<PWAStorageItem | null>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (item) {
        // Check expiration
        if (item.expiresAt && Date.now() > item.expiresAt) {
          await this.removeItem(key);
          return null;
        }
        return item.value;
      }
    } catch (error) {
      console.warn('IndexedDB read failed:', error);
    }

    // Strategy 3: Try sessionStorage for auth tokens
    if (key.includes('auth_token') || key.includes('user_id')) {
      try {
        const value = sessionStorage.getItem(key);
        if (value) {
          const expiresAt = sessionStorage.getItem(`${key}_expires`);
          if (expiresAt && Date.now() > parseInt(expiresAt)) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}_expires`);
            return null;
          }
          return value;
        }
      } catch (error) {
        console.warn('sessionStorage read failed:', error);
      }
    }

    return null;
  }

  /**
   * Remove a value from all storage mechanisms
   */
  async removeItem(key: string): Promise<void> {
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_expires`);
    } catch (error) {
      console.warn('localStorage removal failed:', error);
    }

    // Remove from IndexedDB
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB removal failed:', error);
    }

    // Remove from sessionStorage
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_expires`);
    } catch (error) {
      console.warn('sessionStorage removal failed:', error);
    }
  }

  /**
   * Clear all stored items
   */
  async clear(): Promise<void> {
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage clear failed:', error);
    }

    // Clear IndexedDB
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB clear failed:', error);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('sessionStorage clear failed:', error);
    }
  }

  /**
   * Clean up expired items
   */
  async cleanupExpired(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item: PWAStorageItem = cursor.value;
          if (item.expiresAt && Date.now() > item.expiresAt) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * Get environment-specific recommendations
   */
  getStorageRecommendations(): {
    isPWA: boolean;
    isIOS: boolean;
    recommendations: string[];
  } {
    const isPWA = this.isPWA();
    const isIOS = this.isIOS();
    const recommendations: string[] = [];

    if (isPWA && isIOS) {
      recommendations.push('Using enhanced storage for iOS PWA');
      recommendations.push('Tokens stored in IndexedDB for persistence');
      recommendations.push('Session may be lost if app is backgrounded for extended periods');
    } else if (isPWA) {
      recommendations.push('PWA detected - using enhanced storage');
      recommendations.push('Multiple storage fallbacks active');
    } else if (isIOS) {
      recommendations.push('iOS Safari detected - using standard storage with fallbacks');
    } else {
      recommendations.push('Standard web storage available');
    }

    return { isPWA, isIOS, recommendations };
  }
}

// Create singleton instance
export const pwaStorage = new PWAStorageManager();

// Helper functions for easier use
export const setPWAItem = (key: string, value: string, expiresIn?: number) => 
  pwaStorage.setItem(key, value, expiresIn);

export const getPWAItem = (key: string) => 
  pwaStorage.getItem(key);

export const removePWAItem = (key: string) => 
  pwaStorage.removeItem(key);

export const clearPWAStorage = () => 
  pwaStorage.clear();

export const isPWAContext = () => 
  pwaStorage.isPWA();

export const isIOSDevice = () => 
  pwaStorage.isIOS();