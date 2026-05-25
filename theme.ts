import { useEffect, useState } from 'react';
import { darkMode, subscribeDarkMode } from './types';

export const PRIMARY_COLOR = '#097ced';

const normalizeHexColor = (hexColor: string) => hexColor.replace('#', '');

const primaryColorRgb = () => {
  const normalized = normalizeHexColor(PRIMARY_COLOR);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `${red},${green},${blue}`;
};

export const primaryColorAlpha = (alpha: number) => `rgba(${primaryColorRgb()},${alpha})`;

export const primaryColorAlphaHex = (alphaHex: string) => {
  const alpha = parseInt(alphaHex, 16) / 255;
  return primaryColorAlpha(Number(alpha.toFixed(3)));
};

const darkTheme = {
  background: '#0a050d',
  screen: '#060913',
  surface: 'rgba(255,255,255,0.05)',
  card: '#111827',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#6b7280',
  border: 'rgba(255,255,255,0.1)',
  accent: PRIMARY_COLOR,
  accentSoft: primaryColorAlpha(0.14),
  shadow: '#000000',
};

const lightTheme = {
  background: '#fff',
  screen: '#ffffff',
  surface: 'rgba(15,23,42,0.04)',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  border: 'rgba(15,23,42,0.08)',
  accent: PRIMARY_COLOR,
  accentSoft: primaryColorAlpha(0.10),
  shadow: '#0f172a',
};

export const getTheme = (isDark: boolean) => (isDark ? darkTheme : lightTheme);

export const useThemeMode = () => {
  const [isDark, setIsDark] = useState(darkMode);

  useEffect(() => {
    setIsDark(darkMode);
    const unsubscribe = subscribeDarkMode(setIsDark);
    return unsubscribe;
  }, []);

  return {
    isDark,
    theme: getTheme(isDark),
  };
};
