// src/shared/hooks/useDoctors.ts
import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import ApiService, { DoctorResponseDto, DoctorMapDto, DoctorQueryParams } from '../../services/api';
import { SpecialtyType } from '../types';

export interface UseDoctorsOptions {
  autoFetch?: boolean;
  initialParams?: DoctorQueryParams;
}

/**
 * Custom hook for doctor-related operations
 * Handles fetching, filtering, and searching doctors
 * 
 * @example
 * const { doctors, loading, fetchDoctors, searchDoctors } = useDoctors({
 *   autoFetch: true,
 *   initialParams: { specialization: 'cardiology' }
 * });
 */
export function useDoctors(options: UseDoctorsOptions = {}) {
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorResponseDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialty, setSpecialty] = useState<SpecialtyType | null>(null);

  const doctorsApi = useApi<DoctorResponseDto[]>();
  const doctorByIdApi = useApi<DoctorResponseDto>();

  useEffect(() => {
    if (options.autoFetch) {
      fetchDoctors(options.initialParams);
    }
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, specialty]);

  const fetchDoctors = useCallback(
    async (params?: DoctorQueryParams) => {
      try {
        const result = await doctorsApi.execute(() =>
          ApiService.getDoctors(
            params?.latitude,
            params?.longitude,
            params?.specialization,
            params?.radiusKm
          )
        );
        if (result) {
          setDoctors(result);
        }
      } catch (err) {
        // Error already handled by useApi
      }
    },
    [doctorsApi]
  );

  const fetchDoctorById = useCallback(
    async (id: string) => {
      try {
        return await doctorByIdApi.execute(() => ApiService.getDoctorById(id));
      } catch (err) {
        return null;
      }
    },
    [doctorByIdApi]
  );

  const searchDoctors = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase());
  }, []);

  const filterBySpecialty = useCallback((selectedSpecialty: SpecialtyType | null) => {
    setSpecialty(selectedSpecialty);
  }, []);

  const filterDoctors = useCallback(() => {
    let filtered = [...doctors];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchQuery) ||
          doctor.specialization.toLowerCase().includes(searchQuery) ||
          doctor.about?.toLowerCase().includes(searchQuery) ||
          doctor.location.address.toLowerCase().includes(searchQuery)
      );
    }

    // Filter by specialty
    if (specialty && specialty !== 'all') {
      filtered = filtered.filter(
        (doctor) => doctor.specialization.toLowerCase() === specialty.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, specialty]);

  const refreshDoctors = useCallback(
    async (params?: DoctorQueryParams) => {
      await fetchDoctors(params);
    },
    [fetchDoctors]
  );

  return {
    doctors: filteredDoctors,
    allDoctors: doctors,
    loading: doctorsApi.loading,
    error: doctorsApi.error,
    searchQuery,
    specialty,
    fetchDoctors,
    fetchDoctorById,
    searchDoctors,
    filterBySpecialty,
    refreshDoctors,
    reset: doctorsApi.reset,
  };
}

/**
 * Hook for fetching lightweight doctor map markers
 * Optimized for map view with minimal data
 */
export function useDoctorsMap(options: UseDoctorsOptions = {}) {
  const [mapDoctors, setMapDoctors] = useState<DoctorMapDto[]>([]);
  const mapApi = useApi<DoctorMapDto[]>();

  useEffect(() => {
    if (options.autoFetch) {
      fetchMapDoctors(options.initialParams);
    }
  }, []);

  const fetchMapDoctors = useCallback(
    async (params?: DoctorQueryParams) => {
      try {
        const result = await mapApi.execute(() =>
          ApiService.getDoctorsMap(
            params?.latitude,
            params?.longitude,
            params?.specialization,
            params?.radiusKm
          )
        );
        if (result) {
          setMapDoctors(result);
        }
      } catch (err) {
        // Error already handled by useApi
      }
    },
    [mapApi]
  );

  return {
    mapDoctors,
    loading: mapApi.loading,
    error: mapApi.error,
    fetchMapDoctors,
    reset: mapApi.reset,
  };
}

/**
 * Hook for nearby doctors based on user location
 */
export function useNearbyDoctors(
  userLocation: { latitude: number; longitude: number } | null,
  radiusKm: number = 25
) {
  const { doctors, loading, error, fetchDoctors } = useDoctors();

  useEffect(() => {
    if (userLocation) {
      fetchDoctors({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm,
      });
    }
  }, [userLocation?.latitude, userLocation?.longitude, radiusKm]);

  return {
    nearbyDoctors: doctors,
    loading,
    error,
    refresh: () =>
      userLocation &&
      fetchDoctors({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm,
      }),
  };
}
