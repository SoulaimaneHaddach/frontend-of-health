// src/components/InputField.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
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

  const dynamicContainerStyles = {
    backgroundColor: isDarkMode ? COLORS.darkCard : COLORS.white,
    borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border,
  } as const;

  const dynamicLabelStyle = {
    color: isDarkMode ? COLORS.darkText : COLORS.textPrimary,
  } as const;

  const dynamicInputStyle = {
    color: isDarkMode ? COLORS.darkText : COLORS.textPrimary,
  } as const;

  const iconColor = isFocused
    ? COLORS.primary
    : (isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary);

  const placeholderColor = isDarkMode ? COLORS.darkTextSecondary : COLORS.textLight;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, dynamicLabelStyle]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        dynamicContainerStyles,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={iconColor}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, dynamicInputStyle, style]}
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.error, { color: COLORS.error }]}>{error}</Text>}
    </View>
  );
};

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