// src/screens/user/HomeScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  PanResponder,
  Image,
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
import { NearbyDoctorsModal } from '../../components/NearbyDoctorsList';
import { DoctorCard } from '../../components/DoctorCard';
import api from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = 280;
const NAVBAR_HEIGHT = 60;

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

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
  const [isListVisible, setIsListVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView | null>(null);

  const [userLocation, setUserLocation] = useState<Region>({
    latitude: 35.7595,
    longitude: -5.8340,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

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
      }
    })();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors(
        userLocation.latitude,
        userLocation.longitude,
        selectedSpecialty === 'all' ? '' : selectedSpecialty,
      );
      const safeData = Array.isArray(data) ? data : (data as any)?.data || [];
      setDoctors(safeData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    const q = (searchQuery ?? '').trim().toLowerCase();
    return (Array.isArray(doctors) ? doctors : []).filter((doctor) => {
      const name = (doctor.name ?? '').toLowerCase();
      const specialization = (doctor.specialization ?? '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q) || specialization.includes(q);
      const matchesSpecialty =
        selectedSpecialty === 'all' ||
        specialization.toLowerCase() === selectedSpecialty.toLowerCase();
      return matchesSearch && matchesSpecialty;
    });
  };

  const filteredDoctors = useMemo(() => filterDoctors(), [doctors, searchQuery, selectedSpecialty]);

  const showDoctorCard = (doctor: DoctorResponseDto) => {
    setSelectedDoctor(doctor);
    panY.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 10,
    }).start();
  };

  const hideDoctorCard = () => {
    Animated.timing(slideAnim, {
      toValue: CARD_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedDoctor(null));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          hideDoctorCard();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleProfilePress = async () => {
    try {
      const isAuthenticated = await api.isAuthenticated();
      if (isAuthenticated) navigation.navigate('DoctorProfile');
      else navigation.navigate('DoctorLogin');
    } catch {
      navigation.navigate('DoctorLogin');
    }
  };

  const handleDoctorPress = (doctor: DoctorResponseDto) => {
    showDoctorCard(doctor);
    if (doctor.location) {
      mapRef.current?.animateToRegion({
        latitude: doctor.location.latitude,
        longitude: doctor.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleMapRegionChangeComplete = () => {
    if (selectedDoctor) {
      hideDoctorCard();
    }
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <TouchableOpacity onPress={handleProfilePress}>
          <Ionicons name="person-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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

      {/* Search Results */}
      {searchQuery.trim() !== '' && (
        <View style={styles.searchResultsSection}>
          <View style={styles.searchResultsHeader}>
            <View style={styles.searchHeaderTop}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
              <Text style={styles.searchResultsTitle}>Search Results</Text>
            </View>
            <Text style={styles.searchResultsCount}>
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
            </Text>
          </View>
          
          <ScrollView 
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchResultsContent}
          >
            {filteredDoctors.length === 0 ? (
              <View style={styles.emptySearchState}>
                <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No doctors found</Text>
                <Text style={styles.emptySubText}>Try a different search term</Text>
              </View>
            ) : (
              filteredDoctors.map((doctor, index) => (
                <TouchableOpacity
                  key={index.toString()}
                  style={styles.searchResultCard}
                  onPress={() => {
                    showDoctorCard(doctor);
                    setSearchVisible(false);
                    setSearchQuery('');
                    if (doctor.location)
                      mapRef.current?.animateToRegion({
                        latitude: doctor.location.latitude,
                        longitude: doctor.location.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      });
                  }}
                >
                  <View style={[
                    styles.searchResultIcon,
                    { backgroundColor: getSpecialtyColor(doctor.specialization) }
                  ]}>
                    <Ionicons
                      name={getSpecialtyIcon(doctor.specialization)}
                      size={24}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{doctor.name}</Text>
                    <Text style={styles.searchResultSpecialty}>{doctor.specialization}</Text>
                    {doctor.location?.address && (
                      <View style={styles.searchResultLocation}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.searchResultAddress} numberOfLines={1}>
                          {doctor.location.address}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

      {/* Map */}
      {!loading && (
        <View style={styles.mapContainer}>
          <MapView 
            ref={mapRef} 
            provider={PROVIDER_GOOGLE} 
            style={styles.map} 
            region={userLocation}
            onRegionChangeComplete={handleMapRegionChangeComplete}
          >
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
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            </Text>
          </View>
        </View>
      )}

      {/* Floating Action Button for List */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsListVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="medkit" size={28} color={COLORS.white} />
        {filteredDoctors.length > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{filteredDoctors.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Nearby Doctors Modal */}
      <NearbyDoctorsModal
        doctors={filteredDoctors}
        visible={isListVisible}
        onDoctorPress={handleDoctorPress}
        onClose={() => setIsListVisible(false)}
        userLocation={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
      />

      {/* Doctor Details Card - Enhanced Version */}
      <DoctorCard
        doctor={selectedDoctor}
        visible={!!selectedDoctor}
        onClose={hideDoctorCard}
        onViewDetails={() => {
          hideDoctorCard();
          navigation.navigate('DoctorDetails', { doctor: selectedDoctor });
        }}
        slideAnim={slideAnim}
        panY={panY}
        panResponder={panResponder}
        userLocation={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        selectedSpecialty={selectedSpecialty}
        onSpecialtySelect={setSelectedSpecialty}
        onSearchPress={() => setSearchVisible(true)}
      />
    </SafeAreaView>
  );
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
  searchContainer: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white 
  },
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
  
  searchResultsSection: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchResultsHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  searchResultsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  searchResultsCount: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  searchResultIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  searchResultSpecialty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  searchResultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultAddress: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },

  mapContainer: { flex: 1, position: 'relative' },
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

  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },

  fab: {
    position: 'absolute',
    bottom: NAVBAR_HEIGHT + 30,
    right: SPACING.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E91E63',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  fabBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default HomeScreen;