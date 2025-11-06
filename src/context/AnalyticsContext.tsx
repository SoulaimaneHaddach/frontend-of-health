
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import analyticsService from '../shared/services/analyticsService';
import {
  AnalyticsContextValue,
  AnalyticsState,
  EventName,
  EventProperties,
  UserProperties,
  ScreenViewProperties,
} from '../shared/types/analytics.types';

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  debug?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children, debug = false }) => {
  const [state, setState] = useState<AnalyticsState>({
    initialized: false,
    sessionId: null,
    userId: null,
    userProperties: {},
    eventQueue: [],
    lastEventTimestamp: 0,
  });

  useEffect(() => {
    const initAnalytics = async () => {
      await analyticsService.initialize({ debug });
      setState(analyticsService.getState());
    };

    initAnalytics();

    analyticsService.startSession();

    return () => {
      analyticsService.endSession();
    };
  }, [debug]);

  const updateState = () => {
    setState(analyticsService.getState());
  };

  const trackEvent = (name: EventName | string, properties?: EventProperties) => {
    analyticsService.trackEvent(name, properties);
    updateState();
  };

  const trackScreen = (screenName: string, properties?: Partial<ScreenViewProperties>) => {
    analyticsService.trackScreen(screenName, properties);
    updateState();
  };

  const setUserId = async (userId: string) => {
    await analyticsService.setUserId(userId);
    updateState();
  };

  const setUserProperties = async (properties: Partial<UserProperties>) => {
    await analyticsService.setUserProperties(properties);
    updateState();
  };

  // Clear user
  const clearUser = async () => {
    await analyticsService.clearUser();
    updateState();
  };

  // Start session
  const startSession = async () => {
    await analyticsService.startSession();
    updateState();
  };

  // End session
  const endSession = async () => {
    await analyticsService.endSession();
    updateState();
  };

  // Enable analytics
  const enable = async () => {
    await analyticsService.enable();
    updateState();
  };

  // Disable analytics
  const disable = async () => {
    await analyticsService.disable();
    updateState();
  };

  // Flush events
  const flush = async () => {
    await analyticsService.flush();
    updateState();
  };

  const value: AnalyticsContextValue = {
    state,
    trackEvent,
    trackScreen,
    setUserId,
    setUserProperties,
    clearUser,
    startSession,
    endSession,
    enable,
    disable,
    flush,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }

  return context;
};

export default AnalyticsContext;
