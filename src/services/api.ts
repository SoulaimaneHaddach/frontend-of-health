// src/services/api.ts - FIXED WITH TOKEN PERSISTENCE
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface DoctorRequestDto {
  email: string;
  password?: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
}

export interface DoctorResponseDto {
  address: string;
  id: string;
  email: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating: number;
  reviewsCount: number;
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
  private authToken: string | null = null;
  private isInitialized = false;

  constructor() {
    this.api = axios.create({
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

  async logout(): Promise<void> {
    await this.clearAuthToken();
  }

  async getMyProfile(): Promise<DoctorResponseDto> {
    const response = await this.api.get<DoctorResponseDto>('/doctors/me');
    return response.data;
  }

  async updateMyProfile(doctorData: DoctorRequestDto): Promise<DoctorResponseDto> {
    const response = await this.api.put<DoctorResponseDto>('/doctors/me', doctorData);
    return response.data;
  }

  async getDoctors(latitude: any, longitude: any, specialization?: string): Promise<DoctorResponseDto[]> {
    const params: Record<string, any> = {};
    if (specialization) params.specialty = specialization;
    params.latitude = latitude;
    params.longitude = longitude;

    const response = await this.api.get<DoctorResponseDto[]>('/doctors', { params });
    return response.data;
  }

  async searchDoctors(query: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors/search', {
      params: { q: query },
    });
    return response.data;
  }
}

export default new ApiService();