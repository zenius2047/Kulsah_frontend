import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Image,
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
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

type CollabTab = 'discover' | 'incoming' | 'outgoing' | 'active';
type ProjectType = 'Public Feed Track' | 'Premium Locked Release' | 'Event' | 'Live Session' | 'All';

type CreatorPartner = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  genres: string[];
  vibeMatch: number;
  status: 'available' | 'busy' | 'selective';
  bio: string;
};

type CollabRequest = {
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
  isIncoming?: boolean;
  isNew?: boolean;
  matchScore: number;
};

const TABS: CollabTab[] = ['discover', 'incoming', 'outgoing', 'active'];
const FILTERS: ProjectType[] = ['All', 'Public Feed Track', 'Premium Locked Release', 'Event', 'Live Session'];

const CollaborationHub: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState<CollabTab>('discover');
  const [incomingFilter, setIncomingFilter] = useState<ProjectType>('All');
  const [vibeQuery, setVibeQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [partners, setPartners] = useState<CreatorPartner[]>([
    { id: 'p1', name: 'Zion King', handle: '@zion_afro', avatar: 'https://picsum.photos/seed/zion/150', genres: ['Afrobeats', 'Soul'], vibeMatch: 94, status: 'available', bio: 'Afrobeats pioneer looking for global sounds.' },
    { id: 'p2', name: 'Elena Rose', handle: '@elena_r', avatar: 'https://picsum.photos/seed/elena/150', genres: ['Synthwave', 'Indie'], vibeMatch: 88, status: 'selective', bio: 'Ethereal vocals and analog synthesis.' },
    { id: 'p3', name: 'Luna Ray', handle: '@luna_ray', avatar: 'https://picsum.photos/seed/luna/150', genres: ['Pop', 'Electronic'], vibeMatch: 72, status: 'busy', bio: 'Vibrant pop productions for the galaxy.' },
    { id: 'p4', name: 'The Glitch', handle: '@glitch_ops', avatar: 'https://picsum.photos/seed/glitch/150', genres: ['Techno', 'House'], vibeMatch: 65, status: 'available', bio: 'Industrial soundscapes and deep house.' },
  ]);

  const [requests, setRequests] = useState<CollabRequest[]>([
    { id: 'r1', partner: 'Amara', handle: '@amara_vocal', avatar: 'https://picsum.photos/seed/amara/100', genres: ['Afrobeats', 'R&B'], type: 'Event', title: 'Winter Solstice Live', message: 'Hey! Want to co-headline the Winter Solstice show in Berlin?', split: '50/50', date: '2h ago', status: 'pending', isIncoming: true, isNew: true, matchScore: 92 },
    { id: 'r2', partner: 'Echo Vibe', handle: '@echo_beats', avatar: 'https://picsum.photos/seed/echo/100', genres: ['Trap', 'Experimental'], type: 'Public Feed Track', title: 'Cosmic Bass (Edit)', message: 'I have a heavy beat that needs your ethereal pads.', split: '60/40', date: '1d ago', status: 'accepted', isIncoming: true, matchScore: 85 },
    { id: 'o1', partner: 'The Glitch', handle: '@glitch_ops', avatar: 'https://picsum.photos/seed/glitch/150', genres: ['Techno', 'House'], type: 'Live Session', title: 'Techno-Soul Improv', message: 'Loved your last industrial set.', split: '40/60', date: '5h ago', status: 'pending', isIncoming: false, matchScore: 65 },
    { id: 'o2', partner: 'Luna Ray', handle: '@luna_ray', avatar: 'https://picsum.photos/seed/luna/150', genres: ['Pop', 'Electronic'], type: 'Public Feed Track', title: 'Starlight Remix', message: 'I drafted a synthwave remix.', split: '50/50', date: '2d ago', status: 'negotiating', isIncoming: false, matchScore: 72 },
  ]);

  useEffect(() => {
    const tab = (route.params as { tab?: CollabTab } | undefined)?.tab;
    if (tab) setActiveTab(tab);
  }, [route.params]);

  const incomingCount = useMemo(
    () => requests.filter((r) => r.isIncoming && r.status === 'pending').length,
    [requests],
  );

  const visibleIncoming = useMemo(
    () => requests.filter((r) => r.isIncoming && (incomingFilter === 'All' || r.type === incomingFilter)),
    [requests, incomingFilter],
  );

  const outgoing = useMemo(() => requests.filter((r) => !r.isIncoming), [requests]);

  const runAiSearch = async () => {
    if (!vibeQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Analyze this collaboration vibe query: "${vibeQuery}" and suggest match improvements.`,
        });
      }
      setPartners((prev) =>
        prev.map((p) => ({
          ...p,
          vibeMatch: Math.min(100, p.vibeMatch + Math.floor(Math.random() * 4)),
        })),
      );
    } catch {
      // no-op fallback for UI
    } finally {
      setIsAiSearching(false);
    }
  };

  const updateRequest = (id: string, status: CollabRequest['status']) => {
    setProcessingId(id);
    setTimeout(() => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, isNew: false } : r)));
      setProcessingId(null);
    }, 800);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()}>
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Collaboration Hub</Text>
          </View>
          {/* <View style={styles.pill}>
            <Text style={styles.pillText}>Neural Active</Text>
          </View> */}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: active ? '#cd2bee' : theme.textMuted }]}>{tab.toUpperCase()}</Text>
                {tab === 'incoming' && incomingCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{incomingCount}</Text></View> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'discover' ? (
          <View style={styles.stack}>
            <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                value={vibeQuery}
                onChangeText={setVibeQuery}
                placeholder="Describe your sonic vision..."
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.text }]}
              />
              <Pressable onPress={runAiSearch} disabled={isAiSearching || !vibeQuery.trim()} style={styles.aiBtn}>
                {isAiSearching ? <ActivityIndicator color="#fff" /> : <MaterialIcons name="auto-awesome" size={18} color="#fff" />}
              </Pressable>
            </View>

            {partners.map((p) => (
              <View key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.partnerLeft}>
                  <Image source={{ uri: p.avatar }} style={styles.avatar} />
                  <View>
                    <Text style={[styles.partnerName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>{p.genres.join(' • ')}</Text>
                  </View>
                </View>
                <Text style={styles.match}>{p.vibeMatch}%</Text>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'incoming' ? (
          <View style={styles.stack}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setIncomingFilter(f)}
                  style={[styles.filterBtn, incomingFilter === f && styles.filterBtnActive, { borderColor: theme.border }]}
                >
                  <Text style={[styles.filterText, { color: incomingFilter === f ? '#fff' : theme.textSecondary }]}>{f}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {visibleIncoming.map((r) => (
              <View key={r.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.partnerLeft}>
                  <Image source={{ uri: r.avatar }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.partnerName, { color: theme.text }]}>{r.partner}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>{r.title}</Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>{r.split} • {r.date}</Text>
                  </View>
                </View>
                {r.status === 'pending' ? (
                  <View style={styles.actions}>
                    <Pressable onPress={() => updateRequest(r.id, 'accepted')} style={styles.acceptBtn}>
                      {processingId === r.id ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="check" size={18} color="#fff" />}
                    </Pressable>
                    <Pressable onPress={() => updateRequest(r.id, 'declined')} style={[styles.acceptBtn, { backgroundColor: '#334155' }]}>
                      <MaterialIcons name="close" size={18} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <Text style={[styles.meta, { color: '#cd2bee' }]}>{r.status.toUpperCase()}</Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'outgoing' ? (
          <View style={styles.stack}>
            {outgoing.map((r) => (
              <View key={r.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.partnerLeft}>
                  <Image source={{ uri: r.avatar }} style={styles.avatar} />
                  <View>
                    <Text style={[styles.partnerName, { color: theme.text }]}>{r.partner}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>{r.title}</Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>{r.status.toUpperCase()}</Text>
                  </View>
                </View>
                {r.status !== 'withdrawn' && r.status !== 'accepted' ? (
                  <Pressable onPress={() => updateRequest(r.id, 'withdrawn')}>
                    <MaterialIcons name="block" size={20} color="#ef4444" />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'active' ? (
          <View style={styles.empty}>
            <MaterialIcons name="handshake" size={48} color="#cd2bee" />
            <Text style={[styles.meta, { color: theme.textSecondary }]}>Active partnerships will appear here.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: mediumScreen? fontScale(16): fontScale(12), textTransform: 'uppercase' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(205,43,238,0.15)', borderWidth: 1, borderColor: 'rgba(205,43,238,0.3)' },
  pillText: { color: '#cd2bee', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase' },
  tabRow: { gap: 16 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8 },
  tabText: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: mediumScreen ? fontScale(13):fontScale(9), letterSpacing: 1 },
  badge: { minWidth: 16, height: 16, borderRadius: 999, paddingHorizontal: 4, backgroundColor: '#cd2bee', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7) },
  content: { padding: 16, paddingBottom: 36 },
  stack: { gap: 12 },
  searchWrap: { minHeight: 54, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  input: { flex: 1, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(11), paddingHorizontal: 8 },
  aiBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#cd2bee', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 22, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  partnerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 16 },
  partnerName: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(10) },
  meta: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(8) },
  match: { color: '#cd2bee', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(11) },
  filters: { gap: 8, paddingBottom: 6 },
  filterBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'transparent' },
  filterBtnActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  filterText: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7), textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#cd2bee', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
});

export default CollaborationHub;

