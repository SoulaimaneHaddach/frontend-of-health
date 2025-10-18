// src/screens/doctor/DoctorProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
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

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    id: '',
    name: '',
    specialization: '',
    email: '',
    phoneNumber: '',
    location: { latitude: 37.78825, longitude: -122.4324, address: '', city: '' },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await ApiService.getMyProfile();
        setProfileData(data);
      } catch (err) {
        console.error('Fetch profile error:', err);
        Alert.alert('Error', 'Failed to load profile.');
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
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
          address: profileData.location.address || 'Unknown',
          city: profileData.location.city || 'Unknown',
        },
      };
      await ApiService.updateMyProfile(payload);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      console.error('Profile update error:', err.response || err);
      if (err.response?.status === 401) {
        Alert.alert('Unauthorized', 'Please log in again.');
        ApiService.logout();
        navigation.replace('Welcome');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    navigation.replace('Welcome');
  };

  const handlePickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Location permission is required.');
    const loc = await Location.getCurrentPositionAsync({});
    setProfileData({ ...profileData, location: { ...profileData.location, latitude: loc.coords.latitude, longitude: loc.coords.longitude } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? 'close' : 'create'} size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Form */}
        {isEditing ? (
          <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
            <InputField label="Full Name" value={profileData.name} onChangeText={(v) => setProfileData({ ...profileData, name: v })} icon="person" />
            <InputField label="Specialization" value={profileData.specialization} onChangeText={(v) => setProfileData({ ...profileData, specialization: v })} icon="fitness" />
            <InputField label="Email" value={profileData.email} onChangeText={(v) => setProfileData({ ...profileData, email: v })} keyboardType="email-address" icon="mail" />
            <InputField label="Phone" value={profileData.phoneNumber} onChangeText={(v) => setProfileData({ ...profileData, phoneNumber: v })} keyboardType="phone-pad" icon="call" />
            <InputField label="Address" value={profileData.location.address} onChangeText={(v) => setProfileData({ ...profileData, location: { ...profileData.location, address: v } })} icon="location" />
            <InputField label="City" value={profileData.location.city} onChangeText={(v) => setProfileData({ ...profileData, location: { ...profileData.location, city: v } })} icon="business" />

            <Text style={{ marginBottom: 8, fontWeight: '600', color: COLORS.textPrimary }}>Clinic Location</Text>
            <MapView
              style={{ width: '100%', height: 200, marginBottom: 16, borderRadius: 12 }}
              initialRegion={{ latitude: profileData.location.latitude, longitude: profileData.location.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              onPress={(e) => setProfileData({ ...profileData, location: { ...profileData.location, latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude } })}
            >
              <Marker coordinate={{ latitude: profileData.location.latitude, longitude: profileData.location.longitude }} />
            </MapView>

            <CustomButton title="Pick Current Location" onPress={handlePickLocation} variant="secondary" size="large" fullWidth style={{ marginBottom: 16 }} />
            <CustomButton title="Save Changes" onPress={handleSave} variant="secondary" size="large" fullWidth loading={loading} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
            <InfoCard icon="person" label="Name" value={profileData.name} />
            <InfoCard icon="fitness" label="Specialization" value={profileData.specialization} />
            <InfoCard icon="mail" label="Email" value={profileData.email} />
            <InfoCard icon="call" label="Phone" value={profileData.phoneNumber} />
            <InfoCard icon="location" label="Address" value={profileData.location.address} />
            <InfoCard icon="business" label="City" value={profileData.location.city} />
          </View>
        )}

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.sm }} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={COLORS.error} />
          <Text style={{ fontSize: FONT_SIZES.base, color: COLORS.error, fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: 12, marginBottom: SPACING.sm }}>
    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md }}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs }}>{label}</Text>
      <Text style={{ fontSize: FONT_SIZES.base, color: COLORS.textPrimary, fontWeight: '500' }}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
});
