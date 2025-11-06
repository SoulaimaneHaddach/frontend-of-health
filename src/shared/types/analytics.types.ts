

export enum EventCategory {
  USER = 'user',
  DOCTOR = 'doctor',
  SEARCH = 'search',
  NAVIGATION = 'navigation',
  AUTHENTICATION = 'authentication',
  PROFILE = 'profile',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

export enum EventName {
  // Authentication Events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  REGISTER_SUCCESS = 'register_success',
  REGISTER_FAILED = 'register_failed',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  
  // Navigation Events
  SCREEN_VIEW = 'screen_view',
  TAB_CHANGE = 'tab_change',
  BACK_NAVIGATION = 'back_navigation',
  
  // Search Events
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULTS = 'search_results',
  FILTER_APPLIED = 'filter_applied',
  FILTER_CLEARED = 'filter_cleared',
  
  // Doctor Events
  DOCTOR_VIEWED = 'doctor_viewed',
  DOCTOR_CALL = 'doctor_call',
  DOCTOR_MESSAGE = 'doctor_message',
  DOCTOR_FAVORITE = 'doctor_favorite',
  DOCTOR_UNFAVORITE = 'doctor_unfavorite',
  
  // Profile Events
  PROFILE_VIEWED = 'profile_viewed',
  PROFILE_UPDATED = 'profile_updated',
  PROFILE_PHOTO_UPDATED = 'profile_photo_updated',
  
  // Error Events
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  
  // Performance Events
  APP_LAUNCH = 'app_launch',
  APP_CRASH = 'app_crash',
  SLOW_RENDER = 'slow_render',
}

export interface BaseEventProperties {
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  platform?: 'ios' | 'android' | 'web';
  appVersion?: string;
}

export interface ScreenViewProperties extends BaseEventProperties {
  screenName: string;
  previousScreen?: string;
  navigationParams?: Record<string, any>;
}

export interface AuthenticationEventProperties extends BaseEventProperties {
  method: 'email' | 'google' | 'facebook' | 'apple';
  userType: 'doctor' | 'patient';
  success: boolean;
  errorMessage?: string;
}

export interface SearchEventProperties extends BaseEventProperties {
  query: string;
  filters?: {
    specialty?: string;
    location?: string;
    radius?: number;
  };
  resultsCount?: number;
  loadTime?: number;
}

export interface DoctorEventProperties extends BaseEventProperties {
  doctorId: string;
  doctorName?: string;
  specialty?: string;
  distance?: number;
  source?: 'search' | 'nearby' | 'favorite' | 'profile';
}

export interface ProfileEventProperties extends BaseEventProperties {
  fieldsUpdated?: string[];
  photoSize?: number;
}

export interface ErrorEventProperties extends BaseEventProperties {
  errorType: 'api' | 'network' | 'validation' | 'unknown';
  errorMessage: string;
  errorCode?: string | number;
  endpoint?: string;
  stackTrace?: string;
}

export interface PerformanceEventProperties extends BaseEventProperties {
  metric: 'render_time' | 'api_response_time' | 'app_launch_time';
  value: number;
  threshold?: number;
}

export type EventProperties =
  | ScreenViewProperties
  | AuthenticationEventProperties
  | SearchEventProperties
  | DoctorEventProperties
  | ProfileEventProperties
  | ErrorEventProperties
  | PerformanceEventProperties
  | BaseEventProperties;


export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  userType?: 'doctor' | 'patient';
  
  // Doctor-specific properties
  specialty?: string;
  experienceYears?: number;
  
  // App usage properties
  firstLoginDate?: string;
  lastLoginDate?: string;
  totalSessions?: number;
  totalSearches?: number;
  
  // Location properties
  city?: string;
  country?: string;
  
  // Device properties
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface AnalyticsEvent {
  name: EventName | string;
  category: EventCategory;
  properties?: EventProperties;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  
  // Event batching
  batchSize: number;
  batchInterval: number;
  
  // Privacy
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
  
  // Providers
  providers: {
    googleAnalytics?: {
      enabled: boolean;
      trackingId: string;
    };
    mixpanel?: {
      enabled: boolean;
      token: string;
    };
    amplitude?: {
      enabled: boolean;
      apiKey: string;
    };
    custom?: {
      enabled: boolean;
      endpoint: string;
    };
  };
}

export interface AnalyticsState {
  initialized: boolean;
  sessionId: string | null;
  userId: string | null;
  userProperties: UserProperties;
  eventQueue: AnalyticsEvent[];
  lastEventTimestamp: number;
}

export interface AnalyticsContextValue {
  // State
  state: AnalyticsState;
  
  // Event tracking
  trackEvent: (name: EventName | string, properties?: EventProperties) => void;
  trackScreen: (screenName: string, properties?: Partial<ScreenViewProperties>) => void;
  
  // User properties
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Partial<UserProperties>) => void;
  clearUser: () => void;
  
  // Session management
  startSession: () => void;
  endSession: () => void;
  
  // Control
  enable: () => void;
  disable: () => void;
  flush: () => Promise<void>;
}
