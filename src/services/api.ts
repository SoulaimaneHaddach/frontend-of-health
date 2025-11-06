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
import ENV from '../config/env';
import { TokenStorage, sanitizeForLogs } from '../shared/utils/secureStorage';
import { rateLimiter } from '../shared/utils/securityUtils';
import { SECURITY_CONFIG, getSecurityHeaders, isAllowedDomain } from '../shared/config/security.config';
import { errorLoggingService, ErrorSeverity } from '../shared/services/errorLoggingService';
import { networkService } from '../shared/services/networkService';
import { offlineStorageService } from '../shared/services/offlineStorageService';
import { requestQueueService } from '../shared/services/requestQueueService';
import { CachePriority } from '../shared/types/network.types';

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

const API_BASE_URL = 'https://vsrwljl6-8080.uks1.devtunnels.ms/api';

class ApiService {
  private api: AxiosInstance;
  private publicApi: AxiosInstance;
  private authToken: string | null = null;
  private isInitialized = false;

  constructor() {
    // Authenticated API instance
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 
        'Content-Type': 'application/json',
      },
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
          console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
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
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
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
        
        // Log API errors with context
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorSeverity.ERROR,
          {
            action: 'api_call',
            screen: 'API Service',
            extra: {
              url: error.config?.url,
              method: error.config?.method,
              status: (error as any).response?.status,
              statusText: (error as any).response?.statusText,
            },
          },
          true
        );
        
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
        console.log('✅ Token restored from storage');
      }
    } catch (error) {
      console.error('❌ Failed to initialize API service:', error);
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
      console.log('✅ Token saved to secure storage');
    } catch (error) {
      console.error('❌ Failed to save token:', error);
    }
  }
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await TokenStorage.removeToken();
      console.log('✅ Token cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear token:', error);
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
    await this.clearAuthToken();
  }

  async getMyProfile(): Promise<DoctorResponseDto> {
    await this.initialize(); // 
    const response = await this.api.get<DoctorResponseDto>('/doctors/me');
    return response.data;
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
        console.log('📦 Returning cached doctors (offline)');
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
    } catch (error) {
      // Try cache as fallback
      const cached = await offlineStorageService.get<DoctorResponseDto[]>(cacheKey);
      if (cached) {
        console.log('📦 Returning cached doctors (fallback)');
        return cached;
      }
      throw error;
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
        console.log(`📦 Returning cached doctor ${id} (offline)`);
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
    } catch (error) {
      // Try cache as fallback
      const cached = await offlineStorageService.get<DoctorResponseDto>(cacheKey);
      if (cached) {
        console.log(`📦 Returning cached doctor ${id} (fallback)`);
        return cached;
      }
      throw error;
    }
  }

  async searchDoctors(query: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getBookingsByDoctorId(doctorId: string): Promise<BookingResponse[]> {
    await this.initialize();
    const response = await this.api.get<BookingResponse[]>(`/doctors/${doctorId}/bookings`);
    return response.data;
  }

  async createBooking(
    doctorId: string,
    bookingData: BookingCreateRequest
  ): Promise<BookingResponse> {
    // Validate: Doctor cannot book themselves
    const currentUser = await this.getMyProfile().catch(() => null);
    if (currentUser && currentUser.id === doctorId) {
      throw new Error('Doctors cannot book appointments with themselves');
    }

    // If offline, queue the request
    if (!networkService.isConnected()) {
      console.log('📤 Queuing booking request (offline)');
      await requestQueueService.addRequest(
        `/doctors/${doctorId}/bookings`,
        'POST',
        {
          body: bookingData,
          priority: 10, // High priority
          metadata: { action: 'create_booking', doctorId },
        }
      );
      
      // Return a placeholder response
      return {
        id: 'pending',
        doctorId,
        phoneNumberUser: bookingData.phoneNumberUser,
        emailUser: bookingData.emailUser,
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
}

export default new ApiService();