import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { fontSize } from './typography';
import { useLiveDiscovery } from '../src/hooks/live/useLive';
import { useLiveDirectoryRealtime } from '../src/hooks/live/useLiveDirectoryRealtime';
import { liveApi } from '../src/api/live.api';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import type { LiveCredentials, LiveSession } from '../src/types/live.types';
import { flattenLivePages, formatLiveCount } from '../src/utils/live';

interface LiveCard {
  id: string;
  title: string;
  subtitle: string;
  host: string;
  hostAvatar: string;
  background: string;
  video?: string;
  viewers: string;
  likes: string;
  shares: string;
  liveSession?: LiveSession;
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  avatar?: string | null;
  isTip?: boolean;
  isSystem?: boolean;
}

const LiveCardPreview: React.FC<{
  liveSession?: LiveSession;
  fallbackImage: string;
  isVisible: boolean;
}> = ({ liveSession, fallbackImage, isVisible }) => {
  const isFocused = useIsFocused();
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const shouldPreview = isFocused && isVisible && Boolean(liveSession?.id);
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;

  useEffect(() => {
    let cancelled = false;

    if (!shouldPreview || !liveSession?.id) {
      setCredentials(null);
      return () => {
        cancelled = true;
      };
    }

    setCredentials(null);
    void liveApi.preview(liveSession.id)
      .then((response) => {
        if (!cancelled) setCredentials(response.data.credentials);
      })
      .catch(() => {
        if (!cancelled) setCredentials(null);
      });

    return () => {
      cancelled = true;
    };
  }, [liveSession?.id, shouldPreview]);

  const agora = useAgoraLive({
    credentials,
    enabled: shouldPreview && Boolean(credentials),
    remoteAudioMuted: true,
  });

  useEffect(() => {
    if (shouldPreview) agora.setRemoteAudioMuted(true);
  }, [agora.setRemoteAudioMuted, shouldPreview]);

  const remoteUid = agora.remoteUids[0];

  if (remoteUid != null && shouldPreview) {
    return <RtcVideoView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />;
  }

  if (!fallbackImage) {
    return (
      <LinearGradient
        colors={['#241129', '#111827', '#050505']}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <ImageBackground
      source={{ uri: fallbackImage }}
      style={StyleSheet.absoluteFill}
      imageStyle={styles.cardImage}
    />
  );
};

const LiveFeed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const isFeedFocused = useIsFocused();
  const viewportHeight = Dimensions.get('screen').height;
  const creatorStripHeight = viewportHeight * 0.18;
  const [activeIndex, setActiveIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<LiveCard | null>(null);
  const [commentsByCard] = useState<Record<string, ChatMessage[]>>({});
  const liveQuery = useLiveDiscovery();
  useLiveDirectoryRealtime(isFeedFocused);
  const discoveredLives = useMemo(() => flattenLivePages(liveQuery.data?.pages), [liveQuery.data?.pages]);
  const liveCards = useMemo<LiveCard[]>(() => discoveredLives.map((live) => ({
    id: live.id,
    title: live.creator?.name ?? 'Creator',
    subtitle: live.title,
    host: live.creator?.name ?? 'Creator',
    hostAvatar: live.creator?.avatar ?? '',
    background: live.cover_url ?? '',
    viewers: formatLiveCount(live.current_viewers),
    likes: formatLiveCount(live.likes_count),
    shares: formatLiveCount(live.comments_count),
    liveSession: live,
  })), [discoveredLives]);

  const submitComment = (cardId: string) => {
    const target = liveCards.find((card) => card.id === cardId);
    if (target) openJoinConfirm(target);
  };

  const openGiftDialog = (card: LiveCard) => {
    openJoinConfirm(card);
  };

  const openJoinConfirm = (card: LiveCard) => {
    setJoinTarget(card);
    setJoinConfirmOpen(true);
  };

  const confirmJoin = () => {
    if (!joinTarget?.liveSession) return;
    const target = joinTarget.liveSession;
    setJoinConfirmOpen(false);
    setJoinTarget(null);
    navigation.navigate('LiveStream', { liveSessionId: target.id, initialLive: target });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setFocusedCardId(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const nextIndex = viewableItems.find((entry) => entry.index !== null)?.index;
    if (typeof nextIndex === 'number') {
      setActiveIndex(nextIndex);
    }
  }).current;

  const renderCreatorStrip = () => (
    <View style={{ height: creatorStripHeight, backgroundColor: theme.background, paddingTop: viewportHeight * 0.05}}>
      <FlatList
        data={liveCards}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.creatorRow}
        renderItem={({ item: creator }) => (
          <View style={[styles.creatorItem]}>
            <LinearGradient
              colors={['#f00', '#f00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creatorRing}
            >
              {creator.hostAvatar ? <Image source={{ uri: creator.hostAvatar }} style={styles.creatorAvatar} /> : <View style={[styles.creatorAvatar, { backgroundColor: '#32113c' }]} />}
            </LinearGradient>
            <Text style={[styles.creatorHandle, { color: isDark ? '#cbd5e1' : theme.textSecondary }]} numberOfLines={1}>@{creator.liveSession?.creator?.handle ?? creator.liveSession?.creator?.username ?? creator.host}</Text>
          </View>
        )}
        ListHeaderComponent={<View style={styles.creatorSpacer} />}
        ListFooterComponent={<View style={styles.creatorSpacer} />}
      />
    </View>
  );

  const renderLiveCard = ({ item: card, index }: { item: LiveCard; index: number }) => {
    const cardHeight = index === 0 ? viewportHeight * 0.825: viewportHeight ;
    const cardComments = (commentsByCard[card.id] ?? []).slice(-3);
    const composerLift = focusedCardId === card.id ? Math.max(keyboardHeight - 24, 0) : 0;

    return (
      <View
        style={[
          styles.cardShell,
          {
            shadowColor: isDark ? '#000000' : '#0f172a',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            height: cardHeight,
            backgroundColor: 'black',

          },
        ]}
      >
        <View style={[styles.card, { height: '100%', paddingTop: index !== 0 ? viewportHeight * 0.025 : 0 }]}>
          <LiveCardPreview
            liveSession={card.liveSession}
            fallbackImage={card.background}
            isVisible={index === activeIndex && isFeedFocused}
          />
          <View style={styles.cardTint} />

          <View style={styles.topRow}>
            <Pressable style={styles.liveBadge} onPress={() => openJoinConfirm(card)}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>JOIN</Text>
            </Pressable>

            <View style={styles.viewerBadge}>
              <MaterialIcons name="visibility" size={14} color="#f8fafc" />
              <Text style={styles.viewerBadgeText}>{card.viewers}</Text>
            </View>

            <View style={styles.viewerBadge}>
              <MaterialIcons name="volume-off" size={14} color="#f8fafc" />
            </View>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']}
            locations={[0.1, 0.45, 1]}
            style={[styles.bottomOverlay, { paddingBottom: 22 + composerLift }]}
          >
            <View style={styles.bottomContent}>
              <View style={styles.copyColumn}>
                <View style={styles.chatStack}>
                  {cardComments.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.chatCard,
                        message.isTip ? styles.chatTipCard : null,
                        message.isSystem ? styles.chatSystemCard : null,
                      ]}
                    >
                      {!message.isSystem && message.avatar ? (
                        <Image
                          source={{ uri: message.avatar }}
                          style={styles.chatAvatar}
                        />
                      ) : null}

                      <View style={styles.chatTextWrap}>
                        <Text
                          style={[
                            styles.chatUser,
                            message.isTip ? styles.chatUserTip : null,
                            message.isSystem ? styles.chatUserSystem : null,
                          ]}
                        >
                          {message.user}
                        </Text>
                        <Text style={styles.chatText}>{message.text}</Text>
                      </View>

                      {message.isTip ? <MaterialIcons name="verified" size={14} color="#4ade80" /> : null}
                      {message.isSystem ? <MaterialIcons name="campaign" size={14} color={PRIMARY_COLOR} /> : null}
                    </View>
                  ))}
                </View>

                <View style={styles.hostRow}>
                  {card.hostAvatar ? <Image source={{ uri: card.hostAvatar }} style={styles.hostAvatar} /> : <View style={[styles.hostAvatar, { backgroundColor: '#32113c' }]} />}
                  <View style={styles.hostText}>
                    <Text style={styles.hostName}>{card.title}</Text>
                    <Text style={styles.hostSubtitle}>{card.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.commentComposer}>
                  <TextInput includeFontPadding={false}
                    value={commentDrafts[card.id] ?? ''}
                    onFocus={() => setFocusedCardId(card.id)}
                    onBlur={() => {
                      if (keyboardHeight === 0) {
                        setFocusedCardId(null);
                      }
                    }}
                    onChangeText={(value) =>
                      setCommentDrafts((prev) => ({
                        ...prev,
                        [card.id]: value,
                      }))
                    }
                    placeholder="Add a comment..."
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    style={styles.commentInput}
                    returnKeyType="send"
                    onSubmitEditing={() => submitComment(card.id)}
                  />

                  <Pressable onPress={() => submitComment(card.id)}>
                    <MaterialIcons
                      name="send"
                      size={20}
                      color={(commentDrafts[card.id] ?? '').trim() ? PRIMARY_COLOR : 'rgba(255,255,255,0.25)'}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.actionColumn}>
                <View style={styles.metricBlock}>
                  <Pressable style={styles.metricButton}>
                    <MaterialIcons name="favorite" size={22} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.metricText}>{card.likes}</Text>
                </View>

                <View style={styles.metricBlock}>
                  <Pressable style={styles.metricButton} onPress={() => openGiftDialog(card)}>
                    <MaterialIcons name="redeem" size={22} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.metricText}>Gift</Text>
                </View>

                <View style={styles.metricBlock}>
                  <Pressable style={styles.metricButton}>
                    <MaterialIcons name="share" size={22} color="#ffffff" />
                  </Pressable>
                  <Text style={styles.metricText}>{card.shares}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
    style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, {
        backgroundColor: theme.background,
        // paddingTop: viewportHeight * 0.05,
        height: viewportHeight


         }]}>
        <FlatList
        bounces={false}
          scrollEnabled={keyboardHeight === 0}
          data={liveCards}
          keyExtractor={(item) => item.id}
          renderItem={renderLiveCard}
          ListHeaderComponent={renderCreatorStrip}
          ListEmptyComponent={liveQuery.isLoading ? (
            <View style={styles.feedState}><ActivityIndicator size="large" color={PRIMARY_COLOR} /><Text style={styles.feedStateText}>Finding active Lives...</Text></View>
          ) : (
            <View style={styles.feedState}><MaterialIcons name="live-tv" size={46} color="#94a3b8" /><Text style={styles.feedStateText}>{liveQuery.isError ? 'Live feed unavailable. Pull down to retry.' : 'No one is live right now.'}</Text></View>
          )}
          refreshing={liveQuery.isRefetching && !liveQuery.isFetchingNextPage}
          onRefresh={() => void liveQuery.refetch()}
          onEndReached={() => {
            if (liveQuery.hasNextPage && !liveQuery.isFetchingNextPage) void liveQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          snapToAlignment='start'
          decelerationRate='fast'
          snapToInterval={viewportHeight}
          style={{
            backgroundColor: 'black'
          }}
        />
      </View>
      <Modal
        visible={joinConfirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setJoinConfirmOpen(false);
          setJoinTarget(null);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setJoinConfirmOpen(false);
              setJoinTarget(null);
            }}
          />
          <View style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 24,
            padding: 20,
            backgroundColor: isDark ? 'rgba(12,8,18,0.98)' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
          }}>
            <View style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: primaryColorAlpha(0.18),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
              <MaterialIcons name="live-tv" size={26} color={PRIMARY_COLOR} />
            </View>
            <Text style={{
              color: isDark ? '#ffffff' : theme.text,
              ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
            }}>
              Join this live?
            </Text>
            <Text style={{
              color: isDark ? '#cbd5e1' : theme.textSecondary,
              ...fontSize.b4,
              lineHeight: 18,
              marginTop: 8,
            }}>
              {joinTarget ? `You're about to enter ${joinTarget.title}'s live stream.` : "You're about to enter this live stream."}
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 22,
            }}>
              <Pressable
                onPress={() => {
                  setJoinConfirmOpen(false);
                  setJoinTarget(null);
                }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                }}
              >
                <Text style={{
                  color: isDark ? '#ffffff' : theme.text,
                  ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable onPress={confirmJoin} style={[styles.joinButton, { flex: 1, alignSelf: 'stretch', paddingVertical: 12 }]}>
                <Text style={styles.joinButtonText}>Join Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
  },
  screen: {
    // flex: 1,
    // height: '100%',
    // backgroundColor: 'blue'
  },
  content: {
    // paddingTop: 18,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },
  creatorRow: {
    paddingBottom: 6,
    gap: 16,
  },
  creatorSpacer: {
    width: 0,
  },
  creatorItem: {
    width: 84,
    alignItems: 'center',
  },
  creatorRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  creatorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#120814',
  },
  creatorHandle: {
    marginTop: 10,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  feedStack: {
    backgroundColor: 'black',
    gap: 0,
  },
  cardShell: {
    // borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  card: {
    width: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    // borderRadius: 28,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 2, 12, 0.16)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 51, 87, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.22)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff7b87',
  },
  liveBadgeText: {
    color: '#ffdad6',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 2.2,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  viewerBadgeText: {
    color: '#f8fafc',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  bottomOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 56,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  copyColumn: {
    flex: 1,
    maxWidth: '72%',
  },
  chatStack: {
    gap: 8,
    marginBottom: 14,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chatTipCard: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.28)',
  },
  chatSystemCard: {
    backgroundColor: primaryColorAlpha(0.14),
    borderColor: primaryColorAlpha(0.24),
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  chatTextWrap: {
    flex: 1,
  },
  chatUser: {
    color: primaryColorAlpha(0.76),
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  chatUserTip: {
    color: '#4ade80',
  },
  chatUserSystem: {
    color: PRIMARY_COLOR,
  },
  chatText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    marginTop: 2,
  },
  feedState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  feedStateText: {
    color: '#cbd5e1',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    marginRight: 12,
  },
  hostText: {
    flex: 1,
  },
  hostName: {
    color: '#ffffff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  hostSubtitle: {
    color: '#d1d5db',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    marginTop: 2,
  },
  commentComposer: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.44)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 2,
  },
  metricBlock: {
    alignItems: 'center',
    gap: 6,
  },
  metricButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metricText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    borderRadius: 34,
    borderWidth: 1,
    backgroundColor: 'rgba(10,5,13,0.88)',
  },
  navItem: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 22,
  },
  navItemActive: {
    backgroundColor: primaryColorAlpha(0.18),
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  navLabel: {
    marginTop: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default LiveFeed;
