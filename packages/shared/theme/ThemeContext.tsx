import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { DarkUI, LightUI, type Palette } from '@borlaman/shared/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same key the customer app has always used, so saved choices survive.
const THEME_MODE_KEY = '@borlaman/themeMode';

/** 'system' follows the phone's appearance setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeValue = {
  ui: Palette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /**
   * Background tint for a colored icon or pill. Light mode uses the hand-picked
   * pastel; dark mode uses a translucent wash of the color so it doesn't glare.
   */
  soft: (color: string, lightSoft: string) => string;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as ThemeMode) : null;
        if (saved === 'system' || saved === 'light' || saved === 'dark') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');

  const value = useMemo<ThemeValue>(
    () => ({
      ui: isDark ? DarkUI : LightUI,
      isDark,
      mode,
      setMode,
      soft: (color, lightSoft) => (isDark ? `${color}2E` : lightSoft),
    }),
    [isDark, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Build a StyleSheet from the active palette, rebuilt only when the theme flips.
 *   const makeStyles = (ui: Palette) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (ui: Palette) => T,
): T {
  const { ui } = useTheme();
  return useMemo(() => factory(ui), [factory, ui]);
}
