import React, { useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { mediumScreen, user } from '../types';
import TrophyIcon from '../assets/icons/trophy-svg.svg';
import SubmissionIcon from '../assets/icons/upload-svg.svg';
import DraftIcon from '../assets/icons/draft-svg.svg';
import InviteIcon from '../assets/icons/invite-svg.svg';
import { fontSize } from '../typography';

type Tab = 'challenges' | 'submissions' | 'drafts' | 'invites';

type Challenge = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  image: string;
};

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
};

const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    creatorId: 'mila_ray_01',
    title: 'Night Vibes Dance Challenge',
    description: 'Show us your best moves under the neon lights and tag #NightVibes for a chance to be featured.',
    reward: '$500 + Feature',
    deadline: '7 Days',
    participants: 1200,
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
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
  },
];

const CreatorChallenges: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<Tab>('challenges');

  const shell = isDark ? '#050207' : theme.background;
  const card = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const surface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#ffffff' : theme.text;

  const metrics = useMemo(
    () => ({ total: '2.1k', conversion: '18%' }),
    [],
  );

  const go = (screen: string, params?: Record<string, unknown>) => {
    try {
      navigation.navigate(screen, params);
    } catch {}
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
        <Text style={[styles.tabText, { color: active ? theme.accent : subtle, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, marginTop: 5 }]}>{label}</Text>
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
          <LinearGradient
            colors={isDark ? [primaryColorAlpha(0.18), 'rgba(124,58,237,0.08)'] : [primaryColorAlpha(0.08), 'rgba(124,58,237,0.04)']}
            style={[styles.hero, { borderColor: primaryColorAlpha(0.22) }]}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="emoji-events" size={34} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: titleTone, ...fontSize.b2 }]}>Viral Factory</Text>
                <Text style={[styles.heroMeta, { color: subtle, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 }]}>Drive Engagement Through Action</Text>
              </View>
            </View>
            <View style={styles.metricRow}>
              <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }]}>
                <Text style={[styles.metricValue, { color: theme.accent, ...fontSize.n1, lineHeight: fontSize.n1.fontSize + 1 }]}>{metrics.total}</Text>
                <Text style={[styles.metricLabel, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Total Submissions</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }]}>
                <Text style={[styles.metricValue, { color: '#10b981', ...fontSize.n1, lineHeight: fontSize.n1.fontSize + 1 }]}>{metrics.conversion}</Text>
                <Text style={[styles.metricLabel, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Conversion Rate</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.tabBar, {
            // backgroundColor: surface, borderColor: border
             }]}>
            {renderTab('challenges', 'Challenges')}
            {renderTab('submissions', 'Submissions')}
            {renderTab('drafts', 'Drafts')}
            {renderTab('invites', 'Invites', true)}
          </View>

          {activeTab === 'challenges' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1 }]}>Active Challenges</Text>
                <Text style={[styles.sectionAccent, {...fontSize.b2, lineHeight: fontSize.b2.fontSize + 1}]}>{CHALLENGES.length} Live</Text>
              </View>
              {CHALLENGES.map((challenge) => {
                const isOwner = challenge.creatorId === (user?.id || 'mila_ray_01');
                return (
                  <Pressable
                   onPress={()=>{
                    navigation.navigate('ChallengeFeed')
                   }}
                   key={challenge.id} style={[styles.featureCard, { borderColor: border }]}>
                    <Image source={{ uri: challenge.image }} style={styles.fillImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.94)']} style={StyleSheet.absoluteFillObject} />
                    <View style={styles.trending}>
                      <MaterialIcons name="bolt" size={16} color={theme.accent} />
                      <Text style={[styles.trendingText, {...fontSize.b4}]}>Trending</Text>
                    </View>
                    <View style={styles.featureBottom}>
                      <Text style={[styles.featureTitle, {fontSize: fontSize.b1.fontSize + (mediumScreen ? 4: 0), fontFamily: 'Pogonia_700Bold', }]}>{challenge.title}</Text>
                      <Text style={[styles.featureDesc, {...fontSize.b5, lineHeight: fontSize.b5.fontSize + 2}]} numberOfLines={6}>{challenge.description}</Text>
                      <View style={styles.featureStats}>
                        <View>
                          <Text style={[styles.featureLabel, {...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1}]}>Participants</Text>
                          <Text style={[styles.featureValue, {...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1}]}>{challenge.participants.toLocaleString()}</Text>
                        </View>
                        <View>
                          <Text style={[styles.featureLabel, {...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1}]}>Deadline</Text>
                          <Text style={[styles.featureValue, {...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1}]}>{challenge.deadline}</Text>
                        </View>
                      </View>
                      <Text style={[styles.reward, {fontSize: fontSize.b5.fontSize, fontFamily: "Poppins_700Bold"}]}>{challenge.reward}</Text>
                      <View style={styles.actionRow}>
                        {isOwner ? (
                          <>
                            <Pressable onPress={() => go('Submissions', { challengeId: challenge.id })} style={styles.primaryAction}>
                              <Text style={[styles.primaryActionText, {...fontSize.b3, lineHeight: fontSize.b3.fontSize + 1}]}>View Submissions</Text>
                            </Pressable>
                            <Pressable style={styles.iconAction}>
                              <MaterialIcons name="edit" size={20} color="#fff" />
                            </Pressable>
                          </>
                        ) : (
                          <Pressable onPress={() => go('SubmitEntry')} style={[styles.primaryAction, {backgroundColor: PRIMARY_COLOR}]}>
                            <MaterialIcons name="rocket-launch" size={16} color="#fff" />
                            <Text style={[styles.primaryActionText, {...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1}]}>Join Challenge</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {activeTab === 'submissions' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1  }]}>Recent Submissions</Text>
                <Text style={[styles.sectionAccent, {fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1 }]}>{SUBMISSIONS.length} New</Text>
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
                      <Text style={[styles.authorName, { color: titleTone, fontSize: fontSize.b5.fontSize, lineHeight: fontSize.b5.fontSize + 1, fontFamily: 'Poppins_600SemiBold'}]} numberOfLines={1}>{submission.userName}</Text>
                    </View>
                    <Text style={[styles.listTitle, { color: titleTone, fontSize: fontSize.b5.fontSize, fontFamily: 'Inter_500Medium'}]} numberOfLines={2}>{submission.challengeTitle}</Text>
                    <Text style={[styles.listMeta, { color: muted, fontSize: fontSize.b5.fontSize }]}>{submission.submittedAt}</Text>
                    <View style={styles.inlineStats}>
                      <View style={styles.inlineStat}>
                        <MaterialIcons name="favorite" size={14} color={theme.accent} />
                        <Text style={[styles.inlineStatText, { color: titleTone, ...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1 }]}>{submission.likes}</Text>
                      </View>
                      <View style={styles.inlineStat}>
                        <MaterialIcons name="how-to-vote" size={14} color="#10b981" />
                        <Text style={[styles.inlineStatText, { color: titleTone, ...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1 }]}>{submission.votes}</Text>
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
                <Text style={[styles.dashedBtnText, {...fontSize.b4}]}>View All Submissions</Text>
              </Pressable>
            </View>
          ) : null}

          {activeTab === 'drafts' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1  }]}>Saved Drafts</Text>
                <Text style={[styles.sectionAccent, {fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1 }]}>{DRAFTS.length} Drafts</Text>
              </View>
              {DRAFTS.map((draft) => (
                <View key={draft.id} style={[styles.listCard, { backgroundColor: card, borderColor: border, }]}>
                  <Image source={{ uri: draft.image }} style={styles.draftImage} />
                  <View style={styles.listBody}>
                    <Text style={[styles.listTitle, { color: titleTone, fontSize: fontSize.b4.fontSize, fontFamily: fontSize.b4.fontFamily, lineHeight: fontSize.b4.fontSize + 1, marginTop: mediumScreen ? 8: 4}]} numberOfLines={1}>{draft.title}</Text>
                    <Text style={[styles.listMeta, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1}]} numberOfLines={1}>{draft.description}</Text>
                    <View style={[styles.draftMeta, {marginTop: mediumScreen ? 8: 4, gap: mediumScreen ? 8 : 4}]}>
                      <Text numberOfLines={1} style={[styles.rewardMini, {...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1}]}>{draft.reward}</Text>
                      <Text style={[styles.smallText, { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Last edited 2d ago</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => go('ChallengeDrafts', { draft })} style={[styles.resumeBtn, { backgroundColor: surface, borderColor: border }]}>
                    <Text style={[styles.resumeBtnText, { color: titleTone, ...fontSize.b5 }]}>Resume</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => go('ChallengeDrafts')} style={[styles.dashedBtn, { borderColor: primaryColorAlpha(0.3) }]}>
                <Text style={[styles.dashedBtnText, {...fontSize.b4}]}>View All Drafts</Text>
              </Pressable>
            </View>
          ) : null}

          {activeTab === 'invites' ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: muted, fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1 }]}>Creator Invites</Text>
                <Text style={[styles.sectionAccent, { fontSize: fontSize.b2.fontSize - (mediumScreen ? 0 : 2), fontFamily: fontSize.b2.fontFamily, lineHeight: fontSize.b2.fontSize + 1 }]}>{INVITES.length} Pending</Text>
              </View>
              {INVITES.map((invite) => (
                <View key={invite.id} style={[styles.inviteCard, { borderColor: border }]}>
                  <Image source={{ uri: invite.image }} style={styles.fillImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.inviteTop}>
                    <View style={styles.inviterPill}>
                      <Image source={{ uri: invite.inviterAvatar }} style={styles.inviterAvatar} />
                      <View>
                        <Text style={[styles.inviteTag, { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Invited by</Text>
                        <Text style={[styles.inviterName, { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>{invite.inviterName}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, invite.status === 'pending' ? styles.pending : styles.accepted]}>
                      <Text style={[styles.statusText, { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>{invite.status}</Text>
                    </View>
                  </View>
                  <View style={styles.featureBottom}>
                    <Text style={[styles.featureTitle, { fontSize: fontSize.b1.fontSize + (mediumScreen ? 4 : 0), fontFamily: 'Pogonia_700Bold', marginTop: 10 }]}>{invite.title}</Text>
                    <Text style={[styles.featureDesc, { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 2, fontStyle: 'italic' }]} numberOfLines={2}>{invite.description}</Text>
                    <View style={styles.inviteFooter}>
                      <View style={{
                      }}>
                        <Text style={[styles.featureLabel, { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Potential Reward</Text>
                        <Text style={[styles.reward, { fontSize: fontSize.b5.fontSize, fontFamily: "Poppins_700Bold" }]}>{invite.reward}</Text>
                      </View>
                      <View style={styles.inviteActions}>
                        {invite.status === 'pending' ? (
                          <>
                            <Pressable style={styles.acceptBtn}><Text style={[styles.acceptBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 }]}>Accept</Text></Pressable>
                            <Pressable style={styles.declineBtn}><Text style={[styles.declineBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 }]}>Decline</Text></Pressable>
                          </>
                        ) : (
                          <Pressable style={styles.collabBtn}>
                            <MaterialIcons name="chat" size={14} color="#fff" />
                            <Text style={[styles.acceptBtnText, { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 2 }]}>Collaborate</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <View style={[styles.tipCard, { backgroundColor: isDark ? primaryColorAlpha(0.08) : theme.accentSoft, borderColor: primaryColorAlpha(0.24) }]}>
                <Text style={[styles.tipTitle, { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 }]}>Collaboration Tip</Text>
                <Text style={[styles.tipBody, { color: subtle, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 3 }]}>Collaborating on creator challenges can increase your reach by up to 40%. Use invites when creating a challenge to partner up.</Text>
              </View>
            </View>
          ) : null}
        <View style={{
          height: 120
        }}/>
        </ScrollView>





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
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, gap: 24 },
  hero: { borderRadius: 40, padding: 24, borderWidth: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.14), borderWidth: 1, borderColor: primaryColorAlpha(0.3),
  },
  heroTitle: { ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase' },
  heroMeta: { marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  metricCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 16 },
  metricValue: { },
  metricLabel: { marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  tabBar: { flexDirection: 'row', borderRadius: 0, borderWidth: 0, padding: 0, justifyContent: 'space-around' },
  tabButton: { flex: 0, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  dot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_COLOR },
  section: { gap: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: {textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionAccent: { color: PRIMARY_COLOR,textTransform: 'uppercase', letterSpacing: 0.8 },
  featureCard: { minHeight: mediumScreen ? 310: 320, borderRadius: 48, overflow: 'hidden', borderWidth: 1, backgroundColor: '#111827', gap: 14 },
  fillImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  trending: {
    position: 'absolute', top: 24, left: 24, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: primaryColorAlpha(0.15),
    borderWidth: 1, borderColor: primaryColorAlpha(0.3),
  },
  trendingText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  featureBottom: { position: 'absolute', left: 24, right: 24, bottom: 24, gap: 14 },
  featureTitle: { color: '#fff', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase' },
  featureDesc: { color: 'rgba(255,255,255,0.65)', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,},
  featureStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, gap: 10 },
  featureLabel: { color: 'rgba(255,255,255,0.4)', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 0.8 },
  featureValue: { color: '#fff', marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  reward: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4, flexShrink: 1, textAlign: 'left',  },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  // primaryActionAlt: { backgroundColor: '#b012d4' },
  primaryActionText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.6 },
  iconAction: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  listCard: { borderRadius: 28, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' },
  thumbWrap: { width: 96, height: 96, borderRadius: 18, overflow: 'hidden' },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 66, height: 66, borderRadius: 33, backgroundColor: primaryColorAlpha(0.24), borderWidth: 1, borderColor: primaryColorAlpha(0.5), alignItems: 'center', justifyContent: 'center' },
  listBody: { flex: 1, minWidth: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  authorAvatar: { width: 20, height: 20, borderRadius: 10 },
  authorName: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  listTitle: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  listMeta: { marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 0.4 },
  inlineStats: { flexDirection: 'row', gap: 14, marginTop: 10 },
  inlineStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineStatText: {},
  sideActions: { gap: 10 },
  sideBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dashedBtn: { minHeight: 54, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  dashedBtnText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.8 },
  draftImage: { width: 80, height: 80, borderRadius: 18, opacity: 0.65 },
  draftMeta: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  rewardMini: { color: PRIMARY_COLOR, textTransform: 'uppercase', letterSpacing: 0.4 },
  smallText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 0.2 },
  resumeBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resumeBtnText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.6 },
  inviteCard: { minHeight: 298, borderRadius: 48, overflow: 'hidden', borderWidth: 1, backgroundColor: '#111827' },
  inviteTop: { position: 'absolute', top: 24, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inviterPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8, paddingRight: 14, borderRadius: 999 },
  inviterAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: primaryColorAlpha(0.4) },
  inviteTag: { color: 'rgba(255,255,255,0.45)', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  inviterName: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  pending: { backgroundColor: 'rgba(249,115,22,0.16)', borderColor: 'rgba(249,115,22,0.35)' },
  accepted: { backgroundColor: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.35)' },
  statusText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.4 },
  inviteFooter: { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  inviteActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  acceptBtn: { minHeight: 40, paddingHorizontal: 20, borderRadius: 12, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  collabBtn: { minHeight: 40, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  acceptBtnText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  declineBtnText: { color: 'rgba(255,255,255,0.7)', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  tipCard: { borderRadius: 32, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  tipTitle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.8 },
  tipBody: { textAlign: 'center', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,},
});

export default CreatorChallenges;
