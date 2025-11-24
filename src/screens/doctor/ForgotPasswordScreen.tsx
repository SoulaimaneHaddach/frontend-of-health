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
import logger from '../../shared/utils/logger';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import ApiService from '../../services/api';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
      logger.error('❌ Password reset error:', err);
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
            <View style={styles.backButtonCircle}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={colors.text} />
            </View>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="lock-closed" size={56} color={colors.error} />
            </View>
            <Text style={[styles.title, isRTL && { textAlign: 'right' }, { color: colors.text }]}>
              {t.forgotPassword}
            </Text>
            <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }, { color: colors.textSecondary }]}>
              {emailSent 
                ? 'Check your email for password reset instructions'
                : 'Enter your email address and we\'ll send you instructions to reset your password'
              }
            </Text>
          </View>

          {!emailSent ? (
            <View style={styles.form}>
              <InputField
                label={t.email}
                placeholder="your.email@example.com"
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
                style={{ ...styles.resetButton, backgroundColor: colors.error }}
              />

              <View style={[styles.infoBox, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="information-circle" size={20} color={colors.error} />
                </View>
                <Text style={[styles.infoText, isRTL && { textAlign: 'right' }, { color: colors.textSecondary }]}>
                  You'll receive an email with a link to reset your password.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="mail" size={64} color={colors.error} />
                </View>
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark-circle" size={32} color="#EF4444" />
                </View>
              </View>
              
              <Text style={[styles.successTitle, { color: colors.text }]}>Email Sent Successfully!</Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                We've sent password reset instructions to:
              </Text>
              <View style={styles.emailBadge}>
                <Ionicons name="mail-outline" size={18} color={colors.error} />
                <Text style={[styles.emailText, { color: colors.error }]}>{email}</Text>
              </View>

              <View style={styles.instructionsBox}>
                <View style={[styles.instructionsHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="list" size={22} color={colors.error} />
                  <Text style={[styles.instructionsTitle, { color: colors.text }]}>Next Steps</Text>
                </View>
                
                <View style={styles.instructionsList}>
                  <View style={[styles.instructionItem, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.instructionContent}>
                      <Text style={[styles.instructionTitle, { color: colors.text }]}>Check your inbox</Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Look for an email from our team
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionDivider} />

                  <View style={[styles.instructionItem, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.instructionContent}>
                      <Text style={[styles.instructionTitle, { color: colors.text }]}>Click the reset link</Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Valid for 1 hour from now
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionDivider} />

                  <View style={[styles.instructionItem, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.instructionContent}>
                      <Text style={[styles.instructionTitle, { color: colors.text }]}>Create new password</Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Choose a strong, secure password
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <CustomButton
                title="Back to Login"
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
                <Ionicons name="refresh" size={18} color={colors.error} />
                <Text style={[styles.resendText, isRTL && { textAlign: 'center' }, { color: colors.error }]}> 
                  Didn't receive email? Try again
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.footer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t.alreadyHaveAccount}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
              <Text style={[styles.signInText, { color: colors.error }]}>{t.signIn}</Text>
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
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 8,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    lineHeight: 24,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  resetButton: {
    marginTop: SPACING.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    ...SHADOWS.small,
  },
  infoIconContainer: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIconWrapper: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  successIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 10,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.card,
    borderRadius: 20,
    ...SHADOWS.medium,
    elevation: 6,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  successText: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  emailText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    width: '100%',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 4,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  instructionsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  instructionsList: {
    gap: 0,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: colors.white,
  },
  instructionContent: {
    flex: 1,
    gap: 4,
  },
  instructionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  instructionText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  instructionDivider: {
    height: 1,
    backgroundColor: colors.border + '20',
    marginLeft: 44,
  },
  backToLoginButton: {
    marginBottom: SPACING.md,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    textAlign: 'center',
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
  },
  signInText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});