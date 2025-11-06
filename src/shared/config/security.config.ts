// src/shared/config/security.config.ts
/**
 * Security configuration for the application
 */

export const SECURITY_CONFIG = {
  /**
   * Token security
   */
  token: {
    // Token expiry time (in milliseconds)
    accessTokenExpiry: 15 * 60 * 1000, // 15 minutes
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    // Auto-refresh token before expiry (in milliseconds)
    refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * API security
   */
  api: {
    // Request timeout
    timeout: 30000, // 30 seconds
    // Max retry attempts for failed requests
    maxRetries: 3,
    // Retry delay (in milliseconds)
    retryDelay: 1000,
    // Enable SSL pinning (requires certificate setup)
    enableSSLPinning: false,
    // Allowed domains for API calls
    allowedDomains: [
      'vsrwljl6-8080.uks1.devtunnels.ms',
      'localhost',
      '127.0.0.1',
    ],
  },

  /**
   * Session security
   */
  session: {
    // Session timeout (in milliseconds)
    timeout: 30 * 60 * 1000, // 30 minutes
    // Enable biometric authentication
    enableBiometric: true,
    // Number of failed login attempts before lockout
    maxLoginAttempts: 5,
    // Lockout duration (in milliseconds)
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * Data validation
   */
  validation: {
    // Email regex pattern
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Password requirements
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*(),.?":{}|<>',
    },
    // Phone number pattern (international format)
    phonePattern: /^\+?[1-9]\d{1,14}$/,
  },

  /**
   * Sensitive data fields to redact in logs
   */
  sensitiveFields: [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'pin',
  ],

  /**
   * Content Security Policy
   */
  csp: {
    // Allowed image sources
    imageSources: ['https:', 'data:', 'blob:'],
    // Allowed script sources (for WebView if used)
    scriptSources: ["'self'"],
    // Allowed style sources
    styleSources: ["'self'", "'unsafe-inline'"],
  },

  /**
   * Rate limiting
   */
  rateLimit: {
    // Max requests per minute per endpoint
    maxRequestsPerMinute: 60,
    // Enable rate limiting
    enabled: true,
  },
} as const;

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
});

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const { password: rules } = SECURITY_CONFIG.validation;

  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }

  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (rules.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (rules.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${rules.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return SECURITY_CONFIG.validation.emailPattern.test(email);
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  return SECURITY_CONFIG.validation.phonePattern.test(phone);
};

/**
 * Check if domain is allowed
 */
export const isAllowedDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return SECURITY_CONFIG.api.allowedDomains.some(
      allowedDomain => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );
  } catch {
    return false;
  }
};

/**
 * Generate random string for CSRF tokens, nonces, etc.
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Hash sensitive data (simple implementation)
 * For production, use a proper crypto library
 */
export const hashData = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};
