import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "./theme";
import TikTok from './assets/icons/tik-tok-svg.svg';
import Facebook from './assets/icons/facebook-svg.svg';
import Google from './assets/icons/google-svg.svg';
import Apple from './assets/icons/apple-logo-svg.svg';
import { mediumScreen } from './types';
import { fontSize } from './typography';
import { useGoogleAuth } from './src/config/auth-google';
import { authApi, setAuthToken, setUser } from './src';

type SignUpModalProps = {
  visible: boolean;
  isGuest?: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
};

const SignUpModal: React.FC<SignUpModalProps> = ({
  visible,
  isGuest = true,
  onClose,
  onCreateAccount,
}) => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();

  const {
    signIn: signInWithGoogle,
    isSigningIn: isGoogleSigningIn,
    error: googleAuthError,
  } = useGoogleAuth({
    onSuccess: async (firebaseUser) => {
      const firebaseIdToken = await firebaseUser.getIdToken();
      const response = await authApi.social({
        token: firebaseIdToken,
        provider: 'google',
      });
      const { access_token: accessToken, user } = response.data;

      if (!accessToken || !user) {
        throw new Error('The social-login response did not include an authenticated session.');
      }

      await setAuthToken(accessToken);
      setUser(user);
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    },
  });

  return (
    <Modal
      visible={visible && isGuest}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Pressable>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)',
            },
          ]}
        >
          {/* <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.accentSoft,
                borderColor: primaryColorAlpha(0.18),
              },
            ]}
          >
            <MaterialIcons name="stars" size={40} color={theme.accent} />
          </View> */}

          <View style={styles.copyBlock}>
            <Text style={[styles.title, { color: theme.text }]}>Join the Galaxy</Text>
            <Text style={[styles.description, { color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b' }]}>
              Sign up now to follow your favorite creators, subscribe to exclusive drops, and more!
            </Text>
          </View>

          <View style={styles.actions}>
            <AuthButton
              provider="google"
              label="Continue with Google    "
              isDark={isDark}
              onPress={() => {
                void signInWithGoogle();
              }}
              disabled={isGoogleSigningIn}
            />
            <AuthButton provider="apple" label="Continue with Apple      " isDark={isDark}  onPress = {()=>{
              
            }}/>
            <AuthButton provider="facebook" label="Continue with Facebook " isDark={isDark} />
            <AuthButton provider="tiktok" label="Continue with TikTok     " isDark={isDark} />

            {!!googleAuthError && (
              <Text style={[styles.googleError, { color: '#f87171' }]}>
                {googleAuthError}
              </Text>
            )}

            <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onCreateAccount}>
              <MaterialIcons name="mail-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Email or Phone Number</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={[styles.secondaryButtonText, { color: isDark ? 'rgba(255,255,255,0.22)' : '#94a3b8' }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.legalText, { color: isDark ? 'rgba(255,255,255,0.38)' : '#64748b' }]}>
            By continuing, you agree to Kulsah&apos;s <Text style={[styles.legalLink, { color: theme.text }]}>Terms of Service</Text> and{' '}
            <Text style={[styles.legalLink, { color: theme.text }]}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

type AuthButtonProps = {
  provider: 'google' | 'apple' | 'facebook' | 'tiktok';
  label: string;
  isDark: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

const AuthButton: React.FC<AuthButtonProps> = ({ provider, label, isDark, onPress, disabled }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.authButton,
        { backgroundColor: '#00000006' },
        disabled && styles.authButtonDisabled,
      ]}
    >
      {/* Replace this placeholder with the matching provider SVG icon when assets are ready. */}
      <View style={styles.authIconPlaceholder}>
        {provider === 'google' && <Google height={20} width={20} />}
        {provider === 'apple' && <Apple height={20} width={20} />}
        {provider === 'facebook' && <Facebook height={20} width={20} />}
        {provider === 'tiktok' && <TikTok height={20} width={20} />}
      </View>
      <Text style={[styles.authButtonText, { color: isDark ? 'white' : 'black' }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000000bc'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 40,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  copyBlock: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    ...fontSize.b1,
    lineHeight: 20,
    // fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  description: {
    ...fontSize.b1,
    lineHeight: 15,
    // fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 24,
  },
  authButton: {
    minHeight: 54,
    borderRadius: 16,
    // borderWidth: 1,
    // borderColor: PRIMARY_COLOR,
    // backgroundColor: isDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  authButtonDisabled: {
    opacity: 0.65,
  },
  authIconPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  authIconPlaceholderText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    // fontWeight: '900',
    textTransform: 'uppercase',
  },
  authButtonText: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    // fontWeight: '800',
  },
  googleError: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
    marginTop: -2,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    // fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    // fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  legalText: {
    marginTop: 18,
    ...fontSize.b4,
    lineHeight: 17,
    // fontWeight: '600',
    textAlign: 'center',
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});

export default SignUpModal;

