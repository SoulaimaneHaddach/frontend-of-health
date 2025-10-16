// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { DoctorLoginScreen } from '../screens/doctor/DoctorLoginScreen';
import { DoctorRegisterScreen } from '../screens/doctor/DoctorRegisterScreen';
import { DoctorProfileScreen } from '../screens/doctor/DoctorProfileScreen';
import { HomeScreen } from '../screens/user/HomeScreen';
import { DoctorDetailsScreen } from '../screens/user/DoctorDetailsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  RoleSelection: undefined;
  DoctorLogin: undefined;
  DoctorRegister: undefined;
  DoctorProfile: undefined;
  Home: undefined;
  DoctorDetails: { doctor: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};