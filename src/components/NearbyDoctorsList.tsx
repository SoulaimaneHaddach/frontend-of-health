// src/components/NearbyDoctorsModal.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import { DoctorResponseDto, DoctorMapDto } from '../services/api';

interface NearbyDoctorsModalProps {
  doctors: Array<DoctorResponseDto | DoctorMapDto>;
  visible: boolean;
  onDoctorPress: (doctor: DoctorResponseDto | DoctorMapDto) => void;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number };
}

const SPECIALTY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  all: { icon: 'apps', color: '#4A90E2' },
  hearing: { icon: 'ear', color: '#9B59B6' },
  orthopedic: { icon: 'fitness', color: '#F39C12' },
  brain: { icon: 'pulse', color: '#E74C3C' },
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

type SortOption = 'distance' | 'name' | 'specialty';

const getSpecialtyIcon = (specialty?: string): keyof typeof Ionicons.glyphMap => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.icon || 'medical';
};

const getSpecialtyColor = (specialty?: string): string => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.color || '#4A90E2';
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to translate specialty
const getTranslatedSpecialty = (specialty: string, t: any): string => {
  const key = specialty?.toLowerCase() || '';
  return (t[key] as string) || specialty;
};

export const NearbyDoctorsModal: React.FC<NearbyDoctorsModalProps> = ({
  doctors,
  visible,
  onDoctorPress,
  onClose,
  userLocation,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { t, isRTL } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  const sortedDoctors = useMemo<Array<DoctorResponseDto | DoctorMapDto>>(() => {
    if (!doctors || doctors.length === 0) return [];
    const list = [...doctors];
    if (sortBy === 'distance' && userLocation) {
      return list.sort((a, b) => {
        const da = a.location
          ? calculateDistance(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude)
          : Number.POSITIVE_INFINITY;
        const db = b.location
          ? calculateDistance(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude)
          : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (sortBy === 'specialty') {
      return list.sort((a, b) => (a.specialization || '').localeCompare(b.specialization || ''));
    }
    return list;
  }, [doctors, sortBy, userLocation]);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerLeft, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.iconBadge}>
              <Ionicons name="location" size={30} color={colors.white} />
            </View>
            <View>
              <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t.nearbyDoctors}</Text>
              <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}> 
                {doctors.length} {doctors.length === 1 ? t.name : t.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {/* Sort Options */}
        {doctors.length > 0 && (
          <View style={styles.sortContainer}>
            <Text style={[styles.sortLabel, isRTL && { textAlign: 'right' }]}>{t.filter}:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.sortOptions, isRTL && { flexDirection: 'row-reverse' }]}
            >
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive, isRTL && { flexDirection: 'row-reverse' }]}
                onPress={() => setSortBy('distance')}
              >
                          <Ionicons 
                            name="navigate" 
                            size={12} 
                            color={colors.primary} 
                          />
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'distance' && styles.sortButtonTextActive
                ]}>
                  {t.location}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive, isRTL && { flexDirection: 'row-reverse' }]}
                onPress={() => setSortBy('name')}
              >
                <Ionicons 
                  name="person" 
                  size={16} 
                  color={sortBy === 'name' ? colors.white : colors.textSecondary} 
                />
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'name' && styles.sortButtonTextActive
                ]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'specialty' && styles.sortButtonActive, isRTL && { flexDirection: 'row-reverse' }]}
                onPress={() => setSortBy('specialty')}
              >
                <Ionicons 
                  name="medical" 
                  size={16} 
                  color={sortBy === 'specialty' ? colors.white : colors.textSecondary} 
                />
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'specialty' && styles.sortButtonTextActive
                ]}>
                  {t.specialty}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {doctors.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="map-outline" size={64} color={colors.textLight} />
              </View>
              <Text style={styles.emptyText}>{t.nearbyDoctors}</Text>
              <Text style={styles.emptySubText}>
                {t.search}
              </Text>
            </View>
          ) : (
            sortedDoctors.map((doctor, index) => {
              const distance = userLocation && doctor.location
                ? calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    doctor.location.latitude,
                    doctor.location.longitude
                  )
                : null;

              return (
                <TouchableOpacity
                  key={index.toString()}
                  style={styles.doctorCard}
                  onPress={() => {
                    onDoctorPress(doctor);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardContent, isRTL && { flexDirection: 'row-reverse' }]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: getSpecialtyColor(doctor.specialization) },
                        isRTL && { marginRight: 0, marginLeft: SPACING.md }
                      ]}
                    >
                      <Ionicons 
                        name={getSpecialtyIcon(doctor.specialization)}
                        size={32}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.doctorInfo}>
                      <View style={[styles.nameRow, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Text style={[styles.doctorName, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                          {doctor.name}
                        </Text>
                        {distance !== null && (
                          <View style={[styles.distanceBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="navigate" size={12} color={colors.primary} />
                            <Text style={styles.distanceText}>
                              {distance < 1 
                                ? `${Math.round(distance * 1000)}m` 
                                : `${distance.toFixed(1)}km`}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.specialtyRow, isRTL && { alignItems: 'flex-end' }]}>
                        <View style={[
                          styles.specialtyBadge,
                          { backgroundColor: getSpecialtyColor(doctor.specialization) + '20' }
                        ]}>
                          <Text style={[
                            styles.doctorSpecialty,
                            { color: getSpecialtyColor(doctor.specialization) },
                            isRTL && { textAlign: 'right' }
                          ]}>
                            {getTranslatedSpecialty(doctor.specialization, t)}
                          </Text>
                        </View>
                      </View>
                      {doctor.location?.address && (
                        <View style={[styles.locationRow, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Ionicons name="location" size={14} color={colors.textSecondary} />
                          <Text style={[styles.addressText, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
                            {doctor.location.address}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons 
                    name={isRTL ? "chevron-back" : "chevron-forward"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  iconBadge: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginTop: 2 },
  closeButton: { padding: 4 },
  sortContainer: { backgroundColor: colors.card, paddingVertical: SPACING.sm, paddingLeft: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  sortLabel: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginBottom: SPACING.xs, fontWeight: '600' },
  sortOptions: { flexDirection: 'row', gap: SPACING.sm, paddingRight: SPACING.lg },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  sortButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortButtonText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, fontWeight: '600' },
  sortButtonTextActive: { color: colors.white },
  listContent: { padding: SPACING.lg, gap: SPACING.md },
  doctorCard: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', ...SHADOWS.medium },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, ...SHADOWS.small },
  doctorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  doctorName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: colors.text, flex: 1, marginRight: SPACING.sm },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  distanceText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: colors.primary },
  specialtyRow: { marginBottom: 6 },
  specialtyBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  doctorSpecialty: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xl * 4, paddingHorizontal: SPACING.xl },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, ...SHADOWS.medium },
  emptyText: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: colors.textSecondary, marginTop: SPACING.md },
  emptySubText: { fontSize: FONT_SIZES.base, color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 22 },
});
