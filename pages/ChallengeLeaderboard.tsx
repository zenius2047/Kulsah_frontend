import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize } from '../fonts';
import { useThemeMode } from '../theme';

type LeaderboardTab = 'rankings' | 'rules' | 'prizes';

const topThree = [
  { rank: 2, name: 'MusicLover99', votes: '12.8k', avatar: 'https://picsum.photos/seed/fan1/200' },
  {
    rank: 1,
    name: 'Champion Fan',
    votes: '15.4k',
    avatar: 'https://picsum.photos/seed/fan2/200',
    isWinner: true,
  },
  { rank: 3, name: 'BassMaster', votes: '10.2k', avatar: 'https://picsum.photos/seed/fan3/200' },
];

const globalRankings = [
  {
    rank: 4,
    name: 'MelodyJane',
    votes: '8.9k',
    avatar: 'https://picsum.photos/seed/fan4/200',
    entry: 'https://picsum.photos/seed/e1/100',
  },
  {
    rank: 5,
    name: 'RetroVibe_X',
    votes: '7.4k',
    avatar: 'https://picsum.photos/seed/fan5/200',
    entry: 'https://picsum.photos/seed/e2/100',
  },
  {
    rank: 6,
    name: 'DigitalGhost',
    votes: '6.1k',
    avatar: 'https://picsum.photos/seed/fan6/200',
    entry: 'https://picsum.photos/seed/e3/100',
  },
  {
    rank: 7,
    name: 'NeonDancer',
    votes: '5.8k',
    avatar: 'https://picsum.photos/seed/fan7/200',
    entry: 'https://picsum.photos/seed/e4/100',
  },
];

const rules = [
  {
    title: 'Original Content',
    desc: 'All submissions must be your own original work or a remix of the provided stems.',
  },
  {
    title: 'Video Format',
    desc: 'Videos should be between 15-60 seconds in vertical 9:16 format.',
  },
  {
    title: 'No Explicit Content',
    desc: 'Keep it clean. Any offensive or explicit content will be disqualified immediately.',
  },
  {
    title: 'Voting Period',
    desc: 'Voting remains open until the challenge deadline. One vote per user per day.',
  },
];

const prizes = [
  {
    rank: 'Grand Prize',
    prize: '$1,000 + Studio Session',
    desc: 'The ultimate winner gets a cash prize and a 4-hour studio session with the creator.',
    colors: ['#fbbf24', '#f97316'] as const,
    icon: 'workspace-premium' as const,
  },
  {
    rank: 'Runner Up',
    prize: '$500 + Signed Merch',
    desc: 'Second place receives a cash prize and a limited edition signed merchandise bundle.',
    colors: ['#cbd5e1', '#64748b'] as const,
    icon: 'military-tech' as const,
  },
  {
    rank: 'Third Place',
    prize: '$250 + Shoutout',
    desc: "Third place gets a cash prize and a permanent shoutout on the creator's main profile.",
    colors: ['#d97706', '#92400e'] as const,
    icon: 'stars' as const,
  },
];

const tabItems: { key: LeaderboardTab; label: string }[] = [
  { key: 'rankings', label: 'Rankings' },
  { key: 'rules', label: 'Rules' },
  { key: 'prizes', label: 'Prizes' },
];

const ChallengeLeaderboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('rankings');

  const screenBg = isDark ? '#07080d' : '#f8fafc';
  const headerBg = isDark ? 'rgba(7,8,13,0.86)' : 'rgba(248,250,252,0.92)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const mutedText = isDark ? 'rgba(255,255,255,0.42)' : '#64748b';
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]} edges={['left', 'right']}>
      <View style={[styles.screen, { backgroundColor: screenBg }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: headerBg,
              borderBottomColor: borderColor,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.headerButton, { backgroundColor: softSurface, borderColor }]}
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Orbit Leaderboard</Text>

          <Pressable style={[styles.headerButton, { backgroundColor: softSurface, borderColor }]}>
            <MaterialIcons name="share" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 120,
            gap: 24,
          }}
        >
          <View style={[styles.tabWrap, { backgroundColor: softSurface, borderColor }]}>
            {tabItems.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    active
                      ? {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                        }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? '#cd2bee' : mutedText },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'rankings' ? (
            <View style={styles.sectionGap}>
              <View style={styles.podiumRow}>
                <View style={styles.sidePodiumItem}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: topThree[0].avatar }} style={styles.sidePodiumAvatar} />
                    <View style={[styles.placeBadge, { backgroundColor: '#cbd5e1' }]}>
                      <Text style={[styles.placeBadgeText, { color: '#0f172a' }]}>2nd</Text>
                    </View>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.sidePodiumName, { color: theme.text }]}>{topThree[0].name}</Text>
                    <Text style={styles.voteAccent}>{topThree[0].votes} Votes</Text>
                  </View>
                </View>

                <View style={styles.winnerPodiumItem}>
                  <MaterialIcons name="emoji-events" size={34} color="#cd2bee" style={styles.trophyIcon} />
                  <View style={styles.winnerAvatarRing}>
                    <Image source={{ uri: topThree[1].avatar }} style={styles.winnerAvatar} />
                  </View>
                  <View style={[styles.placeBadge, styles.winnerBadge]}>
                    <Text style={styles.winnerBadgeText}>#1</Text>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.winnerName, { color: theme.text }]}>{topThree[1].name}</Text>
                    <Text style={styles.winnerVotes}>{topThree[1].votes} Votes</Text>
                  </View>
                </View>

                <View style={styles.sidePodiumItem}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: topThree[2].avatar }} style={[styles.sidePodiumAvatar, styles.thirdAvatar]} />
                    <View style={[styles.placeBadge, { backgroundColor: '#b45309' }]}>
                      <Text style={styles.winnerBadgeText}>3rd</Text>
                    </View>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.sidePodiumName, { color: theme.text }]}>{topThree[2].name}</Text>
                    <Text style={styles.voteAccent}>{topThree[2].votes} Votes</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionGap}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Global Rankings</Text>
                <View style={styles.sectionGapSmall}>
                  {globalRankings.map((fan) => (
                    <View
                      key={fan.rank}
                      style={[
                        styles.rankCard,
                        {
                          backgroundColor: softSurface,
                          borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.rankNumber, { color: mutedText }]}>{fan.rank}</Text>
                      <Image source={{ uri: fan.avatar }} style={[styles.rankAvatar, { borderColor }]} />
                      <View style={styles.rankCopy}>
                        <Text style={[styles.rankName, { color: theme.text }]}>{fan.name}</Text>
                        <Text style={[styles.rankVotes, { color: mutedText }]}>{fan.votes} votes</Text>
                      </View>
                      <Image source={{ uri: fan.entry }} style={[styles.entryThumb, { borderColor }]} />
                      <Pressable style={styles.heartButton}>
                        <MaterialIcons name="favorite" size={20} color="#cd2bee" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              <LinearGradient
                colors={['#cd2bee', '#db2777'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.userRankCard}
              >
                <View style={styles.userGlow} />
                <View style={styles.userRankContent}>
                  <View style={styles.userRankLeft}>
                    <Text style={styles.userRankNumber}>24</Text>
                    <Image source={{ uri: 'https://picsum.photos/seed/user/200' }} style={styles.userAvatar} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userName}>You (SuperFan_01)</Text>
                      <Text style={styles.userStats}>2.1k votes * Top 15%</Text>
                    </View>
                  </View>
                  <Pressable style={styles.boostButton}>
                    <Text style={styles.boostButtonText}>Boost Entry</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          ) : null}

          {activeTab === 'rules' ? (
            <View style={styles.sectionGap}>
              <View style={[styles.rulesCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.rulesHeader}>
                  <MaterialIcons name="gavel" size={24} color="#cd2bee" />
                  <Text style={[styles.rulesTitle, { color: theme.text }]}>Challenge Rules</Text>
                </View>

                <View style={styles.sectionGap}>
                  {rules.map((rule, index) => (
                    <View key={rule.title} style={styles.ruleRow}>
                      <View style={styles.ruleIndex}>
                        <Text style={styles.ruleIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.ruleCopy}>
                        <Text style={[styles.ruleTitle, { color: theme.text }]}>{rule.title}</Text>
                        <Text style={[styles.ruleDesc, { color: mutedText }]}>{rule.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noticeCard}>
                <MaterialIcons name="verified" size={30} color="#10b981" />
                <Text style={styles.noticeText}>
                  Verified creators will review the top 10 entries to select the final winners.
                </Text>
              </View>
            </View>
          ) : null}

          {activeTab === 'prizes' ? (
            <View style={styles.sectionGapSmall}>
              {prizes.map((prize) => (
                <View
                  key={prize.rank}
                  style={[
                    styles.prizeCard,
                    {
                      backgroundColor: cardBg,
                      borderColor,
                    },
                  ]}
                >
                  <LinearGradient colors={prize.colors} style={styles.prizeIconWrap}>
                    <MaterialIcons name={prize.icon} size={30} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.prizeCopy}>
                    <Text style={styles.prizeRank}>{prize.rank}</Text>
                    <Text style={[styles.prizeTitle, { color: theme.text }]}>{prize.prize}</Text>
                    <Text style={[styles.prizeDesc, { color: mutedText }]}>{prize.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: headerBg,
              borderTopColor: borderColor,
            },
          ]}
        >
          {[
            { icon: 'home', label: 'Home' },
            { icon: 'play-circle', label: 'Videos' },
            { icon: 'emoji-events', label: 'Rankings', active: true },
            { icon: 'music-note', label: 'Music' },
          ].map((item) => (
            <View key={item.label} style={styles.navItem}>
              <MaterialIcons
                name={item.icon as keyof typeof MaterialIcons.glyphMap}
                size={24}
                color={item.active ? '#cd2bee' : mutedText}
              />
              <Text style={[styles.navText, { color: item.active ? '#cd2bee' : mutedText }]}>
                {item.label}
              </Text>
            </View>
          ))}

          <View style={styles.navItem}>
            <Image source={{ uri: 'https://picsum.photos/seed/user/100' }} style={[styles.profileThumb, { borderColor }]} />
            <Text style={[styles.navText, { color: mutedText }]}>Profile</Text>
          </View>
        </View> */}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.fourteen,
    textTransform: 'uppercase',
  },
  tabWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionGap: {
    gap: 24,
  },
  sectionGapSmall: {
    gap: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 14,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sidePodiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  winnerPodiumItem: {
    flex: 1.12,
    alignItems: 'center',
    gap: 10,
  },
  trophyIcon: {
    marginBottom: -2,
  },
  podiumAvatarWrap: {
    alignItems: 'center',
  },
  sidePodiumAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#cbd5e1',
  },
  thirdAvatar: {
    borderColor: '#b45309',
  },
  winnerAvatarRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    borderColor: '#cd2bee',
    padding: 4,
    backgroundColor: 'rgba(205,43,238,0.12)',
  },
  winnerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  placeBadge: {
    marginTop: -10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeBadgeText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.seven,
  },
  winnerBadge: {
    backgroundColor: '#cd2bee',
  },
  winnerBadgeText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.seven,
  },
  centerAlign: {
    alignItems: 'center',
    gap: 3,
  },
  sidePodiumName: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
    textAlign: 'center',
  },
  voteAccent: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  winnerName: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.thirteen,
    textAlign: 'center',
  },
  winnerVotes: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  sectionTitle: {
    marginLeft: 6,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.fourteen,
    textTransform: 'uppercase',
  },
  rankCard: {
    padding: 14,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.fourteen,
  },
  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  rankCopy: {
    flex: 1,
    gap: 3,
  },
  rankName: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
  },
  rankVotes: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  entryThumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  heartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRankCard: {
    overflow: 'hidden',
    borderRadius: 34,
    padding: 22,
  },
  userGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  userRankLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userRankNumber: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.twentyEight,
  },
  userAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userCopy: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.twelve,
  },
  userStats: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  boostButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  boostButtonText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  rulesCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rulesTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.sixteen,
    textTransform: 'uppercase',
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 14,
  },
  ruleIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(205,43,238,0.12)',
  },
  ruleIndexText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.nine,
  },
  ruleCopy: {
    flex: 1,
    gap: 4,
  },
  ruleTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
    textTransform: 'uppercase',
  },
  ruleDesc: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: FontSize.nine,
    lineHeight: 18,
  },
  noticeCard: {
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.26)',
  },
  noticeText: {
    flex: 1,
    color: '#34d399',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.eightHalf,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  prizeCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prizeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeCopy: {
    flex: 1,
    gap: 4,
  },
  prizeRank: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  prizeTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.thirteen,
  },
  prizeDesc: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: FontSize.nine,
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.seven,
  },
  profileThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default ChallengeLeaderboard;
