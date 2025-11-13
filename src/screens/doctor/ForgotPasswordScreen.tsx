// src/screens/doctor/ForgotPasswordScreen.tsx
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
import { CustomButton } from '../../shared/components/CustomButton';
import { InputField } from '../../shared/components/InputField';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import ApiService from '../../services/api';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t.invalidEmail);
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await ApiService.forgotPassword(email.trim());

      setEmailSent(true);
      Alert.alert(
        t.success,
        `${t.success}`,
        [{ text: t.ok }]
      );
    } catch (err: any) {
      console.error('❌ Password reset error:', err);
      Alert.alert(
        t.error,
        err.response?.data?.message || t.error,
        [{ text: t.ok }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError('');
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
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed" size={50} color={COLORS.secondary} />
            </View>
            <Text style={[styles.title, isRTL && { textAlign: 'right' }, { color: colors.text }]}>{t.forgotPassword}</Text>
            <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }, { color: colors.textSecondary }]}>
              {emailSent 
                ? t.email
                : t.email
              }
            </Text>
          </View>

          {!emailSent ? (
            <View style={styles.form}>
              <InputField
                label={t.email}
                placeholder={t.email}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="mail"
                error={error}
              />

              <CustomButton
                title={t.submit}
                onPress={handleResetPassword}
                variant="secondary"
                size="large"
                fullWidth
                loading={loading}
                style={styles.resetButton}
              />

              <View style={[styles.infoBox, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="information-circle" size={20} color={COLORS.info} />
                <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>
                  {t.email}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
              </View>
              
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successText}>
                We've sent password reset instructions to:
              </Text>
              <Text style={styles.emailText}>{email}</Text>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>What to do next:</Text>
                <View style={styles.instructionItem}>
                  <Text style={styles.bulletPoint}>1.</Text>
                  <Text style={styles.instructionText}>Check your email inbox</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.bulletPoint}>2.</Text>
                  <Text style={styles.instructionText}>Click the reset link in the email</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.bulletPoint}>3.</Text>
                  <Text style={styles.instructionText}>Create your new password</Text>
                </View>
              </View>

              <CustomButton
                title={t.back}
                onPress={() => navigation.navigate('DoctorLogin')}
                variant="secondary"
                size="large"
                fullWidth
                style={styles.backToLoginButton}
              />

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
              >
                <Text style={[styles.resendText, isRTL && { textAlign: 'center' }]}>{t.retry}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.footer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
              <Text style={styles.signInText}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
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
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 22,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  resetButton: {
    marginTop: SPACING.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info || COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIcon: {
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emailText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  instructionsBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    width: '100%',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  instructionsTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginRight: SPACING.sm,
    width: 20,
  },
  instructionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  backToLoginButton: {
    marginBottom: SPACING.md,
  },
  resendButton: {
    paddingVertical: SPACING.sm,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
    color: COLORS.textSecondary,
  },
  signInText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
