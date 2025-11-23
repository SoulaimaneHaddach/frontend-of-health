// src/utils/errorHandler.ts
/**
 * Centralized error handling utility
 * Transforms API errors into user-friendly messages
 */

import { AxiosError } from 'axios';
import { ApiException } from '../types/api.types';
import logger from './logger';

export interface ErrorResponse {
  message: string;
  title?: string;
  shouldRetry?: boolean;
}

/**
 * Extract user-friendly error message from various error types
 */
export function handleApiError(error: unknown): ErrorResponse {
  // Axios error
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Network error
    if (!error.response) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        shouldRetry: true,
      };
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        shouldRetry: true,
      };
    }

    // Status-based errors
    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: data?.message || 'The request contains invalid data.',
        };
      case 401:
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
        };
      case 404:
        return {
          title: 'Not Found',
          message: data?.message || 'The requested resource was not found.',
        };
      case 409:
        return {
          title: 'Conflict',
          message: data?.message || 'This operation conflicts with existing data.',
        };
      case 422:
        return {
          title: 'Validation Error',
          message: data?.message || 'Please check your input and try again.',
        };
      case 500:
      case 502:
      case 503:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          shouldRetry: true,
        };
      default:
        return {
          title: 'Error',
          message: data?.message || 'An unexpected error occurred.',
        };
    }
  }

  // ApiException
  if (error instanceof ApiException) {
    return {
      title: 'Error',
      message: error.message,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
    };
  }

  // Unknown error
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Log errors in development
 */
export function logError(error: unknown, context?: string): void {
  if (__DEV__) {
    logger.error(`🔴 Error${context ? ` in ${context}` : ''}`, error);
    if (error instanceof AxiosError) {
      logger.debug('Request:', error.config);
      logger.debug('Response:', error.response?.data);
    }
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      (status !== undefined && status >= 500) // Server errors
    );
  }
  return false;
}
