// src/components/BottomNavBar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SpecialtyType } from '../shared/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
  selectedSpecialty: SpecialtyType;
  onSpecialtySelect: (specialty: SpecialtyType) => void;
  onSearchPress: () => void;
}


export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  selectedSpecialty,
  onSpecialtySelect,
  onSearchPress,
}) => {
const { colors } = useTheme();
const { t } = useLanguage();
  const insets = useSafeAreaInsets();

const specialties: { label: string; type: SpecialtyType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: t.allSpecialties, type: 'all', icon: 'apps' },
  { label: t.hearing, type: 'hearing', icon: 'ear' },
  { label: t.orthopedic, type: 'orthopedic', icon: 'fitness' },
  { label: t.brain, type: 'brain', icon: 'pulse' },
  { label: t.cardiology, type: 'cardiology', icon: 'heart' },
  { label: t.dermatology, type: 'dermatology', icon: 'color-palette' },
  { label: t.pediatrics, type: 'pediatrics', icon: 'people' },
  { label: t.ophthalmology, type: 'ophthalmology', icon: 'eye' },
  { label: t.psychiatry, type: 'psychiatry', icon: 'happy' },
  { label: t.gastroenterology, type: 'gastroenterology', icon: 'restaurant' },
  { label: t.endocrinology, type: 'endocrinology', icon: 'flask' },
  { label: t.neurology, type: 'neurology', icon: 'pulse' }, 
  { label: t.ent, type: 'ent', icon: 'volume-high' },
  { label: t.urology, type: 'urology', icon: 'water-outline' },
  { label: t.nephrology, type: 'nephrology', icon: 'water' },
  { label: t.oncology, type: 'oncology', icon: 'bandage' },
  { label: t.gynecology, type: 'gynecology', icon: 'woman' },
  { label: t.dentistry, type: 'dentistry', icon: 'hammer' },
  { label: t.pulmonology, type: 'pulmonology', icon: 'cloud' },
  { label: t.rheumatology, type: 'rheumatology', icon: 'trending-up' },
  { label: t.allergy, type: 'allergy', icon: 'medkit' },
];


  // add a small extra bottom padding so navbar content is slightly elevated
  const bottomPadding = (insets?.bottom ?? 0) + SPACING.sm + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, paddingBottom: bottomPadding }]}>
      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
        <Ionicons name="search" size={28} color={colors.primary} />
      </TouchableOpacity>

      {/* Specialty Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {specialties.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.specialtyButton,
              { backgroundColor: colors.background },
              selectedSpecialty === item.type && { backgroundColor: colors.primary },
            ]}
            onPress={() => onSpecialtySelect(item.type)}
          >
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={selectedSpecialty === item.type ? colors.white : colors.primary}
            />
            <Text style={{
              color: selectedSpecialty === item.type ? colors.white : colors.primary,
              marginLeft: 4,
            }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  searchButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  specialtyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
});
