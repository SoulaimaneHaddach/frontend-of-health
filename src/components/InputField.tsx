// src/components/InputField.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, RADIUS, SPACING } from '../shared/constants/theme';
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
  const { colors } = useTheme();

  const dynamicContainerStyles = {
    backgroundColor: colors.card,
    borderColor: colors.border,
  } as const;

  const dynamicLabelStyle = {
    color: colors.text,
  } as const;

  const dynamicInputStyle = {
    color: colors.text,
  } as const;

  const iconColor = isFocused ? colors.primary : colors.textSecondary;

  const placeholderColor = colors.textSecondary;

  const focusStyle = isFocused ? { borderColor: colors.primary, borderWidth: 2 } : {};

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, dynamicLabelStyle]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        dynamicContainerStyles,
        focusStyle,
        error ? { borderColor: colors.error } : {},
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
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
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
    
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
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
