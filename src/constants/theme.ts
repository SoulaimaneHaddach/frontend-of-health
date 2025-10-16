// src/constants/theme.ts
export const COLORS = {
  // Primary palette - Calming medical blue
  primary: '#4A90E2',
  primaryLight: '#6BA3E8',
  primaryDark: '#357ABD',
  
  // Secondary palette - Trust green
  secondary: '#2ECC71',
  secondaryLight: '#52D98C',
  secondaryDark: '#27AE60',
  
  // Accent colors
  accent: '#FF6B6B',
  accentLight: '#FF8E8E',
  
  // Specialty colors
  hearing: '#9B59B6',
  brain: '#E74C3C',
  orthopedic: '#F39C12',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F8F9FC',
  cardBackground: '#FFFFFF',
  
  // Text
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#BDC3C7',
  
  // Status
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  
  // Borders
  border: '#E8ECEF',
  borderLight: '#F1F3F5',
};

export const FONTS = {
  light: 'System',
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};