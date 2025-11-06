// src/shared/hooks/useTheme.ts
/**
 * Re-export useTheme from ThemeContext for consistency
 * All hooks should be importable from shared/hooks
 */
export { useTheme, ThemeProvider } from '../../context/ThemeContext';
export type { ThemeContextValue, ThemeMode } from '../constants/theme.types';
