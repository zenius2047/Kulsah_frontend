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
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

type Creation = {
  id: string;
  image: string;
  views: string;
};

const SOUND_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC61afetuQOvzAcSKD24OE2MW7a7bEvHkhObFnOIPJ-oeWkSrzftUyGHRaKby2a22lYn-cwShpE-lclN-pFR8MNJRdG-RSPWnHXSkdEE47ghwuTJrusssbflNQf3k9TxyB3NwTm_tinGLP6XpR4VhsnTJcPZB2owGNFNIuxUCkDdgPHun40ZNsbNWLCO0xS1VCLmWyxbDgJdKRFb0oEo1AocuyyYKW-Fi4USu0G1Qzjy6C978TrKQlLkSPsRWodp975qO9LQg-egUf_';

const creations: Creation[] = [
  {
    id: '1',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxEecIW0MbxoP0R6sY76WieREJyBfQGlm0s20wjifaBB_U7LDke3Eqbymzhy-07swoFnPyekLP4SkiIRFvyLMo0YvA3sur_J8ddIsONzw7BYp6XTQstDalHXlkArzQIwiY1aE49OK8AFVMkHAUaaXdCShwPfP7l2jqpake_8Oxb2Mvk_zDi1soRJCn4-BSOZEV2-Causb0w9RpKcn7EKWZq92H1oxRxvpxrDg6hnzDSDwfP0tUydHxh3-lrv5pVjKGBDJwu4v5G1jS',
    views: '1.2M',
  },
  {
    id: '2',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnPLpHtcxTN3zDUp-qdIlj7XIsJ6dhd2TB3oYgs2AgzUuzmetg46m5PEnCYOL3ysSo_5PvNv6cCrEVgJC2YZ7VS99egUciMHjXDrxA9GiSrdlFam4Vki9S6WAwe3oCX2-q7vH5icFHE5txQInrVy5NdjlhxQb5tBMtGxTMgvDFnHEVznEHkChwtL8V7LdGl9wcF8Ayvz_BxQtgtJYCZ7DN19xJWTvF1EhXUNe8b-VlaYM7nnb8COBsw8vdi7h0yfAmMTS_vBXb-IAT',
    views: '856K',
  },
  {
    id: '3',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBdWGTBXUwWdly5qTb9OpxH6d90ay13a2RKc-kr5JXHril2NltbbFAMMzDgHDWfmPnmATPKwkl88S0l50iSlQczKzF3uAKAEqbypRdDMxeC7Ifcip0vJ-o7V0MTPviGioGw4upzOIdPXSdkSQhyAHJQnhsv8bs93yMP9OWY4oGOyqRWLBXjHUdkPkMnUnCVtj46Hw758J-V5EcsYnjJ4QPalP9FMK_Ej7niZZxIcuvFzy5vzCtJJSEIdjEeOfT3pZb_He2g3twWxOa',
    views: '2.1M',
  },
  {
    id: '4',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCgt-GvQs2Gka66fVj1x04-XrMlSlGIHN049ZUjwVmRH--rNiQHrq018gHKBtksRm0N5gZCaxC2sRp8YdjoZcc33YIiCuHv4yAQ37Fvpkj6dIslTIqhSZLfTCbbzS77axVn4Bjnl4GP7peStS-yHJQEnrg958z9hauwPiWRQSq8xU_FE7jnTzcxFuC41VDbfF9gnIscYmgxUH60BlLj4ybxpal45GeDBjrmuZqewbtyCnVxsUjCYKBiioE99ADcpJ1J5I-ypWicSN95',
    views: '432K',
  },
  {
    id: '5',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXP5Ir7NZj5Nm6wnfxdLL68FuFe9ZAake83PEwgXAGuw8iOLY3T8cShlY3VZZxDPHYsSCZrRjtuLWksD-CX0EaOqG4S4HtT6kVy7U63G4sfInq0viZYOvurbtlVS7gX1o9PUnMZQo7uo_XMEjpDI1GjKWGrK-O-t_CiKUmgT_brlhS4cRsEHBsJoyHDRsHvHe9oincu-uYvgiFJ_r7pQ9QmsZ50t8iYYE3qw0xRxR1_JP-68yPnntgGWGzVHMkVvfEZZfWFLYNCIcg',
    views: '1.5M',
  },
  {
    id: '6',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYq9uxpz_uOvWVDECz7QoT1Zbpo2B0u3vRneJYPyJSHjzxnpDTavPti8pX4osBP1tgZpmBn9ZY54nLX0qTVVDfrbeOD7qBawbRzg-E2w1zM-2HApAkthnP_sJlfDqmm_0oU9g-tbSkZAV9d0kLs5hhW_1-oTAgZcjLQ0ZdPuU7Q-nDRrW8cV8DoeEnQSyFCsWvA9oGZu0eh1my9ZZjFPZSrUTjnJsj4jlx3GQOGT1zCeNlXRV2xa0Cj1r_sD3ba5Rrdh1zawcNJyUL',
    views: '98K',
  },
  {
    id: '7',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAwCTMe8bdCCs0La-IC2SbQsBDLBpWH4BUw_m3LCVutc5XSmDkzD4vufkpUcXIq166a1CGzhxTMN2KsxBYIMsAzIP1mJEqXo3ftoN3yaBsXh3Q29fY7_XJHiZE3U5XAhU79sJZ3O_gBp5eaulitFVpKdr_MRHtyQbiIvllDd_ea2q0d1bi804zDuqg0WhPS1nDkJvVu2CcRz4o0tQESVHIkguhpuOU_L7yeBGRZWlEkAV2P5ktIHdVMKEn3kqAMeWIIpxsmKA40tuss',
    views: '312K',
  },
  {
    id: '8',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAB5Np2f8_EZJEkljBG8u0-aj_oq3ZVlxzhTfK3Ug_zbpStBiv0N6PPJ7kVxhAY1gt3nmW0TaQAEYF55Fs-S7ldNsMrB07kL9DJ3szoFUfXmutMQLxCpJCKKPGTbTgpTD6QA0POeNuieBBLHwFBOKsZNYq4XRDn6kUjqtzwBqUdYyOBLLz-wHtKIrNc2GbbjRs69G9lvZSzMjhKM85G0E6wD6rS-GwsTdVZzve7Z-tly5pV0GfDUmuSqsxwNpz6LYUjz0nvYCO90vIn',
    views: '670K',
  },
  {
    id: '9',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRzI1QrY5VmIDnIlAUv0bMZE_pOriHV0s6W5tkM9es6SFkeRWcmZR53tC38YwA7eMhEta88FEW1cONiaVCiqMkXUut_IGORSs4jQvthPW3k_psmqYSxJoaknAxlT-i1c_24nzh2hPEpAt8DN5DEKIOBgTR6wbijqryRendbGzpATU8yTYnJz-clqoBZtNf6fStQ_EcD8YtDmPosb9dCxH-HV-3_LRFfAK2-ePkgL4z8v_vBc0TOepERmCYEqI30vAVf62l51xtUnRp',
    views: '2.5M',
  },
];

const UseSound: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const gap = isTablet ? 8 : 3;
  const horizontalPadding = isTablet ? 18 : 6;
  const itemWidth = (width - horizontalPadding * 2 - gap * 2) / 3;
  const itemHeight = itemWidth * (16 / 9);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#261236', '#1b1022', '#120914']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="chevron-left" size={24} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>Sound</Text>
          <Pressable style={styles.headerButton}>
            <MaterialIcons name="share" size={22} color="#F8FAFC" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.coverWrap}>
              <LinearGradient
                colors={['#930df2', '#d915d2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverGlow}
              />
              <Image source={{ uri: SOUND_ART }} style={styles.coverImage} />
              <View style={styles.musicBadge}>
                <MaterialIcons name="music-note" size={18} color="#fff" />
              </View>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.soundTitle}>Midnight Resonance</Text>
              <Text style={styles.soundArtist}>Hyper-Luxe feat. Luna Ray</Text>
              <View style={styles.metaPill}>
                <MaterialIcons name="video-library" size={15} color="#C084FC" />
                <Text style={styles.metaPillText}>2.4M videos created</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionButton, styles.primaryButton]}>
                <MaterialIcons name="play-arrow" size={22} color="#fff" />
                <Text style={styles.actionButtonText}>Play Sample</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.secondaryButton]}>
                <MaterialIcons name="videocam" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Use Sound</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Creations</Text>
            <Pressable>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          <View style={[styles.grid, { paddingHorizontal: horizontalPadding }]}>
            {creations.map((creation) => (
              <Pressable
                key={creation.id}
                style={[
                  styles.card,
                  { width: itemWidth, height: itemHeight, marginBottom: gap, marginRight: gap },
                  Number(creation.id) % 3 === 0 ? { marginRight: 0 } : null,
                ]}
              >
                <Image source={{ uri: creation.image }} style={styles.cardImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.cardOverlay}
                />
                <View style={styles.cardMeta}>
                  <MaterialIcons name="play-arrow" size={14} color="#fff" />
                  <Text style={styles.cardMetaText}>{creation.views}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.floatingCtaWrap} pointerEvents="box-none">
          <Pressable style={styles.floatingCta}>
            <MaterialIcons name="videocam" size={20} color="#fff" />
            <Text style={styles.floatingCtaText}>Use this Sound</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1b1022',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1b1022',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(147, 13, 242, 0.12)',
    backgroundColor: 'rgba(27, 16, 34, 0.82)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
  scrollContent: {
    paddingBottom: 180,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  coverWrap: {
    width: 170,
    height: 170,
    marginBottom: 28,
    position: 'relative',
  },
  coverGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    transform: [{ scale: 1.06 }],
    opacity: 0.45,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  musicBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#930df2',
    borderWidth: 2,
    borderColor: '#1b1022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
  },
  soundTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(25),
    textAlign: 'center',
  },
  soundArtist: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(17),
    textAlign: 'center',
  },
  metaPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(147, 13, 242, 0.1)',
  },
  metaPillText: {
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(13),
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 22,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#930df2',
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(17),
  },
  viewAll: {
    color: '#c084fc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardMeta: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardMetaText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
  },
  floatingCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  floatingCta: {
    minWidth: 252,
    maxWidth: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 21, 210, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 26,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 8,
  },
  floatingCtaText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
});

export default UseSound;

