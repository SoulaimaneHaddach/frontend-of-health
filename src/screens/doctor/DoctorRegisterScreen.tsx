// src/screens/doctor/DoctorRegisterScreen.tsx - ENHANCED
import React, { useState, useCallback, useMemo } from 'react';
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
  Modal,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../shared/components/CustomButton';
import { InputField } from '../../shared/components/InputField';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import { ms } from '../../shared/constants/responsive';
import ApiService from '../../services/api';
import * as Location from 'expo-location';
import { useAnalytics } from '../../shared/hooks/useAnalytics';
import { validateMoroccanPhone, validateDoctorName } from '../../shared/utils/validation';
import { eventBus } from '../../shared/services/eventBus';
import logger from '../../shared/utils/logger';

type DoctorRegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SPECIALTIES = [
  { value: 'hearing', icon: 'ear' as const, color: '#9B59B6', category: 'ENT' },
  { value: 'orthopedic', icon: 'fitness' as const, color: '#F39C12', category: 'Surgical' },
  { value: 'brain', icon: 'pulse' as const, color: '#E74C3C', category: 'Neurology' },
  { value: 'cardiology', icon: 'heart' as const, color: '#E91E63', category: 'Internal' },
  { value: 'dermatology', icon: 'color-palette' as const, color: '#FF9800', category: 'Dermatology' },
  { value: 'pediatrics', icon: 'people' as const, color: '#4CAF50', category: 'Pediatrics' },
  { value: 'ophthalmology', icon: 'eye' as const, color: '#00BCD4', category: 'Ophthalmology' },
  { value: 'psychiatry', icon: 'happy' as const, color: '#9C27B0', category: 'Mental Health' },
  { value: 'gastroenterology', icon: 'restaurant' as const, color: '#795548', category: 'Internal' },
  { value: 'endocrinology', icon: 'flask' as const, color: '#607D8B', category: 'Internal' },
  { value: 'neurology', icon: 'pulse' as const, color: '#E74C3C', category: 'Neurology' },
  { value: 'ent', icon: 'volume-high' as const, color: '#3F51B5', category: 'ENT' },
  { value: 'urology', icon: 'water-outline' as const, color: '#2196F3', category: 'Surgical' },
  { value: 'nephrology', icon: 'water' as const, color: '#03A9F4', category: 'Internal' },
  { value: 'oncology', icon: 'bandage' as const, color: '#F44336', category: 'Oncology' },
  { value: 'gynecology', icon: 'woman' as const, color: '#E91E63', category: 'OB/GYN' },
  { value: 'dentistry', icon: 'hammer' as const, color: '#9E9E9E', category: 'Dentistry' },
  { value: 'pulmonology', icon: 'cloud' as const, color: '#B0BEC5', category: 'Internal' },
  { value: 'rheumatology', icon: 'trending-up' as const, color: '#FF5722', category: 'Internal' },
  { value: 'allergy', icon: 'medkit' as const, color: '#CDDC39', category: 'Allergy' },
];

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'One number', test: (pwd: string) => /\d/.test(pwd) },
];

export const DoctorRegisterScreen: React.FC<DoctorRegisterScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1); // Multi-step form
  const analytics = useAnalytics();

  // Animated value for smooth transitions
  const fadeAnim = useState(new Animated.Value(1))[0];

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Filter specialties based on search
  const filteredSpecialties = useMemo(() => {
    if (!searchQuery.trim()) return SPECIALTIES;
    const query = searchQuery.toLowerCase();
    return SPECIALTIES.filter(s => {
      const translated = (t[s.value as keyof typeof t] as unknown as string) || s.value;
      return (
        translated.toLowerCase().includes(query) ||
        s.value.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter(req => req.test(formData.password));
    return {
      score: passed.length,
      total: PASSWORD_REQUIREMENTS.length,
      percentage: (passed.length / PASSWORD_REQUIREMENTS.length) * 100,
      requirements: PASSWORD_REQUIREMENTS.map(req => ({
        ...req,
        passed: req.test(formData.password)
      }))
    };
  }, [formData.password]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    // Name validation (must start with Dr. or dr.)
    const nameValidation = validateDoctorName(formData.name, t);
    if (!nameValidation.valid) newErrors.name = nameValidation.error as string;

    // Email
    if (!formData.email.trim()) newErrors.email = t.requiredField;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.invalidEmail;

    // Phone validation (Moroccan rules)
    const phoneValidation = validateMoroccanPhone(formData.phone, t);
    if (!phoneValidation.valid) newErrors.phone = phoneValidation.error as string;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.specialty.trim()) newErrors.specialty = t.requiredField;
    if (!formData.password) newErrors.password = t.requiredField;
    else if (passwordStrength.score < 4) newErrors.password = 'Password does not meet requirements';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t.passwordsDontMatch;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setRegistrationStep(2);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handlePreviousStep = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setRegistrationStep(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    
    try {
      const selectedSpecialty = SPECIALTIES.find(s => s.value === formData.specialty);
      const specializationToSend = selectedSpecialty 
        ? t[selectedSpecialty.value as keyof typeof t] || formData.specialty
        : formData.specialty;

      logger.debug('🔍 Sending registration data:', {
        name: formData.name,
        email: formData.email,
        specialization: specializationToSend,
        phoneNumber: formData.phone,
      });

      // Get device location
      let latitude = 0;
      let longitude = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
          });
          if (loc?.coords) {
            latitude = loc.coords.latitude;
            longitude = loc.coords.longitude;
          }
        }
      } catch (locErr) {
        logger.warn('Could not get device location during registration', locErr);
      }

      await ApiService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialization: specializationToSend, 
        phoneNumber: formData.phone,
        latitude,
        longitude,
        address: 'Not specified',
      });
      
      analytics.trackRegister('email', 'doctor', true);
      
      try { 
        eventBus.emit('doctorCreated'); 
      } catch (err) {
        logger.warn('Failed to emit doctorCreated event', err);
      }

      Alert.alert(
        t.success, 
        t.registrationCreatedMessage,
        [{ text: 'OK', onPress: () => navigation.replace('DoctorLogin') }]
      );
    } catch (error: any) {
      logger.error('❌ Registration error:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || t.registrationFailedDefault;
      
      analytics.trackRegister('email', 'doctor', false, errorMessage);
      
      Alert.alert(t.registrationFailedTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedSpecialtyObj = SPECIALTIES.find(s => s.value === formData.specialty);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressStep, registrationStep >= 1 && styles.progressStepActive]}>
        <Text style={styles.progressStepNumber}>1</Text>
      </View>
      <View style={[styles.progressLine, registrationStep >= 2 && styles.progressLineActive]} />
      <View style={[styles.progressStep, registrationStep >= 2 && styles.progressStepActive]}>
        <Text style={styles.progressStepNumber}>2</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={[styles.stepTitle, isRTL && { textAlign: 'right' }]}>
        Personal Information
      </Text>
      
      <InputField 
        label={t.name} 
        placeholder="Dr. John Doe" 
        value={formData.name} 
        onChangeText={(v) => updateField('name', v)} 
        icon="person" 
        error={errors.name}  
        autoFocus
      />
      
      <InputField 
        label={t.email} 
        placeholder="doctor@example.com" 
        value={formData.email} 
        onChangeText={(v) => updateField('email', v)} 
        keyboardType="email-address" 
        autoCapitalize="none" 
        icon="mail" 
        error={errors.email} 
      />
      
      <InputField 
        label={t.phone} 
        placeholder="0123456789" 
        value={formData.phone} 
        onChangeText={(v) => updateField('phone', v)} 
        keyboardType="phone-pad" 
        icon="call" 
        error={errors.phone} 
      />

      <CustomButton 
        title="Next" 
        onPress={handleNextStep} 
        variant="secondary" 
        size="large" 
        fullWidth 
        icon="arrow-forward"
      />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={[styles.stepTitle, isRTL && { textAlign: 'right' }]}>
        Professional Details
      </Text>

      {/* SPECIALTY PICKER */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t.specialty} *</Text>
        <TouchableOpacity 
          style={[
            styles.pickerButton,
            errors.specialty && styles.pickerButtonError,
            isRTL && { flexDirection: 'row-reverse' }
          ]}
          onPress={() => setSpecialtyModalVisible(true)}
        >
          <View style={[styles.pickerContent, isRTL && { flexDirection: 'row-reverse' }]}>
            {selectedSpecialtyObj ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: selectedSpecialtyObj.color }]}>
                  <Ionicons name={selectedSpecialtyObj.icon} size={ms(20)} color="#FFFFFF" />
                </View>
                <Text style={[styles.pickerText, isRTL && { textAlign: 'right' }]}>
                  {t[selectedSpecialtyObj.value as keyof typeof t]}
                </Text>
              </>
            ) : (
              <Text style={[styles.placeholderText, isRTL && { textAlign: 'right' }]}>
                Select your specialty
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={ms(20)} color={colors.textSecondary} />
        </TouchableOpacity>
        {errors.specialty && <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errors.specialty}</Text>}
      </View>
      
      <InputField 
        label={t.password} 
        placeholder="Enter secure password" 
        value={formData.password} 
        onChangeText={(v) => updateField('password', v)} 
        onFocus={() => setShowPasswordStrength(true)}
        isPassword 
        icon="lock-closed" 
        error={errors.password} 
      />

      {/* PASSWORD STRENGTH INDICATOR */}
      {showPasswordStrength && formData.password && (
        <View style={styles.passwordStrengthContainer}>
          <View style={styles.strengthBar}>
            <View 
              style={[
                styles.strengthBarFill, 
                { 
                  width: `${passwordStrength.percentage}%`,
                  backgroundColor: 
                    passwordStrength.percentage < 50 ? colors.error :
                    passwordStrength.percentage < 75 ? colors.warning :
                    colors.success
                }
              ]} 
            />
          </View>
          <View style={styles.requirementsList}>
            {passwordStrength.requirements.map(req => (
              <View key={req.id} style={styles.requirementItem}>
                <Ionicons 
                  name={req.passed ? "checkmark-circle" : "close-circle"} 
                  size={ms(16)} 
                  color={req.passed ? colors.success : colors.textLight} 
                />
                <Text style={[
                  styles.requirementText,
                  req.passed && styles.requirementTextPassed
                ]}>
                  {req.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <InputField 
        label={t.confirmPassword} 
        placeholder="Confirm your password" 
        value={formData.confirmPassword} 
        onChangeText={(v) => updateField('confirmPassword', v)} 
        isPassword 
        icon="lock-closed" 
        error={errors.confirmPassword} 
      />

      <View style={styles.buttonRow}>
        <CustomButton 
          title="Back" 
          onPress={handlePreviousStep} 
          variant="outline" 
          size="large" 
          style={styles.halfButton}
          icon="arrow-back"
        />
        <CustomButton 
          title={t.createAccount} 
          onPress={handleRegister} 
          variant="secondary" 
          size="large" 
          loading={loading} 
          style={styles.halfButton}
        />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={ms(24)} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t.createAccount}</Text>
          <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
            Join our network of healthcare professionals
          </Text>

          {renderProgressBar()}

          {registrationStep === 1 ? renderStep1() : renderStep2()}
          
          <View style={[styles.footer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
              <Text style={styles.signInText}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ENHANCED SPECIALTY MODAL */}
      <Modal
        visible={specialtyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && { textAlign: 'right' }]}>
                Select Specialty
              </Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)}>
                <Ionicons name="close" size={ms(24)} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={ms(20)} color={colors.textSecondary} />
              <InputField
                placeholder="Search specialties..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {filteredSpecialties.length > 0 ? (
                filteredSpecialties.map((specialty) => (
                  <TouchableOpacity
                    key={specialty.value}
                    style={[
                      styles.specialtyOption,
                      formData.specialty === specialty.value && styles.specialtyOptionSelected
                    ]}
                    onPress={() => {
                      updateField('specialty', specialty.value);
                      setSpecialtyModalVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: specialty.color }]}>
                      <Ionicons name={specialty.icon} size={ms(24)} color="#FFFFFF" />
                    </View>
                    <View style={styles.specialtyTextContainer}>
                      <Text style={styles.specialtyOptionText}>
                        {t[specialty.value as keyof typeof t]}
                      </Text>
                      <Text style={styles.specialtyCategory}>{specialty.category}</Text>
                    </View>
                    {formData.specialty === specialty.value && (
                      <Ionicons name="checkmark-circle" size={ms(24)} color={colors.success} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={ms(48)} color={colors.textLight} />
                  <Text style={styles.emptyStateText}>No specialties found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    backButton: {
      marginTop: SPACING.md,
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontSize: FONT_SIZES.base,
      color: colors.textSecondary,
      marginBottom: SPACING.xl,
    },
    stepTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.lg,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xl,
      paddingHorizontal: SPACING.xl,
    },
    progressStep: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressStepActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    progressStepNumber: {
      fontSize: FONT_SIZES.base,
      fontWeight: 'bold',
      color: colors.white,
    },
    progressLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: SPACING.sm,
    },
    progressLineActive: {
      backgroundColor: colors.secondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: SPACING.md,
    },
    halfButton: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: SPACING.xl,
    },
    footerText: {
      fontSize: FONT_SIZES.base,
      color: colors.textSecondary,
    },
    signInText: {
      fontSize: FONT_SIZES.base,
      color: colors.secondary,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: SPACING.md,
    },
    label: {
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      minHeight: ms(52),
    },
    pickerButtonError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    pickerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconCircle: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    pickerText: {
      fontSize: FONT_SIZES.base,
      color: colors.text,
      fontWeight: '500',
    },
    placeholderText: {
      fontSize: FONT_SIZES.base,
      color: colors.textLight,
    },
    errorText: {
      fontSize: FONT_SIZES.xs,
      color: colors.error,
      marginTop: SPACING.xs,
      marginLeft: SPACING.xs,
    },
    passwordStrengthContainer: {
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    strengthBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      marginBottom: SPACING.sm,
    },
    strengthBarFill: {
      height: '100%',
      borderRadius: RADIUS.sm,
    },
    requirementsList: {
      gap: SPACING.xs,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    requirementText: {
      fontSize: FONT_SIZES.xs,
      color: colors.textLight,
    },
    requirementTextPassed: {
      color: colors.success,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      maxHeight: '85%',
      ...SHADOWS.large,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginBottom: 0,
    },
    modalScroll: {
      maxHeight: ms(450),
    },
    specialtyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    specialtyOptionSelected: {
      backgroundColor: colors.background,
    },
    specialtyTextContainer: {
      flex: 1,
      marginLeft: SPACING.sm,
    },
    specialtyOptionText: {
      fontSize: FONT_SIZES.base,
      color: colors.text,
      fontWeight: '500',
    },
    specialtyCategory: {
      fontSize: FONT_SIZES.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xxl,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.base,
      color: colors.textLight,
      marginTop: SPACING.md,
    },
  });