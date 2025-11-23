// src/screens/doctor/components/SectionCard.tsx
import React, { ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../../shared/constants/theme';
import { useTheme } from '../../../context/ThemeContext';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, isRTL), [colors, isRTL]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
};

const createStyles = (colors: any, isRTL: boolean) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
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
    color: colors.text,
    textAlign: isRTL ? 'right' : 'left',
    flex: 1,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
    textAlign: isRTL ? 'right' : 'left',
  },
});

export default SectionCard;
