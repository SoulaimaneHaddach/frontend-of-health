// src/screens/doctor/components/ServicesSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

interface ServicesSectionProps {
  isDark: boolean;
  services: string[];
  newService: string;
  onChangeNewService: (v: string) => void;
  onAddService: () => void;
  onRemoveService: (index: number) => void;
  styles: any;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  isDark,
  services,
  newService,
  onChangeNewService,
  onAddService,
  onRemoveService,
  styles,
}) => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  
  return (
    <SectionCard 
      title={t.servicesOffered} 
      icon="medical" 
      isDark={isDark}
      hint={t.servicesOffered}
    >
      <View style={[styles.addServiceRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.serviceInputWrapper}>
          <InputField 
            placeholder="e.g., General Consultation, ECG Testing"
            value={newService}
            onChangeText={onChangeNewService}
            onSubmitEditing={onAddService}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity 
          style={[styles.addServiceButton, !newService.trim() && styles.addServiceButtonDisabled]}
          onPress={onAddService}
          activeOpacity={0.7}
          disabled={!newService.trim()}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {services && services.length > 0 ? (
        <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <View key={index} style={[styles.serviceChip, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                <Text style={styles.serviceChipText}>{service}</Text>
                <TouchableOpacity 
                  onPress={() => onRemoveService(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="medical-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>{t.noBookings}</Text>
          <Text style={styles.emptyStateHint}>{t.services}</Text>
        </View>
      )}
    </SectionCard>
  );
};

export default ServicesSection;
