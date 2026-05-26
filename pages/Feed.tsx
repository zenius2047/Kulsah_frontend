import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  ViewToken,
  Animated,
  Platform,
  PanResponder,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { ResizeMode, Video } from 'expo-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import { TurnCoverage } from '@google/genai/web';
import { useEvent } from 'expo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mediumScreen, RootStackParamList, smallWidth } from '../types';
import { subscribeUser, user } from '../types';
import TickIcon from '../assets/icons/ticket-svg.svg';
import PlayFilledIcon from '../assets/icons/play-arrow-filled-svg.svg';
import FireIcon from '../assets/icons/fireIcon-svg.svg';
import BookMarkIcon from '../assets/icons/bookmark-svg.svg';
import { FontFamily, FontSize } from '../fonts';
import LiveLogo from '../assets/icons/live-svg.svg';
import Reactions from './Reactions';
import ErrorBoundary from '../components/ErrorBoundary';
import SparkleIcon from '../assets/icons/sparkle-style.svg';
import CommentIcon from '../assets/icons/comment-svg.svg';
import KulCoinPrompt from '../components/KulCoinPrompt';
import CreatorShareSheet from './CreatorShareSheet';

interface FeedItem {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  caption: string;
  background: string;
  video: string;
  likes: string;
  comments: string;
  isLiked: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  ticketsAvailable: boolean;
  ticketLocation?: string;
  isLive?: boolean;
  originalSound: boolean;
  soundArtist?: string;
  soundTitle?: string;
  following: boolean;
  bookmarks: string;
  saves: string;
}

interface SubscriptionTier {
  name: string;
  price: string;
  perks: string[];
}

interface FeedSubscriptionSelection {
  itemId: string;
  creatorName: string;
  tier: SubscriptionTier;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const FEED_ITEM_HEIGHT = SCREEN_HEIGHT * (Platform.OS === 'ios'? 0.92: 0.92);
const MONTHLY_KULCOINS = 100;
const YEARLY_KULCOINS = 1000;
const INITIAL_TIME_UPDATE = { currentTime: 0 } as const;
const INITIAL_SUBSCRIPTION: SubscriptionTier = {
  name: 'Kulsah Access',
  price: '9.99',
  perks: [
    'Exclusive Feed Access',
    'Direct Messaging',
    'Badge of Honor',
  ],
};

const FeedQuickMenuModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { isDark, theme } = useThemeMode();
  const panelBg = isDark ? 'rgba(10,5,13,0.92)' : 'rgba(255,255,255,0.96)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const tileBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)';
  const tileBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const rowBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.03)';
  const textPrimary = isDark ? '#e2e8f0' : theme.text;
  const iconTone = isDark ? '#94a3b8' : theme.textSecondary;
  const divider = isDark ? 'rgba(255,255,255,0.08)' : theme.border;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            maxHeight: SCREEN_HEIGHT * 0.78,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: panelBorder,
            backgroundColor: panelBg,
            paddingBottom: 26,
            overflow: 'hidden',
          }}
        >
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 48, height: 6, borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)' }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {[
                { icon: 'bookmark', label: 'Save' },
                { icon: 'sync', label: 'Remix' },
                { icon: 'auto-awesome', label: 'Orbit' },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: tileBorder,
                    backgroundColor: tileBg,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MaterialIcons name={action.icon as any} size={30} color={PRIMARY_COLOR} />
                  <Text
                    style={{
                      color: textPrimary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontFamily: FontFamily.bold,
                      fontSize: FontSize.nine,
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ gap: 4 }}>
              {[
                { icon: 'closed-caption', label: 'Closed captions' },
                { icon: 'fullscreen', label: 'View full-screen' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, fontSize: FontSize.twelve, fontFamily: FontFamily.medium }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                style={{
                  minHeight: 52,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: rowBg,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <MaterialIcons name={'auto-graph' as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, fontSize: FontSize.twelve, fontFamily: FontFamily.medium }}>
                    Auto-scroll
                  </Text>
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: primaryColorAlpha(0.4),
                      backgroundColor: primaryColorAlpha(0.2),
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: PRIMARY_COLOR, fontSize: FontSize.seven, fontFamily: FontFamily.extraBold }}>NEW</Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 42,
                    height: 25,
                    borderRadius: 999,
                    backgroundColor: '#6a00b1',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    alignItems: 'flex-end',
                  }}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }} />
                </View>
              </Pressable>

              <Pressable
                style={{
                  height: 52,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: rowBg,
                }}
              >
                <MaterialIcons name={'qr-code' as any} size={22} color={iconTone} />
                <Text style={{ color: textPrimary, fontSize: FontSize.twelve, fontFamily: FontFamily.medium }}>
                  QR code
                </Text>
              </Pressable>

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 8, marginHorizontal: 4 }} />

              {[
                { icon: 'sentiment-satisfied', label: 'Interested' },
                { icon: 'sentiment-dissatisfied', label: 'Not interested' },
                { icon: 'report', label: 'Report', tint: '#ef4444' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={row.tint ?? iconTone} />
                  <Text style={{ color: textPrimary, fontSize: FontSize.twelve, fontFamily: FontFamily.medium }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 8, marginHorizontal: 4 }} />

              {[
                { icon: 'settings', label: 'Manage content preferences' },
                { icon: 'psychology', label: 'See your algorithm' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, fontSize: FontSize.twelve, fontFamily: FontFamily.medium }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const FeedSubscriptionModal: React.FC<{
  visible: boolean;
  selection: FeedSubscriptionSelection | null;
  billingCycle: 'monthly' | 'annually';
  coinBalance: number;
  isProcessing: boolean;
  showSuccess: boolean;
  onClose: () => void;
  onPurchase: () => void;
}> = ({
  visible,
  selection,
  billingCycle,
  coinBalance,
  isProcessing,
  showSuccess,
  onClose,
  onPurchase,
}) => {
  const { isDark, theme } = useThemeMode();
  const subscriptionCost = billingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS;
  const subscriptionLabel = billingCycle === 'monthly' ? 'Monthly' : 'Annual';

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {selection ? (
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderTopWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border,
              backgroundColor: isDark ? '#08111f' : theme.card,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 28,
              maxHeight: SCREEN_HEIGHT * 0.92,
            }}
          >
            <View
              style={{
                width: 48,
                height: 6,
                borderRadius: 999,
                alignSelf: 'center',
                marginBottom: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.12)',
              }}
            />
            {showSuccess ? (
              <View style={{ paddingVertical: 28, rowGap: 28, alignItems: 'center' }}>
                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 38,
                    backgroundColor: primaryColorAlpha(0.18),
                    borderWidth: 2,
                    borderColor: primaryColorAlpha(0.35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="verified" size={54} color={PRIMARY_COLOR} />
                </View>
                <Text
                  style={{
                    textAlign: 'center',
                    color: theme.text,
                    fontSize: mediumScreen ? FontSize.thirty : FontSize.twentyFour,
                    lineHeight: mediumScreen ? 40 : 30,
                    fontFamily: FontFamily.extraBold,
                    textTransform: 'uppercase',
                  }}
                >
                  Identity{'\n'}Verified
                </Text>
                <Pressable
                  onPress={onClose}
                  style={{
                    minHeight: 72,
                    borderRadius: 30,
                    backgroundColor: PRIMARY_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                    alignSelf: 'stretch',
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: mediumScreen ? FontSize.fifteen : FontSize.eleven,
                      fontFamily: FontFamily.extraBold,
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                    }}
                  >
                    Start Watching
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, rowGap: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                  <View
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: 28,
                      backgroundColor: 'rgba(245,158,11,0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(245,158,11,0.35)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="monetization-on" size={34} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: mediumScreen ? FontSize.twentyTwo : FontSize.eighteen,
                        fontFamily: FontFamily.extraBold,
                        textTransform: 'uppercase',
                      }}
                    >
                      {selection.tier.name} Access
                    </Text>
                    <Text
                      style={{
                        marginTop: 6,
                        color: theme.textSecondary,
                        fontSize: FontSize.nine,
                        fontFamily: FontFamily.extraBold,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                      }}
                    >
                      {selection.creatorName} • {subscriptionLabel} • {subscriptionCost} KulCoins
                    </Text>
                  </View>
                </View>

                <View style={{ rowGap: 14 }}>
                  <Text
                    style={{
                      marginLeft: 4,
                      color: theme.textSecondary,
                      fontSize: FontSize.eight,
                      fontFamily: FontFamily.extraBold,
                      textTransform: 'uppercase',
                      letterSpacing: 3,
                    }}
                  >
                    Unlocked Privileges
                  </Text>
                  {selection.tier.perks.map((perk, i) => (
                    <View
                      key={`${perk}-${i}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        columnGap: 12,
                        borderRadius: 24,
                        borderWidth: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 15,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 12,
                          backgroundColor: primaryColorAlpha(0.12),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="check-circle" size={16} color={PRIMARY_COLOR} />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: theme.text,
                          fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven,
                          fontFamily: FontFamily.bold,
                        }}
                      >
                        {perk.trim()}
                      </Text>
                    </View>
                  ))}

                  <View
                    style={{
                      marginTop: 4,
                      borderRadius: 28,
                      borderWidth: 1,
                      borderColor: 'rgba(245,158,11,0.2)',
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      paddingHorizontal: 18,
                      paddingVertical: 16,
                      rowGap: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 12 }}>
                      <Text
                        style={{
                          color: '#d97706',
                          fontSize: FontSize.eight,
                          fontFamily: FontFamily.extraBold,
                          textTransform: 'uppercase',
                          letterSpacing: 2,
                        }}
                      >
                        Your Balance
                      </Text>
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
                          fontFamily: FontFamily.extraBold,
                        }}
                      >
                        {coinBalance} KC
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 12 }}>
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: FontSize.eight,
                          fontFamily: FontFamily.extraBold,
                          textTransform: 'uppercase',
                          letterSpacing: 1.5,
                        }}
                      >
                        Subscription Cost
                      </Text>
                      <Text
                        style={{
                          color: PRIMARY_COLOR,
                          fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
                          fontFamily: FontFamily.extraBold,
                        }}
                      >
                        -{subscriptionCost} KC
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={onPurchase}
                  disabled={isProcessing}
                  style={{
                    minHeight: 72,
                    borderRadius: 30,
                    backgroundColor: PRIMARY_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                  }}
                >
                  {isProcessing ? (
                    <MaterialIcons name="autorenew" size={24} color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: mediumScreen ? FontSize.fifteen : FontSize.eleven,
                          fontFamily: FontFamily.extraBold,
                          textTransform: 'uppercase',
                          letterSpacing: 2,
                        }}
                      >
                        Subscribe Now
                      </Text>
                      <MaterialIcons name="bolt" size={20} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}
    </Modal>
  );
};


const VideoFeedItem: React.FC<{
  item: FeedItem;
  isPlaying: boolean;
  onSubscribe: (item: FeedItem) => void;
  isGlobalMuted: boolean;
  isLive?: boolean;
  onToggleMute: () => void;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
  isCreatorViewer: boolean;
}> = ({
  item,
  onSubscribe,
  isGlobalMuted,
  onToggleMute,
  isPlaying,
  isLive,
  coinBalance,
  onBalanceChange,
  isCreatorViewer,
}) => {
  // console.log("Viewport Height:", SCREEN_HEIGHT);
  // console.log("Viewport Width:", SCREEN_WIDTH);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [showComments, setShowComments] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [playVideo, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(0);
  const { height: vh } = useWindowDimensions();
  const rotateValue = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStateRef = useRef<boolean | null>(null);
  const muteStateRef = useRef<boolean | null>(null);
  const [lineNumber, setLineNumber] = useState(1);
  const [more, setMore] = useState(true);
  const insets = useSafeAreaInsets();
  // const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const togglePlayPause = () => {
    console.log("Video is tapped");
    console.log("The value of more:", more);
    if(!more){
      setMore(true);
      setLineNumber(1);
    }else{
      setIsPlaying((v) => !v)
    }
  };

  const handleVideoTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 250;

    if (isDoubleTap) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      setIsLiked((prev) => !prev);
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
    singleTapTimeoutRef.current = setTimeout(() => {
      togglePlayPause();
      singleTapTimeoutRef.current = null;
    }, 250);
  };
  // const videoRef = React.useRef<VideoRef>(null);
  const configurePlayer = useCallback((p: any) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.2;
  }, []);

  const player = useVideoPlayer(item.video, configurePlayer);

  // const [currentPlayer, setCurrentPlayer] = useState(player);
  // const [videoDimensions, setVideoDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });

  const loadedMetadata = useEvent(player, 'sourceLoad');
  const timeUpdate: any = useEvent(player as any, 'timeUpdate', INITIAL_TIME_UPDATE);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isPortraitVideo =
    dimensions.width === 0 ||
    dimensions.height === 0 ||
    dimensions.height >= dimensions.width;

  // Extract dimensions once the video source loads
  const loadedTrack = loadedMetadata?.availableVideoTracks?.[0];
  const loadedWidth = loadedTrack?.size?.width ?? 0;
  const loadedHeight = loadedTrack?.size?.height ?? 0;
  const loadedDuration = typeof (loadedMetadata as any)?.duration === 'number'
    ? (loadedMetadata as any).duration
    : 0;

  React.useEffect(() => {
    if (loadedWidth > 0 && loadedHeight > 0) {
      const width = loadedWidth;
      const height = loadedHeight;
      setDimensions((prev) => (
        prev.width === width && prev.height === height ? prev : { width, height }
      ));
      console.log(`This is the height : ${height} for the user ${item.handle} video` )
      console.log(`This is the width : ${width} for the user ${item.handle} video`)
    }

    if (typeof loadedDuration === 'number' && loadedDuration > 0) {
      setDuration((prev) => (prev === loadedDuration ? prev : loadedDuration));
    }
  }, [item.handle, loadedDuration, loadedWidth, loadedHeight]);

  useEffect(() => {
    if (isScrubbing) return;
    const t = timeUpdate?.currentTime;
    if (typeof t === 'number') {
      const nextTime = Math.max(0, t);
      setCurrentTime((prev) => (prev === nextTime ? prev : nextTime));
    }
  }, [timeUpdate?.currentTime, isScrubbing]);

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();

    return () => {
      spinAnimation.stop();
      rotateValue.setValue(0);
    };
  }, [rotateValue]);

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);
  // const replacePlayer = useCallback(async () => {
  //   currentPlayer.pause();
  //   if (currentPlayer === player) {
  //     setCurrentPlayer(nextPlayer);
  //     player.pause();
  //     nextPlayer.play();
  //   } else {
  //     setCurrentPlayer(player);
  //     nextPlayer.pause();
  //     player.play();
  //   }
  // }, [player, nextVideo]);
  // const sourceLoad = useEvent(player, 'sourceLoad');
  // useEffect(()=>{
  //   const tracks = sourceLoad?.availableVideoTracks;
  //   if (tracks && tracks.length > 0) {
  //     const { width, height } = tracks[0].size;
  //     console.log(`This is the height : ${height}`)
  //     console.log(`This is the width : ${width}`)
  //     // setVideoDimensions({ width, height });
  //   }
  // }, [sourceLoad])
  // useEffect(player, 'sourceLoad', () => {
  //   const tracks = event?.availableVideoTracks;

  // });

   useEffect(() => {
  if (!player) return;

  const shouldPlay = isFocused && isPlaying && playVideo === true;
  if (playbackStateRef.current === shouldPlay) return;

  playbackStateRef.current = shouldPlay;

  if (shouldPlay) {
    player.play();
  } else {
    player.pause();
  }
}, [isFocused, isPlaying, playVideo, player]);

useEffect(() => {
  if (muteStateRef.current === isGlobalMuted) return;
  muteStateRef.current = isGlobalMuted;
  player.muted = isGlobalMuted;
}, [isGlobalMuted, player]);

// const { buffering } = useEvent(player, 'bufferingChange', { buffering: true });
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  const effectiveDuration = duration > 0 ? duration : 1;
  const effectiveCurrentTime = isScrubbing ? scrubTime : currentTime;
  const progressRatio = clamp(effectiveCurrentTime / effectiveDuration, 0, 1);

  const seekTo = useCallback((seconds: number) => {
    const target = clamp(seconds, 0, duration > 0 ? duration : 0);
    player.currentTime = target;
    setCurrentTime(target);
  }, [player, duration, clamp]);

  const updateScrubFromX = useCallback((x: number) => {
    if (sliderWidth <= 0) return 0;
    const ratio = clamp(x / sliderWidth, 0, 1);
    const nextTime = ratio * (duration > 0 ? duration : 0);
    setScrubTime(nextTime);
    return nextTime;
  }, [sliderWidth, duration, clamp]);

  const formatTime = useCallback((seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const viewConfigRef = React.useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  return (
    <View style={{ height: '100%', backgroundColor: 'black' }}>
      {/* Video */}
      <View style={{
        height: '100%',
        width: '100%',
        // backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center'
      }} >
        <VideoView
          player={player}
          nativeControls={false}
          contentFit={isPortraitVideo ? 'cover' : 'contain'}
          style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }]}
          allowsPictureInPicture


        />
        <Pressable
        onPress={handleVideoTap}
        style={{
          backgroundColor: 'transparent',
          height: '100%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          {!playVideo && <PlayFilledIcon height={74} width={74} fill={'#ffffff70'}/>}
        </Pressable>
      </View>

      {/* Top mute button */}
      {/* <View style={{ position: 'absolute', top: 40, right: 16 }}>
        <Pressable onPress={onToggleMute}>
          <MaterialIcons name={isGlobalMuted ? 'volume-off' : 'volume-up'} size={28} color="white" />
        </Pressable>
      </View> */}

      {/* Right-side overlay buttons */}
      <View style={{
        position: 'absolute',
        right: 5,
        bottom: 0,
        alignItems: 'center',
        gap: 20,

      }}>
        <Pressable style={{}}>
          <View style={{
            borderRadius: 24,
            height: 48,
            width: 48,
            padding: 2,
            borderWidth: 2,
            borderColor: isLive ? 'red': 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
            {isLive && !item.isSubscribed && <View style={{
              borderRadius: 6,
              paddingHorizontal: 6,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 3,
              backgroundColor: 'red',
              bottom: -6,
              position: 'absolute',
              height: 15,
            }}>
              <Text style={{
                fontSize: mediumScreen ? FontSize.eight: 4,
                color: 'white',
                fontFamily: FontFamily.bold
              }}>
                LIVE
              </Text>
            </View>}
          {!item.following && <View style={{
              borderRadius: 999,
              // paddingHorizontal: 6,
              alignItems: 'center',
              justifyContent: 'center',
              // paddingVertical: 3,
              backgroundColor: PRIMARY_COLOR,
              bottom: -8,
              position: 'absolute',
              height: 20,
              width: 20,
            }}>
              <MaterialIcons name="add" size={15} color='white'/>
            </View>}
          </View>
        </Pressable>

        {/* {!item.isSubscribed && (
          <Pressable onPress={() => onSubscribe(item.id)} style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', fontSize: FontSize.twelve }}>Add</Text>
          </Pressable>
        )} */}

        <Pressable
        onPress={() => setIsLiked(v => !v)}
        style={{
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
         }}
        >
          <MaterialIcons name='favorite' size={32} color={isLiked ? PRIMARY_COLOR : 'white'} />
          <Text style={{ color: 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold }}>{item.likes}</Text>
        </Pressable>

        <Pressable onPress={() => setShowComments(true)} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <CommentIcon height={32} width={32} fill="white" />
          <Text style={{ color: 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold}}>{item.comments}</Text>
        </Pressable>

        {/* <Pressable onPress={() => navigation.navigate('ArtistProfile')} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <View style={{
            // borderRadius: 20,
            // width: 40,
            // height: 40,
            // borderColor: item.isSubscribed ? PRIMARY_COLOR : 'white',
            // borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              // borderWidth: 2,
              // borderColor: item.isSubscribed ? PRIMARY_COLOR : 'white',
              // height: 24,
              // width: 24,
              // borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
              elevation: 4,
            }}>
              <MaterialIcons name="star" size={36} color={item.isSubscribed ? PRIMARY_COLOR : 'white'} />
            </View>
          </View>
          <Text style={{ color: item.isSubscribed ? PRIMARY_COLOR : 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold }}>
            {item.isSubscribed ? 'SUBBED' : 'Sub'}
          </Text>
        </Pressable> */}

        <Pressable onPress={()=>{}} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="bookmark" size={30} color="white" />
          <Text style={{ color: 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold }}>{item.saves}</Text>
        </Pressable>

        <Pressable onPress={() => {}} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="share" size={28} color="white" />
          <Text style={{ color: 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold }}>{item.bookmarks}</Text>
        </Pressable>

        <Pressable onPress={() => setShowMoreMenu(true)} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="more-horiz" size={30} color="white" />
          {/* <Text style={{ color: 'white', fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: FontFamily.bold }}>More</Text> */}
        </Pressable>

        <View style={
          {
            height: 0,
          }
        }></View>
      </View>

      {/* Bottom overlay: captions, ticket button */}
      <View style={{ position: 'absolute', bottom: 0, left: 5, right: 16, paddingBottom: 16, gap: 5 }}>
         <Pressable
         onPress={()=>{
          navigation.navigate('UseEffect');
         }}
         style={{
              backgroundColor: '#00000086',
              flexDirection: 'row',
              paddingHorizontal: 5,
              borderRadius: 5,
              gap: 3,
              paddingVertical:2,
              maxWidth: '85%',
              width: '30%',
              // marginBottom:5,
            }}>
              <SparkleIcon height={20} width={20} color='green'/>
            <Text
            numberOfLines={1}
            style={{
              color: '#ffffffcc',
              fontSize: mediumScreen ? FontSize.ten: FontSize.eight,
              lineHeight: 20,
              fontFamily: FontFamily.medium
            }}>
              Style {" • "}{" Kulsah"}
            </Text>
            </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
          onPress={()=> navigation.navigate('ArtistProfile', {isOwner: false, id: item.artist})}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              // backgroundColor: 'blue',

            }}>
              <View style={{
                // backgroundColor: 'red',
                maxWidth: SCREEN_WIDTH * 0.3
              }}>
                <Text
              numberOfLines={1}
              style={{
                color: 'white',
                fontFamily: FontFamily.bold,
                fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
                }}>@{item.handle}</Text>
              </View>
              <View style={{
                // backgroundColor: 'red',
                marginTop: 3
              }}>
                <MaterialIcons name="verified" size={16} color='#33aae4'/>
              </View>
            </View>
          </Pressable>
          {item.isPremium && (
            <View style={{ borderRadius: 6,  borderWidth: 1, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 3, borderColor: 'white' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: mediumScreen ? FontSize.ten: FontSize.eight }}>Premium</Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              if (!item.isSubscribed) {
                onSubscribe(item);
              }
            }}
            style={{
              borderRadius: 6,
              borderWidth: 1,
              paddingHorizontal: 6,
              justifyContent: 'center',
              alignItems: 'center',
              borderColor: item.isSubscribed ? 'red' : PRIMARY_COLOR,
              backgroundColor: item.isSubscribed ? 'red' : PRIMARY_COLOR,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: mediumScreen ? FontSize.ten: FontSize.eight }}>
              {item.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </Pressable>
        </View>

        <View style={{
          width: '95%',
          flexDirection: 'row',
          gap: 5,
        }}>
          <View style={{
            width: lineNumber > 1 ? '85%':'70%',
          }}>
            <Text
          numberOfLines={lineNumber}
          style={{ color: 'white', marginTop: 4, fontFamily: FontFamily.regular, fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten }}>
          {item.caption}
        </Text>
          </View>
        {more && <Pressable
        onPress={()=>{
          setLineNumber(99);
          setMore(false);
        }}
        >
          <Text style={{
            color: 'white', marginTop: 4, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten
          }}>
          more
          </Text></Pressable>}
        </View>

        <View
        style={{
          flexDirection: 'row',
          marginTop: 10,
          alignItems: 'center',
        }}>
          <View style={{
            height: 20,
            width: 20,
            alignItems: 'center',
            justifyContent: 'center',
            // backgroundColor: '#ffffff1a',
            backgroundColor: '#00000054',
            borderColor: '#ffffff1a',
            borderWidth: 1,
            borderRadius: 4,
          }}>
            <Animated.View style={{
              transform: [{ rotate: rotation }]
            }}>
              <MaterialIcons name="music-note" color='#ffffffcc'/>
            </Animated.View>
          </View>
          <Pressable
          onPress={()=>{
            navigation.navigate('UseSound')
          }}
           style={{
            flexDirection: 'row',
            // backgroundColor: 'red',
            width: '45%',
            marginRight: 15,
          }}>
            <Text
          numberOfLines={1}
          style={{
            color: '#ffffffcc',
            fontSize: mediumScreen ? FontSize.ten: FontSize.eight,
            lineHeight: 20,
            fontFamily: FontFamily.medium,
          }}>
            {"  "}{item.originalSound ? "Original Sound" : item.soundTitle}
          </Text>
          <Text style={{
            color: '#ffffffcc',
            fontSize: mediumScreen ? FontSize.ten: FontSize.eight,
            lineHeight: 20,
            fontFamily: FontFamily.medium
          }}>
            {" • "}{item.originalSound ? item.artist : item.soundArtist}
          </Text>
          </Pressable>



        </View>

        {item.ticketsAvailable && (
          <Pressable
            onPress={()=>{
              navigation.navigate('EventDetail')
            }}
            style={{
              marginTop: 10,
              backgroundColor: '#22c55e',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
             }}
            // onPress={() => navigation.navigate('Video')}
          >
            <TickIcon height={14} width={14}/>
            <Text style={{ color: 'black', fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.ten: FontSize.eight, textTransform: 'uppercase' }}>  Tickets • {item.ticketLocation}</Text>
          </Pressable>
        )}

        <View style={{
          // marginTop: 20,
          width: SCREEN_WIDTH ,
          position: 'absolute',
          bottom: -10,
          left: -10,
          right: -10,
          }}>
          <View
            onLayout={(e) => {
              const nextWidth = e.nativeEvent.layout.width;
              setSliderWidth((prev) => (prev === nextWidth ? prev : nextWidth));
            }}
            style={{
              height: 24,
              justifyContent: 'center',
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(evt) => {
              setIsScrubbing(true);
              updateScrubFromX(evt.nativeEvent.locationX);
            }}
            onResponderMove={(evt) => {
              updateScrubFromX(evt.nativeEvent.locationX);
            }}
            onResponderRelease={(evt) => {
              const target = updateScrubFromX(evt.nativeEvent.locationX);
              seekTo(target);
              setIsScrubbing(false);
            }}
            onResponderTerminate={() => {
              setIsScrubbing(false);
            }}
          >
            <View
              style={{
                height: 2,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.28)',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progressRatio * 100}%`,
                  backgroundColor: '#ffffff40',
                }}
              />
            </View>
            <View
              style={{
                position: 'absolute',
                left: `${progressRatio * 100}%`,
                marginLeft: -4,
                width: 2,
                height: 2,
                borderRadius: 7,
                backgroundColor: '#ffffff40',
                borderWidth: 2,
                borderColor: '#ffffff40',
              }}
            />
          </View>

          {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
            <Text style={{ color: '#cbd5e1', fontSize: mediumScreen ? FontSize.ten : FontSize.eight, fontFamily: FontFamily.bold }}>
              {formatTime(effectiveCurrentTime)}
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: mediumScreen ? FontSize.ten : FontSize.eight, fontFamily: FontFamily.bold }}>
              {formatTime(duration)}
            </Text>
          </View> */}
        </View>

        {/* <Text style={{ color: '#cbd5e1', marginTop: 6, fontSize: mediumScreen ? FontSize.eight: FontSize.eight }}>{isPlaying ? 'Playing' : 'Paused'} preview</Text> */}
      </View>

      {/* Comments modal */}
      <Modal
        visible={showComments}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Reactions
          onClose={() => setShowComments(false)}
          title={`${item.comments} Reactions`}
          currentBalance={coinBalance}
          onBalanceChange={onBalanceChange}
        />
      </Modal>

      {isCreatorViewer ? (
        <CreatorShareSheet
          visible={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
        />
      ) : (
        <FeedQuickMenuModal
          visible={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
        />
      )}
    </View>
  );
};

const Feed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'premium' | 'foryou' | 'following' >('foryou');
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const swipeHandledRef = useRef(false);
  const insets= useSafeAreaInsets();
  const [items, setItems] = useState<FeedItem[]>([
    {
      id: '86',
      artist: 'drop',
      handle: 'gibson',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+1.05.26+PM.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
      // ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    // {
    //   id: '83',
    //   artist: 'Kulsah Headquarters',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/c_scale,w_1080/v1776076286/kul_video_00156_k34ckp.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Rollex Bills',
    //   soundTitle: 'Kulsah Theme',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    //  {
    //   id: '84',
    //   artist: 'Kulsah Headquarters',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776078210/kul_video_001080_vciai8.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Rollex Bills',
    //   soundTitle: 'Kulsah Theme',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    {
      id: '79',
      artist: 'Kulsah Landscape',
      handle: 'Kulsah_landscape',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790082/k434_live_qaebmy.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '78',
      artist: 'Kulsah Landscape',
      handle: 'Kulsah_landscape',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790256/K53234_snaapi.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '85',
      artist: 'Kulsah Landscape',
      handle: 'Kulsah_landscape',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790223/K12242_wmlewi.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '80',
      artist: 'Kulsah Alpha',
      handle: 'Kulsah_alpha',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790193/K0526_ocu8xt.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    // {
    //   id: '10',
    //   artist: 'Big Things',
    //   handle: 'big_t',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dkre8wik0/video/upload/v1777886395/kul_video_001080_crdydk.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '6',
    //   artist: 'Sarkodie',
    //   handle: 'sarkodie',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090904/IMG_2291_d6uwgu.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '15',
    //   artist: 'Elena Rose',
    //   handle: 'elena_rose',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1773840893/WhatsApp_Video_2026-03-18_at_1.31.10_PM_pzk1wt.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '1',
    //   artist: 'Okenneth',
    //   handle: 'o_kenneth',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090888/IMG_2292_quwrue.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '4',
    //   artist: 'Shatta Wale',
    //   handle: 'sm_movement',
    //   avatar: 'https://picsum.photos/seed/mthorne/150/150',
    //   caption: "SUBSCRIBER REHEARSAL: Early draft of the winter tour set. Gold Tier circle, let's vibe.",
    //   background: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090886/IMG_2290_pqm8im.mp4',
    //   likes: '450K',
    //   comments: '12.2K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   isLive: true,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '2',
    //   artist: 'Shatta Wale',
    //   handle: 'sm_movement',
    //   avatar: 'https://picsum.photos/seed/zion/150/150',
    //   caption: 'Live from the main stage! This crowd is unmatched. #Kulsah #LiveMusic #Afrobeats',
    //   background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090870/IMG_2289_hdsiis.mp4',
    //   likes: '1.2M',
    //   comments: '45.8K',
    //   isLiked: true,
    //   isSubscribed: false,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '5',
    //   artist: 'Sarah Chen',
    //   handle: 'schen_music',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093916/IMG_2294_nu53zb.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '8',
    //   artist: 'Gabriel Music',
    //   handle: 'gabbeat',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093923/IMG_2295_lplsoq.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '20',
    //   artist: 'Kulsah',
    //   handle: 'kulsah_development',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776094013/IMG_2296_gz8efi.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '3',
    //   artist: 'Amara',
    //   handle: 'amara_official',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093939/IMG_2297_aqcyf2.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    {
      id: '11',
      artist: 'Bill',
      handle: 'bill_official',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/Kulsah+videos/kul+poll200.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound: true,
    },
    // {
    //   id: '9',
    //   artist: 'Godfred',
    //   handle: 'Godfred_Kofi',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776094108/kul_video_podcast_sd2qei.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    {
      id: '12',
      artist: 'Godfred',
      handle: 'Godfred_Kofi',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+11.10.25+AM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound: true,
    },
    {
      id: '97',
      artist: 'louis',
      handle: 'louis_artist',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound: true,
    },
    {
      id: '96',
      artist: 'prin_cella',
      handle: 'cella_music',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.55.09+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound:true,
    },
    {
      id: '13',
      artist: 'Gabriel',
      handle: 'Prince',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
      following: true,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound: true,
    },
    // {
    //   id: '14',
    //   artist: 'Prince Gabriel',
    //   handle: 'Prince_Gabriel',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    // },
    {
      id: '99',
      artist: 'shpirit',
      handle: 'minister_spirit',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.56.01+PM.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Synthwave Kid',
      soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '95',
      artist: 'kulsah',
      handle: 'kulsah_hq',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'http://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.56.16+PM.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Synthwave Kid',
      soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '94',
      artist: 'bliss',
      handle: 'bliss_k',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809866/IMG_2157_jhxsl5.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Synthwave Kid',
      soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '93',
      artist: 'lynx',
      handle: 'lynx_music',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809856/IMG_2155_uv5gqu.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Bill',
      soundTitle: 'Bills Beat',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '92',
      artist: 'Annu',
      handle: 'Annu_naki',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809849/WhatsApp_Video_2026-04-09_at_5.16.37_PM_oibjkk.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
      // ticketLocation: 'London, UK',
      // originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
      originalSound: true,
    },
    {
      id: '91',
      artist: 'cypher',
      handle: 'cypher_t',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809848/IMG_2158_arvxda.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Synthwave Kid',
      soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '90',
      artist: 'flatEarth',
      handle: 'earth_is_flat',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809831/IMG_2160_i4yqd9.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: false,
      soundArtist: 'Synthwave Kid',
      soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '89',
      artist: 'Gothic',
      handle: 'gothic_g',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809824/IMG_2161_lphffv.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '88',
      artist: 'bliss',
      handle: 'bliss_k',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809866/IMG_2157_jhxsl5.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
    {
      id: '87',
      artist: 'burner',
      handle: 'mic_burner',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809820/IMG_2159_1_lhwqgo.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
      // ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },

    {
      id: '85',
      artist: 'nasa',
      handle: 'nasa_isL',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775810765/Download_49_kumjek.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      originalSound: true,
      // soundArtist: 'Synthwave Kid',
      // soundTitle: 'Neon Dreams',
      following: false,
      bookmarks: '2.5k',
      saves: '2.5k',
    },
  ]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'premium') return items.filter((i) => i.isSubscribed);
    return items;
  }, [activeTab, items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<FeedSubscriptionSelection | null>(null);
  const [subscriptionBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [coinBalance, setCoinBalance] = useState(1250);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [showKulCoinPrompt, setShowKulCoinPrompt] = useState(false);
  const [isCreatorViewer, setIsCreatorViewer] = useState(user?.role === 'creator');


  useEffect(() => {
    console.log(`This is the value of mediumScreen : ${mediumScreen}`)
  }, []);

  useEffect(() => {
    setIsCreatorViewer(user?.role === 'creator');
    return subscribeUser((nextUser) => {
      setIsCreatorViewer(nextUser?.role === 'creator');
    });
  }, []);

  const onViewRef = React.useRef(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const nextIndex = viewableItems[0].index ?? 0;
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    }
      }
    );

  const viewConfigRef = React.useRef({
  viewAreaCoveragePercentThreshold: 80,
  });


  const handleSubscribe = useCallback((feedItem: FeedItem) => {
    setSelectedSubscription({
      itemId: feedItem.id,
      creatorName: feedItem.artist,
      tier: INITIAL_SUBSCRIPTION,
    });
    setShowSubscriptionSuccess(false);
  }, []);

  const closeSubscriptionModal = useCallback(() => {
    if (isProcessingSubscription) return;
    setSelectedSubscription(null);
    setShowSubscriptionSuccess(false);
  }, [isProcessingSubscription]);

  const handleSubscriptionPurchase = useCallback(() => {
    if (!selectedSubscription) return;

    const subscriptionCost =
      subscriptionBillingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS;

    if (coinBalance < subscriptionCost) {
      setShowKulCoinPrompt(true);
      return;
    }

    setIsProcessingSubscription(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedSubscription.itemId ? { ...item, isSubscribed: true } : item
        )
      );
      setCoinBalance((prev) => prev - subscriptionCost);
      setIsProcessingSubscription(false);
      setShowSubscriptionSuccess(true);
      setTimeout(() => {
        setSelectedSubscription(null);
        setShowSubscriptionSuccess(false);
      }, 1800);
    }, 1200);
  }, [coinBalance, selectedSubscription, subscriptionBillingCycle]);

  const handleToggleMute = useCallback(() => {
    setIsGlobalMuted((v) => !v);
  }, []);

  const handleTabSwipe = useCallback((direction: 'left' | 'right') => {
    const tabOrder: Array<'foryou' | 'following' | 'premium'> = ['foryou', 'following', 'premium'];

    setActiveTab((currentTab) => {
      const currentIndex = tabOrder.indexOf(currentTab);
      if (currentIndex === -1) return currentTab;

      if (direction === 'left') {
        return tabOrder[Math.min(currentIndex + 1, tabOrder.length - 1)];
      }

      return tabOrder[Math.max(currentIndex - 1, 0)];
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 24 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
        onPanResponderGrant: () => {
          swipeHandledRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (swipeHandledRef.current || Math.abs(gestureState.dx) < 48) {
            return;
          }

          swipeHandledRef.current = true;
          handleTabSwipe(gestureState.dx < 0 ? 'left' : 'right');
        },
        onPanResponderRelease: () => {
          swipeHandledRef.current = false;
        },
        onPanResponderTerminate: () => {
          swipeHandledRef.current = false;
        },
      }),
    [handleTabSwipe]
  );

  const feedItemHeight = FEED_ITEM_HEIGHT - (Platform.OS === 'ios' ? 0 : insets.bottom);

  const renderFeedItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => (
    <View style={{
      height: feedItemHeight,
      backgroundColor: 'black',
    }}>
      <ErrorBoundary
        fallback={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'black' }}>
            <Text style={{ color: 'white', fontSize: FontSize.eighteen, fontFamily: FontFamily.bold, textAlign: 'center' }}>
              This post could not be loaded
            </Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center', fontFamily: FontFamily.regular }}>
              Swipe to continue browsing the feed.
            </Text>
          </View>
        }
      >
        <VideoFeedItem
          item={item}
          isPlaying={index === activeIndex}
          onSubscribe={handleSubscribe}
          isGlobalMuted={isGlobalMuted}
          onToggleMute={handleToggleMute}
          isLive={item.isLive}
          coinBalance={coinBalance}
          onBalanceChange={setCoinBalance}
          isCreatorViewer={isCreatorViewer}
        />
      </ErrorBoundary>
    </View>
  ), [activeIndex, coinBalance, feedItemHeight, handleSubscribe, handleToggleMute, isCreatorViewer, isGlobalMuted]);

  return (
    <SafeAreaView
    edges={['left', 'right']}
    style={{ flex: 1, backgroundColor: theme.background }}>
      <View
      {...panResponder.panHandlers}
      style={{ flex: 1, backgroundColor: 'blue', padding: 0, margin: 0 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent = {true} />
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios'? 54:insets.top,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: 'row',
          // gap: 15,
          justifyContent: 'space-between',
          alignItems: 'center',
          width: SCREEN_WIDTH,
          // backgroundColor: 'green',
          paddingHorizontal: 10
        }}
      >

        <View style={{
          width: "9%",
          // backgroundColor: 'blue'
        }}>
          <Pressable
        style = {{
          borderColor: '#888',
          borderWidth: 1,
          // paddingHorizontal: 8,
          borderRadius: 999,
          height: 35,
          width: 35,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
        onPress={() => navigation.navigate('Search')}>
          <MaterialIcons name="search" size={18} color="white" />
        </Pressable>
        </View>
        <View style={{
          flexDirection: "row",
              height: 44,
              width: SCREEN_WIDTH * 0.7,
              alignItems: "center",
              paddingHorizontal: 2,
              paddingVertical: 2,
              // backgroundColor: 'red',
              justifyContent: 'center',
              gap: 10
                  }}>
              <Pressable
              onPress={()=>{
                navigation.navigate('Livefeed')
              }}
              >
                <LiveLogo height={54} width={54}/>
              </Pressable>
                  <Pressable onPress={() => setActiveTab("foryou")} style={{ justifyContent: 'center', alignItems: 'center',  }}>
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? FontSize.eightHalf : mediumScreen ? FontSize.twelve:FontSize.eight, fontFamily: FontFamily.bold, letterSpacing: -0.2, marginBottom: 5 }, activeTab === "foryou" && {color: 'white', letterSpacing: 1, fontFamily: FontFamily.extraBold}]}>
                        FOR YOU
                      </Text>
                      {activeTab === "foryou" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("following")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? FontSize.eightHalf : mediumScreen ? FontSize.twelve:FontSize.eight, fontFamily: FontFamily.bold, marginBottom: 5 }, activeTab === "following" && {color: 'white', letterSpacing: 1, fontFamily: FontFamily.extraBold}]}>
                        FOLLOWING
                      </Text>
                      {activeTab === "following" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  {/* <Pressable onPress={() => setActiveTab("challenges")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? FontSize.tenHalf : mediumScreen ? FontSize.thirteenHalf:FontSize.eightHalf, fontFamily: FontFamily.bold, marginBottom: 5 }, activeTab === "challenges" && {color: 'white', letterSpacing: 1, fontFamily: FontFamily.extraBold, marginBottom: 5}]}>
                        CHALLENGES
                      </Text>
                      {activeTab === "challenges" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable> */}
                  <Pressable onPress={() => setActiveTab("premium")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? FontSize.eightHalf : mediumScreen ? FontSize.twelve:FontSize.eight, fontFamily: FontFamily.bold, marginBottom: 5 }, activeTab === "premium" && {color: 'white', letterSpacing: 1, fontFamily: FontFamily.extraBold, marginBottom: 5}]}>
                        PREMIUM
                      </Text>
                      {activeTab === "premium" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>


                </View>
            <Pressable
            onPress={()=>{
              navigation.navigate('StreakReward')
            }}
            style={{
              // width: SCREEN_WIDTH * 0.2,
              // backgroundColor: 'blue',
              // borderColor: '#f973164d',
              // borderWidth: 1,
              // borderRadius: 16,
              // height: 45,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 5,
              paddingVertical: 2.5,
              // marginRight: 5,
            }}
            >
              <FireIcon fill='#f97316' height={15} width={15}/>
              <Text
              numberOfLines={1}
              style={{
                color: '#f97316',
                fontFamily: FontFamily.bold,
                fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
              }}>
                3
              </Text>
            </Pressable>

      </View>

      {displayedItems.length > 0 ? (
        <View style={{
          height: "100%",
          backgroundColor: 'black',
          // paddingBottom: '10%'
        }}>
          <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          showsVerticalScrollIndicator={false}
          snapToInterval={feedItemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          ListFooterComponent={() => (
            <View style={{ height: SCREEN_HEIGHT * 0.08, justifyContent: 'center', alignItems: 'center', backgroundColor: 'gold' }}>
              <Text style={{ color: '#94a3b8', fontSize: FontSize.eleven }}>Syncing more galaxy feed...</Text>
            </View>
          )}
          getItemLayout={(_, index) => ({
            length: feedItemHeight,
            offset: feedItemHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          removeClippedSubviews
          initialNumToRender={2}
          windowSize={3}
          maxToRenderPerBatch={2}
        />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', fontSize: FontSize.eighteen, fontWeight: '800' }}>Your Orbit is Empty</Text>
          <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            Follow creators in the galaxy to see their latest transmissions.
          </Text>
          <Pressable onPress={() => setActiveTab('foryou')} style={{ marginTop: 18 }}>
            <Text style={{ color: PRIMARY_COLOR, fontWeight: '700' }}>Discover Creators</Text>
          </Pressable>
        </View>
      )}
      <FeedSubscriptionModal
        visible={!!selectedSubscription}
        selection={selectedSubscription}
        billingCycle={subscriptionBillingCycle}
        coinBalance={coinBalance}
        isProcessing={isProcessingSubscription}
        showSuccess={showSubscriptionSuccess}
        onClose={closeSubscriptionModal}
        onPurchase={handleSubscriptionPurchase}
      />
      <KulCoinPrompt
        isOpen={showKulCoinPrompt}
        onClose={() => setShowKulCoinPrompt(false)}
        requiredCoins={subscriptionBillingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS}
        currentCoins={coinBalance}
        onPurchaseKulCoins={() => {
          setShowKulCoinPrompt(false);
          setSelectedSubscription(null);
          setShowSubscriptionSuccess(false);
          navigation.navigate('TopUpCoins');
        }}
      />
    </View>
    </SafeAreaView>
  );
};

const StyleSheet = {
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 0,
    padding: 0,

  },
  tabWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    height: 44,
    width: "70%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
};

export default Feed;
