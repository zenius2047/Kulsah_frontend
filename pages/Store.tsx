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
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../theme';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

type CoinPack = {
  id: string;
  name: string;
  coins: string;
  price: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  ringColor: string;
  featured?: boolean;
};

type GiftItem = {
  id: string;
  name: string;
  price: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  hot?: boolean;
  ctaPrimary?: boolean;
};

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDEC8m2v0wLYGn3bDDJZPaZqiRrKLS6aaZVOzJ7OvekIrzkKrSZgg_92tmJLf3bRfqGUht4RxV0Sx75A6W2X2pM-vnTsFXnWj96usaAEWpOKHmEcxia6IlsP_lTAV3w8sPDm44c0PXUFQRArOXh9yv2x7tpPZVgba1MMPDrLTcEULgVAr_O58pglxLPil8xaKCBs-_UpzNw2GYvzxoD7cpXLSamuGVf97M3-BDT0wFw_SgrpV1bXi6mfORmyGQ59Ok_Tw-ZRH_kDG0f';

const coinPacks: CoinPack[] = [
  {
    id: 'bronze',
    name: 'Bronze Pack',
    coins: '100 Pulse Coins',
    price: '$0.99',
    icon: 'monetization-on',
    iconColor: '#fb923c',
    iconBg: 'rgba(124,45,18,0.28)',
    ringColor: 'rgba(249,115,22,0.42)',
  },
  {
    id: 'silver',
    name: 'Silver Pack',
    coins: '500 Pulse Coins',
    price: '$4.99',
    icon: 'monetization-on',
    iconColor: '#cbd5e1',
    iconBg: 'rgba(100,116,139,0.22)',
    ringColor: 'rgba(148,163,184,0.35)',
  },
  {
    id: 'gold',
    name: 'Gold Pack',
    coins: '1,000 Pulse Coins',
    price: '$9.99',
    icon: 'stars',
    iconColor: '#facc15',
    iconBg: 'rgba(250,204,21,0.12)',
    ringColor: 'rgba(250,204,21,0.35)',
    featured: true,
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    coins: '5,000 Pulse Coins',
    price: '$44.99',
    icon: 'workspace-premium',
    iconColor: '#c084fc',
    iconBg: 'rgba(88,28,135,0.24)',
    ringColor: 'rgba(192,132,252,0.35)',
  },
];

const gifts: GiftItem[] = [
  {
    id: 'mic',
    name: 'Golden Mic',
    price: '250',
    icon: 'mic',
    iconColor: '#facc15',
  },
  {
    id: 'heart',
    name: 'Neon Heart',
    price: '50',
    icon: 'favorite',
    iconColor: '#d946ef',
    hot: true,
    ctaPrimary: true,
  },
  {
    id: 'stage',
    name: 'Diamond Stage',
    price: '1,500',
    icon: 'theater-comedy',
    iconColor: '#60a5fa',
  },
  {
    id: 'vip',
    name: 'VIP Pass',
    price: '800',
    icon: 'local-activity',
    iconColor: '#34d399',
  },
];

const Store: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();

  const shell = theme.background;
  const panel = isDark ? 'rgba(0,0,0,0.24)' : theme.card;
  const glass = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const glassStrong = isDark ? 'rgba(255,255,255,0.08)' : theme.surface;
  const border = theme.border;
  const title = theme.text;
  const body = isDark ? '#cbd5e1' : theme.textSecondary;
  const subtle = theme.textMuted;
  const walletTint = isDark ? '#c084fc' : '#9333ea';
  const shadowColor = isDark ? '#000000' : '#7c3aed';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: shell,
          paddingTop: Platform.OS === 'ios' ? 54 : insets.top,
        },
      ]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={[styles.screen, { backgroundColor: shell }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: panel,
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.walletRow}>
            <MaterialIcons name="account-balance-wallet" size={20} color={walletTint} />
            <Text style={[styles.walletText, { color: title }]}>1,240</Text>
          </View>

          {/* <LinearGradient
            colors={isDark ? ['#9333ea', '#d946ef'] : ['#7e22ce', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoWrap}
          >
            <Text style={styles.logoText}>NEON PULSE</Text>
          </LinearGradient> */}

          <Pressable
            style={[
              styles.profileButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)', borderColor: border },
            ]}
          >
            <MaterialIcons name="account-circle" size={24} color={subtle} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
              <LinearGradient
                colors={['rgba(88,28,135,0.82)', 'rgba(88,28,135,0.24)', 'rgba(10,5,13,0.08)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.heroContent}>
                <View style={styles.flashPill}>
                  <Text style={styles.flashPillText}>Flash Sale</Text>
                </View>
                <Text style={styles.heroTitle}>CRYSTAL AVATAR</Text>
                <Text style={[styles.heroSubtitle, { color: body }]}>Unlock the limited edition premium gift now.</Text>
                <Pressable style={styles.heroButton}>
                  <LinearGradient
                    colors={['#cd2bee', '#cd2bee']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.heroButtonGradient}
                  >
                    <Text style={styles.heroButtonText}>CLAIM 40% OFF</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: title }]}>Pulse Coin Packs</Text>
              <Text style={styles.sectionLink}>View All</Text>
            </View>

            {coinPacks.map((pack) => (
              <View
                key={pack.id}
                style={[
                  styles.packCard,
                  {
                    backgroundColor: pack.featured ? (isDark ? 'rgba(205,43,238,0.16)' : glass) : glass,
                    borderColor: pack.featured ? (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(205,43,238,0.18)') : border,
                    shadowColor,
                  },
                ]}
              >
                {pack.featured ? (
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>Popular</Text>
                  </View>
                ) : null}

                <View style={styles.packLeft}>
                  <View
                    style={[
                      styles.packIconWrap,
                      { backgroundColor: pack.iconBg, borderColor: pack.ringColor },
                    ]}
                  >
                    <MaterialIcons name={pack.icon} size={24} color={pack.iconColor} />
                  </View>
                  <View>
                    <Text style={[styles.packTitle, { color: title }]}>{pack.name}</Text>
                    <Text style={[styles.packSubtitle, { color: body }]}>{pack.coins}</Text>
                  </View>
                </View>

                <Pressable style={pack.featured ? styles.featuredPriceButton : [styles.priceButton, { borderColor: border }]}>
                  {pack.featured ? (
                    <LinearGradient
                      colors={['#cd2bee', '#6a00b1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.featuredPriceGradient}
                    >
                      <Text style={styles.featuredPriceText}>{pack.price}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.priceText, { color: title }]}>{pack.price}</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: title }]}>Virtual Gifts</Text>
              <View style={styles.filterRow}>
                <Text style={[styles.filterText, { color: subtle }]}>Recent</Text>
                <Text style={[styles.filterTextActive, { color: title }]}>Trending</Text>
              </View>
            </View>

            <View style={styles.giftGrid}>
              {gifts.map((gift) => (
                <View
                  key={gift.id}
                  style={[
                    styles.giftCard,
                    {
                      backgroundColor: glass,
                      borderColor: gift.hot ? 'rgba(205,43,238,0.28)' : border,
                      shadowColor,
                    },
                  ]}
                >
                  <View style={[styles.giftIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.06)' }]}>
                    {gift.hot ? (
                      <View style={styles.hotTag}>
                        <Text style={styles.hotTagText}>HOT</Text>
                      </View>
                    ) : null}
                    <MaterialIcons name={gift.icon} size={34} color={gift.iconColor} />
                  </View>

                  <View style={styles.giftMeta}>
                    <Text style={[styles.giftName, { color: title }]}>{gift.name}</Text>
                    <View style={styles.giftPriceRow}>
                      <MaterialIcons name="monetization-on" size={13} color="#a855f7" />
                      <Text style={styles.giftPrice}>{gift.price}</Text>
                    </View>
                  </View>

                  <Pressable style={gift.ctaPrimary ? styles.giftButtonPrimary : [styles.giftButton, { backgroundColor: glassStrong }]}>
                    {gift.ctaPrimary ? (
                      <LinearGradient
                        colors={['#cd2bee', '#cd2bee']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.giftButtonGradient}
                      >
                        <Text style={styles.giftButtonPrimaryText}>Gift</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={[styles.giftButtonText, { color: title }]}>Gift</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 68,
  },
  walletText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8.5),
    letterSpacing: 0.6,
  },
  logoWrap: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  logoText: {
    color: '#ffffff',
    fontFamily: 'GudlaExtraBold',
    fontSize: mediumScreen ? fontScale(15) : fontScale(12.5),
    letterSpacing: 1.4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 26,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    height: 208,
    justifyContent: 'center',
  },
  heroImageStyle: {
    borderRadius: 24,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 8,
  },
  flashPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(205,43,238,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  flashPillText: {
    color: '#f0abfc',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(8.5) : fontScale(7),
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(24) : fontScale(20),
    lineHeight: mediumScreen ? fontScale(26) : fontScale(22),
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: '#d1d5db',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(10.5) : fontScale(9),
    lineHeight: mediumScreen ? fontScale(14) : fontScale(12),
    maxWidth: '72%',
  },
  heroButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(9) : fontScale(7.5),
    letterSpacing: 0.8,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(16) : fontScale(13.5),
    letterSpacing: -0.4,
  },
  sectionLink: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(8.5) : fontScale(7),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  packCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  packLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 12,
    // backgroundColor: 'transparent'
  },
  packIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  packTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(12) : fontScale(10),
  },
  packSubtitle: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? fontScale(9.5) : fontScale(8),
  },
  priceButton: {
    borderWidth: 1,
    borderRadius: 999,
    // paddingHorizontal: 16,
    // paddingVertical: 10 ,
    minWidth: 80,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(11) : fontScale(8),
  },
  featuredPriceButton: {
    borderRadius: 999,
    overflow: 'hidden',
    height: 30,
  },
  featuredPriceGradient: {
    // paddingHorizontal: 16,
    // paddingVertical: 10,
    minWidth: 80,
    height:30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPriceText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(11) : fontScale(9.5),
  },
  popularTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#cd2bee',
    borderBottomLeftRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularTagText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(6.5) : fontScale(5.5),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(8) : fontScale(6.8),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterTextActive: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(8) : fontScale(6.8),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  giftCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  giftIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hotTag: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#cd2bee',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  hotTagText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(6.5) : fontScale(5.5),
    letterSpacing: 0.6,
  },
  giftMeta: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  giftName: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(11) : fontScale(9.2),
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftPrice: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(9.5) : fontScale(8),
  },
  giftButton: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftButtonText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(8) : fontScale(6.8),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  giftButtonPrimary: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  giftButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftButtonPrimaryText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(8) : fontScale(6.8),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default Store;

