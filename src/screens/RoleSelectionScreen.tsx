// src/screens/RoleSelectionScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import api from '../services/api';

type RoleSelectionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // First card pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim1, {
        toValue: 1.15,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim1, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Second card pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim2, {
        toValue: 1.15,
        duration: 1000,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim2, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleProfilePress = async () => {
    try {
      const isAuthenticated = await api.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('✅ User authenticated, navigating to profile');
        navigation.navigate('DoctorProfile');
      } else {
        console.log('❌ User not authenticated, navigating to login');
        navigation.navigate('DoctorLogin');
      }
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      navigation.navigate('DoctorLogin');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.title}>I am a...</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.cardsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <RoleCard
          icon="person"
          title="Patient"
          description="Find and connect with healthcare professionals"
          color={COLORS.primary}
          onPress={() => navigation.replace('Home')}
          pulseAnim={pulseAnim1}
        />
        
        <RoleCard
          icon="medical"
          title="Doctor"
          description="Manage your practice and connect with patients"
          color={COLORS.secondary}
          onPress={handleProfilePress}
          pulseAnim={pulseAnim2}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const RoleCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  pulseAnim: Animated.Value;
}> = ({ icon, title, description, color, onPress, pulseAnim }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Animated.View style={styles.iconContainer}>
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={32} color={COLORS.white} />
      </View>
      <Animated.View 
        style={[
          styles.pulseCircle1,
          { 
            borderColor: color,
            transform: [{ scale: pulseAnim }] 
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.pulseCircle2,
          { 
            borderColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: 0.15 
          }
        ]} 
      />
    </Animated.View>
    
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginTop: 30,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  cardsContainer: {
    flex: 1,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  pulseCircle1: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    zIndex: 2,
  },
  pulseCircle2: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2,
    zIndex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
