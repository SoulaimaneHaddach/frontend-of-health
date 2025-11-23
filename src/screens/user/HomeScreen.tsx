// src/screens/user/HomeScreen.tsx - OPTIMIZED VERSION
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import OSMMap from '../../components/OSMMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import logger from '../../shared/utils/logger';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import { s, ms, vs, SIZES } from '../../shared/constants/responsive';
import { SpecialtyType } from '../../shared/types';
import { DoctorResponseDto, DoctorMapDto } from '../../services/api';
import { BottomNavBar } from '../../components/BottomNavBar';
import { NearbyDoctorsModal } from '../../components/NearbyDoctorsList';
import { DoctorCard } from '../../components/DoctorCard';
import api from '../../services/api';
import { useAnalytics } from '../../shared/hooks/useAnalytics';
import { Platform, AppState } from 'react-native';
import { eventBus } from '../../shared/services/eventBus';

const CARD_HEIGHT = ms(280);
const NAVBAR_HEIGHT = ms(60);

const MIN_ZOOM_DELTA = 0.01; 
const MAX_ZOOM_DELTA = 0.3; // Doctors visible when zoomed in closer than this 

// Map boundaries (Morocco area)
const MOROCCO_BOUNDS = {
  minLatitude: 27.66,
  maxLatitude: 35.92,
  minLongitude: -13.17,
  maxLongitude: -0.99,
};

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
  const { isDarkMode, colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const analytics = useAnalytics();

  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);
  const isSearching = (searchQuery ?? '').trim() !== '';
  // Load lightweight list for map/list; fetch full details on demand
  const [doctors, setDoctors] = useState<DoctorMapDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [didFetchOnce, setDidFetchOnce] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<(DoctorMapDto | DoctorResponseDto) | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(0.05);
  const [mapError, setMapError] = useState(false);
  // Allow disabling the native map on Android release if Google Maps API key isn't configured yet
  const MAPS_DISABLED = (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_DISABLE_MAP) === '1';
  // Use OSM WebView map on Android or when maps are disabled
  const USE_OSM = Platform.OS === 'android' || MAPS_DISABLED;

  const slideAnim = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView | null>(null);
  const [osmCenter, setOsmCenter] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null);
  const initialLocationSet = useRef(false);
  const isFetchingRef = useRef(false);
  // Flag to distinguish programmatic map moves (animateToRegion) from user gestures
  const isProgrammaticRef = useRef(false);

  const [userLocation, setUserLocation] = useState<Region>({
    latitude: 35.7595,
    longitude: -5.8340,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Memoized specialty color function
  const getSpecialtyColor = useCallback((specialty?: string): string => {
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
  }, [colors.primary]);

  const fetchDoctors = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      logger.debug('⏳ Already fetching doctors, skipping...');
      return;
    }

    // Only fetch if we have valid location
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      logger.warn('⚠️ No valid location, skipping fetch');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      logger.debug('🔍 Fetching all doctors (attempt)...', {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        specialty: selectedSpecialty
      });
      
      // Fetch all doctors regardless of distance
      const data = await api.getDoctorsMap(
        userLocation.latitude,
        userLocation.longitude,
        selectedSpecialty === 'all' ? undefined : selectedSpecialty,
        1000 // Large radius to get all doctors
      );
      
      // Safely parse the response
      let safeData: any[] = [];
      if (Array.isArray(data)) {
        safeData = data;
      } else if (data && typeof data === 'object') {
        const anyData = data as any;
        if (Array.isArray(anyData.data)) {
          safeData = anyData.data;
        } else if (Array.isArray(anyData.doctors)) {
          safeData = anyData.doctors;
        }
      }
      
      // Filter out invalid entries
      const validDoctors = safeData.filter((doctor: any) => 
        doctor && 
        typeof doctor === 'object' && 
        doctor.location && 
        typeof doctor.location.latitude === 'number' && 
        typeof doctor.location.longitude === 'number'
      );
      
      logger.debug('✅ Fetched doctors (response):', validDoctors.length);


      setDoctors(validDoctors);
      setDidFetchOnce(true);
    } catch (error) {
      logger.error('❌ Error fetching doctors:', error);
      setDoctors([]);
      // Don't crash the app, just show empty list
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [userLocation, selectedSpecialty]);

  // Get user location on mount and center map
  useEffect(() => {
    let mounted = true;
    
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && mounted) {
          try {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (mounted && location?.coords) {
              const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              };
              
              logger.debug('📍 User location acquired:', newRegion);
              setUserLocation(newRegion);
              
              // Only animate to user location on initial load
              if (!initialLocationSet.current && mapRef.current) {
                setTimeout(() => {
                  try {
                      isProgrammaticRef.current = true;
                      mapRef.current?.animateToRegion(newRegion, 1000);
                    } catch (e) {
                      logger.warn('Map animation error:', e);
                    }
                }, 500);
                initialLocationSet.current = true;
              }
            }
          } catch (locError) {
            logger.warn('Location fetch error:', locError);
            if (mounted) {
              setUserLocation({
                latitude: 35.7595,
                longitude: -5.8340,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
            }
          }
        } else {
          logger.warn('⚠️ Location permission denied, using default location');
          if (mounted) {
            setUserLocation({
              latitude: 35.7595,
              longitude: -5.8340,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } catch (error) {
        logger.error('❌ Error getting location:', error);
        if (mounted) {
          setUserLocation({
            latitude: 35.7595,
            longitude: -5.8340,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    };

    initLocation().catch(e => logger.error('Init location failed:', e));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      logger.debug('🎯 Initial fetch on location ready');
      fetchDoctors();
    }
  }, [userLocation.latitude, userLocation.longitude]);

  // Listen for in-app events that should trigger a refresh (e.g., doctor created)
  useEffect(() => {
    const unsubscribe = eventBus.on('doctorCreated', () => {
      logger.debug('🔔 doctorCreated event received, refreshing doctors');
      fetchDoctors();
    });

    // Also refresh when the app comes back to foreground (e.g., reopen app)
    const handleAppState = (nextAppState: string) => {
      if (nextAppState === 'active') {
        logger.debug('🔁 App resumed, refreshing doctors');
        fetchDoctors();
      }
    };
    const sub = AppState.addEventListener ? AppState.addEventListener('change', handleAppState) : null;

    return () => {
      unsubscribe();
      try { sub?.remove?.(); } catch { /* noop for older RN */ }
    };
  }, [fetchDoctors]);

  const hasMountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        logger.debug('🔁 HomeScreen first focus (mounted) — triggering fetch');
        fetchDoctors();
      } else {
        logger.debug('🔁 HomeScreen refocused — triggering fetch');
        fetchDoctors();
      }
    }, [])
  );

  // Explicit refresh helper: clears cache flag and triggers a fetch
  const refreshDoctors = useCallback(() => {
    logger.debug('🔃 Manual refresh requested for doctors');
    setDidFetchOnce(false);
    fetchDoctors();
  }, [fetchDoctors]);

  const filteredDoctors = useMemo(() => {
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
  }, [doctors, searchQuery, selectedSpecialty]);

  const visibleDoctors = useMemo(() => {
    if (currentZoomLevel > MAX_ZOOM_DELTA) {
      return []; // Hide doctors when zoomed out
    }
    return filteredDoctors;
  }, [filteredDoctors, currentZoomLevel]);

  const showDoctorCard = useCallback((doctor: DoctorMapDto | DoctorResponseDto) => {
    setSelectedDoctor(doctor);
    panY.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 10,
    }).start();
  }, [slideAnim, panY]);

  const hideDoctorCard = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: CARD_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedDoctor(null));
  }, [slideAnim]);

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

  const handleProfilePress = useCallback(async () => {
    try {
      const isAuthenticated = await api.isAuthenticated();
      if (isAuthenticated) navigation.navigate('DoctorProfile');
      else navigation.navigate('DoctorLogin');
    } catch {
      navigation.navigate('DoctorLogin');
    }
  }, [navigation]);

  const handleDoctorPress = useCallback((doctor: DoctorMapDto | DoctorResponseDto) => {
    showDoctorCard(doctor);
    if (doctor.id) {
      api.getDoctorById(doctor.id).then((full) => setSelectedDoctor(full)).catch(() => {});
    }
    if (doctor.location) {
      isProgrammaticRef.current = true;
      // Offset the target latitude so the marker stays visible above the sliding DoctorCard.
      // Use the current zoom (latitudeDelta) to compute a reasonable offset.
      const latDelta = currentZoomLevel && currentZoomLevel > 0 ? currentZoomLevel : 0.02;
      const offsetFactor = 0.45; // move marker up by ~45% of the latitudeDelta
      const latOffset = latDelta * offsetFactor;
      const targetLat = doctor.location.latitude - latOffset;

      if (!USE_OSM) {
        try {
          mapRef.current?.animateToRegion({
            latitude: targetLat,
            longitude: doctor.location.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: latDelta,
          }, 300);
        } catch (e) {
          // fallback to simple centering
          mapRef.current?.animateToRegion({
            latitude: doctor.location.latitude,
            longitude: doctor.location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 300);
        }
      } else {
        setOsmCenter({ latitude: targetLat, longitude: doctor.location.longitude, zoom: 14 });
      }
    }
  }, [showDoctorCard]);

  const handleMapRegionChange = useCallback((region: Region) => {
    setCurrentZoomLevel(region.latitudeDelta);
    
    const constrainedRegion = {
      ...region,
      latitude: Math.max(
        MOROCCO_BOUNDS.minLatitude,
        Math.min(MOROCCO_BOUNDS.maxLatitude, region.latitude)
      ),
      longitude: Math.max(
        MOROCCO_BOUNDS.minLongitude,
        Math.min(MOROCCO_BOUNDS.maxLongitude, region.longitude)
      ),
      latitudeDelta: Math.max(0.01, Math.min(5, region.latitudeDelta)),
      longitudeDelta: Math.max(0.01, Math.min(5, region.longitudeDelta)),
    };

    if (
      Math.abs(constrainedRegion.latitude - region.latitude) > 0.01 ||
      Math.abs(constrainedRegion.longitude - region.longitude) > 0.01
    ) {
      isProgrammaticRef.current = true;
      mapRef.current?.animateToRegion(constrainedRegion, 100);
    }
  }, []);

  const handleMapRegionChangeComplete = useCallback(() => {
    // If the region change was triggered programmatically (animateToRegion),
    // reset the flag and do not hide the doctor card.
    if (isProgrammaticRef.current) {
      isProgrammaticRef.current = false;
      return;
    }

    if (selectedDoctor) {
      hideDoctorCard();
    }
  }, [selectedDoctor, hideDoctorCard]);

  const goToMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        setUserLocation(newRegion);
        isProgrammaticRef.current = true;
        if (!USE_OSM) {
          mapRef.current?.animateToRegion(newRegion, 1000);
        } else {
          setOsmCenter({ latitude: newRegion.latitude, longitude: newRegion.longitude, zoom: 12 });
        }
      }
    } catch (error) {
      logger.error('Error getting location:', error);
    }
  }, []);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Search overlay pan to close
  const searchPan = useRef(new Animated.Value(0)).current;
  const searchPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) searchPan.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        const shouldClose = gs.dy > 100 || gs.vy > 0.6;
        if (shouldClose) {
          const screenH = Dimensions.get('window').height;
          Animated.timing(searchPan, {
            toValue: screenH,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            searchPan.setValue(0);
            setSearchVisible(false);
            setSearchQuery('');
          });
        } else {
          Animated.spring(searchPan, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Show loading state while location is being fetched
  if (!userLocation || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>{t.nearbyDoctors}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 20, color: colors.text }}>
            {loading ? t.loading : 'Getting your location...'}
          </Text>
        </View>
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
        <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>{t.nearbyDoctors}</Text>
        <View style={styles.headerActions}>
          {searchVisible && (
            <TouchableOpacity
              onPress={() => setSearchVisible(false)}
              style={styles.iconButton}
            >
              <Ionicons name="close" size={ms(28)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => navigation.navigate('LanguageSelection')}
            style={styles.iconButton}
          >
            <Ionicons 
              name="language" 
              size={ms(28)} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleProfilePress}>
            <Ionicons 
              name="person-circle" 
              size={ms(32)} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar is rendered inside the overlay when `searchVisible` is true. */}

      {/* Search Results (full-screen overlay when search opened) */}
      {searchVisible && (
        <Animated.View
          style={[styles.searchResultsSection, styles.searchOverlay, { transform: [{ translateY: searchPan }] }]}
          {...searchPanResponder.panHandlers}
        >
          {/* Small draggable handle to indicate the overlay can be pulled down */}
          <View style={styles.searchHandleContainer} pointerEvents="none">
            <View style={styles.searchHandle} />
          </View>
          <View style={styles.searchResultsHeader}>
            <View style={styles.searchHeaderTop}>
              <Ionicons name="search" size={ms(20)} color={colors.primary} />
              <Text style={[styles.searchResultsTitle, isRTL && { textAlign: 'right' }]}>{t.search}</Text>
            </View>
          </View>

          {/* Search input inside overlay so user can type while overlay is visible */}
          <View style={styles.searchContainerOverlay}> 
            <View style={styles.searchBar}>
              <Ionicons 
                name="search" 
                size={ms(20)} 
                color={colors.textSecondary} 
              />
              <TextInput
                autoFocus
                ref={searchInputRef}
                style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
                placeholder={t.searchDoctors}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
              {/* Clear button (only clears text) */}
              {(searchQuery ?? '').trim().length > 0 && (
                  <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setTimeout(() => searchInputRef.current?.focus && searchInputRef.current?.focus(), 50);
                  }}
                  style={{ marginRight: ms(8) }}
                >
                  <Ionicons
                    name="close"
                    size={ms(18)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              {/* X button now only closes the overlay */}
              <TouchableOpacity
                onPress={() => {
                  setSearchVisible(false);
                }}
              >
                <Ionicons 
                  name="close-circle" 
                  size={ms(20)} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchResultsContent}
            removeClippedSubviews={true}
          >
            {filteredDoctors.length === 0 ? (
              <View style={styles.emptySearchState}>
                <Ionicons 
                  name="search-outline" 
                  size={ms(48)} 
                  color={colors.textSecondary} 
                />
                <Text style={[styles.emptyText, isRTL && { textAlign: 'center' }]}>{t.nearbyDoctors}</Text>
                <Text style={[styles.emptySubText, isRTL && { textAlign: 'center' }]}>{t.searchDoctors}</Text>
              </View>
            ) : (
              filteredDoctors.map((doctor, index) => (
                <TouchableOpacity
                  key={doctor.id || index.toString()}
                  style={styles.searchResultCard}
                  onPress={() => {
                    // Use the shared handler which also centers the appropriate map
                    setSearchVisible(false);
                    setSearchQuery('');
                    handleDoctorPress(doctor);
                  }}
                >
                  <View style={[
                    styles.searchResultIcon,
                    { backgroundColor: getSpecialtyColor(doctor.specialization) }
                  ]}>
                    <Ionicons
                      name={getSpecialtyIcon(doctor.specialization)}
                      size={ms(24)}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{doctor.name}</Text>
                    <Text style={styles.searchResultSpecialty} numberOfLines={1}>{doctor.specialization}</Text>
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
                    size={ms(20)} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      )}

      {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

      {/* Map */}
      {!loading && userLocation && userLocation.latitude && userLocation.longitude && (
        <View style={styles.mapContainer}>
          {!USE_OSM && !mapError ? (
            <MapView 
              ref={mapRef} 
              provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
              style={styles.map} 
              initialRegion={userLocation}
              onRegionChange={handleMapRegionChange}
              onRegionChangeComplete={handleMapRegionChangeComplete}
              onMapReady={() => {
                logger.debug('✅ Map ready');
                setMapError(false);
              }}
              minZoomLevel={Platform.OS === 'android' ? 8 : undefined}
              maxZoomLevel={Platform.OS === 'android' ? 18 : undefined}
              pitchEnabled={false}
              rotateEnabled={false}
              toolbarEnabled={Platform.OS === 'android' ? false : undefined}
              loadingEnabled={true}
              loadingIndicatorColor={colors.primary}
            >
            {/* User Location Marker */}
            <Marker
              key="user-location"
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[styles.marker, { backgroundColor: colors.primary }]}> 
                  <Ionicons name="location" size={ms(20)} color={colors.white} />
                </View>
            </Marker>

            {/* Doctor Markers - Show only when zoomed in */}
            {visibleDoctors.map((doctor, index) => {
              if (!doctor.location) return null; // skip if no coordinates
              return (
                <Marker
                  key={doctor.id || `doctor-${index}`}
                  coordinate={{
                    latitude: doctor.location.latitude,
                    longitude: doctor.location.longitude,
                  }}
                  onPress={() => handleDoctorPress(doctor)}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: getSpecialtyColor(doctor.specialization) },
                    ]}
                  >
                    <Ionicons
                      name={getSpecialtyIcon(doctor.specialization)}
                      size={ms(20)}
                      color={colors.white}
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>
          ) : (
            // Use OSM WebView map when native maps are disabled or on Android
            <OSMMap
              style={styles.map}
              userLocation={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              markers={visibleDoctors.map(d => ({
                id: d.id,
                latitude: d.location?.latitude || 0,
                longitude: d.location?.longitude || 0,
                title: d.name || '',
                description: d.location?.address || '',
                color: getSpecialtyColor(d.specialization),
                label: d.name ? d.name.charAt(0).toUpperCase() : '',
                iconName: getSpecialtyIcon(d.specialization) as string,
              }))}
              centerTo={osmCenter}
              selectedId={selectedDoctor?.id}
              onMarkerPress={(id) => {
                try {
                  const found = visibleDoctors.find(x => String(x.id) === String(id));
                  if (found) handleDoctorPress(found);
                } catch (e) {
                  logger.warn('OSM marker press handler error', e);
                }
              }}
            />
          )}

          <View style={styles.mapOverlay}>
            <Text style={[styles.resultsText, isRTL && { textAlign: 'right' }]}>
              {t.nearbyDoctorsOnMap}
            </Text>
            {currentZoomLevel > MAX_ZOOM_DELTA && (
              <Text style={[styles.zoomHint, isRTL && { textAlign: 'right' }]}>
               {t.nearbyDoctors}
              </Text>
            )}
          </View>

          {/* My Location Button */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={goToMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsListVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-up" size={28} color={colors.white} />
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
        onViewDetails={async () => {
          if (!selectedDoctor?.id) return;
          try {
            const full = await api.getDoctorById(selectedDoctor.id);
            hideDoctorCard();
            navigation.navigate('DoctorDetails', { doctor: full });
          } catch (e) {
            // Fallback: navigate with what we have
            hideDoctorCard();
            navigation.navigate('DoctorDetails', { doctor: selectedDoctor });
          }
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
        onSpecialtySelect={(specialty) => {
          setSelectedSpecialty(specialty);
          // Track filter applied
          try {
            if (specialty !== 'all') {
              analytics.trackFilterApplied({ specialty });
            } else {
              analytics.trackFilterCleared();
            }
          } catch (error) {
            logger.warn('Analytics error:', error);
          }
        }}
        onSearchPress={() => setSearchVisible(true)}
      />
    </SafeAreaView>
  );
};

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
  searchContainerOverlay: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    paddingTop:  ms(30),
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
    paddingVertical: ms(SPACING.xl * 3),
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
    width: ms(50),
    height: ms(50),
    borderRadius: ms(RADIUS.md),
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
    marginBottom: ms(2),
  },
  searchResultSpecialty: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: ms(4),
  },
  searchResultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  searchResultAddress: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    flex: 1,
  },

  mapContainer: { flex: 1, position: 'relative' },
  searchOverlay: {
    position: 'absolute',
    top: '18%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: colors.background,
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    overflow: 'hidden',
  },
  searchHandleContainer: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    backgroundColor: colors.card,
  },
  searchHandle: {
    width: ms(100),
    height: vs(4),
    borderRadius: ms(4),
    backgroundColor: colors.textSecondary,
    opacity: 0.25,
  },
  map: { flex: 1 },
  marker: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ms(3),
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
  zoomHint: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginTop: ms(2),
  },
  locationButton: {
    position: 'absolute',
    bottom: ms(170),
    right: ms(30),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: colors.border,
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
    bottom: NAVBAR_HEIGHT + ms(60),      // nearby btn
    right: SPACING.lg,
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: ms(-4),
    right: ms(-4),
    backgroundColor: colors.accent,
    borderRadius: ms(12),
    minWidth: ms(24),
    height: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(6),
    borderWidth: ms(2),
    borderColor: colors.white,
  },
  fabBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default HomeScreen;
