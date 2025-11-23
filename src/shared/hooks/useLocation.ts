// src/shared/hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { logError } from '../utils/errorHandler';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface UseLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

/**
 * Custom hook for location services
 * Handles permissions, GPS tracking, and address geocoding
 * 
 * @example
 * const { location, loading, hasPermission, requestPermission } = useLocation();
 * 
 * useEffect(() => {
 *   if (!hasPermission) {
 *     requestPermission();
 *   }
 * }, [hasPermission]);
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Try to get address from coordinates (reverse geocoding)
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          userLocation.address = [addr.street, addr.streetNumber, addr.name]
            .filter(Boolean)
            .join(' ');
          userLocation.city = addr.city || addr.region || undefined;
        }
      } catch (geocodeErr) {
        // Geocoding failed, but we still have coordinates
        logError(geocodeErr as Error, 'useLocation.reverseGeocode');
      }

      setLocation(userLocation);
      setLoading(false);
    } catch (err) {
      const message = 'Failed to get current location';
      setError(message);
      setLoading(false);
      logError(err as Error, 'useLocation.getCurrentLocation');
    }
  }, []);

  const checkPermissionAndGetLocation = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);

    if (granted) {
      await getCurrentLocation();
    }
  }, [getCurrentLocation]);

  useEffect(() => {
    checkPermissionAndGetLocation();
  }, [checkPermissionAndGetLocation]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        await getCurrentLocation();
        return true;
      } else {
        setError('Location permission denied');
        return false;
      }
    } catch (err) {
      const message = 'Failed to request location permission';
      setError(message);
      logError(err as Error, 'useLocation.requestPermission');
      return false;
    }
  }, [getCurrentLocation]);

  

  const refreshLocation = useCallback(async () => {
    if (hasPermission) {
      await getCurrentLocation();
    } else {
      await requestPermission();
    }
  }, [hasPermission, requestPermission, getCurrentLocation]);

  return {
    location,
    loading,
    error,
    hasPermission,
    requestPermission,
    refreshLocation,
  };
}

/**
 * Hook for converting address to coordinates (geocoding)
 */
export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<UserLocation | null> => {
    try {
      setLoading(true);
      setError(null);

      const locations = await Location.geocodeAsync(address);

      if (locations && locations.length > 0) {
        const loc = locations[0];
        setLoading(false);
        return {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address,
        };
      }

      setError('Address not found');
      setLoading(false);
      return null;
    } catch (err) {
      const message = 'Failed to geocode address';
      setError(message);
      setLoading(false);
      logError(err as Error, 'useGeocoding.geocodeAddress');
      return null;
    }
  }, []);

  return {
    geocodeAddress,
    loading,
    error,
  };
}
