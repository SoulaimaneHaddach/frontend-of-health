// src/navigation/AppNavigator.tsx
import React, { useRef } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAnalytics } from '../shared/hooks/useAnalytics';
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
  const analytics = useAnalytics();
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useRef<any>(null);

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
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="DoctorBookings" component={DoctorBookingsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
