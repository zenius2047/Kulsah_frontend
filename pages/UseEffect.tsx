import React from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FontSize } from '../fonts';
import { mediumScreen } from '../types';

type Creation = {
  id: string;
  image: string;
  views: string;
};

const EFFECT_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCksa1ikcmbA4qGqyrf6RiAzh-sNoYoaSgIZpIZpzImgJFBVhoBUetKCBHIJ0ZhbsZ056FBBwAocX_RnsT-sVqgFZDQkEZB1QWJUmHtPgg2y9yaYwtPAclWM-7oNhYvN1vmJUDtNfAO75yXorLZUlJhvunHaZslPB8ZDYBhdvLGr3Hj6XVdI0wVDqXry0YbWs3c4bN3ljCPxipsFa1PZWpnPuZmFf0U_l5BdN-32zsOPXOiVpP3YNmrAsvtpqc9w0aKYOmvQl_eHUY_';

const creations: Creation[] = [
  {
    id: '1',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYsPvCP-H2OxBnNquSdWqftC2J-9HRnMG1Pk0ChJRgIzBlBzmJ_YJDhTy105E_Od7GTXz0Qb-8Wv4oJAqGi5InEsW7d1Go78sWfHSbEqQWQ20DygPxSAh5f8BRjQnToybHkXkfeFqhOUuxsWwJMr9dCES93JQspD7U1ngwpw6YBB1KZoS_qFLU7_bL-oFSoLxQr4Fh9ctZ_ul3ecYbLLb7a5YIkuwVqzE65dPcD7EZC_-vrPLYMaEwncOPkGsbvIDJLda6dpRbQx_d',
    views: '432K',
  },
  {
    id: '2',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA0BwnTd_zOcXw4uaax91EHwJd8_sj_WuRXkxO1pBXiBU50D9t2VGNYFfEMucAD9Ve8TwVC551273I50hyJDhhjts9S3E6yU_J1s9cqKCHb8qA7wdTxnuTBMQ-j-j6ep1ZHHtY20fpvCrZfTFlt4RC54PIdCZIij9IKOgMhugpTt2JYV4IRIvmjBqhis-OcTE8P_1aohOzbSxsQlMaLVK_zYhsORxmHaSBOsBtLNhsaggx1mpnqbNLe7xO441pX3l9Lqm_kLq3t4g1A',
    views: '2.1M',
  },
  {
    id: '3',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDABRIBIDOe2iV6SQEz7M4yJy2dVrfmHMIHNfIPHdBe8mG6IU3my4GZHybFc2udMnuItC7OXiwP6AaF03WT-5NPrS_uiytpSxOHTj46paFNUHxkmMiB1vsj6rMXqL_Fk-uh4TModgu81wZFJt-PYGcs_O-xB_h5z86EcfnhrZOSh1lU3JxHrJ_3bKb6EI6uADCgIgxyTyoy-srXt3ERt_SALl-_Hwpdjurwt5DaQLKpKu2YICUKL_ZmYKo4ZVresHSxKv9WCI5VvOtE',
    views: '128K',
  },
  {
    id: '4',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC7hpLWSnfInZz_re9gbYTYKGiaHHBRG_O7aXz_qm9I5RQbtsGCiU-2EbqqUk168f9ZJuGMkZi97WvIMPNO4hjr6oURZ4g0taewjVDWzbTsFfQwjAqcCnKP4mDoBG52IiaCU3l6GqLTp1XWci5ZutPpuYwk_WK4O5YrikM4vlSY810lHVOVsTpOlpnTya8UMD9irE2wAJd98BQc4SjNAtxJaUKiiLx4bCi4QWhOWKW55Z4iAL8o2zgW-fAuc5WJbBn1qKMp-7GY6GAU',
    views: '890K',
  },
  {
    id: '5',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPHWj8EfATFcP_dZk8Zn8V0gFRRT5__X7L9GtoAdBwHUoiQXTZIRbTj_ViUNIVXulmBLA9hq3EqXom2d906_qVcpnoBT4Tnpd3W5v-qxlLswruwBgbYVTGJ98CAURoYXXx6qDmCEecRV2ezABiMelzspviQD79337u_WKbm1C5H9ZyAr-mbiHgHiOtOAhWqVQzZX_QnWSNZk-89vOtiZGJdviQuZ7PX6rVhmxxnIkcxZ9gp_aJ8EpKpJCwucwcgIkCQDDh0flqawaD',
    views: '567K',
  },
  {
    id: '6',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCTzfuIHkHe7adH33kqz4HAnV5P95EnTmvwlKwi4Rdz7ueziUvGwQuG6AVlG8-xFd_CL4D_oGf7p5yz6188WWgnnogO-lRtEjNStua3tZYDKOqqKoorXnslhdQ5j_DY216u0bdDgyaZN0emdA5ZnpVmhE4hyHQOsTyzuipwotnOeG7mxoMxcBbA-OfbIj88I1OZXsmicVHtF-HdHRYeXYUqUw3pk3PjxjKPXY2d8Qj8wRAovdYoWtrTBBaEevfe4KRG4t8mu0bQcfwZ',
    views: '94K',
  },
];

const UseEffect: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const gap = isTablet ? 8 : 3;
  const horizontalPadding = isTablet ? 18 : 6;
  const itemWidth = (width - horizontalPadding * 2 - gap * 2) / 3;
  const itemHeight = itemWidth * (16 / 9);
  const overlayGradient = isDark
    ? ['#261236', '#1b1022', '#120914']
    : ['#f8f5ff', '#f5f3ff', '#ffffff'];
  const headerBackground = isDark ? 'rgba(27, 16, 34, 0.82)' : 'rgba(255,255,255,0.92)';
  const headerButtonBackground = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const sectionBackground = isDark ? theme.screen : theme.background;
  const coverBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const pillBackground = isDark ? primaryColorAlpha(0.1) : primaryColorAlpha(0.08);
  const metaText = isDark ? '#CBD5E1' : theme.textSecondary;
  const viewAllColor = isDark ? '#c084fc' : theme.accent;
  const cardBackground = isDark ? '#1e293b' : theme.surface;
  const badgeBorder = isDark ? '#1b1022' : theme.background;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? 54 : insets.top,
        },
      ]}
      edges={['left', 'right']}
    >
      <View style={[styles.screen, { backgroundColor: sectionBackground }]}>
        <LinearGradient
          colors={overlayGradient as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.header, { borderBottomColor: isDark ? primaryColorAlpha(0.12) : theme.border, backgroundColor: headerBackground }]}>
          <View style={styles.headerLeft}>
            <Pressable style={[styles.headerButton, { backgroundColor: headerButtonBackground }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Effect Detail</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={[styles.headerButton, { backgroundColor: headerButtonBackground }]}>
              <MaterialIcons name="favorite" size={20} color={PRIMARY_COLOR} />
            </Pressable>
            <Pressable style={[styles.headerButton, { backgroundColor: headerButtonBackground }]}>
              <MaterialIcons name="share" size={20} color={PRIMARY_COLOR} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.coverWrap}>
              <LinearGradient
                colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverGlow}
              />
              <Image source={{ uri: EFFECT_ART }} style={[styles.coverImage, { borderColor: coverBorder }]} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.62)']} style={styles.coverFade} />
              <View style={[styles.playBadge, { borderColor: badgeBorder }]}>
                <MaterialIcons name="play-arrow" size={20} color="#fff" />
              </View>
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.effectTitle, { color: theme.text }]}>Neon Glitch</Text>
              <Text style={[styles.effectArtist, { color: isDark ? '#c084fc' : theme.accent }]}>by @VisualMaster</Text>
              <View style={[styles.metaPill, { backgroundColor: pillBackground }]}>
                <MaterialIcons name="video-library" size={15} color="#C084FC" />
                <Text style={[styles.metaPillText, { color: metaText }]}>1.2M videos created</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionButton, styles.secondaryButton]}>
                <MaterialIcons name="bookmark" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Save</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.primaryButton]}>
                <MaterialIcons name="movie-edit" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Use Effect</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Creations</Text>
            <Pressable style={styles.sortButton}>
              <MaterialIcons name="sort" size={18} color={viewAllColor} />
            </Pressable>
          </View>

          <View style={[styles.grid, { paddingHorizontal: horizontalPadding }]}>
            {creations.map((creation) => (
              <Pressable
                key={creation.id}
                style={[
                  styles.card,
                  { width: itemWidth, height: itemHeight, marginBottom: gap, marginRight: gap, backgroundColor: cardBackground },
                  Number(creation.id) % 3 === 0 ? { marginRight: 0 } : null,
                ]}
              >
                <Image source={{ uri: creation.image }} style={styles.cardImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.cardOverlay} />
                <View style={styles.cardMeta}>
                  <MaterialIcons name="play-arrow" size={14} color="#fff" />
                  <Text style={styles.cardMetaText}>{creation.views}</Text>
                </View>
              </Pressable>
            ))}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.fourteen,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  coverWrap: {
    width: 264,
    height: 264,
    marginBottom: 22,
    position: 'relative',
  },
  coverGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    transform: [{ scale: 1.04 }],
    opacity: 0.42,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
  },
  coverFade: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  playBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  effectTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen : FontSize.twenty,
    textAlign: 'center',
  },
  effectArtist: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.fourteen : FontSize.twelve,
    textAlign: 'center',
  },
  metaPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.eight,
  },
  actionRow: {
    flexDirection: 'row',
    width: '88%',
    gap: 12,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.fourteen : FontSize.ten,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen : FontSize.twelve,
  },
  sortButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    overflow: 'hidden',
    borderRadius: 2,
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
    fontSize: FontSize.nine,
  },
});

export default UseEffect;
