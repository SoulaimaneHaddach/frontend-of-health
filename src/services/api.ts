// src/services/api.ts
import axios, { AxiosInstance } from 'axios';
import { LoginCredentials, RegisterData, DoctorResponseDto, DoctorRequestDto, AuthResponse } from '../types';

const API_BASE_URL = 'https://38s5pw9t-8080.uks1.devtunnels.ms/api/'; // replace with your PC's LAN IP


class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(config => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  private setAuthToken(token: string) { this.authToken = token; }
  private getAuthToken() { return this.authToken; }
  private clearAuthToken() { this.authToken = null; }

  // Auth
  async login(credentials: LoginCredentials): Promise<{ doctor: AuthResponse; token: string }> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    this.setAuthToken(response.data.accessToken);
    return { doctor: response.data, token: response.data.accessToken };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    this.setAuthToken(response.data.accessToken);
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearAuthToken();
  }

  // Doctor endpoints
  async getDoctors(specialty: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors', { params: { specialty } });
    return response.data;
  }

  async updateDoctor(id: string, doctorData: DoctorRequestDto): Promise<DoctorResponseDto> {
    const response = await this.api.put<DoctorResponseDto>(`/doctors/${id}`, doctorData, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    return response.data;
  }

  async searchDoctors(query: string): Promise<DoctorResponseDto[]> {
    const response = await this.api.get<DoctorResponseDto[]>('/doctors/search', { params: { q: query } });
    return response.data;
  }
}

export default new ApiService();
