// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface DoctorRequestDto {
  email: string;
  password?: string; // optional
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
}

export interface DoctorResponseDto {
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

const API_BASE_URL = 'https://38s5pw9t-8080.uks1.devtunnels.ms/api';

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // increased timeout
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  private setAuthToken(token: string) {
    this.authToken = token;
  }

  private clearAuthToken() {
    this.authToken = null;
  }

  async login(credentials: LoginRequestDTO): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  async register(data: DoctorRegisterRequestDTO): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  logout(): void {
    this.clearAuthToken();
  }

  async getMyProfile(): Promise<DoctorResponseDto> {
    const response = await this.api.get<DoctorResponseDto>('/doctors/me');
    return response.data;
  }

  async updateMyProfile(doctorData: DoctorRequestDto): Promise<DoctorResponseDto> {
    const response = await this.api.put<DoctorResponseDto>('/doctors/me', doctorData);
    return response.data;
  }

  async getDoctors(latitude: any, longitude: any, specialization?: string ): Promise<DoctorResponseDto[]> {
    const params: Record<string, any> = {};
    if (specialization) params.specialty = specialization;
    params.latitude = latitude;
    params.longitude = longitude;

    const response = await this.api.get<DoctorResponseDto[]>('/doctors', {
      params,
    });
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
