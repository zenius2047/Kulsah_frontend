import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import KulcoinTopUpDrawer from '../components/KulcoinTopUpDrawer';
import Reactions from './Reactions';
import CommentIcon from '../assets/icons/comment-svg.svg';
import { VoteModalContent } from './Vote';
import { fontSize } from './typography';

type ChallengeEntry = {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  votes: number;
  isLiked: boolean;
  isVoted: boolean;
  originalSound: boolean;
  soundArtist?: string;
  soundTitle?: string;
  isSeed?: boolean;
};

type ChallengeVideoItemProps = {
  entry: ChallengeEntry;
  height: number;
  isActive: boolean;
  onVote: () => boolean;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
};

const VOTE_COST = 5;
const KULCOIN_STORAGE_KEY = 'kulcoins';
const KULCOIN_ICON = require('../assets/coin.png');
const SING_CHALLENGE_VIDEO_URL = 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779794760/kulsah_sing_vgqxne.mp4';
const DANCE_CHALLENGE_VIDEO_URL = 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779795517/dance_cha_001_p1flkl.mp4';

const baseEntries: ChallengeEntry[] = [
  {
    id: 'e1',
    userName: 'MusicLover99',
    userHandle: 'musiclover',
    userAvatar: 'https://picsum.photos/seed/fan1/200',
    videoUrl: DANCE_CHALLENGE_VIDEO_URL,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    caption:
      'My entry for the Night Vibes Challenge! Hope you guys like the choreography. #NightVibes #Kulsah',
    likes: 1240,
    comments: 88100,
    votes: 450,
    isLiked: false,
    isVoted: false,
    originalSound: true,
  },
  {
    id: 'e2 ',
    userName: 'BassMaster',
    userHandle: 'bassmaster',
    userAvatar: 'https://picsum.photos/seed/fan3/200',
    videoUrl: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779795719/dance-0000_fumuie.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800',
    caption:
      'Adding some low-end to the Night Vibes. #NightVibes #ChallengeEntry',
    likes: 2100,
    comments: 12200,
    votes: 680,
    isLiked: false,
    isVoted: true,
    originalSound: false,
    soundArtist: 'BassMaster',
    soundTitle: 'Low End Echo',
  },
  {
    id: 'e3',
    userName: 'Champion Fan',
    userHandle: 'champion',
    userAvatar: 'https://picsum.photos/seed/fan2/200',
    videoUrl: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790223/K12242_wmlewi.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=800',
    caption:
      'Late night vibes only. This track is a masterpiece! #NightVibes #ElenaRose',
    likes: 890,
    comments: 4500,
    votes: 320,
    isLiked: true,
    isVoted: false,
    originalSound: false,
    soundArtist: 'Elena Rose',
    soundTitle: 'Night Vibes',
  },
  
];

const formatCount = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return `${num}`;
};

const ChallengeVideoItem: React.FC<ChallengeVideoItemProps> = ({
  entry,
  height,
  isActive,
  onVote,
  coinBalance,
  onBalanceChange,
}) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(entry.videoUrl, (instance) => {
    instance.loop = true;
    instance.timeUpdateEventInterval = 0.2;
  });
  const sourceLoad = useEvent(player, 'sourceLoad');
  const voteScale = useRef(new Animated.Value(0)).current;
  const playOverlay = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const playbackStateRef = useRef<boolean | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(entry.isLiked);
  const [likesCount, setLikesCount] = useState(entry.likes);
  const [votesCount, setVotesCount] = useState(entry.votes);
  const [showComments, setShowComments] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showVoteAnimation, setShowVoteAnimation] = useState(false);
  const [showPlayState, setShowPlayState] = useState(false);
  const [captionLines, setCaptionLines] = useState(1);
  const [showMore, setShowMore] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // useEffect(() => {
  //   player.muted = isMuted;
  // }, [isMuted, player]);

  useEffect(() => {
    if (sourceLoad?.availableVideoTracks?.[0]) {
      const track = sourceLoad.availableVideoTracks[0];
      const width = track.size?.width ?? 0;
      const height = track.size?.height ?? 0;
      setDimensions((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    }
  }, [sourceLoad]);

  useEffect(() => {
    if (!player) return;

    const shouldPlay = isFocused && isActive && isPlaying;
    if (playbackStateRef.current === shouldPlay) return;

    playbackStateRef.current = shouldPlay;

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isFocused, isPlaying, player]);

  useEffect(() => {
    if (!showPlayState) return;
    playOverlay.setValue(0);
    Animated.sequence([
      Animated.timing(playOverlay, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(380),
      Animated.timing(playOverlay, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPlayState(false));
  }, [playOverlay, showPlayState]);

  useEffect(() => {
    if (!showVoteAnimation) return;
    voteScale.setValue(0.6);
    Animated.sequence([
      Animated.spring(voteScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }),
      Animated.delay(1200),
      Animated.timing(voteScale, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setShowVoteAnimation(false));
  }, [showVoteAnimation, voteScale]);

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

  const isPortraitVideo =
    dimensions.width === 0 ||
    dimensions.height === 0 ||
    dimensions.height >= dimensions.width;
  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const togglePlay = () => {
    if (!showMore) {
      setCaptionLines(1);
      setShowMore(true);
      return;
    }

    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    setShowPlayState(true);
  };

  const handleVote = () => {
    setShowVoteDialog(true);
  };

  const handleConfirmVote = () => {
    if (!onVote()) {
      setShowVoteDialog(false);
      return;
    }
    setShowVoteDialog(false);
    setVotesCount((prev) => prev + 1);
    setShowVoteAnimation(true);
  };

  const bottomOffset = Math.max(insets.bottom + 26, height * 0.11);

  return (
    <View style={[styles.feedPage, { height }]}>
      <Image source={{ uri: entry.thumbnailUrl }} style={styles.posterImage} />
      <VideoView
        player={player}
        nativeControls={false}
        style={styles.videoBackground}
        contentFit={isPortraitVideo ? 'cover' : 'contain'}
        allowsPictureInPicture
      />

      <Pressable style={styles.videoTapLayer} onPress={togglePlay}>
        {showPlayState ? (
          <Animated.View
            style={[
              styles.playStateBubble,
              {
                opacity: playOverlay,
                transform: [
                  {
                    scale: playOverlay.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialIcons
              name={isPlaying ? 'play-arrow' : 'pause'}
              size={46}
              color="#ffffff"
            />
          </Animated.View>
        ) : null}
      </Pressable>

      <LinearGradient
        colors={['rgba(0,0,0,0.18)', 'transparent', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* <View style={[styles.muteWrap, { top: insets.top + 64 }]}>
        <Pressable onPress={() => setIsMuted((prev) => !prev)} style={styles.muteButton}>
          <MaterialIcons
            name={isMuted ? 'volume-off' : 'volume-up'}
            size={22}
            color="#ffffff"
          />
        </Pressable>
      </View> */}

      <View style={[styles.sideRail, { bottom: 25, gap: Platform.OS == 'ios' ? 20 : 10 }]}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={() => navigation.navigate('FanProfile')}
            style={styles.avatarButton}
          >
            <Image source={{ uri: entry.userAvatar }} style={styles.avatarImage} />
          </Pressable>
          <View style={styles.avatarAddBadge}>
            <MaterialIcons name="add" size={14} color="#ffffff" />
          </View>
        </View>

        <View style={styles.railAction}>
          <Pressable
            onPress={() => {
              const nextLiked = !isLiked;
              setIsLiked(nextLiked);
              setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));
            }}
            style={styles.iconOnlyButton}
          >
            <MaterialIcons
              name="favorite"
              size={36}
              color={isLiked ? PRIMARY_COLOR : '#ffffff'}
            />
          </Pressable>
          <Text style={styles.railCount}>{formatCount(likesCount)}</Text>
        </View>

        <View style={styles.railAction}>
          <Pressable onPress={() => setShowComments(true)} style={styles.iconOnlyButton}>
            <CommentIcon height={32} width={32} fill="#ffffff" />
          </Pressable>
          <Text style={styles.railCount}>{formatCount(entry.comments)}</Text>
        </View>

        {!entry.isSeed ? (
          <View style={styles.railAction}>
            <Pressable onPress={handleVote} style={styles.voteActionButton}>
              <MaterialIcons name="how-to-vote" size={36} color="#ffffff" />
              {/* <Text style={styles.voteActionLabel}>Vote</Text> */}
            </Pressable>
            <View style={styles.voteMeta}>
              <Text style={styles.railCount}>{formatCount(votesCount)}</Text>
              {/* <View style={styles.voteCostChip}>
                <Text style={styles.voteCostText}>5KC</Text>
              </View> */}
            </View>
          </View>
        ) : null}

        <View style={styles.railAction}>
          <Pressable style={styles.iconOnlyButton}>
            <MaterialIcons name="bookmark" size={30} color="#ffffff" />
          </Pressable>
          <Text style={styles.railCount}>Save</Text>
        </View>

        <View style={styles.railAction}>
          <Pressable style={styles.iconOnlyButton}>
            <MaterialIcons name="share" size={32} color="#ffffff" />
          </Pressable>
          <Text style={styles.railCount}>Share</Text>
        </View>

        <View style={styles.railAction}>
          <Pressable style={styles.iconOnlyButton}>
            <MaterialIcons name="more-horiz" size={30} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.bottomInfo, { bottom:  25}]}>
        <View style={styles.bottomCopy}>
          <Text style={styles.handleText}>@{entry.userHandle}</Text>
          <View style={styles.captionRow}>
            <View style={[styles.captionWrap, { width: captionLines > 1 ? '85%' : '72%' }]}>
              <Text numberOfLines={captionLines} style={styles.captionText}>
                {entry.caption}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (showMore) {
                  setCaptionLines(99);
                  setShowMore(false);
                  return;
                }

                setCaptionLines(1);
                setShowMore(true);
              }}
            >
              <Text style={styles.moreLessText}>{showMore ? 'more' : 'less'}</Text>
            </Pressable>
          </View>
          <Pressable
          onPress={()=>{
            navigation.navigate("challengeParticipants")
          }}
          style={styles.entryBadge}>
            <MaterialIcons
              name={entry.isSeed ? 'rocket-launch' : 'emoji-events'}
              size={14}
              color={PRIMARY_COLOR}
            />
            <Text style={styles.entryBadgeText}>
              {entry.isSeed ? 'Official Seed' : 'Challenge Entry'}
            </Text>
          </Pressable>
          <View style={styles.soundRow}>
            <View style={styles.soundIconWrap}>
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <MaterialIcons name="music-note" size={16} color="#ffffffcc" />
              </Animated.View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('UseSound')}
              style={styles.soundLink}
            >
              <Text numberOfLines={1} style={styles.soundText}>
                {'  '}
                {entry.originalSound ? 'Original Sound' : entry.soundTitle}
              </Text>
              <Text numberOfLines={1} style={styles.soundText}>
                {' * '}
                {entry.originalSound ? entry.userName : entry.soundArtist}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {showVoteAnimation ? (
        <Animated.View
          style={[
            styles.voteSuccessOverlay,
            {
              opacity: voteScale,
              transform: [{ scale: voteScale }],
            },
          ]}
        >
          <View style={styles.voteSuccessCard}>
            <View style={styles.voteSuccessIcon}>
              <MaterialIcons name="check-circle" size={58} color="#ffffff" />
            </View>
            <Text style={styles.voteSuccessTitle}>Vote Cast!</Text>
            <Text style={styles.voteSuccessSubtitle}>Mission Supported</Text>
          </View>
        </Animated.View>
      ) : null}

      <Modal
        visible={showComments}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.commentsKeyboardAvoidingView}
        >
          <Reactions
            onClose={() => setShowComments(false)}
            title={`${formatCount(entry.comments)} Reactions`}
            currentBalance={coinBalance}
            onBalanceChange={onBalanceChange}
          />
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showVoteDialog}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowVoteDialog(false)}
      >
        <VoteModalContent
          sheetMode
          onClose={() => setShowVoteDialog(false)}
          onConfirm={handleConfirmVote}
        />
      </Modal>
    </View>
  );
};

const FeedChallenge: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeMode();
  const { height: SCREEN_HEIGHT } = Dimensions.get('screen');
  const pageHeight = SCREEN_HEIGHT;

  const [entries] = useState<ChallengeEntry[]>([
    {
      id: 'ov-night-vibes',
      userName: 'Mila Ray',
      userHandle: 'milaray',
      userAvatar: 'https://picsum.photos/seed/mila/150',
      videoUrl: SING_CHALLENGE_VIDEO_URL,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
      caption:
        'OFFICIAL SEED: The Night Vibes Challenge is officially LIVE. Show me your best moves to win a backstage pass. #NightVibes #OfficialSeed',
      likes: 85000,
      comments: 88100,
      votes: 0,
      isLiked: false,
      isVoted: false,
      originalSound: false,
      soundArtist: 'Mila Ray',
      soundTitle: 'Night Vibes Official Seed',
      isSeed: true,
    },
    ...baseEntries,
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [kulcoins, setKulcoins] = useState(10);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  useEffect(() => {
    const loadKulcoins = async () => {
      try {
        const saved = await AsyncStorage.getItem(KULCOIN_STORAGE_KEY);
        setKulcoins(saved ? Number.parseInt(saved, 10) || 10 : 10);
      } catch {
        setKulcoins(10);
      }
    };

    void loadKulcoins();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(KULCOIN_STORAGE_KEY, `${kulcoins}`);
  }, [kulcoins]);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  const handleVoteAttempt = () => {
    if (kulcoins < VOTE_COST) {
      setIsTopUpOpen(true);
      return false;
    }

    setKulcoins((prev) => prev - VOTE_COST);
    return true;
  };

  const feedItemHeight = pageHeight;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.screen}>
        <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} translucent backgroundColor="transparent" />

        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={feedItemHeight}
          getItemLayout={(_, index) => ({
            length: feedItemHeight,
            offset: feedItemHeight * index,
            index,
          })}
          // ListFooterComponent={() => (
          //             <View style={{ height: SCREEN_HEIGHT * 0.08, justifyContent: 'center', alignItems: 'center', backgroundColor: 'gold' }}>
          //               <Text style={{ color: '#94a3b8', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }}>Syncing more galaxy feed...</Text>
          //             </View>
          //           )}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          renderItem={({ item, index }) => (
            <ChallengeVideoItem
              entry={item}
              height={feedItemHeight}
              isActive={index === activeIndex}
              onVote={handleVoteAttempt}
              coinBalance={kulcoins}
              onBalanceChange={setKulcoins}
            />
          )}
          removeClippedSubviews
          initialNumToRender={2}
          windowSize={3}
          maxToRenderPerBatch={2}
        />

        <View style={[styles.feedHeader, { top: insets.top + 10 }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialIcons name="chevron-left" size={22} color="#ffffff" />
          </Pressable>

          <View style={styles.balancePill}>
            <View style={styles.balanceLeft}>
              <Image source={KULCOIN_ICON} style={styles.balanceCoinImage} />
              <Text style={styles.balancePillText}>{kulcoins} KC</Text>
              <Pressable onPress={() => setIsTopUpOpen(true)} style={styles.addCoinButton}>
                <MaterialIcons name="add" size={14} color="#ffffff" />
              </Pressable>
            </View>
            <View style={styles.feedLiveWrap}>
              <View style={styles.liveDot} />
              <Text style={styles.feedLabel}>Feed</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('ChallengeLeaderboard')}
            style={styles.headerButton}
          >
            <MaterialIcons name="leaderboard" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* <View style={[styles.bottomOverlay, { bottom: insets.bottom + 18 }]}>
          <Pressable
            onPress={() => navigation.navigate('Challenges')}
            style={styles.backToOrbitButton}
          >
            <MaterialIcons name="rocket-launch" size={20} color="#ffffff" />
            <Text style={styles.backToOrbitText}>Back to Orbit</Text>
          </Pressable>
        </View> */}

        <KulcoinTopUpDrawer
          currentBalance={kulcoins}
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          onSuccess={(amount) => setKulcoins((prev) => prev + amount)}
          warningText="Insufficient Balance to Vote"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  feedPage: {
    backgroundColor: '#000000',
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  videoTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playStateBubble: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  muteWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
  },
  muteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sideRail: {
    position: 'absolute',
    right: 14,
    zIndex: 25,
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatarButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#18181b',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarAddBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  railAction: {
    alignItems: 'center',
    gap: 2,
  },
  iconOnlyButton: {
    width: 46,
    height: 46,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteActionButton: {
    width: 42,
    height: 42,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    // backgroundColor: 'rgba(255,255,255,0.1)',
    // borderWidth: 2,
    // borderColor: 'rgba(255,255,255,0.18)',
  },
  voteActionLabel: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  voteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  voteCostChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: primaryColorAlpha(0.2),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.34),
  },
  voteCostText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  railCount: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  bottomInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 22,
  },
  bottomCopy: {
    width: '78%',
    gap: 10,
  },
  captionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
  },
  captionWrap: {},
  handleText: {
    color: '#ffffff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
  },
  captionText: {
    color: 'rgba(255,255,255,0.92)',
    ...fontSize.b5,
    lineHeight: 20,
  },
  moreLessText: {
    color: '#ffffff',
    marginTop: 1,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  soundRow: {
    flexDirection: 'row',
    marginTop: 2,
    alignItems: 'center',
  },
  soundIconWrap: {
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000054',
    borderColor: '#ffffff1a',
    borderWidth: 1,
    borderRadius: 4,
  },
  soundLink: {
    flexDirection: 'row',
    width: '52%',
    marginRight: 15,
  },
  soundText: {
    color: '#ffffffcc',
    ...fontSize.b5,
    lineHeight: 20,
  },
  entryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: primaryColorAlpha(0.18),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.32),
  },
  entryBadgeText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  voteSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteSuccessCard: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 26,
    borderRadius: 36,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.38)',
  },
  voteSuccessIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
  },
  voteSuccessTitle: {
    color: '#ffffff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
  },
  voteSuccessSubtitle: {
    color: '#6ee7b7',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  feedHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 60,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.12)',
  },
  balanceCoinImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  balancePillText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  addCoinButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  feedLiveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
  },
  feedLabel: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 60,
    alignItems: 'center',
  },
  backToOrbitButton: {
    minHeight: 60,
    paddingHorizontal: 26,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backToOrbitText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  commentsKeyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default FeedChallenge;
