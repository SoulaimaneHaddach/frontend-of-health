// src/shared/constants/theme.types.ts
/**
 * Type-safe theme definitions
 */

export interface ColorPalette {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Accent
  accent: string;
  accentLight: string;
  
  // Backgrounds
  background: string;
  card: string;
  cardSecondary?: string;
  surface: string;
  
  // Text
  text: string;
  textSecondary: string;
  textLight: string;
  
  // Borders
  border: string;
  borderLight: string;
  
  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Special
  white: string;
  shadow: string;
}

export interface Theme {
  colors: ColorPalette;
  dark: boolean;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface FontSizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
}

export interface Shadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Shadows {
  small: Shadow;
  medium: Shadow;
  large: Shadow;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeContextValue {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  theme: Theme;
  colors: ColorPalette;
  spacing: Spacing;
  radius: BorderRadius;
  fontSizes: FontSizes;
  shadows: Shadows;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}
