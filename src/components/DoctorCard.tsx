// src/components/DoctorCard.tsx
import React, { useRef, useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';

import { DoctorMapDto } from '../services/api';

interface DoctorCardProps {
  doctor: DoctorMapDto | null;
  visible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  slideAnim: Animated.Value;
  panY: Animated.Value;
  panResponder: any;
  userLocation?: { latitude: number; longitude: number };
}

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

const DoctorCardComponent: React.FC<DoctorCardProps> = ({
  doctor,
  visible,
  onClose,
  onViewDetails,
  slideAnim,
  panY,
  panResponder,
  userLocation,
}) => {
  const { isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);

  // Memoize distance calculation
  const distance = useMemo(() => {
    if (!userLocation || !doctor?.location) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      doctor.location.latitude,
      doctor.location.longitude
    );
  }, [userLocation, doctor?.location]);

  // Memoize specialty config
  const specialtyIcon = useMemo(
    () => getSpecialtyIcon(doctor?.specialization),
    [doctor?.specialization]
  );

  const specialtyColor = useMemo(
    () => getSpecialtyColor(doctor?.specialization),
    [doctor?.specialization]
  );

  // Memoize callback
  const handleDirections = useCallback(() => {
    if (doctor?.location) {
      const url = Platform.select({
        ios: `maps:0,0?q=${doctor.location.latitude},${doctor.location.longitude}`,
        android: `geo:0,0?q=${doctor.location.latitude},${doctor.location.longitude}(${doctor.name})`,
      });
      if (url) {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            const webUrl = `https://www.google.com/maps/search/?api=1&query=${doctor.location!.latitude},${doctor.location!.longitude}`;
            Linking.openURL(webUrl);
          }
        });
      }
    }
  }, [doctor]);

  if (!visible || !doctor) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: Animated.add(slideAnim, panY) }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Drag Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: specialtyColor },
          ]}
        >
          <Ionicons
            name={specialtyIcon}
            size={40}
            color={COLORS.white}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
          <View style={[
            styles.specialtyBadge,
            { backgroundColor: specialtyColor + '20' }
          ]}>
            <Text style={[
              styles.specialty,
              { color: specialtyColor }
            ]}>
              {doctor.specialization}
            </Text>
          </View>
        </View>
        {/* <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity> */}
      </View>

      {/* Distance Badge */}
      {distance !== null && (
        <View style={styles.distanceContainer}>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={16} color={COLORS.primary} />
            <Text style={styles.distanceText}>
              {distance < 1 
                ? `${Math.round(distance * 1000)}m away` 
                : `${distance.toFixed(1)}km away`}
            </Text>
          </View>
        </View>
      )}

      {/* Address Section */}
      {doctor.location?.address && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.addressText}>{doctor.location.address}</Text>
        </View>
      )}

      {/* Contact Info
      {doctor.phoneNumber && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          <Text style={styles.contactText}>{doctor.phoneNumber}</Text>
        </View>
      )} */}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onViewDetails}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>View Details</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Call</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleDirections}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: SPACING.lg,
    ...SHADOWS.large,
    elevation: 20,
  },
  handleContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: isDark ? COLORS.darkBorder : COLORS.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    marginBottom: 6,
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  specialty: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  distanceContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? COLORS.darkCardSecondary : COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: isDark ? COLORS.darkPrimary : COLORS.primary,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
  },
  addressText: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
    lineHeight: 22,
    marginLeft: 28,
  },
  contactText: {
    fontSize: FONT_SIZES.base,
    color: isDark ? COLORS.darkPrimary : COLORS.primary,
    fontWeight: '600',
    marginLeft: 28,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
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
  primaryButton: {
    backgroundColor: isDark ? COLORS.darkPrimary : COLORS.primary,
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: isDark ? COLORS.darkCardSecondary : COLORS.background,
    borderWidth: 1,
    borderColor: isDark ? COLORS.darkBorder : COLORS.border,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: isDark ? COLORS.darkPrimary : COLORS.primary,
  },
});

export const DoctorCard = memo(DoctorCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.doctor?.id === nextProps.doctor?.id &&
    prevProps.userLocation?.latitude === nextProps.userLocation?.latitude &&
    prevProps.userLocation?.longitude === nextProps.userLocation?.longitude
  );
});
