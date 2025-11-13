// src/screens/doctor/components/SectionCard.tsx
import React, { ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../../shared/constants/theme';
import { useLanguage } from '../../../context/LanguageContext';

interface SectionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint?: string;
  isDark: boolean;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon, hint, isDark, children }) => {
  const { isRTL } = useLanguage();
  const styles = useMemo(() => createStyles(isDark, isRTL), [isDark, isRTL]);

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

const createStyles = (isDark: boolean, isRTL: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? COLORS.darkCard : COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: isDark ? COLORS.darkText : COLORS.textPrimary,
    textAlign: isRTL ? 'right' : 'left',
    flex: 1,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: isDark ? COLORS.darkTextSecondary : COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
    textAlign: isRTL ? 'right' : 'left',
  },
});

export default SectionCard;
