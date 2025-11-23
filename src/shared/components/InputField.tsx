// src/shared/components/InputField.tsx
import React, { useState, memo, useMemo, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADIUS, SPACING } from '../constants/theme';
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
  const { colors } = useTheme();

  // Memoize dynamic styles
  const dynamicContainerStyles = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderColor: colors.border,
    }),
    [colors]
  );

  const dynamicLabelStyle = useMemo(
    () => ({
      color: colors.text,
    }),
    [colors]
  );

  const dynamicInputStyle = useMemo(
    () => ({
      color: colors.text,
    }),
    [colors]
  );

  const iconColor = useMemo(
    () => (isFocused ? colors.primary : colors.textSecondary),
    [isFocused, colors]
  );

  const placeholderColor = useMemo(
    () => colors.textSecondary,
    [colors]
  );

  const eyeIconColor = useMemo(
    () => colors.textSecondary,
    [colors]
  );

  // Memoize container style array
  const containerStyle = useMemo(
    () => [
      styles.inputContainer,
      dynamicContainerStyles,
      isFocused && { borderColor: colors.primary, borderWidth: 2 },
      error && { borderColor: colors.error },
    ],
    [dynamicContainerStyles, isFocused, error, colors]
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
      
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
    borderWidth: 2,
  },
  inputContainerError: {
    
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
