// src/screens/doctor/DoctorProfileScreen.tsx - ENHANCED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Region } from 'react-native-maps';
import OSMMap from '../../components/OSMMap';
import ModernTabBar, { TabKey } from './components/ModernTabBar';
import InfoSection from './components/InfoSection';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import HoursSection from './components/HoursSection';
import LocationSection from './components/LocationSection';
import * as Location from 'expo-location';
import { CustomButton } from '../../shared/components/CustomButton';
// InputField not used directly in this screen; child components handle inputs
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAnalytics } from '../../shared/hooks/useAnalytics';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import ApiService, { DoctorRequestDto, WorkingHours } from '../../services/api';

type DoctorProfileScreenProps = { 
  navigation: NativeStackNavigationProp<any> 
};

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

interface ProfileData {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phoneNumber: string;
  location: LocationData;
  about?: string; 
  hours?: WorkingHours[]; 
  services?: string[];
}

interface Specialty {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  specialization?: string;
  address?: string;
  city?: string;
  about?: string;
  hours?: string;
  services?: string;
}

const SPECIALTIES: Specialty[] = [
  { label: 'Hearing', value: 'hearing', icon: 'ear', color: '#9B59B6' },
  { label: 'Orthopedic', value: 'orthopedic', icon: 'fitness', color: '#F39C12' },
  { label: 'Brain', value: 'brain', icon: 'pulse', color: '#E74C3C' },
  { label: 'Cardiology', value: 'cardiology', icon: 'heart', color: '#E91E63' },
  { label: 'Dermatology', value: 'dermatology', icon: 'color-palette', color: '#FF9800' },
  { label: 'Pediatrics', value: 'pediatrics', icon: 'people', color: '#4CAF50' },
  { label: 'Ophthalmology', value: 'ophthalmology', icon: 'eye', color: '#00BCD4' },
  { label: 'Psychiatry', value: 'psychiatry', icon: 'happy', color: '#9C27B0' },
  { label: 'Gastroenterology', value: 'gastroenterology', icon: 'restaurant', color: '#795548' },
  { label: 'Endocrinology', value: 'endocrinology', icon: 'flask', color: '#607D8B' },
  { label: 'Neurology', value: 'neurology', icon: 'pulse', color: '#E74C3C' },
  { label: 'ENT', value: 'ent', icon: 'volume-high', color: '#3F51B5' },
  { label: 'Urology', value: 'urology', icon: 'water-outline', color: '#2196F3' },
  { label: 'Nephrology', value: 'nephrology', icon: 'water', color: '#03A9F4' },
  { label: 'Oncology', value: 'oncology', icon: 'bandage', color: '#F44336' },
  { label: 'Gynecology', value: 'gynecology', icon: 'woman', color: '#E91E63' },
  { label: 'Dentistry', value: 'dentistry', icon: 'hammer', color: '#9E9E9E' },
  { label: 'Pulmonology', value: 'pulmonology', icon: 'cloud', color: '#B0BEC5' },
  { label: 'Rheumatology', value: 'rheumatology', icon: 'trending-up', color: '#FF5722' },
  { label: 'Allergy', value: 'allergy', icon: 'medkit', color: '#CDDC39' },
];

// Helper function to get translated specialty label
const getTranslatedSpecialty = (value: string, t: any): string => {
  const specialtyKey = value.toLowerCase() as keyof typeof t;
  return (t[specialtyKey] as string) || value;
};

// Default location for Tétouan, Morocco
const DEFAULT_LOCATION: LocationData = {
  latitude: 35.7595,
  longitude: -5.8337,
  address: '',
  city: 'Tétouan',
};

const showCustomAlert = (
  setAlertConfig: React.Dispatch<React.SetStateAction<any>>,
  title: string,
  message: string,
  buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [{ text: 'OK' }]
) => {
  setAlertConfig({
    visible: true,
    title,
    message,
    buttons,
  });
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateProfileData = (data: ProfileData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!isValidPhoneNumber(data.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }

  if (!data.specialization.trim()) {
    errors.specialization = 'Specialization is required';
  }

  if (!data.location.address.trim()) {
    errors.address = 'Address is required';
  }

  if (!data.location.city.trim()) {
    errors.city = 'City is required';
  }

  return errors;
};

const InfoCard: React.FC<{ 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  isDark: boolean;
}> = React.memo(({ icon, label, value, isDark }) => {
  const { colors: localColors } = useTheme();
  const styles = createStyles(localColors, isDark);

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={localColors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );
});

/**
 * Specialty option in modal
 */
const SpecialtyOption: React.FC<{
  specialty: Specialty;
  isSelected: boolean;
  onPress: () => void;
  isDark: boolean;
  translatedLabel: string;
  isRTL: boolean;
}> = React.memo(({ specialty, isSelected, onPress, isDark, translatedLabel, isRTL }) => {
  const { colors: localColors } = useTheme();
  const styles = createStyles(localColors, isDark);

  return (
    <TouchableOpacity
      style={[styles.specialtyOption, isSelected && styles.specialtyOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: specialty.color }]}>
        <Ionicons name={specialty.icon} size={24} color={localColors.white} />
      </View>
      <Text style={[styles.specialtyOptionText, isRTL && { textAlign: 'right' }]}>{translatedLabel}</Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={localColors.success} />
      )}
    </TouchableOpacity>
  );
});

/**
 * Loading overlay component
 */
const LoadingOverlay: React.FC<{ visible: boolean; message?: string; isDark: boolean }> = ({ visible, message, isDark }) => {
  const { colors: localColors } = useTheme();

  if (!visible) return null;

  const overlayStyles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    card: {
      backgroundColor: localColors.card,
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      ...SHADOWS.large,
    },
    message: {
      marginTop: SPACING.md,
      fontSize: FONT_SIZES.base,
      color: localColors.textSecondary,
      fontWeight: '500',
    },
  });

  return (
    <View style={overlayStyles.overlay}>
      <View style={overlayStyles.card}>
        <ActivityIndicator size="large" color={localColors.primary} />
        {message && <Text style={overlayStyles.message}>{message}</Text>}
      </View>
    </View>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation }) => {
  // ========== STATE MANAGEMENT ==========
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const analytics = useAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [newService, setNewService] = useState(''); // For adding new services
  const [hoursModalVisible, setHoursModalVisible] = useState(false); // Modal for editing hours
  const [activeTab, setActiveTab] = useState<TabKey>('Info');
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });
  
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    name: '',
    specialization: '',
    email: '',
    phoneNumber: '',
    location: DEFAULT_LOCATION,
    about: '',
    hours: [],
    services: [],
  });

  // ========== ANIMATIONS ==========
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  // ========== EFFECTS ==========

  /**
   * Load profile data from API
   */
  const loadProfile = useCallback(async () => {
    try {
      setInitialLoading(true);
      const data = await ApiService.getMyProfile();
      
      setProfileData({
        ...data,
        location: data.location || { 
          ...DEFAULT_LOCATION,
          address: data.address || '', 
        }
      });
      
      setInitialLoading(false);
    } catch (err: any) {
      console.error('❌ Fetch profile error:', err.response || err);
      setInitialLoading(false);
      
      if (err.response?.status === 401) {
        showCustomAlert(setAlertConfig, t.sessionExpired, t.sessionExpired, [
          {
            text: t.ok,
            onPress: () => {
              ApiService.logout();
              navigation.replace('Welcome');
            }
          }
        ]);
      } else if (err.response?.status === 500) {
        showCustomAlert(setAlertConfig, t.sessionExpired, t.serverError, [
          { 
            text: t.logout, 
            onPress: () => { ApiService.logout(); navigation.replace('DoctorLogin'); },
            style: 'cancel'
          },
        ]);
      } else {
        showCustomAlert(setAlertConfig, t.error, t.error, [
          { text: t.retry, onPress: loadProfile },
          { text: t.cancel, style: 'cancel', onPress: () => navigation.goBack() }
        ]);
      }
    }
  }, [navigation]);

  /**
   * Load profile data on component mount
   */
  useEffect(() => {
    loadProfile();
    // Track profile view
    analytics.trackProfileViewed();
  }, [loadProfile, analytics]);

  /**
   * Animate content entrance
   */
  useEffect(() => {
    if (!initialLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [initialLoading]);

  const selectedSpecialtyObj = useMemo(() => 
    SPECIALTIES.find(
      s => s.label.toLowerCase() === profileData.specialization.toLowerCase() ||
           s.value === profileData.specialization.toLowerCase()
    ),
    [profileData.specialization]
  );

  /**
   * Map region configuration
   */
  const mapRegion: Region = useMemo(() => ({
    latitude: profileData.location.latitude,
    longitude: profileData.location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [profileData.location.latitude, profileData.location.longitude]);

  // ========== CALLBACKS ==========

  const handleSave = useCallback(async () => {

    Keyboard.dismiss();


    const errors = validateProfileData(profileData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showCustomAlert(setAlertConfig, t.error, firstError);
      return;
    }

    setLoading(true);
    
    try {
      const payload: DoctorRequestDto = {
        email: profileData.email.trim(),
        name: profileData.name.trim(),
        specialization: profileData.specialization,
        phoneNumber: profileData.phoneNumber.trim(),
        location: {
          latitude: profileData.location.latitude,
          longitude: profileData.location.longitude,
          address: profileData.location.address.trim() || 'Not specified',
          city: profileData.location.city.trim() || 'Unknown',
        },
        about: profileData.about?.trim() || '',
        hours: profileData.hours || [],
        services: profileData.services || [],
      };

      console.log('💾 Saving profile:', payload);
      await ApiService.updateMyProfile(payload);
      
      setIsEditing(false);
      setValidationErrors({});
      
      showCustomAlert(setAlertConfig, t.success, t.success);
    } catch (err: any) {
      console.error('❌ Profile update error:', err.response || err);
      
      if (err.response?.status === 401) {
        showCustomAlert(setAlertConfig, t.error, t.sessionExpired, [
          {
            text: t.ok,
            onPress: () => {
              ApiService.logout();
              navigation.replace('Welcome');
            }
          }
        ]);
      } else {
        const errorMsg = err.response?.data?.message || t.error;
        showCustomAlert(setAlertConfig, t.error, errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [profileData, navigation]);


  const handleLogout = useCallback(() => {
    showCustomAlert(setAlertConfig, t.logout, t.logout, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            
            await ApiService.logout();
          
            setTimeout(() => {
              setLoading(false);
              navigation.replace('Welcome');
            }, 150);
          } catch (err) {
            setLoading(false);
            console.error('Logout failed', err);
            showCustomAlert(setAlertConfig, t.error, t.error);
          }
        },
      },
    ]);
  }, [navigation, t]);
  const handlePickLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showCustomAlert(setAlertConfig, t.error, t.error, [
          { text: t.ok, style: 'default' },
          { text: t.ok, onPress: () => Location.requestForegroundPermissionsAsync() }
        ]);
        return;
      }

      // Get current position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Update location in state
      setProfileData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
      }));

      showCustomAlert(setAlertConfig, t.success, t.save);
    } catch (error) {
      console.error('Location error:', error);
      showCustomAlert(setAlertConfig, t.error, t.error);
    } finally {
      setLocationLoading(false);
    }
  }, [t]);


  const handleMapPress = useCallback((e: any) => {
    setProfileData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: e.nativeEvent.coordinate.latitude,
        longitude: e.nativeEvent.coordinate.longitude,
      },
    }));
  }, []);

  const toggleEditMode = useCallback(() => {
    if (isEditing) {
 
      setValidationErrors({});
    }
    setIsEditing(prev => !prev);
  }, [isEditing]);


  const handleSpecialtySelect = useCallback((specialty: Specialty) => {
    setProfileData(prev => ({ ...prev, specialization: specialty.label }));
    setSpecialtyModalVisible(false);
    setValidationErrors(prev => ({ ...prev, specialization: undefined }));
  }, []);

  const toggleDarkModeLocal = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleAddService = useCallback(() => {
    if (newService.trim()) {
      setProfileData(prev => ({
        ...prev,
        services: [...(prev.services || []), newService.trim()]
      }));
      setNewService('');
    }
  }, [newService]);

  const handleRemoveService = useCallback((index: number) => {
    setProfileData(prev => ({
      ...prev,
      services: prev.services?.filter((_, i) => i !== index) || []
    }));
  }, []);
  const handleAddDefaultHours = useCallback(() => {
    const defaultHours: WorkingHours[] = [
      { day: 'Mon - Fri', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Saturday', openTime: '09:00', closeTime: '13:00', isClosed: false },
      { day: 'Sunday', openTime: '', closeTime: '', isClosed: true }
    ];
    setProfileData(prev => ({
      ...prev,
      hours: defaultHours
    }));
  }, []);


  const handleUpdateHours = useCallback((index: number, field: keyof WorkingHours, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      hours: prev.hours?.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      ) || []
    }));
  }, []);

  const handleRemoveHours = useCallback((index: number) => {
    setProfileData(prev => ({
      ...prev,
      hours: prev.hours?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Loading state
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.background}
      />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: SPACING.xxl }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.replace('Home')} activeOpacity={0.7}>
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }, isRTL && { textAlign: 'right' }]}>{t.profile}</Text>
          
          <View style={styles.headerActions}>
            
            <TouchableOpacity onPress={toggleEditMode} style={styles.iconButton}>
              <Ionicons 
                name={isEditing ? 'close' : 'create'} 
                size={24} 
                color={isEditing ? colors.error : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }}
        >
          {/* Profile Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }] }>
              <Text style={[styles.avatarText, { color: colors.white }]}>
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>
            <Text style={[styles.profileName, { color: colors.text }, isRTL && { textAlign: 'right' }]}>{profileData.name || t.name}</Text>
            {selectedSpecialtyObj && (
              <View style={[styles.specialtyBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name={selectedSpecialtyObj.icon} size={16} color={colors.white} />
                <Text style={styles.specialtyBadgeText}>{getTranslatedSpecialty(selectedSpecialtyObj.value, t)}</Text>
              </View>
            )}
            
            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('DoctorBookings')}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.primary }]}>{t.myBookings}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.quickActionText, { color: colors.error }]}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Content */}
          {isEditing ? (
            <View style={styles.formContainer}>
              {/* Modern Tab Switcher */}
              <ModernTabBar
                isDark={isDarkMode}
                activeKey={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { key: 'Info', icon: 'person-outline', label: t.info },
                  { key: 'About', icon: 'document-text-outline', label: t.about },
                  { key: 'Services', icon: 'medical-outline', label: t.services, badge: profileData.services?.length || 0 },
                  { key: 'Hours', icon: 'time-outline', label: t.hours, badge: profileData.hours?.length || 0 },
                  { key: 'Location', icon: 'location-outline', label: t.location },
                ]}
              />

              {/* Info Tab */}
              {activeTab === 'Info' && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <InfoSection
                    isDark={isDarkMode}
                    name={profileData.name}
                    email={profileData.email}
                    phoneNumber={profileData.phoneNumber}
                    selectedSpecialty={selectedSpecialtyObj}
                    errors={{
                      name: validationErrors.name,
                      email: validationErrors.email,
                      phoneNumber: validationErrors.phoneNumber,
                      specialization: validationErrors.specialization,
                    }}
                    onChangeName={(v) => {
                      setProfileData({ ...profileData, name: v });
                      setValidationErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    onChangeEmail={(v) => {
                      setProfileData({ ...profileData, email: v });
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    onChangePhone={(v) => {
                      setProfileData({ ...profileData, phoneNumber: v });
                      setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
                    }}
                    onOpenSpecialtyModal={() => setSpecialtyModalVisible(true)}
                    styles={styles}
                  />
                </Animated.View>
              )}             
              {/* About Tab */}
              {activeTab === 'About' && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <AboutSection
                    isDark={isDarkMode}
                    about={profileData.about || ''}
                    onChangeAbout={(v) => {
                      setProfileData({ ...profileData, about: v });
                      setValidationErrors(prev => ({ ...prev, about: undefined }));
                    }}
                    error={validationErrors.about}
                    styles={styles}
                  />
                </Animated.View>
              )}
              {/* Services Tab */}
              {activeTab === 'Services' && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <ServicesSection
                    isDark={isDarkMode}
                    services={profileData.services || []}
                    newService={newService}
                    onChangeNewService={setNewService}
                    onAddService={handleAddService}
                    onRemoveService={handleRemoveService}
                    styles={styles}
                  />
                </Animated.View>
              )}
              {/* Hours Tab */}
              {activeTab === 'Hours' && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <HoursSection
                    isDark={isDarkMode}
                    hours={profileData.hours || []}
                    onUpdate={handleUpdateHours}
                    onRemove={handleRemoveHours}
                    onAddDefault={handleAddDefaultHours}
                    onAddNew={() => {
                      setProfileData(prev => ({
                        ...prev,
                        hours: [...(prev.hours || []), { day: '', openTime: '', closeTime: '', isClosed: false }],
                      }));
                    }}
                    styles={styles}
                  />
                </Animated.View>
              )}

              {/* Location Tab */}
              {activeTab === 'Location' && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <LocationSection
                    isDark={isDarkMode}
                    location={profileData.location}
                    mapRegion={mapRegion}
                    onChangeAddress={(v) => {
                      setProfileData({ ...profileData, location: { ...profileData.location, address: v } });
                      setValidationErrors(prev => ({ ...prev, address: undefined }));
                    }}
                    onChangeCity={(v) => {
                      setProfileData({ ...profileData, location: { ...profileData.location, city: v } });
                      setValidationErrors(prev => ({ ...prev, city: undefined }));
                    }}
                    onMapPress={handleMapPress}
                    onUseCurrentLocation={handlePickLocation}
                    locationLoading={locationLoading}
                    errors={{ address: validationErrors.address, city: validationErrors.city }}
                    styles={styles}
                  />
                </Animated.View>
              )}

              {/* Sticky Save Button */}
              <View style={styles.saveButtonContainer}>
                <CustomButton 
                  title={t.save} 
                  onPress={handleSave} 
                  variant="primary" 
                  size="large" 
                  fullWidth 
                  loading={loading}
                  disabled={loading}
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.name}</Text>
              <InfoCard icon="person" label={t.name} value={profileData.name} isDark={isDarkMode} />
              <InfoCard icon="fitness" label={t.specialty} value={getTranslatedSpecialty(profileData.specialization.toLowerCase(), t)} isDark={isDarkMode} />
              <InfoCard icon="mail" label={t.email} value={profileData.email} isDark={isDarkMode} />
              <InfoCard icon="call" label={t.phone} value={profileData.phoneNumber} isDark={isDarkMode} />
              <InfoCard icon="location" label={t.address} value={profileData.location.address} isDark={isDarkMode} />
              
              {/* About Section */}
              {profileData.about && (
                <>
                  <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.about}</Text>
                  <View style={styles.infoCard}>
                    <Text style={[styles.infoValue, { lineHeight: 22 }]}>
                      {profileData.about}
                    </Text>
                  </View>
                </>
              )}
              {/* Services Section */}
              {profileData.services && profileData.services.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.servicesOffered}</Text>
                  <View style={styles.servicesContainer}>
                    {profileData.services.map((service, index) => (
                      <View key={index} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {/* Working Hours Section */}
              {profileData.hours && profileData.hours.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.workingHours}</Text>
                  <View style={[styles.infoCard, { padding: 0 }]}>
                    {profileData.hours.map((hour, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.hourDisplayItem,
                          index !== profileData.hours!.length - 1 && styles.hourDisplayBorder
                        ]}
                      >
                        <Text style={styles.hourDisplayDay}>{hour.day}</Text>
                        <Text style={styles.hourDisplayTime}>
                          {hour.isClosed ? t.closed : `${hour.openTime} - ${hour.closeTime}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.clinicLocation}</Text>
              <InfoCard icon="location" label={t.address} value={profileData.location.address} isDark={isDarkMode} />
              <InfoCard icon="business" label={t.location} value={profileData.location.city} isDark={isDarkMode} />

              {/* Map Preview */}
              <View style={styles.mapPreviewContainer}>
                <OSMMap
                  style={styles.mapPreview}
                  initialRegion={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
                  markers={[{ id: profileData.id || 'clinic', latitude: profileData.location.latitude, longitude: profileData.location.longitude, title: 'Your Clinic', description: profileData.location.address, color: colors.primary, label: profileData.name ? profileData.name.charAt(0).toUpperCase() : '' }]}
                />
              </View>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t.logout}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Specialty Selection Modal */}
      <Modal
        visible={specialtyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && { textAlign: 'right' }]}>{t.selectSpecialty}</Text>
              <TouchableOpacity 
                onPress={() => setSpecialtyModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScroll} 
              showsVerticalScrollIndicator={false}
            >
              {SPECIALTIES.map((specialty) => (
                <SpecialtyOption
                  key={specialty.value}
                  specialty={specialty}
                  isSelected={profileData.specialization.toLowerCase() === specialty.label.toLowerCase()}
                  onPress={() => handleSpecialtySelect(specialty)}
                  isDark={isDarkMode}
                  translatedLabel={getTranslatedSpecialty(specialty.value, t)}
                  isRTL={isRTL}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertConfig.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setAlertConfig({ ...alertConfig, visible: false })}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <View style={styles.alertButtonContainer}>
                {alertConfig.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.alertButton,
                      button.style === 'destructive' && styles.alertButtonDestructive,
                      button.style === 'cancel' && styles.alertButtonCancel,
                    ]}
                    onPress={() => {
                      setAlertConfig({ ...alertConfig, visible: false });
                      button.onPress?.();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.alertButtonText,
                        button.style === 'destructive' && styles.alertButtonTextDestructive,
                        button.style === 'cancel' && styles.alertButtonTextCancel,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Saving profile..." isDark={isDarkMode} />
    </SafeAreaView>
  );
};

// ==========================================
// STYLES
// ==========================================

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, 
    backgroundColor: colors.card, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.borderLight,
    ...SHADOWS.small,
  },
  headerTitle: { 
    fontSize: FONT_SIZES.xl, 
    fontWeight: 'bold', 
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: colors.card,
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  specialtyBadgeText: {
    color: colors.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  formContainer: {
    paddingHorizontal: SPACING.lg,
  },
  infoContainer: {
    paddingHorizontal: SPACING.lg,
  },
  // Modern Tab Switcher
  tabScrollContainer: {
    marginBottom: SPACING.lg,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  modernTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.small,
  },
  modernTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...SHADOWS.medium,
  },
  modernTabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modernTabTextActive: {
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  // Modern Card Layout
  modernCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardHint: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  // Sticky Save Button
  saveButtonContainer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    color: colors.text,
    fontWeight: '500',
  },
  mapLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  mapHint: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  map: {
    width: '100%',
    height: 250,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  mapPreviewContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: colors.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: FONT_SIZES.base,
    color: colors.error,
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
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
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
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: colors.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  // Enhanced section card styles
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.lg,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  sectionHint: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  // About section styles
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: colors.background,
    padding: SPACING.sm,
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  // Services section styles
  addServiceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  serviceInputWrapper: {
    flex: 1,
  },
  addServiceButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  addServiceButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  serviceChipText: {
    color: colors.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  // Working hours styles
  hourCard: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dayInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteHourButton: {
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  closedToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  closedToggleLabel: {
    fontSize: FONT_SIZES.sm,
    color: colors.text,
    fontWeight: '500',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: colors.card,
  },
  timeArrow: {
    paddingHorizontal: SPACING.xs,
    paddingTop: 20,
  },
  addHourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addHourButtonText: {
    fontSize: FONT_SIZES.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.base,
    color: colors.text,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateHint: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: colors.card,
    padding: SPACING.sm,
  },
  serviceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addButton: {
    padding: SPACING.xs,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  serviceTagText: {
    color: colors.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  hourItem: {
    backgroundColor: colors.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  timeSeparator: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: SPACING.xs,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  closedText: {
    fontSize: FONT_SIZES.base,
    color: colors.error,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  closedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  closedToggleText: {
    fontSize: FONT_SIZES.sm,
    color: colors.text,
  },
  hourDisplayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  hourDisplayBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hourDisplayDay: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: colors.text,
  },
  hourDisplayTime: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
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
    maxHeight: 500,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    backgroundColor: colors.card,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: colors.text,
    fontWeight: '500',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertContainer: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    minWidth: 280,
    maxWidth: '90%',
    ...SHADOWS.large,
  },
  alertTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING.sm,
  },
  alertButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  alertButtonCancel: {
    backgroundColor: colors.border,
  },
  alertButtonDestructive: {
    backgroundColor: colors.error,
  },
  alertButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: colors.white,
  },
  alertButtonTextCancel: {
    color: colors.text,
  },
  alertButtonTextDestructive: {
    color: colors.white,
  },
});
