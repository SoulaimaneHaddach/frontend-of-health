// src/screens/doctor/components/ModernTabBar.tsx
import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../../shared/constants/theme';
import { useTheme } from '../../../context/ThemeContext';

export type TabKey = 'Info' | 'About' | 'Services' | 'Hours' | 'Location';

export type TabItem = {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
};

interface ModernTabBarProps {
  tabs: TabItem[];
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
  isDark: boolean;
}

export const ModernTabBar: React.FC<ModernTabBarProps> = ({ tabs, activeKey, onChange, isDark }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabScrollContainer}
      contentContainerStyle={styles.tabScrollContent}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.modernTab, isActive && styles.modernTabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
              <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.modernTabText, isActive && styles.modernTabTextActive]}>
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  tabScrollContainer: {
    marginBottom: SPACING.lg,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  modernTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: isDark ? colors.card : colors.white,
    borderWidth: 1,
    borderColor: isDark ? colors.border : colors.border,
    ...SHADOWS.small,
  },
  modernTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...SHADOWS.medium,
  },
  modernTabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: isDark ? colors.textSecondary : colors.textSecondary,
  },
  modernTabTextActive: {
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.white,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ModernTabBar;
