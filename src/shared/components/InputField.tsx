// src/shared/components/InputField.tsx
import React, { useState, memo, useMemo, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

const InputFieldComponent: React.FC<InputFieldProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { isDarkMode } = useTheme();

  // Memoize dynamic styles
  const dynamicContainerStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? COLORS.darkCard : COLORS.white,
      borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
    }),
    [isDarkMode]
  );

  const dynamicLabelStyle = useMemo(
    () => ({
      color: isDarkMode ? COLORS.darkText : COLORS.textPrimary,
    }),
    [isDarkMode]
  );

  const dynamicInputStyle = useMemo(
    () => ({
      color: isDarkMode ? COLORS.darkText : COLORS.textPrimary,
    }),
    [isDarkMode]
  );

  const iconColor = useMemo(
    () =>
      isFocused
        ? COLORS.primary
        : isDarkMode
        ? COLORS.darkTextSecondary
        : COLORS.textSecondary,
    [isFocused, isDarkMode]
  );

  const placeholderColor = useMemo(
    () => (isDarkMode ? COLORS.darkTextSecondary : COLORS.textLight),
    [isDarkMode]
  );

  const eyeIconColor = useMemo(
    () => (isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary),
    [isDarkMode]
  );

  // Memoize container style array
  const containerStyle = useMemo(
    () => [
      styles.inputContainer,
      dynamicContainerStyles,
      isFocused && styles.inputContainerFocused,
      error && styles.inputContainerError,
    ],
    [dynamicContainerStyles, isFocused, error]
  );

  // Memoize callbacks
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const togglePasswordVisibility = useCallback(
    () => setIsPasswordVisible((prev) => !prev),
    []
  );

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, dynamicLabelStyle]}>{label}</Text>}
      
      <View style={containerStyle}>
        {icon && (
          <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
        )}
        
        <TextInput
          style={[styles.input, dynamicInputStyle, style]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={eyeIconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.error, { color: COLORS.error }]}>{error}</Text>}
    </View>
  );
};

// Memoize component
export const InputField = memo(InputFieldComponent, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.error === nextProps.error &&
    prevProps.icon === nextProps.icon &&
    prevProps.isPassword === nextProps.isPassword &&
    prevProps.value === nextProps.value &&
    prevProps.style === nextProps.style
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  error: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
