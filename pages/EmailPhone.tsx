import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../theme';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';
import GoogleIcon from '../assets/icons/google-svg.svg';
import AppleIcon from '../assets/icons/apple-logo-svg.svg';
import KulsahBlack from '../assets/icons/kulsah-black-svg.svg';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';

const EmailPhone: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [focused, setFocused] = useState(false);

  const titleColor = theme.text;
  const bodyColor = isDark ? '#94a3b8' : theme.textSecondary;
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const glass = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.82)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)';
  const iconBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
  const footerMuted = isDark ? '#64748b' : theme.textMuted;

  const labelRaised = focused || identifier.length > 0;
  const normalizedIdentifier = identifier.trim();
  const emailCandidate = normalizedIdentifier.toLowerCase();
  const phoneDigits = normalizedIdentifier.replace(/\D/g, '');
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);
  const isPhone = phoneDigits.length >= 7;
  const canContinue = isEmail || isPhone;

  const lightLeakOne = useMemo(
    () =>
      isDark
        ? 'rgba(205,43,238,0.15)'
        : 'rgba(205,43,238,0.08)',
    [isDark]
  );

  const lightLeakTwo = useMemo(
    () =>
      isDark
        ? 'rgba(205,43,238,0.12)'
        : 'rgba(205,43,238,0.07)',
    [isDark]
  );

  const handleContinue = () => {
    if (!canContinue) return;

    if (isEmail) {
      navigation.navigate('VerifyOtp', {
        email: emailCandidate,
      });
      return;
    }

    navigation.navigate('VerifyOtp', {
      phone: phoneDigits,
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? 54 : insets.top,
        },
      ]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <View style={styles.screen}>
        {/* <View style={[styles.blob, styles.blobTop, { backgroundColor: lightLeakOne }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: lightLeakTwo }]} /> */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: iconBg, borderColor }]}
            >
              <MaterialIcons name="chevron-left" size={20} color={titleColor} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Sign In</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: glass,
                borderColor,
                shadowColor: isDark ? '#000000' : '#7c3aed',
              },
            ]}
          >
            <View style={[styles.cardGlow, { backgroundColor: lightLeakOne }]} />

            <View style={styles.branding}>
              {isDark ? <KulsahWhite width={'80%'} height={80}/>: <KulsahBlack width={'80%'} height={60}/>}
              {/* <LinearGradient
                colors={['#cd2bee', '#cd2bee']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandBadge}
              >
                <MaterialIcons name="bolt" size={mediumScreen ? 28 : 24} color="#ffffff" />
              </LinearGradient> */}

              {/* <Text style={[styles.brandTitle, { color: titleColor }]}>Welcome Back</Text> */}
              <Text style={[styles.brandSubtitle, { color: bodyColor, marginTop: 20, fontSize: mediumScreen ? fontScale(14): fontScale(10) }]}>
                Enter your email or phone number
              </Text>
            </View>

            <View style={styles.formBlock}>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: fieldBg,
                    borderColor: focused ? 'rgba(205,43,238,0.45)' : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: labelRaised ? '#cd2bee' : bodyColor,
                      top: labelRaised ? 12 : '65%',
                      fontSize: labelRaised
                        ? mediumScreen
                          ? fontScale(8.5)
                          : fontScale(7)
                        : mediumScreen
                          ? fontScale(14)
                          : fontScale(10),
                      transform: [{ translateY: labelRaised ? 0 : -10 }],
                    },
                  ]}
                >
                  Email or Phone Number
                </Text>

                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder=""
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#cd2bee"
                  style={[styles.input, { color: titleColor }]}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
                onPress={handleContinue}
                disabled={!canContinue}
              >
                <LinearGradient
                  colors={['#cd2bee', '#cd2bee']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>CONTINUE</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.helpLink}>
                <Text style={[styles.helpLinkText, { color: bodyColor }]}>Need help signing in?</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <Text style={[styles.dividerText, { color: footerMuted }]}>or explore</Text>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            </View>

            <View style={styles.socialGrid}>
              <Pressable style={[styles.socialButton, { backgroundColor: fieldBg, borderColor }]}>
                <GoogleIcon height={18} width={18} />
                <Text style={[styles.socialText, { color: titleColor }]}>Google</Text>
              </Pressable>

              <Pressable style={[styles.socialButton, { backgroundColor: fieldBg, borderColor }]}>
                <AppleIcon height={16} width={16} />
                <Text style={[styles.socialText, { color: titleColor }]}>Apple</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerPrompt, { color: footerMuted }]}>New to Kulsah?</Text>
            <Pressable>
              <Text style={styles.footerAction}>Create an Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 400,
    height: 400,
    top: -70,
    right: -130,
  },
  blobBottom: {
    width: 320,
    height: 320,
    bottom: -90,
    left: -110,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(17) : fontScale(14.5),
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#cd2bee',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brandTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(24) : fontScale(20),
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(10.5) : fontScale(9),
    lineHeight: mediumScreen ? fontScale(14) : fontScale(12),
    textAlign: 'center',
  },
  formBlock: {
    gap: 16,
  },
  inputWrap: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  inputLabel: {
    position: 'absolute',
    left: 16,
    fontFamily: 'PlusJakartaSansMedium',
  },
  input: {
    height: 40,
    paddingTop: 5,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(14) : fontScale(12),
  },
  primaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.36,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  primaryButtonDisabled: {
    opacity: 0.48,
  },
  primaryGradient: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8.5),
    letterSpacing: 1.2,
  },
  helpLink: {
    alignItems: 'center',
    paddingTop: 4,
  },
  helpLinkText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(12) : fontScale(8),
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(7) : fontScale(6),
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  socialText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(9.5) : fontScale(8),
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    gap: 10,
  },
  footerPrompt: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(10) : fontScale(6),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerAction: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(12) : fontScale(8),
  },
});

export default EmailPhone;

