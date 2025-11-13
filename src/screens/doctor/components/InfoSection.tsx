// src/screens/doctor/components/InfoSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/theme';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';
import { useLanguage } from '../../../context/LanguageContext';

export interface SelectedSpecialty {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface InfoSectionProps {
  isDark: boolean;
  name: string;
  email: string;
  phoneNumber: string;
  selectedSpecialty?: SelectedSpecialty;
  errors?: { name?: string; email?: string; phoneNumber?: string; specialization?: string };
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
  onOpenSpecialtyModal: () => void;
  styles: any;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  isDark,
  name,
  email,
  phoneNumber,
  selectedSpecialty,
  errors = {},
  onChangeName,
  onChangeEmail,
  onChangePhone,
  onOpenSpecialtyModal,
  styles,
}) => {
  const { t, isRTL } = useLanguage();
  
  // Helper to get translated specialty
  const getTranslatedSpecialty = (value: string) => {
    return t[value as keyof typeof t] || value;
  };
  
  return (
    <SectionCard title={t.name} icon="person" isDark={isDark}>
      <InputField 
        label={t.name} 
        placeholder="Dr. John Doe"
        value={name}
        onChangeText={onChangeName}
        icon="person"
        error={errors.name}
      />

      {/* Specialty Picker */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t.specialty} *</Text>
        <TouchableOpacity 
          style={[styles.pickerButton, errors.specialization && styles.inputError, isRTL && { flexDirection: 'row-reverse' }]}
          onPress={onOpenSpecialtyModal}
          activeOpacity={0.7}
        >
          <View style={[styles.pickerContent, isRTL && { flexDirection: 'row-reverse' }]}>
            {selectedSpecialty ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: selectedSpecialty.color }]}>
                  <Ionicons name={selectedSpecialty.icon} size={20} color={COLORS.white} />
                </View>
                <Text style={[styles.pickerText, isRTL && { textAlign: 'right' }]}>
                  {getTranslatedSpecialty(selectedSpecialty.value)}
                </Text>
              </>
            ) : (
              <Text style={[styles.placeholderText, isRTL && { textAlign: 'right' }]}>{t.selectSpecialty}</Text>
            )}
          </View>
          <Ionicons 
            name={isRTL ? "chevron-back" : "chevron-down"} 
            size={20} 
            color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} 
          />
        </TouchableOpacity>
        {errors.specialization && (
          <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errors.specialization}</Text>
        )}
      </View>

      <InputField 
        label={t.email} 
        placeholder="doctor@example.com"
        value={email}
        onChangeText={onChangeEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail"
        error={errors.email}
      />

      <InputField 
        label={t.phone} 
        placeholder="+212 123 456 789"
        value={phoneNumber}
        onChangeText={onChangePhone}
        keyboardType="phone-pad"
        icon="call"
        error={errors.phoneNumber}
      />
    </SectionCard>
  );
};

export default InfoSection;
