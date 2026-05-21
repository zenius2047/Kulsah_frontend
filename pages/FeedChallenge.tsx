import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  DimensionValue,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize } from '../fonts';
import { useThemeMode } from '../theme';
import KulcoinTopUpDrawer from '../components/KulcoinTopUpDrawer';

type ChallengeEntry = {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
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
};

const VOTE_COST = 5;
const KULCOIN_STORAGE_KEY = 'kulcoins';

const baseEntries: ChallengeEntry[] = [
  {
    id: 'e1',
    userName: 'MusicLover99',
    userHandle: 'musiclover',
    userAvatar: 'https://picsum.photos/seed/fan1/200',
    videoUrl: 'https://res.cloudinary.com/dir15sl86/video/upload/v1776164002/kuls_video_001080p_ujhorb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    caption:
      'My entry for the Night Vibes Challenge! Hope you guys like the choreography. #NightVibes #Kulsah',
    likes: 1240,
    votes: 450,
    isLiked: false,
    isVoted: false,
    originalSound: true,
  },
  {
    id: 'e2',
    userName: 'Champion Fan',
    userHandle: 'champion',
    userAvatar: 'https://picsum.photos/seed/fan2/200',
    videoUrl: 'https://res.cloudinary.com/dir15sl86/video/upload/v1776268951/IMG_2312_kieklh.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=800',
    caption:
      'Late night vibes only. This track is a masterpiece! #NightVibes #ElenaRose',
    likes: 890,
    votes: 320,
    isLiked: true,
    isVoted: false,
    originalSound: false,
    soundArtist: 'Elena Rose',
    soundTitle: 'Night Vibes',
  },
  {
    id: 'e3',
    userName: 'BassMaster',
    userHandle: 'bassmaster',
    userAvatar: 'https://picsum.photos/seed/fan3/200',
    videoUrl: 'https://res.cloudinary.com/dir15sl86/video/upload/v1776098026/kul_kid_n4_exwwrc.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800',
    caption:
      'Adding some low-end to the Night Vibes. #NightVibes #ChallengeEntry',
    likes: 2100,
    votes: 680,
    isLiked: false,
    isVoted: true,
    originalSound: false,
    soundArtist: 'BassMaster',
    soundTitle: 'Low End Echo',
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
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(entry.videoUrl, (instance) => {
    instance.loop = true;
    instance.timeUpdateEventInterval = 0.2;
  });
  const sourceLoad = useEvent(player, 'sourceLoad');
  const timeUpdate = useEvent(player as any, 'timeUpdate', { currentTime: 0 });
  const voteScale = useRef(new Animated.Value(0)).current;
  const playOverlay = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(entry.isLiked);
  const [likesCount, setLikesCount] = useState(entry.likes);
  const [votesCount, setVotesCount] = useState(entry.votes);
  const [showVoteAnimation, setShowVoteAnimation] = useState(false);
  const [showPlayState, setShowPlayState] = useState(false);
  const [captionLines, setCaptionLines] = useState(1);
  const [showMore, setShowMore] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
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

    const loadedDuration = (sourceLoad as any)?.duration;
    if (typeof loadedDuration === 'number' && loadedDuration > 0) {
      setDuration((prev) => (prev === loadedDuration ? prev : loadedDuration));
    }
  }, [sourceLoad]);

  useEffect(() => {
    const nextTime = timeUpdate?.currentTime;
    if (typeof nextTime === 'number') {
      setCurrentTime((prev) => (prev === nextTime ? prev : nextTime));
    }
  }, [timeUpdate]);

  useEffect(() => {
    if (isActive && isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isPlaying, player]);

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
  const progressWidth: DimensionValue =
    duration > 0
      ? (`${Math.min((currentTime / duration) * 100, 100)}%` as const)
      : '0%';

  const togglePlay = () => {
    if (!showMore) {
      setCaptionLines(1);
      setShowMore(true);
      return;
    }

    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    setShowPlayState(true);
    if (nextPlaying && isActive) {
      player.play();
    } else {
      player.pause();
    }
  };

  const handleVote = () => {
    if (!onVote()) return;
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

      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

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
              color={isLiked ? '#cd2bee' : '#ffffff'}
            />
          </Pressable>
          <Text style={styles.railCount}>{formatCount(likesCount)}</Text>
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
          <View style={styles.entryBadge}>
            <MaterialIcons
              name={entry.isSeed ? 'rocket-launch' : 'emoji-events'}
              size={14}
              color="#cd2bee"
            />
            <Text style={styles.entryBadgeText}>
              {entry.isSeed ? 'Official Seed' : 'Challenge Entry'}
            </Text>
          </View>
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
      videoUrl: 'https://res.cloudinary.com/dir15sl86/video/upload/v1776099706/IMG_2303_k3wrts.mp4',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800',
      caption:
        'OFFICIAL SEED: The Night Vibes Challenge is officially LIVE. Show me your best moves to win a backstage pass. #NightVibes #OfficialSeed',
      likes: 85000,
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
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          renderItem={({ item, index }) => (
            <ChallengeVideoItem
              entry={item}
              height={feedItemHeight}
              isActive={index === activeIndex}
              onVote={handleVoteAttempt}
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
              <MaterialIcons name="monetization-on" size={16} color="#cd2bee" />
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
  progressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.45,
    shadowRadius: 12,
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
    backgroundColor: '#cd2bee',
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.seven,
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
    backgroundColor: 'rgba(205,43,238,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.34)',
  },
  voteCostText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.sixHalf,
  },
  railCount: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: FontSize.ten,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eighteen,
  },
  captionText: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: FontSize.eleven,
    lineHeight: 20,
  },
  moreLessText: {
    color: '#ffffff',
    marginTop: 1,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
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
    fontSize: FontSize.eight,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSansMedium',
  },
  entryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(205,43,238,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.32)',
  },
  entryBadgeText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.seven,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eighteen,
    textTransform: 'uppercase',
  },
  voteSuccessSubtitle: {
    color: '#6ee7b7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eight,
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
  balancePillText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.nine,
  },
  addCoinButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
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
    backgroundColor: '#cd2bee',
  },
  feedLabel: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.eight,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
});

export default FeedChallenge;
