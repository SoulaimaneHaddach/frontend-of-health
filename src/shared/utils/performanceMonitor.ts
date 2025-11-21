// src/shared/utils/performanceMonitor.ts
/**
 * Performance monitoring and optimization utilities
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Measure component render time
 * Use in development to identify slow renders
 */
export const useRenderTime = (componentName: string, enabled: boolean = __DEV__) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;

    if (renderTime > 16) {
      console.warn(`⚠️  ${componentName} render #${renderCount.current} took ${renderTime}ms`);
    }

    startTime.current = Date.now();
  }, [componentName, enabled]);
};

/**
 * Debounce hook for expensive operations
 * Delays execution until user stops typing/interacting
 */
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for scroll/pan events
 * Limits execution frequency
 */
export const useThrottle = <T,>(value: T, limit: number = 100): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const timeout = Math.max(0, limit - (Date.now() - lastRan.current));
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, timeout);

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
};

/**
 * Hook to detect if app is in foreground
 * Pause expensive operations when app is backgrounded
 */
export const useAppState = () => {
  const [appState, setAppState] = useState('active');

  useEffect(() => {
    const AppState = require('react-native').AppState;
    const subscription = AppState.addEventListener('change', (nextAppState: string) => {
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  }, []);

  return {
    isActive: appState === 'active',
    isBackground: appState === 'background',
    state: appState,
  };
};

/**
 * Lazy value initialization
 * Only computes expensive value once
 */
export const useLazyValue = <T,>(factory: () => T): T => {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = factory();
  return ref.current as T;
};

/**
 * Track component mount/unmount for debugging
 */
export const useComponentLifecycle = (componentName: string, enabled: boolean = __DEV__) => {
  useEffect(() => {
    if (!enabled) return;
    console.log(`✅ ${componentName} mounted`);
    return () => console.log(`❌ ${componentName} unmounted`);
  }, [componentName, enabled]);
};

/**
 * Memoize expensive calculations
 * Similar to useMemo but with dependency comparison logging
 */
export const useDeepMemo = <T,>(factory: () => T, deps: React.DependencyList, debugLabel?: string): T => {
  const prevDeps = useRef<React.DependencyList | undefined>(undefined);
  const value = useRef<T | undefined>(undefined);

  if (!prevDeps.current || !areEqual(prevDeps.current, deps)) {
    if (__DEV__ && debugLabel && prevDeps.current) console.log(`🔄 ${debugLabel} recalculating due to dep change`);
    value.current = factory();
    prevDeps.current = deps;
  }

  return value.current as T;
};

const areEqual = (a: React.DependencyList, b: React.DependencyList): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};
