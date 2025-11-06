// src/shared/utils/themeUtils.ts
/**
 * Theme utility functions for creating consistent styles
 */

import { TextStyle, ViewStyle } from 'react-native';
import { ColorPalette, Shadow } from '../constants/theme.types';

/**
 * Create a text style with theme colors
 */
export const createTextStyle = (
  colors: ColorPalette,
  options: {
    color?: keyof ColorPalette;
    fontSize?: number;
    fontWeight?: TextStyle['fontWeight'];
    textAlign?: TextStyle['textAlign'];
  } = {}
): TextStyle => ({
  color: options.color ? colors[options.color] : colors.text,
  fontSize: options.fontSize,
  fontWeight: options.fontWeight,
  textAlign: options.textAlign,
});

/**
 * Create a container style with theme colors
 */
export const createContainerStyle = (
  colors: ColorPalette,
  options: {
    backgroundColor?: keyof ColorPalette;
    borderColor?: keyof ColorPalette;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    margin?: number;
  } = {}
): ViewStyle => ({
  backgroundColor: options.backgroundColor ? colors[options.backgroundColor] : colors.card,
  borderColor: options.borderColor ? colors[options.borderColor] : undefined,
  borderWidth: options.borderWidth,
  borderRadius: options.borderRadius,
  padding: options.padding,
  margin: options.margin,
});

/**
 * Create a card style with theme-aware shadow
 */
export const createCardStyle = (
  colors: ColorPalette,
  shadow: Shadow,
  options: {
    backgroundColor?: keyof ColorPalette;
    borderRadius?: number;
    padding?: number;
  } = {}
): ViewStyle => ({
  backgroundColor: options.backgroundColor ? colors[options.backgroundColor] : colors.card,
  borderRadius: options.borderRadius ?? 12,
  padding: options.padding ?? 16,
  ...shadow,
});

/**
 * Get opacity variant of a color
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Create a button style with theme colors
 */
export const createButtonStyle = (
  colors: ColorPalette,
  options: {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  } = {}
): ViewStyle => {
  const { variant = 'primary', size = 'md', disabled = false } = options;

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 24 },
    lg: { paddingVertical: 16, paddingHorizontal: 32 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? withOpacity(colors.primary, 0.5) : colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: disabled ? withOpacity(colors.secondary, 0.5) : colors.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: disabled ? withOpacity(colors.primary, 0.5) : colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  };

  return {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

/**
 * Create input field style with theme colors
 */
export const createInputStyle = (
  colors: ColorPalette,
  options: {
    error?: boolean;
    focused?: boolean;
  } = {}
): ViewStyle => ({
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: options.error
    ? colors.error
    : options.focused
    ? colors.primary
    : colors.border,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
});
