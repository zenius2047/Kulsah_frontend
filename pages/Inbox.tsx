import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PushNotificationPrompt from '../components/PushNotificationPrompt';
import { fontSize } from '../typography';
import {
  conversationAvatar,
  conversationDisplayName,
  conversationPartner,
  getApiErrorMessage,
  useAcceptConversationRequest,
  useAuthStore,
  useBlockConversationRequest,
  useConversations,
  useConversationRequests,
  useConversationUnreadCount,
  useDeclineConversationRequest,
  useMessagingStore,
  useUserSearch,
} from '../src';
import type { ConversationMessageRequest, UserSearchResult } from '../src';

export const INBOX_UNREAD_COUNT = 0;

const conversationTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (elapsedMinutes < 1) return 'Now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  if (elapsedMinutes < 1_440) return `${Math.floor(elapsedMinutes / 60)}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Inbox: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const shell = isDark ? '#0a050d' : theme.background;
  const card = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#64748b' : theme.textMuted;
  const textSecondary = isDark ? '#94a3b8' : theme.textSecondary;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [requestActionId, setRequestActionId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const setUnreadCount = useMessagingStore((state) => state.setUnreadCount);
  const normalizedSearch = search.trim();
  const isSearchMode = normalizedSearch.length > 0;
  const isSearchSettling = normalizedSearch !== debouncedSearch;
  const conversationsQuery = useConversations({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const usersQuery = useUserSearch(debouncedSearch);
  const isUserSearchEnabled = debouncedSearch.length >= 2;
  const isUnifiedSearchLoading = isSearchMode && (
    isSearchSettling
    || conversationsQuery.isLoading
    || (isUserSearchEnabled && usersQuery.isLoading)
  );
  const requestsQuery = useConversationRequests(!isSearchMode);
  const acceptRequest = useAcceptConversationRequest();
  const declineRequest = useDeclineConversationRequest();
  const blockRequest = useBlockConversationRequest();
  const unreadQuery = useConversationUnreadCount();
  const conversations = useMemo(
    () => conversationsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [conversationsQuery.data],
  );
  const searchedUsers = useMemo(
    () => (usersQuery.data ?? []).filter(
      (user) => String(user.id) !== String(currentUser?.id),
    ),
    [currentUser?.id, usersQuery.data],
  );
  const messageRequests = requestsQuery.data?.data ?? [];

  useEffect(() => {
    if (!normalizedSearch) {
      setDebouncedSearch('');
      return;
    }

    const timer = setTimeout(() => setDebouncedSearch(normalizedSearch), 300);
    return () => clearTimeout(timer);
  }, [normalizedSearch]);

  useEffect(() => {
    if (unreadQuery.data != null) setUnreadCount(unreadQuery.data);
  }, [setUnreadCount, unreadQuery.data]);

  const refreshInbox = async () => {
    setIsRefreshing(true);
    try {
      const refreshes: Promise<unknown>[] = [conversationsQuery.refetch()];
      if (debouncedSearch.length >= 2) refreshes.push(usersQuery.refetch());
      if (!isSearchMode) refreshes.push(requestsQuery.refetch());
      await Promise.all(refreshes);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openConversation = (conversation: (typeof conversations)[number]) => {
    const partner = conversationPartner(conversation, currentUser?.id);
    const name = conversationDisplayName(conversation, currentUser?.id);
    const avatar = conversationAvatar(conversation, currentUser?.id)
      || `https://picsum.photos/seed/conversation-${conversation.id}/100`;

    navigation.navigate('Chat', {
      conversationId: conversation.id,
      senderId: partner?.user_id,
      id: partner?.user.username || undefined,
      name,
      avatar,
      isOnline: partner?.user.is_online,
      lastSeenAt: partner?.user.last_seen_at,
    });
  };

  const openUserConversation = (user: UserSearchResult) => {
    const existingConversation = conversations.find((conversation) => (
      !conversation.is_group
      && conversation.participants.some((participant) => String(participant.user_id) === String(user.id))
    ));

    if (existingConversation) {
      openConversation(existingConversation);
      return;
    }

    navigation.navigate('Chat', {
      senderId: user.id,
      id: user.handle || undefined,
      name: user.name || user.handle || 'Kulsah member',
      avatar: user.avatar || `https://picsum.photos/seed/user-${user.id}/100`,
    });
  };

  const handleAcceptRequest = async (request: ConversationMessageRequest) => {
    setRequestActionId(request.id);
    try {
      const conversation = await acceptRequest.mutateAsync(request.id);
      const avatar = request.sender.avatar || `https://picsum.photos/seed/user-${request.sender.id}/100`;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        senderId: request.sender.id,
        id: request.sender.username || undefined,
        name: request.sender.name || request.sender.username || 'Kulsah member',
        avatar,
      });
    } catch (error) {
      Alert.alert('Could not accept request', getApiErrorMessage(error));
    } finally {
      setRequestActionId(null);
    }
  };

  const handleDeclineRequest = async (request: ConversationMessageRequest) => {
    setRequestActionId(request.id);
    try {
      await declineRequest.mutateAsync(request.id);
    } catch (error) {
      Alert.alert('Could not decline request', getApiErrorMessage(error));
    } finally {
      setRequestActionId(null);
    }
  };

  const handleBlockRequest = (request: ConversationMessageRequest) => {
    const senderName = request.sender.name || request.sender.username || 'this person';
    Alert.alert(
      `Block ${senderName}?`,
      'They will no longer appear in Signal search or be able to message you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            setRequestActionId(request.id);
            void blockRequest.mutateAsync(request.id)
              .catch((error) => Alert.alert('Could not block sender', getApiErrorMessage(error)))
              .finally(() => setRequestActionId(null));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: shell }]} edges={['left', 'right']}>
      <View style={[styles.screen, { backgroundColor: shell }]}>
         <View style={[styles.topUtilityRow, {backgroundColor: 'transparent', paddingTop: Platform.OS == 'ios' ? 54: insets.top, marginHorizontal: 16}]}>
            {/* <View style={styles.headerLeft}>
                          
                        </View> */}
            <View style={[styles.avatarWrap, { borderColor: theme.accent }]}>
                            <Image
                              source={{ uri: currentUser?.avatar || `https://picsum.photos/seed/inbox-${currentUser?.id ?? 'member'}/100` }}
                              style={styles.avatar}
                            />
                          </View>
                          <View>
                            <View style={{
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Text style={[styles.title, {color: theme.text}]}>SIGNAL</Text>
                            <Text style={[styles.subtitle, { color: theme.accent }]}>CREATOR PROTOCOL</Text>
                            </View>
                          </View>
            <Pressable
              onPress={()=>{
                navigation.navigate('Notification')
              }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={[styles.notificationButton, { backgroundColor: card, borderColor: border }]}
            >
              <MaterialIcons name="notifications-none" size={22} color={theme.text} />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>

          <View style={[styles.searchRow, { backgroundColor: card, borderColor: border, marginHorizontal: 16 }]}>
            <MaterialIcons name="search" size={20} color={subtle} />
            <TextInput includeFontPadding={false}
              value={search}
              onChangeText={setSearch}
              placeholder="Search creators, fans or collaborations..."
              placeholderTextColor={subtle}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                style={styles.clearSearchButton}
              >
                <MaterialIcons name="close" size={18} color={textSecondary} />
              </Pressable>
            ) : null}
          </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refreshInbox()}
              tintColor={PRIMARY_COLOR}
            />
          )}
        >
          <PushNotificationPrompt />

          {/* {user?.role === "creator" && <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: subtle }]}>COLLABORATORS</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collabRow}>
            {collaborators.map((item) => (
              <View key={item.id} style={styles.collabItem}>
                <View style={[styles.collabAvatarWrap, item.gradient && styles.collabAvatarWrapGradient, { borderColor: border }]}>
                  <Image source={{ uri: item.image }} style={styles.collabAvatar} />
                  {item.live ? <View style={styles.liveDot} /> : null}
                </View>
                <Text style={[styles.collabName, { color: item.gradient ? '#e2e8f0' : textSecondary }]}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
          </>} */}

          

          

          {!isSearchMode && messageRequests.length > 0 ? (
            <View style={styles.requestSection}>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={[styles.resultsEyebrow, { color: PRIMARY_COLOR }]}>MESSAGE REQUESTS</Text>
                  <Text style={[styles.resultsTitle, { color: theme.text }]}>People waiting to connect</Text>
                </View>
                <View style={styles.requestCountBadge}>
                  <Text style={styles.requestCountText}>{messageRequests.length}</Text>
                </View>
              </View>

              <View style={[styles.requestPanel, { backgroundColor: card, borderColor: border }]}>
                {messageRequests.map((request, index) => {
                  const senderName = request.sender.name || request.sender.username || 'Kulsah member';
                  const avatar = request.sender.avatar || `https://picsum.photos/seed/request-${request.sender.id}/100`;
                  const isActing = requestActionId === request.id;

                  return (
                    <View
                      key={request.id}
                      style={[
                        styles.requestRow,
                        index < messageRequests.length - 1 && { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                      ]}
                    >
                      <Image source={{ uri: avatar }} style={styles.requestAvatar} />
                      <View style={styles.requestBody}>
                        <View style={styles.requestNameRow}>
                          <Text numberOfLines={1} style={[styles.requestName, { color: theme.text }]}>{senderName}</Text>
                          <Text style={[styles.requestTime, { color: subtle }]}>{conversationTime(request.created_at)}</Text>
                        </View>
                        {request.sender.username ? (
                          <Text style={[styles.requestHandle, { color: textSecondary }]}>@{request.sender.username}</Text>
                        ) : null}
                        <Text numberOfLines={2} style={[styles.requestIntro, { color: textSecondary }]}>
                          {request.intro_body || 'Would like to start a conversation.'}
                        </Text>

                        {isActing ? (
                          <View style={styles.requestWorkingState}>
                            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                            <Text style={[styles.requestWorkingText, { color: textSecondary }]}>Updating request...</Text>
                          </View>
                        ) : (
                          <View style={styles.requestActions}>
                            <Pressable
                              onPress={() => void handleAcceptRequest(request)}
                              style={styles.acceptRequestButton}
                            >
                              <MaterialIcons name="check" size={17} color="#fff" />
                              <Text style={styles.acceptRequestText}>Accept</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => void handleDeclineRequest(request)}
                              style={[styles.declineRequestButton, { borderColor: border }]}
                            >
                              <Text style={[styles.declineRequestText, { color: textSecondary }]}>Decline</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleBlockRequest(request)}
                              accessibilityRole="button"
                              accessibilityLabel={`Block ${senderName}`}
                              hitSlop={8}
                              style={styles.blockRequestButton}
                            >
                              <MaterialIcons name="block" size={18} color="#ef4444" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.conversationSectionHeader}>
            <Text style={[styles.resultsEyebrow, { color: isSearchMode ? subtle : PRIMARY_COLOR }]}>
              {isSearchMode ? 'CONVERSATIONS' : 'RECENT MESSAGES'}
            </Text>
            {!isSearchSettling && !conversationsQuery.isLoading && conversations.length > 0 ? (
              <Text style={[styles.resultsCount, { color: subtle }]}>{conversations.length}</Text>
            ) : null}
          </View>

          <View style={styles.chatList}>
            {!isSearchMode && conversationsQuery.isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={PRIMARY_COLOR} />
                <Text style={[styles.emptyText, { color: textSecondary }]}>Loading conversations...</Text>
              </View>
            ) : null}
            {conversationsQuery.isError ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Signal is unavailable</Text>
                <Text style={[styles.emptyText, { color: textSecondary }]}>Check your connection and try again.</Text>
                <Pressable style={styles.retryButton} onPress={() => void conversationsQuery.refetch()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {!isUnifiedSearchLoading && !conversationsQuery.isLoading && !conversationsQuery.isError && conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="forum" size={38} color={subtle} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {isSearchMode ? 'No matching conversations' : 'No conversations yet'}
                </Text>
                <Text style={[styles.emptyText, { color: textSecondary }]}>
                  {isSearchMode
                    ? 'Choose a person below to start a new conversation.'
                    : 'Messages you start with creators and fans will appear here.'}
                </Text>
              </View>
            ) : null}
            {!isSearchSettling ? conversations.map((conversation) => {
              const name = conversationDisplayName(conversation, currentUser?.id);
              const avatar = conversationAvatar(conversation, currentUser?.id)
                || `https://picsum.photos/seed/conversation-${conversation.id}/100`;
              const unread = conversation.unread_count > 0;
              const isStickerMessage = conversation.last_message?.type === 'sticker';
              const preview = isStickerMessage
                ? 'Sticker'
                : conversation.last_message?.body
                  || (conversation.last_message?.attachments.length ? 'Sent an attachment' : 'Start the conversation');
              return (
              <Pressable
              onPress={() => openConversation(conversation)}
              key={conversation.id} style={[styles.chatCard]}>
                <View style={styles.chatAvatarWrap}>
                  <Image source={{ uri: avatar }} style={[styles.chatAvatar, unread && styles.chatAvatarUnread]} />
                  {conversation.is_group ? <View style={styles.vipBadge}><Text style={styles.vipText}>GROUP</Text></View> : null}
                </View>
                <View style={styles.chatBody}>
                  <View style={styles.chatTopRow}>
                    <View style={styles.chatNameRow}>
                      <Text style={[styles.chatName, { color: theme.text }]}>{name}</Text>
                      {unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={[styles.chatTime, { color: unread ? PRIMARY_COLOR : subtle }]}>
                      {conversationTime(conversation.last_message_at)}
                    </Text>
                  </View>
                  <View style={styles.chatPreviewRow}>
                    {isStickerMessage ? (
                      <MaterialIcons
                        name="sticky-note-2"
                        size={16}
                        color={unread ? PRIMARY_COLOR : textSecondary}
                      />
                    ) : null}
                    <Text numberOfLines={1} style={[styles.chatMessage, { color: unread ? theme.text : textSecondary }]}>
                      {preview}
                    </Text>
                  </View>
                </View>
              </Pressable>
              );
            }) : null}
            {!isSearchSettling && conversationsQuery.hasNextPage ? (
              <Pressable
                style={styles.loadMoreButton}
                disabled={conversationsQuery.isFetchingNextPage}
                onPress={() => void conversationsQuery.fetchNextPage()}
              >
                {conversationsQuery.isFetchingNextPage
                  ? <ActivityIndicator color={PRIMARY_COLOR} />
                  : <Text style={styles.retryText}>Load more</Text>}
              </Pressable>
            ) : null}
            {isUnifiedSearchLoading ? (
              <View style={[styles.unifiedSearchLoader, { backgroundColor: card, borderColor: border }]}>
                <ActivityIndicator color={PRIMARY_COLOR} />
                <View style={styles.searchHintBody}>
                  <Text style={[styles.searchHintTitle, { color: theme.text }]}>Searching Signal</Text>
                  <Text style={[styles.searchHintText, { color: textSecondary }]}>
                    {conversations.length > 0 && !isSearchSettling
                      ? 'Conversations found. Looking for more people...'
                      : 'Looking through conversations and people...'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {isSearchMode && !isUnifiedSearchLoading ? (
            <View style={styles.searchResultsSection}>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={[styles.resultsEyebrow, { color: PRIMARY_COLOR }]}>PEOPLE</Text>
                  <Text style={[styles.resultsTitle, { color: theme.text }]}>Start a conversation</Text>
                </View>
                {isUserSearchEnabled && !usersQuery.isLoading ? (
                  <Text style={[styles.resultsCount, { color: subtle }]}>{searchedUsers.length} found</Text>
                ) : null}
              </View>

              {normalizedSearch.length < 2 ? (
                <View style={[styles.searchHint, { backgroundColor: card, borderColor: border }]}>
                  <MaterialIcons name="person-search" size={24} color={PRIMARY_COLOR} />
                  <Text style={[styles.searchHintText, { color: textSecondary }]}>Type at least two characters to find people.</Text>
                </View>
              ) : null}

              {usersQuery.isError ? (
                <View style={[styles.searchHint, { backgroundColor: card, borderColor: border }]}>
                  <MaterialIcons name="cloud-off" size={24} color={subtle} />
                  <View style={styles.searchHintBody}>
                    <Text style={[styles.searchHintTitle, { color: theme.text }]}>People search is unavailable</Text>
                    <Text style={[styles.searchHintText, { color: textSecondary }]}>Your matching conversations are shown above.</Text>
                  </View>
                  <Pressable onPress={() => void usersQuery.refetch()} style={styles.inlineRetryButton}>
                    <MaterialIcons name="refresh" size={19} color={PRIMARY_COLOR} />
                  </Pressable>
                </View>
              ) : null}

              {!usersQuery.isLoading
                && !usersQuery.isError
                && isUserSearchEnabled
                && searchedUsers.length === 0 ? (
                <View style={[styles.searchHint, { backgroundColor: card, borderColor: border }]}>
                  <MaterialIcons name="person-search" size={24} color={subtle} />
                  <View style={styles.searchHintBody}>
                    <Text style={[styles.searchHintTitle, { color: theme.text }]}>No people found</Text>
                    <Text style={[styles.searchHintText, { color: textSecondary }]}>Try a full name or username.</Text>
                  </View>
                </View>
              ) : null}

              {searchedUsers.length > 0 ? (
                <View style={[styles.peoplePanel, { backgroundColor: card, borderColor: border }]}>
                  {searchedUsers.map((user, index) => {
                    const existingConversation = conversations.some((conversation) => (
                      !conversation.is_group
                      && conversation.participants.some((participant) => String(participant.user_id) === String(user.id))
                    ));
                    const displayName = user.name || user.handle || 'Kulsah member';
                    const avatar = user.avatar || `https://picsum.photos/seed/user-${user.id}/100`;

                    return (
                      <Pressable
                        key={user.id}
                        onPress={() => openUserConversation(user)}
                        accessibilityRole="button"
                        accessibilityLabel={`${existingConversation ? 'Open conversation with' : 'Message'} ${displayName}`}
                        style={({ pressed }) => [
                          styles.personRow,
                          index < searchedUsers.length - 1 && { borderBottomColor: border, borderBottomWidth: StyleSheet.hairlineWidth },
                          pressed && styles.personRowPressed,
                        ]}
                      >
                        <Image source={{ uri: avatar }} style={styles.personAvatar} />
                        <View style={styles.personBody}>
                          <View style={styles.personNameRow}>
                            <Text numberOfLines={1} style={[styles.personName, { color: theme.text }]}>{displayName}</Text>
                            {user.verified ? <MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} /> : null}
                          </View>
                          <Text numberOfLines={1} style={[styles.personHandle, { color: textSecondary }]}>
                            {user.handle ? `@${user.handle}` : 'Kulsah member'}
                          </Text>
                          {user.role ? (
                            <Text style={[styles.personRole, { color: PRIMARY_COLOR }]}>{user.role.toUpperCase()}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.personAction, { backgroundColor: isDark ? 'rgba(217,70,239,0.14)' : theme.accentSoft }]}>
                          <MaterialIcons name={existingConversation ? 'arrow-forward' : 'chat-bubble-outline'} size={19} color={PRIMARY_COLOR} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {/* <Pressable style={styles.fab}>
          <MaterialIcons name="edit" size={28} color="#fff" />
        </Pressable> */}

        {/* <View style={[styles.bottomNav, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : theme.card, borderColor: border }]}>
          <MaterialIcons name="home" size={24} color={subtle} />
          <MaterialIcons name="explore" size={24} color={subtle} />
          <MaterialIcons name="add-circle" size={38} color={PRIMARY_COLOR} />
          <MaterialIcons name="mail" size={24} color={PRIMARY_COLOR} />
          <MaterialIcons name="person" size={24} color={subtle} />
        </View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 6, paddingBottom: 120 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 64 },
  emptyTitle: { ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, textAlign: 'center' },
  emptyText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' },
  retryButton: { backgroundColor: PRIMARY_COLOR, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  loadMoreButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  retryText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  topUtilityRow: { alignItems: 'flex-end', marginBottom: 0, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 0, paddingHorizontal: 0, },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  sectionTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 0.8, textTransform: 'uppercase' },
  seeAll: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  collabRow: { gap: 14, paddingBottom: 6 },
  collabItem: { alignItems: 'center', width: 74, gap: 6,},
  collabAvatarWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, padding: 2, },
  collabAvatarWrapGradient: { borderColor: PRIMARY_COLOR },
  collabAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  liveDot: { position: 'absolute', right: 2, bottom: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0a050d' },
  collabName: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  searchRow: { marginTop: 12, minHeight: 52, borderWidth: 1, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsSection: {
    marginTop: 24,
    marginHorizontal: 6,
  },
  requestSection: {
    marginTop: 24,
    marginHorizontal: 6,
  },
  requestCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  requestCountText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontFamily: 'Inter_700Bold',
  },
  requestPanel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(148,163,184,0.16)',
  },
  requestBody: { flex: 1, minWidth: 0 },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  requestName: {
    flex: 1,
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
  },
  requestTime: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  requestHandle: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    marginTop: 1,
  },
  requestIntro: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    marginTop: 7,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  acceptRequestButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: PRIMARY_COLOR,
  },
  acceptRequestText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontFamily: 'Inter_700Bold',
  },
  declineRequestButton: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineRequestText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontFamily: 'Inter_600SemiBold',
  },
  blockRequestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  requestWorkingState: {
    minHeight: 36,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestWorkingText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsEyebrow: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.6,
    fontFamily: 'Inter_700Bold',
  },
  resultsTitle: {
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
    marginTop: 3,
  },
  resultsCount: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  searchHint: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unifiedSearchLoader: {
    minHeight: 72,
    marginHorizontal: 6,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchHintBody: { flex: 1 },
  searchHintTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  searchHintText: {
    flex: 1,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  inlineRetryButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,70,239,0.12)',
  },
  peoplePanel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  personRow: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personRowPressed: { opacity: 0.68 },
  personAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(148,163,184,0.16)',
  },
  personBody: { flex: 1, minWidth: 0 },
  personNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  personName: {
    flexShrink: 1,
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
  },
  personHandle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    marginTop: 2,
  },
  personRole: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.1,
    marginTop: 3,
    fontFamily: 'Inter_700Bold',
  },
  personAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePeopleButton: {
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  morePeopleText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.1,
    fontFamily: 'Inter_700Bold',
  },
  conversationSectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatList: { gap: 10 },
  chatCard: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAvatarWrap: { width: 56, height: 56, position: 'relative' },
  chatAvatar: { width: '100%', height: '100%', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatAvatarUnread: { borderColor: PRIMARY_COLOR, borderWidth: 2 },
  vipBadge: { position: 'absolute', bottom: -2, right: -2, borderRadius: 8, backgroundColor: PRIMARY_COLOR, paddingHorizontal: 4, paddingVertical: 1 },
  vipText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  chatBody: { flex: 1 },
  chatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  chatName: { ...fontSize.chatNameText, lineHeight: fontSize.chatNameText.lineHeight },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_COLOR },
  chatTime: { ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, },
  chatPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chatMessage: { flex: 1, ...fontSize.chatMessageText, lineHeight: fontSize.chatMessageText.lineHeight },
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
  title: {
      // color: '#F8FAFC',
      ...fontSize.h1,
      lineHeight: fontSize.h1.lineHeight,
      // fontWeight: '900',
      letterSpacing: 2,
    },
  avatar: {
    width: '100%',
    height: '100%',
  },
    subtitle: {
      // color: '#D946EF',
      ...fontSize.h2,
      lineHeight: fontSize.h2.lineHeight,
      // fontWeight: '900',
      letterSpacing: 1.5,
      marginTop: 2,
    },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
});

export default Inbox;
