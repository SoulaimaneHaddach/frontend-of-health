// src/screens/doctor/components/HoursSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import { COLORS, FONT_SIZES, SPACING } from '../../../shared/constants/theme';
import { WorkingHours } from '../../../services/api';

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
  return (
    <SectionCard 
      title="Working Hours" 
      icon="time" 
      isDark={isDark}
      hint="Set your clinic's operating schedule"
    >
      {hours && hours.length > 0 ? (
        <>
          {hours.map((hour, index) => (
            <View key={index} style={styles.hourCard}>
              <View style={styles.hourCardHeader}>
                <View style={styles.dayInputWrapper}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder="Day (e.g., Mon-Fri)"
                    value={hour.day}
                    onChangeText={(v: string) => onUpdate(index, 'day', v)}
                    style={{
                      flex: 1,
                      fontSize: FONT_SIZES.base,
                      color: isDark ? COLORS.darkText : COLORS.textPrimary,
                      paddingVertical: SPACING.sm,
                    }}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.deleteHourButton}
                  onPress={() => onRemove(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
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
                  color={hour.isClosed ? COLORS.error : COLORS.primary}
                />
                <Text style={[styles.closedToggleLabel, hour.isClosed && { color: COLORS.error }]}>
                  Closed on this day
                </Text>
              </TouchableOpacity>

              {!hour.isClosed && (
                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Open</Text>
                    <View style={styles.timeInputWrapper}>
                      <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                      <TextInput 
                        placeholder="09:00"
                        value={hour.openTime}
                        onChangeText={(v: string) => onUpdate(index, 'openTime', v)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={COLORS.textLight}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          fontSize: FONT_SIZES.base,
                          color: isDark ? COLORS.darkText : COLORS.textPrimary,
                          paddingVertical: SPACING.sm,
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.timeArrow}>
                    <Ionicons name="arrow-forward" size={20} color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} />
                  </View>

                  <View style={styles.timeInputGroup}>
                    <Text style={styles.timeLabel}>Close</Text>
                    <View style={styles.timeInputWrapper}>
                      <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                      <TextInput 
                        placeholder="17:00"
                        value={hour.closeTime}
                        onChangeText={(v: string) => onUpdate(index, 'closeTime', v)}
                        keyboardType="numbers-and-punctuation"
                        placeholderTextColor={COLORS.textLight}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          fontSize: FONT_SIZES.base,
                          color: isDark ? COLORS.darkText : COLORS.textPrimary,
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
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addHourButtonText}>Add Another Day</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={isDark ? COLORS.darkTextSecondary : COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>No working hours set</Text>
          <TouchableOpacity onPress={onAddDefault} activeOpacity={0.7} style={{ marginTop: 8 }}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Add Default Hours</Text>
          </TouchableOpacity>
          <Text style={styles.emptyStateHint}>Mon-Fri: 9-5, Sat: 9-1, Sun: Closed</Text>
        </View>
      )}
    </SectionCard>
  );
};

export default HoursSection;
