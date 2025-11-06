// src/shared/components/CustomButton.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const CustomButtonComponent: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  // Memoize computed styles
  const buttonStyle = useMemo(
    () => [
      styles.button,
      styles[variant],
      styles[`size_${size}`],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ],
    [variant, size, fullWidth, disabled, style]
  );

  const textStyleCombined = useMemo(
    () => [
      styles.text,
      styles[`text_${variant}`],
      styles[`textSize_${size}`],
      disabled && styles.textDisabled,
      textStyle,
    ],
    [variant, size, disabled, textStyle]
  );

  // Memoize spinner color
  const spinnerColor = useMemo(
    () => (variant === 'outline' ? COLORS.primary : COLORS.white),
    [variant]
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text style={textStyleCombined}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Memoize component with custom comparison
export const CustomButton = memo(CustomButtonComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.fullWidth === nextProps.fullWidth &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.icon === nextProps.icon &&
    prevProps.style === nextProps.style &&
    prevProps.textStyle === nextProps.textStyle
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  size_small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  size_medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  size_large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: COLORS.white,
  },
  text_secondary: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  
  textSize_small: {
    fontSize: FONT_SIZES.sm,
  },
  textSize_medium: {
    fontSize: FONT_SIZES.base,
  },
  textSize_large: {
    fontSize: FONT_SIZES.lg,
  },
  
  textDisabled: {
    opacity: 0.7,
  },
});
