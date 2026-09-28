import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { useMarkNotificationRead, useNotifications } from '../src/hooks/queries/useNotifications';
import type { AppNotification } from '../src/types/notification.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { fontSize } from './typography';

const field = (data: Record<string, unknown>, name: string) => {
  const value = data[name];
  return value == null || String(value).trim() === '' ? undefined : String(value);
};

const timeAgo = (value?: string | null) => {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
};

const notificationIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
  if (type === 'challenge.invited') return 'sports-kabaddi';
  if (type === 'live.battle_invited') return 'sports-mma';
  if (type === 'live.started') return 'live-tv';
  if (type.includes('message')) return 'chat-bubble';
  if (type.includes('mention')) return 'alternate-email';
  if (type.includes('follow')) return 'person-add';
  if (type.includes('wallet') || type.includes('payout')) return 'account-balance-wallet';
  return 'notifications';
};

const Notifications: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const colors = useMemo(() => ({
    background: isDark ? '#060913' : theme.background,
    card: isDark ? '#111722' : theme.card,
    border: isDark ? 'rgba(255,255,255,0.1)' : theme.border,
    text: isDark ? '#f7f5f8' : theme.text,
    secondary: isDark ? '#94a3b8' : theme.textSecondary,
    unread: isDark ? 'rgba(255,43,131,0.14)' : primaryColorAlpha(0.08),
  }), [isDark, theme]);

  const openNotification = useCallback(async (notification: AppNotification) => {
    if (!notification.read_at) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch (error) {
        console.warn('Unable to mark notification as read.', getApiErrorMessage(error));
      }
    }

    const type = notification.type.toLowerCase();
    const data = notification.data;
    if (type === 'challenge.invited') {
      const challengeId = field(data, 'challenge_id') ?? field(data, 'challengeId');
      if (challengeId) navigation.navigate('ChallengeEntry', { challengeId, inviteId: field(data, 'invite_id') });
    } else if (type === 'live.battle_invited') {
      const liveSessionId = field(data, 'live_id');
      if (liveSessionId) navigation.navigate('CreatorBattleParticipantScreen', {
        liveSessionId,
        battleId: field(data, 'battle_id'),
        participantRole: 'opponent',
      });
    } else if (type === 'live.started') {
      const liveSessionId = field(data, 'live_id');
      if (liveSessionId) navigation.navigate('LiveStream', { liveSessionId });
    } else if (type.includes('message')) {
      const conversationId = field(data, 'conversation_id') ?? field(data, 'conversationId');
      if (conversationId) navigation.navigate('Chat', { conversationId, senderId: field(data, 'sender_id') });
    } else if (type.includes('mention')) {
      const videoId = field(data, 'video_id');
      if (videoId) navigation.navigate('VideoPlayer', { id: videoId });
    }
  }, [markRead, navigation]);

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => void openNotification(item)}
      style={({ pressed }) => [styles.card, { backgroundColor: item.read_at ? colors.card : colors.unread, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}><MaterialIcons name={notificationIcon(item.type)} size={22} color="#fff" /></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          {!item.read_at ? <View style={styles.unreadDot} /> : null}
        </View>
        {item.message ? <Text numberOfLines={2} style={[styles.message, { color: colors.secondary }]}>{item.message}</Text> : null}
        <Text style={[styles.time, { color: colors.secondary }]}>{timeAgo(item.created_at)}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text></View>
        <FlatList
          data={notificationsQuery.data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.content}
          refreshing={notificationsQuery.isRefetching}
          onRefresh={() => void notificationsQuery.refetch()}
          ListEmptyComponent={notificationsQuery.isLoading ? (
            <View style={styles.state}><ActivityIndicator color={PRIMARY_COLOR} /></View>
          ) : (
            <View style={styles.state}>
              <MaterialIcons name="notifications-none" size={42} color={colors.secondary} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>{notificationsQuery.isError ? 'Notifications are unavailable' : 'You are all caught up'}</Text>
              <Text style={[styles.stateMessage, { color: colors.secondary }]}>{notificationsQuery.isError ? 'Pull down to try again.' : 'New activity will appear here.'}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, screen: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 20, justifyContent: 'center' },
  headerTitle: { ...fontSize.mediumTitleText, fontFamily: 'Poppins_700Bold' },
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  card: { minHeight: 82, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12 },
  pressed: { opacity: 0.72 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { flex: 1, ...fontSize.b5, fontFamily: 'Poppins_600SemiBold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_COLOR },
  message: { marginTop: 3, ...fontSize.b6, lineHeight: 19 }, time: { marginTop: 6, ...fontSize.b6 },
  state: { minHeight: 260, paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateTitle: { ...fontSize.b3, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  stateMessage: { ...fontSize.b6, textAlign: 'center' },
});

export default Notifications;
