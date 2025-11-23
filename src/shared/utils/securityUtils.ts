// src/shared/utils/securityUtils.ts
/**
 * Security utilities and helpers
 */

import { SECURITY_CONFIG, validatePassword, validateEmail } from '../config/security.config';

/**
 * Session timeout manager
 */
class SessionManager {
  private lastActivityTime: number = Date.now();
  private sessionTimer: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;

  /**
   * Initialize session timeout
   */
  init(onExpired: () => void): void {
    this.onSessionExpired = onExpired;
    this.resetTimer();
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivityTime = Date.now();
    this.resetTimer();
  }

  /**
   * Reset session timeout timer
   */
  private resetTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    }, SECURITY_CONFIG.session.timeout);
  }

  /**
   * Clear session
   */
  clear(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Get remaining session time (in milliseconds)
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = SECURITY_CONFIG.session.timeout - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.getRemainingTime() > 0;
  }
}

export const sessionManager = new SessionManager();

/**
 * Login attempt tracker for rate limiting
 */
class LoginAttemptTracker {
  private attempts: Map<string, { count: number; lockedUntil: number }> = new Map();

  /**
   * Record failed login attempt
   */
  recordFailure(identifier: string): void {
    const current = this.attempts.get(identifier) || { count: 0, lockedUntil: 0 };
    current.count += 1;

    if (current.count >= SECURITY_CONFIG.session.maxLoginAttempts) {
      current.lockedUntil = Date.now() + SECURITY_CONFIG.session.lockoutDuration;
    }

    this.attempts.set(identifier, current);
  }

  /**
   * Reset login attempts on successful login
   */
  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Check if account is locked
   */
  isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    if (record.lockedUntil > Date.now()) {
      return true;
    }

    // Lockout period expired, reset
    if (record.lockedUntil > 0) {
      this.attempts.delete(identifier);
    }

    return false;
  }

  /**
   * Get remaining lockout time (in milliseconds)
   */
  getRemainingLockoutTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.lockedUntil === 0) return 0;

    const remaining = record.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get number of failed attempts
   */
  getAttemptCount(identifier: string): number {
    return this.attempts.get(identifier)?.count || 0;
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const count = this.getAttemptCount(identifier);
    return Math.max(0, SECURITY_CONFIG.session.maxLoginAttempts - count);
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();

/**
 * Input sanitization utilities
 */
export const sanitizeInput = {
  /**
   * Remove HTML tags from string
   */
  stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape special characters for SQL (basic)
   */
  escapeSql(input: string): string {
    return input.replace(/['";\\]/g, '\\$&');
  },

  /**
   * Sanitize user input for display
   */
  sanitizeText(input: string): string {
    return this.stripHtml(input).trim();
  },

  /**
   * Validate and sanitize URL
   */
  sanitizeUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }
      return urlObj.toString();
    } catch {
      return null;
    }
  },
};

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private requestCounts: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint: string): boolean {
    if (!SECURITY_CONFIG.rateLimit.enabled) return true;

    const now = Date.now();
    const requests = this.requestCounts.get(endpoint) || [];

    // Remove requests older than 1 minute
    const recentRequests = requests.filter(timestamp => now - timestamp < 60000);

    if (recentRequests.length >= SECURITY_CONFIG.rateLimit.maxRequestsPerMinute) {
      return false;
    }

    recentRequests.push(now);
    this.requestCounts.set(endpoint, recentRequests);
    return true;
  }

  /**
   * Get remaining requests for endpoint
   */
  getRemainingRequests(endpoint: string): number {
    const now = Date.now();
    const requests = this.requestCounts.get(endpoint) || [];
    const recentRequests = requests.filter(timestamp => now - timestamp < 60000);

    return Math.max(
      0,
      SECURITY_CONFIG.rateLimit.maxRequestsPerMinute - recentRequests.length
    );
  }

  /**
   * Reset rate limit for endpoint
   */
  reset(endpoint: string): void {
    this.requestCounts.delete(endpoint);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requestCounts.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Form validation utilities
 */
export const validateForm = {
  /**
   * Validate registration form
   */
  registration(data: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate email
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    // Validate password
    if (!data.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate login form
   */
  login(data: {
    email: string;
    password: string;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Secure string comparison (timing-safe)
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Generate a secure session ID
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
};

/**
 * Check if app is running in debug mode
 */
export const isDebugMode = (): boolean => {
  return __DEV__;
};

/**
 * Mask sensitive data for display
 */
export const maskSensitiveData = {
  /**
   * Mask email address
   */
  email(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;

    const maskedUsername =
      username.length > 3
        ? username.substring(0, 2) + '***' + username.substring(username.length - 1)
        : '***';

    return `${maskedUsername}@${domain}`;
  },

  /**
   * Mask phone number
   */
  phone(phone: string): string {
    if (phone.length < 4) return '***';
    return '***' + phone.substring(phone.length - 4);
  },

  /**
   * Mask credit card number
   */
  creditCard(cardNumber: string): string {
    if (cardNumber.length < 4) return '****';
    return '**** **** **** ' + cardNumber.substring(cardNumber.length - 4);
  },

  /**
   * Mask token
   */
  token(token: string): string {
    if (token.length < 8) return '***';
    return token.substring(0, 4) + '...' + token.substring(token.length - 4);
  },
};
