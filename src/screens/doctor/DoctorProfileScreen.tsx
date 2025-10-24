// src/screens/doctor/DoctorProfileScreen.tsx - MERGED VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Alert,
  Modal,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { CustomButton } from '../../components/CustomButton';
import { InputField } from '../../components/InputField';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import ApiService, { DoctorRequestDto } from '../../services/api';

type DoctorProfileScreenProps = { navigation: NativeStackNavigationProp<any> };

// ⭐ SPECIALTIES LIST
const SPECIALTIES = [
  { label: 'Hearing', value: 'hearing', icon: 'ear' as const, color: '#9B59B6' },
  { label: 'Orthopedic', value: 'orthopedic', icon: 'fitness' as const, color: '#F39C12' },
  { label: 'Brain', value: 'brain', icon: 'pulse' as const, color: '#E74C3C' },
  { label: 'Cardiology', value: 'cardiology', icon: 'heart' as const, color: '#E91E63' },
  { label: 'Dermatology', value: 'dermatology', icon: 'color-palette' as const, color: '#FF9800' },
  { label: 'Pediatrics', value: 'pediatrics', icon: 'people' as const, color: '#4CAF50' },
  { label: 'Ophthalmology', value: 'ophthalmology', icon: 'eye' as const, color: '#00BCD4' },
  { label: 'Psychiatry', value: 'psychiatry', icon: 'happy' as const, color: '#9C27B0' },
  { label: 'Gastroenterology', value: 'gastroenterology', icon: 'restaurant' as const, color: '#795548' },
  { label: 'Endocrinology', value: 'endocrinology', icon: 'flask' as const, color: '#607D8B' },
  { label: 'Neurology', value: 'neurology', icon: 'pulse' as const, color: '#E74C3C' },
  { label: 'ENT', value: 'ent', icon: 'volume-high' as const, color: '#3F51B5' },
  { label: 'Urology', value: 'urology', icon: 'water-outline' as const, color: '#2196F3' },
  { label: 'Nephrology', value: 'nephrology', icon: 'water' as const, color: '#03A9F4' },
  { label: 'Oncology', value: 'oncology', icon: 'bandage' as const, color: '#F44336' },
  { label: 'Gynecology', value: 'gynecology', icon: 'woman' as const, color: '#E91E63' },
  { label: 'Dentistry', value: 'dentistry', icon: 'hammer' as const, color: '#9E9E9E' },
  { label: 'Pulmonology', value: 'pulmonology', icon: 'cloud' as const, color: '#B0BEC5' },
  { label: 'Rheumatology', value: 'rheumatology', icon: 'trending-up' as const, color: '#FF5722' },
  { label: 'Allergy', value: 'allergy', icon: 'medkit' as const, color: '#CDDC39' },
];

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    id: '',
    name: '',
    specialization: '',
    email: '',
    phoneNumber: '',
    location: { 
      latitude: 35.7595, // Tétouan default coordinates
      longitude: -5.8337, 
      address: '', 
      city: 'Tétouan' 
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setInitialLoading(true);
      const data = await ApiService.getMyProfile();
      setProfileData({
        ...data,
        location: data.location || { 
          latitude: 35.7595, 
          longitude: -5.8337, 
          address: data.address || '', 
          city: 'Tétouan' 
        }
      });
    } catch (err: any) {
      console.error('❌ Fetch profile error:', err.response || err);
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        ApiService.logout();
        navigation.replace('Welcome');
      } else {
        Alert.alert('Error', 'Failed to load profile. Please try again.');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate fields
    if (!profileData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }
    if (!profileData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!profileData.phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return;
    }

    setLoading(true);
    try {
      const payload: DoctorRequestDto = {
        email: profileData.email,
        name: profileData.name,
        specialization: profileData.specialization,
        phoneNumber: profileData.phoneNumber,
        location: {
          latitude: profileData.location.latitude,
          longitude: profileData.location.longitude,
          address: profileData.location.address || 'Not specified',
          city: profileData.location.city || 'Unknown',
        },
      };

      console.log('💾 Saving profile:', payload);
      await ApiService.updateMyProfile(payload);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully! ✓');
    } catch (err: any) {
      console.error('❌ Profile update error:', err.response || err);
      if (err.response?.status === 401) {
        Alert.alert('Unauthorized', 'Your session has expired. Please log in again.');
        ApiService.logout();
        navigation.replace('Welcome');
      } else {
        const errorMsg = err.response?.data?.message || 'Failed to update profile. Please try again.';
        Alert.alert('Update Failed', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            ApiService.logout();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  const handlePickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to pick your location.');
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setProfileData({
        ...profileData,
        location: {
          ...profileData.location,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
      });
      Alert.alert('Success', 'Location updated! Remember to save changes.');
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  };

  const selectedSpecialtyObj = SPECIALTIES.find(
    s => s.label.toLowerCase() === profileData.specialization.toLowerCase() ||
         s.value === profileData.specialization.toLowerCase()
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: SPACING.xxl }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.replace('Home')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons 
              name={isEditing ? 'close' : 'create'} 
              size={24} 
              color={isEditing ? COLORS.error : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

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

        {/* Profile Form */}
        {isEditing ? (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <InputField 
              label="Full Name" 
              placeholder="Dr. John Doe"
              value={profileData.name} 
              onChangeText={(v) => setProfileData({ ...profileData, name: v })} 
              icon="person" 
            />

            {/* Specialty Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Specialty</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setSpecialtyModalVisible(true)}
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
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <InputField 
              label="Email" 
              placeholder="doctor@example.com"
              value={profileData.email} 
              onChangeText={(v) => setProfileData({ ...profileData, email: v })} 
              keyboardType="email-address" 
              autoCapitalize="none"
              icon="mail" 
            />
            
            <InputField 
              label="Phone" 
              placeholder="+212 123 456 789"
              value={profileData.phoneNumber} 
              onChangeText={(v) => setProfileData({ ...profileData, phoneNumber: v })} 
              keyboardType="phone-pad" 
              icon="call" 
            />

            <Text style={styles.sectionTitle}>Clinic Location</Text>
            
            <InputField 
              label="Address" 
              placeholder="Street, Building"
              value={profileData.location.address} 
              onChangeText={(v) => setProfileData({ ...profileData, location: { ...profileData.location, address: v } })} 
              icon="location" 
            />
            
            <InputField 
              label="City" 
              placeholder="City name"
              value={profileData.location.city} 
              onChangeText={(v) => setProfileData({ ...profileData, location: { ...profileData.location, city: v } })} 
              icon="business" 
            />

            <Text style={styles.mapLabel}>📍 Pin Your Clinic Location</Text>
            <MapView
              style={styles.map}
              region={{
                latitude: profileData.location.latitude,
                longitude: profileData.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e) => setProfileData({
                ...profileData,
                location: {
                  ...profileData.location,
                  latitude: e.nativeEvent.coordinate.latitude,
                  longitude: e.nativeEvent.coordinate.longitude,
                },
              })}
            >
              <Marker 
                coordinate={{
                  latitude: profileData.location.latitude,
                  longitude: profileData.location.longitude,
                }}
                title="Your Clinic"
                pinColor={COLORS.primary}
              />
            </MapView>

            <CustomButton 
              title=" Use My Current Location" 
              onPress={handlePickLocation} 
              variant="secondary" 
              size="large" 
              fullWidth 
              style={{ marginBottom: SPACING.md }} 
            />

            <CustomButton 
              title=" Save Changes" 
              onPress={handleSave} 
              variant="primary" 
              size="large" 
              fullWidth 
              loading={loading} 
            />
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoCard icon="person" label="Name" value={profileData.name} />
            <InfoCard icon="fitness" label="Specialization" value={profileData.specialization} />
            <InfoCard icon="mail" label="Email" value={profileData.email} />
            <InfoCard icon="call" label="Phone" value={profileData.phoneNumber} />
            
            <Text style={styles.sectionTitle}>Clinic Location</Text>
            <InfoCard icon="location" label="Address" value={profileData.location.address} />
            <InfoCard icon="business" label="City" value={profileData.location.city} />

            {/* Map Preview */}
            <View style={styles.mapPreviewContainer}>
              <MapView
                style={styles.mapPreview}
                region={{
                  latitude: profileData.location.latitude,
                  longitude: profileData.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker 
                  coordinate={{
                    latitude: profileData.location.latitude,
                    longitude: profileData.location.longitude,
                  }}
                  title="Your Clinic"
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Specialty Modal */}
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
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty.value}
                  style={[
                    styles.specialtyOption,
                    profileData.specialization.toLowerCase() === specialty.label.toLowerCase() && 
                    styles.specialtyOptionSelected
                  ]}
                  onPress={() => {
                    setProfileData({ ...profileData, specialization: specialty.label });
                    setSpecialtyModalVisible(false);
                  }}
                >
                  <View style={[styles.iconCircle, { backgroundColor: specialty.color }]}>
                    <Ionicons name={specialty.icon} size={24} color={COLORS.white} />
                  </View>
                  <Text style={styles.specialtyOptionText}>{specialty.label}</Text>
                  {profileData.specialization.toLowerCase() === specialty.label.toLowerCase() && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
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

const InfoCard: React.FC<{ 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string 
}> = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIconContainer}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  headerTitle: { 
    fontSize: FONT_SIZES.xl, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary 
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  mapLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
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
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalScroll: {
    maxHeight: 500,
  },
  specialtyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  specialtyOptionSelected: {
    backgroundColor: COLORS.background,
  },
  specialtyOptionText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    marginLeft: SPACING.sm,
  },
});