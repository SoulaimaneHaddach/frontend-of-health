// src/shared/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { handleApiError, isRetryableError, logError } from '../utils/errorHandler';
import { AxiosError } from 'axios';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorTitle: string | null;
  shouldRetry: boolean;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retryable?: boolean;
}

/**
 * Custom hook for API calls with loading, error states, and automatic error handling
 * 
 * @example
 * const { data, loading, error, execute, reset } = useApi<DoctorResponseDto[]>();
 * 
 * useEffect(() => {
 *   execute(() => api.getDoctors({ specialty: 'cardiology' }));
 * }, []);
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    errorTitle: null,
    shouldRetry: false,
  });

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setState({
        data: null,
        loading: true,
        error: null,
        errorTitle: null,
        shouldRetry: false,
      });

      try {
        const result = await apiCall();
        
        setState({
          data: result,
          loading: false,
          error: null,
          errorTitle: null,
          shouldRetry: false,
        });

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorResponse = handleApiError(err as AxiosError);
        const canRetry = options.retryable !== false && isRetryableError(err as AxiosError);
        
        logError(err as Error, 'useApi');

        setState({
          data: null,
          loading: false,
          error: errorResponse.message,
          errorTitle: errorResponse.title || null,
          shouldRetry: canRetry,
        });

        if (options.onError) {
          options.onError(errorResponse.message);
        }

        throw err;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      errorTitle: null,
      shouldRetry: false,
    });
  }, []);

  const retry = useCallback(
    async (apiCall: () => Promise<T>) => {
      if (state.shouldRetry) {
        return execute(apiCall);
      }
    },
    [state.shouldRetry, execute]
  );

  return {
    ...state,
    execute,
    reset,
    retry,
  };
}

/**
 * Hook for handling multiple API calls with a single loading state
 * 
 * @example
 * const { loading, executeAll } = useApiMultiple();
 * 
 * await executeAll([
 *   () => api.getDoctors(),
 *   () => api.getSpecialties(),
 * ]);
 */
export function useApiMultiple() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const executeAll = useCallback(async (apiCalls: (() => Promise<any>)[]) => {
    setLoading(true);
    setErrors([]);

    try {
      const results = await Promise.all(
        apiCalls.map(async (call) => {
          try {
            return await call();
          } catch (err) {
            const errorResponse = handleApiError(err as AxiosError);
            logError(err as Error, 'useApiMultiple');
            return { error: errorResponse.message };
          }
        })
      );

      const errorMessages = results
        .filter((r) => r && r.error)
        .map((r) => r.error);

      setErrors(errorMessages);
      setLoading(false);

      return results;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    errors,
    executeAll,
    hasErrors: errors.length > 0,
  };
}
