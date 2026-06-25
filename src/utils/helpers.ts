import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import type { TextStyle } from 'react-native';
import { configureFonts, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Type } from 'react-native-paper/lib/typescript/types';
import { PRIMARY_COLOR, THEME_COLORS } from './constants';
import { darkMode, subscribeDarkMode } from '../store/app.store';
import { mediumScreen } from '../store/app.store';
export { PRIMARY_COLOR } from './constants';

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

export const getTheme = (isDark: boolean) => (isDark ? THEME_COLORS.dark : THEME_COLORS.light);

const fontConfig: Partial<Record<string, Partial<MD3Type>>> = {
  displayLarge: { fontFamily: 'Inter_700Bold' },
  displayMedium: { fontFamily: 'Inter_700Bold' },
  displaySmall: { fontFamily: 'Inter_600SemiBold' },
  headlineLarge: { fontFamily: 'Inter_700Bold' },
  headlineMedium: { fontFamily: 'Inter_600SemiBold' },
  headlineSmall: { fontFamily: 'Inter_600SemiBold' },
  titleLarge: { fontFamily: 'Inter_600SemiBold' },
  titleMedium: { fontFamily: 'Inter_500Medium' },
  titleSmall: { fontFamily: 'Inter_500Medium' },
  labelLarge: { fontFamily: 'Inter_500Medium' },
  labelMedium: { fontFamily: 'Inter_500Medium' },
  labelSmall: { fontFamily: 'Inter_400Regular' },
  bodyLarge: { fontFamily: 'DMSans_400Regular' },
  bodyMedium: { fontFamily: 'DMSans_400Regular' },
  bodySmall: { fontFamily: 'DMSans_400Regular' },
};

export const KulsahTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: PRIMARY_COLOR,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const KulsahDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: PRIMARY_COLOR,
  },
  fonts: configureFonts({ config: fontConfig }),
};

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

export type TypographyRole = 'display' | 'title' | 'body' | 'subheadline' | 'micro' | 'button';

type NativeTypographyToken = {
  ios: number;
  android: number;
  weight: TextStyle['fontWeight'];
  lineHeightRatio: number;
  letterSpacing: {
    ios: number;
    android: number;
  };
};

export const TYPOGRAPHY_TOKENS: Record<TypographyRole, NativeTypographyToken> = {
  display: {
    ios: 34,
    android: 34,
    weight: '700',
    lineHeightRatio: 1.2,
    letterSpacing: { ios: -0.4, android: 0.4 },
  },
  title: {
    ios: 20,
    android: 20,
    weight: '600',
    lineHeightRatio: 1.4,
    letterSpacing: { ios: -0.32, android: 0.3 },
  },
  body: {
    ios: 15,
    android: 14,
    weight: '400',
    lineHeightRatio: 1.5,
    letterSpacing: { ios: -0.24, android: 0.25 },
  },
  subheadline: {
    ios: 13,
    android: 12,
    weight: '400',
    lineHeightRatio: 1.4,
    letterSpacing: { ios: -0.08, android: 0.4 },
  },
  micro: {
    ios: 11,
    android: 11,
    weight: '400',
    lineHeightRatio: 1.3,
    letterSpacing: { ios: 0.07, android: 0.45 },
  },
  button: {
    ios: 15,
    android: 14,
    weight: '600',
    lineHeightRatio: 1.33,
    letterSpacing: { ios: -0.24, android: 1.25 },
  },
};

const isAndroidApi31OrNewer = Platform.OS === 'android' && Number(Platform.Version) >= 31;

export const FontFamily = {
  regular: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans' : 'Roboto', default: undefined }),
  medium: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  bold: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  extraBold: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  display: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans' : 'Roboto', default: undefined }),
  displayExtraBold: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
} as const;

export const fontSize = {
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: mediumScreen ? 16 : 10,
  },
  h2: {
    fontFamily: 'Inter_500Medium',
    fontSize: mediumScreen ? 12 : 8,
  },
  b1: {
    fontFamily: 'Inter_700Bold',
    fontSize: mediumScreen ? 18 : 14,
  },
  b2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: mediumScreen ? 16 : 12,
  },
  b3: {
    fontFamily: 'Inter_500Medium',
    fontSize: mediumScreen ? 16 : 12,
  },
  b4: {
    fontFamily: 'Poppins_500Medium',
    fontSize: mediumScreen ? 14 : 10,
  },
  b5: {
    fontFamily: 'Poppins_500Medium',
    fontSize: mediumScreen ? 12 : 8,
  },
  n1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: mediumScreen ? 30 : 26,
  },
  n3: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: mediumScreen ? 18 : 14,
  },
  n5: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: mediumScreen ? 12 : 10,
  },
};

export const fontScale = (size: number) => size;

export function getTypographySize(role: TypographyRole) {
  const token = TYPOGRAPHY_TOKENS[role];
  return Platform.OS === 'ios' ? token.ios : token.android;
}

export function getTypographyLineHeight(role: TypographyRole) {
  const token = TYPOGRAPHY_TOKENS[role];
  return Math.round(getTypographySize(role) * token.lineHeightRatio);
}

export function getTypographyFamily(role: TypographyRole) {
  if (Platform.OS === 'ios' && getTypographySize(role) >= 20) {
    return FontFamily.display;
  }

  return FontFamily.regular;
}

export function createTypographyStyle(role: TypographyRole): TextStyle {
  const token = TYPOGRAPHY_TOKENS[role];

  return {
    fontFamily: getTypographyFamily(role),
    fontSize: getTypographySize(role),
    fontWeight: token.weight,
    lineHeight: getTypographyLineHeight(role),
    letterSpacing: Platform.OS === 'ios' ? token.letterSpacing.ios : token.letterSpacing.android,
  };
}

const roleSize = (role: TypographyRole) => getTypographySize(role);

export const TypographySize = {
  display: roleSize('display'),
  title: roleSize('title'),
  body: roleSize('body'),
  subheadline: roleSize('subheadline'),
  micro: roleSize('micro'),
  button: roleSize('button'),
};

export const FontSize = {
  fourHalf: TypographySize.micro,
  five: TypographySize.micro,
  fiveHalf: TypographySize.micro,
  six: TypographySize.micro,
  sixHalf: TypographySize.micro,
  sixPointEight: TypographySize.micro,
  seven: TypographySize.micro,
  sevenHalf: TypographySize.micro,
  eight: TypographySize.micro,
  eightHalf: TypographySize.micro,
  nine: TypographySize.micro,
  ninePointTwo: TypographySize.micro,
  nineHalf: TypographySize.micro,
  ten: TypographySize.micro,
  tenHalf: TypographySize.micro,
  eleven: TypographySize.micro,
  twelve: TypographySize.subheadline,
  twelveHalf: TypographySize.subheadline,
  thirteen: TypographySize.subheadline,
  thirteenHalf: TypographySize.subheadline,
  small: TypographySize.subheadline,
  fourteen: TypographySize.body,
  fourteenHalf: TypographySize.body,
  fifteen: TypographySize.button,
  body: TypographySize.body,
  fourten: TypographySize.body,
  sixteen: TypographySize.title,
  seventeen: TypographySize.title,
  eighteen: TypographySize.title,
  nineteen: TypographySize.title,
  twenty: TypographySize.title,
  twentyOne: TypographySize.title,
  twentyTwo: TypographySize.title,
  twentyThree: TypographySize.title,
  twentyFour: TypographySize.title,
  twentyFive: TypographySize.title,
  twentySix: TypographySize.title,
  twentySeven: TypographySize.title,
  twentyEight: TypographySize.title,
  twentyNine: TypographySize.title,
  title: TypographySize.title,
  heading: TypographySize.title,
  thirty: TypographySize.display,
  thirtyOne: TypographySize.display,
  thirtyTwo: TypographySize.display,
  thirtyFour: TypographySize.display,
  thirtySix: TypographySize.display,
  thirtyEight: TypographySize.display,
  thirtyNine: TypographySize.display,
  forty: TypographySize.display,
  fiftyTwo: TypographySize.display,
};

export const typographyStyles = StyleSheet.create({
  display: createTypographyStyle('display'),
  title: createTypographyStyle('title'),
  body: createTypographyStyle('body'),
  subheadline: createTypographyStyle('subheadline'),
  micro: createTypographyStyle('micro'),
  button: createTypographyStyle('button'),
});

export const useTypography = () => {
  const { fontScale } = useWindowDimensions();

  return {
    fontScale,
    tokens: TYPOGRAPHY_TOKENS,
    styles: typographyStyles,
    getStyle: createTypographyStyle,
    getSize: getTypographySize,
    getFamily: getTypographyFamily,
  };
};
