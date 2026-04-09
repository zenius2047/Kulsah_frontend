import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  FlatList,
  Image,
  Pressable,
  StatusBar,
  // SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediumScreen } from '../types';


type MessageTab = 'direct' | 'subs' | 'pitches';
type ChatType = 'direct' | 'pitches';
type TierType = 'Gold' | 'Silver' | null;

interface ChatItem {
  id: string;
  name: string;
  msg: string;
  time: string;
  unread: boolean;
  tier: TierType;
  ltv?: string;
  img: string;
  type: ChatType;
}

const CHATS: ChatItem[] = [
  {
    id: 'Alex_Rivera',
    name: 'Alex Rivera',
    msg: "Loved the new track! Can't wait for...",
    time: 'Just now',
    unread: true,
    tier: 'Gold',
    ltv: '$450',
    img: 'https://picsum.photos/seed/chat1/100/100',
    type: 'direct',
  },
  {
    id: 'Sarah_Chen',
    name: 'Sarah Chen',
    msg: 'Will there be a meet and greet in...',
    time: '12m',
    unread: false,
    tier: 'Silver',
    ltv: '$120',
    img: 'https://picsum.photos/seed/chat2/100/100',
    type: 'direct',
  },
  {
    id: 'Marcus_Thorne',
    name: 'Marcus Thorne',
    msg: 'Yo! Great performance at the festival...',
    time: '1h',
    unread: false,
    tier: null,
    ltv: '$0',
    img: 'https://picsum.photos/seed/chat3/100/100',
    type: 'direct',
  },
  {
    id: 'Amara',
    name: 'Amara',
    msg: 'Project Pitch: Winter Solstice Live Collaboration',
    time: '3h',
    unread: true,
    tier: null,
    img: 'https://picsum.photos/seed/amara/100',
    type: 'pitches',
  },
  {
    id: 'Elena_Rodriguez',
    name: 'Elena Rodriguez',
    msg: 'I just upgraded my tier! Looking forward...',
    time: '2h',
    unread: false,
    tier: 'Gold',
    ltv: '$210',
    img: 'https://picsum.photos/seed/chat4/100/100',
    type: 'direct',
  },
];

const TABS: MessageTab[] = ['direct', 'subs', 'pitches'];

const tabLabel = (tab: MessageTab) => {
  if (tab === 'direct') return 'Direct';
  if (tab === 'subs') return 'Supporters';
  return 'Pitches';
};

const Messages: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<MessageTab>('direct');
  const [search, setSearch] = useState('');

  const filteredChats = useMemo(() => {
    return CHATS.filter((chat) => {
      const matchesSearch = chat.name.toLowerCase().includes(search.toLowerCase());
      if (activeTab === 'direct') return matchesSearch && chat.type === 'direct';
      if (activeTab === 'subs') return matchesSearch && chat.type === 'direct' && chat.tier !== null;
      if (activeTab === 'pitches') return matchesSearch && chat.type === 'pitches';
      return matchesSearch;
    });
  }, [activeTab, search]);

  const openChat = (chat: ChatItem) => {
    if (chat.type === 'pitches') {
      navigation.navigate('CollaborationHub', { tab: 'incoming' });
      return;
    }
    navigation.navigate('Chat', { id: chat.id });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent = {true} />
      <View style={[styles.container, { backgroundColor: theme.screen }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1f1022d4' : theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarWrap, { borderColor: '#D946EF' }]}>
                <Image source={{ uri: 'https://picsum.photos/seed/mila/100' }} style={styles.avatar} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>INBOX</Text>
                <Text style={styles.subtitle}>CREATOR PROTOCOL</Text>
              </View>
            </View>
            <Pressable style={[styles.iconButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface }]}>
              <MaterialIcons name="edit-note" size={22} color="#D946EF" />
            </Pressable>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.surface, borderColor: theme.border }]}>
            <View style={styles.summaryCol}>
              <View style={styles.summaryIconWrap}>
                <MaterialIcons name="psychology" size={20} color="#D946EF" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>SUPPORT DENSITY</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>4 Pending Subscriber DMs</Text>
              </View>
            </View>
            <View>
              <Text style={styles.summaryLabelActive}>ACTIVE PITCHES</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>2 Unreviewed</Text>
            </View>
          </View>

          <View style={[styles.searchWrap, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface }]}>
            <MaterialIcons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search fans or collaborators..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <View style={[styles.tabsWrap, { borderBottomColor: theme.border }]}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
                  <Text style={[styles.tabText, { color: theme.textMuted }, isActive && styles.tabTextActive]}>{tabLabel(tab)}</Text>
                  {isActive ? <View style={styles.activeBar} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredChats.length === 0 ? styles.emptyContent : styles.listContent}
          renderItem={({ item }) => {
            const isPitch = item.type === 'pitches';
            const isGold = item.tier === 'Gold';
            const isSilver = item.tier === 'Silver';

            return (
              <Pressable
                style={[
                  styles.row,
                  { borderBottomColor: theme.border },
                  item.unread && [styles.rowUnread, { backgroundColor: isDark ? 'rgba(217,70,239,0.08)' : theme.accentSoft }],
                ]}
                onPress={() => openChat(item)}
              >
                <View style={styles.rowAvatarWrap}>
                  <View
                    style={[
                      styles.rowAvatarBorder,
                      isGold && styles.rowAvatarGold,
                      isSilver && styles.rowAvatarSilver,
                      isPitch && styles.rowAvatarPitch,
                    ]}
                  >
                    <Image source={{ uri: item.img }} style={styles.rowAvatar} />
                  </View>

                  {item.tier ? (
                    <View style={[styles.tierBadge, isGold ? styles.tierGold : styles.tierSilver]}>
                      <MaterialIcons name="stars" size={10} color={isGold ? '#111827' : '#FFFFFF'} />
                    </View>
                  ) : null}

                  {item.unread ? <View style={styles.unreadDot} /> : null}
                </View>

                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <View style={styles.nameWrap}>
                      <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      {isPitch ? (
                        <Text style={styles.pitchBadge}>COLLAB PITCH</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.time, { color: item.unread ? '#D946EF' : theme.textMuted }]}>{item.time}</Text>
                  </View>

                  <Text numberOfLines={1} style={[styles.message, { color: item.unread ? theme.text : theme.textSecondary }, item.unread && styles.messageUnread]}>
                    {item.msg}
                  </Text>

                  {item.tier ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaTier}>{item.tier} MEMBERSHIP</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.metaLtv}>LTV: {item.ltv}</Text>
                    </View>
                  ) : null}
                </View>

                <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="chat-bubble-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>NO TRANSMISSIONS IN THIS ORBIT</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1f1022d4',
  },
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#1f1022d4',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#D946EF',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#F8FAFC',
    fontSize: mediumScreen?21:18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#D946EF',
    fontSize: mediumScreen?12:8,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  summaryCard: {
    marginTop: 12,
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,70,239,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.35)',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: mediumScreen?13:9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  summaryLabelActive: {
    color: '#D946EF',
    fontSize: mediumScreen?13:9,
    fontWeight: '900',
    letterSpacing: 1.8,
    textAlign: 'right',
  },
  summaryValue: {
    color: '#F8FAFC',
    fontSize: mediumScreen ? 15:11,
    fontWeight: '700',
    marginTop: 2,
  },
  searchWrap: {
    marginTop: 12,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: mediumScreen?18:14,
    fontWeight: '500',
  },
  tabsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabButton: {
    paddingTop: 8,
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    color: '#64748B',
    fontSize: mediumScreen?14:10,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#D946EF',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D946EF',
  },
  listContent: {
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowUnread: {
    backgroundColor: 'rgba(217,70,239,0.08)',
  },
  rowAvatarWrap: {
    position: 'relative',
  },
  rowAvatarBorder: {
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  rowAvatarGold: {
    borderColor: '#EAB308',
  },
  rowAvatarSilver: {
    borderColor: '#94A3B8',
  },
  rowAvatarPitch: {
    borderColor: 'rgba(217,70,239,0.55)',
  },
  rowAvatar: {
    width: '100%',
    height: '100%',
  },
  tierBadge: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0B1220',
  },
  tierGold: {
    backgroundColor: '#EAB308',
  },
  tierSilver: {
    backgroundColor: '#94A3B8',
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D946EF',
    borderWidth: 2,
    borderColor: '#0B1220',
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  name: {
    color: '#F8FAFC',
    fontSize: mediumScreen?16:13,
    fontWeight: '900',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  pitchBadge: {
    color: '#D946EF',
    fontSize: mediumScreen?12:8,
    fontWeight: '900',
    letterSpacing: 1.1,
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(217,70,239,0.12)',
  },
  time: {
    color: '#64748B',
    fontSize: mediumScreen?14:10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  timeUnread: {
    color: '#D946EF',
  },
  message: {
    color: '#94A3B8',
    fontSize: mediumScreen?17:13,
    fontWeight: '500',
  },
  messageUnread: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTier: {
    color: '#D946EF',
    fontSize: mediumScreen?13:9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  metaLtv: {
    color: '#4ADE80',
    fontSize: mediumScreen?13:9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 10,
    opacity: 0.75,
  },
  emptyText: {
    color: '#64748B',
    fontSize: mediumScreen?14:10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default Messages;
