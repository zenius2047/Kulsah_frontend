import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import type { TextStyle } from 'react-native';

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
  // Regression: PlusJakartaSans/Gudla custom families -> SF Pro Text/Display on iOS and Google Sans API 31+ or Roboto on Android, all native roles.
  regular: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans' : 'Roboto', default: undefined }),
  medium: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  bold: Platform.select({ ios: 'SF Pro Text', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  extraBold: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
  display: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans' : 'Roboto', default: undefined }),
  displayExtraBold: Platform.select({ ios: 'SF Pro Display', android: isAndroidApi31OrNewer ? 'Google Sans Medium' : 'Roboto', default: undefined }),
} as const;

export const getTypographySize = (role: TypographyRole) => {
  const token = TYPOGRAPHY_TOKENS[role];
  return Platform.OS === 'ios' ? token.ios : token.android;
};

export const getTypographyLineHeight = (role: TypographyRole) => {
  const token = TYPOGRAPHY_TOKENS[role];
  return Math.round(getTypographySize(role) * token.lineHeightRatio);
};

export const getTypographyFamily = (role: TypographyRole) => {
  if (Platform.OS === 'ios' && getTypographySize(role) >= 20) {
    return FontFamily.display;
  }

  return FontFamily.regular;
};

export const createTypographyStyle = (role: TypographyRole): TextStyle => {
  const token = TYPOGRAPHY_TOKENS[role];

  return {
    fontFamily: getTypographyFamily(role),
    fontSize: getTypographySize(role),
    fontWeight: token.weight,
    lineHeight: getTypographyLineHeight(role),
    letterSpacing: Platform.OS === 'ios' ? token.letterSpacing.ios : token.letterSpacing.android,
  };
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
