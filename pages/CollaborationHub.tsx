import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

type CollabTab = 'discover' | 'incoming' | 'outgoing' | 'active';
type ProjectType = 'Public Feed Track' | 'Premium Locked Release' | 'Event' | 'Live Session' | 'All';
type PitchTone = 'Professional' | 'Hype' | 'Chill' | 'Mysterious';

interface CreatorPartner {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  genres: string[];
  vibeMatch: number;
  status: 'available' | 'busy' | 'selective';
  bio: string;
  synergy?: string;
}

interface CollabRequest {
  id: string;
  partner: string;
  handle: string;
  avatar: string;
  genres: string[];
  type: Exclude<ProjectType, 'All'>;
  title: string;
  message: string;
  split: string;
  date: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'withdrawn';
  deadline?: string;
  isIncoming?: boolean;
  isNew?: boolean;
  counterMessage?: string;
  matchScore: number;
}

const TABS: CollabTab[] = ['discover', 'incoming', 'outgoing', 'active'];
const FILTERS: ProjectType[] = ['All', 'Public Feed Track', 'Premium Locked Release', 'Event', 'Live Session'];
const DISCOVER_TYPES: Exclude<ProjectType, 'All'>[] = ['Public Feed Track', 'Premium Locked Release'];
const BRAND = '#cd2bee';
const scaledFont = (size: number) => (mediumScreen ? fontScale(size + 4) : fontScale(size));

const CollaborationHub: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<CollabTab>('discover');
  const [vibeQuery, setVibeQuery] = useState('');
  const [incomingFilter, setIncomingFilter] = useState<ProjectType>('All');

  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState<CreatorPartner | null>(null);
  const [viewingRequest, setViewingRequest] = useState<CollabRequest | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiateDraft, setNegotiateDraft] = useState('');

  const [partners, setPartners] = useState<CreatorPartner[]>([
    { id: 'p1', name: 'Zion King', handle: '@zion_afro', avatar: 'https://picsum.photos/seed/zion/150', genres: ['Afrobeats', 'Soul'], vibeMatch: 94, status: 'available', bio: 'Afrobeats pioneer looking for global sounds.' },
    { id: 'p2', name: 'Elena Rose', handle: '@elena_r', avatar: 'https://picsum.photos/seed/elena/150', genres: ['Synthwave', 'Indie'], vibeMatch: 88, status: 'selective', bio: 'Ethereal vocals and analog synthesis.' },
    { id: 'p3', name: 'Luna Ray', handle: '@luna_ray', avatar: 'https://picsum.photos/seed/luna/150', genres: ['Pop', 'Electronic'], vibeMatch: 72, status: 'busy', bio: 'Vibrant pop productions for the galaxy.' },
    { id: 'p4', name: 'The Glitch', handle: '@glitch_ops', avatar: 'https://picsum.photos/seed/glitch/150', genres: ['Techno', 'House'], vibeMatch: 65, status: 'available', bio: 'Industrial soundscapes and deep house.' },
  ]);

  const [requests, setRequests] = useState<CollabRequest[]>([
    { id: 'r1', partner: 'Amara', handle: '@amara_vocal', avatar: 'https://picsum.photos/seed/amara/100', genres: ['Afrobeats', 'R&B'], type: 'Event', title: 'Winter Solstice Live', message: 'Hey! Want to co-headline the Winter Solstice show in Berlin? Your synth style fits the venue perfectly.', split: '50/50', date: '2h ago', status: 'pending', isIncoming: true, isNew: true, matchScore: 92 },
    { id: 'r2', partner: 'Echo Vibe', handle: '@echo_beats', avatar: 'https://picsum.photos/seed/echo/100', genres: ['Trap', 'Experimental'], type: 'Public Feed Track', title: 'Cosmic Bass (Edit)', message: "I have a heavy beat that needs your ethereal pads. Let's finish this for the next drop.", split: '60/40', date: '1d ago', status: 'accepted', isIncoming: true, matchScore: 85 },
    { id: 'r3', partner: 'Marcus Thorne', handle: '@mthorne', avatar: 'https://picsum.photos/seed/mthorne/100', genres: ['Indie', 'Alternative'], type: 'Premium Locked Release', title: 'Studio BTS Series', message: 'Doing a documentary on emerging synth-soul creators. Would love a 20-min segment with you.', split: '70/30', date: '3h ago', status: 'pending', isIncoming: true, isNew: true, matchScore: 78 },
    { id: 'o1', partner: 'The Glitch', handle: '@glitch_ops', avatar: 'https://picsum.photos/seed/glitch/150', genres: ['Techno', 'House'], type: 'Live Session', title: 'Techno-Soul Improv', message: 'Loved your last industrial set. I think adding some soul vocals live would create a unique contrast.', split: '40/60', date: '5h ago', status: 'pending', isIncoming: false, matchScore: 65 },
    { id: 'o2', partner: 'Luna Ray', handle: '@luna_ray', avatar: 'https://picsum.photos/seed/luna/150', genres: ['Pop', 'Electronic'], type: 'Public Feed Track', title: 'Starlight Remix', message: "I've drafted a synthwave remix of Starlight. Let's collaborate on the final master.", split: '50/50', date: '2d ago', status: 'negotiating', isIncoming: false, matchScore: 72 },
  ]);

  const [collabType, setCollabType] = useState<Exclude<ProjectType, 'All'>>('Public Feed Track');
  const [projectTitle, setProjectTitle] = useState('');
  const [proposalDraft, setProposalDraft] = useState('');
  const [pitchTone, setPitchTone] = useState<PitchTone>('Professional');
  const [splitRatio, setSplitRatio] = useState(50);

  useEffect(() => {
    const state = route.params as { tab?: CollabTab } | undefined;
    if (state?.tab) setActiveTab(state.tab);
  }, [route.params]);

  const incomingCount = useMemo(
    () => requests.filter((r) => r.isIncoming && r.status === 'pending').length,
    [requests],
  );

  const incomingRequests = useMemo(
    () => requests.filter((r) => r.isIncoming && (incomingFilter === 'All' || r.type === incomingFilter)),
    [incomingFilter, requests],
  );

  const outgoingRequests = useMemo(
    () => requests.filter((r) => !r.isIncoming),
    [requests],
  );

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const softBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
  const subtleBg = isDark ? 'rgba(0,0,0,0.22)' : 'rgba(15,23,42,0.04)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const muted = isDark ? 'rgba(255,255,255,0.34)' : '#94a3b8';
  const body = isDark ? 'rgba(255,255,255,0.62)' : '#64748b';
  const surface = isDark ? theme.background : '#f8fafc';

  const handleAiVibeSearch = async () => {
    if (!vibeQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `You are a music industry scout. A creator says: "${vibeQuery}". Analyze synergy and provide updated match scores for our partner network.`,
        });
      }
      setPartners((prev) =>
        prev.map((p) => ({
          ...p,
          vibeMatch: Math.min(100, p.vibeMatch + Math.floor(Math.random() * 5)),
        })),
      );
    } catch (e) {
      console.error('AI Search Failed', e);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSendProposal = () => {
    if (!selectedPartner || !proposalDraft) return;
    setIsSending(true);
    setTimeout(() => {
      const newRequest: CollabRequest = {
        id: `o-${Date.now()}`,
        partner: selectedPartner.name,
        handle: selectedPartner.handle,
        avatar: selectedPartner.avatar,
        genres: selectedPartner.genres,
        type: collabType,
        title: projectTitle || 'Untitled Project',
        message: proposalDraft,
        split: `${splitRatio}/${100 - splitRatio}`,
        date: 'Just now',
        status: 'pending',
        isIncoming: false,
        matchScore: selectedPartner.vibeMatch,
      };
      setRequests((prev) => [newRequest, ...prev]);
      setIsSending(false);
      setShowSuccess(true);
    }, 2000);
  };

  const handleAcceptRequest = (id: string) => {
    setIsProcessingAction(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: 'accepted', isNew: false } : req)));
      setIsProcessingAction(null);
      setViewingRequest(null);
    }, 1500);
  };

  const handleDeclineRequest = (id: string) => {
    setIsProcessingAction(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: 'declined', isNew: false } : req)));
      setIsProcessingAction(null);
      setViewingRequest(null);
    }, 800);
  };

  const handleWithdrawRequest = (id: string) => {
    setIsProcessingAction(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: 'withdrawn' } : req)));
      setIsProcessingAction(null);
    }, 1000);
  };

  const handleStartNegotiate = (req: CollabRequest) => {
    setViewingRequest(req);
    setNegotiateDraft('');
    setIsNegotiating(true);
  };

  const submitNegotiation = () => {
    if (!viewingRequest) return;
    setIsProcessingAction(viewingRequest.id);
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === viewingRequest.id ? { ...req, status: 'negotiating', counterMessage: negotiateDraft } : req,
        ),
      );
      setIsProcessingAction(null);
      setIsNegotiating(false);
      setViewingRequest(null);
    }, 1500);
  };

  const renderRange = (value: number, onChange: (value: number) => void) => (
    <View style={styles.rangeWrap}>
      {[0, 20, 40, 60, 80, 100].map((stop) => {
        const active = value >= stop;
        return (
          <Pressable
            key={stop}
            onPress={() => onChange(stop)}
            style={[
              styles.rangeStep,
              {
                backgroundColor: active ? BRAND : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: surface }]}>
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border, paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()}>
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Collaboration Hub</Text>
          </View>
          {/* <View style={[styles.neuralPill, { backgroundColor: isDark ? 'rgba(205,43,238,0.1)' : 'rgba(205,43,238,0.08)', borderColor: 'rgba(205,43,238,0.25)' }]}>
            <Text style={styles.neuralText}>Neural Active</Text>
          </View> */}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
              <Text style={[styles.tabText, { color: activeTab === tab ? BRAND : muted }]}>{tab}</Text>
              {tab === 'incoming' && incomingCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{incomingCount}</Text>
                </View>
              ) : null}
              {activeTab === tab ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === 'discover' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionKicker, { color: muted }]}>Vibe Matchmaker</Text>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor: border }]}>
              <TextInput
                value={vibeQuery}
                onChangeText={setVibeQuery}
                placeholder="Describe your sonic vision..."
                placeholderTextColor={muted}
                style={[styles.input, { color: theme.text }]}
              />
              <Pressable
                onPress={handleAiVibeSearch}
                disabled={isAiSearching || !vibeQuery.trim()}
                style={[styles.aiBtn, (!vibeQuery.trim() || isAiSearching) && styles.disabledBtn]}
              >
                {isAiSearching ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="auto-awesome" size={18} color="#fff" />}
              </Pressable>
            </View>

            <Text style={[styles.sectionKicker, { color: muted }]}>Recommended Partners</Text>
            {partners.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedPartner(p);
                  setShowSuccess(false);
                }}
                style={[styles.partnerCard, { backgroundColor: cardBg, borderColor: border }]}
              >
                <View style={styles.partnerLeft}>
                  <View>
                    <Image source={{ uri: p.avatar }} style={styles.partnerAvatar} />
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: p.status === 'available' ? '#22c55e' : '#eab308' },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.partnerName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.partnerMeta, { color: muted }]}>{p.genres.join(' • ')}</Text>
                    <Text style={[styles.partnerBio, { color: body }]}>{p.bio}</Text>
                  </View>
                </View>
                <View style={styles.partnerRight}>
                  <Text style={styles.matchText}>{p.vibeMatch}%</Text>
                  <Text style={[styles.smallMeta, { color: muted }]}>Match</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {activeTab === 'incoming' ? (
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setIncomingFilter(filter)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: incomingFilter === filter ? BRAND : softBg,
                      borderColor: incomingFilter === filter ? BRAND : border,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: incomingFilter === filter ? '#fff' : muted }]}>{filter}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {incomingRequests.map((r) => (
              <View key={r.id} style={[styles.requestCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={styles.rowBetween}>
                  <View style={styles.partnerLeft}>
                    <Image source={{ uri: r.avatar }} style={styles.requestAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.partnerName, { color: theme.text }]}>{r.partner}</Text>
                      <Text style={[styles.partnerMeta, { color: muted }]}>{r.handle} • {r.genres.slice(0, 2).join('/')}</Text>
                    </View>
                  </View>
                  <View style={styles.partnerRight}>
                    <Text style={styles.matchText}>{r.matchScore}%</Text>
                    <Text style={[styles.smallMeta, { color: muted }]}>Match</Text>
                  </View>
                </View>

                <View style={[styles.innerPanel, { backgroundColor: subtleBg }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.typeTag, { color: r.type.includes('Premium') ? BRAND : '#60a5fa', borderColor: r.type.includes('Premium') ? 'rgba(205,43,238,0.3)' : 'rgba(96,165,250,0.3)' }]}>{r.type}</Text>
                    <Text style={[styles.smallMeta, { color: muted }]}>{r.date}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{r.title}</Text>
                  <Text style={[styles.cardBody, { color: body }]}>"{r.message}"</Text>
                </View>

                <View style={styles.rowBetween}>
                  <View style={styles.splitInfo}>
                    <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(205,43,238,0.15)' : 'rgba(205,43,238,0.08)' }]}>
                      <MaterialIcons name="payments" size={18} color={BRAND} />
                    </View>
                    <View>
                      <Text style={[styles.smallMeta, { color: muted }]}>Proposed Split</Text>
                      <Text style={[styles.splitText, { color: theme.text }]}>{r.split} Shared Net</Text>
                    </View>
                  </View>
                  {r.status === 'pending' ? (
                    <Pressable onPress={() => handleStartNegotiate(r)} style={[styles.secondaryMiniBtn, { borderColor: 'rgba(205,43,238,0.25)' }]}>
                      <Text style={styles.secondaryMiniBtnText}>Negotiate</Text>
                    </Pressable>
                  ) : null}
                </View>

                {r.status === 'pending' ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleAcceptRequest(r.id)}
                      disabled={isProcessingAction === r.id}
                      style={styles.primaryAction}
                    >
                      {isProcessingAction === r.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryActionText}>Accept Proposal</Text>}
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeclineRequest(r.id)}
                      disabled={isProcessingAction === r.id}
                      style={[styles.iconAction, { borderColor: border, backgroundColor: softBg }]}
                    >
                      <MaterialIcons name="close" size={20} color={muted} />
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusBanner,
                      {
                        backgroundColor:
                          r.status === 'accepted'
                            ? 'rgba(34,197,94,0.08)'
                            : r.status === 'negotiating'
                              ? 'rgba(205,43,238,0.08)'
                              : 'rgba(239,68,68,0.08)',
                        borderColor:
                          r.status === 'accepted'
                            ? 'rgba(34,197,94,0.2)'
                            : r.status === 'negotiating'
                              ? 'rgba(205,43,238,0.2)'
                              : 'rgba(239,68,68,0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBannerText,
                        {
                          color:
                            r.status === 'accepted'
                              ? '#22c55e'
                              : r.status === 'negotiating'
                                ? BRAND
                                : '#ef4444',
                        },
                      ]}
                    >
                      {r.status === 'accepted' ? 'Synergy Established' : r.status === 'negotiating' ? 'Negotiation Sent' : 'Declined'}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {incomingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="hub" size={48} color={muted} />
                <Text style={[styles.emptyText, { color: muted }]}>The Pitch Inbox is clear</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'outgoing' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionKicker, { color: muted }]}>Transmitted Pitches</Text>
              <Text style={[styles.helperText, { color: body }]}>Track your project proposals and negotiation cycles.</Text>
            </View>

            {outgoingRequests.map((r) => (
              <View key={r.id} style={[styles.requestCard, { backgroundColor: cardBg, borderColor: border, opacity: r.status === 'withdrawn' ? 0.45 : 1 }]}>
                <View style={styles.rowBetween}>
                  <View style={styles.partnerLeft}>
                    <Image source={{ uri: r.avatar }} style={styles.requestAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.smallMeta, { color: muted }]}>Targeting Partner</Text>
                      <Text style={[styles.partnerName, { color: theme.text }]}>{r.partner}</Text>
                      <Text style={[styles.partnerMeta, { color: muted }]}>{r.handle}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { borderColor: border, backgroundColor: softBg }]}>
                    <Text style={[styles.statusPillText, { color: r.status === 'accepted' ? '#22c55e' : r.status === 'negotiating' ? BRAND : muted }]}>{r.status}</Text>
                  </View>
                </View>

                <View style={[styles.innerPanel, { backgroundColor: subtleBg }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.typeTag, { color: r.type.includes('Premium') ? BRAND : '#60a5fa', borderColor: r.type.includes('Premium') ? 'rgba(205,43,238,0.3)' : 'rgba(96,165,250,0.3)' }]}>{r.type}</Text>
                    <Text style={[styles.splitText, { color: theme.text }]}>{r.split} Split</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{r.title}</Text>
                  <Text style={[styles.cardBody, { color: body }]}>"{r.message}"</Text>
                </View>

                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: softBg }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: r.status === 'pending' ? '33%' : r.status === 'negotiating' ? '66%' : r.status === 'accepted' ? '100%' : '0%',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: muted }]}>
                    {r.status === 'pending' ? 'Reviewing' : r.status === 'negotiating' ? 'Deliberating' : r.status === 'accepted' ? 'Secured' : 'Inactive'}
                  </Text>
                </View>

                {r.status !== 'withdrawn' && r.status !== 'accepted' ? (
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.followUpBtn, { backgroundColor: softBg, borderColor: border }]}>
                      <MaterialIcons name="chat-bubble-outline" size={16} color={theme.text} />
                      <Text style={[styles.followUpText, { color: theme.text }]}>Follow Up</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleWithdrawRequest(r.id)}
                      disabled={isProcessingAction === r.id}
                      style={[styles.withdrawBtn, { borderColor: 'rgba(239,68,68,0.18)' }]}
                    >
                      {isProcessingAction === r.id ? <ActivityIndicator color="#ef4444" size="small" /> : <Text style={styles.withdrawText}>Withdraw</Text>}
                    </Pressable>
                  </View>
                ) : null}

                {r.status === 'accepted' ? (
                  <Pressable onPress={() => navigation.navigate('CommunityPost')} style={styles.greenAction}>
                    <MaterialIcons name="rocket-launch" size={16} color="#fff" />
                    <Text style={styles.greenActionText}>Initialize Project Broadcast</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {outgoingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="send" size={48} color={muted} />
                <Text style={[styles.emptyText, { color: muted }]}>No sent pitches found</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'active' ? (
          <View style={styles.activeEmpty}>
            <View style={[styles.activeBadge, { backgroundColor: isDark ? 'rgba(205,43,238,0.12)' : 'rgba(205,43,238,0.08)', borderColor: 'rgba(205,43,238,0.18)' }]}>
              <MaterialIcons name="handshake" size={34} color={BRAND} />
            </View>
            <Text style={[styles.sectionKicker, { color: muted }]}>Active Partnerships</Text>
            <Text style={[styles.helperTextCentered, { color: body }]}>
              Collaboration nodes are established once a proposal is accepted by both parties.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal 
      visible={!!viewingRequest && isNegotiating}
      transparent 
      animationType="fade" 
      statusBarTranslucent
      onRequestClose={() => setIsNegotiating(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => !isProcessingAction && setIsNegotiating(false)} />
          <View style={[styles.modalSheet, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.12)' }]} />
            {viewingRequest ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Image source={{ uri: viewingRequest.avatar }} style={styles.modalAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Counter Pitch</Text>
                    <Text style={styles.modalAccent}>Adjusting with {viewingRequest.partner}</Text>
                  </View>
                  <Pressable onPress={() => setIsNegotiating(false)} style={[styles.closeBtn, { borderColor: border, backgroundColor: softBg }]}>
                    <MaterialIcons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                <View style={[styles.innerPanel, { backgroundColor: subtleBg, marginBottom: 18 }]}>
                  <Text style={[styles.sectionKicker, { color: muted }]}>Original Terms</Text>
                  <Text style={[styles.cardBody, { color: theme.text }]}>
                    "{viewingRequest.title}" with a {viewingRequest.split} split.
                  </Text>
                </View>

                <Text style={[styles.sectionKicker, { color: muted }]}>New Proposed Split</Text>
                <View style={[styles.rangeCard, { backgroundColor: subtleBg }]}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.rangeLabel, { color: theme.text }]}>YOU</Text>
                    <Text style={styles.rangeValue}>{splitRatio}% / {100 - splitRatio}%</Text>
                    <Text style={[styles.rangeLabel, { color: theme.text }]}>{viewingRequest.partner.split(' ')[0].toUpperCase()}</Text>
                  </View>
                  {renderRange(splitRatio, setSplitRatio)}
                </View>

                <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Negotiation Context</Text>
                <TextInput
                  value={negotiateDraft}
                  onChangeText={setNegotiateDraft}
                  placeholder="Explain why you're proposing these terms..."
                  placeholderTextColor={muted}
                  multiline
                  textAlignVertical="top"
                  style={[styles.textArea, { color: theme.text, backgroundColor: softBg, borderColor: border }]}
                />

                <Pressable onPress={submitNegotiation} disabled={isProcessingAction === viewingRequest.id} style={styles.modalPrimaryBtn}>
                  {isProcessingAction === viewingRequest.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalPrimaryText}>Send Counter Offer</Text>
                  )}
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedPartner} transparent animationType="fade" onRequestClose={() => setSelectedPartner(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => !isSending && setSelectedPartner(null)} />
          <View style={[styles.modalSheet, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.12)' }]} />
            {selectedPartner ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {showSuccess ? (
                  <View style={styles.successWrap}>
                    <View style={styles.successIconWrap}>
                      <MaterialIcons name="handshake" size={52} color="#fff" />
                    </View>
                    <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center' }]}>Pitch Transmitted</Text>
                    <Text style={[styles.helperTextCentered, { color: body }]}>
                      Your synergy proposal has been broadcast to <Text style={{ color: BRAND }}>{selectedPartner.name}</Text>.
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSelectedPartner(null);
                        setShowSuccess(false);
                        setActiveTab('outgoing');
                      }}
                      style={styles.modalPrimaryBtn}
                    >
                      <Text style={styles.modalPrimaryText}>Track Connection</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <Image source={{ uri: selectedPartner.avatar }} style={styles.pitchAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Project Pitch</Text>
                        <Text style={styles.modalAccent}>Targeting {selectedPartner.name}</Text>
                      </View>
                      <Pressable onPress={() => setSelectedPartner(null)} style={[styles.closeBtn, { borderColor: border, backgroundColor: softBg }]}>
                        <MaterialIcons name="close" size={18} color={theme.text} />
                      </Pressable>
                    </View>

                    <View style={[styles.innerPanel, { backgroundColor: isDark ? 'rgba(205,43,238,0.08)' : 'rgba(205,43,238,0.06)' }]}>
                      <Text style={styles.modalAccent}>AI synergy breakdown</Text>
                      <Text style={[styles.cardBody, { color: theme.text }]}>
                        {selectedPartner.synergy || `A collaboration here leverages your synth background with ${selectedPartner.name}'s genre expertise. Predicted subscriber conversion: +12%.`}
                      </Text>
                    </View>

                    <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Distribution Protocol</Text>
                    <View style={styles.protocolGrid}>
                      {DISCOVER_TYPES.map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => setCollabType(type)}
                          style={[
                            styles.protocolCard,
                            {
                              backgroundColor: collabType === type ? BRAND : softBg,
                              borderColor: collabType === type ? BRAND : border,
                            },
                          ]}
                        >
                          <MaterialIcons name={type.includes('Premium') ? 'stars' : 'public'} size={16} color={collabType === type ? '#fff' : theme.text} />
                          <Text style={[styles.protocolText, { color: collabType === type ? '#fff' : theme.text }]}>{type}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Project Identity</Text>
                    <TextInput
                      value={projectTitle}
                      onChangeText={setProjectTitle}
                      placeholder="e.g. Galactic Remix 2024"
                      placeholderTextColor={muted}
                      style={[styles.textField, { color: theme.text, backgroundColor: softBg, borderColor: border }]}
                    />

                    <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Proposal Logic</Text>
                    <TextInput
                      value={proposalDraft}
                      onChangeText={setProposalDraft}
                      placeholder="Describe the synergistic vision..."
                      placeholderTextColor={muted}
                      multiline
                      textAlignVertical="top"
                      style={[styles.textArea, { color: theme.text, backgroundColor: softBg, borderColor: border }]}
                    />

                    <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Pitch Tone</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toneRow}>
                      {(['Professional', 'Hype', 'Chill', 'Mysterious'] as PitchTone[]).map((tone) => (
                        <Pressable
                          key={tone}
                          onPress={() => setPitchTone(tone)}
                          style={[
                            styles.toneChip,
                            {
                              backgroundColor: pitchTone === tone ? BRAND : softBg,
                              borderColor: pitchTone === tone ? BRAND : border,
                            },
                          ]}
                        >
                          <Text style={[styles.toneChipText, { color: pitchTone === tone ? '#fff' : theme.text }]}>{tone}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Text style={[styles.sectionKicker, { color: muted, marginTop: 18 }]}>Revenue Split Strategy</Text>
                    <View style={[styles.rangeCard, { backgroundColor: subtleBg }]}>
                      <View style={styles.rowBetween}>
                        <Text style={[styles.rangeLabel, { color: theme.text }]}>YOU</Text>
                        <Text style={styles.rangeValue}>{splitRatio}% / {100 - splitRatio}%</Text>
                        <Text style={[styles.rangeLabel, { color: theme.text }]}>{selectedPartner.name.split(' ')[0].toUpperCase()}</Text>
                      </View>
                      {renderRange(splitRatio, setSplitRatio)}
                    </View>

                    <Pressable
                      onPress={handleSendProposal}
                      disabled={isSending || !proposalDraft || !projectTitle || isAiDrafting}
                      style={[styles.modalPrimaryBtn, (!proposalDraft || !projectTitle || isSending) && styles.disabledBtn]}
                    >
                      {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalPrimaryText}>Send Proposal</Text>}
                    </Pressable>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(12),
    textTransform: 'uppercase',
    letterSpacing: -0.6,
  },
  neuralPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  neuralText: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  tabRow: {
    gap: 22,
    paddingHorizontal: 4,
  },
  tabBtn: {
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(8),
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(6.5),
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: BRAND,
  },
  content: {
    padding: 18,
    paddingBottom: 42,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionKicker: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
    letterSpacing: 2.6,
  },
  helperText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(10),
  },
  helperTextCentered: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(10),
    textAlign: 'center',
    maxWidth: 260,
  },
  searchWrap: {
    minHeight: 58,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(11),
    paddingHorizontal: 10,
  },
  aiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  partnerCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  partnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
  },
  requestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  partnerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  partnerName: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(11),
    textTransform: 'uppercase',
  },
  partnerMeta: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: scaledFont(7),
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginTop: 4,
  },
  partnerBio: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(8.5),
    marginTop: 6,
  },
  matchText: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(15),
  },
  smallMeta: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(6.5),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7),
    textTransform: 'uppercase',
  },
  requestCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  innerPanel: {
    borderRadius: 24,
    padding: 14,
    gap: 8,
  },
  typeTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(6.4),
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(10.5),
    textTransform: 'uppercase',
  },
  cardBody: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(9),
    lineHeight: scaledFont(14),
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(9),
    textTransform: 'uppercase',
  },
  secondaryMiniBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryMiniBtnText: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(8.5),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  iconAction: {
    width: 52,
    height: 52,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    minHeight: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND,
  },
  progressText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(6.6),
    textTransform: 'uppercase',
  },
  followUpBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  followUpText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
  },
  withdrawBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: {
    color: '#ef4444',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
  },
  greenAction: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  greenActionText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(6.5),
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(8),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  activeEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    gap: 14,
  },
  activeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 44,
    height: 6,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
  },
  pitchAvatar: {
    width: 76,
    height: 76,
    borderRadius: 26,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(18),
    textTransform: 'uppercase',
  },
  modalAccent: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.5),
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginTop: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeCard: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  rangeLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(8),
  },
  rangeValue: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(14),
  },
  rangeWrap: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  rangeStep: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: scaledFont(10),
  },
  textField: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: scaledFont(10),
  },
  modalPrimaryBtn: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalPrimaryText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(8.5),
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  successWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 34,
    gap: 18,
  },
  successIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  protocolCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  protocolText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.4),
    textTransform: 'uppercase',
  },
  toneRow: {
    gap: 8,
  },
  toneChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toneChipText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: scaledFont(7.4),
  },
});

export default CollaborationHub;
