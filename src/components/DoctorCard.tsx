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
import { FONT_SIZES, SPACING, SHADOWS } from '../shared/constants/theme';
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
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  const insets = useSafeAreaInsets();
  const bottomPosition = (insets?.bottom ?? 0) + SPACING.lg + 1;

  const distance = useMemo(() => {
    if (!userLocation || !doctor?.location) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      doctor.location.latitude,
      doctor.location.longitude
    );
  }, [userLocation, doctor?.location]);

  const specialtyIcon = useMemo(
    () => getSpecialtyIcon(doctor?.specialization),
    [doctor?.specialization]
  );

  const specialtyColor = useMemo(
    () => getSpecialtyColor(doctor?.specialization, colors),
    [doctor?.specialization, colors]
  );

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

      {/* Card Content */}
      <View style={styles.content}>
        {/* Header with Avatar and Info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: specialtyColor },
              ]}
            >
              <Ionicons
                name={specialtyIcon}
                size={ms(36)}
                color={colors.white}
              />
            </View>
            {distance !== null && (
              <View style={[styles.distancePill, { backgroundColor: colors.surface }]}>
                <Ionicons name="location" size={ms(12)} color={specialtyColor} />
                <Text style={[styles.distancePillText, { color: specialtyColor }]}>
                  {distance < 1 
                    ? `${Math.round(distance * 1000)}m` 
                    : `${distance.toFixed(1)}km`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {doctor.name}
            </Text>
            <View style={[
              styles.specialtyBadge,
              { backgroundColor: (specialtyColor || colors.primary) + '15' }
            ]}>
              <View style={[styles.specialtyDot, { backgroundColor: specialtyColor }]} />
              <Text style={[
                styles.specialty,
                { color: specialtyColor }
              ]}>
                {doctor.specialization}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: specialtyColor }]}
            onPress={onViewDetails}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={ms(24)} color={colors.white} />
            <Text style={styles.buttonLabel}>{t.viewProfile}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleDirections}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={ms(24)} color={specialtyColor} />
            <Text style={[styles.buttonLabelSecondary, { color: colors.text }]}>{t.directions}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingBottom: ms(50),
    ...SHADOWS.large,
    elevation: 24,
    borderTopWidth: isDark ? 0 : 0.5,
    borderTopColor: colors.border + '30',
  },
  handleContainer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    alignItems: 'center',
  },
  handle: {
    width: ms(42),
    height: vs(5),
    backgroundColor: colors.border,
    borderRadius: ms(3),
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatar: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    elevation: 8,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(12),
    marginTop: ms(8),
    gap: ms(4),
  },
  distancePillText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    paddingTop: ms(4),
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: ms(8),
    letterSpacing: -0.5,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderRadius: ms(10),
    gap: ms(6),
  },
  specialtyDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  specialty: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: SPACING.lg,
    opacity: 0.15,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: ms(16),
    gap: ms(8),
  },
  primaryButton: {
    ...SHADOWS.medium,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '30',
  },
  buttonLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.1,
  },
  buttonLabelSecondary: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    letterSpacing: 0.1,
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