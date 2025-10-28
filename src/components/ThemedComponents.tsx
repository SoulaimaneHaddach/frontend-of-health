import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Themed View
export const ThemedView: React.FC<{ style?: ViewStyle; children: React.ReactNode }> = ({ style, children }) => {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.background }, style]}>{children}</View>;
};

// Themed Text
export const ThemedText: React.FC<{ style?: TextStyle; children: React.ReactNode }> = ({ style, children }) => {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.text }, style]}>{children}</Text>;
};

// Themed Card
export const ThemedCard: React.FC<{ style?: ViewStyle; children: React.ReactNode }> = ({ style, children }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Themed TextInput
export const ThemedTextInput: React.FC<TextInputProps & { style?: ViewStyle }> = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <TextInput
      style={[
        {
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
        },
        style,
      ]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
};