import React from 'react';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ3om81-SiKgJwDpjboC8Nuo0ZQ_S5zMyq-49XPhird3g_bOUDeTLN9A90A3mKpBRdleJhGui80HhTd_UmVdFrq6ihXbzUTaNWAMEHwLcQCY4KDIC0snF9_LE1tPpNGe6rMx-S_5KYOus9eURRHkU4ez22Un42e7tEh5psFB1VNUD65yNYF86JocopBe4MP5v0_WxF4z2v1d_TSxB0duA8ABkWzRFsB4DVgesG_7ONuPxSpqleNLgd-Gz3u8cDY8FpyjF_juRJnU8H';

const previewImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ1TtBR2e1kQ_6Xz0OaVYJt9xVr1Ui4wU_-sNm1G10KAvEXexuJY7OEkBlmSyT3GPgGSbAaw8oMwiUB2MLhAIiXUui6M-iIBuTwCDDf3QnArtizP0dk3oOWxEQqq1A8_t22TeCycKMzvMjbKAagsleIc5Aw-4E2c_gBIBa88lgNiJ0KTQCvUTT9zRwPRk10909gs3gJQDq_fIuiGP6kCFLUfxGj-526TrwEx072BlVgxSUwO1PlOAnlCh92xtkP8iCC4XTANkcCVUH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBm3b6GSg1yis2wfDcnQFmpFEifWdBsY9n-vcrZFdDTvFNtqbVURrHGbmgJs21caUsgL8gBVGktuH3MfLtExPwcnTK8Vfets40QzZPjnjwSR6sFW0dCWIjwNw4CU8_61S0Vg2gWTIafHVEGu2E5uJupgfO9EYp5XnmOwglVpqCVzMJYgaoMiMuvrj19UPhtP37MsNZg1VhCrkWmfI0kdYBVbI_OpZ5MgfdFTWC_bFiUTyDLv3-XsstZQKqH0gIAPYge2nIQsm7jouec',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBCTiKzKkTritf5rzCk_sP03106dQzBN1-9yaySWHCa6ikt1SR8oNMhMEy-nTaPpWw5gfCXWOSsbJkrrl6Y8MS0eUmYWCqC2KcyUKC9zdLFNfyb-QXt7GuPUZJaLkCks5LKvxfxkXCqxUIoCGteyptEEHNo2G3-SlX2wlCRFBt6obbDRwv3HazEiYkJSzJFNRrDHi6tjqN0ghn5Oq7wLn1-8ZEJFUSoPbbPR3TXwBpcgMVq23V-AKzH_I1xpTsD_TrZSCYHrP9XXUpU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBokI7J5FjrH3mV5yRZ3r2hzNfOnCDon4ikRWiQHo6cQUJkgd5WChVktAg7f5ZZEGKUHrrQLhdVnc8MUK31dndGzN2qJMvIi0ZhQaZosl6y2Cddf4FiYiK2T2PoKt9slc4qFNFUeVXphqxAfSK2un7qM9IyRw8ySMptKflO-ERttqatJiweDzkObT-BPEX2bNiGFpqMxG0mzi7YoPAw6j9q2-opuqz6mngUrMiR38sxI5ELnXk5DH2nMgjKaxbwA-Lm-_UuNdX3rBFw',
];

const CreateAccount: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const showPreviewGrid = width >= 768;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground source={{ uri: heroImage }} style={styles.background} imageStyle={styles.backgroundImage}>
        <LinearGradient
          colors={['rgba(10,5,13,0.78)', 'rgba(10,5,13,0.9)', '#0a050d']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.meshTopLeft} />
        <View style={styles.meshBottomRight} />
        <View style={styles.decorTopRight} />
        <View style={styles.decorBottomLeft} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandWrap}>
            <LinearGradient colors={['#cd2bee', '#cd2bee']} style={styles.brandIcon}>
              <MaterialIcons name="bolt" size={36} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.brandTitle}>KULSAH</Text>
            <Text style={styles.brandSubtitle}>The Electric Stage for Creators</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGlow} />
            <Text style={styles.cardTitle}>Welcome back</Text>

            <View style={styles.actionGroup}>
              <AuthButton
                icon={<FontAwesome name="google" size={20} color="#f7f5f8" />}
                label="Continue with Google"
                variant="secondary"
              />
              <AuthButton
                icon={<FontAwesome name="apple" size={23} color="#f7f5f8" />}
                label="Continue with Apple"
                variant="secondary"
              />
              <AuthButton
                icon={<MaterialIcons name="mail-outline" size={22} color="#ffffff" />}
                label="Email or Phone Number"
                variant="primary"
                onPress={() => navigation.navigate('Signup')}
              />
            </View>

            <Text style={styles.legalText}>
              By continuing, you agree to Kulsah&apos;s <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>

          <Pressable style={styles.creatorLink} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.creatorPrompt}>New to the stage?</Text>
            <Text style={styles.creatorAction}>Join as Creator</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#cd2bee" />
          </Pressable>

          {showPreviewGrid && (
            <View style={styles.previewGrid}>
              {previewImages.map((uri, index) => (
                <View key={uri} style={[styles.previewTile, index % 2 === 1 && styles.previewTileOffset]}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(10,5,13,0.72)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

type AuthButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant: 'primary' | 'secondary';
};

const AuthButton: React.FC<AuthButtonProps> = ({ icon, label, onPress, variant }) => {
  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
        <LinearGradient colors={['#cd2bee', '#cd2bee']} style={styles.primaryGradient}>
          {icon}
          <Text style={styles.primaryButtonText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
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
    opacity: 0.42,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 92,
    paddingBottom: 56,
  },
  meshTopLeft: {
    position: 'absolute',
    top: -110,
    left: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(205,43,238,0.15)',
  },
  meshBottomRight: {
    position: 'absolute',
    right: -120,
    bottom: -120,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(205,43,238,0.1)',
  },
  decorTopRight: {
    position: 'absolute',
    top: -180,
    right: -170,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(205,43,238,0.1)',
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: -150,
    left: -135,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(205,43,238,0.1)',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 44,
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
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  brandTitle: {
    color: '#f7f5f8',
    fontSize: fontScale(38),
    lineHeight: fontScale(40),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -1.4,
  },
  brandSubtitle: {
    color: 'rgba(148,163,184,0.78)',
    fontSize: fontScale(11),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 448,
    borderRadius: 28,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  cardGlow: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(205,43,238,0.2)',
  },
  cardTitle: {
    color: '#f7f5f8',
    fontSize: fontScale(24),
    fontFamily: 'PlusJakartaSansExtraBold',
    textAlign: 'center',
    marginBottom: 28,
  },
  actionGroup: {
    gap: 14,
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#f7f5f8',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansBold',
    letterSpacing: -0.2,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryGradient: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  legalText: {
    marginTop: 26,
    color: '#64748b',
    fontSize: fontScale(11),
    lineHeight: fontScale(18),
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  legalLink: {
    color: '#f7f5f8',
    textDecorationColor: 'rgba(205,43,238,0.5)',
    textDecorationLine: 'underline',
  },
  creatorLink: {
    marginTop: 32,
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
    maxWidth: 960,
    marginTop: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.52,
  },
  previewTile: {
    width: '23.5%',
    height: 192,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  previewTileOffset: {
    marginTop: 18,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

export default CreateAccount;

