import React, { useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { mediumScreen } from '../types';
import TrophyIcon from '../assets/icons/trophy-svg.svg';
import SubmissionIcon from '../assets/icons/upload-svg.svg';
import DraftIcon from '../assets/icons/draft-svg.svg';
import InviteIcon from '../assets/icons/invite-svg.svg';
import { fontSize } from '../typography';
import { useChallenges } from '../src/hooks/challenges/useChallenges';
import { challengeListResourceToCard, type ChallengeCardItem } from '../src/utils/challenges';

type Tab = 'challenges' | 'submissions' | 'drafts' | 'invites';

type Challenge = ChallengeCardItem;

const CHALLENGE_DRAFTS_KEY = 'pulsar_challenge_drafts';

type Submission = {
  id: string;
  challengeTitle: string;
  userId: string;
  userName: string;
  userAvatar: string;
  thumbnailUrl: string;
  submittedAt: string;
  likes: number;
  votes: number;
};

type Invite = {
  id: string;
  inviterName: string;
  inviterAvatar: string;
  title: string;
  description: string;
  reward: string;
  status: 'pending' | 'accepted';
  image: string;
  role?: string;
  longMessage?: string;
  split?: string;
  timeline?: string;
  synergyScore?: number;
  requirements?: string[];
};

const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    creatorId: 'mila_ray_01',
    creatorName: 'Mila Ray',
    category: 'Dance',
    title: 'Night Vibes Dance Challenge',
    description: 'Show us your best moves under the neon lights and tag #NightVibes for a chance to be featured.',
    reward: '$500 + Feature',
    deadline: '7 Days',
    participants: 1200,
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c2',
    creatorId: 'elena_rose',
    creatorName: 'Elena Rose',
    category: 'Vocals',
    title: 'Nebula Vocal Flip',
    description: 'Reimagine the Nebula chorus with your own vocal texture and a bold harmony stack.',
    reward: '$1K + Studio Day',
    deadline: '12 Days',
    participants: 856,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
  {
    id: 'c3',
    creatorId: 'alex_rivera_42',
    creatorName: 'Alex Rivera',
    category: 'Film',
    title: 'Golden Hour Loop',
    description: 'Create a seamless 15-second cinematic loop captured entirely during golden hour.',
    reward: '5K KulCoins',
    deadline: '4 Days',
    participants: 642,
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c4',
    creatorId: 'zoe_k',
    creatorName: 'Zoe K',
    category: 'Music',
    title: 'Neon Pulse Remix',
    description: 'Turn the official stems into a late-night club remix with an unforgettable final drop.',
    reward: 'Official Release',
    deadline: '9 Days',
    participants: 384,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
];

const SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    challengeTitle: 'Remix My New Single',
    userId: 'fan_1',
    userName: 'MusicLover99',
    userAvatar: 'https://picsum.photos/seed/fan1/200',
    thumbnailUrl: 'https://picsum.photos/seed/sub1/400/600',
    submittedAt: '2 hours ago',
    likes: 124,
    votes: 45,
  },
  {
    id: 's2',
    challengeTitle: 'Remix My New Single',
    userId: 'fan_2',
    userName: 'Champion Fan',
    userAvatar: 'https://picsum.photos/seed/fan2/200',
    thumbnailUrl: 'https://picsum.photos/seed/sub2/400/600',
    submittedAt: '5 hours ago',
    likes: 89,
    votes: 32,
  },
];

const DRAFTS: Challenge[] = [
  {
    id: 'd1',
    creatorId: 'mila_ray_01',
    creatorName: 'Mila Ray',
    category: 'Music',
    title: 'Acoustic Soul Session',
    description: 'Record your best acoustic cover of my latest track.',
    reward: '$200 + Signed Vinyl',
    deadline: '14 Days',
    participants: 0,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'd2',
    creatorId: 'mila_ray_01',
    creatorName: 'Mila Ray',
    category: 'Dance',
    title: 'Dance Choreography',
    description: 'Create a 15 second dance routine for the chorus.',
    reward: 'Feature in Music Video',
    deadline: '7 Days',
    participants: 0,
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
  },
];

const INVITES: Invite[] = [
  {
    id: 'i1',
    inviterName: 'Zoe K',
    inviterAvatar: 'https://picsum.photos/seed/zoe/100',
    title: 'Neon Pulse Remix',
    description: 'Collaborate on a high-energy synthwave remix with your unique vocal texture.',
    reward: '50/50 Royalty Split + Feature',
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    role: 'Featured Vocal Collaborator',
    longMessage: 'I want to build a high-voltage remix around your vocal tone. The concept is a neon club version of the hook with your bridge becoming the emotional lift before the final drop.',
    split: '50% / 50%',
    timeline: '10 Day Sprint',
    synergyScore: 92,
    requirements: ['Record a 16-bar vocal bridge', 'Approve final synth arrangement', 'Co-promote the launch teaser'],
  },
  {
    id: 'i2',
    inviterName: 'Marcus V',
    inviterAvatar: 'https://picsum.photos/seed/marcus/100',
    title: 'Midnight Session',
    description: 'Join my midnight live session challenge as a guest judge and performer.',
    reward: 'Cross-Promotion to 50k Fans',
    status: 'accepted',
    image: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    role: 'Guest Judge & Performer',
    split: 'Promo Exchange',
    timeline: 'Live Friday',
    synergyScore: 84,
    requirements: ['Join pre-show soundcheck', 'Select top 3 entries', 'Perform one live chorus'],
  },
];

export const CREATOR_CHALLENGE_UPDATE_COUNT =
  CHALLENGES.length + SUBMISSIONS.length + DRAFTS.length + INVITES.length;

const CreatorChallenges: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<Tab>('challenges');
  const [drafts, setDrafts] = useState<Challenge[]>(DRAFTS);
  const [invites, setInvites] = useState<Invite[]>(INVITES);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [showCounterBox, setShowCounterBox] = useState(false);
  const [collabSplitVal, setCollabSplitVal] = useState(50);
  const [toast, setToast] = useState<string | null>(null);
  const challengesQuery = useChallenges();
  const challenges = useMemo(() => {
    const pages = challengesQuery.data?.pages;
    if (!Array.isArray(pages)) return [];

    return pages.flatMap((page) => {
      const records = Array.isArray(page?.data) ? page.data : [];
      return records
        .filter((challenge) => challenge && typeof challenge === 'object')
        .map((challenge) => challengeListResourceToCard(challenge));
    });
  }, [challengesQuery.data]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void AsyncStorage.getItem(CHALLENGE_DRAFTS_KEY)
      .then((stored: string | null) => {
        if (!active || !stored) return;
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setDrafts(parsed as Challenge[]);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []));

  const shell = isDark ? '#050207' : theme.background;
  const card = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const surface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#ffffff' : theme.text;

  const challengeGridGap = 12;
  const challengeCardWidth = Math.floor((screenWidth - 48 - challengeGridGap) / 2);
  const challengeMediaHeight = Math.min(190, Math.max(126, challengeCardWidth * 0.88));

  const pendingInviteCount = invites.filter((invite) => invite.status === 'pending').length;

  const go = (screen: string, params?: Record<string, unknown>) => {
    try {
      navigation.navigate(screen, params);
    } catch {}
  };

  const triggerToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const openInviteDetails = (invite: Invite) => {
    setSelectedInvite(invite);
    setShowCounterBox(false);
    setCollabSplitVal(50);
  };

  const handleAcceptInvite = (id: string) => {
    setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, status: 'accepted' } : invite));
    setSelectedInvite((current) => current?.id === id ? { ...current, status: 'accepted' } : current);
    setShowCounterBox(false);
    triggerToast('Partnership contract accepted.');
  };

  const handleDeclineInvite = (id: string) => {
    setInvites((current) => current.filter((invite) => invite.id !== id));
    setSelectedInvite(null);
    setShowCounterBox(false);
    triggerToast('Partnership proposal declined.');
  };

  const handleCounterSplitSubmit = (id: string) => {
    setShowCounterBox(false);
    setSelectedInvite(null);
    triggerToast(`Counter split sent for invite ${id}: ${collabSplitVal}% / ${100 - collabSplitVal}%.`);
  };

  const renderTab = (id: Tab, label: string, dot?: boolean) => {
    const active = activeTab === id;
    return (
      <Pressable
        key={id}
        onPress={() => setActiveTab(id)}
        style={[styles.tabButton, ]}
      >
        {id === 'challenges' && <TrophyIcon fill={isDark? activeTab === id ? PRIMARY_COLOR:'white': activeTab === id ? PRIMARY_COLOR :'black'} height={24} width={24}/>}
        {id === 'submissions' && <SubmissionIcon fill={isDark? activeTab === id ? PRIMARY_COLOR:'white':activeTab === id ? PRIMARY_COLOR: 'black'} height={24} width={24}/>}
        {id === 'drafts' && <DraftIcon fill={isDark? activeTab === id ? PRIMARY_COLOR:'white': activeTab === id ? PRIMARY_COLOR:'black'} height={24} width={24}/>}
        {id === 'invites' && <InviteIcon fill={isDark? activeTab === id ? PRIMARY_COLOR:'white': activeTab === id ? PRIMARY_COLOR: 'black'} height={24} width={24}/>}
        <Text style={[styles.tabText, { color: active ? theme.accent : subtle, ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, marginTop: 5 }]}>{label}</Text>
        {dot ? <View style={styles.dot} /> : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: shell }]} edges={['left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        {/* <View style={[styles.header, { backgroundColor: isDark ? 'rgba(31,16,34,0.75)' : theme.card, borderBottomColor: border }]}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: surface, borderColor: border }]}>
            <MaterialIcons name="chevron-left" size={20} color={titleTone} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: titleTone }]}>Challenge Orbit</Text>
          <Pressable onPress={() => go('CreateChallenge')} style={[styles.headerBtn, styles.headerBtnPrimary]}>
            <MaterialIcons name="add" size={22} color="#fff" />
          </Pressable>
        </View> */}

        <Pressable
        onPress={()=>{
          navigation.navigate('CreateChallenge')
        }}
         style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          height: 60,
          width: 60,
          backgroundColor: PRIMARY_COLOR,
          zIndex: 1,
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <MaterialIcons name="add" size={34} color={theme.background}/>
        </Pressable>


        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* <LinearGradient
            colors={isDark ? [primaryColorAlpha(0.18), 'rgba(124,58,237,0.08)'] : [primaryColorAlpha(0.08), 'rgba(124,58,237,0.04)']}
            style={[styles.hero, { borderColor: primaryColorAlpha(0.22) }]}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="emoji-events" size={34} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: titleTone, ...fontSize.b0,  }]}>Viral Factory</Text>
                <Text style={[styles.heroMeta, { color: subtle, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>Drive Engagement Through Action</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }]}>
                <Text style={[styles.metricValue, { color: theme.accent, ...fontSize.n1, lineHeight: fontSize.n1.lineHeight }]}>{metrics.total}</Text>
                <Text style={[styles.metricLabel, { color: muted, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight }]}>Total Submissions</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }]}>
                <Text style={[styles.metricValue, { color: '#10b981', ...fontSize.n1, lineHeight: fontSize.n1.lineHeight }]}>{metrics.conversion}</Text>
                <Text style={[styles.metricLabel, { color: muted, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight }]}>Conversion Rate</Text>
              </View>
            </View>
          </LinearGradient> */}

          <View style={[styles.tabBar, {
            // backgroundColor: 'red'
            // backgroundColor: surface, borderColor: border
             }]}>
            {renderTab('challenges', 'Challenges')}
            {renderTab('submissions', 'Submissions')}
            {renderTab('drafts', 'Drafts')}
            {renderTab('invites', 'Invites', pendingInviteCount > 0)}
          </View>

          {activeTab === 'challenges' ? (
            <View style={styles.section}>
              <View style={styles.challengeSectionHeader}>
                <View>
                  <Text style={[styles.challengeEyebrow, { color: muted }]}>CURATED FOR YOU</Text>
                  <Text style={[styles.challengeSectionTitle, { color: titleTone }]}>Live challenges</Text>
                </View>
                <View style={[styles.liveCountPill, { backgroundColor: primaryColorAlpha(isDark ? 0.15 : 0.09) }]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveCountText}>{challenges.length} OPEN</Text>
                </View>
              </View>

              {challengesQuery.isLoading ? (
                <View style={[styles.challengeQueryState, { backgroundColor: card, borderColor: border }]}>
                  <ActivityIndicator color={PRIMARY_COLOR} />
                  <Text style={[styles.challengeQueryText, { color: subtle }]}>Loading challenges...</Text>
                </View>
              ) : challengesQuery.isError ? (
                <View style={[styles.challengeQueryState, { backgroundColor: card, borderColor: border }]}>
                  <MaterialIcons name="cloud-off" size={28} color={muted} />
                  <Text style={[styles.challengeQueryText, { color: subtle }]}>Challenges could not be loaded.</Text>
                  <Pressable onPress={() => void challengesQuery.refetch()} style={styles.challengeRetryButton}>
                    <Text style={styles.challengeRetryText}>Try Again</Text>
                  </Pressable>
                </View>
              ) : challenges.length === 0 ? (
                <View style={[styles.challengeQueryState, { backgroundColor: card, borderColor: border }]}>
                  <MaterialIcons name="emoji-events" size={30} color={muted} />
                  <Text style={[styles.challengeQueryText, { color: subtle }]}>No live challenges right now.</Text>
                </View>
              ) : (
                <View style={styles.challengeGrid}>
                {challenges.map((challenge) => (
                  <Pressable
                    key={challenge.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${challenge.title} by ${challenge.creatorName}`}
                    accessibilityHint="Opens challenge details"
                    onPress={() => go('ChallengeFeed', { challengeId: challenge.id })}
                    style={({ pressed }) => [
                      styles.challengeGridCard,
                      {
                        width: '49.5%',
                        backgroundColor: card,
                        borderColor: border,
                      },
                      pressed && styles.challengeGridCardPressed,
                    ]}
                  >
                    <View style={[styles.challengeMedia, { height: challengeMediaHeight }]}>
                      <Image source={{ uri: challenge.image }} style={styles.fillImage} />
                      <LinearGradient
                        colors={['rgba(2,6,23,0.02)', 'rgba(2,6,23,0.18)', 'rgba(2,6,23,0.82)']}
                        locations={[0, 0.52, 1]}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={styles.challengeBadgeRow}>
                        <View style={[styles.challengeBadge, (challenge.isNew || challenge.isCreatorBattle) && styles.challengeBadgeNew]}>
                          <MaterialIcons
                            name={challenge.isCreatorBattle ? 'sports-kabaddi' : challenge.isNew ? 'auto-awesome' : 'bolt'}
                            size={12}
                            color={challenge.isNew || challenge.isCreatorBattle ? '#c4b5fd' : PRIMARY_COLOR}
                          />
                          <Text style={[styles.challengeBadgeText, (challenge.isNew || challenge.isCreatorBattle) && styles.challengeBadgeTextNew]}>
                            {challenge.isCreatorBattle ? 'BATTLE' : challenge.isNew ? 'NEW' : 'TRENDING'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.creatorOverlay}>
                        {challenge.avatar ? (
                          <Image source={{ uri: challenge.avatar }} style={styles.creatorAvatar} />
                        ) : (
                          <View style={styles.creatorMark}>
                            <Text style={styles.creatorMarkText}>{challenge.creatorName.charAt(0)}</Text>
                          </View>
                        )}
                        <View style={styles.creatorOverlayCopy}>
                          <Text numberOfLines={1} style={styles.creatorOverlayName}>{challenge.creatorName}</Text>
                          <Text numberOfLines={1} style={styles.creatorOverlayHandle}>@{challenge.creatorId}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.challengeCardBody}>
                      <View style={styles.challengeCategoryRow}>
                        <Text style={styles.challengeCategory}>{challenge.category}</Text>
                        <View style={styles.challengeDeadline}>
                          <MaterialIcons name="schedule" size={11} color={muted} />
                          <Text style={[styles.challengeDeadlineText, { color: muted }]}>{challenge.deadline}</Text>
                        </View>
                      </View>

                      <Text numberOfLines={1} style={[styles.challengeCardTitle, { color: titleTone }]}>{challenge.title}</Text>
                      <Text numberOfLines={2} style={[styles.challengeCardDescription, { color: subtle }]}>{challenge.description}</Text>

                      <View style={[styles.challengeDetailDivider, { backgroundColor: border }]} />

                      <View style={styles.challengeDetailRow}>
                        <View style={styles.challengeParticipants}>
                          <MaterialIcons name="group" size={14} color={muted} />
                          <Text style={[styles.challengeParticipantsText, { color: subtle }]}>
                            {challenge.participants.toLocaleString()}{challenge.participantLimit ? `/${challenge.participantLimit}` : ''}
                          </Text>
                        </View>
                        <Text numberOfLines={1} style={styles.challengeReward}>{challenge.reward}</Text>
                      </View>


                    </View>
                  </Pressable>
                ))}
                </View>
              )}
            </View>
          ) : null}

          {activeTab === 'submissions' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight  }]}>Recent Submissions</Text>
                <Text style={[styles.sectionAccent, {fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight }]}>{SUBMISSIONS.length} New</Text>
              </View>
              {SUBMISSIONS.map((submission) => (
                <View key={submission.id} style={[styles.listCard, { backgroundColor: card, borderColor: border }]}>
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: submission.thumbnailUrl }} style={styles.fillImage} />
                    <View style={styles.thumbOverlay}>
                      <View style={styles.playButton}>
                        <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
                      </View>
                    </View>
                  </View>
                  <View style={styles.listBody}>
                    <View style={styles.authorRow}>
                      <Image source={{ uri: submission.userAvatar }} style={styles.authorAvatar} />
                      <Text style={[styles.authorName, { color: titleTone, fontSize: fontSize.b5.fontSize, lineHeight: fontSize.b5.lineHeight, fontFamily: 'Inter_600SemiBold'}]} numberOfLines={1}>{submission.userName}</Text>
                    </View>
                    <Text style={[styles.listTitle, { color: titleTone, fontSize: fontSize.b5.fontSize, fontFamily: 'Inter_500Medium'}]} numberOfLines={2}>{submission.challengeTitle}</Text>
                    <Text style={[styles.listMeta, { color: muted, fontSize: fontSize.b5.fontSize }]}>{submission.submittedAt}</Text>
                    <View style={styles.inlineStats}>
                      <View style={styles.inlineStat}>
                        <MaterialIcons name="favorite" size={14} color={theme.accent} />
                        <Text style={[styles.inlineStatText, { color: titleTone, ...fontSize.n5, lineHeight: fontSize.n5.lineHeight }]}>{submission.likes}</Text>
                      </View>
                      <View style={styles.inlineStat}>
                        <MaterialIcons name="how-to-vote" size={14} color="#10b981" />
                        <Text style={[styles.inlineStatText, { color: titleTone, ...fontSize.n5, lineHeight: fontSize.n5.lineHeight }]}>{submission.votes}</Text>
                      </View>
                    </View>
                  </View>
                  {/* <View style={styles.sideActions}>
                    <Pressable onPress={() => go('FanProfile', { userId: submission.userId })} style={[styles.sideBtn, { backgroundColor: surface, borderColor: border }]}>
                      <MaterialIcons name="person" size={20} color={titleTone} />
                    </Pressable>
                    <Pressable onPress={() => go('ChallengeFeed')} style={[styles.sideBtn, { backgroundColor: isDark ? primaryColorAlpha(0.12) : theme.accentSoft, borderColor: 'transparent' }]}>
                      <MaterialIcons name="visibility" size={20} color={theme.accent} />
                    </Pressable>
                  </View> */}
                </View>
              ))}
              <Pressable onPress={() => go('Submissions')} style={[styles.dashedBtn, { borderColor: primaryColorAlpha(0.3) }]}>
                <Text style={[styles.dashedBtnText, {...fontSize.b4, lineHeight: fontSize.b4.lineHeight}]}>View All Submissions</Text>
              </Pressable>
            </View>
          ) : null}

          {activeTab === 'drafts' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight  }]}>Saved Drafts</Text>
                <Text style={[styles.sectionAccent, {fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight }]}>{drafts.length} Drafts</Text>
              </View>
              {drafts.map((draft) => (
                <View key={draft.id} style={[styles.listCard, { backgroundColor: card, borderColor: border, }]}>
                  <Image source={{ uri: draft.image }} style={styles.draftImage} />
                  <View style={styles.listBody}>
                    <Text style={[styles.listTitle, { color: titleTone, fontSize: fontSize.b4.fontSize, fontFamily: fontSize.b4.fontFamily, lineHeight: fontSize.b4.lineHeight, marginTop: mediumScreen ? 8: 4}]} numberOfLines={1}>{draft.title}</Text>
                    <Text style={[styles.listMeta, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight}]} numberOfLines={1}>{draft.description}</Text>
                    <View style={[styles.draftMeta, {marginTop: mediumScreen ? 8: 4, gap: mediumScreen ? 8 : 4}]}>
                      <Text numberOfLines={1} style={[styles.rewardMini, {...fontSize.b5, lineHeight: fontSize.b5.lineHeight}]}>{draft.reward}</Text>
                      <Text style={[styles.smallText, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }]}>Last edited 2d ago</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => go('CreateChallenge', { draft })} style={[styles.resumeBtn, { backgroundColor: surface, borderColor: border }]}>
                    <Text style={[styles.resumeBtnText, { color: titleTone, ...fontSize.b5 }]}>Resume</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => go('ChallengeDrafts')} style={[styles.dashedBtn, { borderColor: primaryColorAlpha(0.3) }]}>
                <Text style={[styles.dashedBtnText, {...fontSize.b4, lineHeight: fontSize.b4.lineHeight}]}>View All Drafts</Text>
              </Pressable>
            </View>
          ) : null}

          {activeTab === 'invites' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight }]}>Creator Invites</Text>
                <Text style={[styles.sectionAccent, { fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.lineHeight }]}>{pendingInviteCount} Pending</Text>
              </View>
              {invites.map((invite) => (
                <Pressable onPress={() => openInviteDetails(invite)} key={invite.id} style={[styles.inviteCard, { borderColor: border }]}>
                  <Image source={{ uri: invite.image }} style={styles.fillImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.inviteTop}>
                    <View style={styles.inviterPill}>
                      <Image source={{ uri: invite.inviterAvatar }} style={styles.inviterAvatar} />
                      <View>
                        <Text style={[styles.inviteTag, { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }]}>Invited by</Text>
                        <Text style={[styles.inviterName, { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }]}>{invite.inviterName}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, invite.status === 'pending' ? styles.pending : styles.accepted]}>
                      <Text style={[styles.statusText, { ...fontSize.b5, lineHeight: fontSize.b5.fontSize }]}>{invite.status}</Text>
                    </View>
                  </View>
                  <View style={styles.featureBottom}>
                    <Text style={[styles.featureTitle, { fontSize: fontSize.b1.fontSize + (mediumScreen ? 4 : 0), fontFamily: 'Pogonia_700Bold', marginTop: 10 }]}>{invite.title}</Text>
                    <Text style={[styles.featureDesc, { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, fontStyle: 'italic' }]} numberOfLines={2}>{invite.description}</Text>
                    <View style={styles.inviteFooter}>
                      <View style={{
                      }}>
                        <Text style={[styles.featureLabel, { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }]}>Potential Reward</Text>
                        <Text style={[styles.reward, { fontSize: fontSize.b5.fontSize, fontFamily: "Poppins_700Bold" }]}>{invite.reward}</Text>
                      </View>
                      <View style={styles.inviteActions}>
                        {invite.status === 'pending' ? (
                          <>
                            <Pressable onPress={() => openInviteDetails(invite)} style={styles.acceptBtn}><Text style={[styles.acceptBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>Review</Text></Pressable>
                            <Pressable onPress={() => handleDeclineInvite(invite.id)} style={styles.declineBtn}><Text style={[styles.declineBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>Decline</Text></Pressable>
                          </>
                        ) : (
                          <Pressable style={styles.collabBtn}>
                            <MaterialIcons name="chat" size={14} color="#fff" />
                            <Text style={[styles.acceptBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>Collaborate</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
              <View style={[styles.tipCard, { backgroundColor: isDark ? primaryColorAlpha(0.08) : theme.accentSoft, borderColor: primaryColorAlpha(0.24) }]}>
                <Text style={[styles.tipTitle, { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>Collaboration Tip</Text>
                <Text style={[styles.tipBody, { color: subtle, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }]}>Collaborating on creator challenges can increase your reach by up to 40%. Use invites when creating a challenge to partner up.</Text>
              </View>
            </View>
          ) : null}
        <View style={{
          height: 120
        }}/>
        </ScrollView>



        {toast ? (
          <View style={styles.toast}>
            <MaterialIcons name="cloud-done" size={15} color="#ffffff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <Modal visible={!!selectedInvite} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedInvite(null)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedInvite(null)} />
            {selectedInvite ? (
              <View style={[styles.collabModal, { backgroundColor: isDark ? '#09090c' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                <LinearGradient colors={[primaryColorAlpha(0.16), 'rgba(9,9,12,0)']} style={styles.modalGlow} />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalChip}>Incoming Partnership Proposal</Text>
                    <Pressable onPress={() => setSelectedInvite(null)} style={[styles.modalClose, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                      <MaterialIcons name="close" size={20} color={isDark ? 'rgba(255,255,255,0.78)' : titleTone} />
                    </Pressable>
                  </View>

                  <View style={styles.coverCard}>
                    <Image source={{ uri: selectedInvite.image }} style={styles.fillImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.94)']} style={StyleSheet.absoluteFillObject} />
                    <View style={styles.coverCopy}>
                      <Text style={styles.modalTitle}>{selectedInvite.title}</Text>
                      <Text style={styles.modalRole}>{selectedInvite.role || 'Guest Collaborator'}</Text>
                    </View>
                    {selectedInvite.synergyScore ? (
                      <View style={styles.scoreCard}>
                        <View style={styles.scoreRing}>
                          <Svg width={48} height={48}>
                            <Circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.08)" strokeWidth={4} fill="none" />
                            <Circle
                              cx={24}
                              cy={24}
                              r={20}
                              stroke={PRIMARY_COLOR}
                              strokeWidth={4}
                              fill="none"
                              strokeDasharray={125.6}
                              strokeDashoffset={125.6 * (1 - selectedInvite.synergyScore / 100)}
                              strokeLinecap="round"
                              rotation="-90"
                              origin="24,24"
                            />
                          </Svg>
                          <Text style={styles.scoreText}>{selectedInvite.synergyScore}%</Text>
                        </View>
                        <View>
                          <Text style={styles.scoreLabel}>Acoustic Synergy</Text>
                          <Text style={styles.scoreTitle}>Vibe Match</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <View style={[styles.partnerCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>
                    <Image source={{ uri: selectedInvite.inviterAvatar }} style={styles.partnerAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.partnerLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Proposed by</Text>
                      <Text style={[styles.partnerName, { color: titleTone }]}>{selectedInvite.inviterName}</Text>
                      <View style={styles.verifiedRow}>
                        <MaterialIcons name="verified" size={12} color={PRIMARY_COLOR} />
                        <Text style={styles.verifiedText}>Verified Creator</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => { setSelectedInvite(null); navigation.navigate('Messages'); }} style={[styles.chatButton, { backgroundColor: isDark ? primaryColorAlpha(0.12) : theme.accentSoft, borderColor: primaryColorAlpha(0.24) }]}>
                      <MaterialIcons name="chat" size={13} color={isDark ? '#ffffff' : PRIMARY_COLOR} />
                      <Text style={[styles.chatButtonText, { color: isDark ? '#ffffff' : PRIMARY_COLOR }]}>Open Chat</Text>
                    </Pressable>
                  </View>

                  <View style={styles.pitchBlock}>
                    <Text style={[styles.modalSectionLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Proposed Pitch & Concept</Text>
                    <Text style={[styles.pitchText, { color: isDark ? 'rgba(255,255,255,0.72)' : subtle, backgroundColor: isDark ? 'rgba(15,23,42,0.42)' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>{selectedInvite.longMessage || selectedInvite.description}</Text>
                  </View>

                  <View style={styles.detailGrid}>
                    <View style={[styles.detailCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>
                      <Text style={[styles.detailLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Contract Split Structure</Text>
                      <View style={styles.detailValueRow}>
                        <MaterialIcons name="payments" size={15} color="#38a9e5" />
                        <Text style={[styles.detailValue, { color: '#38a9e5' }]}>{selectedInvite.split || selectedInvite.reward}</Text>
                      </View>
                    </View>
                    <View style={[styles.detailCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>
                      <Text style={[styles.detailLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Timeline & Deadlines</Text>
                      <View style={styles.detailValueRow}>
                        <MaterialIcons name="schedule" size={15} color={titleTone} />
                        <Text style={[styles.detailValue, { color: titleTone }]}>{selectedInvite.timeline || 'Launch Scheduled'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* {selectedInvite.requirements?.length ? (
                    <View style={styles.checklistBlock}>
                      <Text style={[styles.modalSectionLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Co-Creation Objectives Checklist</Text>
                      {selectedInvite.requirements.map((requirement) => (
                        <View key={requirement} style={[styles.requirementRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>
                          <MaterialIcons name="check-circle" size={16} color="#34d399" />
                          <Text style={[styles.requirementText, { color: isDark ? 'rgba(255,255,255,0.82)' : subtle }]}>{requirement}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null} */}

                  {showCounterBox ? (
                    <View style={[styles.counterBox, { backgroundColor: primaryColorAlpha(isDark ? 0.08 : 0.06), borderColor: primaryColorAlpha(0.24) }]}>
                      <View style={styles.counterTop}>
                        <View>
                          <Text style={styles.counterTitle}>Propose Custom Split</Text>
                          <Text style={[styles.counterSubtitle, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Adjust revenue split shares dynamically</Text>
                        </View>
                        <Text style={styles.counterPill}>{collabSplitVal}% / {100 - collabSplitVal}%</Text>
                      </View>
                      <View style={styles.stepperRow}>
                        <Text style={[styles.stepperLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>My Share</Text>
                        <Pressable onPress={() => setCollabSplitVal((value) => Math.max(10, value - 5))} style={[styles.stepperButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                          <MaterialIcons name="remove" size={18} color={titleTone} />
                        </Pressable>
                        <View style={[styles.splitMeter, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)' }]}>
                          <View style={[styles.splitFill, { width: `${collabSplitVal}%` }]} />
                        </View>
                        <Pressable onPress={() => setCollabSplitVal((value) => Math.min(90, value + 5))} style={[styles.stepperButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                          <MaterialIcons name="add" size={18} color={titleTone} />
                        </Pressable>
                        <Text style={[styles.stepperLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : muted }]}>Partner</Text>
                      </View>
                      <View style={styles.counterActions}>
                        <Pressable onPress={() => handleCounterSplitSubmit(selectedInvite.id)} style={styles.counterSubmit}>
                          <Text style={styles.counterSubmitText}>Propose Split Terms</Text>
                        </Pressable>
                        <Pressable onPress={() => setShowCounterBox(false)} style={[styles.counterCancel, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }]}>
                          <Text style={[styles.counterCancelText, { color: isDark ? 'rgba(255,255,255,0.64)' : subtle }]}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <View style={[styles.modalActions, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : border }]}>
                    {selectedInvite.status === 'pending' ? (
                      <>
                        <Pressable onPress={() => handleAcceptInvite(selectedInvite.id)} style={styles.modalPrimaryAction}>
                          <Text style={styles.modalPrimaryText}>Accept</Text>
                        </Pressable>
                        {!showCounterBox ? (
                          <Pressable onPress={() => setShowCounterBox(true)} style={[styles.modalSecondaryAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                            <Text style={[styles.modalSecondaryText, { color: isDark ? 'rgba(255,255,255,0.8)' : titleTone }]}>Negotiate</Text>
                          </Pressable>
                        ) : null}
                        <Pressable onPress={() => handleDeclineInvite(selectedInvite.id)} style={styles.modalDangerAction}>
                          <Text style={styles.modalDangerText}>Decline</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable onPress={() => { setSelectedInvite(null); triggerToast('Collaboration Workspace initialized successfully!'); }} style={styles.launchButton}>
                          <MaterialIcons name="rocket-launch" size={15} color="#ffffff" />
                          <Text style={styles.modalPrimaryText}>Launch Joint Studio</Text>
                        </Pressable>
                        <Pressable onPress={() => { setSelectedInvite(null); triggerToast('Contract terms shared cleanly.'); }} style={[styles.modalSecondaryAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : border }]}>
                          <Text style={[styles.modalSecondaryText, { color: isDark ? 'rgba(255,255,255,0.8)' : titleTone }]}>Print Deal Sheet</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Modal>



      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPrimary: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 16,
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  content: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 180, gap: 24 },
  hero: { borderRadius: 40, padding: 15, borderWidth: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.14), borderWidth: 1, borderColor: primaryColorAlpha(0.3),
  },
  heroTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase' },
  heroMeta: { marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  metricCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 16 },
  metricValue: { },
  metricLabel: { marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  tabBar: { flexDirection: 'row', borderRadius: 0, borderWidth: 0, padding: 0, justifyContent: 'space-between' },
  tabButton: { flex: 0, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabText: { ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 0.5 },
  dot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_COLOR },
  section: { gap: 16, marginHorizontal : -20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: {textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionAccent: { color: PRIMARY_COLOR,textTransform: 'uppercase', letterSpacing: 0.8 },
  challengeSectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  challengeEyebrow: { ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, letterSpacing: 1.4, marginBottom: 3 },
  challengeSectionTitle: { ...fontSize.b0Variant, lineHeight: fontSize.b0Variant.lineHeight + 2 },
  liveCountPill: { minHeight: 28, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_COLOR },
  liveCountText: { color: PRIMARY_COLOR, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, letterSpacing: 0.8 },
  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' },
  challengeQueryState: { minHeight: 150, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  challengeQueryText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textAlign: 'center' },
  challengeRetryButton: { minHeight: 38, borderRadius: 999, paddingHorizontal: 18, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  challengeRetryText: { color: '#ffffff', ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 0.7 },
  challengeGridCard: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    borderColor: 'transparent'
    // shadowColor: '#000000',
    // shadowOffset: { width: 0, height: 10 },
    // shadowOpacity: 0.12,
    // shadowRadius: 18,
    // elevation: 4,
  },
  challengeGridCardPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  challengeMedia: { position: 'relative', overflow: 'hidden', backgroundColor: '#111827' },
  challengeBadgeRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row' },
  challengeBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.42),
    backgroundColor: 'rgba(8,4,10,0.74)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeBadgeNew: { borderColor: 'rgba(196,181,253,0.45)', backgroundColor: 'rgba(46,16,101,0.72)' },
  challengeBadgeText: { color: PRIMARY_COLOR, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, letterSpacing: 0.7 },
  challengeBadgeTextNew: { color: '#c4b5fd' },
  creatorOverlay: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  creatorMark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  creatorAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: '#111827' },
  creatorMarkText: { color: '#ffffff', ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight },
  creatorOverlayCopy: { flex: 1, minWidth: 0 },
  creatorOverlayName: { color: '#ffffff', ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight },
  creatorOverlayHandle: { color: 'rgba(255,255,255,0.62)', ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, marginTop: 1 },
  challengeCardBody: { flex: 1, padding: 12, gap: 8 },
  challengeCategoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  challengeCategory: { color: PRIMARY_COLOR, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, letterSpacing: 0.9, textTransform: 'uppercase', flexShrink: 1 },
  challengeDeadline: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  challengeDeadlineText: { ...fontSize.b6, lineHeight: fontSize.b6.lineHeight },
  challengeCardTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight + 2,  },
  challengeCardDescription: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight + 2,},
  challengeDetailDivider: { height: StyleSheet.hairlineWidth, width: '100%' },
  challengeDetailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  challengeParticipants: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  challengeParticipantsText: { ...fontSize.b6, lineHeight: fontSize.b6.lineHeight },
  challengeReward: { color: PRIMARY_COLOR, ...fontSize.b6, lineHeight: fontSize.b6.lineHeight, textAlign: 'right', flex: 1 },
  joinChallengeButton: { minHeight: 35, marginTop: 'auto', borderRadius: 999, backgroundColor: PRIMARY_COLOR, paddingLeft: 12, paddingRight: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  joinChallengeButtonPressed: { backgroundColor: '#be1f77', transform: [{ scale: 0.98 }] },
  joinChallengeButtonText: { color: '#ffffff', ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, letterSpacing: 0.6, flexShrink: 1 },
  joinChallengeIcon: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  featureCard: { minHeight: mediumScreen ? 310: 320, borderRadius: 48, overflow: 'hidden', borderWidth: 1, backgroundColor: '#111827', gap: 14 },
  fillImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  trending: {
    position: 'absolute', top: 24, left: 24, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: primaryColorAlpha(0.15),
    borderWidth: 1, borderColor: primaryColorAlpha(0.3),
  },
  trendingText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  featureBottom: { position: 'absolute', left: 24, right: 24, bottom: 24, gap: 14 },
  featureTitle: { color: '#fff', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase' },
  featureDesc: { color: 'rgba(255,255,255,0.65)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,},
  featureStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, gap: 10 },
  featureLabel: { color: 'rgba(255,255,255,0.4)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  featureValue: { color: '#fff', marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  reward: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4, flexShrink: 1, textAlign: 'left',  },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  // primaryActionAlt: { backgroundColor: '#b012d4' },
  primaryActionText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.6 },
  iconAction: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  listCard: { borderRadius: 28, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' },
  thumbWrap: { width: 96, height: 96, borderRadius: 18, overflow: 'hidden' },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 66, height: 66, borderRadius: 33, backgroundColor: primaryColorAlpha(0.24), borderWidth: 1, borderColor: primaryColorAlpha(0.5), alignItems: 'center', justifyContent: 'center' },
  listBody: { flex: 1, minWidth: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  authorAvatar: { width: 20, height: 20, borderRadius: 10 },
  authorName: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  listTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  listMeta: { marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.4 },
  inlineStats: { flexDirection: 'row', gap: 14, marginTop: 10 },
  inlineStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineStatText: {},
  sideActions: { gap: 10 },
  sideBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dashedBtn: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  dashedBtnText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.8 },
  draftImage: { width: 80, height: 80, borderRadius: 18, opacity: 0.65 },
  draftMeta: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  rewardMini: { color: PRIMARY_COLOR, textTransform: 'uppercase', letterSpacing: 0.4 },
  smallText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.2 },
  resumeBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resumeBtnText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.6 },
  inviteCard: { minHeight: 298, borderRadius: 48, overflow: 'hidden', borderWidth: 1, backgroundColor: '#111827' },
  inviteTop: { position: 'absolute', top: 24, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inviterPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8, paddingRight: 14, borderRadius: 999 },
  inviterAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: primaryColorAlpha(0.4) },
  inviteTag: { color: 'rgba(255,255,255,0.45)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  inviterName: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', marginTop: 2 },
  statusPill: { height:25, paddingHorizontal: 12, borderRadius: 999, paddingTop: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pending: { backgroundColor: 'rgba(249,115,22,0.16)', borderColor: 'rgba(249,115,22,0.35)' },
  accepted: { backgroundColor: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.35)' },
  statusText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.4 },
  inviteFooter: { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  inviteActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  acceptBtn: { minHeight: 40, paddingHorizontal: 20, borderRadius: 12, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  collabBtn: { minHeight: 40, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  acceptBtnText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  declineBtnText: { color: 'rgba(255,255,255,0.7)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  tipCard: { borderRadius: 32, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  tipTitle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.8 },
  tipBody: { textAlign: 'center', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,},
  toast: { position: 'absolute', left: 20, right: 20, bottom: 96, zIndex: 20, minHeight: 46, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  toastText: { color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.84)' },
  collabModal: { width: '100%', maxWidth: 560, maxHeight: '90%', borderRadius: 36, overflow: 'hidden', backgroundColor: '#09090c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  modalContent: { padding: 20, gap: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalChip: { flexShrink: 1, color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 2, backgroundColor: primaryColorAlpha(0.1), borderWidth: 1, borderColor: primaryColorAlpha(0.22), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  coverCard: { aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#111827' },
  coverCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  modalTitle: { color: '#ffffff', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase' },
  modalRole: { color: PRIMARY_COLOR, marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  scoreCard: { position: 'absolute', top: 14, right: 14, borderRadius: 18, padding: 10, backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.22)', flexDirection: 'row', alignItems: 'center', gap: 9 },
  scoreRing: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  scoreText: { position: 'absolute', color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  scoreLabel: { color: '#34d399', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  scoreTitle: { color: '#ffffff', marginTop: 2, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  partnerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  partnerAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: primaryColorAlpha(0.3) },
  partnerLabel: { color: 'rgba(255,255,255,0.42)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  partnerName: { color: '#ffffff', marginTop: 2, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  verifiedText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  chatButton: { minHeight: 38, borderRadius: 12, paddingHorizontal: 12, backgroundColor: primaryColorAlpha(0.12), borderWidth: 1, borderColor: primaryColorAlpha(0.24), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  chatButtonText: { color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  pitchBlock: { gap: 8 },
  modalSectionLabel: { color: 'rgba(255,255,255,0.42)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.6 },
  pitchText: { color: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(15,23,42,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 16, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, fontStyle: 'italic' },
  detailGrid: { flexDirection: 'row', gap: 12 },
  detailCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  detailLabel: { color: 'rgba(255,255,255,0.42)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  detailValue: { color: '#ffffff', flex: 1, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  checklistBlock: { gap: 10 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  requirementText: { color: 'rgba(255,255,255,0.82)', flex: 1, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  counterBox: { borderRadius: 24, borderWidth: 1, borderColor: primaryColorAlpha(0.24), backgroundColor: primaryColorAlpha(0.08), padding: 16, gap: 14 },
  counterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  counterTitle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  counterSubtitle: { color: 'rgba(255,255,255,0.42)', marginTop: 3, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  counterPill: { color: PRIMARY_COLOR, backgroundColor: primaryColorAlpha(0.16), borderWidth: 1, borderColor: primaryColorAlpha(0.34), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperLabel: { color: 'rgba(255,255,255,0.42)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  stepperButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  splitMeter: { flex: 1, height: 7, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  splitFill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  counterActions: { flexDirection: 'row', gap: 8 },
  counterSubmit: { flex: 1, height: 42, borderRadius: 14, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  counterSubmitText: { color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  counterCancel: { height: 42, borderRadius: 14, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  counterCancelText: { color: 'rgba(255,255,255,0.64)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  modalPrimaryAction: { flex: 1, width: 30, minHeight: 48, borderRadius: 18, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  modalPrimaryText: { color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
  modalSecondaryAction: { minHeight: 48, borderRadius: 18, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { color: 'rgba(255,255,255,0.8)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  modalDangerAction: { minHeight: 48, borderRadius: 18, paddingHorizontal: 16, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' },
  modalDangerText: { color: '#f87171', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  launchButton: { flex: 1, minWidth: 160, minHeight: 48, borderRadius: 18, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14 },
});

export default CreatorChallenges;
