// src/navigation/AppNavigator.tsx
import React, { useRef, useEffect, useState } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import ApiService from '../services/api';
import { requestQueueService } from '../shared/services/requestQueueService';
import { networkService } from '../shared/services/networkService';
import { useAnalytics } from '../shared/hooks/useAnalytics';
import { useBookingNotifications } from '../shared/hooks/useBookingNotifications';
import usePushNotifications from '../shared/hooks/usePushNotifications';
import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
// ---------------------------------------------------------
import OnboardingScreen from '../screens/OnboardingScreen'; //added
// ---------------------------------------------------------
// import { WelcomeScreen } from '../screens/WelcomeScreen';
// import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { DoctorLoginScreen } from '../screens/doctor/DoctorLoginScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { DoctorBookingsScreen } from '../screens/doctor/DoctorBookingsScreen';
import { HomeScreen } from '../screens/user/HomeScreen';
import { DoctorDetailsScreen } from '../screens/user/DoctorDetailsScreen';
import logger from '../shared/utils/logger';

export type RootStackParamList = {

  Onboarding: undefined; //added
  LanguageSelection: undefined;
  Welcome: undefined;
  DoctorLogin: undefined;
  // ForgotPassword route removed
  DoctorProfile: undefined;
  DoctorBookings: undefined;
  Home: undefined;
  DoctorDetails: { doctor: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  // Toggle to temporarily disable push + WebSocket notifications for local testing
  // Set to false to enable push + booking notifications.
  const DISABLE_NOTIFICATIONS = true;

  const FORCE_SHOW_ONBOARDING = false; 

  const analytics = useAnalytics();
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useRef<any>(null);
  const [doctorIdForWs, setDoctorIdForWs] = useState<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'LanguageSelection' | 'Welcome' | 'Home'>('Onboarding'); //added
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('doctorId').then((id) => {
      if (id) setDoctorIdForWs(id);
    }).catch(() => {});
  }, []);

  // Initialize booking notifications hook (no-op until doctorId present)
  // Use the `enabled` flag so hooks are always called in the same order (rules of hooks).
  useBookingNotifications({
    doctorId: doctorIdForWs || '',
    enabled: !DISABLE_NOTIFICATIONS && !!doctorIdForWs,
      onBookingClick: () => {
      try {
        navigationRef.current?.navigate('DoctorBookings');
      } catch (e) {
        logger.warn('Navigation to DoctorBookings failed', e);
      }
    },
    showAlert: true,
  });

  // Register for push notifications and handle taps
  const { pushToken } = usePushNotifications({
    enabled: !DISABLE_NOTIFICATIONS,
    onNotificationResponse: (data) => {
      try {
        if (data?.bookingId) {

          navigationRef.current?.navigate('DoctorBookings');
        } else {
          navigationRef.current?.navigate('DoctorBookings');
        }
      } catch (e) {
        logger.warn('Navigation from push response failed', e);
      }
    },

      onNotification: (_notification) => {
    },
  });

  useEffect(() => {
    if (pushToken) {
      logger.debug('Push token:', pushToken);
    }
  }, [pushToken]);

  useEffect(() => {
    if (!pushToken) return;

    const register = async () => {
        try {
        const tokenType = pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native';
        const metadata = { doctorId: doctorIdForWs };
        await ApiService.registerDeviceToken(pushToken, Platform.OS, tokenType, metadata);
        logger.debug('Device token registered');
      } catch (e) {

        logger.warn('Device token registration failed, queuing for retry', e);
        try {
          await requestQueueService.addRequest('/devices', 'POST', {
            body: { token: pushToken, platform: Platform.OS, tokenType: pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native', metadata: { doctorId: doctorIdForWs } },
            priority: 20,
            metadata: { action: 'register_device' },
          });
        } catch (qErr) {
          logger.warn('Failed to queue device registration', qErr);
        }
      }
    };

    if (!networkService.isConnected()) {
      requestQueueService.addRequest('/devices', 'POST', {
        body: { token: pushToken, platform: Platform.OS, tokenType: pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native', metadata: { doctorId: doctorIdForWs } },
        priority: 20,
        metadata: { action: 'register_device' },
      }).catch((e) => { logger.warn('Failed to queue device registration', e); });
    } else {
      register();
    }
  }, [pushToken, doctorIdForWs]);

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        if (FORCE_SHOW_ONBOARDING) {
          try { await AsyncStorage.removeItem('onboarding_shown'); } catch { /* ignore */ }
          setInitialRoute('Onboarding');
          return;
        }

        const shown = await AsyncStorage.getItem('onboarding_shown');
        if (shown) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch {
        setInitialRoute('Onboarding');
      } finally {
        setIsReady(true);
      }
    };

    determineInitialRoute();
  }, [FORCE_SHOW_ONBOARDING]);

  // Track screen changes
  const onStateChange = (state: NavigationState | undefined) => {
    if (!state) return;

    const previousRouteName = routeNameRef.current;
    const currentRouteName = getActiveRouteName(state);

    if (previousRouteName !== currentRouteName && currentRouteName) {
      analytics.trackScreenView(currentRouteName);
    }

    // Save the current route name for next change
    routeNameRef.current = currentRouteName;
  };

  // Helper to get active route name from navigation state
  const getActiveRouteName = (state: NavigationState): string | undefined => {
    const route = state.routes[state.index];

    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }

    return route.name;
  };

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        routeNameRef.current = currentRouteName;
        if (currentRouteName) {
          analytics.trackScreenView(currentRouteName);
        }
      }}
      onStateChange={onStateChange}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        {/* ForgotPassword route removed */}
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="DoctorBookings" component={DoctorBookingsScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
