/**
 * Analytics Service
 * 
 * Core analytics service for tracking events, user properties, and screen views
 * Supports multiple analytics providers and privacy-focused implementation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsState,
  EventName,
  EventCategory,
  EventProperties,
  UserProperties,
  ScreenViewProperties,
} from '../types/analytics.types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  debug: __DEV__,
  
  batchSize: 20,
  batchInterval: 30000, // 30 seconds
  
  anonymizeIp: true,
  respectDoNotTrack: true,
  
  providers: {
    // Configure your analytics providers here
    googleAnalytics: {
      enabled: false,
      trackingId: '',
    },
    mixpanel: {
      enabled: false,
      token: '',
    },
    amplitude: {
      enabled: false,
      apiKey: '',
    },
    custom: {
      enabled: __DEV__, // Log to console in development
      endpoint: '',
    },
  },
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  SESSION_ID: '@analytics_session_id',
  USER_ID: '@analytics_user_id',
  USER_PROPERTIES: '@analytics_user_properties',
  EVENT_QUEUE: '@analytics_event_queue',
  ENABLED: '@analytics_enabled',
};

// ============================================================================
// Analytics Service Class
// ============================================================================

class AnalyticsService {
  private config: AnalyticsConfig = DEFAULT_CONFIG;
  private state: AnalyticsState = {
    initialized: false,
    sessionId: null,
    userId: null,
    userProperties: {},
    eventQueue: [],
    lastEventTimestamp: 0,
  };
  
  private flushTimer: NodeJS.Timeout | null = null;
  private currentScreen: string | null = null;
  private sessionStartTime: number = Date.now();

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      // Merge custom config
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Check if analytics is enabled
      const enabled = await this.loadEnabled();
      this.config.enabled = enabled;

      if (!this.config.enabled) {
        console.log('[Analytics] Analytics disabled by user preference');
        return;
      }

      // Load persisted state
      await this.loadState();

      // Generate or restore session ID
      await this.initializeSession();

      // Start flush timer
      this.startFlushTimer();

      this.state.initialized = true;

      // Track app launch
      this.trackEvent(EventName.APP_LAUNCH, {
        platform: Platform.OS as 'ios' | 'android',
        appVersion: '1.0.0',
      });

      if (this.config.debug) {
        console.log('[Analytics] Initialized successfully', this.state);
      }
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  private async loadState(): Promise<void> {
    try {
      const [userId, userProperties, eventQueue] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROPERTIES),
        AsyncStorage.getItem(STORAGE_KEYS.EVENT_QUEUE),
      ]);

      if (userId) {
        this.state.userId = userId;
      }

      if (userProperties) {
        this.state.userProperties = JSON.parse(userProperties);
      }

      if (eventQueue) {
        this.state.eventQueue = JSON.parse(eventQueue);
      }
    } catch (error) {
      console.error('[Analytics] Failed to load state:', error);
    }
  }

  private async loadEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED);
      return enabled !== 'false'; // Default to true
    } catch {
      return true;
    }
  }

  private async initializeSession(): Promise<void> {
    try {
      const existingSessionId = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
      
      // Check if session expired (30 minutes)
      const now = Date.now();
      const sessionExpired = now - this.state.lastEventTimestamp > 30 * 60 * 1000;

      if (!existingSessionId || sessionExpired) {
        // Generate new session ID
        this.state.sessionId = this.generateSessionId();
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.state.sessionId);
        this.sessionStartTime = now;
      } else {
        this.state.sessionId = existingSessionId;
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize session:', error);
      this.state.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // ==========================================================================
  // Event Tracking
  // ==========================================================================

  trackEvent(name: EventName | string, properties?: EventProperties): void {
    if (!this.config.enabled || !this.state.initialized) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        name,
        category: this.getCategoryForEvent(name),
        properties: {
          ...properties,
          platform: Platform.OS as 'ios' | 'android',
          appVersion: '1.0.0',
        },
        timestamp: Date.now(),
        userId: this.state.userId || undefined,
        sessionId: this.state.sessionId!,
      };

      // Add to queue
      this.state.eventQueue.push(event);
      this.state.lastEventTimestamp = event.timestamp;

      if (this.config.debug) {
        console.log('[Analytics] Event tracked:', event);
      }

      // Persist queue
      this.persistEventQueue();

      // Flush if batch size reached
      if (this.state.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  trackScreen(screenName: string, properties?: Partial<ScreenViewProperties>): void {
    const previousScreen = this.currentScreen;
    this.currentScreen = screenName;

    this.trackEvent(EventName.SCREEN_VIEW, {
      screenName,
      previousScreen: previousScreen || undefined,
      ...properties,
    });
  }

  private getCategoryForEvent(eventName: string): EventCategory {
    if (eventName.includes('login') || eventName.includes('register') || eventName.includes('logout')) {
      return EventCategory.AUTHENTICATION;
    }
    if (eventName.includes('doctor')) {
      return EventCategory.DOCTOR;
    }
    if (eventName.includes('search') || eventName.includes('filter')) {
      return EventCategory.SEARCH;
    }
    if (eventName.includes('screen') || eventName.includes('navigation')) {
      return EventCategory.NAVIGATION;
    }
    if (eventName.includes('profile')) {
      return EventCategory.PROFILE;
    }
    if (eventName.includes('error')) {
      return EventCategory.ERROR;
    }
    return EventCategory.USER;
  }

  // ==========================================================================
  // User Properties
  // ==========================================================================

  async setUserId(userId: string): Promise<void> {
    try {
      this.state.userId = userId;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);

      if (this.config.debug) {
        console.log('[Analytics] User ID set:', userId);
      }
    } catch (error) {
      console.error('[Analytics] Failed to set user ID:', error);
    }
  }

  async setUserProperties(properties: Partial<UserProperties>): Promise<void> {
    try {
      this.state.userProperties = {
        ...this.state.userProperties,
        ...properties,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(this.state.userProperties)
      );

      if (this.config.debug) {
        console.log('[Analytics] User properties updated:', this.state.userProperties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  async clearUser(): Promise<void> {
    try {
      this.state.userId = null;
      this.state.userProperties = {};

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PROPERTIES),
      ]);

      if (this.config.debug) {
        console.log('[Analytics] User data cleared');
      }
    } catch (error) {
      console.error('[Analytics] Failed to clear user:', error);
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  async startSession(): Promise<void> {
    await this.initializeSession();
    this.sessionStartTime = Date.now();

    if (this.config.debug) {
      console.log('[Analytics] Session started:', this.state.sessionId);
    }
  }

  async endSession(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStartTime;

    this.trackEvent('session_end', {
      timestamp: Date.now(),
      sessionId: this.state.sessionId!,
      platform: Platform.OS as 'ios' | 'android',
    } as EventProperties);

    await this.flush();

    // Clear session
    this.state.sessionId = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_ID);

    if (this.config.debug) {
      console.log('[Analytics] Session ended. Duration:', sessionDuration);
    }
  }

  // ==========================================================================
  // Flushing & Persistence
  // ==========================================================================

  async flush(): Promise<void> {
    if (this.state.eventQueue.length === 0) {
      return;
    }

    try {
      const eventsToSend = [...this.state.eventQueue];
      this.state.eventQueue = [];

      if (this.config.debug) {
        console.log(`[Analytics] Flushing ${eventsToSend.length} events`);
      }

      // Send to providers
      await Promise.all([
        this.sendToCustomProvider(eventsToSend),
        // Add other providers here
        // this.sendToGoogleAnalytics(eventsToSend),
        // this.sendToMixpanel(eventsToSend),
      ]);

      // Clear persisted queue
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENT_QUEUE);
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-queue events on failure
      this.state.eventQueue = [...this.state.eventQueue];
    }
  }

  private async persistEventQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EVENT_QUEUE,
        JSON.stringify(this.state.eventQueue)
      );
    } catch (error) {
      console.error('[Analytics] Failed to persist event queue:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.batchInterval);
  }

  // ==========================================================================
  // Provider Integrations
  // ==========================================================================

  private async sendToCustomProvider(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.providers.custom?.enabled) {
      return;
    }

    if (this.config.debug) {
      console.log('[Analytics] Events:', events);
      return;
    }

    // Send to custom backend endpoint
    if (this.config.providers.custom.endpoint) {
      try {
        await fetch(this.config.providers.custom.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events,
            userProperties: this.state.userProperties,
            deviceInfo: await this.getDeviceInfo(),
          }),
        });
      } catch (error) {
        console.error('[Analytics] Failed to send to custom provider:', error);
      }
    }
  }

  private async getDeviceInfo(): Promise<Record<string, any>> {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
    };
  }

  // ==========================================================================
  // Control Methods
  // ==========================================================================

  async enable(): Promise<void> {
    this.config.enabled = true;
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, 'true');

    if (!this.state.initialized) {
      await this.initialize();
    }

    if (this.config.debug) {
      console.log('[Analytics] Enabled');
    }
  }

  async disable(): Promise<void> {
    this.config.enabled = false;
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, 'false');

    // Flush remaining events
    await this.flush();

    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.config.debug) {
      console.log('[Analytics] Disabled');
    }
  }

  getState(): AnalyticsState {
    return { ...this.state };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  getCurrentScreen(): string | null {
    return this.currentScreen;
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const analyticsService = new AnalyticsService();
export default analyticsService;
