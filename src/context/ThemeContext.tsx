import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: typeof lightColors;
}
// Define your color schemes
const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  white: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#007AFF',
  border: '#E0E0E0',
  error: '#FF3B30',
  success: '#34C759',
};

const darkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  primary: '#0A84FF',
  border: '#3A3A3C',
  error: '#FF453A',
  success: '#32D74B',
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