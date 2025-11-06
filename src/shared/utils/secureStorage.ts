// src/shared/utils/secureStorage.ts
/**
 * Secure storage wrapper with encryption
 * For sensitive data like tokens, passwords, user info
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from './errorHandler';

// Prefix for all secure storage keys
const SECURE_PREFIX = '@secure_';

/**
 * Generate a simple encryption key from device-specific data
 * In production, consider using expo-secure-store for better security
 */
const getEncryptionKey = async (): Promise<string> => {
  try {
    // Check if key exists
    let key = await AsyncStorage.getItem('@encryption_key');
    
    if (!key) {
      // Generate new key using timestamp and random value
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      key = `${timestamp}-${random}-${timestamp}`;
      
      await AsyncStorage.setItem('@encryption_key', key);
    }
    
    return key;
  } catch (error) {
    logError(error as Error, 'secureStorage.getEncryptionKey');
    // Fallback to a static key (NOT recommended for production)
    return 'fallback-key-please-use-expo-secure-store';
  }
};

/**
 * Base64 encoding (React Native compatible)
 */
const base64Encode = (str: string): string => {
  // Convert string to array of char codes
  const charCodes = [];
  for (let i = 0; i < str.length; i++) {
    charCodes.push(str.charCodeAt(i));
  }
  
  // Simple base64 encoding
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < charCodes.length) {
    const a = charCodes[i++];
    const b = i < charCodes.length ? charCodes[i++] : 0;
    const c = i < charCodes.length ? charCodes[i++] : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += base64Chars[(bitmap >> 18) & 63];
    result += base64Chars[(bitmap >> 12) & 63];
    result += i > charCodes.length + 1 ? '=' : base64Chars[(bitmap >> 6) & 63];
    result += i > charCodes.length ? '=' : base64Chars[bitmap & 63];
  }
  
  return result;
};

/**
 * Base64 decoding (React Native compatible)
 */
const base64Decode = (str: string): string => {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  
  // Remove padding
  str = str.replace(/=+$/, '');
  
  for (let i = 0; i < str.length; i += 4) {
    const a = base64Chars.indexOf(str[i]);
    const b = base64Chars.indexOf(str[i + 1]);
    const c = base64Chars.indexOf(str[i + 2]);
    const d = base64Chars.indexOf(str[i + 3]);
    
    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (c !== -1) result += String.fromCharCode((bitmap >> 8) & 255);
    if (d !== -1) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
};

/**
 * Simple XOR encryption (for demo purposes)
 * For production, use expo-secure-store or more robust encryption
 */
const encrypt = (text: string, key: string): string => {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return base64Encode(encrypted);
};

/**
 * Simple XOR decryption
 */
const decrypt = (encryptedBase64: string, key: string): string => {
  const encrypted = base64Decode(encryptedBase64);
  let decrypted = '';
  for (let i = 0; i < encrypted.length; i++) {
    const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
};

/**
 * SecureStorage class for encrypted data storage
 */
class SecureStorage {
  private encryptionKey: string | null = null;

  /**
   * Initialize encryption key
   */
  private async ensureKey(): Promise<string> {
    if (!this.encryptionKey) {
      this.encryptionKey = await getEncryptionKey();
    }
    return this.encryptionKey;
  }

  /**
   * Store encrypted data
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptionKey = await this.ensureKey();
      const encrypted = encrypt(value, encryptionKey);
      await AsyncStorage.setItem(SECURE_PREFIX + key, encrypted);
    } catch (error) {
      logError(error as Error, 'SecureStorage.setItem');
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encryptionKey = await this.ensureKey();
      const encrypted = await AsyncStorage.getItem(SECURE_PREFIX + key);
      
      if (!encrypted) return null;
      
      return decrypt(encrypted, encryptionKey);
    } catch (error) {
      logError(error as Error, 'SecureStorage.getItem');
      return null;
    }
  }

  /**
   * Store object as encrypted JSON
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    await this.setItem(key, json);
  }

  /**
   * Retrieve and parse encrypted JSON object
   */
  async getObject<T>(key: string): Promise<T | null> {
    const json = await this.getItem(key);
    if (!json) return null;
    
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      logError(error as Error, 'SecureStorage.getObject');
      return null;
    }
  }

  /**
   * Remove encrypted data
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(SECURE_PREFIX + key);
    } catch (error) {
      logError(error as Error, 'SecureStorage.removeItem');
    }
  }

  /**
   * Clear all secure storage
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(k => k.startsWith(SECURE_PREFIX));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      logError(error as Error, 'SecureStorage.clear');
    }
  }

  /**
   * Check if key exists
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

/**
 * Token storage utilities (SIMPLIFIED - no encryption for now)
 */
export const TokenStorage = {
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@auth_token', token);
    } catch (error) {
      logError(error as Error, 'TokenStorage.setToken');
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      logError(error as Error, 'TokenStorage.getToken');
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@auth_token');
    } catch (error) {
      logError(error as Error, 'TokenStorage.removeToken');
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setItem('refresh_token', token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItem('refresh_token');
  },
};

/**
 * Sensitive data utilities
 */
export const SensitiveDataStorage = {
  /**
   * Store user credentials (use with caution)
   */
  async setCredentials(email: string, password: string): Promise<void> {
    await secureStorage.setObject('credentials', { email, password });
  },

  async getCredentials(): Promise<{ email: string; password: string } | null> {
    return await secureStorage.getObject('credentials');
  },

  async clearCredentials(): Promise<void> {
    await secureStorage.removeItem('credentials');
  },

  /**
   * Store biometric auth preference
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await secureStorage.setItem('biometric_enabled', enabled.toString());
  },

  async isBiometricEnabled(): Promise<boolean> {
    const value = await secureStorage.getItem('biometric_enabled');
    return value === 'true';
  },
};

/**
 * Data sanitization utilities
 */
export const sanitizeForLogs = (data: any): any => {
  if (!data) return data;

  const sensitive = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  
  if (typeof data === 'string') {
    return '***REDACTED***';
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogs(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      const lowerKey = key.toLowerCase();
      if (sensitive.some(s => lowerKey.includes(s))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeForLogs(data[key]);
      }
    }
    return sanitized;
  }

  return data;
};
