// src/types/index.ts

export type UserRole = 'doctor' | 'user';
export type SpecialtyType =
  | 'all'
  | 'hearing'
  | 'orthopedic'
  | 'brain'
  | 'cardiology'
  | 'dermatology'
  | 'pediatrics'
  | 'ophthalmology'
  | 'psychiatry'
  | 'gastroenterology'
  | 'endocrinology'
  | 'neurology'
  | 'ent'
  | 'urology'
  | 'nephrology'
  | 'oncology'
  | 'gynecology'
  | 'dentistry'
  | 'pulmonology'
  | 'rheumatology'
  | 'allergy';



// Frontend Doctor type


// Backend response after login/register
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  email: string;
  id: string; // UUID
}

export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type WorkingHours = {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
};

export type DoctorResponseDto = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating: number;
  reviewsCount: number;
  address?: string;
  about?: string | null; // Doctor bio/profile description
  hours?: WorkingHours[]; // Working hours schedule
  services?: string[]; // Services offered
  createdAt: string; // ISO string representation of LocalDateTime
  updatedAt: string; // ISO string representation of LocalDateTime
};


// Backend Doctor request DTO (used for updates/creation)
export interface DoctorRequestDto {
  name: string;
  email: string;
  password?: string; // optional for updates
  specialization: string;
  phoneNumber: string;
  location: Location;
  rating: number;
  reviewsCount: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phoneNumber: string;
  specialization?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

// Filters for doctor search
export interface SearchFilters {
  specialty?: SpecialtyType;
  searchQuery?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
}
