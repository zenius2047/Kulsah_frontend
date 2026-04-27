import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { UserRole } from '../types';
import { fontScale } from '../fonts';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const previewImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ1TtBR2e1kQ_6Xz0OaVYJt9xVr1Ui4wU_-sNm1G10KAvEXexuJY7OEkBlmSyT3GPgGSbAaw8oMwiUB2MLhAIiXUui6M-iIBuTwCDDf3QnArtizP0dk3oOWxEQqq1A8_t22TeCycKMzvMjbKAagsleIc5Aw-4E2c_gBIBa88lgNiJ0KTQCvUTT9zRwPRk10909gs3gJQDq_fIuiGP6kCFLUfxGj-526TrwEx072BlVgxSUwO1PlOAnlCh92xtkP8iCC4XTANkcCVUH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBm3b6GSg1yis2wfDcnQFmpFEifWdBsY9n-vcrZFdDTvFNtqbVURrHGbmgJs21caUsgL8gBVGktuH3MfLtExPwcnTK8Vfets40QzZPjnjwSR6sFW0dCWIjwNw4CU8_61S0Vg2gWTIafHVEGu2E5uJupgfO9EYp5XnmOwglVpqCVzMJYgaoMiMuvrj19UPhtP37MsNZg1VhCrkWmfI0kdYBVbI_OpZ5MgfdFTWC_bFiUTyDLv3-XsstZQKqH0gIAPYge2nIQsm7jouec',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBCTiKzKkTritf5rzCk_sP03106dQzBN1-9yaySWHCa6ikt1SR8oNMhMEy-nTaPpWw5gfCXWOSsbJkrrl6Y8MS0eUmYWCqC2KcyUKC9zdLFNfyb-QXt7GuPUZJaLkCks5LKvxfxkXCqxUIoCGteyptEEHNo2G3-SlX2wlCRFBt6obbDRwv3HazEiYkJSzJFNRrDHi6tjqN0ghn5Oq7wLn1-8ZEJFUSoPbbPR3TXwBpcgMVq23V-AKzH_I1xpTsD_TrZSCYHrP9XXUpU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBokI7J5FjrH3mV5yRZ3r2hzNfOnCDon4ikRWiQHo6cQUJkgd5WChVktAg7f5ZZEGKUHrrQLhdVnc8MUK31dndGzN2qJMvIi0ZhQaZosl6y2Cddf4FiYiK2T2PoKt9slc4qFNFUeVXphqxAfSK2un7qM9IyRw8ySMptKflO-ERttqatJiweDzkObT-BPEX2bNiGFpqMxG0mzi7YoPAw6j9q2-opuqz6mngUrMiR38sxI5ELnXk5DH2nMgjKaxbwA-Lm-_UuNdX3rBFw',
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ3om81-SiKgJwDpjboC8Nuo0ZQ_S5zMyq-49XPhird3g_bOUDeTLN9A90A3mKpBRdleJhGui80HhTd_UmVdFrq6ihXbzUTaNWAMEHwLcQCY4KDIC0snF9_LE1tPpNGe6rMx-S_5KYOus9eURRHkU4ez22Un42e7tEh5psFB1VNUD65yNYF86JocopBe4MP5v0_WxF4z2v1d_TSxB0duA8ABkWzRFsB4DVgesG_7ONuPxSpqleNLgd-Gz3u8cDY8FpyjF_juRJnU8H',
        }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(10,5,13,0.78)', 'rgba(10,5,13,0.92)', '#0a050d']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandWrap}>
            <LinearGradient colors={['#cd2bee', '#cd2bee']} style={styles.brandIcon}>
              <MaterialIcons name="bolt" size={34} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.brandTitle}>KULSAH</Text>
            <Text style={styles.brandSubtitle}>The Electric Stage for Creators</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGlow} />
            <Text style={styles.cardTitle}>Welcome back</Text>

            <View style={styles.actionGroup}>
              <Pressable style={styles.secondaryButton} onPress={() => onLogin('fan')}>
                <View style={styles.googleMark}>
                  <Text style={styles.googleMarkText}>G</Text>
                </View>
                <Text style={styles.secondaryButtonText}>Continue with Google</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => onLogin('fan')}>
                <Text style={styles.appleMark}>Apple</Text>
                <Text style={styles.secondaryButtonText}>Continue with Apple</Text>
              </Pressable>

              <Pressable style={styles.primaryButton} onPress={() => onLogin('fan')}>
                <MaterialIcons name="mail-outline" size={22} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Email or Phone Number</Text>
              </Pressable>
            </View>

            <Text style={styles.legalText}>
              By continuing, you agree to Kulsah&apos;s{' '}
              <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>

          <Pressable style={styles.creatorLink} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.creatorPrompt}>New to the stage?</Text>
            <Text style={styles.creatorAction}>Join as Creator</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#cd2bee" />
          </Pressable>

          <View style={styles.previewGrid}>
            {previewImages.map((uri, index) => (
              <View
                key={uri}
                style={[
                  styles.previewTile,
                  index % 2 === 1 && styles.previewTileOffset,
                ]}
              >
                <Image source={{ uri }} style={styles.previewImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(10,5,13,0.75)']}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.4,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 56,
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -140,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(205,43,238,0.12)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(205,43,238,0.1)',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 42,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#cd2bee',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  brandTitle: {
    color: '#f7f5f8',
    fontSize: fontScale(36),
    lineHeight: fontScale(38),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -1.4,
  },
  brandSubtitle: {
    color: 'rgba(148,163,184,0.8)',
    fontSize: fontScale(11),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(205,43,238,0.18)',
  },
  cardTitle: {
    color: '#f7f5f8',
    fontSize: fontScale(24),
    fontFamily: 'PlusJakartaSansExtraBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionGroup: {
    gap: 14,
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#f7f5f8',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansBold',
  },
  googleMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMarkText: {
    color: '#f7f5f8',
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  appleMark: {
    color: '#f7f5f8',
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  legalText: {
    marginTop: 24,
    color: '#64748b',
    fontSize: fontScale(11),
    lineHeight: fontScale(18),
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  legalLink: {
    color: '#f7f5f8',
    textDecorationLine: 'underline',
  },
  creatorLink: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorPrompt: {
    color: '#94a3b8',
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansMedium',
  },
  creatorAction: {
    color: '#cd2bee',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  previewGrid: {
    width: '100%',
    maxWidth: 560,
    marginTop: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    opacity: 0.58,
  },
  previewTile: {
    width: '48%',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewTileOffset: {
    marginTop: 18,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

export default Login;

