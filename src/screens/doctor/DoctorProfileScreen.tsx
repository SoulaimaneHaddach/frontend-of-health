// src/screens/doctor/DoctorProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../components/CustomButton';
import { InputField } from '../../components/InputField';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

type DoctorProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    experience: '8',
    email: 'sarah.johnson@example.com',
    phone: '+1 234 567 8900',
    bio: 'Experienced cardiologist dedicated to providing comprehensive heart care.',
    consultationFee: '150',
    address: '123 Medical Center, New York, NY',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save to API
  };

  const handleLogout = () => {
    navigation.replace('Welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons
            name={isEditing ? 'close' : 'create'}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color={COLORS.white} />
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.verifiedText}>Verified Doctor</Text>
          </View>
        </View>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <InputField
              label="Full Name"
              value={profileData.name}
              onChangeText={(value) => setProfileData({ ...profileData, name: value })}
              icon="person"
            />
            
            <InputField
              label="Specialty"
              value={profileData.specialty}
              onChangeText={(value) => setProfileData({ ...profileData, specialty: value })}
              icon="fitness"
            />
            
            <InputField
              label="Years of Experience"
              value={profileData.experience}
              onChangeText={(value) => setProfileData({ ...profileData, experience: value })}
              keyboardType="numeric"
              icon="time"
            />
            
            <InputField
              label="Email"
              value={profileData.email}
              onChangeText={(value) => setProfileData({ ...profileData, email: value })}
              keyboardType="email-address"
              icon="mail"
            />
            
            <InputField
              label="Phone"
              value={profileData.phone}
              onChangeText={(value) => setProfileData({ ...profileData, phone: value })}
              keyboardType="phone-pad"
              icon="call"
            />
            
            <InputField
              label="Bio"
              value={profileData.bio}
              onChangeText={(value) => setProfileData({ ...profileData, bio: value })}
              multiline
              numberOfLines={3}
            />
            
            <InputField
              label="Consultation Fee ($)"
              value={profileData.consultationFee}
              onChangeText={(value) => setProfileData({ ...profileData, consultationFee: value })}
              keyboardType="numeric"
              icon="cash"
            />
            
            <InputField
              label="Clinic Address"
              value={profileData.address}
              onChangeText={(value) => setProfileData({ ...profileData, address: value })}
              icon="location"
            />
            
            <CustomButton
              title="Save Changes"
              onPress={handleSave}
              variant="secondary"
              size="large"
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.infoSection}>
            <InfoCard
              icon="person"
              label="Name"
              value={profileData.name}
            />
            
            <InfoCard
              icon="fitness"
              label="Specialty"
              value={profileData.specialty}
            />
            
            <InfoCard
              icon="time"
              label="Experience"
              value={`${profileData.experience} years`}
            />
            
            <InfoCard
              icon="mail"
              label="Email"
              value={profileData.email}
            />
            
            <InfoCard
              icon="call"
              label="Phone"
              value={profileData.phone}
            />
            
            <InfoCard
              icon="document-text"
              label="Bio"
              value={profileData.bio}
            />
            
            <InfoCard
              icon="cash"
              label="Consultation Fee"
              value={`$${profileData.consultationFee}`}
            />
            
            <InfoCard
              icon="location"
              label="Clinic Address"
              value={profileData.address}
            />
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  verifiedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  editForm: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  infoSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  infoIcon: {
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.error,
    fontWeight: '600',
  },
});