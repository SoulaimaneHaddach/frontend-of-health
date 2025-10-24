// src/screens/user/HomeScreen.tsx - UPDATED WITH SPECIALTY ICONS
import React, { useState, useEffect, useMemo, useRef } from 'react';
// src/screens/user/HomeScreen.tsx
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { SpecialtyType } from '../../types';
import { DoctorResponseDto } from '../../services/api';
import { BottomNavBar } from '../../components/BottomNavBar';
import api from '../../services/api';
import SpecialtyFilter from '../../components/SpecialtyFilter';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = 280;

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// ⭐ SPECIALTY CONFIGURATION (matches BottomNavBar)
const SPECIALTY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  all: { icon: 'apps', color: COLORS.primary },
  hearing: { icon: 'ear', color: COLORS.hearing },
  orthopedic: { icon: 'fitness', color: COLORS.orthopedic },
  brain: { icon: 'pulse', color: COLORS.brain },
  cardiology: { icon: 'heart', color: '#E91E63' },
  dermatology: { icon: 'color-palette', color: '#FF9800' },
  pediatrics: { icon: 'people', color: '#4CAF50' },
  ophthalmology: { icon: 'eye', color: '#00BCD4' },
  psychiatry: { icon: 'happy', color: '#9C27B0' },
  gastroenterology: { icon: 'restaurant', color: '#795548' },
  endocrinology: { icon: 'flask', color: '#607D8B' },
  neurology: { icon: 'pulse', color: '#E74C3C' },
  ent: { icon: 'volume-high', color: '#3F51B5' },
  urology: { icon: 'water-outline', color: '#2196F3' },
  nephrology: { icon: 'water', color: '#03A9F4' },
  oncology: { icon: 'bandage', color: '#F44336' },
  gynecology: { icon: 'woman', color: '#E91E63' },
  dentistry: { icon: 'hammer', color: '#9E9E9E' },
  pulmonology: { icon: 'cloud', color: '#B0BEC5' },
  rheumatology: { icon: 'trending-up', color: '#FF5722' },
  allergy: { icon: 'medkit', color: '#CDDC39' },
};

// ⭐ HELPER FUNCTIONS
const getSpecialtyIcon = (specialty?: string): keyof typeof Ionicons.glyphMap => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.icon || 'medical';
};

const getSpecialtyColor = (specialty?: string): string => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.color || COLORS.primary;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<DoctorResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponseDto | null>(null);
  
  const slideAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;

  
  const [userLocation, setUserLocation] = useState<Region>({latitude: 35.7595,
          longitude: -5.8340,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05});
  
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
        setUserLocation({
          latitude: 35.7595,
          longitude: -5.8340,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors(userLocation.latitude, userLocation.longitude,selectedSpecialty === 'all' ? '' : selectedSpecialty,);
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    const q = (searchQuery ?? '').trim().toLowerCase();
    return doctors.filter((doctor) => {
      const name = (doctor.name ?? '').toLowerCase();
      const specialization = (doctor.specialization ?? '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q);
      const matchesSpecialty =
        selectedSpecialty === 'all' ||
        specialization.toLowerCase() === selectedSpecialty.toLowerCase();

      return matchesSearch && matchesSpecialty;
    });
  };
  

  const filteredDoctors = useMemo(() => filterDoctors(), [doctors, searchQuery, selectedSpecialty]);

  const showDoctorCard = (doctor: DoctorResponseDto) => {
    setSelectedDoctor(doctor);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideDoctorCard = () => {
    Animated.timing(slideAnim, {
      toValue: CARD_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDoctor(null);
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color="#FFB800" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="star-half" name="star-half" size={16} color="#FFB800" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Ionicons key={`star-empty-${i}`} name="star-outline" size={16} color="#FFB800" />);
    }
    return stars;
  };

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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}>
          <Ionicons name="person-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

      {!loading && (
        <View style={styles.mapContainer}>
          <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={userLocation}>
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

            {/* ⭐ UPDATED: Map Markers with Specialty Icons */}
            {filteredDoctors.map((doctor, index) => (
              <Marker
                key={index.toString()}
                coordinate={{
                  latitude: doctor.location?.latitude ?? userLocation.latitude,
                  longitude: doctor.location?.longitude ?? userLocation.longitude,
                }}
                onPress={() => showDoctorCard(doctor)}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: getSpecialtyColor(doctor.specialization) },
                    ]}
                  >
                    {/* ⭐ SPECIALTY ICON */}
                    <Ionicons 
                      name={getSpecialtyIcon(doctor.specialization)} 
                      size={20} 
                      color={COLORS.white} 
                    />
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

      {/* ⭐ UPDATED: Doctor List with Specialty Icons */}
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

      {/* Bottom Card Popup */}
      {selectedDoctor && (
        <Animated.View
          style={[
            styles.bottomCard,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cardHandle} />
          
          <View style={styles.cardHeader}>
            {/* ⭐ UPDATED: Avatar with Specialty Icon and Color */}
            <View
              style={[
                styles.cardAvatar,
                { backgroundColor: getSpecialtyColor(selectedDoctor.specialization) },
              ]}
            >
              <Ionicons 
                name={getSpecialtyIcon(selectedDoctor.specialization)} 
                size={40} 
                color={COLORS.white} 
              />
            </View>
            
            <View style={styles.cardHeaderInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName}>{selectedDoctor.name}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.cardSpecialty}>{selectedDoctor.specialization}</Text>
            </View>

            <TouchableOpacity onPress={hideDoctorCard} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressSection}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>
              {selectedDoctor.location.address}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => {
                hideDoctorCard();
                navigation.navigate('DoctorDetails', { doctor: selectedDoctor });
              }}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <BottomNavBar
        selectedSpecialty={selectedSpecialty}
        onSpecialtySelect={setSelectedSpecialty}
        onSearchPress={() => setSearchVisible(true)}
      />
    </SafeAreaView>
  );
};

// ⭐ UPDATED: Doctor Card Component with Specialty Icon
const DoctorCard: React.FC<{ doctor: DoctorResponseDto; onPress: () => void }> = ({
  doctor,
  onPress,
}) => (
  <TouchableOpacity style={styles.doctorCard} onPress={onPress} activeOpacity={0.7}>
    <View
      style={[
        styles.doctorAvatar,
        { backgroundColor: getSpecialtyColor(doctor.specialization as SpecialtyType,) },
      ]}
    >
      {/* ⭐ SPECIALTY ICON in Doctor Card */}
      <Ionicons 
        name={getSpecialtyIcon(doctor.specialization)} 
        size={30} 
        color={COLORS.white} 
      />
    </View>
    <View style={styles.doctorInfo}>
      <Text style={styles.doctorName}>{doctor.name}</Text>
      <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

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
  
  bottomCard: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    ...SHADOWS.large,
    elevation: 20,
  },
  cardHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardAvatar: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardSpecialty: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  addressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  detailsButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});