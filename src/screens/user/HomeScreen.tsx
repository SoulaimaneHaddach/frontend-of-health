// src/screens/user/HomeScreen.tsx - WITH GLOBAL THEME
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
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

const SPECIALTY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap }> = {
  all: { icon: 'apps' },
  hearing: { icon: 'ear' },
  orthopedic: { icon: 'fitness' },
  brain: { icon: 'pulse' },
  cardiology: { icon: 'heart' },
  dermatology: { icon: 'color-palette' },
  pediatrics: { icon: 'people' },
  ophthalmology: { icon: 'eye' },
  psychiatry: { icon: 'happy' },
  gastroenterology: { icon: 'restaurant' },
  endocrinology: { icon: 'flask' },
  neurology: { icon: 'pulse' },
  ent: { icon: 'volume-high' },
  urology: { icon: 'water-outline' },
  nephrology: { icon: 'water' },
  oncology: { icon: 'bandage' },
  gynecology: { icon: 'woman' },
  dentistry: { icon: 'hammer' },
  pulmonology: { icon: 'cloud' },
  rheumatology: { icon: 'trending-up' },
  allergy: { icon: 'medkit' },
};

const getSpecialtyIcon = (specialty?: string): keyof typeof Ionicons.glyphMap => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_ICONS[normalized]?.icon || 'medical';
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // ========== GLOBAL THEME ==========
  const { isDarkMode, toggleTheme, colors } = useTheme();

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

  // map specialty to a color using runtime theme where possible
  const getSpecialtyColor = (specialty?: string): string => {
    const normalized = specialty?.toLowerCase() || 'all';
    const map: Record<string, string> = {
      all: colors.primary,
      hearing: '#9B59B6',
      orthopedic: '#F39C12',
      brain: '#E74C3C',
      cardiology: '#E91E63',
      dermatology: '#FF9800',
      pediatrics: '#4CAF50',
      ophthalmology: '#00BCD4',
      psychiatry: '#9C27B0',
      gastroenterology: '#795548',
      endocrinology: '#607D8B',
      neurology: '#E74C3C',
      ent: '#3F51B5',
      urology: '#2196F3',
      nephrology: '#03A9F4',
      oncology: '#F44336',
      gynecology: '#E91E63',
      dentistry: '#9E9E9E',
      pulmonology: '#B0BEC5',
      rheumatology: '#FF5722',
      allergy: '#CDDC39',
    };

    return map[normalized] || colors.primary;
  };

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

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!userLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Doctor</Text>
        <View style={styles.headerActions}>
          {/* Dark Mode Toggle Button */}
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={26} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleProfilePress}>
            <Ionicons 
              name="person-circle" 
              size={32} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search" 
              size={20} 
              color={colors.textSecondary} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors or specialties..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchVisible(false);
              }}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Results */}
      {searchQuery.trim() !== '' && (
        <View style={styles.searchResultsSection}>
          <View style={styles.searchResultsHeader}>
            <View style={styles.searchHeaderTop}>
                <Ionicons name="search" size={20} color={colors.primary} />
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
                <Ionicons 
                  name="search-outline" 
                  size={48} 
                  color={colors.textSecondary} 
                />
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
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{doctor.name}</Text>
                    <Text style={styles.searchResultSpecialty}>{doctor.specialization}</Text>
                    {doctor.location?.address && (
                      <View style={styles.searchResultLocation}>
                        <Ionicons 
                          name="location-outline" 
                          size={14} 
                          color={colors.textSecondary} 
                        />
                        <Text style={styles.searchResultAddress} numberOfLines={1}>
                          {doctor.location.address}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

  {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

      {/* Map */}
      {!loading && (
        <View style={styles.mapContainer}>
          <MapView 
            ref={mapRef} 
            provider={PROVIDER_GOOGLE} 
            style={styles.map} 
            region={userLocation}
            onRegionChangeComplete={handleMapRegionChangeComplete}
            customMapStyle={isDarkMode ? DARK_MAP_STYLE : []}
          >
            <Marker
              key="user-location"
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
            >
              <View style={[styles.marker, { backgroundColor: colors.primary }]}>
                <Ionicons name="location" size={20} color={colors.white} />
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
                      color={colors.white}
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
        <Ionicons name="medkit" size={28} color={colors.white} />
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

      {/* Doctor Details Card */}
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

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { 
    fontSize: FONT_SIZES.xl, 
    fontWeight: 'bold', 
    color: colors.text 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  searchContainer: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: colors.card 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { 
    flex: 1, 
    fontSize: FONT_SIZES.base, 
    color: colors.text 
  },
  
  searchResultsSection: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchResultsHeader: {
    backgroundColor: colors.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  searchResultsCount: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
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
    backgroundColor: colors.card,
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
    color: colors.text,
    marginBottom: 2,
  },
  searchResultSpecialty: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  searchResultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultAddress: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
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
    borderColor: colors.white,
    ...SHADOWS.medium,
  },
  mapOverlay: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: colors.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsText: { 
    fontSize: FONT_SIZES.sm, 
    fontWeight: '600', 
    color: colors.text 
  },

  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },

  fab: {
    position: 'absolute',
    bottom: NAVBAR_HEIGHT + 30,
    right: SPACING.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
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
    borderColor: colors.white,
  },
  fabBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default HomeScreen;
