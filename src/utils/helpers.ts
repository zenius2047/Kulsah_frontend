import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import type { TextStyle } from 'react-native';
import { configureFonts, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Type } from 'react-native-paper/lib/typescript/types';
import { PRIMARY_COLOR, THEME_COLORS } from './constants';
import { darkMode, subscribeDarkMode } from '../store/app.store';
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
  bodyLarge: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_400Regular' },
  bodySmall: { fontFamily: 'Inter_400Regular' },
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

export type DeviceSizeClass = 'compact' | 'medium' | 'large';

const screen = Dimensions.get('screen');
const longestScreenSide = Math.max(screen.width, screen.height);

export const DEVICE_SIZE_CLASS: DeviceSizeClass =
  longestScreenSide <= 830 ? 'compact' : longestScreenSide <= 900 ? 'medium' : 'large';

export const getResponsiveFontSize = (compact: number, medium: number, large: number) => {
  if (DEVICE_SIZE_CLASS === 'compact') return compact;
  if (DEVICE_SIZE_CLASS === 'large') return large;
  return medium;
};

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
    ios: getResponsiveFontSize(26, 28, 30),
    android: getResponsiveFontSize(26, 28, 30),
    weight: '700',
    lineHeightRatio: 1.2,
    letterSpacing: { ios: -0.4, android: 0.4 },
  },
  title: {
    ios: getResponsiveFontSize(16, 18, 20),
    android: getResponsiveFontSize(16, 18, 20),
    weight: '600',
    lineHeightRatio: 1.4,
    letterSpacing: { ios: -0.32, android: 0.3 },
  },
  body: {
    ios: getResponsiveFontSize(11, 12, 13),
    android: getResponsiveFontSize(11, 12, 13),
    weight: '400',
    lineHeightRatio: 1.5,
    letterSpacing: { ios: -0.24, android: 0.25 },
  },
  subheadline: {
    ios: getResponsiveFontSize(9, 10, 11),
    android: getResponsiveFontSize(9, 10, 11),
    weight: '400',
    lineHeightRatio: 1.4,
    letterSpacing: { ios: -0.08, android: 0.4 },
  },
  micro: {
    ios: getResponsiveFontSize(7, 8, 9),
    android: getResponsiveFontSize(7, 8, 9),
    weight: '400',
    lineHeightRatio: 1.3,
    letterSpacing: { ios: 0.07, android: 0.45 },
  },
  button: {
    ios: getResponsiveFontSize(10, 11, 12),
    android: getResponsiveFontSize(10, 11, 12),
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
  reactionB1: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(16, 17, 18),
    lineHeight: getResponsiveFontSize(21, 22, 24),
  },
  reactionB3: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(14, 15, 16),
    lineHeight: getResponsiveFontSize(20, 21, 24),
  },
  reactionB4: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(13, 14, 15),
    lineHeight: getResponsiveFontSize(18, 20, 22),
  },
  reactionB5: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(11, 12, 13),
    lineHeight: getResponsiveFontSize(16, 16, 18),
  },
  b0: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(14, 15, 16),
    lineHeight: getResponsiveFontSize(20, 21, 22),
  },
  b0Variant: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(14, 18, 20),
    lineHeight: getResponsiveFontSize(16, 19, 21),
  },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(12, 14, 16),
    lineHeight: getResponsiveFontSize(12, 14, 16),
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(10, 12, 14),
    lineHeight: getResponsiveFontSize(10, 12, 14),
  },
  b1: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(12, 13, 14),
    lineHeight: getResponsiveFontSize(17, 18, 20),
  },
  b2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(11, 12, 15),
    lineHeight: getResponsiveFontSize(17, 20, 21),
  },
  b3: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(12, 14, 16),
    lineHeight: getResponsiveFontSize(15, 17, 22),
  },
  b4: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(9, 10, 11),
    lineHeight: getResponsiveFontSize(14, 16, 18),
  },
  b5: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(10, 12, 14),
    lineHeight: getResponsiveFontSize(12, 15, 16),
  },
  b5Variant: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(8, 10, 12),
    lineHeight: getResponsiveFontSize(9, 11, 15),
  },
  b6: {
    fontFamily: 'Inter_500Medium',
    fontSize: getResponsiveFontSize(8, 10, 12),
    lineHeight: getResponsiveFontSize(9, 10, 13),
  },
  n1: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(26, 28, 30),
    lineHeight: getResponsiveFontSize(32, 34, 37),
  },
  n3: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(16, 18, 20),
    lineHeight: getResponsiveFontSize(21, 24, 27),
  },
  n5: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(8, 9, 10),
    lineHeight: getResponsiveFontSize(12, 14, 16),
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(8, 10, 12),
    lineHeight: getResponsiveFontSize(10, 12, 14),
  },
  mediumTitleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: getResponsiveFontSize(10, 12, 14),
    lineHeight: getResponsiveFontSize(12, 12, 14),
  },
  nameText: {
    fontFamily: 'Inter_700Bold',
    fontSize: getResponsiveFontSize(8, 10, 12),
    lineHeight: getResponsiveFontSize(9, 11, 13),
  },
  handleTextSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: getResponsiveFontSize(9, 11, 13),
    lineHeight: getResponsiveFontSize(10, 12, 12),
  },
  handleTextMedium: {
    fontFamily: "Inter_500Medium",
    fontSize: getResponsiveFontSize(12, 16, 18),
    lineHeight: getResponsiveFontSize(13, 17, 19),
  },
  creatorStyleText: {
    fontFamily: "Inter_500Medium",
    fontSize: getResponsiveFontSize(9, 11, 13),
    lineHeight: getResponsiveFontSize(10, 12, 15),
  },
  tabTextLarge: {
    fontFamily: "Inter_700Bold",
    fontSize: getResponsiveFontSize(12, 14, 16),
    lineHeight: getResponsiveFontSize(15, 14, 16),
  },
  badgeTextSmall: {
    fontFamily: "Inter_700Bold",
    fontSize: getResponsiveFontSize(6, 8, 10),
    lineHeight: getResponsiveFontSize(7, 9, 11),
  },
  chatNameText:{
    fontFamily: "Inter_600SemiBold",
    fontSize: getResponsiveFontSize(13, 15, 17),
    lineHeight: getResponsiveFontSize(15, 17, 19),
  },
  chatMessageText:{
    fontFamily: "Inter_500Medium",
    fontSize: getResponsiveFontSize(11, 12, 14),
    lineHeight: getResponsiveFontSize(12, 13, 15),
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
    deviceSizeClass: DEVICE_SIZE_CLASS,
    tokens: TYPOGRAPHY_TOKENS,
    styles: typographyStyles,
    getStyle: createTypographyStyle,
    getSize: getTypographySize,
    getFamily: getTypographyFamily,
  };
};
