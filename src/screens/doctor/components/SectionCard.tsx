// src/screens/doctor/components/SectionCard.tsx
import React, { ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../../shared/constants/theme';

interface SectionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint?: string;
  isDark: boolean;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon, hint, isDark, children }) => {
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
});

export default SectionCard;
