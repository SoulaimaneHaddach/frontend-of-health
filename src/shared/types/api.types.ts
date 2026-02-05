// src/types/api.types.ts

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface WorkingHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
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
  about?: string;
  hours?: WorkingHours[];
  services?: string[];
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

// ========== Response DTOs ==========

export interface DoctorResponseDto {
  id: string;
  email: string;
  name: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating: number;
  reviewsCount: number;
  about?: string;
  hours?: WorkingHours[];
  services?: string[];
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorMapDto {
  id: string;
  email: string;
  name: string;
  specialization: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  email: string;
  id: string;
}

// ========== Error Types ==========

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export class ApiException extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// ========== Query Params ==========

export interface DoctorQueryParams {
  latitude?: number;
  longitude?: number;
  specialization?: string;
  radiusKm?: number;
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
}
