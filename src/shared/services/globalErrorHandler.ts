/**
 * Global Error Handler
 * 
 * Catches unhandled promise rejections and global errors
 */

import { ErrorSeverity, errorLoggingService } from './errorLoggingService';

// ============================================================================
// Global Error Handler Setup
// ============================================================================

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize error logging service
      await errorLoggingService.initialize();

      // Set up global error handlers
      this.setupUnhandledPromiseRejectionHandler();
      this.setupGlobalErrorHandler();

      this.initialized = true;
      console.log('[GlobalErrorHandler] Initialized successfully');
    } catch (error) {
      console.error('[GlobalErrorHandler] Initialization failed:', error);
    }
  }

  // ==========================================================================
  // Unhandled Promise Rejection Handler
  // ==========================================================================

  private setupUnhandledPromiseRejectionHandler(): void {
    // React Native doesn't have window.addEventListener
    // Promise rejections are handled by ErrorUtils in React Native
    // Additional tracking can be done via promise/setimmediate/rejection-tracking
    
    // Override the default promise rejection tracker
    const originalHandler = global.Promise;
    if (originalHandler && typeof originalHandler === 'function') {
      // Track unhandled rejections
      const rejectionTracker = new Set<Promise<any>>();
      
      const trackRejection = (promise: Promise<any>, reason: any) => {
        rejectionTracker.add(promise);
        
        // Wait to see if it gets handled
        setTimeout(() => {
          if (rejectionTracker.has(promise)) {
            const error = reason instanceof Error 
              ? reason 
              : new Error(String(reason));

            errorLoggingService.logError(
              error,
              ErrorSeverity.ERROR,
              {
                action: 'unhandled_promise_rejection',
              },
              false
            );

            console.error('[GlobalErrorHandler] Unhandled promise rejection:', error);
          }
        }, 100);
      };

      console.log('[GlobalErrorHandler] Unhandled promise rejection handler set up');
    }
  }

  // ==========================================================================
  // Global Error Handler
  // ==========================================================================

  private setupGlobalErrorHandler(): void {
    // Set up ErrorUtils (React Native specific)
    if (typeof ErrorUtils !== 'undefined') {
      const originalGlobalHandler = ErrorUtils.getGlobalHandler();

      ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          isFatal ? ErrorSeverity.FATAL : ErrorSeverity.ERROR,
          {
            action: 'global_error',
            extra: { isFatal },
          },
          false
        );

        // Call original handler
        if (originalGlobalHandler) {
          originalGlobalHandler(error, isFatal);
        }

        console.warn('[GlobalErrorHandler] Global error caught:', error.message);
      });

      console.log('[GlobalErrorHandler] React Native ErrorUtils handler set up');
    }

    console.log('[GlobalErrorHandler] Global error handler set up');
  }

  // ==========================================================================
  // Manual Error Reporting
  // ==========================================================================

  reportError(error: Error, severity: ErrorSeverity = ErrorSeverity.ERROR): void {
    errorLoggingService.logError(error, severity, undefined, true);
  }

  reportWarning(message: string): void {
    errorLoggingService.logWarning(message);
  }

  reportInfo(message: string): void {
    errorLoggingService.logInfo(message);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const globalErrorHandler = GlobalErrorHandler.getInstance();
export default globalErrorHandler;
