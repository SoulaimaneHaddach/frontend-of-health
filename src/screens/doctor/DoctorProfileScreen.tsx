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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { CustomButton } from '../../components/CustomButton';
import { InputField } from '../../components/InputField';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import ApiService, { DoctorRequestDto } from '../../services/api';

// ==========================================
// TYPES & INTERFACES
// ==========================================

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
}

// ==========================================
// CONSTANTS
// ==========================================

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

// Default location for Tétouan, Morocco
const DEFAULT_LOCATION: LocationData = {
  latitude: 35.7595,
  longitude: -5.8337,
  address: '',
  city: 'Tétouan',
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Custom alert helper that will use our custom modal
 */
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

/**
 * Validates email format using regex
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (international format)
 */
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates all profile form fields
 */
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

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

/**
 * Info card component for displaying profile information
 */
const InfoCard: React.FC<{ 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  isDark: boolean;
}> = React.memo(({ icon, label, value, isDark }) => {
  const styles = createStyles(isDark);
  
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={isDark ? COLORS.primary : COLORS.primary} />
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
}> = React.memo(({ specialty, isSelected, onPress, isDark }) => {
  const styles = createStyles(isDark);
  
  return (
    <TouchableOpacity
      style={[styles.specialtyOption, isSelected && styles.specialtyOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: specialty.color }]}>
        <Ionicons name={specialty.icon} size={24} color={COLORS.white} />
      </View>
      <Text style={styles.specialtyOptionText}>{specialty.label}</Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
      )}
    </TouchableOpacity>
  );
});

/**
 * Loading overlay component
 */
const LoadingOverlay: React.FC<{ visible: boolean; message?: string; isDark: boolean }> = ({ visible, message, isDark }) => {
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
      backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      ...SHADOWS.large,
    },
    message: {
      marginTop: SPACING.md,
      fontSize: FONT_SIZES.base,
      color: isDark ? COLORS.darkText : COLORS.textPrimary,
      fontWeight: '500',
    },
  });

  return (
    <View style={overlayStyles.overlay}>
      <View style={overlayStyles.card}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
  const { isDarkMode, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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
  });

  // ========== ANIMATIONS ==========
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  // ========== EFFECTS ==========
  
  /**
   * Load profile data on component mount
   */
  useEffect(() => {
    loadProfile();
  }, []);

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

  // ========== MEMOIZED VALUES ==========
  
  /**
   * Get selected specialty object based on current specialization
   */
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
    } catch (err: any) {
      console.error('❌ Fetch profile error:', err.response || err);
      
      if (err.response?.status === 401) {
        showCustomAlert(setAlertConfig, 'Session Expired', 'Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              ApiService.logout();
              navigation.replace('Welcome');
            }
          }
        ]);
      } else {
        showCustomAlert(setAlertConfig, 'Error', 'Failed to load profile. Please try again.', [
          { text: 'Retry', onPress: loadProfile },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [navigation]);

  /**
   * Handle profile save with validation
   */
  const handleSave = useCallback(async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validate all fields
    const errors = validateProfileData(profileData);
    setValidationErrors(errors);

    // If there are validation errors, show alert and stop
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showCustomAlert(setAlertConfig, 'Validation Error', firstError);
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
      };

      console.log('💾 Saving profile:', payload);
      await ApiService.updateMyProfile(payload);
      
      setIsEditing(false);
      setValidationErrors({});
      
      showCustomAlert(setAlertConfig, 'Success', 'Profile updated successfully! ✓');
    } catch (err: any) {
      console.error('❌ Profile update error:', err.response || err);
      
      if (err.response?.status === 401) {
        showCustomAlert(setAlertConfig, 'Unauthorized', 'Your session has expired. Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              ApiService.logout();
              navigation.replace('Welcome');
            }
          }
        ]);
      } else {
        const errorMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
        showCustomAlert(setAlertConfig, 'Update Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [profileData, navigation]);

  /**
   * Handle logout with confirmation
   */
  const handleLogout = useCallback(() => {
    showCustomAlert(setAlertConfig, 'Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            // Ensure tokens/storage are cleared before navigating
            await ApiService.logout();
            // Small delay to ensure storage flush on some devices
            setTimeout(() => {
              setLoading(false);
              navigation.replace('Welcome');
            }, 150);
          } catch (err) {
            setLoading(false);
            console.error('Logout failed', err);
            showCustomAlert(setAlertConfig, 'Logout Failed', 'Unable to logout. Please try again.');
          }
        },
      },
    ]);
  }, [navigation]);

  /**
   * Pick current location using GPS
   */
  const handlePickLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        showCustomAlert(setAlertConfig, 'Permission Denied', 'Location permission is required to use your current location.', [
          { text: 'OK', style: 'default' },
          { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
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

      showCustomAlert(setAlertConfig, 'Success', 'Location updated! Remember to save changes.');
    } catch (error) {
      console.error('Location error:', error);
      showCustomAlert(setAlertConfig, 'Error', 'Failed to get your location. Please try again or select manually on the map.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  /**
   * Handle map press to update location
   */
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

  /**
   * Toggle edit mode
   */
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      // Cancel editing - reset validation errors
      setValidationErrors({});
    }
    setIsEditing(prev => !prev);
  }, [isEditing]);

  /**
   * Handle specialty selection
   */
  const handleSpecialtySelect = useCallback((specialty: Specialty) => {
    setProfileData(prev => ({ ...prev, specialization: specialty.label }));
    setSpecialtyModalVisible(false);
    setValidationErrors(prev => ({ ...prev, specialization: undefined }));
  }, []);

  /**
   * Toggle dark mode
   */
  const toggleDarkModeLocal = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // ========== STYLES ==========
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  // ========== RENDER ==========

  // Loading state
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor={isDarkMode ? COLORS.darkBg : COLORS.white} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? COLORS.darkBg : COLORS.white} 
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
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? COLORS.darkText : COLORS.textPrimary} 
            />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>My Profile</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleDarkModeLocal} style={styles.iconButton}>
              <Ionicons 
                name={isDarkMode ? "sunny" : "moon"} 
                size={22} 
                color={isDarkMode ? COLORS.darkText : COLORS.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleEditMode} style={styles.iconButton}>
              <Ionicons 
                name={isEditing ? 'close' : 'create'} 
                size={24} 
                color={isEditing ? COLORS.error : COLORS.primary} 
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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>
            <Text style={styles.profileName}>{profileData.name || 'Doctor'}</Text>
            {selectedSpecialtyObj && (
              <View style={styles.specialtyBadge}>
                <Ionicons name={selectedSpecialtyObj.icon} size={16} color={COLORS.white} />
                <Text style={styles.specialtyBadgeText}>{selectedSpecialtyObj.label}</Text>
              </View>
            )}
          </View>

          {/* Profile Content */}
          {isEditing ? (
            // ========== EDIT MODE ==========
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <InputField 
                label="Full Name" 
                placeholder="Dr. John Doe"
                value={profileData.name} 
                onChangeText={(v) => {
                  setProfileData({ ...profileData, name: v });
                  setValidationErrors(prev => ({ ...prev, name: undefined }));
                }}
                icon="person"
                error={validationErrors.name}
              />

              {/* Specialty Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specialty *</Text>
                <TouchableOpacity 
                  style={[
                    styles.pickerButton,
                    validationErrors.specialization && styles.inputError
                  ]}
                  onPress={() => setSpecialtyModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickerContent}>
                    {selectedSpecialtyObj ? (
                      <>
                        <View style={[styles.iconCircle, { backgroundColor: selectedSpecialtyObj.color }]}>
                          <Ionicons name={selectedSpecialtyObj.icon} size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.pickerText}>{selectedSpecialtyObj.label}</Text>
                      </>
                    ) : (
                      <Text style={styles.placeholderText}>Select your specialty</Text>
                    )}
                  </View>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary} 
                  />
                </TouchableOpacity>
                {validationErrors.specialization && (
                  <Text style={styles.errorText}>{validationErrors.specialization}</Text>
                )}
              </View>
              
              <InputField 
                label="Email" 
                placeholder="doctor@example.com"
                value={profileData.email} 
                onChangeText={(v) => {
                  setProfileData({ ...profileData, email: v });
                  setValidationErrors(prev => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address" 
                autoCapitalize="none"
                icon="mail"
                error={validationErrors.email}
              />
              
              <InputField 
                label="Phone" 
                placeholder="+212 123 456 789"
                value={profileData.phoneNumber} 
                onChangeText={(v) => {
                  setProfileData({ ...profileData, phoneNumber: v });
                  setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }}
                keyboardType="phone-pad" 
                icon="call"
                error={validationErrors.phoneNumber}
              />

              <Text style={styles.sectionTitle}>Clinic Location</Text>
              
              <InputField 
                label="Address" 
                placeholder="Street, Building"
                value={profileData.location.address} 
                onChangeText={(v) => {
                  setProfileData({ ...profileData, location: { ...profileData.location, address: v } });
                  setValidationErrors(prev => ({ ...prev, address: undefined }));
                }}
                icon="location"
                error={validationErrors.address}
              />
              
              <InputField 
                label="City" 
                placeholder="City name"
                value={profileData.location.city} 
                onChangeText={(v) => {
                  setProfileData({ ...profileData, location: { ...profileData.location, city: v } });
                  setValidationErrors(prev => ({ ...prev, city: undefined }));
                }}
                icon="business"
                error={validationErrors.city}
              />

              <Text style={styles.mapLabel}>📍 Pin Your Clinic Location</Text>
              <Text style={styles.mapHint}>Tap on the map to set your clinic location</Text>
              
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton
              >
                <Marker 
                  coordinate={{
                    latitude: profileData.location.latitude,
                    longitude: profileData.location.longitude,
                  }}
                  title="Your Clinic"
                  description={profileData.location.address || 'Clinic Location'}
                  pinColor={COLORS.primary}
                />
              </MapView>

              <CustomButton 
                title={locationLoading ? " Getting Location..." : "Use My Current Location"}
                onPress={handlePickLocation} 
                variant="secondary" 
                size="large" 
                fullWidth 
                style={{ marginBottom: SPACING.md }} 
                loading={locationLoading}
                disabled={locationLoading}
              />

              <CustomButton 
                title="Save Changes" 
                onPress={handleSave} 
                variant="primary" 
                size="large" 
                fullWidth 
                loading={loading}
                disabled={loading}
              />
            </View>
          ) : (
            // ========== VIEW MODE ==========
            <View style={styles.infoContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <InfoCard icon="person" label="Name" value={profileData.name} isDark={isDarkMode} />
              <InfoCard icon="fitness" label="Specialization" value={profileData.specialization} isDark={isDarkMode} />
              <InfoCard icon="mail" label="Email" value={profileData.email} isDark={isDarkMode} />
              <InfoCard icon="call" label="Phone" value={profileData.phoneNumber} isDark={isDarkMode} />
              
              <Text style={styles.sectionTitle}>Clinic Location</Text>
              <InfoCard icon="location" label="Address" value={profileData.location.address} isDark={isDarkMode} />
              <InfoCard icon="business" label="City" value={profileData.location.city} isDark={isDarkMode} />

              {/* Map Preview */}
              <View style={styles.mapPreviewContainer}>
                <MapView
                  style={styles.mapPreview}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker 
                    coordinate={{
                      latitude: profileData.location.latitude,
                      longitude: profileData.location.longitude,
                    }}
                    title="Your Clinic"
                    description={profileData.location.address}
                  />
                </MapView>
              </View>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
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
              <Text style={styles.modalTitle}>Select Specialty</Text>
              <TouchableOpacity 
                onPress={() => setSpecialtyModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? COLORS.darkText : COLORS.textPrimary} 
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
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal - FIXED POSITIONING */}
      <Modal
        visible={alertConfig.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      >
        <View style={styles.alertOverlay}>
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
        </View>
      </Modal>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Saving profile..." isDark={isDarkMode} />
    </SafeAreaView>
  );
};

// ==========================================
// STYLES
// ==========================================

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: isDark ? COLORS.darkBg : COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, 
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: isDark ? COLORS.darkBorder : COLORS.borderLight,
    ...SHADOWS.small,
  },
  headerTitle: { 
    fontSize: FONT_SIZES.xl, 
    fontWeight: 'bold', 
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
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
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  specialtyBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  formContainer: {
    paddingHorizontal: SPACING.lg,
  },
  infoContainer: {
    paddingHorizontal: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: isDark ? COLORS.darkBg : COLORS.background,
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
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    fontWeight: '500',
  },
  mapLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  mapHint: {
    fontSize: FONT_SIZES.xs,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
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
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.error,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? COLORS.darkBorder : COLORS.border,
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
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textLight,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
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
    borderBottomColor: isDark ? COLORS.darkBorder : COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
  },
  modalScroll: {
    maxHeight: 500,
  },
  specialtyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? COLORS.darkBorder : COLORS.borderLight,
  },
  specialtyOptionSelected: {
    backgroundColor: isDark ? COLORS.darkBg : COLORS.background,
  },
  specialtyOptionText: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
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
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  loadingMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    fontWeight: '500',
  },
  // Custom Alert Modal Styles - CENTERED & PROPERLY POSITIONED
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertContainer: {
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    minWidth: 280,
    maxWidth: '90%',
    ...SHADOWS.large,
  },
  alertTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
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
    backgroundColor: isDark ? COLORS.darkPrimary : COLORS.primary,
    alignItems: 'center',
  },
  alertButtonCancel: {
    backgroundColor: isDark ? COLORS.darkBorder : COLORS.border,
  },
  alertButtonDestructive: {
    backgroundColor: COLORS.error,
  },
  alertButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  alertButtonTextCancel: {
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
  },
  alertButtonTextDestructive: {
    color: COLORS.white,
  },
});

