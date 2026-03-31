// Cache utilities - Separate file to avoid circular dependency

import type { CacheData } from '@/types/data';

const CACHE_VERSION = '1.0';
const CACHE_KEY_PREFIX = 'app_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_BACKUP_KEY = 'app_cache_backup_';

// Utility functions
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

const normalizeTimestamptzInput = (value: string): string => {
  const v = (value || '').trim();
  if (!v) return v;
  if (v.includes('T')) return v;
  return v + 'T00:00:00Z';
};

// Cache functions
export const loadCacheData = (userId: string): CacheData | null => {
  try {
    const cacheKey = getCacheKey(userId);
    const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
    
    // Try primary cache first
    const primaryCache = localStorage.getItem(cacheKey);
    if (primaryCache) {
      const parsed = JSON.parse(primaryCache);
      
      // Check version compatibility
      if (parsed.version === CACHE_VERSION && parsed.userId === userId) {
        // Check expiry
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          console.log('📦 Cache: Primary cache hit', { userId, timestamp: parsed.timestamp });
          return parsed;
        }
      }
    }
    
    // Try backup cache
    const backupCache = localStorage.getItem(backupKey);
    if (backupCache) {
      const parsed = JSON.parse(backupCache);
      
      if (parsed.version === CACHE_VERSION && parsed.userId === userId) {
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          console.log('📦 Cache: Backup cache hit', { userId, timestamp: parsed.timestamp });
          // Restore primary cache from backup
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
    
    console.log('📦 Cache: No valid cache found', { userId });
    return null;
  } catch (error) {
    console.error('📦 Cache: Error loading cache', error);
    return null;
  }
};

export const saveCacheData = (userId: string, data: Omit<CacheData, 'timestamp'>): void => {
  try {
    const cacheKey = getCacheKey(userId);
    const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
    
    const cacheData: CacheData = {
      ...data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    
    // Save primary cache
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    // Save backup cache for PWA scenarios
    localStorage.setItem(backupKey, JSON.stringify(cacheData));
    
    console.log('📦 Cache: Data saved', { userId, itemCounts: Object.keys(data).length });
  } catch (error) {
    console.error('📦 Cache: Error saving cache', error);
  }
};

export const clearCacheData = (userId?: string): void => {
  try {
    if (userId) {
      const cacheKey = getCacheKey(userId);
      const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(backupKey);
      console.log('📦 Cache: Cleared for user', { userId });
    } else {
      // Clear all caches
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => 
        key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_BACKUP_KEY)
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log('📦 Cache: Cleared all caches', { count: cacheKeys.length });
    }
  } catch (error) {
    console.error('📦 Cache: Error clearing cache', error);
  }
};

// Helper functions for data parsing
export const parsePayments = (payments: any): any[] => {
  if (!Array.isArray(payments)) return [];
  return payments;
};

export const parseMaterials = (materials: any): any[] => {
  if (!Array.isArray(materials)) return [];
  return materials;
};

export const parsePurchaseItems = (items: any): any[] => {
  if (!Array.isArray(items)) return [];
  return items;
};

export const parseTransactionItems = (items: any): any[] => {
  if (!Array.isArray(items)) return [];
  return items;
};

export const formatItemsString = (itemsData: any[]): string => {
  return itemsData.map(item => `${item.nama} x${item.qty}`).join(', ');
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};
