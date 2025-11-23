// src/shared/components/CustomButton.tsx
import React, { memo, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { FONT_SIZES, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors } = useTheme();
  const styles = createStyles();

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary, ...SHADOWS.small };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { backgroundColor: colors.primary, ...SHADOWS.small };
    }
  }, [variant, colors]);

  const textVariantStyle = useMemo(() => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return { color: colors.primary };
      case 'secondary':
        return { color: colors.white };
      case 'primary':
      default:
        return { color: colors.white };
    }
  }, [variant, colors]);

  const buttonStyle = useMemo(
    () => [
      styles.button,
      variantStyle,
      styles[`size_${size}`],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ],
    [variantStyle, size, fullWidth, disabled, style, styles]
  );

  const textStyleCombined = useMemo(
    () => [
      styles.text,
      textVariantStyle,
      styles[`textSize_${size}`],
      disabled && styles.textDisabled,
      textStyle,
    ],
    [textVariantStyle, size, disabled, textStyle, styles]
  );

  // Memoize spinner color
  const spinnerColor = useMemo(() => (variant === 'outline' ? colors.primary : colors.white), [variant, colors]);

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

const createStyles = () => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
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
