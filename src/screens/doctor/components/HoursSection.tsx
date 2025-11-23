// src/screens/doctor/components/HoursSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import { FONT_SIZES, SPACING } from '../../../shared/constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { WorkingHours } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

interface HoursSectionProps {
  isDark: boolean;
  hours: WorkingHours[];
  onUpdate: (index: number, field: keyof WorkingHours, value: any) => void;
  onRemove: (index: number) => void;
  onAddDefault: () => void;
  onAddNew: () => void;
  styles: any; 
}

export const HoursSection: React.FC<HoursSectionProps> = ({
  isDark,
  hours,
  onUpdate,
  onRemove,
  onAddDefault,
  onAddNew,
  styles,
}) => {
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  
  return (
    <SectionCard 
      title={t.workingHours} 
      icon="time" 
      isDark={isDark}
      hint={t.workingHours}
    >
      {hours && hours.length > 0 ? (
        <>
          {hours.map((hour, index) => (
            <View key={index} style={styles.hourCard}>
              <View style={styles.hourCardHeader}>
                <View style={styles.dayInputWrapper}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder="Day (e.g., Mon-Fri)"
                    value={hour.day}
                    onChangeText={(v: string) => onUpdate(index, 'day', v)}
                    style={{
                      flex: 1,
                      fontSize: FONT_SIZES.base,
                      color: colors.text,
                      paddingVertical: SPACING.sm,
                    }}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.deleteHourButton}
                  onPress={() => onRemove(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.closedToggleButton}
                onPress={() => onUpdate(index, 'isClosed', !hour.isClosed)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={hour.isClosed ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={hour.isClosed ? colors.error : colors.primary}
                />
                <Text style={[styles.closedToggleLabel, hour.isClosed && { color: colors.error }, isRTL && { textAlign: 'right' }]}> 
                  {t.closed}
                </Text>
              </TouchableOpacity>

              {!hour.isClosed && (
                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Open</Text>
                    <View style={styles.timeInputWrapper}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <TextInput 
                        placeholder="09:00"
                        value={hour.openTime}
                        onChangeText={(v: string) => onUpdate(index, 'openTime', v)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          fontSize: FONT_SIZES.base,
                          color: colors.text,
                          paddingVertical: SPACING.sm,
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.timeArrow}>
                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                  </View>

                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Close</Text>
                    <View style={styles.timeInputWrapper}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <TextInput 
                        placeholder="17:00"
                        value={hour.closeTime}
                        onChangeText={(v: string) => onUpdate(index, 'closeTime', v)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          fontSize: FONT_SIZES.base,
                          color: colors.text,
                          paddingVertical: SPACING.sm,
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addHourButton}
            onPress={onAddNew}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addHourButtonText}>Add Another Day</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>No working hours set</Text>
          <TouchableOpacity onPress={onAddDefault} activeOpacity={0.7} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Add Default Hours</Text>
          </TouchableOpacity>
          <Text style={styles.emptyStateHint}>Mon-Fri: 9-5, Sat: 9-1, Sun: Closed</Text>
        </View>
      )}
    </SectionCard>
  );
};

export default HoursSection;
