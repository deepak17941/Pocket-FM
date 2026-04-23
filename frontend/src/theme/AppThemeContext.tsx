import React, { useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { palette, ThemeColors } from './theme';
import { AppThemeReactContext, AppThemeContextValue } from './AppThemeReactContext';

const KEY = '@pfm/bgColor';

export const BG_SWATCHES = [
  { id: 'auto', color: null, label: 'Auto' },
  { id: 'black', color: '#000000', label: 'Black' },
  { id: 'charcoal', color: '#1A1A1A', label: 'Charcoal' },
  { id: 'eggplant', color: '#2A1A3A', label: 'Eggplant' },
  { id: 'midnight', color: '#0B1E3A', label: 'Midnight' },
  { id: 'forest', color: '#0D2E1F', label: 'Forest' },
  { id: 'bordeaux', color: '#3A1020', label: 'Bordeaux' },
  { id: 'slate', color: '#1F2937', label: 'Slate' },
  { id: 'cream', color: '#F5F1E8', label: 'Cream' },
  { id: 'blush', color: '#F7D9D3', label: 'Blush' },
  { id: 'sky', color: '#CDE8FF', label: 'Sky' },
  { id: 'mint', color: '#D6F2E0', label: 'Mint' },
];

type Ctx = AppThemeContextValue;

// (context object lives in AppThemeReactContext.ts to avoid circular imports)

// Compute luminance 0..1. Dark colors < 0.5, light colors > 0.5.
const luminance = (hex: string): number => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const buildTheme = (scheme: 'light' | 'dark', bg: string | null): ThemeColors => {
  const base = scheme === 'light' ? palette.light : palette.dark;
  if (!bg) return base;
  const isLight = luminance(bg) > 0.5;
  // Derive surface shades from the override bg
  const mixed = isLight
    ? {
        background: bg,
        surface: shade(bg, -0.04),
        surfaceSecondary: shade(bg, -0.08),
        surfaceTertiary: shade(bg, -0.12),
        primary: '#84CC16',
        textPrimary: '#0A0A0A',
        textSecondary: 'rgba(10,10,10,0.65)',
        textTertiary: 'rgba(10,10,10,0.4)',
        border: shade(bg, -0.15),
        glass: 'rgba(255,255,255,0.65)',
        glassBorder: 'rgba(0,0,0,0.06)',
        isDark: false,
      }
    : {
        background: bg,
        surface: shade(bg, 0.06),
        surfaceSecondary: shade(bg, 0.11),
        surfaceTertiary: shade(bg, 0.16),
        primary: '#D0FF3E',
        textPrimary: '#FAFAFA',
        textSecondary: 'rgba(250,250,250,0.68)',
        textTertiary: 'rgba(250,250,250,0.4)',
        border: shade(bg, 0.16),
        glass: 'rgba(0,0,0,0.7)',
        glassBorder: 'rgba(255,255,255,0.08)',
        isDark: true,
      };
  return mixed as ThemeColors;
};

// simple HSL-independent shade: mix with black/white
function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  if (amount > 0) {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  } else {
    const a = -amount;
    r = Math.round(r * (1 - a));
    g = Math.round(g * (1 - a));
    b = Math.round(b * (1 - a));
  }
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const [bgOverride, setBgOverrideState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === null) return;
      if (v === 'null' || v === '') setBgOverrideState(null);
      else setBgOverrideState(v);
    });
  }, []);

  const setBgOverride = useCallback((color: string | null) => {
    setBgOverrideState(color);
    AsyncStorage.setItem(KEY, color === null ? 'null' : color).catch(() => {});
  }, []);

  const theme = buildTheme(scheme === 'light' ? 'light' : 'dark', bgOverride);

  return (
    <AppThemeReactContext.Provider value={{ bgOverride, setBgOverride, theme }}>
      {children}
    </AppThemeReactContext.Provider>
  );
};

export const useAppTheme = (): Ctx => {
  const ctx = useContext(AppThemeReactContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
};
