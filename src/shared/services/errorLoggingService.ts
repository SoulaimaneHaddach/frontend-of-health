/**
 * Error Logging Service
 * 
 * Centralized error logging with context, breadcrumbs, and device info
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analyticsService from './analyticsService';

// ============================================================================
// Types
// ============================================================================

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userType?: 'doctor' | 'patient';
  screen?: string;
  action?: string;
  extra?: Record<string, any>;
}

export interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'network' | 'ui' | 'system';
  message: string;
  data?: Record<string, any>;
  level?: ErrorSeverity;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  platformVersion: string | number;
  appVersion: string;
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  breadcrumbs: Breadcrumb[];
  deviceInfo: DeviceInfo;
  handled: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const MAX_BREADCRUMBS = 50;
const MAX_STORED_ERRORS = 100;
const STORAGE_KEY = '@error_logs';

// ============================================================================
// Error Logging Service
// ============================================================================

class ErrorLoggingService {
  private breadcrumbs: Breadcrumb[] = [];
  private context: ErrorContext = {};
  private deviceInfo: DeviceInfo;
  private initialized: boolean = false;

  constructor() {
    this.deviceInfo = this.collectDeviceInfo();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load persisted breadcrumbs
      await this.loadBreadcrumbs();
      
      this.initialized = true;
      console.log('[ErrorLogging] Initialized successfully');
    } catch (error) {
      console.error('[ErrorLogging] Initialization failed:', error);
    }
  }

  // ==========================================================================
  // Context Management
  // ==========================================================================

  setContext(context: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...context };
  }

  setUser(userId: string, email?: string, userType?: 'doctor' | 'patient'): void {
    this.context = {
      ...this.context,
      userId,
      userEmail: email,
      userType,
    };
  }

  clearUser(): void {
    this.context = {
      ...this.context,
      userId: undefined,
      userEmail: undefined,
      userType: undefined,
    };
  }

  setScreen(screen: string): void {
    this.context = { ...this.context, screen };
    this.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${screen}`,
    });
  }

  // ==========================================================================
  // Breadcrumbs
  // ==========================================================================

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
      level: breadcrumb.level || ErrorSeverity.INFO,
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only last MAX_BREADCRUMBS
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-MAX_BREADCRUMBS);
    }

    // Persist breadcrumbs
    this.persistBreadcrumbs();
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
    AsyncStorage.removeItem(`${STORAGE_KEY}_breadcrumbs`);
  }

  private async loadBreadcrumbs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_breadcrumbs`);
      if (stored) {
        this.breadcrumbs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ErrorLogging] Failed to load breadcrumbs:', error);
    }
  }

  private async persistBreadcrumbs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_breadcrumbs`,
        JSON.stringify(this.breadcrumbs)
      );
    } catch (error) {
      console.error('[ErrorLogging] Failed to persist breadcrumbs:', error);
    }
  }

  // ==========================================================================
  // Error Logging
  // ==========================================================================

  logError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Partial<ErrorContext>,
    handled: boolean = true
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      severity,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: { ...this.context, ...context },
      breadcrumbs: [...this.breadcrumbs],
      deviceInfo: this.deviceInfo,
      handled,
    };

    // Log to console in development
    if (__DEV__) {
      this.logToConsole(errorReport);
    }

    // Store error locally
    this.storeError(errorReport);

    // Track in analytics
    this.trackErrorInAnalytics(errorReport);

    // Send to remote service (if configured)
    this.sendToRemote(errorReport);

    // Add breadcrumb
    this.addBreadcrumb({
      category: 'system',
      message: `${severity.toUpperCase()}: ${error.message}`,
      level: severity,
      data: { errorId: errorReport.id },
    });
  }

  logWarning(message: string, context?: Partial<ErrorContext>): void {
    const error = new Error(message);
    this.logError(error, ErrorSeverity.WARNING, context, true);
  }

  logInfo(message: string, context?: Partial<ErrorContext>): void {
    const error = new Error(message);
    this.logError(error, ErrorSeverity.INFO, context, true);
  }

  // ==========================================================================
  // Device Info
  // ==========================================================================

  private collectDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS as 'ios' | 'android' | 'web',
      platformVersion: Platform.Version,
      appVersion: '1.0.0', // Get from app.json or Constants
    };
  }

  // ==========================================================================
  // Storage
  // ==========================================================================

  private async storeError(errorReport: ErrorReport): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let errors: ErrorReport[] = stored ? JSON.parse(stored) : [];

      errors.push(errorReport);

      // Keep only last MAX_STORED_ERRORS
      if (errors.length > MAX_STORED_ERRORS) {
        errors = errors.slice(-MAX_STORED_ERRORS);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
    } catch (error) {
      console.error('[ErrorLogging] Failed to store error:', error);
    }
  }

  async getStoredErrors(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[ErrorLogging] Failed to get stored errors:', error);
      return [];
    }
  }

  async clearStoredErrors(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[ErrorLogging] Failed to clear stored errors:', error);
    }
  }

  // ==========================================================================
  // Console Logging
  // ==========================================================================

  private logToConsole(errorReport: ErrorReport): void {
    const severityEmoji = {
      [ErrorSeverity.DEBUG]: '🐛',
      [ErrorSeverity.INFO]: 'ℹ️',
      [ErrorSeverity.WARNING]: '⚠️',
      [ErrorSeverity.ERROR]: '❌',
      [ErrorSeverity.FATAL]: '💀',
    };

    console.group(
      `${severityEmoji[errorReport.severity]} ${errorReport.severity.toUpperCase()}: ${errorReport.error.name}`
    );
    console.log('Message:', errorReport.error.message);
    console.log('Error ID:', errorReport.id);
    console.log('Context:', errorReport.context);
    console.log('Timestamp:', new Date(errorReport.timestamp).toISOString());
    
    if (errorReport.error.stack) {
      console.log('Stack:', errorReport.error.stack);
    }
    
    if (errorReport.breadcrumbs.length > 0) {
      console.log('Recent Breadcrumbs:', errorReport.breadcrumbs.slice(-5));
    }
    
    console.groupEnd();
  }

  // ==========================================================================
  // Analytics Integration
  // ==========================================================================

  private trackErrorInAnalytics(errorReport: ErrorReport): void {
    try {
      analyticsService.trackEvent('app_error', {
        errorId: errorReport.id,
        severity: errorReport.severity,
        errorName: errorReport.error.name,
        errorMessage: errorReport.error.message,
        screen: errorReport.context.screen,
        handled: errorReport.handled,
      } as any);
    } catch (error) {
      console.error('[ErrorLogging] Failed to track error in analytics:', error);
    }
  }

  // ==========================================================================
  // Remote Service Integration
  // ==========================================================================

  private async sendToRemote(errorReport: ErrorReport): Promise<void> {
    // Implement integration with error tracking service (e.g., Sentry, Bugsnag)
    // For now, just log in development
    if (__DEV__) {
      console.log('[ErrorLogging] Would send to remote:', errorReport.id);
    }

    // Example Sentry integration:
    // Sentry.captureException(new Error(errorReport.error.message), {
    //   level: errorReport.severity,
    //   contexts: {
    //     user: {
    //       id: errorReport.context.userId,
    //       email: errorReport.context.userEmail,
    //     },
    //     device: errorReport.deviceInfo,
    //   },
    //   extra: errorReport.context.extra,
    // });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  getContext(): ErrorContext {
    return { ...this.context };
  }

  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const errorLoggingService = new ErrorLoggingService();
export default errorLoggingService;
