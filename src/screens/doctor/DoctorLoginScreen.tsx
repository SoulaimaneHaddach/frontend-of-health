// src/screens/doctor/DoctorLoginScreen.tsx - WITH FORGOT PASSWORD
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomButton } from '../../shared/components/CustomButton';
import { InputField } from '../../shared/components/InputField';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import ApiService, { LoginRequestDTO, AuthResponse } from '../../services/api';
import { useAnalytics } from '../../shared/hooks/useAnalytics';
import logger from '../../shared/utils/logger';

type DoctorLoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DoctorLoginScreen: React.FC<DoctorLoginScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const analytics = useAnalytics();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginRequestDTO = { email: email.trim(), password };
      
      logger.debug('🔐 Attempting login for:', email);
      
      const authResponse: AuthResponse = await ApiService.login(credentials);

      await AsyncStorage.multiSet([
        ['authToken', authResponse.accessToken],
        ['doctorEmail', authResponse.email],
        ['doctorId', authResponse.id],
      ]);
      logger.debug('✅ Login successful for:', authResponse.email);
      // Track successful login
      analytics.trackLogin('email', 'doctor', true);
      analytics.setUserId(authResponse.id);
      analytics.setUserProperties({
        email: authResponse.email,
        userType: 'doctor',
        lastLoginDate: new Date().toISOString(),
      }); 
      navigation.replace('DoctorProfile')
    } catch (error: any) {
      logger.error('❌ Login error:', error.response?.data || error.message);
      
      // Track failed login
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      analytics.trackLogin('email', 'doctor', false, errorMessage);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 401 || status === 404 || status === 400) {
        
          Alert.alert(
            'Login Failed',
            'Invalid email or password. Please check your credentials and try again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Server Error',
            errorData?.message || 'Something went wrong. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      } else if (error.request) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'An unexpected error occurred. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.card }]}> 
              <Ionicons name="medical" size={50} color={colors.secondary} />
            </View>
            <Text style={[styles.title, isRTL && styles.rtlText, { color: colors.text }]}> 
              {isRTL ? 'تسجيل دخول الطبيب' : t.login}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
              {isRTL ? 'مرحبا بعودتك! سجل الدخول للمتابعة' : 'Welcome back! Sign in to continue'}
            </Text>
          </View>

          <View style={styles.form}>
            <InputField
              label={t.email}
              placeholder={isRTL ? 'doctor@example.com' : 'doctor@example.com'}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail"
              error={errors.email}
            />

            <InputField
              label={isRTL ? 'كلمة المرور' : t.email.includes('Email') ? 'Password' : t.email}
              placeholder={isRTL ? 'أدخل كلمة المرور' : 'Enter your password'}
              value={password}
              onChangeText={handlePasswordChange}
              isPassword
              icon="lock-closed"
              error={errors.password}
            />

            {/* FORGOT PASSWORD BUTTON */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, isRTL && styles.rtlText]}>
                {isRTL ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
            
            <CustomButton
              title={t.login}
              onPress={handleLogin}
              variant="secondary"
              size="large"
              fullWidth
              loading={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.dontHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorRegister')}>
              <Text style={styles.signUpText}>{t.signUp}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: colors.secondary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.info || colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
  },
  signUpText: {
    fontSize: FONT_SIZES.base,
    color: colors.secondary,
    fontWeight: '700',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
