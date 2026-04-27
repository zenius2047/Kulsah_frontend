import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAtfTYQLqMJlJJOkz8ywMdhjF-eWbj7INd0yFasAuyZNpzKYjK4P08-YCMEDOCnxcrYLx2kkKwABUJgD4Z0WvCVEv77uMa0we3fuOu1TzAe6eYEhr5AMtAvI4C7F36ui82Kqzmu0xdJdlCumb2rnIzHeNHEjGGjN_sR7ldmEktvp1g9ThgpBc2PK2P5oWZTJNVQf7ZCWvlfAnrGGiy7JY_cOPBEj9IQPFgmdM5Vyow6NxrduDhAJnICPLtROgH-A1nIjRjxk9ZFxBbr';

const AUDIO_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDZpk8w-_2sSi5PcIrnykcJ8Y7VHA3v6xeYxJUsMJMFlIAxR4-3T24eEaQvGpo2qCQbKw08uLatb9e7uof6gFLJLmRRAxeNh9CWa8_Nd9eDwdTjicCHnW-IJ6MfGFO5wil7Zug3yQfReoFB4wNE6UmG1tcdRO7nrHFLpWcdZ2xSjkYq_BfpLFyQQNVI2yIQ61_iiXfZwXdc7j6eeYc9Kfrl2nMjP6MC-1sr_arXcqLudx2Dm3_lNsVrsXjRTT2vSOB5ewIkYQDwPeAK';

const ChallengeEntry: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const headerBackground = isDark ? 'rgba(15, 8, 20, 0.84)' : 'rgba(255,255,255,0.94)';
  const headerBorder = isDark ? 'rgba(217, 21, 210, 0.12)' : theme.border;
  const iconSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const cardSurface = isDark ? 'rgba(217, 21, 210, 0.1)' : theme.card;
  const cardBorder = isDark ? 'rgba(217, 21, 210, 0.22)' : theme.border;
  const secondaryText = isDark ? '#94A3B8' : theme.textSecondary;
  const lightGradient = ['#fdf8ff', '#f8f3fc', '#f2ebf8'] as const;
  const darkGradient = ['#140b1d', '#0f0814', '#09040d'] as const;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={isDark ? darkGradient : lightGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.header, { borderBottomColor: headerBorder, backgroundColor: headerBackground }]}>
          <Pressable style={[styles.iconButton, { backgroundColor: iconSurface }]} onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Submit Entry</Text>

          <View style={styles.headerRight}>
            <Pressable style={[styles.iconButton, { backgroundColor: iconSurface }]}>
              <MaterialIcons name="help-outline" size={22} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroCard}>
              <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
              <LinearGradient
                colors={['rgba(15,8,20,0)', 'rgba(15,8,20,0.95)']}
                locations={[0.35, 1]}
                style={styles.heroOverlay}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroMetaRow}>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Live Challenge</Text>
                  </View>
                  <Text style={styles.entryCount}>1.2k entries</Text>
                </View>
                <Text style={styles.heroTitle}>Night Vibes Dance Challenge</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={[styles.descriptionText, { color: secondaryText }]}>
              Show us your best moves under the neon lights! Use the official track and tag{' '}
              <Text style={styles.hashTag}>#NightVibes</Text> for a chance to be featured on the
              creator's main feed and win a shoutout.
            </Text>
          </View>

          <View style={styles.audioSection}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Audio</Text>
              <Pressable>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.audioCard, { borderColor: cardBorder, backgroundColor: cardSurface }]}>
              <View style={styles.audioArtWrap}>
                <Image source={{ uri: AUDIO_ART }} style={styles.audioArt} />
                <View style={styles.audioPlayOverlay}>
                  <MaterialIcons name="play-arrow" size={26} color="#fff" />
                </View>
              </View>

              <View style={styles.audioInfo}>
                <Text style={[styles.audioTitle, { color: theme.text }]} numberOfLines={1}>
                  Midnight Neon (Official Remix)
                </Text>
                <Text style={styles.audioMeta}>Vibe Architect • 0:30</Text>
              </View>

              <MaterialIcons name="check-circle" size={22} color="#cd2bee" />
            </Pressable>
          </View>

          <View style={styles.uploadSection}>
            <Pressable
            onPress={()=>(
              navigation.navigate("RecordContent")
            )}
            style={[styles.uploadCard, styles.recordCard]}>
              <View style={styles.recordIconCircle}>
                <MaterialIcons name="videocam" size={30} color="#fff" />
              </View>
              <Text style={styles.recordLabel}>Record Now</Text>
            </Pressable>

            <Pressable
            onPress={()=>(
              navigation.navigate("Library")
            )}
            style={[styles.uploadCard, styles.libraryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.card, borderColor: cardBorder }]}>
              <View style={styles.libraryIconCircle}>
                <MaterialIcons name="upload-file" size={30} color="#cd2bee" />
              </View>
              <Text style={[styles.libraryLabel, { color: theme.text }]}>Upload Library</Text>
            </Pressable>
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0814',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0f0814',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 21, 210, 0.12)',
    backgroundColor: 'rgba(15, 8, 20, 0.84)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    minHeight: 256,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 21, 210, 0.18)',
    backgroundColor: 'rgba(217, 21, 210, 0.12)',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
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
    padding: 20,
    gap: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
    alignSelf: 'flex-start',
  },
  liveBadgeText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  entryCount: {
    color: 'rgba(217, 21, 210, 0.82)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(18),
    lineHeight: 30,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  descriptionText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
    lineHeight: 22,
  },
  hashTag: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
  },
  audioSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
  },
  seeAll: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 21, 210, 0.22)',
    backgroundColor: 'rgba(217, 21, 210, 0.1)',
  },
  audioArtWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  audioArt: {
    width: '100%',
    height: '100%',
  },
  audioPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
    marginBottom: 4,
  },
  audioMeta: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(10),
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  uploadCard: {
    flex: 1,
    minHeight: 154,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  recordCard: {
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  libraryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(217, 21, 210, 0.12)',
  },
  recordIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  libraryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 21, 210, 0.18)',
    marginBottom: 12,
  },
  recordLabel: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textAlign: 'center',
  },
  libraryLabel: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textAlign: 'center',
  },
});

export default ChallengeEntry;
