// src/services/api.ts - FIXED WITH TOKEN PERSISTENCE
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookingCreateRequest, BookingResponse, BookingStatus } from '../types/booking';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface WorkingHours {
  day: string; // e.g., "Monday", "Mon - Fri", etc.
  openTime: string; // e.g., "09:00"
  closeTime: string; // e.g., "17:00"
  isClosed?: boolean; // true if closed on this day
}

export interface DoctorRequestDto {
  email: string;
  password?: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating?: number;
  reviewsCount?: number;
  about?: string; // Doctor bio/profile description
  hours?: WorkingHours[]; // Working hours schedule
  services?: string[]; // Services offered (e.g., ["General Consultation", "Health Checkups"])
}

export interface DoctorResponseDto {
  address?: string;
  id: string;
  email: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating: number;
  reviewsCount: number;
  about?: string;
  hours?: WorkingHours[]; // Working hours schedule
  services?: string[]; // Services offered
  createdAt: string;
  updatedAt: string;
}

export interface DoctorRegisterRequestDTO {
  name: string;
  email: string;
  password: string;
  specialization: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  email: string;
  id: string;
}

const API_BASE_URL = 'https://vsrwljl6-8080.uks1.devtunnels.ms/api';

class ApiService {
  private api: AxiosInstance;
  private publicApi: AxiosInstance;
  private authToken: string | null = null;
  private isInitialized = false;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Public axios instance: never attaches Authorization
    this.publicApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  // ⭐ NEW: Initialize and restore token from AsyncStorage
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
        console.log('✅ Token restored from storage');
      }
    } catch (error) {
      console.error('❌ Failed to restore token:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  // ⭐ NEW: Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    return this.authToken !== null;
  }

  // ⭐ NEW: Get current token
  getToken(): string | null {
    return this.authToken;
  }

  private async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('❌ Failed to save token:', error);
    }
  }

  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await AsyncStorage.multiRemove(['authToken', 'doctorEmail', 'doctorId']);
      console.log('✅ Token cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear token:', error);
    }
  }

  async login(credentials: LoginRequestDTO): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    await this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  async register(data: DoctorRegisterRequestDTO): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    await this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  // ⭐ NEW: Forgot/Reset Password flows (backend endpoints may vary)
  async forgotPassword(email: string): Promise<{ message?: string }> {
    const response = await this.api.post<{ message?: string }>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message?: string }> {
    const response = await this.api.post<{ message?: string }>(
      '/auth/reset-password',
      { token, newPassword }
    );
    return response.data;
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

    const response = await this.api.get<DoctorResponseDto[]>('/doctors', { params });
    return response.data;
  }

  async searchDoctors(query: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors/search', {
      params: { q: query },
    });
    return response.data;
  }

  // ⭐ BOOKINGS ENDPOINTS
  
  /**
   * Get all bookings for a specific doctor (requires doctorId in query)
   */
  async getBookingsByDoctorId(doctorId: string): Promise<BookingResponse[]> {
    await this.initialize(); // ⭐ Ensure token is loaded (not required but harmless)
    // Per backend contract: GET /api/doctors/{doctorId}/bookings (no trailing slash)
    const response = await this.api.get<BookingResponse[]>(`/doctors/${doctorId}/bookings`);
    return response.data;
  }

  /**
   * Create a new booking (patient-side, no auth required)
   * Note: backend uses lowercase 'doctorid' in query param
   */
  async createBooking(
    doctorId: string,
    bookingData: BookingCreateRequest
  ): Promise<BookingResponse> {
    // Per backend contract: POST /api/doctors/{doctorId}/bookings (no trailing slash)
    // Try anonymous first (desired product behavior), then fall back to authenticated if 401/403
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
      // Retry with auth if available
      await this.initialize();
      const res2 = await this.api.post<BookingResponse>(
        `/doctors/${doctorId}/bookings`,
        bookingData,
        { headers: { Accept: 'application/json' } }
      );
      return res2.data;
    }
  }

  // Helper: check if current token belongs to a doctor role
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

  /**
   * Update booking status (doctor-side)
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<BookingResponse> {
    await this.initialize(); // ⭐ Ensure token is loaded
    // Per backend contract: PUT /api/bookings/{bookingId}/status?status=ACCEPTED
    const response = await this.api.put<BookingResponse>(
      `/bookings/${bookingId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  }
}

export default new ApiService();