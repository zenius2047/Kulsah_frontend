import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleGenAI } from '@google/genai';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from '../typography';
import { parseApiError, useBlockCreatorSubscription } from '../src';

type TabType = 'subs' | 'followers' | 'following';
type FanStatus = 'active' | 'superfan' | 'at-risk' | 'new';

interface CommunityMember {
  id: string;
  name: string;
  handle: string;
  img: string;
  tier?: 'Gold' | 'Silver' | 'Bronze';
  score?: number;
  isCreator?: boolean;
  status?: string;
  fanStatus?: FanStatus;
  joinedDate?: string;
  ltv?: string;
}

const SUBSCRIBERS: CommunityMember[] = [
  { id: 's1', name: 'Marcus Thorne', handle: '@mthorne', tier: 'Gold', score: 98, img: 'https://picsum.photos/seed/f1/100', fanStatus: 'superfan', joinedDate: 'Jan 2024', ltv: '$450.00' },
  { id: 's2', name: 'Sarah Chen', handle: '@schen_music', tier: 'Silver', score: 85, img: 'https://picsum.photos/seed/f2/100', fanStatus: 'active', joinedDate: 'Mar 2024', ltv: '$120.00' },
  { id: 's3', name: 'Alex Rivera', handle: '@alex_vibes', tier: 'Silver', score: 42, img: 'https://picsum.photos/seed/f3/100', fanStatus: 'at-risk', joinedDate: 'Feb 2024', ltv: '$90.00' },
  { id: 's4', name: 'Dante King', handle: '@dante_k', tier: 'Bronze', score: 75, img: 'https://picsum.photos/seed/f5/100', fanStatus: 'new', joinedDate: 'Aug 2024', ltv: '$9.99' },
];

const FOLLOWERS: CommunityMember[] = [
  { id: 'f1', name: 'Lila Grace', handle: '@lilagrace', score: 45, img: 'https://picsum.photos/seed/f4/100' },
  { id: 'f2', name: 'Echo Hunter', handle: '@echohunter', score: 38, img: 'https://picsum.photos/seed/f6/100' },
  { id: 'f3', name: 'Maya Sol', handle: '@mayasol', score: 67, img: 'https://picsum.photos/seed/f7/100', fanStatus: 'new' },
];

const FOLLOWING: CommunityMember[] = [
  { id: 'c1', name: 'Elena Rose', handle: '@elenarose', isCreator: true, status: 'LIVE', img: 'https://picsum.photos/seed/elena/100' },
  { id: 'c2', name: 'Nova Grey', handle: '@novagrey', isCreator: true, status: 'CREATOR', img: 'https://picsum.photos/seed/nova/100' },
];

const TAB_LABELS: Record<TabType, string> = {
  subs: 'Subscribers',
  followers: 'Followers',
  following: 'Following',
};

const statusColors: Record<FanStatus, string> = {
  active: '#22c55e',
  superfan: '#f59e0b',
  'at-risk': '#ef4444',
  new: '#3b82f6',
};

const Subscribers: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('subs');
  const [search, setSearch] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [notes, setNotes] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const blockSubscription = useBlockCreatorSubscription();

  const screen = isDark ? '#060913' : theme.background;
  const headerBackground = isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.92)';
  const surface = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const elevated = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const modalSurface = isDark ? '#111827' : theme.card;
  const modalControlSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const text = isDark ? '#ffffff' : theme.text;
  const secondary = isDark ? '#a9a3ad' : theme.textSecondary;
  const muted = isDark ? '#706a74' : theme.textMuted;

  const source = activeTab === 'subs' ? SUBSCRIBERS : activeTab === 'followers' ? FOLLOWERS : FOLLOWING;
  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return source;
    return source.filter((member) =>
      member.name.toLowerCase().includes(query) || member.handle.toLowerCase().includes(query),
    );
  }, [search, source]);

  const runAudiencePulse = async () => {
    setIsAuditing(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Missing API key');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Analyze a creator community with 842 paid subscribers and 14.2k followers. Alex Rivera is at risk with a 42% engagement score. Give one concise retention action.",
      });
      setAiInsight(response.text || 'Reach out to Alex with a personal preview of the next member drop before their engagement declines further.');
    } catch {
      setAiInsight('Reconnect with at-risk subscribers using a personal message and an early preview of your next member-only release.');
    } finally {
      setIsAuditing(false);
    }
  };

  const openBlockModal = () => {
    setBlockReason('');
    setIsBlockModalOpen(true);
  };

  const submitBlock = async () => {
    if (!selectedMember || !blockReason.trim()) {
      Alert.alert('Reason required', 'Add a reason before blocking this subscriber.');
      return;
    }
    try {
      await blockSubscription.mutateAsync({
        subscription: selectedMember.id,
        payload: { reason: blockReason.trim(), requires_admin_review: true },
      });
      setBlockedIds((current) => [...new Set([...current, selectedMember.id])]);
      setIsBlockModalOpen(false);
      setSelectedMember(null);
      Alert.alert('Subscriber blocked', `${selectedMember.name} has been blocked from this subscription.`);
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  return (
    <View style={[s.screen, { backgroundColor: screen }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={[s.safeArea, { backgroundColor: screen }]}>
        <View style={[s.header, { backgroundColor: headerBackground }]}>
          <Text style={[s.title, { color: text }]}>COMMUNITY HUB</Text>
        </View>

        <View style={[s.searchBox, { backgroundColor: elevated, borderColor: border }]}>
          <MaterialIcons name="search" size={20} color={muted} />
          <TextInput
            includeFontPadding={false}
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${TAB_LABELS[activeTab].toLowerCase()}`}
            placeholderTextColor={muted}
            style={[s.searchInput, { color: text }]}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <MaterialIcons name="cancel" size={18} color={muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={s.tabs}>
          {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tab}>
                <Text style={[s.tabText, { color: active ? PRIMARY_COLOR : muted }]}>{TAB_LABELS[tab]}</Text>
                <View style={[s.tabIndicator, active && { backgroundColor: PRIMARY_COLOR }]} />
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* {activeTab === 'subs' ? (
          <View style={[s.pulseCard, { backgroundColor: primaryColorAlpha(isDark ? 0.1 : 0.07), borderColor: primaryColorAlpha(0.24) }]}>
            <View style={s.pulseHeader}>
              <View style={[s.pulseIcon, { backgroundColor: primaryColorAlpha(0.16) }]}>
                <MaterialIcons name="auto-awesome" size={19} color={PRIMARY_COLOR} />
              </View>
              <View style={s.flexOne}>
                <Text style={s.pulseTitle}>Audience Pulse</Text>
                <Text style={[s.pulseMeta, { color: muted }]}>Creator relationship intelligence</Text>
              </View>
            </View>
            <Text style={[s.pulseBody, { color: secondary }]}>
              {aiInsight || 'Spot changes in supporter behavior and find the right moment to reconnect.'}
            </Text>
            <Pressable onPress={runAudiencePulse} disabled={isAuditing} style={[s.pulseButton, { backgroundColor: primaryColorAlpha(0.16) }]}>
              {isAuditing ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : <MaterialIcons name="insights" size={17} color={PRIMARY_COLOR} />}
              <Text style={s.pulseButtonText}>{isAuditing ? 'Analyzing community' : 'Find retention opportunities'}</Text>
            </Pressable>
          </View>
        ) : null} */}

        <View style={s.list}>
          {filteredList.map((member) => {
            const memberStatus = member.fanStatus;
            return (
              <Pressable
                key={member.id}
                onPress={() => {
                  setNotes('');
                  setSelectedMember(member);
                }}
                style={({ pressed }) => [
                  s.memberCard,
                  { backgroundColor: surface, borderColor: border },
                  pressed && s.pressed,
                ]}
              >
                <View style={s.avatarWrap}>
                  <Image source={{ uri: member.img }} style={s.avatar} />
                  {memberStatus ? <View style={[s.statusDot, { backgroundColor: statusColors[memberStatus], borderColor: surface }]} /> : null}
                </View>
                <View style={s.memberCopy}>
                  <View style={s.nameRow}>
                    <Text numberOfLines={1} style={[s.memberName, { color: text }]}>{member.name}</Text>
                    {member.status === 'LIVE' ? <Text style={s.liveBadge}>LIVE</Text> : null}
                  </View>
                  <View style={s.detailRow}>
                    <Text style={[s.handle, { color: muted }]}>{member.handle}</Text>
                    {memberStatus ? (
                      <View style={[s.statusBadge, { backgroundColor: `${statusColors[memberStatus]}18` }]}>
                        <Text style={[s.statusText, { color: statusColors[memberStatus] }]}>{memberStatus}</Text>
                      </View>
                    ) : null}
                    {blockedIds.includes(member.id) ? <Text style={s.blockedText}>BLOCKED</Text> : null}
                  </View>
                </View>
                {member.score !== undefined ? (
                  <View style={s.scoreWrap}>
                    <Text style={s.score}>{member.score}%</Text>
                    <Text style={[s.scoreLabel, { color: muted }]}>Score</Text>
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={22} color={muted} />
                )}
              </Pressable>
            );
          })}
          {filteredList.length === 0 ? (
            <View style={s.empty}>
              <MaterialIcons name="person-search" size={34} color={muted} />
              <Text style={[s.emptyTitle, { color: text }]}>No matches found</Text>
              <Text style={[s.emptyBody, { color: muted }]}>Try another name or handle.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={!!selectedMember} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSelectedMember(null)}>
        <View style={s.modalRoot}>
          <Pressable style={s.backdrop} onPress={() => setSelectedMember(null)} />
          {selectedMember ? (
            <View style={[s.sheet, { backgroundColor: modalSurface, borderColor: border, paddingBottom: Math.max(insets.bottom, 18) }]}>
              <View style={[s.sheetHandle, { backgroundColor: border }]} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetContent}>
                <View style={s.profileHeader}>
                  <Image source={{ uri: selectedMember.img }} style={s.profileAvatar} />
                  <Text style={[s.profileName, { color: text }]}>{selectedMember.name}</Text>
                  <Text style={s.profileHandle}>{selectedMember.handle}</Text>
                </View>

                <View style={s.metrics}>
                  <View style={[s.metric, { backgroundColor: modalControlSurface, borderColor: border }]}>
                    <Text style={[s.metricLabel, { color: muted }]}>Lifetime value</Text>
                    <Text style={s.metricValue}>{selectedMember.ltv || '$0.00'}</Text>
                  </View>
                  <View style={[s.metric, { backgroundColor: modalControlSurface, borderColor: border }]}>
                    <Text style={[s.metricLabel, { color: muted }]}>Supporter since</Text>
                    <Text style={[s.metricValue, { color: text }]}>{selectedMember.joinedDate || 'New'}</Text>
                  </View>
                </View>

                <Text style={[s.sheetLabel, { color: muted }]}>Private relationship notes</Text>
                <TextInput
                  includeFontPadding={false}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Add context for your next conversation..."
                  placeholderTextColor={muted}
                  style={[s.notesInput, { color: text, backgroundColor: modalControlSurface, borderColor: border }]}
                />

                <Text style={[s.sheetLabel, { color: muted }]}>Recent interactions</Text>
                <View style={[s.historyCard, { backgroundColor: modalControlSurface, borderColor: border }]}>
                  <View style={s.historyRow}>
                    <MaterialIcons name="stars" size={17} color={PRIMARY_COLOR} />
                    <Text style={[s.historyText, { color: secondary }]}>Joined {selectedMember.tier || 'community'} membership · 2w ago</Text>
                  </View>
                  <View style={[s.divider, { backgroundColor: border }]} />
                  <View style={s.historyRow}>
                    <MaterialIcons name="chat-bubble" size={16} color="#3b82f6" />
                    <Text style={[s.historyText, { color: secondary }]}>Interacted during your latest live session · 3w ago</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    setSelectedMember(null);
                    navigation.navigate('Chat', { id: selectedMember.id, name: selectedMember.name });
                  }}
                  style={s.messageButton}
                >
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={s.messageButtonText}>Send priority message</Text>
                </Pressable>
                {activeTab === 'subs' && !blockedIds.includes(selectedMember.id) ? (
                  <Pressable onPress={openBlockModal} style={[s.blockButton, { borderColor: border }]}>
                    <Text style={s.blockButtonText}>Block subscriber</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal visible={isBlockModalOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setIsBlockModalOpen(false)}>
        <View style={s.confirmRoot}>
          <Pressable style={s.backdrop} onPress={() => setIsBlockModalOpen(false)} />
          <View style={[s.confirmCard, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[s.confirmTitle, { color: text }]}>Block subscriber?</Text>
            <Text style={[s.confirmBody, { color: secondary }]}>Access will be suspended and the request will be sent for admin review.</Text>
            <TextInput
              includeFontPadding={false}
              value={blockReason}
              onChangeText={setBlockReason}
              multiline
              maxLength={2000}
              placeholder="Reason for blocking"
              placeholderTextColor={muted}
              style={[s.blockInput, { color: text, backgroundColor: elevated, borderColor: border }]}
            />
            <View style={s.confirmActions}>
              <Pressable onPress={() => setIsBlockModalOpen(false)} style={[s.confirmButton, { borderColor: border }]}>
                <Text style={[s.confirmButtonText, { color: secondary }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitBlock()} disabled={blockSubscription.isPending} style={[s.confirmButton, s.dangerButton]}>
                {blockSubscription.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[s.confirmButtonText, { color: '#fff' }]}>Block</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { zIndex: 2 },
  header: {paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', letterSpacing: 2 },
  searchBox: { height: 48, marginHorizontal: 16, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, paddingVertical: 0, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  tabs: { marginTop: 12, paddingHorizontal: 12, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingTop: 9, gap: 9 },
  tabText: { ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, textTransform: 'uppercase', letterSpacing: 0.7 },
  tabIndicator: { width: 30, height:2, borderRadius: 2, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  pulseCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 13 },
  pulseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  flexOne: { flex: 1 },
  pulseTitle: { color: PRIMARY_COLOR, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  pulseMeta: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, marginTop: 2 },
  pulseBody: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  pulseButton: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pulseButtonText: { color: PRIMARY_COLOR, ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  list: { gap: 10 },
  memberCard: { minHeight: 76, padding: 12, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  statusDot: { position: 'absolute', right: -1, top: -1, width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  memberCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { flexShrink: 1, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  liveBadge: { color: '#fff', backgroundColor: '#ef4444', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight },
  detailRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  handle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  statusText: { ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase' },
  blockedText: { color: '#ef4444', ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight },
  scoreWrap: { alignItems: 'flex-end' },
  score: { color: PRIMARY_COLOR, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  scoreLabel: { ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 7 },
  emptyTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  emptyBody: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    maxHeight: '91%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 18,
  },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10 },
  sheetContent: { padding: 20, gap: 14 },
  profileHeader: { alignItems: 'center', gap: 4 },
  profileAvatar: { width: 84, height: 84, borderRadius: 28, borderWidth: 3, borderColor: PRIMARY_COLOR, marginBottom: 7 },
  profileName: { ...fontSize.n3, lineHeight: fontSize.n3.lineHeight },
  profileHandle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14 },
  metricLabel: { ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 0.7 },
  metricValue: { color: '#22c55e', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, marginTop: 5 },
  sheetLabel: { ...fontSize.b5Variant, lineHeight: fontSize.b5Variant.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
  notesInput: { minHeight: 90, borderRadius: 18, borderWidth: 1, padding: 14, textAlignVertical: 'top', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  historyCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  historyRow: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyText: { flex: 1, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 42 },
  messageButton: { minHeight: 52, borderRadius: 17, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  messageButtonText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  blockButton: { minHeight: 46, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  blockButtonText: { color: '#ef4444', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  confirmRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  confirmCard: { width: '100%', maxWidth: 420, borderRadius: 24, borderWidth: 1, padding: 18, gap: 12 },
  confirmTitle: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight },
  confirmBody: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  blockInput: { minHeight: 96, borderRadius: 16, borderWidth: 1, padding: 13, textAlignVertical: 'top', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  confirmActions: { flexDirection: 'row', gap: 10 },
  confirmButton: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dangerButton: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  confirmButtonText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
});

export default Subscribers;
