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
import { useNavigation, useRoute } from '@react-navigation/native';
import { authApi, setAuthToken, setUser as setAuthStoreUser, useAuth } from '../src';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { fontSize } from '../typography';
import DotTrioLoader from '../components/DotTrioLoader';

const isValidPassword = (password: string): boolean => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};

const extractToken = (data: any) =>
  data?.access_token ?? data?.accessToken ?? data?.token ?? data?.reset_token ?? data?.resetToken ?? '';

const extractMessage = (error: any, fallback: string) => {
  const data = error?.response?.data ?? {};
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (Array.isArray(data?.password) && data.password[0]) return data.password[0];
  return fallback;
};

const ResetPassword: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { isDark, theme } = useThemeMode();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const email = typeof route.params?.email === 'string' ? route.params.email : '';
  const phone = typeof route.params?.phone === 'string' ? route.params.phone : '';
  const passwordIsStrong = password.length === 0 || isValidPassword(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit = (email.length > 0 || phone.length > 0) && isValidPassword(password) && password === confirmPassword;

  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)';
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.35)';

  const loginPayload = useMemo(() => {
    if (email) return { email, password };
    if (phone) return { phone, password };
    return null;
  }, [email, password, phone]);

  const finishReset = () => {
    setToastMessage('Password reset successful');
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }, 900);
  };

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.resetPassword({
        ...(email ? { email } : { phone }),
        password,
      });
      const responseData = res.data ?? {};
      const resetToken = extractToken(responseData);

      if (typeof resetToken === 'string' && resetToken.length > 0) {
        await setAuthToken(resetToken);
      }

      if (responseData.user) {
        setUser(responseData.user);
        setAuthStoreUser(responseData.user);
        finishReset();
        return;
      }

      if (user) {
        finishReset();
        return;
      }

      if (loginPayload) {
        const loginRes = await authApi.login(loginPayload);
        const loginData = loginRes.data ?? {};
        const loginToken = extractToken(loginData);
        if (typeof loginToken === 'string' && loginToken.length > 0) {
          await setAuthToken(loginToken);
        }
        if (loginData.user) {
          setUser(loginData.user);
          setAuthStoreUser(loginData.user);
        }
      }

      finishReset();
    } catch (error: any) {
      setErrorMessage(extractMessage(error, 'Unable to reset password right now.'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordField = ({
    label,
    value,
    onChangeText,
    focused,
    onFocus,
    onBlur,
    secure,
    onToggle,
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    secure: boolean;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.accent }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: fieldBg,
            borderColor: focused ? primaryColorAlpha(0.45) : borderColor,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="lock" size={20} color={theme.textMuted} />
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setErrorMessage('');
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          selectionColor={PRIMARY_COLOR}
          secureTextEntry={secure}
          style={[styles.input, { color: theme.text }]}
        />
        <Pressable onPress={onToggle} style={styles.eyeButton}>
          <MaterialIcons name={secure ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        {!!toastMessage && (
          <View pointerEvents="none" style={[styles.toast, { top: insets.top + 18 }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor, backgroundColor: fieldBg }]}>
              <MaterialIcons name="chevron-left" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.heroBlock}>
            <Text style={[styles.title, { color: theme.text }]}>Create new password</Text>
            <Text style={[styles.subtitle, { color: mutedText }]}>
              Use at least 8 characters with a mix of letters, numbers, and symbols.
            </Text>
          </View>

          {renderPasswordField({
            label: 'Password',
            value: password,
            onChangeText: setPassword,
            focused: passwordFocused,
            onFocus: () => setPasswordFocused(true),
            onBlur: () => setPasswordFocused(false),
            secure: !showPassword,
            onToggle: () => setShowPassword((current) => !current),
            placeholder: 'Enter new password',
          })}

          {renderPasswordField({
            label: 'Confirm Password',
            value: confirmPassword,
            onChangeText: setConfirmPassword,
            focused: confirmFocused,
            onFocus: () => setConfirmFocused(true),
            onBlur: () => setConfirmFocused(false),
            secure: !showConfirmPassword,
            onToggle: () => setShowConfirmPassword((current) => !current),
            placeholder: 'Confirm new password',
          })}

          {!passwordIsStrong && (
            <Text style={styles.errorText}>Password must include letters, numbers, symbols, and at least 8 characters.</Text>
          )}
          {!passwordsMatch && <Text style={styles.errorText}>Passwords do not match.</Text>}
          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={!canSubmit || isLoading}>
            <LinearGradient colors={[PRIMARY_COLOR, PRIMARY_COLOR]} style={styles.primaryGradient}>
              <Text style={styles.primaryButtonText}>RESET PASSWORD</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

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
    gap: 16,
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
    marginBottom: 8,
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
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
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
  iconWrap: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '70%',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  eyeButton: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc2626',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  primaryButton: {
    marginTop: 6,
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
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 30,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ResetPassword;
