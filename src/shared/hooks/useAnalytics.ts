/**
 * useAnalytics Hook
 * 
 * Convenient hook for tracking analytics events with type-safe helpers
 */

import { useAnalytics as useAnalyticsContext } from '../../context/AnalyticsContext';
import {
  EventName,
  AuthenticationEventProperties,
  SearchEventProperties,
  DoctorEventProperties,
  ProfileEventProperties,
  ErrorEventProperties,
} from '../types/analytics.types';

export const useAnalytics = () => {
  const analytics = useAnalyticsContext();

  // ==========================================================================
  // Authentication Events
  // ==========================================================================

  const trackLogin = (method: 'email' | 'google' | 'facebook' | 'apple', userType: 'doctor' | 'patient', success: boolean, errorMessage?: string) => {
    analytics.trackEvent(success ? EventName.LOGIN_SUCCESS : EventName.LOGIN_FAILED, {
      method,
      userType,
      success,
      errorMessage,
    } as AuthenticationEventProperties);
  };

  const trackRegister = (method: 'email' | 'google' | 'facebook' | 'apple', userType: 'doctor' | 'patient', success: boolean, errorMessage?: string) => {
    analytics.trackEvent(success ? EventName.REGISTER_SUCCESS : EventName.REGISTER_FAILED, {
      method,
      userType,
      success,
      errorMessage,
    } as AuthenticationEventProperties);
  };

  const trackLogout = () => {
    analytics.trackEvent(EventName.LOGOUT);
  };

  const trackPasswordReset = () => {
    analytics.trackEvent(EventName.PASSWORD_RESET_REQUEST);
  };

  // ==========================================================================
  // Search Events
  // ==========================================================================

  const trackSearch = (query: string, resultsCount?: number, filters?: SearchEventProperties['filters']) => {
    analytics.trackEvent(EventName.SEARCH_PERFORMED, {
      query,
      resultsCount,
      filters,
    } as SearchEventProperties);
  };

  const trackFilterApplied = (filters: SearchEventProperties['filters']) => {
    analytics.trackEvent(EventName.FILTER_APPLIED, {
      query: '',
      filters,
    } as SearchEventProperties);
  };

  const trackFilterCleared = () => {
    analytics.trackEvent(EventName.FILTER_CLEARED);
  };

  // ==========================================================================
  // Doctor Events
  // ==========================================================================

  const trackDoctorViewed = (doctorId: string, doctorName?: string, specialty?: string, source?: 'search' | 'nearby' | 'favorite' | 'profile') => {
    analytics.trackEvent(EventName.DOCTOR_VIEWED, {
      doctorId,
      doctorName,
      specialty,
      source,
    } as DoctorEventProperties);
  };

  const trackDoctorCall = (doctorId: string, doctorName?: string) => {
    analytics.trackEvent(EventName.DOCTOR_CALL, {
      doctorId,
      doctorName,
    } as DoctorEventProperties);
  };

  const trackDoctorMessage = (doctorId: string, doctorName?: string) => {
    analytics.trackEvent(EventName.DOCTOR_MESSAGE, {
      doctorId,
      doctorName,
    } as DoctorEventProperties);
  };

  const trackDoctorFavorite = (doctorId: string, isFavorite: boolean, doctorName?: string) => {
    analytics.trackEvent(isFavorite ? EventName.DOCTOR_FAVORITE : EventName.DOCTOR_UNFAVORITE, {
      doctorId,
      doctorName,
    } as DoctorEventProperties);
  };

  // ==========================================================================
  // Profile Events
  // ==========================================================================

  const trackProfileViewed = () => {
    analytics.trackEvent(EventName.PROFILE_VIEWED);
  };

  const trackProfileUpdated = (fieldsUpdated?: string[]) => {
    analytics.trackEvent(EventName.PROFILE_UPDATED, {
      fieldsUpdated,
    } as ProfileEventProperties);
  };

  const trackProfilePhotoUpdated = (photoSize?: number) => {
    analytics.trackEvent(EventName.PROFILE_PHOTO_UPDATED, {
      photoSize,
    } as ProfileEventProperties);
  };

  // ==========================================================================
  // Error Events
  // ==========================================================================

  const trackError = (errorType: 'api' | 'network' | 'validation' | 'unknown', errorMessage: string, errorCode?: string | number, endpoint?: string) => {
    analytics.trackEvent(EventName.API_ERROR, {
      errorType,
      errorMessage,
      errorCode,
      endpoint,
    } as ErrorEventProperties);
  };

  // ==========================================================================
  // Screen Tracking
  // ==========================================================================

  const trackScreenView = (screenName: string, params?: Record<string, any>) => {
    analytics.trackScreen(screenName, {
      navigationParams: params,
    });
  };

  // ==========================================================================
  // Return all methods
  // ==========================================================================

  return {
    // Core analytics methods
    ...analytics,

    // Convenience methods
    trackLogin,
    trackRegister,
    trackLogout,
    trackPasswordReset,
    trackSearch,
    trackFilterApplied,
    trackFilterCleared,
    trackDoctorViewed,
    trackDoctorCall,
    trackDoctorMessage,
    trackDoctorFavorite,
    trackProfileViewed,
    trackProfileUpdated,
    trackProfilePhotoUpdated,
    trackError,
    trackScreenView,
  };
};

export default useAnalytics;
