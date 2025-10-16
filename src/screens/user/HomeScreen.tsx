// src/screens/user/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { SpecialtyType, DoctorResponseDto } from '../../types';
import { BottomNavBar } from '../../components/BottomNavBar';
import api from '../../services/api';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  // Request user location permission and get coordinates
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        console.warn('Location permission denied. Using default coordinates.');
        setUserLocation({
          latitude: 35.7595,
          longitude: -5.8340,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();
  }, []);

  // Fetch doctors whenever the specialty changes
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors(selectedSpecialty === 'all' ? '' : selectedSpecialty);
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        searchQuery === '' || doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const filteredDoctors = filterDoctors();

  if (!userLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
          <Ionicons name="person-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* SearchBar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors or specialties..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchVisible(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

      {/* Map */}
      {!loading && (
        <View style={styles.mapContainer}>
          <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={userLocation}>
            {/* User Location Marker */}
            <Marker
              key="user-location"
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
            >
              <View style={[styles.marker, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="location" size={20} color={COLORS.white} />
              </View>
            </Marker>

            {/* Doctor Markers */}
            {filteredDoctors.map((doctor, index) => (
              <Marker
                key={ index.toString()}
                coordinate={{
                  latitude: doctor.location?.latitude ?? userLocation.latitude,
                  longitude: doctor.location?.longitude ?? userLocation.longitude,
                }}
                onPress={() => navigation.navigate('DoctorDetails', { doctor })}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: getSpecialtyColor(doctor.specialization as SpecialtyType) },
                    ]}
                  >
                    <Ionicons name="medical" size={20} color={COLORS.white} />
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={styles.mapOverlay}>
            <Text style={styles.resultsText}>
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
            </Text>
          </View>
        </View>
      )}

      {/* Nearby Doctors List */}
      <View style={styles.doctorsList}>
        <Text style={styles.listTitle}>Nearby Doctors</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredDoctors.map((doctor, index) => (
            <DoctorCard
              key={index.toString()}
              doctor={doctor}
              onPress={() => navigation.navigate('DoctorDetails', { doctor })}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bottom Navbar */}
      <BottomNavBar
        selectedSpecialty={selectedSpecialty}
        onSpecialtySelect={setSelectedSpecialty}
        onSearchPress={() => setSearchVisible(true)}
      />
    </SafeAreaView>
  );
};

const DoctorCard: React.FC<{ doctor: DoctorResponseDto; onPress: () => void }> = ({
  doctor,
  onPress,
}) => (
  <TouchableOpacity style={styles.doctorCard} onPress={onPress} activeOpacity={0.7}>
    <View
      style={[
        styles.doctorAvatar,
        { backgroundColor: getSpecialtyColor(doctor.specialization as SpecialtyType) },
      ]}
    >
      <Ionicons name="person" size={30} color={COLORS.white} />
    </View>
    <View style={styles.doctorInfo}>
      <Text style={styles.doctorName}>{doctor.name}</Text>
      <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

const getSpecialtyColor = (specialty?: SpecialtyType): string => {
  switch (specialty) {
    case 'hearing':
      return COLORS.hearing;
    case 'brain':
      return COLORS.brain;
    case 'orthopedic':
      return COLORS.orthopedic;
    default:
      return COLORS.primary;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
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
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  searchContainer: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZES.base, color: COLORS.textPrimary },
  mapContainer: { height: 400, position: 'relative' },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  },
  mapOverlay: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  resultsText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  doctorsList: { flex: 1, backgroundColor: COLORS.background },
  listTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary, paddingTop: 20, paddingHorizontal: SPACING.lg, marginBottom: 5 },
  listContent: { paddingTop: 20, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.md },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.small },
  doctorAvatar: { width: 60, height: 60, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  doctorSpecialty: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
});
