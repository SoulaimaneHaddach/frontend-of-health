// src/components/BottomNavBar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SpecialtyType } from '../types';

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
const specialties: { label: string; type: SpecialtyType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', type: 'all', icon: 'apps' },
  { label: 'Hearing', type: 'hearing', icon: 'ear' },
  { label: 'Orthopedic', type: 'orthopedic', icon: 'fitness' },
  { label: 'Brain', type: 'brain', icon: 'pulse' },
  { label: 'Cardiology', type: 'cardiology', icon: 'heart' },
  { label: 'Dermatology', type: 'dermatology', icon: 'color-palette' },
  { label: 'Pediatrics', type: 'pediatrics', icon: 'people' },
  { label: 'Ophthalmology', type: 'ophthalmology', icon: 'eye' },
  { label: 'Psychiatry', type: 'psychiatry', icon: 'happy' },
  { label: 'Gastroenterology', type: 'gastroenterology', icon: 'restaurant' },
  { label: 'Endocrinology', type: 'endocrinology', icon: 'flask' },
  { label: 'Neurology', type: 'neurology', icon: 'pulse' }, 
  { label: 'ENT', type: 'ent', icon: 'volume-high' },
  { label: 'Urology', type: 'urology', icon: 'water-outline' },
  { label: 'Nephrology', type: 'nephrology', icon: 'water' },
  { label: 'Oncology', type: 'oncology', icon: 'bandage' },
  { label: 'Gynecology', type: 'gynecology', icon: 'woman' },
  { label: 'Dentistry', type: 'dentistry', icon: 'hammer' },
  { label: 'Pulmonology', type: 'pulmonology', icon: 'cloud' },
  { label: 'Rheumatology', type: 'rheumatology', icon: 'trending-up' },
  { label: 'Allergy', type: 'allergy', icon: 'medkit' },
];


  return (
    <View style={[styles.container, { backgroundColor: colors.card }] }>
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
    paddingBottom: 30,
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
