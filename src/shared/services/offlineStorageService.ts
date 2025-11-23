/**
 * Offline Storage Service
 * 
 * Manages caching of data for offline access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedData,
  CacheOptions,
  CachePriority,
  CacheStats,
} from '../types/network.types';
import { errorLoggingService, ErrorSeverity } from './errorLoggingService';
import logger from '../utils/logger';

// ============================================================================
// Constants
// ============================================================================

const CACHE_PREFIX = '@offline_cache:';
const METADATA_KEY = '@offline_cache_metadata';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB
const COMPRESSION_THRESHOLD = 10 * 1024; // 10 KB

// ============================================================================
// Offline Storage Service Class
// ============================================================================

class OfflineStorageService {
  private metadata: Map<string, CachedData> = new Map();
  private initialized: boolean = false;
  private stats = {
    hits: 0,
    misses: 0,
  };

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadMetadata();
      await this.cleanExpiredEntries();

      this.initialized = true;
      logger.debug('[OfflineStorageService] Initialized successfully');
    } catch (error) {
      logger.error('[OfflineStorageService] Initialization failed:', error);
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        { action: 'offline_storage_init' },
        false
      );
    }
  }

  // ==========================================================================
  // Metadata Management
  // ==========================================================================

  private async loadMetadata(): Promise<void> {
    try {
      const metadataJson = await AsyncStorage.getItem(METADATA_KEY);
      if (metadataJson) {
        const metadata = JSON.parse(metadataJson);
        this.metadata = new Map(Object.entries(metadata));
      }
    } catch (error) {
      logger.error('[OfflineStorageService] Failed to load metadata:', error);
      this.metadata = new Map();
    }
  }

  private async saveMetadata(): Promise<void> {
    try {
      const metadataObj = Object.fromEntries(this.metadata);
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadataObj));
    } catch (error) {
      logger.error('[OfflineStorageService] Failed to save metadata:', error);
    }
  }

  // ==========================================================================
  // Cache Operations
  // ==========================================================================

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const {
        ttl = DEFAULT_TTL,
        priority = CachePriority.MEDIUM,
        tags = [],
        compress = false,
      } = options;

      const now = Date.now();
      const cachedData: CachedData<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        key,
        metadata: {
          priority,
          tags,
          compressed: compress,
        },
      };

      // Check cache size before adding
      await this.ensureCacheSize();

      // Store data
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.setItem(storageKey, JSON.stringify(cachedData));

      // Update metadata
      this.metadata.set(key, cachedData);
      await this.saveMetadata();

      logger.debug(`[OfflineStorageService] Cached data for key: ${key}`);
    } catch (error) {
      logger.error(`[OfflineStorageService] Failed to cache data for key ${key}:`, error);
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.WARNING,
        { action: 'cache_set', extra: { key } },
        false
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const cachedJson = await AsyncStorage.getItem(storageKey);

      if (!cachedJson) {
        this.stats.misses++;
        return null;
      }

      const cached: CachedData<T> = JSON.parse(cachedJson);

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        await this.remove(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      logger.debug(`[OfflineStorageService] Cache hit for key: ${key}`);
      return cached.data;
    } catch (error) {
      logger.error(`[OfflineStorageService] Failed to get cached data for key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const data = await this.get(key);
      return data !== null;
    } catch {
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.removeItem(storageKey);
      this.metadata.delete(key);
      await this.saveMetadata();

      logger.debug(`[OfflineStorageService] Removed cached data for key: ${key}`);
    } catch (error) {
      logger.error(`[OfflineStorageService] Failed to remove cached data for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Array.from(this.metadata.keys());
      const storageKeys = keys.map((key) => this.getStorageKey(key));

      await AsyncStorage.multiRemove(storageKeys);
      this.metadata.clear();
      await AsyncStorage.removeItem(METADATA_KEY);

      logger.debug('[OfflineStorageService] Cleared all cached data');
    } catch (error) {
      logger.error('[OfflineStorageService] Failed to clear cache:', error);
    }
  }

  // ==========================================================================
  // Advanced Operations
  // ==========================================================================

  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    await Promise.all(
      keys.map(async (key) => {
        const data = await this.get<T>(key);
        if (data !== null) {
          results.set(key, data);
        }
      })
    );

    return results;
  }

  async setMultiple<T>(entries: Array<{ key: string; data: T; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, data, options }) => this.set(key, data, options))
    );
  }

  async removeByTag(tag: string): Promise<void> {
    const keysToRemove: string[] = [];

    this.metadata.forEach((cached, key) => {
      if (cached.metadata?.tags?.includes(tag)) {
        keysToRemove.push(key);
      }
    });

    await Promise.all(keysToRemove.map((key) => this.remove(key)));
    logger.debug(`[OfflineStorageService] Removed ${keysToRemove.length} entries with tag: ${tag}`);
  }

  async removeByPattern(pattern: RegExp): Promise<void> {
    const keysToRemove: string[] = [];

    this.metadata.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToRemove.push(key);
      }
    });

    await Promise.all(keysToRemove.map((key) => this.remove(key)));
    logger.debug(`[OfflineStorageService] Removed ${keysToRemove.length} entries matching pattern`);
  }

  // ==========================================================================
  // Maintenance
  // ==========================================================================

  private async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.metadata.forEach((cached, key) => {
      if (now > cached.expiresAt) {
        expiredKeys.push(key);
      }
    });

    if (expiredKeys.length > 0) {
      await Promise.all(expiredKeys.map((key) => this.remove(key)));
      logger.debug(`[OfflineStorageService] Cleaned ${expiredKeys.length} expired entries`);
    }
  }

  private async ensureCacheSize(): Promise<void> {
    try {
      const totalSize = await this.calculateTotalSize();

      if (totalSize > MAX_CACHE_SIZE) {
        // Remove oldest low-priority entries first
        const sortedEntries = Array.from(this.metadata.entries()).sort((a, b) => {
          const priorityDiff = (a[1].metadata?.priority || 0) - (b[1].metadata?.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return a[1].timestamp - b[1].timestamp;
        });

        let currentSize = totalSize;
        for (const [key, _] of sortedEntries) {
          if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max

          await this.remove(key);
          currentSize = await this.calculateTotalSize();
        }

        logger.debug('[OfflineStorageService] Cache size optimized');
      }
    } catch (error) {
      logger.error('[OfflineStorageService] Failed to ensure cache size:', error);
    }
  }

  private async calculateTotalSize(): Promise<number> {
    let totalSize = 0;

    for (const key of this.metadata.keys()) {
      try {
        const storageKey = this.getStorageKey(key);
        const item = await AsyncStorage.getItem(storageKey);
        if (item) {
          totalSize += item.length;
        }
      } catch {
        // Ignore errors for individual items
      }
    }

    return totalSize;
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.metadata.values());
    const totalSize = await this.calculateTotalSize();
    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.timestamp)) : 0,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private getStorageKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  getAllKeys(): string[] {
    return Array.from(this.metadata.keys());
  }

  async getSize(key: string): Promise<number> {
    try {
      const storageKey = this.getStorageKey(key);
      const item = await AsyncStorage.getItem(storageKey);
      return item ? item.length : 0;
    } catch {
      return 0;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;
