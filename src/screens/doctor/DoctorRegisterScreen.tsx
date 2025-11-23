// src/screens/doctor/DoctorRegisterScreen.tsx - FIXED
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
  Modal 
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
import { eventBus } from '../../shared/services/eventBus';
import logger from '../../shared/utils/logger';

type DoctorRegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SPECIALTIES = [
  { value: 'hearing', icon: 'ear' as const, color: '#9B59B6' },
  { value: 'orthopedic', icon: 'fitness' as const, color: '#F39C12' },
  { value: 'brain', icon: 'pulse' as const, color: '#E74C3C' },
  { value: 'cardiology', icon: 'heart' as const, color: '#E91E63' },
  { value: 'dermatology', icon: 'color-palette' as const, color: '#FF9800' },
  { value: 'pediatrics', icon: 'people' as const, color: '#4CAF50' },
  { value: 'ophthalmology', icon: 'eye' as const, color: '#00BCD4' },
  { value: 'psychiatry', icon: 'happy' as const, color: '#9C27B0' },
  { value: 'gastroenterology', icon: 'restaurant' as const, color: '#795548' },
  { value: 'endocrinology', icon: 'flask' as const, color: '#607D8B' },
  { value: 'neurology', icon: 'pulse' as const, color: '#E74C3C' },
  { value: 'ent', icon: 'volume-high' as const, color: '#3F51B5' },
  { value: 'urology', icon: 'water-outline' as const, color: '#2196F3' },
  { value: 'nephrology', icon: 'water' as const, color: '#03A9F4' },
  { value: 'oncology', icon: 'bandage' as const, color: '#F44336' },
  { value: 'gynecology', icon: 'woman' as const, color: '#E91E63' },
  { value: 'dentistry', icon: 'hammer' as const, color: '#9E9E9E' },
  { value: 'pulmonology', icon: 'cloud' as const, color: '#B0BEC5' },
  { value: 'rheumatology', icon: 'trending-up' as const, color: '#FF5722' },
  { value: 'allergy', icon: 'medkit' as const, color: '#CDDC39' },
];

export const DoctorRegisterScreen: React.FC<DoctorRegisterScreenProps> = ({ navigation }) => {
  const { t, isRTL } = useLanguage();
  const { isDarkMode, colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
  const analytics = useAnalytics();

  const updateField = (field: string, value: string) => {
    // Use functional updates to avoid stale closures when multiple inputs update quickly
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t.requiredField;
    if (!formData.email.trim()) newErrors.email = t.requiredField;
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t.invalidEmail;
    if (!formData.phone.trim()) newErrors.phone = t.requiredField;
    if (!formData.specialty.trim()) newErrors.specialty = t.requiredField;
    if (!formData.password) newErrors.password = t.requiredField;
    else if (formData.password.length < 6) newErrors.password = t.passwordTooShort;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t.passwordsDontMatch;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const selectedSpecialty = SPECIALTIES.find(s => s.value === formData.specialty);
      const specializationToSend = (selectedSpecialty ? t[selectedSpecialty.value as keyof typeof t] : formData.specialty) || formData.specialty;

        logger.debug('🔍 Sending registration data:', {
        name: formData.name,
        email: formData.email,
        specialization: specializationToSend,
        phoneNumber: formData.phone,
      });

      // Try to get device location to set doctor's clinic coordinates.
      let latitude = 0;
      let longitude = 0;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc && loc.coords) {
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
      
      // Track successful registration
      analytics.trackRegister('email', 'doctor', true);

      // Notify app that a doctor was created so map/list can refresh
      try { eventBus.emit('doctorCreated'); } catch { }

      Alert.alert(t.success, t.registrationCreatedMessage);
      navigation.replace('DoctorLogin');
    } catch (error: any) {
      logger.error('❌ Registration error:', error.response?.data || error.message);
      
      // Track failed registration
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }} 
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={ms(24)} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, isRTL && { textAlign: 'right' }, { color: colors.text }]}>{t.createAccount}</Text>
          <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }, { color: colors.textSecondary }]}>{t.doctorDescription}</Text>

          <InputField 
            label={t.name} 
            placeholder="Dr. John Doe" 
            value={formData.name} 
            onChangeText={(v) => updateField('name', v)} 
            icon="person" 
            error={errors.name} 
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
            placeholder="+212 123 456 789" 
            value={formData.phone} 
            onChangeText={(v) => updateField('phone', v)} 
            keyboardType="phone-pad" 
            icon="call" 
            error={errors.phone} 
          />
          
          {/*  SPECIALTY PICKER */}
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
                      <Ionicons name={selectedSpecialtyObj.icon} size={ms(20)} color={colors.white} />
                    </View>
                    <Text style={[styles.pickerText, isRTL && { textAlign: 'right' }]}>{t[selectedSpecialtyObj.value as keyof typeof t]}</Text>
                  </>
                ) : (
                  <Text style={[styles.placeholderText, isRTL && { textAlign: 'right' }]}>{t.specialty}</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={ms(20)} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.specialty && <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errors.specialty}</Text>}
          </View>
          
          <InputField 
            label={t.password} 
            placeholder={t.password} 
            value={formData.password} 
            onChangeText={(v) => updateField('password', v)} 
            isPassword 
            icon="lock-closed" 
            error={errors.password} 
          />
          
          <InputField 
            label={t.confirmPassword} 
            placeholder={t.confirmPassword} 
            value={formData.confirmPassword} 
            onChangeText={(v) => updateField('confirmPassword', v)} 
            isPassword 
            icon="lock-closed" 
            error={errors.confirmPassword} 
          />

          <CustomButton 
            title={t.createAccount} 
            onPress={handleRegister} 
            variant="secondary" 
            size="large" 
            fullWidth 
            loading={loading} 
          />
          
          <View style={[styles.footer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
              <Text style={styles.signInText}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/*  SPECIALTY MODAL */}
      <Modal
        visible={specialtyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && { textAlign: 'right' }]}>{t.specialty}</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)}>
                <Ionicons name="close" size={ms(24)} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty.value}
                  style={[
                    styles.specialtyOption,
                    formData.specialty === specialty.value && styles.specialtyOptionSelected
                  ]}
                  onPress={() => {
                    updateField('specialty', specialty.value);
                    setSpecialtyModalVisible(false);
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: specialty.color }]}>
                    <Ionicons name={specialty.icon} size={ms(24)} color={colors.white} />
                  </View>
                  <Text style={styles.specialtyOptionText}>{t[specialty.value as keyof typeof t]}</Text>
                  {formData.specialty === specialty.value && (
                    <Ionicons name="checkmark-circle" size={ms(24)} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))}
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
    title: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    subtitle: {
      fontSize: FONT_SIZES.base,
      color: colors.textSecondary,
      marginBottom: SPACING.xl,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: SPACING.lg,
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
      width: ms(32),
      height: ms(32),
      borderRadius: ms(RADIUS.full),
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      maxHeight: '80%',
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
    modalScroll: {
      maxHeight: ms(500),
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
    specialtyOptionText: {
      fontSize: FONT_SIZES.base,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
      marginLeft: SPACING.sm,
    },
  });
