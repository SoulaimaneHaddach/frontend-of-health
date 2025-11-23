// src/components/DoctorCard.tsx
import React, { useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import { vs, ms } from '../shared/constants/responsive';

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

const SPECIALTY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color?: string }> = {
  all: { icon: 'apps', color: undefined },
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

const getSpecialtyIcon = (specialty?: string): keyof typeof Ionicons.glyphMap => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.icon || 'medical';
};

const getSpecialtyColor = (specialty?: string, colors?: any): string => {
  const normalized = specialty?.toLowerCase() || 'all';
  return SPECIALTY_CONFIG[normalized]?.color || (colors ? colors.primary : '#2196F3');
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

// Helper to translate specialty (kept for future use)
/* eslint-disable @typescript-eslint/no-unused-vars */
const getTranslatedSpecialty = (specialty: string, t: any): string => {
  const key = specialty?.toLowerCase() || '';
  return (t[key] as string) || specialty;
};
/* eslint-enable @typescript-eslint/no-unused-vars */

const DoctorCardComponent: React.FC<DoctorCardProps> = ({
  doctor,
  visible,
  onClose: _onClose,
  onViewDetails,
  slideAnim,
  panY,
  panResponder,
  userLocation,
}) => {
  const { isDarkMode, colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // Respect safe area / bottom nav so card isn't hidden.
  // Position the card above the navbar by accounting for the safe-area inset
  // plus the card's bottom padding so action buttons aren't covered.
  const insets = useSafeAreaInsets();
  const bottomPosition = (insets?.bottom ?? 0) + SPACING.lg + 1;

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
    () => getSpecialtyColor(doctor?.specialization, colors),
    [doctor?.specialization, colors]
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
        { bottom: bottomPosition },
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
            size={ms(40)}
            color={colors.white}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
            <View style={[
              styles.specialtyBadge,
              { backgroundColor: (specialtyColor || colors.primary) + '20' }
            ]}>
            <Text style={[
              styles.specialty,
              { color: specialtyColor }
            ]}>
              {doctor.specialization}
            </Text>
          </View>
        </View>
        {doctor.location?.address && (
          <View style={styles.headerRight}>
            <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.address}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: ms(6) }}>
              <Ionicons name="location" size={ms(14)} color={colors.primary} />
              <Text style={[styles.headerAddressText, isRTL && { textAlign: 'right', marginLeft: 0 }]} numberOfLines={2}>
                {doctor.location.address}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Distance Badge */}
      {distance !== null && (
        <View style={styles.distanceContainer}>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={ms(16)} color={colors.primary} />
              <Text style={[styles.distanceText, isRTL && { textAlign: 'right' }]}> 
              {distance < 1 
                ? `${Math.round(distance * 1000)}m` 
                : `${distance.toFixed(1)}km`}
            </Text>
          </View>
        </View>
      )}

      {/* Address moved to header (top-right) */}


      {/* Action Buttons */}
      <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
          onPress={onViewDetails}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={ms(20)} color={colors.white} />
          <Text style={styles.primaryButtonText}>{t.viewProfile}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleDirections}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={ms(20)} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>{t.address}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any, _isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingBottom: ms(60),
    ...SHADOWS.large,
    elevation: 20,
  },
  handleContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  handle: {
    width: ms(40),
    height: vs(4),
    backgroundColor: colors.border,
    borderRadius: ms(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
    maxWidth: ms(140),
  },
  headerAddressText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginTop: ms(4),
  },
  avatar: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(RADIUS.lg),
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
    color: colors.text,
    marginBottom: ms(6),
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(RADIUS.sm),
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
    gap: ms(8),
    backgroundColor: colors.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: ms(RADIUS.full),
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.primary,
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
    color: colors.text,
  },
  addressText: {
    fontSize: FONT_SIZES.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginLeft: ms(28),
  },
  contactText: {
    fontSize: FONT_SIZES.base,
    color: colors.primary,
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
    borderRadius: ms(RADIUS.md),
    gap: ms(6),
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.primary,
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
