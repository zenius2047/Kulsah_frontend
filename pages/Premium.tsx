import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from '../typography';

type PremiumItem = {
  title: string;
  type: 'Video' | 'Photo Set' | 'Audio' | 'Link';
  duration?: string;
  count?: string;
  locked: boolean;
  img: string;
};

const CONTENT: PremiumItem[] = [
  { title: 'BTS: Recording Ethereal', type: 'Video', duration: '12:40', locked: false, img: 'https://picsum.photos/seed/v1/400/300' },
  { title: 'Summer Tour Lookbook', type: 'Photo Set', count: '24 photos', locked: false, img: 'https://picsum.photos/seed/v2/400/300' },
  { title: 'Demo: Neon Dreams', type: 'Audio', duration: '4:12', locked: true, img: 'https://picsum.photos/seed/v3/400/300' },
  { title: 'Afterparty Access', type: 'Link', locked: true, img: 'https://picsum.photos/seed/v4/400/300' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('screen');
const CARD_GAP = 14;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const Premium: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();

  const colors = useMemo(() => {
    const background = isDark ? '#050505' : theme.background;
    return {
      background,
      card: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
      border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
      text: isDark ? '#ffffff' : theme.text,
      muted: isDark ? 'rgba(255,255,255,0.64)' : theme.textSecondary,
      heroFade: background,
    };
  }, [isDark, theme]);

  const playAllVault = () => {
    navigation.navigate('Video', { id: 'v1' });
  };

  const openItem = (item: PremiumItem, index: number) => {
    if (item.locked || item.type !== 'Video') return;
    navigation.navigate('Video', { id: `v${index + 1}` });
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 96 }]}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/premiumhead/900/520' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0)', colors.heroFade]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.heroCopy, { paddingTop: insets.top + 24 }]}>
            <View style={styles.eyebrowRow}>
              <MaterialIcons name="stars" size={18} color={PRIMARY_COLOR} />
              <Text style={[styles.eyebrow, { color: PRIMARY_COLOR }]}>Subscriber Premium</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Elena Rose: Uncut</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Pressable onPress={playAllVault} style={({ pressed }) => [styles.playAll, pressed && styles.pressed]}>
            <MaterialIcons name="play-circle-filled" size={26} color="#ffffff" />
            <Text style={styles.playAllText}>Play All Vault</Text>
          </Pressable>

          <View style={styles.grid}>
            {CONTENT.map((item, index) => {
              const meta = item.duration ?? item.count ?? 'Exclusive';
              return (
                <Pressable
                  key={`${item.title}-${index}`}
                  onPress={() => openItem(item, index)}
                  style={({ pressed }) => [styles.tilePressable, pressed && !item.locked && styles.pressed]}
                >
                  <View style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Image
                      source={{ uri: item.img.replace('400/300', '400/711') }}
                      style={styles.tileImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.84)']}
                      style={StyleSheet.absoluteFillObject}
                    />

                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>{meta}</Text>
                    </View>

                    <View style={styles.centerIcon}>
                      <MaterialIcons
                        name={item.type === 'Video' ? 'play-circle-filled' : 'visibility'}
                        size={34}
                        color="#ffffff"
                      />
                    </View>

                    <View style={styles.tileCopy}>
                      <Text numberOfLines={2} style={styles.tileTitle}>{item.title}</Text>
                      <View style={styles.typeRow}>
                        <MaterialIcons name="stars" size={14} color={PRIMARY_COLOR} />
                        <Text style={[styles.typeText, { color: PRIMARY_COLOR }]}>{item.type}</Text>
                      </View>
                    </View>

                    {item.locked ? (
                      <View style={styles.lockOverlay}>
                        <View style={styles.lockIcon}>
                          <MaterialIcons name="lock" size={22} color={PRIMARY_COLOR} />
                        </View>
                        <Text style={styles.lockText}>Upgrade Tier for Access</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  hero: {
    height: 252,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '112%',
    transform: [{ scale: 1.06 }],
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eyebrow: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  heroTitle: {
    ...fontSize.n1,
    lineHeight: fontSize.n1.fontSize + 4,
    letterSpacing: 0,
  },
  body: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 22,
  },
  playAll: {
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: Platform.OS === 'ios' ? 0.24 : 0,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  playAllText: {
    color: '#ffffff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  tilePressable: {
    width: CARD_WIDTH,
  },
  tile: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  metaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  metaBadgeText: {
    color: 'rgba(255,255,255,0.82)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  centerIcon: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  tileCopy: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 16,
    gap: 8,
  },
  tileTitle: {
    color: '#ffffff',
    ...fontSize.b2,
    lineHeight: fontSize.b2.fontSize + 4,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typeText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lockIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.2),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.42),
    marginBottom: 12,
  },
  lockText: {
    color: '#ffffff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default Premium;
