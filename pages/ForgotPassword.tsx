import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { authApi, setAuthToken } from '../src';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { fontSize } from '../typography';
import DotTrioLoader from '../components/DotTrioLoader';

const COUNTRY_OPTIONS = [
  { cca2: 'GH', callingCode: '233', label: 'Ghana' },
  { cca2: 'NG', callingCode: '234', label: 'Nigeria' },
  { cca2: 'KE', callingCode: '254', label: 'Kenya' },
  { cca2: 'ZA', callingCode: '27', label: 'South Africa' },
  { cca2: 'US', callingCode: '1', label: 'United States' },
];

const extractToken = (data: any) =>
  data?.access_token ?? data?.accessToken ?? data?.token ?? data?.reset_token ?? data?.resetToken ?? '';

const extractMessage = (error: any, fallback: string) => {
  const data = error?.response?.data ?? {};
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return fallback;
};

const ForgotPassword: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [identifier, setIdentifier] = useState('');
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [countryCode, setCountryCode] = useState('GH');
  const [callingCode, setCallingCode] = useState('233');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedIdentifier = identifier.trim();
  const emailCandidate = normalizedIdentifier.toLowerCase();
  const phoneDigits = normalizedIdentifier.replace(/\D/g, '');
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);
  const isPhone = phoneDigits.length >= 7;
  const canContinue = isPhoneMode ? isPhone : isEmail;

  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)';
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.35)';

  const payload = useMemo(() => {
    if (isPhoneMode) {
      return { phone: `+${callingCode}${phoneDigits}` };
    }

    return { email: emailCandidate };
  }, [callingCode, emailCandidate, isPhoneMode, phoneDigits]);

  const handleSubmit = async () => {
    if (!canContinue || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.forgotPassword(payload);
      const responseData = res.data ?? {};
      const token = extractToken(responseData);

      if (typeof token === 'string' && token.length > 0) {
        await setAuthToken(token);
      }

      navigation.navigate('VerifyOtp', {
        flow: 'resetPassword',
        ...payload,
      });
    } catch (error: any) {
      setErrorMessage(extractMessage(error, 'Unable to send a reset code right now.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor, backgroundColor: fieldBg }]}>
              <MaterialIcons name="chevron-left" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.heroBlock}>
            <Text style={[styles.title, { color: theme.text }]}>Forgot password?</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              Enter the email or phone number on your account and we will send a verification code.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setIdentifier('');
              setErrorMessage('');
              setIsPhoneMode((current) => !current);
            }}
            style={styles.modeButton}
          >
            <Text style={styles.modeButtonText}>
              Use {isPhoneMode ? 'email' : 'phone number'} instead
            </Text>
          </Pressable>

          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: fieldBg,
                borderColor: isFocused ? primaryColorAlpha(0.45) : borderColor,
              },
            ]}
          >
            {isPhoneMode ? (
              <Pressable onPress={() => setShowCountryDropdown(true)} style={styles.countryButton}>
                <Text style={[styles.countryCode, { color: theme.text }]}>{countryCode}</Text>
                <Text style={[styles.callingCode, { color: theme.textSecondary }]}>+{callingCode}</Text>
              </Pressable>
            ) : (
              <View style={styles.iconWrap}>
                <MaterialIcons name="email" size={20} color={theme.textMuted} />
              </View>
            )}

            <TextInput
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setErrorMessage('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isPhoneMode ? 'Enter phone number' : 'Enter email address'}
              placeholderTextColor={theme.textMuted}
              keyboardType={isPhoneMode ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              selectionColor={PRIMARY_COLOR}
              style={[styles.input, { color: theme.text, width: isPhoneMode ? '75%' : '85%' }]}
            />
          </View>

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={!canContinue || isLoading}>
            <LinearGradient colors={[PRIMARY_COLOR, PRIMARY_COLOR]} style={styles.primaryGradient}>
              <Text style={styles.primaryButtonText}>SEND RESET CODE</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

        <Modal visible={showCountryDropdown} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowCountryDropdown(false)}>
          <Pressable style={[styles.dropdownBackdrop, { backgroundColor: modalBackdrop }]} onPress={() => setShowCountryDropdown(false)}>
            <Pressable style={[styles.dropdownSheet, { backgroundColor: theme.background, borderColor }]}>
              {COUNTRY_OPTIONS.map((option) => (
                <Pressable
                  key={option.cca2}
                  onPress={() => {
                    setCountryCode(option.cca2);
                    setCallingCode(option.callingCode);
                    setShowCountryDropdown(false);
                  }}
                  style={[
                    styles.dropdownOption,
                    {
                      borderBottomColor: borderColor,
                      backgroundColor: option.cca2 === countryCode ? primaryColorAlpha(0.12) : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{option.label}</Text>
                  <Text style={[styles.dropdownMetaText, { color: theme.textMuted }]}>{`${option.cca2} +${option.callingCode}`}</Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={isLoading} animationType="fade" transparent statusBarTranslucent>
          <View style={[styles.loadingOverlay, { backgroundColor: modalBackdrop }]}>
            <DotTrioLoader />
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerRow: {
    position: 'absolute',
    left: 24,
    top: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: {
    marginBottom: 24,
    gap: 10,
  },
  title: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
  },
  subtitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  modeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 8,
  },
  modeButtonText: {
    color: PRIMARY_COLOR,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  inputWrap: {
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryButton: {
    width: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countryCode: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  callingCode: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  iconWrap: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  errorText: {
    color: '#dc2626',
    marginTop: 12,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  primaryButton: {
    marginTop: 22,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: PRIMARY_COLOR,
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
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 1.2,
  },
  dropdownBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownSheet: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionText: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  dropdownMetaText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForgotPassword;
