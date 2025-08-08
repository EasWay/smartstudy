import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  key: string;
  ttl: number; // Time to live in milliseconds
  data: any;
  timestamp: number;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  totalItems: number;
  totalSize: number; // Approximate size in bytes
  oldestItem?: string;
  newestItem?: string;
}

/**
 * CacheManager class for handling local data caching with TTL support
 */
export class CacheManager {
  private static readonly CACHE_PREFIX = '@cache_';
  private static readonly CACHE_INDEX_KEY = '@cache_index';
  private static readonly DEFAULT_TTL = 7200000; // 2 hours in milliseconds
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB limit
  private static readonly CLEANUP_THRESHOLD = 0.85; // Clean up when 85% full
  
  // Cache TTL strategies for different data types
  private static readonly CACHE_STRATEGIES = {
    user_profile: 24 * 60 * 60 * 1000, // 24 hours
    news_feed: 30 * 60 * 1000, // 30 minutes
    books_data: 7 * 24 * 60 * 60 * 1000, // 7 days
    resources: 60 * 60 * 1000, // 1 hour
    study_groups: 15 * 60 * 1000, // 15 minutes
    thumbnails: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default: 2 hours)
   * @param strategy - Cache strategy type for automatic TTL
   */
  static async set(key: string, data: any, ttl?: number, strategy?: keyof typeof CacheManager.CACHE_STRATEGIES): Promise<void> {
    // Use strategy-based TTL if provided
    const finalTtl = strategy ? this.CACHE_STRATEGIES[strategy] : (ttl || this.DEFAULT_TTL);
    try {
      const cacheItem: CacheConfig = {
        key,
        ttl: finalTtl,
        data,
        timestamp: Date.now()
      };

      const cacheKey = this.CACHE_PREFIX + key;
      const serializedData = JSON.stringify(cacheItem);
      
      // Store the cache item
      await AsyncStorage.setItem(cacheKey, serializedData);
      
      // Update cache index
      await this.updateCacheIndex(key, serializedData.length);
      
      // Check if cleanup is needed
      await this.checkAndCleanup();
      
    } catch (error) {
      console.error('CacheManager.set error:', error);
      throw new Error(`Failed to cache item with key: ${key}`);
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  static async get(key: string): Promise<any | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const cacheItem: CacheConfig = JSON.parse(cached);
      const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;
      
      if (isExpired) {
        // Remove expired item
        await this.remove(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('CacheManager.get error:', error);
      return null;
    }
  }

  /**
   * Remove a specific item from cache
   * @param key - Cache key to remove
   */
  static async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);
      await this.removeFromCacheIndex(key);
    } catch (error) {
      console.error('CacheManager.remove error:', error);
    }
  }

  /**
   * Clear all cached items
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      // Clear cache index
      await AsyncStorage.removeItem(this.CACHE_INDEX_KEY);
    } catch (error) {
      console.error('CacheManager.clear error:', error);
    }
  }

  /**
   * Check if a key exists in cache and is not expired
   * @param key - Cache key to check
   * @returns True if key exists and is valid
   */
  static async has(key: string): Promise<boolean> {
    try {
      const data = await this.get(key);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  static async getStats(): Promise<CacheStats> {
    try {
      const index = await this.getCacheIndex();
      const keys = Object.keys(index);
      
      if (keys.length === 0) {
        return {
          totalItems: 0,
          totalSize: 0
        };
      }

      const totalSize = Object.values(index).reduce((sum: number, size: any) => sum + size.size, 0);
      const timestamps = Object.values(index).map((item: any) => item.timestamp);
      const oldestTimestamp = Math.min(...timestamps);
      const newestTimestamp = Math.max(...timestamps);
      
      const oldestItem = Object.keys(index).find(key => 
        (index as any)[key].timestamp === oldestTimestamp
      );
      const newestItem = Object.keys(index).find(key => 
        (index as any)[key].timestamp === newestTimestamp
      );

      return {
        totalItems: keys.length,
        totalSize,
        oldestItem,
        newestItem
      };
    } catch (error) {
      console.error('CacheManager.getStats error:', error);
      return {
        totalItems: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clean up expired items
   * @returns Number of items cleaned up
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      let cleanedCount = 0;

      for (const cacheKey of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const cacheItem: CacheConfig = JSON.parse(cached);
            const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;
            
            if (isExpired) {
              const originalKey = cacheKey.replace(this.CACHE_PREFIX, '');
              await this.remove(originalKey);
              cleanedCount++;
            }
          }
        } catch (error) {
          // If we can't parse the item, remove it
          await AsyncStorage.removeItem(cacheKey);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('CacheManager.cleanupExpired error:', error);
      return 0;
    }
  }

  /**
   * Get all cache keys (non-expired)
   * @returns Array of cache keys
   */
  static async getKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      const validKeys: string[] = [];

      for (const cacheKey of cacheKeys) {
        const originalKey = cacheKey.replace(this.CACHE_PREFIX, '');
        const hasValidData = await this.has(originalKey);
        
        if (hasValidData) {
          validKeys.push(originalKey);
        }
      }

      return validKeys;
    } catch (error) {
      console.error('CacheManager.getKeys error:', error);
      return [];
    }
  }

  /**
   * Update cache index for size tracking
   * @private
   */
  private static async updateCacheIndex(key: string, size: number): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      index[key] = {
        size,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('CacheManager.updateCacheIndex error:', error);
    }
  }

  /**
   * Remove key from cache index
   * @private
   */
  private static async removeFromCacheIndex(key: string): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      delete index[key];
      
      await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('CacheManager.removeFromCacheIndex error:', error);
    }
  }

  /**
   * Get cache index
   * @private
   */
  private static async getCacheIndex(): Promise<Record<string, any>> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      return indexData ? JSON.parse(indexData) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Check if cleanup is needed and perform it
   * @private
   */
  private static async checkAndCleanup(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      if (stats.totalSize > this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
        console.log('Cache size threshold reached, performing cleanup...');
        
        // First, clean up expired items
        const expiredCleaned = await this.cleanupExpired();
        console.log(`Cleaned up ${expiredCleaned} expired items`);
        
        // If still over threshold, remove oldest items
        const newStats = await this.getStats();
        if (newStats.totalSize > this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD) {
          await this.cleanupOldest(Math.ceil(newStats.totalItems * 0.2)); // Remove 20% of items
        }
      }
    } catch (error) {
      console.error('CacheManager.checkAndCleanup error:', error);
    }
  }

  /**
   * Clean up oldest items
   * @private
   */
  private static async cleanupOldest(count: number): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      const sortedKeys = Object.keys(index).sort((a, b) => 
        index[a].timestamp - index[b].timestamp
      );
      
      const keysToRemove = sortedKeys.slice(0, count);
      
      for (const key of keysToRemove) {
        await this.remove(key);
      }
      
      console.log(`Cleaned up ${keysToRemove.length} oldest cache items`);
    } catch (error) {
      console.error('CacheManager.cleanupOldest error:', error);
    }
  }

  /**
   * Set multiple values in cache at once
   * @param items - Array of cache items to set
   */
  static async setMultiple(items: Array<{
    key: string;
    data: any;
    ttl?: number;
    strategy?: keyof typeof CacheManager.CACHE_STRATEGIES;
  }>): Promise<void> {
    try {
      const promises = items.map(item => 
        this.set(item.key, item.data, item.ttl, item.strategy)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('CacheManager.setMultiple error:', error);
    }
  }

  /**
   * Get multiple values from cache at once
   * @param keys - Array of cache keys to retrieve
   * @returns Object with key-value pairs
   */
  static async getMultiple(keys: string[]): Promise<Record<string, any>> {
    try {
      const promises = keys.map(async key => ({
        key,
        value: await this.get(key)
      }));
      
      const results = await Promise.all(promises);
      return results.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('CacheManager.getMultiple error:', error);
      return {};
    }
  }

  /**
   * Preload cache with essential data
   */
  static async preloadEssentialData(): Promise<void> {
    try {
      // This method can be called on app startup to preload critical data
      console.log('Preloading essential cache data...');
      
      // Clean up expired items first
      await this.cleanupExpired();
      
      // Preload can be customized based on app needs
      console.log('Essential cache data preloaded');
    } catch (error) {
      console.error('CacheManager.preloadEssentialData error:', error);
    }
  }
}