/**
 * Request Queue Service
 * 
 * Manages queuing and retry of failed network requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';
import {
  QueuedRequest,
  RequestStatus,
  QueueConfig,
  QueueStats,
} from '../types/network.types';
import { networkService } from './networkService';
import { errorLoggingService, ErrorSeverity } from './errorLoggingService';

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// Constants
// ============================================================================

const QUEUE_STORAGE_KEY = '@request_queue';
const DEFAULT_MAX_CONCURRENT = 3;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

// ============================================================================
// Request Queue Service Class
// ============================================================================

class RequestQueueService {
  private queue: Map<string, QueuedRequest> = new Map();
  private processing: Set<string> = new Set();
  private config: QueueConfig;
  private initialized: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
  };

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxConcurrent: DEFAULT_MAX_CONCURRENT,
      maxRetries: DEFAULT_MAX_RETRIES,
      retryDelay: DEFAULT_RETRY_DELAY,
      exponentialBackoff: true,
      priorityMode: true,
      ...config,
    };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadQueue();
      this.startProcessing();

      // Listen to network changes and keep unsubscribe
      this.networkUnsubscribe = networkService.addListener((state) => {
        if (state.isConnected) {
          this.processQueue();
        }
      });

      this.initialized = true;
      if (typeof console !== 'undefined') console.log('[RequestQueueService] Initialized successfully');
    } catch (error) {
      if (typeof console !== 'undefined') console.error('[RequestQueueService] Initialization failed:', error);
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        { action: 'request_queue_init' },
        false
      );
    }
  }

  // ==========================================================================
  // Queue Management
  // ==========================================================================

  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        const queueArray: QueuedRequest[] = JSON.parse(queueJson);
        this.queue = new Map(queueArray.map((req) => [req.id, req]));
        this.updateStats();
      }
    } catch (error) {
      if (typeof console !== 'undefined') console.error('[RequestQueueService] Failed to load queue:', error);
      this.queue = new Map();
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const queueArray = Array.from(this.queue.values());
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueArray));
    } catch (error) {
      if (typeof console !== 'undefined') console.error('[RequestQueueService] Failed to save queue:', error);
    }
  }

  // ==========================================================================
  // Add Request
  // ==========================================================================

  async addRequest(
    url: string,
    method: QueuedRequest['method'],
    options: {
      headers?: Record<string, string>;
      body?: any;
      priority?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const {
      headers,
      body,
      priority = 5,
      maxAttempts = this.config.maxRetries || 3,
      metadata,
    } = options;

    const request: QueuedRequest = {
      id: generateUUID(),
      url,
      method,
      headers,
      body,
      status: RequestStatus.PENDING,
      priority,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts,
      metadata,
    };

    this.queue.set(request.id, request);
    await this.saveQueue();
    this.updateStats();

    if (typeof console !== 'undefined') console.log(`[RequestQueueService] Added request ${request.id} to queue`);

    // Try to process immediately if online
    if (networkService.isConnected()) {
      this.processQueue();
    }

    return request.id;
  }

  // ==========================================================================
  // Process Queue
  // ==========================================================================

  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    // Process queue every 5 seconds
    this.processingInterval = setInterval(() => {
      if (networkService.isConnected()) {
        this.processQueue();
      }
    }, 5000);
  }

  private async processQueue(): Promise<void> {
    // Don't exceed max concurrent requests
    if (this.processing.size >= (this.config.maxConcurrent || DEFAULT_MAX_CONCURRENT)) {
      return;
    }

    // Get pending requests
    const pendingRequests = Array.from(this.queue.values())
      .filter((req) => req.status === RequestStatus.PENDING)
      .filter((req) => req.attempts < req.maxAttempts);

    if (pendingRequests.length === 0) {
      return;
    }

    // Sort by priority if enabled
    if (this.config.priorityMode) {
      pendingRequests.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
    }

    // Process requests up to max concurrent
    const toProcess = pendingRequests.slice(
      0,
      (this.config.maxConcurrent || DEFAULT_MAX_CONCURRENT) - this.processing.size
    );

    await Promise.all(toProcess.map((req) => this.processRequest(req)));
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    if (this.processing.has(request.id)) {
      return;
    }

    this.processing.add(request.id);
    request.status = RequestStatus.PROCESSING;
    request.attempts++;
    request.lastAttemptAt = Date.now();
    
    await this.saveQueue();
    this.updateStats();

    const startTime = Date.now();

    try {
      if (typeof console !== 'undefined') console.log(`[RequestQueueService] Processing request ${request.id} (attempt ${request.attempts})`);

      const config: AxiosRequestConfig = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.body,
      };

      const res = await axios(config);

      // Success
      request.status = RequestStatus.COMPLETED;
      this.stats.completed++;
      this.stats.totalProcessed++;

      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      // Emit event for completed request (useful for UI reconciliation)
      this.emit('requestCompleted', { request, response: res?.data });

      if (typeof console !== 'undefined') console.log(`[RequestQueueService] Request ${request.id} completed successfully`);
    } catch (error) {
      // Failed
      if (typeof console !== 'undefined') console.error(`[RequestQueueService] Request ${request.id} failed:`, error);

      if (request.attempts >= request.maxAttempts) {
        request.status = RequestStatus.FAILED;
        request.error = error instanceof Error ? error.message : String(error);
        this.stats.failed++;
        this.stats.totalProcessed++;

        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorSeverity.WARNING,
          { action: 'request_queue_failed', extra: { requestId: request.id, url: request.url } },
          false
        );
      } else {
        // Retry later
        request.status = RequestStatus.PENDING;

        // Apply exponential backoff
        if (this.config.exponentialBackoff) {
          const delay = (this.config.retryDelay || DEFAULT_RETRY_DELAY) * Math.pow(2, request.attempts - 1);
          setTimeout(() => this.processQueue(), delay);
        }
      }
    } finally {
      this.processing.delete(request.id);
      await this.saveQueue();
      this.updateStats();
    }
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  private updateStats(): void {
    const requests = Array.from(this.queue.values());

    this.stats.pending = requests.filter((r) => r.status === RequestStatus.PENDING).length;
    this.stats.processing = requests.filter((r) => r.status === RequestStatus.PROCESSING).length;
  }

  private updateAverageProcessingTime(newTime: number): void {
    if (!this.stats.totalProcessed || this.stats.totalProcessed <= 0) {
      this.stats.averageProcessingTime = newTime;
      return;
    }

    const prevCount = Math.max(this.stats.totalProcessed - 1, 0);
    const total = this.stats.averageProcessingTime * prevCount;
    this.stats.averageProcessingTime = (total + newTime) / this.stats.totalProcessed;
  }

  getStats(): QueueStats {
    return { ...this.stats };
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  getRequest(id: string): QueuedRequest | undefined {
    return this.queue.get(id);
  }

  getAllRequests(): QueuedRequest[] {
    return Array.from(this.queue.values());
  }

  getPendingRequests(): QueuedRequest[] {
    return this.getAllRequests().filter((r) => r.status === RequestStatus.PENDING);
  }

  getFailedRequests(): QueuedRequest[] {
    return this.getAllRequests().filter((r) => r.status === RequestStatus.FAILED);
  }

  // ==========================================================================
  // Management Methods
  // ==========================================================================

  addListener(event: string, cb: Function) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(cb);
    return () => this.removeListener(event, cb);
  }

  removeListener(event: string, cb: Function) {
    const set = this.eventListeners.get(event);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this.eventListeners.delete(event);
  }

  private emit(event: string, payload?: any) {
    const set = this.eventListeners.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try { cb(payload); } catch (e) { /* swallow */ }
    });
  }

  async retryRequest(id: string): Promise<void> {
    const request = this.queue.get(id);
    if (!request) {
      throw new Error(`Request ${id} not found`);
    }

    request.status = RequestStatus.PENDING;
    request.attempts = 0;
    request.error = undefined;

    await this.saveQueue();
    this.updateStats();

    if (networkService.isConnected()) {
      this.processQueue();
    }
  }

  async retryAllFailed(): Promise<void> {
    const failed = this.getFailedRequests();
    await Promise.all(failed.map((req) => this.retryRequest(req.id)));
  }

  async cancelRequest(id: string): Promise<void> {
    const request = this.queue.get(id);
    if (!request) {
      return;
    }

    request.status = RequestStatus.CANCELLED;
    await this.saveQueue();
    this.updateStats();
  }

  async removeRequest(id: string): Promise<void> {
    this.queue.delete(id);
    await this.saveQueue();
    this.updateStats();
  }

  async clearCompleted(): Promise<void> {
    const completed = this.getAllRequests().filter(
      (r) => r.status === RequestStatus.COMPLETED
    );

    completed.forEach((req) => this.queue.delete(req.id));
    await this.saveQueue();
    this.updateStats();

    console.log(`[RequestQueueService] Cleared ${completed.length} completed requests`);
  }

  async clearAll(): Promise<void> {
    this.queue.clear();
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    this.stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalProcessed: 0,
      averageProcessingTime: 0,
    };

    console.log('[RequestQueueService] Cleared all requests');
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Unsubscribe from network listener if provided
    if (this.networkUnsubscribe) {
      try { this.networkUnsubscribe(); } catch (e) { /* ignore */ }
      this.networkUnsubscribe = null;
    }

    this.initialized = false;
    if (typeof console !== 'undefined') console.log('[RequestQueueService] Cleaned up');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const requestQueueService = new RequestQueueService();
export default requestQueueService;
