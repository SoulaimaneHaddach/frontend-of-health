// src/components/CustomButton.tsx
import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, SHADOWS } from '../shared/constants/theme';
import { useTheme } from '../context/ThemeContext';

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
export const CustomButton: React.FC<CustomButtonProps> = ({
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
  const { colors } = useTheme();
  const stylesLocal = useMemo(() => createStyles(colors), [colors]);
  const buttonStyle = [
    stylesLocal.button,
    stylesLocal[variant],
    stylesLocal[`size_${size}`],
    fullWidth && stylesLocal.fullWidth,
    disabled && stylesLocal.disabled,
    style,
  ];
  const textStyleCombined = [
    stylesLocal.text,
    stylesLocal[`text_${variant}`],
    stylesLocal[`textSize_${size}`],
    disabled && stylesLocal.textDisabled,
    textStyle,
  ];
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <>
          {icon}
          <Text style={textStyleCombined}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
const createStyles = (colors: any) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  
  primary: {
    backgroundColor: colors.primary,
    ...SHADOWS.small,
  },
  secondary: {
    backgroundColor: colors.secondary,
    ...SHADOWS.small,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
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
    color: colors.white,
  },
  text_secondary: {
    color: colors.white,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
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
