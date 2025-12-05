// src/services/api.ts - Production-Grade API Service
import axios, { AxiosInstance, AxiosError } from 'axios';
import { BookingCreateRequest, BookingResponse, BookingStatus } from '../shared/types/booking';
import {
  DoctorRequestDto,
  DoctorResponseDto,
  DoctorMapDto,
  DoctorRegisterRequestDTO,
  LoginRequestDTO,
  AuthResponse,
  DoctorQueryParams,
  Location,
  WorkingHours,
} from '../shared/types/api.types';
import { logError } from '../shared/utils/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import ENV from '../config/env';
import { TokenStorage } from '../shared/utils/secureStorage';
// rateLimiter intentionally removed: not used in this module
import { errorLoggingService, ErrorSeverity } from '../shared/services/errorLoggingService';
import { networkService } from '../shared/services/networkService';
import { offlineStorageService } from '../shared/services/offlineStorageService';
import { requestQueueService } from '../shared/services/requestQueueService';
import logger from '../shared/utils/logger';
import { CachePriority } from '../shared/types/network.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeForLogs as sanitizeHeadersForLogs } from '../shared/utils/secureStorage';

// In-flight request coalescing map to avoid duplicate identical requests
const inFlightRequests: Map<string, Promise<any>> = new Map();

// Simple circuit-breaker state per logical endpoint
type FailureState = { count: number; blockedUntil?: number; lastError?: any };
const endpointFailureState: Record<string, FailureState> = {};
const CIRCUIT_BREAKER_THRESHOLD = 3; // failures before opening circuit
const CIRCUIT_BREAKER_COOLDOWN_MS = 30 * 1000; // 30s cooldown

// Retry/backoff helper
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const shouldRetry = (err: any) => {
  const status = err?.response?.status;
  // Retry on network errors or 5xx server errors
  return !err?.response || (status >= 500 && status < 600);
};

// Re-export types for backwards compatibility
export type {
  DoctorRequestDto,
  DoctorResponseDto,
  DoctorMapDto,
  DoctorRegisterRequestDTO,
  LoginRequestDTO,
  AuthResponse,
  DoctorQueryParams,
  Location,
  WorkingHours,
};

// const API_BASE_URL = 'https://healingbackend-production-a872.up.railway.app/api';
const API_BASE_URL = 'https://vsrwljl6-8080.uks1.devtunnels.ms/api'; // Local dev only

class ApiService {
  private api: AxiosInstance;
  private publicApi: AxiosInstance;
  private authToken: string | null = null;
  private isInitialized = false;

  constructor() {
    // Authenticated API instance
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Reduced from 30s to 15s for faster failure
      headers: { 
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

 
    this.publicApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Setup interceptors
    this.setupInterceptors();
  }
  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await TokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log requests in development
        if (ENV.ENABLE_LOGGING && __DEV__) {
          logger.debug(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }
        
        return config;
      },
      (error) => {
        logError(error, 'API Request');
        
        // Log to error logging service
        errorLoggingService.addBreadcrumb({
          category: 'network',
          message: `API Request Error: ${error.message}`,
          level: ErrorSeverity.ERROR,
        });
        
        return Promise.reject(error);
      }
    );

    // Response interceptor - Log responses and handle errors
    this.api.interceptors.response.use(
      (response) => {
        if (ENV.ENABLE_LOGGING && __DEV__) {
          logger.debug(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        if (ENV.ENABLE_LOGGING) {
          logError(error, 'API Response');
        }

        // Prepare sanitized context before sending to remote
        const cfg = (error as any)?.config || {};
        const sanitizedCfg: any = { ...cfg };
        try {
          if (sanitizedCfg.headers) {
            sanitizedCfg.headers = sanitizeHeadersForLogs(sanitizedCfg.headers);
          }
        } catch {
          // ignore
        }

        // Allow callers to suppress remote logging for noisy retry attempts
        const suppress = Boolean(sanitizedCfg.headers && (sanitizedCfg.headers['x-suppress-logging'] || sanitizedCfg.headers['X-Suppress-Logging']));
        if (!suppress) {
          errorLoggingService.logError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorSeverity.ERROR,
            {
              action: 'api_call',
              screen: 'API Service',
              extra: {
                url: sanitizedCfg.url,
                method: sanitizedCfg.method,
                status: (error as any).response?.status,
                statusText: (error as any).response?.statusText,
                request: sanitizedCfg,
              },
            },
            true
          );
        }

        return Promise.reject(error);
      }
    );

    // Same for publicApi
    this.publicApi.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (ENV.ENABLE_LOGGING) {
          logError(error, 'Public API Response');
        }
        return Promise.reject(error);
      }
    );
  }
  private sanitizeLogData(data: any): any {
    if (!data) return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize offline services
      await networkService.initialize();
      await offlineStorageService.initialize();
      await requestQueueService.initialize();
      
      const token = await TokenStorage.getToken();
      if (token) {
        this.authToken = token;
        logger.debug('✅ Token restored from storage');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize API service:', error);
    } finally {
      this.isInitialized = true;
    }
  }
  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    return this.authToken !== null;
  }
  getToken(): string | null {
    return this.authToken;
  }
  private async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
      try {
      await TokenStorage.setToken(token);
      logger.debug('✅ Token saved to secure storage');
    } catch (error) {
      logger.error('❌ Failed to save token:', error);
    }
  }
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await TokenStorage.removeToken();
      logger.debug('✅ Token cleared from storage');
    } catch (error) {
      logger.error('❌ Failed to clear token:', error);
    }
  }
  async login(credentials: LoginRequestDTO): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      await this.setAuthToken(response.data.accessToken);
      return response.data;
    } catch (error) {
      logError(error, 'login');
      throw error;
    }
  }
  async register(data: DoctorRegisterRequestDTO): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', data);
      await this.setAuthToken(response.data.accessToken);
      return response.data;
    } catch (error) {
      logError(error, 'register');
      throw error;
    }
  }
  async forgotPassword(email: string): Promise<{ message?: string }> {
    try {
      const response = await this.api.post<{ message?: string }>(
        '/auth/forgot-password',
        { email }
      );
      return response.data;
    } catch (error) {
      logError(error, 'forgotPassword');
      throw error;
    }
  }
  async resetPassword(token: string, newPassword: string): Promise<{ message?: string }> {
    try {
      const response = await this.api.post<{ message?: string }>(
        '/auth/reset-password',
        { token, newPassword }
      );
      return response.data;
    } catch (error) {
      logError(error, 'resetPassword');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.debug('🔄 Starting logout...');
      
      // 1. Clear auth token from memory and storage
      this.authToken = null;
      await TokenStorage.removeToken();
      
      // 2. Clear doctor ID from AsyncStorage
      await AsyncStorage.removeItem('doctorId');
      
      // 3. Clear any cached user data
      await offlineStorageService.removeByTag('user');
      await offlineStorageService.removeByTag('profile');
      await offlineStorageService.removeByTag('doctor');
      
      // 4. Clear request queue
      await requestQueueService.clearAll();
      
      // 5. Reset initialization state
      this.isInitialized = false;

      logger.debug('✅ Logout completed successfully');
      logger.debug('📝 Token cleared:', this.authToken === null);
    } catch (error) {
      logger.error('❌ Logout error:', error);
      // Force clear token even if other operations fail
      this.authToken = null;
      await TokenStorage.removeToken().catch(() => {});
      await AsyncStorage.removeItem('doctorId').catch(() => {});
      throw error;
    }
  }

  async getMyProfile(): Promise<DoctorResponseDto> {
    await this.initialize();

    const cacheKey = 'profile:me';
    const endpointKey = 'profile';

    // If circuit is open and we are in cooldown, avoid network attempts
    const stateNow = endpointFailureState[endpointKey];
    if (stateNow?.blockedUntil && stateNow.blockedUntil > Date.now()) {
      try {
        const cached = await offlineStorageService.get<DoctorResponseDto>(cacheKey);
        if (cached) {
          logger.debug('📦 Returning cached profile while circuit open');
          return cached;
        }
      } catch {
        // ignore
      }
      throw new Error('Service temporarily unavailable. Please try again later.');
    }

    const key = cacheKey;
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key) as Promise<DoctorResponseDto>;
    }

    const fn = (async (): Promise<DoctorResponseDto> => {
      // Try with retries on network/5xx errors and fall back to cache if available.
      const maxAttempts = 3;
      const baseDelay = 200; // ms

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await this.api.get<DoctorResponseDto>('/doctors/me', { headers: { 'x-suppress-logging': attempt > 1 ? '1' : '0' } });
          // Cache the profile for offline fallback
          try {
            await offlineStorageService.set('profile:me', response.data, { ttl: 60 * 60 * 1000, priority: CachePriority.HIGH, tags: ['profile', 'user'] });
          } catch (e) {
            // non-fatal
            logger.debug('Failed to cache profile response', e);
          }
          // reset failure state on success
          if (endpointFailureState[endpointKey]) {
            endpointFailureState[endpointKey] = { count: 0 };
          }
          return response.data;
        } catch (err: any) {
          // If not retryable or last attempt, try cache fallback then rethrow enriched error
          const status = err?.response?.status;
          const isRetryable = shouldRetry(err);
          if (attempt < maxAttempts && isRetryable) {
            const jitter = Math.floor(Math.random() * 100);
            const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
            logger.debug(`Retrying getMyProfile (${attempt}/${maxAttempts}) after ${delay}ms`);
            // suppress remote logging for retries
            await sleep(delay);
            continue;
          }

          // Final attempt failed — try returning cached profile if available
          try {
            const cached = await offlineStorageService.get<DoctorResponseDto>('profile:me');
            if (cached) {
              logger.debug('📦 Returning cached profile after API failure');
              return cached;
            }
          } catch {
            // ignore
          }
          // update circuit state
          const prev = endpointFailureState[endpointKey] || { count: 0 };
          const nextCount = (prev.count || 0) + 1;
          const newState: FailureState = { count: nextCount, lastError: err };
          if (nextCount >= CIRCUIT_BREAKER_THRESHOLD) {
            newState.blockedUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
            logger.warn(`Circuit opened for ${endpointKey} for ${CIRCUIT_BREAKER_COOLDOWN_MS}ms`);
          }
          endpointFailureState[endpointKey] = newState;

          // Enrich error with parsed server message when available
          const serverMessage = err?.response?.data?.message || err?.message || 'Unknown error';
          const enriched = new Error(`API getMyProfile failed: ${serverMessage} (status: ${status ?? 'unknown'})`);
          // attach original error for callers that need it
          (enriched as any).original = err;
          // Log at error level with context (errorLoggingService will have already recorded, but add breadcrumb)
          errorLoggingService.addBreadcrumb({ category: 'network', message: 'getMyProfile final failure', level: ErrorSeverity.ERROR });
          throw enriched;
        }
      }

      // Should never reach here
      throw new Error('Failed to fetch profile');
    })();

    inFlightRequests.set(key, fn);
    fn.finally(() => inFlightRequests.delete(key)).catch(() => {});
    return fn;
  }

  async updateMyProfile(doctorData: DoctorRequestDto): Promise<DoctorResponseDto> {
    await this.initialize(); //
    const response = await this.api.put<DoctorResponseDto>('/doctors/me', doctorData);
    return response.data;
  }

  async updateDoctorById(id: string, doctorData: DoctorRequestDto): Promise<DoctorResponseDto> {
    await this.initialize(); // 
    const response = await this.api.put<DoctorResponseDto>(`/doctors/${id}`, doctorData);
    return response.data;
  }


  async getDoctors(
    latitude?: number,
    longitude?: number,
    specialization?: string,
    radiusKm?: number
  ): Promise<DoctorResponseDto[]> {
    const params: Record<string, any> = {};
    if (specialization) params.specialization = specialization; 
    if (typeof latitude === 'number') params.latitude = latitude;
    if (typeof longitude === 'number') params.longitude = longitude;
    if (typeof radiusKm === 'number') params.radiusKm = radiusKm;

    // Generate cache key
    const cacheKey = `doctors:${JSON.stringify(params)}`;

    // Try cache first if offline or prefer cache
    if (!networkService.isConnected()) {
      const cached = await offlineStorageService.get<DoctorResponseDto[]>(cacheKey);
      if (cached) {
        logger.debug('📦 Returning cached doctors (offline)');
        return cached;
      }
      throw new Error('No internet connection and no cached data available');
    }

    try {
      const response = await this.api.get<DoctorResponseDto[]>('/doctors', { params });
      
      // Cache the response
      await offlineStorageService.set(cacheKey, response.data, {
        ttl: 10 * 60 * 1000, // 10 minutes
        priority: CachePriority.HIGH,
        tags: ['doctors'],
      });

      return response.data;
    } catch {
      // Try cache as fallback
      const cached = await offlineStorageService.get<DoctorResponseDto[]>(cacheKey);
        if (cached) {
        logger.debug('📦 Returning cached doctors (fallback)');
        return cached;
      }
      throw new Error('Failed to fetch doctors');
    }
  }

  async getDoctorsMap(
    latitude?: number,
    longitude?: number,
    specialization?: string,
    radiusKm?: number
  ): Promise<DoctorMapDto[]> {
    // Revert to using 
    const params: Record<string, any> = {};
    if (specialization) params.specialization = specialization;
    if (typeof latitude === 'number') params.latitude = latitude;
    if (typeof longitude === 'number') params.longitude = longitude;
    if (typeof radiusKm === 'number') params.radiusKm = radiusKm;

    try {
      const response = await this.publicApi.get<DoctorResponseDto[]>('/doctors', { params });
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map((d) => ({
        id: d.id,
        email: d.email,
        name: d.name,
        specialization: d.specialization,
        location: d.location,
      }));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Retry with authenticated client if public endpoint is protected
        await this.initialize();
        const responseAuth = await this.api.get<DoctorResponseDto[]>('/doctors', { params });
        const listAuth = Array.isArray(responseAuth.data) ? responseAuth.data : [];
        return listAuth.map((d) => ({
          id: d.id,
          email: d.email,
          name: d.name,
          specialization: d.specialization,
          location: d.location,
        }));
      }
      throw err;
    }
  }

  async getDoctorById(id: string): Promise<DoctorResponseDto> {
    const cacheKey = `doctor:${id}`;

    // Try cache first if offline
    if (!networkService.isConnected()) {
      const cached = await offlineStorageService.get<DoctorResponseDto>(cacheKey);
      if (cached) {
        logger.debug(`📦 Returning cached doctor ${id} (offline)`);
        return cached;
      }
      throw new Error('No internet connection and no cached data available');
    }

    try {
      const response = await this.publicApi.get<DoctorResponseDto>(`/doctors/${id}`);
      
      // Cache the response
      await offlineStorageService.set(cacheKey, response.data, {
        ttl: 30 * 60 * 1000, // 30 minutes
        priority: CachePriority.MEDIUM,
        tags: ['doctor', `doctor:${id}`],
      });

      return response.data;
    } catch {
      // Try cache as fallback
      const cached = await offlineStorageService.get<DoctorResponseDto>(cacheKey);
      if (cached) {
        logger.debug(`📦 Returning cached doctor ${id} (fallback)`);
        return cached;
      }
      throw new Error('Failed to fetch doctor');
    }
  }

  async searchDoctors(query: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getBookingsByDoctorId(doctorId: string, p0: { page: number; limit: number; signal: AbortSignal; }): Promise<BookingResponse[]> {
    await this.initialize();
    const { page, limit, signal } = p0 || { page: 1, limit: 15, signal: undefined } as any;

    const key = `${doctorId}|page=${page}|limit=${limit}`;
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key) as Promise<BookingResponse[]>;
    }

    const fn = (async (): Promise<BookingResponse[]> => {
      let attempts = 0;
      const maxAttempts = 3;
      const baseDelay = 250; // ms

      while (true) {
        attempts += 1;
        try {
          const response = await this.api.get<BookingResponse[]>(`/doctors/${doctorId}/bookings`, { params: { page, limit }, signal, headers: { 'x-suppress-logging': '1' } });
          return response.data;
        } catch (err: any) {
          if (attempts >= maxAttempts || !shouldRetry(err)) {
            throw err;
          }
          // Exponential backoff with jitter
          const jitter = Math.floor(Math.random() * 100);
          const delay = baseDelay * Math.pow(2, attempts - 1) + jitter;
          logger.debug(`Retrying bookings request (${attempts}/${maxAttempts}) after ${delay}ms`);
          await sleep(delay);
          // continue loop
        }
      }
    })();

    inFlightRequests.set(key, fn);
    // Ensure the map entry is removed after completion
    fn.finally(() => inFlightRequests.delete(key)).catch(() => {});
    return fn;
  }

  async createBooking(
    doctorId: string,
    bookingData: BookingCreateRequest
  ): Promise<BookingResponse> {
    // Validate: Doctor cannot book themselves
    // Only check if user has a token (might be logged in as doctor)
    const token = await TokenStorage.getToken();
    if (token) {
      try {
        const currentUser = await this.getMyProfile();
        if (currentUser && currentUser.id === doctorId) {
          throw new Error('Doctors cannot book appointments with themselves');
        }
      } catch {
        // If 500/404/403, user is not a doctor - allow booking to proceed
        logger.debug('ℹ️ User is not a doctor, allowing booking');
      }
    }

    // If offline, queue the request with a clientLocalId so the UI can reconcile later
    if (!networkService.isConnected()) {
      const clientLocalId = uuidv4();
      logger.debug('📤 Queuing booking request (offline)', clientLocalId);
      await requestQueueService.addRequest(
        `/doctors/${doctorId}/bookings`,
        'POST',
        {
          body: { ...bookingData, clientLocalId },
          priority: 10, // High priority
          metadata: { action: 'create_booking', doctorId, clientLocalId },
        }
      );
      
      // Return a placeholder response including clientLocalId
      return {
        id: `pending-${clientLocalId}`,
        doctorId,
        phoneNumberUser: bookingData.phoneNumberUser,
        nameUser: bookingData.nameUser,
        appointmentTime: bookingData.appointmentTime,
        status: 'PENDING' as BookingStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const res = await this.publicApi.post<BookingResponse>(
        `/doctors/${doctorId}/bookings`,
        bookingData,
        { headers: { Accept: 'application/json' } }
      );
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 403) throw err;
      
      await this.initialize();
      const res2 = await this.api.post<BookingResponse>(
        `/doctors/${doctorId}/bookings`,
        bookingData,
        { headers: { Accept: 'application/json' } }
      );
      return res2.data;
    }
  }

  async isDoctor(): Promise<boolean> {
    await this.initialize();
    if (!this.authToken) return false;
    try {
      await this.api.get('/doctors/me');
      return true;
    } catch {
      logger.debug('ℹ️ isDoctor check: User is not a doctor or error occurred');
      return false;
    }
  }


  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<BookingResponse> {
    await this.initialize(); 
    const response = await this.api.put<BookingResponse>(
      `/bookings/${bookingId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  }

  async deleteBooking(bookingId: string): Promise<void> {
    await this.initialize();
    try {
      await this.api.delete(`/bookings/${bookingId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        await this.initialize();
        await this.api.delete(`/bookings/${bookingId}`);
        return;
      }
      throw err;
    }
  }

  /**
   * Register a device push token with the backend so the server can send push notifications.
   * tokenType: 'expo' | 'native' or custom string
   */
  async registerDeviceToken(
    token: string,
    platform: string,
    tokenType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.initialize();
      // Send to authenticated endpoint so server can tie token to user when possible
      await this.api.post('/devices', {
        token,
        platform,
        tokenType,
        metadata,
      });
      if (ENV.ENABLE_LOGGING && __DEV__) {
        logger.debug('✅ Device token registered with backend');
      }
    } catch (error) {
      logger.warn('Failed to register device token with backend', error);
    }
  }
}

export default new ApiService();