// Tiny file that just creates the React context object.
// Kept separate so both `theme.ts` (provides useTheme) and
// `AppThemeContext.tsx` (provides the Provider) can import it without
// causing a circular module load.
import { createContext } from 'react';
import { ThemeColors } from './theme';

export type AppThemeContextValue = {
  bgOverride: string | null;
  setBgOverride: (color: string | null) => void;
  theme: ThemeColors;
};

export const AppThemeReactContext = createContext<AppThemeContextValue | null>(null);
