import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, FontSize } from '../fonts';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { mediumScreen } from '../types';

type ChallengeStatus = 'active' | 'completed';
type ChallengeTab = 'all' | 'newest' | 'active' | 'completed';

type FanChallenge = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  status: ChallengeStatus;
  image: string;
  isNew?: boolean;
};

const challengeTabs: ChallengeTab[] = ['all', 'newest', 'active', 'completed'];

const fallbackChallenges: FanChallenge[] = [
  {
    id: 'c1',
    creatorId: 'mila_ray_01',
    creatorName: 'Mila Ray',
    title: 'Night Vibes Dance Challenge',
    description: 'Show us your best moves under the neon lights! Use the official track and tag #NightVibes for a chance to be featured.',
    reward: '$500 + Feature',
    deadline: '7 Days',
    participants: 1200,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c2',
    creatorId: 'elena_rose',
    creatorName: 'Elena Rose',
    title: 'Nebula Vocal Challenge',
    description: 'Sing your heart out to the chorus of Nebula. Best vocal texture wins a studio session!',
    reward: 'Studio Session + $1000',
    deadline: '12 Days',
    participants: 850,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c3',
    creatorId: 'alex_rivera_42',
    creatorName: 'Alex Rivera',
    title: 'Drone Hyperlapse Speedrun',
    description: 'Record an incredible sunset hyperlapse within 30 seconds. Seamless loop is mandatory.',
    reward: '5,000 KulCoins',
    deadline: 'Expired',
    participants: 2400,
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c4',
    creatorId: 'lucas_dupont',
    creatorName: 'Lucas Dupont',
    title: 'Cinematic Vlog Sequence',
    description: 'Color-grade an atmospheric B-roll sequence using our custom Cinematic LUTs pack.',
    reward: 'Premium Creator Pass',
    deadline: 'Finished',
    participants: 1950,
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c5',
    creatorId: 'mila_ray_01',
    creatorName: 'Mila Ray',
    title: 'Solstice Light Painting',
    description: 'Get ready for the summer solstice! Capture beautiful long-exposure photography using flashlight strokes.',
    reward: 'Feature + 10,000 KulCoins',
    deadline: '3 Days',
    participants: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c6',
    creatorId: 'alex_rivera_42',
    creatorName: 'Alex Rivera',
    title: 'Neon Synth Soundscape',
    description: 'Produce a 15-second retro synthwave loop using our sound seed. Best bass design wins a hardware synth!',
    reward: 'Hardware Synth + $1500',
    deadline: '14 Days',
    participants: 120,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
];

const Challenges: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ChallengeTab>('all');

  const displayChallenges = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = fallbackChallenges.filter((challenge) => {
      if (query) {
        const haystack = [
          challenge.title,
          challenge.description,
          challenge.creatorName,
          challenge.creatorId,
        ].join(' ').toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (activeTab === 'all' || activeTab === 'newest') return true;
      return challenge.status === activeTab;
    });

    if (activeTab === 'newest') {
      return [...filtered].sort((a, b) => b.id.localeCompare(a.id));
    }

    return filtered;
  }, [activeTab, searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  const openChallenge = (challengeId: string) => {
    navigation.navigate('ChallengeFeed', { challengeId });
  };

  return (
    <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: theme.background, marginTop: Platform.OS === 'ios' ? 54 : insets.top }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#000000' : '#ffffff', borderBottomColor: isDark ? '#27272a' : '#e2e8f0' }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>Challenge Orbit</Text>
            <Text style={styles.headerSubtitle}>Galaxy Universe</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.searchBox, { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e2e8f0', marginHorizontal: 20 }]}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search challenges, creator, description..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsWrap}>
          {challengeTabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  isSelected ? styles.tabButtonSelected : styles.tabButtonIdle,
                  !isSelected ? { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e2e8f0' } : null,
                ]}
              >
                <Text style={[styles.tabText, { color: isSelected ? '#ffffff' : isDark ? '#a1a1aa' : '#475569' }]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
      >
        

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Challenges</Text>
          <Text style={styles.sectionCount}>
            {displayChallenges.length} {displayChallenges.length === 1 ? 'Challenge' : 'Challenges'}
          </Text>
        </View>

        {displayChallenges.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: theme.border }]}>
            <MaterialIcons name="search-off" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No challenges found matching query</Text>
            <Pressable onPress={clearFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.challengeList}>
            {displayChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} onPress={() => openChallenge(challenge.id)} styles={styles} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ChallengeCard = ({
  challenge,
  onPress,
  styles,
}: {
  challenge: FanChallenge;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) => {
  const statusConfig =
    challenge.status === 'completed'
      ? { icon: 'check-circle' as const, label: 'Completed', color: '#34d399', background: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)' }
      : challenge.isNew
        ? { icon: 'fiber-new' as const, label: 'New', color: '#a78bfa', background: 'rgba(139,92,246,0.22)', border: 'rgba(139,92,246,0.34)' }
        : { icon: 'bolt' as const, label: 'Trending', color: PRIMARY_COLOR, background: primaryColorAlpha(0.2), border: primaryColorAlpha(0.32) };

  return (
    <Pressable onPress={onPress} style={styles.challengeCard}>
      <ImageBackground source={{ uri: challenge.image }} resizeMode="cover" style={styles.challengeImage}>
        <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.96)']} style={StyleSheet.absoluteFillObject} />

        <View style={[styles.statusPill, { backgroundColor: statusConfig.background, borderColor: statusConfig.border }]}>
          <MaterialIcons name={statusConfig.icon} size={16} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>

        <View style={styles.cardContent}>
          <View>
            <Text style={styles.creatorText}>@{challenge.creatorId}</Text>
            <Text style={styles.cardTitle}>{challenge.title}</Text>
            <Text numberOfLines={2} style={styles.cardDescription}>{challenge.description}</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricsLeft}>
              <Metric label="Participants" value={challenge.participants.toLocaleString()} styles={styles} />
              <View style={styles.metricDivider} />
              <Metric label="Deadline" value={challenge.deadline} styles={styles} />
            </View>
            <Text numberOfLines={2} style={styles.rewardText}>{challenge.reward}</Text>
          </View>

          <View style={styles.watchButton}>
            <MaterialIcons name="visibility" size={16} color="#ffffff" />
            <Text style={styles.watchButtonText}>Watch Entries</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const Metric = ({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) => (
  <View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const createStyles = (isDark: boolean) => {
  const cardShadow = isDark ? '#000000' : '#0f172a';

  return StyleSheet.create({
    safeArea: { flex: 1 },
    header: { paddingBottom: 14, borderBottomWidth: 1 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
    headerRoundBtn: { height: 40, width: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitleWrap: { alignItems: 'center' },
    headerTitle: {
      fontFamily: FontFamily.displayExtraBold,
      fontSize: FontSize.body,
      textTransform: 'uppercase',
      letterSpacing: 2.2,
    },
    headerSubtitle: { color: PRIMARY_COLOR, marginTop: 4, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, letterSpacing: 1.5, textTransform: 'uppercase' },
    headerSpacer: { width: 40 },
    content: { padding: 20, gap: 18 },
    searchBox: {
      height: 48,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      shadowColor: cardShadow,
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.twelve,
      paddingVertical: 0,
    },
    tabsWrap: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 12,
      paddingHorizontal: 20,
    },
    tabButton: {
      minHeight: 34,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderWidth: 1,
    },
    tabButtonSelected: {
      backgroundColor: PRIMARY_COLOR,
      borderColor: 'transparent',
    },
    tabButtonIdle: {},
    tabText: {
      fontFamily: FontFamily.extraBold,
      fontSize: mediumScreen ? FontSize.twelve : FontSize.eight,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    sectionHeader: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    sectionTitle: {
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.ten,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    sectionCount: {
      color: PRIMARY_COLOR,
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.ten,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    challengeList: { gap: 22 },
    challengeCard: {
      height: 384,
      borderRadius: 36,
      overflow: 'hidden',
      backgroundColor: '#0f172a',
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.5 : 0.22,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    challengeImage: { flex: 1 },
    statusPill: {
      position: 'absolute',
      top: 20,
      left: 20,
      minHeight: 34,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    statusText: {
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.nine,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    cardContent: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 22,
      gap: 16,
    },
    creatorText: {
      color: PRIMARY_COLOR,
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.ten,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    cardTitle: {
      color: '#ffffff',
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.twentyTwo,
      lineHeight: 28,
      textTransform: 'uppercase',
    },
    cardDescription: {
      color: 'rgba(255,255,255,0.66)',
      fontFamily: FontFamily.medium,
      fontSize: FontSize.twelve,
      lineHeight: 18,
      marginTop: 8,
    },
    metricsRow: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.12)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    metricsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
    metricDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)' },
    metricLabel: {
      color: 'rgba(255,255,255,0.42)',
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.seven,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    metricValue: {
      color: '#ffffff',
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.eleven,
      textTransform: 'uppercase',
      marginTop: 3,
    },
    rewardText: {
      maxWidth: 120,
      color: PRIMARY_COLOR,
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.twelve,
      textAlign: 'right',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    watchButton: {
      height: 48,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    watchButtonText: {
      color: '#ffffff',
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.nine,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    emptyCard: {
      minHeight: 220,
      borderRadius: 28,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      gap: 12,
    },
    emptyTitle: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.fourteen,
      textAlign: 'center',
    },
    clearButton: {
      marginTop: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: primaryColorAlpha(0.2),
      backgroundColor: primaryColorAlpha(0.1),
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    clearButtonText: {
      color: PRIMARY_COLOR,
      fontFamily: FontFamily.extraBold,
      fontSize: FontSize.nine,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  });
};

export default Challenges;
