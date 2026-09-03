import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChallenge, useChallengeLeaderboard } from '../src/hooks/challenges/useChallenges';
import { useSettleCreatorBattle } from '../src/hooks/challenges/useChallengeMutations';
import type { ChallengePrizeResource } from '../src/types/challenge.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { challengeRuleResourceToDisplay } from '../src/utils/challenges';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { user, type User } from '../types';
import { fontSize } from '../typography';
import { BoostEntryDialog } from './ChallengeLeaderboard';

type LeaderboardTab = 'ranking' | 'rules' | 'award';
type IconName = keyof typeof MaterialIcons.glyphMap;

type RankingItem = {
  id: string;
  rank: number;
  name: string;
  handle: string;
  points: number;
  avatar: string;
  entry?: string;
  creatorId: string;
  verified?: boolean;
};

const DEFAULT_AVATAR = 'https://picsum.photos/seed/challenge-user/200';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=85&w=1000';

const MOCK_RANKINGS: RankingItem[] = [
  { id: '1', rank: 1, name: 'Dance Mira', handle: '@dancemira', points: 25780, avatar: 'https://i.pravatar.cc/160?img=47', creatorId: 'mira', verified: true },
  { id: '2', rank: 2, name: 'Move With Jay', handle: '@move.with.jay', points: 18450, avatar: 'https://i.pravatar.cc/160?img=11', creatorId: 'jay', verified: true },
  { id: '3', rank: 3, name: 'Rhythm Kid', handle: '@rhythm_kid', points: 14230, avatar: 'https://i.pravatar.cc/160?img=14', creatorId: 'rhythm', verified: true },
  { id: '4', rank: 4, name: 'Step By Step Ella', handle: '@stepbystep_ella', points: 11980, avatar: 'https://i.pravatar.cc/120?img=45', creatorId: 'ella', verified: true },
  { id: '5', rank: 5, name: 'Groove Master', handle: '@groove.master', points: 10450, avatar: 'https://i.pravatar.cc/120?img=12', creatorId: 'groove', verified: true },
  { id: '6', rank: 6, name: 'Beat With Luna', handle: '@beat.with.luna', points: 9870, avatar: 'https://i.pravatar.cc/120?img=44', creatorId: 'luna', verified: true },
  { id: '7', rank: 7, name: 'Vibez Only', handle: '@vibez_only', points: 8620, avatar: 'https://i.pravatar.cc/120?img=8', creatorId: 'vibez', verified: true },
  { id: '8', rank: 8, name: 'Dance Bree', handle: '@dance.bree', points: 7430, avatar: 'https://i.pravatar.cc/120?img=49', creatorId: 'bree' },
  { id: '9', rank: 9, name: 'Twist King', handle: '@twist.king', points: 6250, avatar: 'https://i.pravatar.cc/120?img=5', creatorId: 'twist', verified: true },
  { id: '10', rank: 10, name: 'Moves By Nia', handle: '@moves.by.nia', points: 5940, avatar: 'https://i.pravatar.cc/120?img=32', creatorId: 'nia', verified: true },
];

const FALLBACK_PRIZES: ChallengePrizeResource[] = [
  { id: 1, rank_from: 1, rank_to: 1, reward_type: 'cash', title: 'Grand Prize', description: 'Cash reward and a featured creator spotlight.', currency: 'USD', amount: 1000, quantity: 1 },
  { id: 2, rank_from: 2, rank_to: 2, reward_type: 'feature', title: 'Runner Up', description: 'Featured placement and creator merchandise.', quantity: 1 },
  { id: 3, rank_from: 3, rank_to: 3, reward_type: 'badge', title: 'Third Place', description: 'Challenge badge and profile recognition.', quantity: 1 },
];

const tabs: Array<{ key: LeaderboardTab; label: string }> = [
  { key: 'ranking', label: 'Ranking' },
  { key: 'rules', label: 'Rules' },
  { key: 'award', label: 'Award' },
];

const formatPoints = (points: number) => Number(points || 0).toLocaleString();

const readableLabel = (value: unknown) => String(value ?? '')
  .split('_')
  .filter(Boolean)
  .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ');

const durationLabel = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 'Open';
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 'Open';
  const days = Math.max(1, Math.ceil((endMs - startMs) / 86_400_000));
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
};

const remainingLabel = (seconds?: number | null, deadline?: string | null) => {
  let remaining = Number(seconds);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    const deadlineMs = deadline ? new Date(deadline).getTime() : Number.NaN;
    remaining = Number.isFinite(deadlineMs) ? Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000)) : 0;
  }
  if (remaining <= 0) return 'Closed';
  const days = Math.floor(remaining / 86_400);
  const hours = Math.floor((remaining % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${Math.max(1, hours)}h`;
};

const prizeAmount = (prize: ChallengePrizeResource) => {
  if (prize.amount == null || prize.amount === '') return prize.title;
  const amount = Number(prize.amount);
  return `${prize.currency || ''} ${Number.isFinite(amount) ? amount.toLocaleString() : prize.amount}`.trim();
};

const IconTile = ({ icon, isDark }: { icon: IconName; isDark: boolean }) => (
  <View style={[styles.iconTile, { backgroundColor: primaryColorAlpha(isDark ? 0.18 : 0.08) }]}>
    <MaterialIcons name={icon} size={25} color={PRIMARY_COLOR} />
  </View>
);

const ChallengeLeaderboardDetails: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const challengeId = route.params?.challengeId as string | number | undefined;
  const challengeQuery = useChallenge(challengeId);
  const leaderboardQuery = useChallengeLeaderboard(challengeId);
  const settleCreatorBattle = useSettleCreatorBattle();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('ranking');
  const [boostOpen, setBoostOpen] = useState(false);
  const [userRank, setUserRank] = useState(18);
  const [userPoints, setUserPoints] = useState(5210);

  const colors = {
    background: isDark ? '#080b12' : '#f7f9fc',
    card: isDark ? '#111722' : '#ffffff',
    border: isDark ? '#222c3c' : '#e3e8f0',
    text: isDark ? '#f8fafc' : '#0b1734',
    secondary: isDark ? '#94a3b8' : '#5f6b89',
    muted: isDark ? '#64748b' : '#7c88a5',
  };

  const challenge = challengeQuery.data;
  const coverImage = useMemo(() => {
    const media = challenge?.media?.find((item) => item.cover_url || item.video?.poster_url || item.video?.thumbnail);
    return challenge?.cover_image || media?.cover_url || media?.video?.poster_url || media?.video?.thumbnail || DEFAULT_COVER;
  }, [challenge?.cover_image, challenge?.media]);

  const rankings = useMemo<RankingItem[]>(() => {
    if (challengeId == null) return MOCK_RANKINGS;
    const pages = leaderboardQuery.data?.pages;
    if (!Array.isArray(pages)) return [];
    return pages.flatMap((page) => Array.isArray(page.data) ? page.data : []).map((entry, index) => {
      const name = entry.creator?.name || entry.creator?.handle || 'Challenge Creator';
      const rawHandle = entry.creator?.handle || name.toLowerCase().replace(/\s+/g, '.');
      return {
        id: String(entry.id),
        rank: Number(entry.current_rank) || index + 1,
        name,
        handle: rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`,
        points: Number(entry.current_score) || 0,
        avatar: entry.creator?.avatar || DEFAULT_AVATAR,
        entry: entry.video?.poster_url || entry.video?.thumbnail || undefined,
        creatorId: String(entry.creator_id),
        verified: Boolean(entry.creator?.verified),
      };
    }).sort((a, b) => a.rank - b.rank);
  }, [challengeId, leaderboardQuery.data]);

  const currentUserRanking = rankings.find((item) => item.creatorId === String(user?.id ?? ''));
  useEffect(() => {
    if (!currentUserRanking) return;
    setUserRank(currentUserRanking.rank);
    setUserPoints(currentUserRanking.points);
  }, [currentUserRanking]);

  const displayedUser: RankingItem = currentUserRanking || {
    id: 'current-user',
    rank: userRank,
    name: user?.name || 'You',
    handle: user?.handle
      ? (user.handle.startsWith('@') ? user.handle : `@${user.handle}`)
      : '@your.username',
    points: userPoints,
    avatar: user?.avatar || 'https://i.pravatar.cc/120?img=48',
    creatorId: String(user?.id || 'current-user'),
    verified: true,
  };
  const topThree = [rankings.find((item) => item.rank === 2), rankings.find((item) => item.rank === 1), rankings.find((item) => item.rank === 3)].filter((item): item is RankingItem => Boolean(item));
  const listRankings = rankings.filter((item) => item.rank > 3 && item.creatorId !== displayedUser.creatorId);

  const rules = useMemo(() => {
    const source = challenge?.rules || [];
    const submission = source
      .filter((rule) => rule.scope === 'submission')
      .map((rule) => {
        const display = challengeRuleResourceToDisplay(rule);
        return `${display.title}: ${display.description}`;
      });
    const content = source
      .filter((rule) => rule.scope === 'content')
      .map((rule) => {
        const display = challengeRuleResourceToDisplay(rule);
        return `${display.title}: ${display.description}`;
      });
    return {
      submission: submission.length ? submission : ['15–60 seconds', 'Vertical format (9:16)', 'Original video only', 'Clear audio and good lighting', 'Challenge hashtag required'],
      content: content.length ? content : ['No hate speech', 'No nudity or unsafe content', 'Respect copyright', 'Be respectful and authentic'],
    };
  }, [challenge?.rules]);

  const judgingCriteria = useMemo(() => {
    const components = challenge?.scoring_components || [];
    const parsed = components.map((component) => {
      const weight = Number(component.weight_bps);
      return {
        label: readableLabel(component.type || 'score'),
        value: Number.isFinite(weight) ? `${weight / 100}%` : '—',
      };
    });
    return parsed.length ? parsed : [
      { label: 'Creativity', value: '40%' },
      { label: 'Performance', value: '35%' },
      { label: 'Engagement', value: '25%' },
    ];
  }, [challenge?.scoring_components]);

  const prizes = challenge
    ? challenge.awards?.length ? challenge.awards : challenge.prizes || []
    : FALLBACK_PRIZES;
  const rewardSummary = challenge?.reward_summary || challenge?.pricing?.reward_summary;
  const title = challenge?.title || 'Dance Remix Challenge';
  const description = challenge?.description || 'Show your best remix dance move and tag #DanceRemixChallenge';
  const submissionStartsAt = challenge?.submission?.starts_at || challenge?.schedule?.submission_starts_at;
  const submissionEndsAt = challenge?.submission?.ends_at || challenge?.schedule?.submission_ends_at;
  const duration = durationLabel(submissionStartsAt, submissionEndsAt);
  const endsIn = remainingLabel(challenge?.time_remaining_seconds, submissionEndsAt);
  const isCreatorBattle = challenge?.mode === 'creator_battle' || Boolean(challenge?.is_creator_battle);
  const canManageBattle = Boolean(challenge?.current_user?.can_manage || challenge?.current_user?.is_host);
  const settlement = settleCreatorBattle.data?.data.data;
  const voteCost = challenge?.pricing?.voting?.vote_cost_per_choice ?? 10;
  const settlementAllowed = Boolean(
    challengeId != null
    && isCreatorBattle
    && challenge?.voting?.enabled
    && ['finalized', 'rewards_processing', 'completed'].includes(String(challenge?.status)),
  );

  const confirmBattleSettlement = () => {
    if (challengeId == null || !settlementAllowed || settleCreatorBattle.isPending) return;
    Alert.alert(
      'Settle battle vote proceeds?',
      'This converts the paid KulCoin votes and transfers the USD value to the confirmed winner. The operation is safe to retry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle payout',
          onPress: () => {
            void settleCreatorBattle.mutateAsync(challengeId).then((response) => {
              const result = response.data.data;
              if (result.status === 'failed') {
                Alert.alert('Settlement failed', result.failure_reason || 'The payout could not be completed. You can retry safely.');
                return;
              }
              Alert.alert('Battle payout settled', `${result.vote_coin_amount.toLocaleString()} KC from ${result.vote_count.toLocaleString()} votes was converted to $${result.usd_amount} USD for the winner.`);
            }).catch((error) => {
              Alert.alert('Settlement not completed', getApiErrorMessage(error));
            });
          },
        },
      ],
    );
  };

  const shareChallenge = async () => {
    await Share.share({ message: `${title}\n${description}` });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialIcons name="arrow-back-ios-new" size={25} color={colors.text} />
          </Pressable>
          <Pressable accessibilityLabel="Share challenge" hitSlop={10} onPress={() => void shareChallenge()} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialIcons name="ios-share" size={27} color={colors.text} />
          </Pressable>
        </View> */}

        <View style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={{ uri: coverImage }} style={styles.challengeImage} />
          <View style={styles.challengeCopy}>
            <Text numberOfLines={2} style={[styles.challengeTitle, { color: colors.text }]}>{title}</Text>
            <Text numberOfLines={3} style={[styles.challengeDescription, { color: colors.secondary }]}>{description}</Text>
          </View>
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabButton}>
                <Text style={[styles.tabText, { color: selected ? PRIMARY_COLOR : colors.secondary }]}>{tab.label}</Text>
                <View style={[styles.tabIndicator, { backgroundColor: selected ? PRIMARY_COLOR : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: activeTab === 'rules' ? 108 : insets.bottom + 24 }]}
        >
          {activeTab === 'ranking' ? (
            <View style={styles.sectionGap}>
              <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconTile icon="groups" isDark={isDark} />
                <View style={styles.statCopy}>
                  <Text style={[styles.statLabel, { color: colors.secondary }]}>Total participants</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{Number(challenge?.participant_count ?? 2842).toLocaleString()}</Text>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                <IconTile icon="person-outline" isDark={isDark} />
                <View style={styles.statCopy}>
                  <Text style={[styles.statLabel, { color: colors.secondary }]}>Your rank</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>#{displayedUser.rank}</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('ChallengeFeed', { challengeId })} style={styles.inlineLink}>
                  <Text style={styles.inlineLinkText}>View my entry</Text>
                  <MaterialIcons name="chevron-right" size={23} color={PRIMARY_COLOR} />
                </Pressable>
              </View>

              {challengeId != null && leaderboardQuery.isLoading ? (
                <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator color={PRIMARY_COLOR} />
                  <Text style={[styles.stateText, { color: colors.secondary }]}>Loading rankings…</Text>
                </View>
              ) : null}
              {challengeId != null && leaderboardQuery.isError ? (
                <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="cloud-off" size={30} color={colors.secondary} />
                  <Text style={[styles.stateText, { color: colors.secondary }]}>{getApiErrorMessage(leaderboardQuery.error)}</Text>
                  <Pressable onPress={() => void leaderboardQuery.refetch()} style={styles.retryButton}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
              {challengeId != null && leaderboardQuery.isSuccess && rankings.length === 0 ? (
                <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="leaderboard" size={30} color={colors.secondary} />
                  <Text style={[styles.stateText, { color: colors.secondary }]}>No ranked entries yet.</Text>
                </View>
              ) : null}

              {topThree.length === 3 ? (
                <View style={styles.podiumRow}>
                  {topThree.map((item) => {
                    const winner = item.rank === 1;
                    return (
                      <View key={item.id} style={[styles.podiumCard, winner && styles.winnerCard, { backgroundColor: colors.card, borderColor: winner ? PRIMARY_COLOR : colors.border }]}>
                        <View style={[styles.medal, { backgroundColor: primaryColorAlpha(winner ? 0.16 : 0.08) }]}>
                          <Text style={[styles.medalText, { color: winner ? PRIMARY_COLOR : colors.secondary }]}>#{item.rank}</Text>
                        </View>
                        {winner ? <MaterialIcons name="emoji-events" size={29} color={PRIMARY_COLOR} /> : null}
                        <Image source={{ uri: item.avatar }} style={[styles.podiumAvatar, { borderColor: winner ? PRIMARY_COLOR : colors.border }]} />
                        <View style={styles.handleRow}>
                          <Text numberOfLines={1} style={[styles.podiumHandle, { color: colors.text }]}>{item.handle}</Text>
                          {item.verified ? <MaterialIcons name="verified" size={15} color={PRIMARY_COLOR} /> : null}
                        </View>
                        <Text style={[styles.podiumPoints, { color: colors.text }]}>{formatPoints(item.points)}</Text>
                        <Text style={[styles.pointsLabel, { color: colors.secondary }]}>points</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={[styles.currentUserCard, { backgroundColor: colors.card, borderColor: PRIMARY_COLOR }]}>
                <Text style={[styles.currentRank, { color: colors.text }]}>{displayedUser.rank}</Text>
                <Image source={{ uri: displayedUser.avatar }} style={styles.currentAvatar} />
                <View style={styles.currentCopy}>
                  <View style={styles.handleRow}>
                    <View style={[styles.youBadge, { backgroundColor: primaryColorAlpha(0.1) }]}><Text style={styles.youText}>You</Text></View>
                    <Text numberOfLines={1} style={[styles.currentHandle, { color: colors.text }]}>{displayedUser.handle}</Text>
                    <MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} />
                  </View>
                </View>
                <Text style={[styles.currentPoints, { color: colors.text }]}>{formatPoints(userPoints)} <Text style={[styles.pointsLabel, { color: colors.secondary }]}>points</Text></Text>
                <Pressable onPress={() => setBoostOpen(true)} style={styles.boostButton}>
                  <Text style={styles.boostText}>Boost Entry</Text>
                </Pressable>
              </View>

              {listRankings.length ? (
                <View style={[styles.rankingList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {listRankings.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() => navigation.navigate('ChallengeFeed', { challengeId })}
                      style={[styles.rankingRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}
                    >
                      <Text style={[styles.listRank, { color: colors.secondary }]}>{item.rank}</Text>
                      <Image source={{ uri: item.avatar }} style={styles.listAvatar} />
                      <View style={styles.listCopy}>
                        <View style={styles.handleRow}>
                          <Text numberOfLines={1} style={[styles.listHandle, { color: colors.text }]}>{item.handle}</Text>
                          {item.verified ? <MaterialIcons name="verified" size={15} color={PRIMARY_COLOR} /> : null}
                        </View>
                      </View>
                      <Text style={[styles.listPoints, { color: colors.secondary }]}>{formatPoints(item.points)} <Text style={styles.pointsLabel}>points</Text></Text>
                      <MaterialIcons name="chevron-right" size={25} color={colors.secondary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {leaderboardQuery.hasNextPage ? (
                <Pressable disabled={leaderboardQuery.isFetchingNextPage} onPress={() => void leaderboardQuery.fetchNextPage()} style={[styles.loadMore, { borderColor: colors.border }]}>
                  {leaderboardQuery.isFetchingNextPage ? <ActivityIndicator color={PRIMARY_COLOR} /> : <Text style={styles.loadMoreText}>Load more</Text>}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {activeTab === 'rules' ? (
            <View style={styles.sectionGap}>
              <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeading}><IconTile icon="info-outline" isDark={isDark} /><Text style={[styles.cardTitle, { color: colors.text }]}>Challenge Overview</Text></View>
                <View style={styles.overviewStats}>
                  <View style={styles.overviewItem}><IconTile icon="schedule" isDark={isDark} /><View><Text style={[styles.overviewLabel, { color: colors.secondary }]}>Ends in</Text><Text style={[styles.overviewValue, { color: colors.text }]}>{endsIn}</Text></View></View>
                  <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.overviewItem}><IconTile icon="event" isDark={isDark} /><View><Text style={[styles.overviewLabel, { color: colors.secondary }]}>Duration</Text><Text style={[styles.overviewValue, { color: colors.text }]}>{duration}</Text></View></View>
                  <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.overviewItem}><IconTile icon="videocam" isDark={isDark} /><View><Text style={[styles.overviewLabel, { color: colors.secondary }]}>Entry type</Text><Text style={[styles.overviewValue, { color: colors.text }]}>1 video</Text></View></View>
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeading}><IconTile icon="videocam" isDark={isDark} /><Text style={[styles.cardTitle, { color: colors.text }]}>Video Requirements</Text></View>
                  {rules.submission.map((rule) => <View key={rule} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={[styles.bulletText, { color: colors.text }]}>{rule}</Text></View>)}
                </View>
                <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeading}><IconTile icon="person-add-alt" isDark={isDark} /><Text style={[styles.cardTitle, { color: colors.text }]}>How to Participate</Text></View>
                  {['Join the challenge', 'Record your challenge video', 'Edit and review your clip', 'Submit before the deadline'].map((step, index) => (
                    <View key={step} style={styles.bulletRow}><Text style={styles.stepNumber}>{index + 1}.</Text><Text style={[styles.bulletText, { color: colors.text }]}>{step}</Text></View>
                  ))}
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeading}><IconTile icon="shield" isDark={isDark} /><Text style={[styles.cardTitle, { color: colors.text }]}>Content Rules</Text></View>
                  {rules.content.map((rule) => <View key={rule} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={[styles.bulletText, { color: colors.text }]}>{rule}</Text></View>)}
                </View>
                <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeading}><IconTile icon="emoji-events" isDark={isDark} /><Text style={[styles.cardTitle, { color: colors.text }]}>Judging Criteria</Text></View>
                  {judgingCriteria.map((criterion, index) => (
                    <View key={criterion.label} style={[styles.criterionRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}><Text style={[styles.criterionLabel, { color: colors.text }]}>{criterion.label}</Text><Text style={[styles.criterionValue, { color: colors.text }]}>{criterion.value}</Text></View>
                  ))}
                </View>
              </View>

              <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}><IconTile icon="warning-amber" isDark={isDark} /><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: colors.text }]}>Disqualification</Text><Text style={[styles.noticeText, { color: colors.secondary }]}>Fake engagement, copied content, or rule violations may lead to removal from the leaderboard.</Text></View></View>
              <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}><IconTile icon="leaderboard" isDark={isDark} /><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: colors.text }]}>Leaderboard Updates</Text><Text style={[styles.noticeText, { color: colors.secondary }]}>Rankings update as verified scores are processed.</Text></View></View>
              <View style={[styles.guidelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}><MaterialIcons name="info-outline" size={24} color={PRIMARY_COLOR} /><Text style={[styles.guidelineText, { color: colors.secondary }]}>By participating, you agree to the challenge rules and <Text style={{ color: PRIMARY_COLOR }}>community guidelines.</Text></Text></View>
            </View>
          ) : null}

          {activeTab === 'award' ? (
            <View style={styles.sectionGap}>
              <View style={[styles.awardIntro, { backgroundColor: primaryColorAlpha(isDark ? 0.15 : 0.07), borderColor: PRIMARY_COLOR }]}>
                <IconTile icon="emoji-events" isDark={isDark} />
                <View style={styles.awardIntroCopy}><Text style={[styles.cardTitle, { color: colors.text }]}>Challenge Awards</Text><Text style={[styles.noticeText, { color: colors.secondary }]}>Final placements are confirmed after voting and integrity review.</Text></View>
              </View>
              {prizes.map((prize) => (
                <View key={prize.id} style={[styles.awardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.awardRank, { backgroundColor: primaryColorAlpha(0.1) }]}><MaterialIcons name="workspace-premium" size={29} color={PRIMARY_COLOR} /><Text style={styles.awardRankText}>{prize.rank_from === prize.rank_to ? `#${prize.rank_from}` : `${prize.rank_from}–${prize.rank_to}`}</Text></View>
                  <View style={styles.awardCopy}><Text style={[styles.awardTitle, { color: colors.text }]}>{prize.title}</Text><Text style={styles.awardAmount}>{prizeAmount(prize)}</Text><Text style={[styles.awardDescription, { color: colors.secondary }]}>{prize.description || `${prize.quantity || 1} reward available.`}</Text></View>
                </View>
              ))}
              {challenge && prizes.length === 0 ? (
                <View style={[styles.awardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.awardRank, { backgroundColor: primaryColorAlpha(0.1) }]}><MaterialIcons name="workspace-premium" size={29} color={PRIMARY_COLOR} /></View>
                  <View style={styles.awardCopy}>
                    <Text style={[styles.awardTitle, { color: colors.text }]}>{challenge.pricing?.title || 'Winner reward'}</Text>
                    {challenge.pricing?.amount != null ? <Text style={styles.awardAmount}>{`${challenge.pricing.currency || ''} ${challenge.pricing.amount}`.trim()}</Text> : null}
                    <Text style={[styles.awardDescription, { color: colors.secondary }]}>{rewardSummary || 'Reward details will appear when the battle prize is funded.'}</Text>
                  </View>
                </View>
              ) : null}
              {isCreatorBattle && canManageBattle ? (
                <View style={[styles.settlementCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.settlementHeader}>
                    <View style={[styles.settlementIcon, { backgroundColor: primaryColorAlpha(0.1) }]}>
                      <MaterialIcons name="account-balance" size={26} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.settlementHeaderCopy}>
                      <Text style={[styles.settlementTitle, { color: colors.text }]}>Vote payout settlement</Text>
                      <Text style={[styles.settlementDescription, { color: colors.secondary }]}>Each submitted ballot costs {voteCost} KC. After results are finalized, the collected vote value is paid to the confirmed winner.</Text>
                    </View>
                  </View>

                  {settlement ? (
                    <View style={[styles.settlementResult, { backgroundColor: primaryColorAlpha(0.07), borderColor: primaryColorAlpha(0.25) }]}>
                      <View style={styles.settlementResultHeading}>
                        <MaterialIcons name={settlement.status === 'completed' ? 'check-circle' : 'error-outline'} size={20} color={settlement.status === 'completed' ? '#10b981' : '#ef4444'} />
                        <Text style={[styles.settlementResultStatus, { color: settlement.status === 'completed' ? '#10b981' : '#ef4444' }]}>{readableLabel(settlement.status)}</Text>
                      </View>
                      <View style={styles.settlementMetrics}>
                        <View style={styles.settlementMetric}><Text style={[styles.settlementMetricValue, { color: colors.text }]}>{settlement.vote_count.toLocaleString()}</Text><Text style={[styles.settlementMetricLabel, { color: colors.secondary }]}>Votes</Text></View>
                        <View style={styles.settlementMetric}><Text style={[styles.settlementMetricValue, { color: colors.text }]}>{settlement.vote_coin_amount.toLocaleString()} KC</Text><Text style={[styles.settlementMetricLabel, { color: colors.secondary }]}>Collected</Text></View>
                        <View style={styles.settlementMetric}><Text style={[styles.settlementMetricValue, { color: colors.text }]}>${settlement.usd_amount}</Text><Text style={[styles.settlementMetricLabel, { color: colors.secondary }]}>Winner payout</Text></View>
                      </View>
                      {settlement.failure_reason ? <Text style={[styles.settlementFailure, { color: colors.secondary }]}>{settlement.failure_reason}</Text> : null}
                    </View>
                  ) : null}

                  <Pressable
                    disabled={!settlementAllowed || settleCreatorBattle.isPending || settlement?.status === 'completed'}
                    onPress={confirmBattleSettlement}
                    style={[
                      styles.settlementButton,
                      (!settlementAllowed || settleCreatorBattle.isPending || settlement?.status === 'completed') && styles.settlementButtonDisabled,
                    ]}
                  >
                    {settleCreatorBattle.isPending ? <ActivityIndicator size="small" color="#ffffff" /> : <MaterialIcons name={settlement?.status === 'failed' ? 'refresh' : 'payments'} size={20} color="#ffffff" />}
                    <Text style={styles.settlementButtonText}>
                      {settleCreatorBattle.isPending
                        ? 'Settling payout…'
                        : settlement?.status === 'completed'
                          ? 'Payout settled'
                          : settlement?.status === 'failed'
                            ? 'Retry settlement'
                            : settlementAllowed ? 'Settle winner payout' : 'Available after finalization'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {activeTab === 'rules' ? (
          <View style={[styles.createFooter, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Pressable onPress={() => navigation.navigate('RecordContent', { challengeId, purpose: 'challenge_entry', officialSoundId: challenge?.official_sound_id })} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
              {/* <MaterialIcons name="video-call" size={25} color="#ffffff" /> */}
              <Text style={styles.createButtonText}>Create Video</Text>
            </Pressable>
          </View>
        ) : null}

        <BoostEntryDialog
          isOpen={boostOpen}
          onClose={() => setBoostOpen(false)}
          currentUser={user as User | null}
          currentRank={userRank}
          baseVotes={userPoints}
          onBoostApplied={(pointsAdded, rank) => {
            setUserPoints((current) => current + pointsAdded);
            setUserRank(rank);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: { height: 56, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.62 },
  challengeCard: { marginHorizontal: 12, borderRadius: 20, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  challengeImage: { width: '34%', aspectRatio: 1.65, borderRadius: 14, backgroundColor: '#d8e1eb' },
  challengeCopy: { flex: 1, minWidth: 0 },
  challengeTitle: { ...fontSize.n3 },
  challengeDescription: { ...fontSize.b5, marginTop: 4 },
  tabs: { minHeight: 62, marginTop: 10, marginHorizontal: 12, borderRadius: 18, borderWidth: 1, flexDirection: 'row' },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { ...fontSize.b0 },
  tabIndicator: { position: 'absolute', left: 8, right: 8, bottom: 0, height: 3, borderRadius: 3 },
  content: { paddingHorizontal: 12, paddingTop: 10 },
  sectionGap: { gap: 10 },
  statsCard: { minHeight: 82, borderRadius: 20, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconTile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statCopy: { minWidth: 0 },
  statLabel: { ...fontSize.b6 },
  statValue: { ...fontSize.n3, marginTop: 2 },
  verticalDivider: { width: 1, height: 40, marginHorizontal: 3 },
  inlineLink: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  inlineLinkText: { ...fontSize.b6, color: PRIMARY_COLOR },
  stateCard: { minHeight: 135, borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, alignItems: 'center', justifyContent: 'center' },
  stateText: { ...fontSize.b5, textAlign: 'center' },
  retryButton: { minHeight: 39, borderRadius: 999, paddingHorizontal: 17, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  retryText: { ...fontSize.b5Variant, color: '#ffffff' },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 28 },
  podiumCard: { flex: 1, minWidth: 0, minHeight: 196, borderRadius: 18, borderWidth: 1, padding: 9, alignItems: 'center', justifyContent: 'center' },
  winnerCard: { minHeight: 220 },
  medal: { position: 'absolute', top: 9, left: 9, minWidth: 31, minHeight: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  medalText: { ...fontSize.b5Variant },
  podiumAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, marginVertical: 7 },
  handleRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 5 },
  podiumHandle: { ...fontSize.b6, flexShrink: 1 },
  podiumPoints: { ...fontSize.n3, marginTop: 9 },
  pointsLabel: { ...fontSize.b6 },
  currentUserCard: { minHeight: 76, borderRadius: 17, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  currentRank: { ...fontSize.n3, minWidth: 25, textAlign: 'center' },
  currentAvatar: { width: 47, height: 47, borderRadius: 24 },
  currentCopy: { flex: 1, minWidth: 0 },
  youBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  youText: { ...fontSize.b6, color: PRIMARY_COLOR },
  currentHandle: { ...fontSize.b5, flexShrink: 1 },
  currentPoints: { ...fontSize.b0 },
  boostButton: { minHeight: 42, borderRadius: 999, paddingHorizontal: 14, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  boostText: { ...fontSize.b5Variant, color: '#ffffff' },
  rankingList: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  rankingRow: { minHeight: 66, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  listRank: { ...fontSize.n3, width: 29, textAlign: 'center' },
  listAvatar: { width: 43, height: 43, borderRadius: 22 },
  listCopy: { flex: 1, minWidth: 0 },
  listHandle: { ...fontSize.b5, flexShrink: 1 },
  listPoints: { ...fontSize.b0 },
  loadMore: { minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { ...fontSize.b5Variant, color: PRIMARY_COLOR },
  overviewCard: { borderRadius: 20, borderWidth: 1, padding: 13 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
  cardTitle: { ...fontSize.b0, flexShrink: 1 },
  overviewStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overviewItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  overviewLabel: { ...fontSize.b6 },
  overviewValue: { ...fontSize.b0, marginTop: 2 },
  twoColumnRow: {  gap: 10 },
  ruleCard: { flex: 1, minWidth: 0, borderRadius: 20, borderWidth: 1, padding: 13 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 8 },
  bullet: { ...fontSize.b3, color: PRIMARY_COLOR },
  stepNumber: { ...fontSize.b0, color: PRIMARY_COLOR, minWidth: 21 },
  bulletText: { ...fontSize.b5, flex: 1 },
  criterionRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  criterionLabel: { ...fontSize.b5 },
  criterionValue: { ...fontSize.b0 },
  noticeCard: { borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  noticeCopy: { flex: 1 },
  noticeTitle: { ...fontSize.b0 },
  noticeText: { ...fontSize.b5, marginTop: 2 },
  guidelineCard: { borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  guidelineText: { ...fontSize.b5, flex: 1 },
  awardIntro: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  awardIntroCopy: { flex: 1 },
  awardCard: { minHeight: 112, borderRadius: 20, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 13 },
  awardRank: { width: 70, height: 78, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  awardRankText: { ...fontSize.b5Variant, color: PRIMARY_COLOR, marginTop: 3 },
  awardCopy: { flex: 1 },
  awardTitle: { ...fontSize.n3 },
  awardAmount: { ...fontSize.b0, color: PRIMARY_COLOR, marginTop: 3 },
  awardDescription: { ...fontSize.b5, marginTop: 3 },
  settlementCard: { marginTop: 4, borderRadius: 20, borderWidth: 1, padding: 14, gap: 13 },
  settlementHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  settlementIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settlementHeaderCopy: { flex: 1, minWidth: 0 },
  settlementTitle: { ...fontSize.b0 },
  settlementDescription: { marginTop: 3, ...fontSize.b5 },
  settlementResult: { borderRadius: 15, borderWidth: 1, padding: 12, gap: 10 },
  settlementResultHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  settlementResultStatus: { ...fontSize.b5Variant },
  settlementMetrics: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  settlementMetric: { flex: 1, minWidth: 0 },
  settlementMetricValue: { ...fontSize.b5Variant },
  settlementMetricLabel: { marginTop: 2, ...fontSize.b6 },
  settlementFailure: { ...fontSize.b6 },
  settlementButton: { minHeight: 50, borderRadius: 25, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  settlementButtonDisabled: { opacity: 0.5 },
  settlementButtonText: { color: '#ffffff', ...fontSize.b5Variant },
  createFooter: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  createButton: { minHeight: 56, borderRadius: 999, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  createButtonText: { ...fontSize.b1, color: '#ffffff' },
});

export default ChallengeLeaderboardDetails;
