import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { mediumScreen } from '../types';
import { fontScale } from '../fonts';

type CreatorCard = {
  id: string;
  title: string;
  handle: string;
  image: string;
};

const sidebarTabs = ['Active', 'Featured', 'My Entry', 'History'] as const;

const creators: CreatorCard[] = [
  {
    id: 'nova',
    title: 'Rising Star',
    handle: '@NovaBeats',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAtlkO5e3kL-vNhxZJFTEHFXeG-9lYPytbiqRoaA6_Mzr1BvVSVIDKtrTw5fyzB21dS5JfOXabdMZHKp7l7Zpg0IAhg4qtIqlNHhI-t3dpomusYiaoG_G8EAaMB8H1qK3zX0tWOaLyQFKAXDx4wNVog0xoXhcSrh5xLvR-1bDBToUDEomlGm4eGhgJ_LB4kVi6LA1M5xRi_L50lX0T7NMFKG4OIvf7qXp9lNq_mI7NPKalZO10SXeR3ZJ5mymG6l5UkWnM1AOQtsASN',
  },
  {
    id: 'synth',
    title: 'Pro Producer',
    handle: '@SynthLord',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDArl-uDY_D5c5RSi-eBuIFBomML6TiC79-jKirmBKecNTcXDuCnoCBVpJhFrIhD7GzNKA284g6fxibOQIhBD4ZKijSLEG6kBzOQld8W15nFMfAe0ObgUW8loRkfTWq4j87RgOVFO9dRpIc_04GdP5aC_c0pUFkkQ5QrvvrHuXBHSjzDHiREDoIpNca6lKozxVkRpxzCFW7SkzmBMH-CurNMNUFiJVDsCdXLG2ZTxlE-b71Hq3CrO6qePSU67prRfcaehNDBJVcvhbS',
  },
  {
    id: 'echo',
    title: 'Verified Creator',
    handle: '@EchoVibe',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA49pSgxYvJyMKeXCcix0ajWFzS0quvc-mD74lBdK2-gFin6QV4cMvAsSt0HFlqN2GQJLezL232b1AoFcjHKLKqYnIdP-X8ZCwSGaAIkjST_zdQPWwpm8M1DvqJJn4KzMImNKePZNJrnkALRAiNdiBv7z5oiz2R9c_HShM-tu-x0X9rv7HOQvJM7sj7ACxz1wU_YSfPnGmCfFPda6wLYYSHqpQLQDhkDl-XZWhRrOJjPUfKp_Q6zAaXlNKJewQn3Baxf2_zdDebX5X7',
  },
  {
    id: 'aura',
    title: 'Influencer',
    handle: '@AuraSinger',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_A6jJbKhJLRrur4iXACWC7e-gEVM7F6n0micfFD-URQnFAucybvpPu7O3k30XNQmRu_ninaWvyoSV79VbMWtGeKBIaA3t0rJv2XYjwQlh8tLwz_cS3pwZiqKo1F5je8uF-GUEPM8m8edGujwQCg0qNR8bvvYANOSH0ourU-daVphxx3ZTiQTf7yDH81EzymUdT3diBTYDzdk6vxJjWrmdlXDC5tcBdixCiK9HQV8xvaG1xJ25-6-KnxeC1SUS9Tn0F3uXtVVKYnYM',
  },
];

const Featured: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 900;
  const isWide = width >= 1024;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={isDark ? ['#120816', '#0a050d', '#050207'] : ['#f8fafc', '#eef2ff', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.avatarRing}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaoFGbFFm-dch_iUdcv-IwfbwD_TVN44Kr9c6aWbvNiA0H-UeeCaitkF_P0Ye_fwYGFdrEAMOC3ShvCVllgaTSAGBecaUeIR7bjc09PKqbPxNnUmKxCtJiXNB6bcr1rtpNioerBoCJJlb-kgRU9sVDkUEIO_ZDL3nLElTb7UO0aZOvsb7X2UF2qLmDF5pcr3mwwnZMdXGD-11yuGpuQdXP8rxo0uVMGq0leFfbFss39VxCUiXJuSS_0-ihoTYSFkhJgGa6_1ONU9aN',
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.brandName}>Electric Indigo</Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={22} color="#F8FAFC" />
          </Pressable>
        </View> */}

        <View style={[styles.layout, isDesktop ? styles.layoutDesktop : null]}>
          {/* {isDesktop ? (
            <View style={styles.sidebar}>
              <Text style={styles.sidebarTitle}>Challenges</Text>
              {sidebarTabs.map((tab) => {
                const active = tab === 'Featured';
                return (
                  <Pressable key={tab} style={[styles.sidebarItem, active ? styles.sidebarItemActive : null]}>
                    <MaterialIcons
                      name={
                        tab === 'Active'
                          ? 'local-fire-department'
                          : tab === 'Featured'
                            ? 'star'
                            : tab === 'My Entry'
                              ? 'military-tech'
                              : 'history'
                      }
                      size={20}
                      color={active ? '#fff' : '#94A3B8'}
                    />
                    <Text style={[styles.sidebarText, active ? styles.sidebarTextActive : null]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null} */}

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {/* {!isDesktop ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileTabs}
              >
                {sidebarTabs.map((tab) => {
                  const active = tab === 'Featured';
                  return (
                    <Pressable key={tab} style={[styles.mobileTab, active ? styles.mobileTabActive : null]}>
                      <Text style={[styles.mobileTabText, active ? styles.mobileTabTextActive : null]}>
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null} */}

            <View style={styles.heroCard}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU2IgnQYBZ6s9BOegcERDWPcRHNMHgZNPRQNa_mEMLrQ6nQrrRZB_8XM0XAX23vy4benw2ry8ElHzUyjCgLJgjeg3Q1qwpuwUMen5priIc-N2AUDGu64nHRX9KK4TQEnCy2db-fQDPgtYykctdh6MU4KjmoIaTcDnmrFNRaoCUUDA2LMtPhFboJxEvZnycB1Pq9WtqzS1owJnfYw238iaXFd1wefuK3HE4k4menvJYWqUlHjr0IDOBhKRstPt50ygX7eghAsm6fLSW',
                }}
                style={styles.heroImage}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(10,5,13,0.92)']}
                style={styles.heroOverlay}
              />

              <View style={[styles.heroContent, isTablet ? styles.heroContentTablet : null]}>
                <View style={styles.heroTextBlock}>
                  <View style={styles.heroBadges}>
                    <View style={styles.hotBadge}>
                      <Text style={styles.hotBadgeText}>HOT NOW</Text>
                    </View>
                    <View style={styles.verifiedWrap}>
                      <MaterialIcons name="verified" size={16} color="#fff" />
                      <Text style={styles.verifiedText}>Verified Partner</Text>
                    </View>
                  </View>

                  <Text
                  numberOfLines={2}
                  style={styles.heroTitle}>THE NEON VELOCITY MIX-OFF</Text>
                  <Text style={styles.heroDescription}>
                    Join the world's premier electronic music showdown. Submit your 2-minute original
                    sequence for a chance to define the pulse of the year.
                  </Text>
                </View>

                <View style={[styles.prizeCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.88)', borderColor: theme.border }]}>
                  <Text style={styles.prizeLabel}>Grand Prize</Text>
                  <Text
                  numberOfLines={2}
                  style={styles.prizeValue}>$10,000 + STUDIO</Text>
                  <Text style={styles.prizeTime}>2 DAYS REMAINING</Text>
                  <Pressable style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>JOIN CHALLENGE</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Curated Tracks</Text>
              <Pressable>
                <Text style={styles.sectionLink}>View All</Text>
              </Pressable>
            </View>

            <View style={[styles.bentoGrid, isWide ? styles.bentoGridWide : null]}>
              <View style={[styles.largeCard, isWide ? styles.largeCardWide : null, { borderColor: theme.border }]}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6em65UYwpEF22lJzmyeRj3hbmm7mqee5XRUWVbspSHy9P9mVmiocMPkfbqqAbuNnjLqDvdZAdBSMWp5RqMsXF3ew-Dp0nJGbfnDmNfi_S2MiyxqOQp1tUyFevnQo88JJugbko_mWYPa1j2FrqnwEJyolk4Ci3Vk5pw1ueDvis8r74ZGQY_DdR4A1n5JvYedTXnhP9wOYPLYdo40CHYt75sjHVYF-dizEqFjzPHIGOPjAv70bTAzZ_IdjclmwS402p5mNOh7ePz2k_',
                  }}
                  style={styles.largeCardImage}
                />
                <LinearGradient
                  colors={['rgba(10,5,13,0.88)', 'rgba(10,5,13,0.28)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.largeCardOverlay}
                />
                <View style={styles.largeCardContent}>
                  <Text style={styles.exclusiveLabel}>Exclusive Reward</Text>
                  <Text style={styles.largeCardTitle}>London Abbey Road Access</Text>
                  <Text style={styles.largeCardDescription}>
                    Top 3 entries get a fully funded week at the legendary Abbey Road Studios.
                  </Text>

                  <View style={styles.creatorStackRow}>
                    <View style={styles.avatarStack}>
                      {[
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDmbCyNqsTuCYW1W6yIj0MPJHo0SreQmWBm66IsT8d4LyT5hn3j4yPD0vsY5O_dP3wRYkiN-_66Hmuq0QZSgDZN9cgQkGwlgb5PO3SoZWOztamshxw_n387wCg5LiE0SVlN14rEp6W7DgSn2AIdD-LXWYTtGTHM_nzL4h1AJcPf67s4NTk1lCkwXFVj8p0ic7QGSSwV1GwbhBssAImr2YVnVxjjdOEgjGwWIiP4oAyN9w0rQWhquR7g3_NPIromQ6iwEcNO0lpA8Y7_',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuD_oysmU2MqCCSD4eC23FFCK1nR_Lm0rREWCKIfvNny6fnlijCz88V3eN5wKxn7YdCQoOsacyjEkpKwEfueIb1FqKWWtVYTMa3Z2212UkooC-vv1vl7ms6tJQMTKsy6shmKR4ikIAbQpH9VwLbvVK5flvD0_b5LWZosij8AiArW87-UzViFhuQumvESAeUWQkMO_xP5hrUdDO6s0HLeqAnbcjp4tcCjkItWbA21Lw_oO-bxWLnv3iSDih0SPiEBT1uBGn_x2ygQqkUG',
                        
                      ].map((uri, index) => (
                        <Image
                          key={uri}
                          source={{ uri }}
                          style={[styles.stackAvatar, { marginLeft: index === 0 ? 0 : -10 }]}
                        />
                      ))}
                      <View style={[styles.stackAvatar, styles.stackAvatarCount]}>
                        <Text
                        numberOfLines={1}
                        style={styles.stackAvatarCountText}>+1.2k</Text>
                      </View>
                    </View>
                    <Text style={styles.activeCreatorsText}>Active Creators</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.progressCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }]}>
                <View style={styles.progressCardTop}>
                  <View style={styles.progressIconWrap}>
                    <MaterialIcons name="military-tech" size={22} color="#cd2bee" />
                  </View>
                  <MaterialIcons name="verified" size={20} color="#cd2bee" />
                </View>

                <Text style={[styles.progressCardTitle, { color: theme.text }]}>Elite Digital Collectible</Text>
                <Text style={[styles.progressCardDescription, { color: theme.textSecondary }]}>
                  Participate in 5 featured challenges to earn the 'Pulse Founder' badge.
                </Text>

                <View style={styles.progressArea}>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={['#cd2bee', '#cd2bee']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressFill}
                    />
                  </View>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={[styles.progressValue, { color: theme.text }]}>3 / 5</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorRail}
            >
              {creators.map((creator) => (
                <View key={creator.id} style={[styles.creatorCard, { borderColor: theme.border }]}>
                  <Image source={{ uri: creator.image }} style={styles.creatorCardImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.84)']}
                    style={styles.creatorCardOverlay}
                  />
                  <View style={styles.creatorCardText}>
                    <Text style={styles.creatorTitle}>{creator.title}</Text>
                    <Text style={styles.creatorHandle}>{creator.handle}</Text>
                  </View>
                </View>
              ))}

              <Pressable style={[styles.submitCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="add-circle" size={34} color={theme.textMuted} />
                <Text style={[styles.submitCardText, { color: theme.textMuted }]}>Submit Your{'\n'}Entry</Text>
              </Pressable>
            </ScrollView>
          </ScrollView>
        </View>

        <Pressable style={styles.fab}>
          <MaterialIcons name="add" size={32} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(10,5,13,0.82)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: 'rgba(205,43,238,0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  brandName: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    textTransform: 'uppercase',
    letterSpacing: -0.6,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layout: {
    flex: 1,
  },
  layoutDesktop: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: 'rgba(10,5,13,0.95)',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
  },
  sidebarTitle: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(20),
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    marginBottom: 8,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#cd2bee',
  },
  sidebarText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(15),
  },
  sidebarTextActive: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  mobileTabs: {
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
  },
  mobileTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mobileTabActive: {
    backgroundColor: '#cd2bee',
  },
  mobileTabText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  mobileTabTextActive: {
    color: '#fff',
  },
  heroCard: {
    width: '100%',
    // aspectRatio: 21 / 9,
    minHeight: 450,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
    
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    gap: 20,
  },
  heroContentTablet: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroTextBlock: {
    flex: 1,
    maxWidth: 680,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  hotBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(205,43,238,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.3)',
  },
  hotBadgeText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 14:10,
    letterSpacing: 1.2,
  },
  verifiedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: 'rgba(248,250,252,0.82)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 16:12,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 16: 13,
    // lineHeight: 34,
    marginBottom: 12,
  },
  heroDescription: {
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen? 14: 12,
    // lineHeight: 22,
    // maxWidth: '95%',
  },
  prizeCard: {
    width: '100%',
    padding: 20,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  prizeLabel: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 14:10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  prizeValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 26:22,
    marginBottom: 6,
    letterSpacing: -1
  },
  prizeTime: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center'
  },
  joinButton: {
    borderRadius: 24,
    backgroundColor: '#cd2bee',
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
    letterSpacing: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 21: 18,
  },
  sectionLink: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ?14: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  bentoGrid: {
    gap: 16,
    marginBottom: 22,
  },
  bentoGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  largeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 280,
  },
  largeCardWide: {
    flex: 2,
  },
  largeCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  largeCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  largeCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  exclusiveLabel: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 15:11,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  largeCardTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen? 21:18,
    marginBottom: 8,
  },
  largeCardDescription: {
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16:12,
    lineHeight: 18,
    maxWidth: 360,
    marginBottom: 18,
  },
  creatorStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  stackAvatarCount: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  stackAvatarCountText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6),
  },
  activeCreatorsText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 14:10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  progressCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 280,
    justifyContent: 'space-between',
    flex: 1,
  },
  progressCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(205,43,238,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCardTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 21: 18,
    lineHeight: 28,
    marginBottom: 10,
  },
  progressCardDescription: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(14),
    lineHeight: 21,
    marginBottom: 24,
  },
  progressArea: {
    marginTop: 'auto',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    width: '60%',
    height: '100%',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  progressValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
  },
  creatorRail: {
    gap: 14,
    paddingBottom: 4,
  },
  creatorCard: {
    width: 160,
    aspectRatio: 9 / 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  creatorCardImage: {
    width: '100%',
    height: '100%',
  },
  creatorCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  creatorCardText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  creatorTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  creatorHandle: {
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
  },
  submitCard: {
    width: 160,
    aspectRatio: 9 / 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitCardText: {
    marginTop: 10,
    color: '#64748B',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    lineHeight: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },
});

export default Featured;
