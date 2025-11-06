// src/shared/hooks/useThemedStyles.ts
/**
 * Custom hook for creating theme-aware styles
 * Automatically recreates styles when theme changes
 */

import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from './useTheme';
import { ThemeContextValue } from '../constants/theme.types';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Hook to create theme-aware styles that update when theme changes
 * 
 * @example
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing.md,
 *   },
 *   title: {
 *     color: theme.colors.text,
 *     fontSize: theme.fontSizes.xl,
 *   },
 * }));
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  styleFactory: (theme: ThemeContextValue) => T
): T {
  const theme = useTheme();

  return useMemo(
    () => StyleSheet.create(styleFactory(theme)),
    [theme.isDarkMode, styleFactory]
  );
}

/**
 * Hook to get raw theme values without styles
 * Useful for dynamic calculations or animations
 * 
 * @example
 * const { colors, spacing } = useThemeValues();
 * const dynamicColor = isActive ? colors.primary : colors.secondary;
 */
export function useThemeValues() {
  const theme = useTheme();
  
  return useMemo(
    () => ({
      colors: theme.colors,
      spacing: theme.spacing,
      radius: theme.radius,
      fontSizes: theme.fontSizes,
      shadows: theme.shadows,
      isDarkMode: theme.isDarkMode,
    }),
    [theme]
  );
}
