import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { fontSize } from '../typography';
import { useChallenge } from '../src/hooks/challenges/useChallenges';
import type {
  ChallengeListResource,
  CreatorBattleParticipantResource,
} from '../src/types/challenge.types';
import {
  challengeDeadlineLabel,
  challengeListResourceToCard,
} from '../src/utils/challenges';

const CARD_GAP = 12;
const MAX_CAROUSEL_BATTLES = 8;
const DEFAULT_VOTE_COST = 10;

type CreatorBattleCarouselProps = {
  battles: ChallengeListResource[];
  height: number;
  topInset: number;
  isLoading?: boolean;
  onOpenBattle: (challengeId: string) => void;
  onSeeAll: () => void;
};

type CompetitorPreview = {
  id: string;
  name: string;
  avatar?: string;
  percentage?: number;
  isWinner?: boolean;
};

const participantToPreview = (
  participant: CreatorBattleParticipantResource,
): CompetitorPreview => ({
  id: participant.id,
  name: participant.creator?.name || participant.creator?.username || 'Creator',
  avatar: participant.creator?.avatar || participant.entry?.video?.thumbnail_url || undefined,
  percentage: participant.votes?.percentage,
  isWinner: participant.is_winner,
});

const Competitor: React.FC<{
  competitor: CompetitorPreview;
  align: 'left' | 'right';
}> = ({ competitor, align }) => (
  <View style={[styles.competitor, align === 'right' && styles.competitorRight]}>
    <View style={styles.avatarWrap}>
      {competitor.avatar ? (
        <Image source={{ uri: competitor.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <MaterialIcons name="person" size={24} color="#cbd5e1" />
        </View>
      )}
      {competitor.isWinner ? (
        <View style={styles.winnerBadge}>
          <MaterialIcons name="emoji-events" size={11} color="#111827" />
        </View>
      ) : null}
    </View>
    <View style={[styles.competitorCopy, align === 'right' && styles.competitorCopyRight]}>
      <Text numberOfLines={1} style={styles.competitorName}>{competitor.name}</Text>
      <Text style={styles.competitorScore}>
        {competitor.percentage == null ? 'Ready to battle' : `${Math.round(competitor.percentage)}% of votes`}
      </Text>
    </View>
  </View>
);

const CreatorBattleCard: React.FC<{
  challenge: ChallengeListResource;
  width: number;
  height: number;
  onPress: () => void;
}> = ({ challenge, width, height, onPress }) => {
  const detailQuery = useChallenge(challenge.id);
  const detail = detailQuery.data;
  const compact = useMemo(() => challengeListResourceToCard(challenge), [challenge]);

  const participants = useMemo(() => {
    const previews = (detail?.participants || [])
      .slice()
      .sort((left, right) => left.position - right.position)
      .slice(0, 2)
      .map(participantToPreview);

    if (previews.length === 0) {
      previews.push({
        id: `host-${compact.creatorId}`,
        name: compact.creatorName,
        avatar: compact.avatar,
      });
    }
    if (previews.length === 1) {
      previews.push({ id: `challenger-${challenge.id}`, name: 'Challenger' });
    }
    return previews;
  }, [challenge.id, compact.avatar, compact.creatorId, compact.creatorName, detail?.participants]);

  const cover = detail?.cover_image
    || detail?.participants?.find((participant) => participant.entry?.video?.thumbnail_url)?.entry?.video?.thumbnail_url
    || compact.image;
  const votingIsOpen = detail?.voting?.status === 'open';
  const hasVoted = Boolean(detail?.current_user?.has_voted || detail?.voting?.current_user_has_voted);
  const voteCost = detail?.pricing?.voting?.vote_cost_per_choice ?? DEFAULT_VOTE_COST;
  const totalVotes = detail?.voting?.total_votes;
  const deadline = challengeDeadlineLabel(
    detail?.voting?.ends_at
      || detail?.submission?.ends_at
      || detail?.schedule?.voting_ends_at
      || detail?.schedule?.submission_ends_at
      || challenge.deadline,
  );
  const status = detail?.result
    ? 'Winner announced'
    : votingIsOpen
      ? 'Voting live'
      : detail?.submission?.is_open
        ? 'Submissions open'
        : detail?.status === 'awaiting_participants'
          ? 'Awaiting creators'
          : 'Battle live';
  const action = hasVoted
    ? 'View your vote'
    : votingIsOpen
      ? 'Watch & vote'
      : detail?.result
        ? 'See the winner'
        : 'Watch battle';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open creator battle ${compact.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height, opacity: pressed ? 0.94 : 1 },
      ]}
    >
      <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(4,7,18,0.12)', 'rgba(4,7,18,0.44)', 'rgba(4,7,18,0.98)']}
        locations={[0, 0.38, 0.72]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cardTopRow}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>{status.toUpperCase()}</Text>
        </View>
        <View style={styles.deadlinePill}>
          <MaterialIcons name="schedule" size={14} color="#fff" />
          <Text style={styles.deadlineText}>{deadline}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.category}>{compact.category.toUpperCase()} · CREATOR BATTLE</Text>
        <Text numberOfLines={2} style={styles.title}>{compact.title}</Text>
        {compact.description ? (
          <Text numberOfLines={2} style={styles.description}>{compact.description}</Text>
        ) : null}

        <View style={styles.versusRow}>
          <Competitor competitor={participants[0]} align="left" />
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <Competitor competitor={participants[1]} align="right" />
        </View>

        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <MaterialIcons name="groups" size={17} color="#dbeafe" />
              <Text style={styles.metricText}>
                {detail?.participant_count ?? compact.participants}/{detail?.participant_limit ?? compact.participantLimit ?? 2}
              </Text>
            </View>
            <View style={styles.metric}>
              <Image source={require('../assets/coin.png')} style={styles.coin} />
              <Text style={styles.metricText}>{voteCost} KC</Text>
            </View>
            {totalVotes != null ? (
              <View style={styles.metric}>
                <MaterialIcons name="how-to-vote" size={16} color="#dbeafe" />
                <Text style={styles.metricText}>{totalVotes}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>{action}</Text>
            <MaterialIcons name="arrow-forward" size={17} color="#06111a" />
          </View>
        </View>
      </View>

    </Pressable>
  );
};

const CreatorBattleCarousel: React.FC<CreatorBattleCarouselProps> = ({
  battles,
  height,
  topInset,
  isLoading = false,
  onOpenBattle,
  onSeeAll,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleBattles = useMemo(
    () => battles.slice(0, MAX_CAROUSEL_BATTLES),
    [battles],
  );
  const cardWidth = Math.max(292, screenWidth - 34);
  const cardHeight = Math.min(535, Math.max(365, height - topInset - 205));

  const updateActiveIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + CARD_GAP));
    setActiveIndex(Math.max(0, Math.min(nextIndex, visibleBattles.length - 1)));
  };

  return (
    <View style={[styles.page, { height, paddingTop: topInset + 72 }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <View style={styles.eyebrowRow}>
            <MaterialIcons name="bolt" size={17} color={PRIMARY_COLOR} />
            <Text style={styles.eyebrow}>CREATOR BATTLES</Text>
          </View>
          <Text style={styles.heading}>Pick a side</Text>
          <Text style={styles.subheading}>Watch the entries and back your favorite creator.</Text>
        </View>
        {visibleBattles.length > 0 ? (
          <Pressable onPress={onSeeAll} hitSlop={10} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all</Text>
            <MaterialIcons name="chevron-right" size={18} color={PRIMARY_COLOR} />
          </Pressable>
        ) : null}
      </View>

      {isLoading && visibleBattles.length === 0 ? (
        <View style={[styles.loadingCard, { width: cardWidth, height: cardHeight }]}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Finding live creator battles...</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={visibleBattles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CreatorBattleCard
              challenge={item}
              width={cardWidth}
              height={cardHeight}
              onPress={() => onOpenBattle(String(item.id))}
            />
          )}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          nestedScrollEnabled
          onMomentumScrollEnd={updateActiveIndex}
        />
      )}

      {visibleBattles.length > 1 ? (
        <View style={styles.pagination}>
          {visibleBattles.map((battle, index) => (
            <View
              key={String(battle.id)}
              style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.swipeHint}>
        <MaterialIcons name="keyboard-arrow-up" size={18} color="#64748b" />
        <Text style={styles.swipeHintText}>Swipe up for more</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { backgroundColor: '#030712', paddingBottom: 18 },
  headingRow: { paddingHorizontal: 17, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headingCopy: { flex: 1, paddingRight: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eyebrow: { ...fontSize.b5Variant, color: PRIMARY_COLOR, letterSpacing: 1.5 },
  heading: { ...fontSize.n3, color: '#fff', marginTop: 2 },
  subheading: { ...fontSize.b4, color: '#94a3b8', marginTop: 3 },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  seeAllText: { ...fontSize.b4, color: PRIMARY_COLOR, fontFamily: 'Inter_600SemiBold' },
  carouselContent: { paddingHorizontal: 17 },
  card: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  livePill: { minHeight: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(3,7,18,0.72)', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#f43f5e' },
  livePillText: { ...fontSize.b6, color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: 0.6 },
  deadlinePill: { minHeight: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(3,7,18,0.72)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  deadlineText: { ...fontSize.b5Variant, color: '#fff' },
  cardContent: { marginTop: 'auto', padding: 17 },
  category: { ...fontSize.b6, color: '#7dd3fc', fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  title: { ...fontSize.n3, color: '#fff', marginTop: 5, lineHeight: 25 },
  description: { ...fontSize.b4, color: '#cbd5e1', marginTop: 5, lineHeight: 16 },
  versusRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  competitor: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  competitorRight: { flexDirection: 'row-reverse' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#fff' },
  avatarFallback: { backgroundColor: '#263244', alignItems: 'center', justifyContent: 'center' },
  winnerBadge: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' },
  competitorCopy: { flex: 1, minWidth: 0, marginLeft: 8 },
  competitorCopyRight: { marginLeft: 0, marginRight: 8, alignItems: 'flex-end' },
  competitorName: { ...fontSize.b4, color: '#fff', fontFamily: 'Inter_700Bold', maxWidth: '100%' },
  competitorScore: { ...fontSize.b6, color: '#94a3b8', marginTop: 2 },
  vsBadge: { width: 34, height: 34, marginHorizontal: 7, borderRadius: 17, backgroundColor: primaryColorAlpha(0.95), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  vsText: { ...fontSize.b5Variant, color: '#fff', fontFamily: 'Inter_700Bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 16, marginBottom: 13 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metrics: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { ...fontSize.b5Variant, color: '#dbeafe' },
  coin: { width: 16, height: 16 },
  actionButton: { minHeight: 37, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { ...fontSize.b5Variant, color: '#06111a', fontFamily: 'Inter_700Bold' },
  loadingCard: { alignSelf: 'center', borderRadius: 24, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...fontSize.b4, color: '#94a3b8', marginTop: 12 },
  pagination: { minHeight: 20, marginTop: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#334155' },
  paginationDotActive: { width: 19, backgroundColor: PRIMARY_COLOR },
  swipeHint: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  swipeHintText: { ...fontSize.b6, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
});

export default CreatorBattleCarousel;
