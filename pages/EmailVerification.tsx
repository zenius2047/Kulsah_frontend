import React from 'react';
import {
  ImageBackground,
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
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import { fontSize } from '../typography';

const BRAND_GRADIENT = [PRIMARY_COLOR, PRIMARY_COLOR] as const;
const SHEEN_GRADIENT = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'] as const;
const BG_TEXTURE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCK2h3MxuDAaZYN13G081f-gGAFc3Gr7qMVku-Y6ajENgzwIRyvoQDqHcEnCQu_sDwkqkUcEAk_PSS305kzvelcygxH6NqWDlPjvAUte1bpTgLnrVxTLlsPUdhwiUur-HLLBrukrmOzbYnyLcPpnnzdBqdqOepB7TJTWMM17JUYBS4z_m92vzUYxu3UCUfdjNUtRP1AvUwCfR3QoRpDxs11C0Q1kHTWxhSxzi2TP2E740AeiwSefwybNZ9oySfxJ8DFXm-2jMHCk_LT';

const EmailVerification: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const routeEmail = typeof route.params?.email === 'string' ? route.params.email : '';

  const surface = isDark ? '#0a050d' : '#f6f4fb';
  const headerBg = isDark ? 'rgba(10,5,13,0.8)' : 'rgba(246,244,251,0.92)';
  const glassTone = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.84)';
  const borderTone = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const tertiary = '#ffb781';
  const glowTopColor = isDark ? primaryColorAlpha(0.2) : primaryColorAlpha(0.12);
  const glowBottomColor = isDark ? primaryColorAlpha(0.12) : primaryColorAlpha(0.08);
  const textureOpacity = isDark ? 0.18 : 0.08;
  const textureTint = isDark ? 'rgba(10,5,13,0.5)' : 'rgba(246,244,251,0.72)';
  const radialWashColor = isDark ? primaryColorAlpha(0.05) : primaryColorAlpha(0.035);
  const displayEmail = (() => {
    if (!routeEmail) return 'k****h@studio.com';
    const [name, domain] = routeEmail.split('@');
    if (!name || !domain) return routeEmail;
    const safeName =
      name.length <= 2 ? `${name[0] ?? ''}*` : `${name[0]}${'*'.repeat(Math.max(1, Math.min(name.length - 2, 4)))}${name[name.length - 1]}`;
    return `${safeName}@${domain}`;
  })();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: surface, paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <ImageBackground source={{ uri: BG_TEXTURE }} style={[styles.textureLayer, { opacity: textureOpacity }]} imageStyle={styles.textureImage}>
        <View style={[styles.textureTint, { backgroundColor: textureTint }]} />
      </ImageBackground>

      <View style={[styles.glow, styles.glowTop, { backgroundColor: glowTopColor }]} />
      <View style={[styles.glow, styles.glowBottom, { backgroundColor: glowBottomColor }]} />
      <View style={[styles.radialWash, { backgroundColor: radialWashColor }]} />

      {/* <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderTone }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: glassTone, borderColor: borderTone }]}
            >
              <MaterialIcons name="chevron-left" size={22} color={PRIMARY_COLOR} />
            </Pressable>
            <Text style={[styles.brandText, { color: theme.text }]}>Kulsah</Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Verification</Text>
        </View>
      </View> */}

      <View style={styles.content}>
        <View style={styles.cardWrap}>
          <View style={styles.iconHalo} />
          <BlurView
            intensity={26}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.iconCard, { backgroundColor: glassTone, borderColor: borderTone }]}
          >
            <LinearGradient colors={SHEEN_GRADIENT} style={StyleSheet.absoluteFillObject} />
            <MaterialIcons name="mail" size={92} color={PRIMARY_COLOR} style={styles.mailIcon} />
            <View style={styles.iconOrb} />
          </BlurView>
        </View>

        <View style={styles.copyBlock}>
          <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: mutedText }]}>We&apos;ve sent a verification link to</Text>
          <Text style={styles.emailText}>{displayEmail}</Text>
        </View>

        <View style={styles.actionBlock}>
          <Pressable style={styles.primaryButton}>
            <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryGradient}>
              <Text style={styles.primaryText}>Continue</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.resendGroup}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: divider }]} />
              <Text style={[styles.dividerText, { color: mutedText }]}>Didn&apos;t receive it?</Text>
              <View style={[styles.dividerLine, { backgroundColor: divider }]} />
            </View>

            <Pressable style={styles.resendButton}>
              <Text style={styles.resendText}>Resend Email</Text>
              <MaterialIcons name="refresh" size={16} color={PRIMARY_COLOR} />
            </Pressable>
          </View>
        </View>

        <BlurView
          intensity={24}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.infoCard, { backgroundColor: glassTone, borderColor: borderTone }]}
        >
          <MaterialIcons name="info-outline" size={20} color={tertiary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Check your spam</Text>
            <Text style={[styles.infoText, { color: mutedText }]}>
              If you don&apos;t see the email within 2 minutes, please check your spam or junk folder.
            </Text>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  textureLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  textureImage: {
    resizeMode: 'cover',
  },
  textureTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.5)',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTop: {
    width: 320,
    height: 320,
    top: -100,
    left: -100,
  },
  glowBottom: {
    width: 320,
    height: 320,
    right: -120,
    bottom: 120,
  },
  radialWash: {
    position: 'absolute',
    top: '24%',
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: primaryColorAlpha(0.05),
  },
  header: {
    borderBottomWidth: 1,
  },
  headerRow: {
    minHeight: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: -0.8,
  },
  headerTitle: {
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  cardWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: primaryColorAlpha(0.18),
    opacity: 0.55,
  },
  iconCard: {
    width: 192,
    height: 192,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mailIcon: {
    textShadowColor: primaryColorAlpha(0.55),
    textShadowRadius: 18,
  },
  iconOrb: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: primaryColorAlpha(0.18),
  },
  copyBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  title: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    color: PRIMARY_COLOR,
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    textAlign: 'center',
  },
  actionBlock: {
    gap: 24,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryGradient: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryText: {
    color: '#ffffff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  resendGroup: {
    alignItems: 'center',
    gap: 18,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    color: PRIMARY_COLOR,
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  infoCard: {
    marginTop: 36,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
  },
  infoIcon: {
    marginTop: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  infoText: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
});

export default EmailVerification;

