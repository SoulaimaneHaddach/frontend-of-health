import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

// Define your color schemes using the enhanced theme colors
const lightColors = {
  background: COLORS.background,
  surface: COLORS.background,
  card: COLORS.cardBackground,
  white: COLORS.white,
  text: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  primary: COLORS.primary,
  border: COLORS.border,
  borderLight: COLORS.borderLight,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  shadow: COLORS.shadow,
};

const darkColors = {
  background: COLORS.darkBg,
  surface: COLORS.darkCard,
  card: COLORS.darkCard,
  cardSecondary: COLORS.darkCardSecondary,
  white: COLORS.white,
  text: COLORS.darkText,
  textSecondary: COLORS.darkTextSecondary,
  primary: COLORS.darkPrimary,
  border: COLORS.darkBorder,
  borderLight: COLORS.darkBorder,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
  secondary: COLORS.darkSecondary,
  accent: COLORS.darkAccent,
  shadow: COLORS.darkShadow,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'auto') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};