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
import { useThemeMode } from './theme';
import TikTok from './assets/icons/tik-tok-svg.svg';
import Facebook from './assets/icons/facebook-svg.svg';
import Google from './assets/icons/google-svg.svg';
import Apple from './assets/icons/apple-logo-svg.svg';
import { mediumScreen, setUser, user } from './types';
import { fontScale } from './fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { isDark, theme } = useThemeMode();

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
                borderColor: 'rgba(205,43,238,0.18)',
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
            <AuthButton provider="google" label="Continue with Google    " isDark={isDark} />
            <AuthButton provider="apple" label="Continue with Apple      " isDark={isDark} />
            <AuthButton provider="facebook" label="Continue with Facebook " isDark={isDark} />
            <AuthButton provider="tiktok" label="Continue with TikTok     " isDark={isDark} />

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
};

const AuthButton: React.FC<AuthButtonProps> = ({ provider, label, isDark }) => (
  



  <Pressable
  onPress={async()=>{
    
    // const mockUser: User = {
    //   id: role === 'creator' ? 'mila_ray_01' : 'alex_rivera_42',
    //   name: role === 'creator' ? 'Mila Ray' : 'Alex Rivera',
    //   role,
    // };
    console.log('Executing');
    setUser({ id: '5', name: "Mila Ray", role: "creator" });
    // setCurrentUser(user);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(user));
    navigation.navigate('MainTabs');
  
  }}
  style={[styles.authButton, {backgroundColor: '#00000006'}]}>
    {/* Replace this placeholder with the matching provider SVG icon when assets are ready. */}
    <View style={styles.authIconPlaceholder}>
      {provider === 'google' && <Google height={20} width={20}/>}
      {provider === 'apple' && <Apple height={20} width={20}/>}
      {provider === 'facebook' && <Facebook height={20} width={20}/>}
      {provider === 'tiktok' && <TikTok height={20} width={20}/>}
    </View>
    <Text style={[styles.authButtonText, {color: isDark ? 'white': 'black'}]}>{label}</Text>
  </Pressable>
);

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
    fontSize: mediumScreen ? fontScale(20): fontScale(16),
    lineHeight: 20,
    // fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSansExtraBold',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  description: {
    fontSize: mediumScreen ? fontScale(20): fontScale(10),
    lineHeight: 15,
    // fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansBold'
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
    // borderColor: '#cd2bee',
    // backgroundColor: isDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
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
    color: '#cd2bee',
    fontSize: 11,
    // fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSansExtraBold'
  },
  authButtonText: {
    fontSize: mediumScreen ? fontScale(14): fontScale(10),
    // fontWeight: '800',
    fontFamily: "PlusJakartaSansBold"
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
    fontSize: mediumScreen ? fontScale(14): fontScale(10),
    // fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "PlusJakartaSansBold"
  },
  secondaryButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    // fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontFamily: 'PlusJakartaSansBold'
  },
  legalText: {
    marginTop: 18,
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    lineHeight: 17,
    // fontWeight: '600',
    fontFamily: 'PlusJakartaSansBold',
    textAlign: 'center',
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSansBold'
  },
});

export default SignUpModal;

