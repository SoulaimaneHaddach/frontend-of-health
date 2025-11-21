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
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { DoctorLoginScreen } from '../screens/doctor/DoctorLoginScreen';
import { DoctorRegisterScreen } from '../screens/doctor/DoctorRegisterScreen';
import { ForgotPasswordScreen } from '../screens/doctor/ForgotPasswordScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { DoctorBookingsScreen } from '../screens/doctor/DoctorBookingsScreen';
import { HomeScreen } from '../screens/user/HomeScreen';
import { DoctorDetailsScreen } from '../screens/user/DoctorDetailsScreen';

export type RootStackParamList = {
  LanguageSelection: undefined;
  Welcome: undefined;
  RoleSelection: undefined;
  DoctorLogin: undefined;
  DoctorRegister: undefined;
  ForgotPassword: undefined;
  DoctorProfile: undefined;
  DoctorBookings: undefined;
  Home: undefined;
  DoctorDetails: { doctor: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  // Toggle to temporarily disable push + WebSocket notifications for local testing
  const DISABLE_NOTIFICATIONS = true;

  const analytics = useAnalytics();
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useRef<any>(null);
  const [doctorIdForWs, setDoctorIdForWs] = useState<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<'LanguageSelection' | 'Welcome'>('LanguageSelection');
  const [isReady, setIsReady] = useState(false);

  // Load doctorId if present to enable booking notifications when doctor is logged-in
  useEffect(() => {
    AsyncStorage.getItem('doctorId').then((id) => {
      if (id) setDoctorIdForWs(id);
    }).catch(() => {});
  }, []);

  // Initialize booking notifications hook (no-op until doctorId present)
  // Use the `enabled` flag so hooks are always called in the same order (rules of hooks).
  useBookingNotifications({
    doctorId: doctorIdForWs || '',
// enabled: !!doctorIdForWs,
    enabled: !DISABLE_NOTIFICATIONS && !!doctorIdForWs,
    onBookingClick: () => {
      try {
        navigationRef.current?.navigate('DoctorBookings');
      } catch (e) {
        console.warn('Navigation to DoctorBookings failed', e);
      }
    },
    showAlert: true,
  });

  // Register for push notifications and handle taps
  // Keep hook call but disable via the `enabled` flag so hook order is preserved.
  const { pushToken } = usePushNotifications({
    
    enabled: !DISABLE_NOTIFICATIONS,
    onNotificationResponse: (data) => {
      // Expect payload to include bookingId (or navigate to DoctorBookings)
      try {
        if (data?.bookingId) {
          // If there's a bookingId we can navigate to a details screen or to DoctorBookings
          // Prefer deep link to a booking detail if you have that route. Here we go to DoctorBookings.
          navigationRef.current?.navigate('DoctorBookings');
        } else {
          navigationRef.current?.navigate('DoctorBookings');
        }
      } catch (e) {
        console.warn('Navigation from push response failed', e);
      }
    },
    // For foreground notifications the hook will show an Alert by default; you can provide
    // a custom handler here if you want to use your WebSocket in-app UI instead.
    onNotification: (notification) => {
      // No-op: keep default behavior (Alert) or implement custom toast here.
    },
  });

  // Log push token for testing — remove or replace with API call to register device token
  useEffect(() => {
    if (pushToken) {
      if (typeof console !== 'undefined') console.log('Push token:', pushToken);
    }
  }, [pushToken]);

  // Register device token with backend (attach doctorId if available)
  useEffect(() => {
    if (!pushToken) return;

    const register = async () => {
      try {
        const tokenType = pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native';
        const metadata = { doctorId: doctorIdForWs };
        await ApiService.registerDeviceToken(pushToken, Platform.OS, tokenType, metadata);
        if (typeof console !== 'undefined') console.log('Device token registered');
      } catch (e) {
        // If registration fails (network or server), queue the request to retry later
        if (typeof console !== 'undefined') console.warn('Device token registration failed, queuing for retry', e);
        try {
          await requestQueueService.addRequest('/devices', 'POST', {
            body: { token: pushToken, platform: Platform.OS, tokenType: pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native', metadata: { doctorId: doctorIdForWs } },
            priority: 20,
            metadata: { action: 'register_device' },
          });
        } catch (qErr) {
          if (typeof console !== 'undefined') console.warn('Failed to queue device registration', qErr);
        }
      }
    };

    // If offline, directly queue the device registration for retry
    if (!networkService.isConnected()) {
      requestQueueService.addRequest('/devices', 'POST', {
        body: { token: pushToken, platform: Platform.OS, tokenType: pushToken.startsWith('ExponentPushToken') ? 'expo' : 'native', metadata: { doctorId: doctorIdForWs } },
        priority: 20,
        metadata: { action: 'register_device' },
      }).catch((e) => { if (typeof console !== 'undefined') console.warn('Failed to queue device registration', e); });
    } else {
      register();
    }
  }, [pushToken, doctorIdForWs]);

  // Check if language has been selected
  useEffect(() => {
    checkLanguageSelection();
  }, []);

  const checkLanguageSelection = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        setInitialRoute('Welcome');
      } else {
        setInitialRoute('LanguageSelection');
      }
    } catch (error) {
      console.error('Failed to check language:', error);
      setInitialRoute('LanguageSelection');
    } finally {
      setIsReady(true);
    }
  };

  // Track screen changes
  const onStateChange = (state: NavigationState | undefined) => {
    if (!state) return;

    const previousRouteName = routeNameRef.current;
    const currentRouteName = getActiveRouteName(state);

    if (previousRouteName !== currentRouteName && currentRouteName) {
      // Track screen view
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
    return null; // Or a loading screen
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
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
