import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';
import GradientText from '../components/GradientText';

const heroImage =
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200';

const fanImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
];

const heroGradient = ['rgba(10,5,13,0.05)', 'rgba(10,5,13,0.55)', 'rgba(10,5,13,0.96)'] as const;
const ctaGradient = ['#930df2', '#d915d2'] as const;

const featureCards = [
  {
    icon: 'explore' as const,
    title: 'Discover new content',
    body: 'Unearth creators before they hit the main stage.',
    tint: '#930df2',
    soft: 'rgba(147,13,242,0.18)',
  },
  {
    icon: 'confirmation-number' as const,
    title: 'Exclusive event tickets',
    body: 'Priority access to digital galleries and live venues.',
    tint: '#d915d2',
    soft: 'rgba(217,21,210,0.18)',
  },
  {
    icon: 'forum' as const,
    title: 'Interactive live chat',
    body: 'Connect directly with creators in the pulse room.',
    tint: '#ffb781',
    soft: 'rgba(255,183,129,0.18)',
  },
];

const GetStarted: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[s.screen, { 
      backgroundColor: '#0a050d', 
      paddingTop: Platform.OS === 'ios'? 54: insets.bottom
       }]} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={s.backgroundLayer} pointerEvents="none">
        <View style={s.meshPrimary} />
        <View style={s.meshSecondary} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.heroWrap}>
          <ImageBackground source={{ uri: heroImage }} style={s.heroImage} imageStyle={s.heroImageRadius}>
            <LinearGradient
              colors={heroGradient}
              style={StyleSheet.absoluteFillObject}
            />
          </ImageBackground>
        </View>

        <View style={s.topContent}>
          {/* <View style={s.badgeWrap}>
            <View style={s.badge}>
              <Text style={s.badgeText}>Join the pulse</Text>
            </View>
          </View> */}

          <View style={s.titleWrap}>
            <Text style={s.title}>Welcome to</Text>
            <GradientText gradientText="KULSAH" style={s.titleAccent} />
          </View>
          <Text style={[s.subtitle, { color: '#d0c1d8' }]}>
            Your entry into the Electric Stage begins here.
          </Text>
        </View>

        <View style={s.cardStack}>
          {featureCards.map((item) => (
            <View key={item.title} style={[s.featureCard, { borderColor: 'rgba(255,255,255,0.10)' }]}>
              <View style={[s.featureIcon, { backgroundColor: item.soft }]}>
                <MaterialIcons name={item.icon} size={22} color={item.tint} />
              </View>
              <View style={s.featureCopy}>
                <Text style={s.featureTitle}>{item.title}</Text>
                <Text style={s.featureBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.footerBlock}>
          <View style={s.communityWrap}>
            <View style={s.avatarRow}>
              {fanImages.map((uri, index) => (
                <Image key={uri} source={{ uri }} style={[s.avatar, { marginLeft: index === 0 ? 0 : -10 }]} />
              ))}
              <View style={[s.avatar, s.avatarMore]}>
                <Text style={s.avatarMoreText}>+12k</Text>
              </View>
            </View>
            <Text style={s.communityText}>
              Everyone joins as a <Text style={s.communityAccent}>Fan</Text>
            </Text>
          </View>

          <Pressable onPress={() => navigation.navigate('/vibe-picker')} style={s.ctaButton}>
            <LinearGradient
              colors={ctaGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={s.ctaGradient}
            >
              <Text style={s.ctaText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Text style={s.disclaimer}>
            By tapping Get Started, you agree to our Terms of Service and Privacy Policy. You can upgrade to a Creator account anytime in settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  meshPrimary: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(147,13,242,0.18)',
    opacity: 0.8,
  },
  meshSecondary: {
    position: 'absolute',
    right: -40,
    bottom: 80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(217,21,210,0.16)',
    opacity: 0.75,
  },
  content: {
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    overflow: 'hidden',
  },
  heroImage: {
    width: '120%',
    height: '100%',
    alignSelf: 'center',
  },
  heroImageRadius: {
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
  },
  topContent: {
    marginTop: 46,
    alignItems: 'center',
  },
  badgeWrap: {
    marginBottom: 5,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.30)',
  },
  badgeText: {
    color: '#d915d2',
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: mediumScreen ? fontScale(32) : fontScale(28),
    lineHeight: mediumScreen ? fontScale(36) : fontScale(32),
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -1.2,
    maxWidth: 300,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 2,
  },
  titleAccent: {
    fontSize: mediumScreen ? fontScale(32) : fontScale(28),
    lineHeight: mediumScreen ? fontScale(36) : fontScale(32),
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -1.2,
    fontStyle: 'italic',
  },
  subtitle: {
    marginTop: 5,
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
    textAlign: 'center',
  },
  cardStack: {
    marginTop: 40,
    gap: 14,
  },
  featureCard: {
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: '#f8fafc',
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  featureBody: {
    marginTop: 3,
    color: '#d0c1d8',
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    lineHeight: fontScale(16),
    fontFamily: 'PlusJakartaSansBold',
  },
  footerBlock: {
    marginTop: 14,
    gap: 20,
    paddingBottom: 8,
  },
  communityWrap: {
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  avatarMore: {
    marginLeft: -10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    color: '#f8fafc',
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  communityText: {
    color: '#94a3b8',
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.7,
  },
  communityAccent: {
    color: '#d915d2',
  },
  ctaButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#d915d2',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  ctaGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disclaimer: {
    color: 'rgba(208,193,216,0.65)',
    textAlign: 'center',
    fontSize: mediumScreen ? fontScale(10):fontScale(8),
    lineHeight: fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
    paddingHorizontal: 8,
  },
});

export default GetStarted;
