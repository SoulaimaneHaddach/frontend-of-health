// src/screens/RoleSelectionScreen.tsx
import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import api from '../services/api';

type RoleSelectionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
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

  // If role was already selected previously, skip this screen
  useEffect(() => {
    const checkRole = async () => {
      try {
        const stored = await AsyncStorage.getItem('role_selected');
        if (stored) {
          // Role already chosen, skip to Home
          navigation.replace('Home');
        }
      } catch (e) {
        // ignore
      }
    };
    checkRole();
  }, [navigation]);

  const handleProfilePress = async () => {
    try {
      // Persist that user selected 'doctor' role so we don't show selection again
      await AsyncStorage.setItem('role_selected', 'doctor');

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
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
        <Text style={[styles.title, isRTL && styles.rtlText, { color: colors.text }]}>{t.selectRole}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
          {isRTL ? 'اختر دورك للمتابعة' : 'Select your role to continue'}
        </Text>
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
          title={t.imAPatient}
          description={t.patientDescription}
          color={COLORS.primary}
          onPress={async () => {
            // Persist selection so this screen doesn't reappear
            try { await AsyncStorage.setItem('role_selected', 'patient'); } catch (e) {}
            navigation.replace('Home');
          }}
          pulseAnim={pulseAnim1}
          isRTL={isRTL}
          isDark={isDarkMode}
          cardBg={colors.card}
        />
        
        <RoleCard
          icon="medical"
          title={t.imADoctor}
          description={t.doctorDescription}
          color={COLORS.secondary}
          onPress={handleProfilePress}
          pulseAnim={pulseAnim2}
          isRTL={isRTL}
          isDark={isDarkMode}
          cardBg={colors.card}
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
  isRTL?: boolean;
  isDark?: boolean;
  cardBg?: string;
}> = ({ icon, title, description, color, onPress, pulseAnim, isRTL = false, isDark = false, cardBg = COLORS.white }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: color, backgroundColor: cardBg }]}
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
    
    <Text style={[styles.cardTitle, isRTL && styles.rtlText, { color: isDark ? COLORS.darkText : COLORS.textPrimary }]}>{title}</Text>
    <Text style={[styles.cardDescription, isRTL && styles.rtlText, { color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary }]}>{description}</Text>
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
