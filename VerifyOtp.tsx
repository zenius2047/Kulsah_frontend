import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useThemeMode } from './theme';
import { fontScale } from './fonts';
import { mediumScreen } from './types';

const OTP_LENGTH = 4;
const BRAND_GRADIENT = ['#cd2bee', '#cd2bee'] as const;
const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcVzQUWysJKvjL2bxQdmy1AEhRJvlEcdW-0otb0yN7oc7giBhZzzR9mHJQzo62tIKcz6fGwU3aV75TIpGWJpJ6hvFlXPhWFi0QqZbnUsQx3tmpQlYOYA-KdNmrmhSnysxIDJrwkavXNNm8YvK0fM2Q1b6iZnSdO4L13Z3EXWA-AE7erRrMCjWmJRsOBmmM95oh1q3aUgO5Xit31f_4wpBuITxMJqX7e6k1DLq05lfUkjVR4rdfpyg5mqPvJyDEbfdMKTPeKTlp91gD';

const VerifyOtp: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const blink = useRef(new Animated.Value(1)).current;
  const routePhone = typeof route.params?.phone === 'string' ? route.params.phone : '';
  const routeEmail = typeof route.params?.email === 'string' ? route.params.email : '';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [blink]);

  const activeIndex = useMemo(() => {
    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    return firstEmptyIndex === -1 ? OTP_LENGTH - 1 : firstEmptyIndex;
  }, [otp]);

  const isComplete = otp.every((digit) => digit !== '');
  const displayDestination = useMemo(() => {
    if (routeEmail) {
      const [name, domain] = routeEmail.split('@');
      if (!name || !domain) return routeEmail;
      const safeName =
        name.length <= 2
          ? `${name[0] ?? ''}*`
          : `${name[0]}${'*'.repeat(Math.max(1, Math.min(name.length - 2, 4)))}${name[name.length - 1]}`;
      return `${safeName}@${domain}`;
    }

    if (routePhone) {
      const normalized = routePhone.replace(/\D/g, '');
      if (normalized.length <= 4) return normalized;
      const tail = normalized.slice(-4);
      return `***-***-${tail}`;
    }

    return 'k****h@studio.com';
  }, [routeEmail, routePhone]);

  const handleDigitPress = (digit: string) => {
    setOtp((current) => {
      const next = [...current];
      const emptyIndex = next.findIndex((value) => value === '');
      const writeIndex = emptyIndex === -1 ? OTP_LENGTH - 1 : emptyIndex;
      next[writeIndex] = digit;
      return next;
    });
  };

  const handleBackspace = () => {
    setOtp((current) => {
      const next = [...current];
      let filledIndex = -1;
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index] !== '') {
          filledIndex = index;
          break;
        }
      }
      if (filledIndex >= 0) {
        next[filledIndex] = '';
      }
      return next;
    });
  };

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  const glassTone = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.88)';
  const borderTone = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const ghostText = isDark ? '#475569' : '#a1a1aa';
  const surface = isDark ? '#0a050d' : '#f6f4fb';
  const headerBg = isDark ? 'rgba(10,5,13,0.82)' : 'rgba(246,244,251,0.92)';
  const glowTopColor = isDark ? 'rgba(205,43,238,0.22)' : 'rgba(205,43,238,0.12)';
  const glowBottomColor = isDark ? 'rgba(205,43,238,0.16)' : 'rgba(205,43,238,0.08)';
  const keypadBorder = isDark ? borderTone : 'rgba(15,23,42,0.06)';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: surface, paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <View style={[styles.glow, styles.glowTop, { backgroundColor: glowTopColor }]} />
      <View style={[styles.glow, styles.glowBottom, { backgroundColor: glowBottomColor }]} />

      {/* <View style={[styles.headerShell, { backgroundColor: headerBg, borderBottomColor: borderTone }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerBrand}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: glassTone, borderColor: borderTone }]}
            >
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </Pressable>
            <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.brandText}>Kulsah</Text>
            </LinearGradient>
          </View>

          <LinearGradient colors={BRAND_GRADIENT} style={styles.avatarGradient}>
            <View style={[styles.avatarInner, { backgroundColor: surface }]}>
              <Animated.Image source={{ uri: AVATAR_URI }} style={styles.avatarImage} />
            </View>
          </LinearGradient>
        </View>
      </View> */}

      <View style={styles.content}>
        <View style={styles.heroBlock}>
          <Text style={[styles.title, { color: theme.text }]}>Enter OTP</Text>
          <Text style={[styles.subtitle, { color: mutedText }]}>
            We&apos;ve sent a 4-digit verification code to{' '}
            <Text style={styles.highlightText}>{displayDestination}</Text>. Please enter it below.
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => {
            const isActive = index === activeIndex && !isComplete;
            const isFilled = digit !== '';

            return (
              <BlurView
                key={`otp-${index}`}
                intensity={24}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: glassTone,
                    borderColor: isActive ? 'rgba(205,43,238,0.45)' : borderTone,
                    shadowOpacity: isActive ? 0.35 : 0,
                  },
                ]}
              >
                {isFilled ? (
                  <Text style={[styles.otpDigit, { color: theme.text }]}>{digit}</Text>
                ) : isActive ? (
                  <Animated.View style={[styles.cursor, { opacity: blink }]} />
                ) : (
                  <Text style={[styles.otpPlaceholder, { color: ghostText }]}>0</Text>
                )}
              </BlurView>
            );
          })}
        </View>

        <Pressable onPress={handleResend} style={styles.resendButton}>
          <Text style={[styles.resendText, { color: mutedText }]}>Didn&apos;t receive the code?</Text>
          <Text style={styles.resendAction}>Resend OTP</Text>
        </Pressable>

        <Pressable style={[styles.primaryButton, !isComplete && styles.primaryButtonDisabled]}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryGradient}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <BlurView
        intensity={26}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.keypadWrap, { backgroundColor: glassTone, borderTopColor: keypadBorder }]}
      >
        <View style={styles.keypadGrid}>
          {keypadRows.flat().map((digit) => (
            <Pressable key={digit} style={styles.keyButton} onPress={() => handleDigitPress(digit)}>
              <Text style={[styles.keyText, { color: theme.text }]}>{digit}</Text>
            </Pressable>
          ))}

          <View style={styles.keyButton} />

          <Pressable style={styles.keyButton} onPress={() => handleDigitPress('0')}>
            <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
          </Pressable>

          <Pressable style={styles.keyButton} onPress={handleBackspace}>
            <MaterialIcons name="backspace" size={28} color={mutedText} />
          </Pressable>
        </View>
      </BlurView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTop: {
    width: 320,
    height: 320,
    top: -90,
    left: -110,
  },
  glowBottom: {
    width: 320,
    height: 320,
    bottom: 120,
    right: -130,
  },
  headerShell: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(20) : fontScale(17),
    letterSpacing: -0.8,
    paddingVertical: 2,
  },
  avatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 1.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroBlock: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(28) : fontScale(24),
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(13) : fontScale(11),
    lineHeight: mediumScreen ? fontScale(21) : fontScale(18),
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  highlightText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 28,
  },
  otpBox: {
    width: mediumScreen ? 68 : 60,
    height: mediumScreen ? 86 : 78,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cd2bee',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  otpDigit: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(24) : fontScale(21),
  },
  otpPlaceholder: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(23) : fontScale(20),
  },
  cursor: {
    width: 2,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  resendText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(13) : fontScale(11),
  },
  resendAction: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(13) : fontScale(11),
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.92,
  },
  primaryGradient: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(15) : fontScale(13),
  },
  keypadWrap: {
    borderTopWidth: 1,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  keypadGrid: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  keyButton: {
    width: '31%',
    minHeight: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(24) : fontScale(21),
  },
});

export default VerifyOtp;

