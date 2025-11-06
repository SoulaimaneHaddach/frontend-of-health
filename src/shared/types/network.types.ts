/**
 * Network and Offline Support Types
 * 
 * Type definitions for network detection and offline capabilities
 */

// ============================================================================
// Network Status Types
// ============================================================================

export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  BLUETOOTH = 'bluetooth',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

export enum NetworkQuality {
  EXCELLENT = 'excellent', // >10 Mbps
  GOOD = 'good',          // 1-10 Mbps
  FAIR = 'fair',          // 100 Kbps - 1 Mbps
  POOR = 'poor',          // <100 Kbps
  OFFLINE = 'offline',
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: ConnectionType;
  quality: NetworkQuality;
  details: {
    isConnectionExpensive: boolean;
    cellularGeneration: string | null; // '2g', '3g', '4g', '5g'
  };
}

export interface NetworkListener {
  (state: NetworkState): void;
}

// ============================================================================
// Offline Storage Types
// ============================================================================

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  metadata?: {
    version?: string;
    source?: string;
    [key: string]: any;
  };
}

export interface CacheOptions {
  ttl?: number;          // Time to live in milliseconds
  priority?: CachePriority;
  tags?: string[];       // For grouped cache invalidation
  compress?: boolean;    // Compress large data
}

export enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;      // In bytes
  oldestEntry: number;    // Timestamp
  newestEntry: number;    // Timestamp
  hitRate: number;        // Percentage
  missRate: number;       // Percentage
}

// ============================================================================
// Request Queue Types
// ============================================================================

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  status: RequestStatus;
  priority: number;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  error?: string;
  metadata?: {
    userId?: string;
    action?: string;
    [key: string]: any;
  };
}

export interface QueueConfig {
  maxConcurrent?: number;    // Max concurrent requests
  maxRetries?: number;       // Max retry attempts
  retryDelay?: number;       // Base delay between retries (ms)
  exponentialBackoff?: boolean;
  priorityMode?: boolean;    // Process high priority first
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

// ============================================================================
// Sync Types
// ============================================================================

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  nextSyncAt: number | null;
  pendingChanges: number;
  conflictCount: number;
  errors: string[];
}

export interface SyncOptions {
  force?: boolean;           // Force sync even if recent
  priority?: number;         // Sync priority
  backgroundSync?: boolean;  // Allow background sync
  conflictResolution?: 'local' | 'remote' | 'merge';
}

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// Offline Strategy Types
// ============================================================================

export enum OfflineStrategy {
  CACHE_FIRST = 'cache-first',       // Try cache first, fall back to network
  NETWORK_FIRST = 'network-first',   // Try network first, fall back to cache
  CACHE_ONLY = 'cache-only',         // Only use cache
  NETWORK_ONLY = 'network-only',     // Only use network
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate', // Return cache, update in background
}

export interface OfflineConfig {
  strategy: OfflineStrategy;
  cacheTTL?: number;
  maxCacheSize?: number;     // In bytes
  maxQueueSize?: number;     // Max queued requests
  autoSync?: boolean;        // Auto sync when online
  syncInterval?: number;     // Auto sync interval (ms)
}

// ============================================================================
// Network Event Types
// ============================================================================

export enum NetworkEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  QUALITY_CHANGED = 'quality-changed',
  TYPE_CHANGED = 'type-changed',
}

export interface NetworkEventData {
  event: NetworkEvent;
  state: NetworkState;
  previousState?: NetworkState;
  timestamp: number;
}

export interface NetworkEventListener {
  (data: NetworkEventData): void;
}
