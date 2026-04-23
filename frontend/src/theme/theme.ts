import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    background: '#F7F7F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F0EE',
    surfaceTertiary: '#EBEBE8',
    primary: '#7C5CFF',
    textPrimary: '#0A0A0A',
    textSecondary: '#6B6B66',
    textTertiary: '#A3A3A0',
    border: '#E5E5E2',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
    isDark: false,
  },
  dark: {
    background: '#000000',
    surface: '#121212',
    surfaceSecondary: '#1C1C1C',
    surfaceTertiary: '#262626',
    primary: '#7C5CFF',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1A1',
    textTertiary: '#666666',
    border: '#2C2C2C',
    glass: 'rgba(0, 0, 0, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    isDark: true,
  },
};

export type ThemeColors = typeof palette.dark;

export const useTheme = (): ThemeColors => {
  const scheme = useColorScheme();
  return scheme === 'light' ? palette.light : palette.dark;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};
