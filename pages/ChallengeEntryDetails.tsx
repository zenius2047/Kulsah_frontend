import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
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
import { useChallenge } from '../src/hooks/challenges/useChallenges';
import { challengeRuleResourceToDisplay } from '../src/utils/challenges';
import { PRIMARY_COLOR, useThemeMode } from '../theme';
import { fontSize } from './typography';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=85&w=1200';
const FALLBACK_AVATARS = [
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=15',
  'https://i.pravatar.cc/100?img=33',
];

type ChallengeEntryRouteParams = {
  challengeId?: string | number;
  title?: string;
  description?: string;
  image?: string;
};

type IconName = keyof typeof MaterialIcons.glyphMap;

const fallbackAgreements = [
  {
    title: 'Create an original entry',
    description: 'Record or upload content made specifically for this challenge.',
  },
  {
    title: 'Follow the challenge brief',
    description: 'Meet the format, duration, and content requirements.',
  },
  {
    title: 'Keep it fair',
    description: 'Manipulated engagement or copied content may be disqualified.',
  },
];

const compactCount = (value: number) => {
  if (value < 1_000) return `${value}`;
  const compact = value / 1_000;
  return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1)}K`;
};

const challengeDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 'Open';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return 'Open';
  const days = Math.max(1, Math.ceil((endTime - startTime) / 86_400_000));
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
};

const formatPrizeAmount = (amount?: string | number | null, currency?: string | null) => {
  if (amount == null || amount === '') return '';
  const numericAmount = Number(amount);
  const value = Number.isFinite(numericAmount) ? numericAmount.toLocaleString() : String(amount);
  return `${currency || ''} ${value}`.trim();
};

const MetaItem = ({
  icon,
  value,
  label,
  isDark,
  accentColor,
  accentBackgroundColor,
}: {
  icon: IconName;
  value: string;
  label: string;
  isDark: boolean;
  accentColor: string;
  accentBackgroundColor: string;
}) => (
  <View style={styles.metaItem}>
    <View style={[styles.metaIcon, { backgroundColor: accentBackgroundColor }]}>
      <MaterialIcons name={icon} size={22} color={accentColor} />
    </View>
    <View style={styles.metaCopy}>
      <Text numberOfLines={1} style={[styles.metaValue, { color: isDark ? '#f8fafc' : '#0b1734' }]}>
        {value}
      </Text>
      <Text numberOfLines={1} style={[styles.metaLabel, { color: isDark ? '#94a3b8' : '#66718f' }]}>
        {label}
      </Text>
    </View>
  </View>
);

const FeatureChip = ({
  icon,
  label,
  isDark,
  accentColor,
  accentBackgroundColor,
}: {
  icon: IconName;
  label: string;
  isDark: boolean;
  accentColor: string;
  accentBackgroundColor: string;
}) => (
  <View style={[styles.featureChip, { borderColor: isDark ? '#263244' : '#dce4ef' }]}>
    <View style={[styles.featureIcon, { backgroundColor: accentBackgroundColor }]}>
      <MaterialIcons name={icon} size={21} color={accentColor} />
    </View>
    <Text numberOfLines={2} style={[styles.featureLabel, { color: isDark ? '#e2e8f0' : '#17203a' }]}>
      {label}
    </Text>
  </View>
);

const ChallengeEntryDetails: React.FC = () => {
  const { isDark } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const params = (route.params ?? {}) as ChallengeEntryRouteParams;
  const challengeQuery = useChallenge(params.challengeId);
  const challenge = challengeQuery.data;

  const colors = {
    background: isDark ? '#080b12' : '#f7f9fc',
    card: isDark ? '#111722' : '#ffffff',
    border: isDark ? '#222c3c' : '#e6ebf2',
    text: isDark ? '#f8fafc' : '#0b1734',
    secondary: isDark ? '#94a3b8' : '#555964',
  };
  const secondaryIconBackground = `${colors.secondary}${isDark ? '2e' : '14'}`;

  const heroImage = useMemo(() => {
    const media = challenge?.media?.find((item) => (
      item.cover_url || item.video?.poster_url || item.video?.thumbnail
    ));
    return challenge?.cover_image || media?.cover_url || media?.video?.poster_url || media?.video?.thumbnail || params.image || FALLBACK_HERO;
  }, [challenge?.cover_image, challenge?.media, params.image]);

  const participantAvatars = useMemo(() => {
    const standardAvatars = challenge?.entries?.map((entry) => entry.userAvatar) ?? [];
    const battleAvatars = challenge?.participants?.map((participant) => participant.creator.avatar) ?? [];
    const avatars = [...standardAvatars, ...battleAvatars]
      .filter((avatar): avatar is string => Boolean(avatar))
      .slice(0, 3);
    return avatars?.length ? avatars : FALLBACK_AVATARS;
  }, [challenge?.entries, challenge?.participants]);

  const agreements = useMemo(() => {
    if (!challenge?.rules?.length) return fallbackAgreements;
    return challenge.rules.slice(0, 4).map((rule) => {
      const displayRule = challengeRuleResourceToDisplay(rule);
      return {
        title: displayRule.title,
        description: `${displayRule.description}${displayRule.required ? '' : ' (Optional)'}`,
      };
    });
  }, [challenge?.rules]);

  const prize = challenge?.awards?.[0] || challenge?.prizes?.[0];
  const prizeAmount = formatPrizeAmount(prize?.amount, prize?.currency);
  const title = challenge?.title || params.title || 'Night Vibes Dance Challenge';
  const description = challenge?.description || params.description
    || 'Show us your best moves, follow the challenge brief, and share an original entry for a chance to win.';
  const duration = challengeDuration(
    challenge?.submission?.starts_at || challenge?.schedule?.submission_starts_at,
    challenge?.submission?.ends_at || challenge?.schedule?.submission_ends_at,
  );
  const participantCount = Number(challenge?.participant_count ?? 1_200);
  const eligibilityLabel = challenge?.mode === 'creator_battle'
    ? 'Battle Creators'
    : challenge?.visibility === 'invite_only' ? 'Invite Only' : 'All Creators';
  const canSubmit = challenge
    ? Boolean(challenge.current_user?.can_submit ?? challenge.can_join)
    : true;
  const rewardTitle = prize?.title || challenge?.pricing?.title || challenge?.reward_summary || 'Featured Creator Reward';
  const rewardDescription = prize?.description
    || (prizeAmount ? `${prizeAmount} for qualifying winner${Number(prize?.quantity || 1) === 1 ? '' : 's'}.` : 'Complete the challenge for a chance to earn the featured reward.');

  const handleShare = async () => {
    await Share.share({ message: `${title}\n${description}` });
  };

  const handleJoin = () => {
    navigation.navigate('RecordContent', {
      challengeId: params.challengeId,
      purpose: 'challenge_entry',
      officialSoundId: challenge?.official_sound_id,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-back-ios-new" size={25} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityLabel="Share challenge"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="ios-share" size={27} color={colors.text} />
          </Pressable>
        </View> */}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: heroImage }} resizeMode="cover" style={styles.heroImage} />
            <View style={styles.featuredBadge}>
              <MaterialIcons name="local-fire-department" size={17} color="#ffffff" />
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {challengeQuery.isLoading ? <ActivityIndicator color={PRIMARY_COLOR} style={styles.loadingIndicator} /> : null}
            <Text style={[styles.challengeTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.challengeSubtitle, { color: colors.secondary }]}>{description}</Text>

            <View style={styles.participantRow}>
              <View style={styles.avatarStack}>
                {participantAvatars.map((avatar, index) => (
                  <Image
                    key={`${avatar}-${index}`}
                    source={{ uri: avatar }}
                    style={[styles.avatar, index > 0 && styles.avatarOverlap, { borderColor: colors.card }]}
                  />
                ))}
              </View>
              <Text style={[styles.participantCount, { color: colors.text }]}>
                {compactCount(participantCount)}
                <Text style={{ color: colors.secondary }}> participants</Text>
              </Text>
            </View>

            <View style={[styles.metaPanel, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MetaItem
                icon="event"
                value={duration}
                label="Duration"
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <MetaItem
                icon="emoji-events"
                value={prizeAmount || 'Reward'}
                label={rewardTitle}
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
              <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
              <MetaItem
                icon="groups"
                value={eligibilityLabel}
                label="Welcome"
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About this challenge</Text>
            <Text style={[styles.sectionBody, { color: colors.secondary }]}>{description}</Text>
            {challenge?.instructions ? (
              <Text style={[styles.sectionBody, styles.instructions, { color: colors.secondary }]}>
                {challenge.instructions}
              </Text>
            ) : null}
            <View style={styles.featureRow}>
              <FeatureChip
                icon="movie-creation"
                label="Create your entry"
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
              <FeatureChip
                icon="track-changes"
                label="Follow the brief"
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
              <FeatureChip
                icon="emoji-events"
                label="Earn rewards"
                isDark={isDark}
                accentColor={colors.secondary}
                accentBackgroundColor={secondaryIconBackground}
              />
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What you're agreeing to</Text>
            <View style={styles.agreementList}>
              {agreements.map((agreement, index) => (
                <View key={`${agreement.title}-${index}`} style={styles.agreementRow}>
                  <View style={[styles.checkCircle, { borderColor: colors.secondary, backgroundColor: secondaryIconBackground }]}>
                    <MaterialIcons name="check" size={17} color={colors.secondary} />
                  </View>
                  <View style={styles.agreementCopy}>
                    <Text style={[styles.agreementTitle, { color: colors.text }]}>{agreement.title}</Text>
                    <Text style={[styles.agreementDescription, { color: colors.secondary }]}>{agreement.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.securityRow, { borderTopColor: colors.border }]}>
              <View style={[styles.securityIcon, { backgroundColor: secondaryIconBackground }]}>
                <MaterialIcons name="verified-user" size={27} color={colors.secondary} />
              </View>
              <View style={styles.securityCopy}>
                <Text style={[styles.securityTitle, { color: colors.text }]}>Your entry is reviewed securely</Text>
                <Text style={[styles.securityDescription, { color: colors.secondary }]}>Only challenge activity needed for scoring is recorded.</Text>
              </View>
              <MaterialIcons name="chevron-right" size={27} color={colors.secondary} />
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your reward</Text>
            <View style={[styles.rewardCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.rewardIcon, { backgroundColor: secondaryIconBackground }]}>
                <MaterialIcons name="emoji-events" size={38} color={colors.secondary} />
              </View>
              <View style={styles.rewardCopy}>
                <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardTitle}</Text>
                <Text style={[styles.rewardDescription, { color: colors.secondary }]}>{rewardDescription}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleJoin}
            style={({ pressed }) => [styles.joinButton, !canSubmit && styles.joinButtonDisabled, pressed && styles.joinButtonPressed]}
          >
            <Text style={styles.joinButtonText}>
              {canSubmit ? 'I Agree · Join Challenge' : challenge?.mode === 'creator_battle' ? 'Battle invite required' : 'Submissions closed'}
            </Text>
          </Pressable>
          <View style={styles.leaveRow}>
            <MaterialIcons name="lock-outline" size={16} color={colors.secondary} />
            <Text style={[styles.leaveText, { color: colors.secondary }]}>You can leave the challenge anytime</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    height: 58,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
  scrollContent: { paddingHorizontal: 0, paddingBottom: 28, gap: 10 },
  heroWrap: {
    height: 245,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#d8e1eb',
  },
  heroImage: { width: '100%', height: '100%' },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY_COLOR,
  },
  featuredText: {
    color: '#ffffff',
    ...fontSize.b5Variant,
  },
  summaryCard: {
    marginTop: -45,
    marginHorizontal: 1,
    zIndex: 2,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 15,
  },
  loadingIndicator: { position: 'absolute', top: 18, right: 18 },
  challengeTitle: {
    ...fontSize.b0Variant,
    lineHeight: fontSize.b0Variant.lineHeight + 2,
    paddingRight: 28,
  },
  challengeSubtitle: {
    ...fontSize.b3,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },
  participantRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
  avatarOverlap: { marginLeft: -8 },
  participantCount: {
    ...fontSize.b5,
    marginLeft: 10,
  },
  metaPanel: {
    minHeight: 73,
    borderRadius: 17,
    borderWidth: 1,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metaItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  metaIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metaCopy: { minWidth: 0 },
  metaValue: { ...fontSize.b5Variant },
  metaLabel: { ...fontSize.b6, marginTop: 1 },
  metaDivider: { width: 1, height: 28, marginHorizontal: 5 },
  sectionCard: {
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: { ...fontSize.b1 },
  sectionBody: { ...fontSize.b3, fontFamily: 'Poppins_400Regular', marginTop: 7 },
  instructions: { marginTop: 4 },
  featureRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  featureChip: {
    flex: 1,
    minHeight: 61,
    minWidth: 0,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
  },
  featureIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureLabel: { flex: 1, ...fontSize.b6 },
  agreementList: { gap: 13, marginTop: 13 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  agreementCopy: { flex: 1, paddingTop: 1 },
  agreementTitle: { ...fontSize.b0 },
  agreementDescription: { ...fontSize.b5, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  securityRow: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  securityIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  securityCopy: { flex: 1 },
  securityTitle: { ...fontSize.b0 },
  securityDescription: { ...fontSize.b5, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  rewardCard: {
    minHeight: 86,
    borderRadius: 17,
    borderWidth: 1,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 13,
  },
  rewardIcon: { width: 67, height: 64, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rewardCopy: { flex: 1 },
  rewardTitle: { ...fontSize.b0 },
  rewardDescription: { ...fontSize.b5, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  joinButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: { opacity: 0.5 },
  joinButtonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  joinButtonText: { color: '#ffffff', ...fontSize.b0 },
  leaveRow: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  leaveText: { ...fontSize.b6 },
});

export default ChallengeEntryDetails;
