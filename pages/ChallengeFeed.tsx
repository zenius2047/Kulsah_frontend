import React, { useEffect, useRef, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fontScale } from '../fonts';
import { VoteModalContent } from './Vote';

type ChallengeFeedItem = {
  id: string;
  handle: string;
  caption: string;
  audio: string;
  likes: string;
  comments: string;
  shares: string;
  votes: string;
  avatar: string;
  poster: string;
  recordArt: string;
  video: string;
};

const challengeItems: ChallengeFeedItem[] = [
  {
    id: '1',
    handle: '@music_pro_entry',
    caption:
      'Dropping some heavy bass for the #MusicChallenge24. This drop is insane! #trending #viral #musicapp',
    audio: 'Original Track - Neon Nights (ft. Synthwave Collective) • Exclusive Audio',
    likes: '1.2k',
    comments: '450',
    shares: '128',
    votes: 'Vote',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzxhdPImqTJ_xmmg6mt6Lpgx7WZTfLfjzuqdP8Z-_3H3KBgip6khSLhg8H6bhUcW0Wm9eznJiFYkrPm4xXksN_wf0xFLLetoERRdRhM_7_XBEWGUhQKVpNmcFAP_L4gMsbvDybqaz9gOsPnajDRuMJjAH7knVcCkWAM-lLACYwcMEaOpLIxbXQqBNpE8dNyn-vdBdJtXA4t2ps_T9gR8WYuzzjg52R2KZJ__FkBCmwk1swlUVG3TLa1QJFFKYT6B5VGhSGFp1OKjQM',
    poster:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA68F89bfylMGhhrw0T93ud633rqAZgmPgtG0ZQ8Ui5tXlnlwP8G-B8aHlEP_TrtW3iGi_ei8zvcEQHtimmj1otbBzgLUBol6t4X4hPAD74iH90ICFmOrvo7_328LrxKAQk8PXhGw-waqBO-CA1IzRUaxvQqPZnLBs6EILnMNei3xXOvhEH3EJUAZP70nwCHlxl39othQbH1S4hcC0wMpAIysSv8icI9CBc_1H_uqr2zLaw_d61uMFMm8-hakEuIJxDLmXgsSVpvYSy',
    recordArt:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAvc6vtQ-NVqpu8ybGzjhcQ7DEhKZaGYvHSSznx71lo3GByeLsxhjvUDVu7HJKWcyIODdnOVIg41xinuAmBIgo0ckh3_TnaFCgIkPj7CzIcS9Q8r82XPPL_141XtPZa_K4VOLULE45SYdwXJhPzXiTV_5_RIbYswqZPE8D5Dk37R45yaA0iwLU7c4qQzRfIBjKqMyXi8mkdmnJLof6ZbIFsul0Drod_khZRIGi4I5KnHMMcyqg2dmJtLUSZMTgoInp9HXhgDoyXRILm',
    video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.59.32+AM.mp4',
  },
  {
    id: '2',
    handle: '@elena_rose',
    caption:
      'Private challenge rehearsal with the full neon squad. Clean transitions only. #challenge #creatorbattle',
    audio: 'Nebula Draft Session • Private Creator Pass',
    likes: '2.4M',
    comments: '88.1K',
    shares: '4.9K',
    votes: 'Vote',
    avatar: 'https://picsum.photos/seed/elena/150/150',
    poster: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    recordArt: 'https://picsum.photos/seed/record1/200/200',
    video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.10.25+AM.mp4',
  },
  {
    id: '3',
    handle: '@mthorne_bass',
    caption:
      'Subscriber rehearsal cut from the winter challenge set. We are taking this one all the way. #bass #livecut',
    audio: 'Winter Tour Set Draft • Marcus Thorne',
    likes: '450K',
    comments: '12.2K',
    shares: '970',
    votes: 'Vote',
    avatar: 'https://picsum.photos/seed/mthorne/150/150',
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    recordArt: 'https://picsum.photos/seed/record2/200/200',
    video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.09.04+AM.mp4',
  },
  {
    id: '4',
    handle: '@zionking_afro',
    caption:
      'Live from the main stage challenge lane. Crowd energy is unreal and the entry visuals are locked in. #afrobeats #live',
    audio: 'Main Stage Crowd Take • Zion King',
    likes: '1.2M',
    comments: '45.8K',
    shares: '8.5K',
    votes: 'Vote',
    avatar: 'https://picsum.photos/seed/zion/150/150',
    poster: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    recordArt: 'https://picsum.photos/seed/record3/200/200',
    video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
  },
];

const ChallengeFeedCard: React.FC<{
  item: ChallengeFeedItem;
  isActive: boolean;
  onBack: () => void;
  onVote: () => void;
  pageHeight: number;
}> = ({ item, isActive, onBack, onVote, pageHeight }) => {
  const [playVideo, setPlayVideo] = useState(true);
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(item.video, (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    if (isActive && playVideo) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, playVideo, player]);

  return (
    <View style={[styles.page, { height: pageHeight, backgroundColor: 'blue' }]}>
      <Image source={{ uri: item.poster }} style={styles.posterImage} />
      <VideoView player={player} nativeControls={false} style={styles.videoBackground} />

      <Pressable style={styles.videoPressable} onPress={() => setPlayVideo((value) => !value)}>
        {!playVideo ? (
          <MaterialIcons name="play-circle-filled" size={74} color="#ffffff80" />
        ) : null}
      </Pressable>

      <LinearGradient
        colors={['rgba(27,16,34,0.45)', 'transparent', '#1b1022']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { top: insets.top + 10, paddingHorizontal: 16 }]}>
        <Pressable style={styles.glassButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
        </Pressable>

        <Pressable style={styles.glassButton}>
          <MaterialIcons name="more-vert" size={22} color="#ffffff" />
        </Pressable>
      </View>

      <View
        style={[
          styles.rightRail,
          {
            right: 14,
            bottom: Math.max(insets.bottom + 96, pageHeight * 0.17),
          },
        ]}
      >
        <View style={styles.profileWrap}>
          <Image source={{ uri: item.avatar }} style={styles.profileImage} />
          <View style={styles.addBadge}>
            <MaterialIcons name="add" size={12} color="#ffffff" />
          </View>
        </View>

        <Pressable style={styles.primaryAction} onPress={onVote}>
          <View style={styles.voteButton}>
            <MaterialIcons name="how-to-reg" size={30} color="#ffffff" />
          </View>
          <Text style={styles.actionLabel}>{item.votes}</Text>
        </Pressable>

        <Pressable style={styles.ghostAction}>
          <View style={styles.ghostButton}>
            <MaterialIcons name="favorite" size={30} color="#ffffff" />
          </View>
          <Text style={styles.actionLabel}>{item.likes}</Text>
        </Pressable>

        <Pressable style={styles.ghostAction}>
          <View style={styles.ghostButton}>
            <MaterialIcons name="chat-bubble" size={28} color="#ffffff" />
          </View>
          <Text style={styles.actionLabel}>{item.comments}</Text>
        </Pressable>

        <Pressable style={styles.ghostAction}>
          <View style={styles.ghostButton}>
            <MaterialIcons name="share" size={28} color="#ffffff" />
          </View>
          <Text style={styles.actionLabel}>{item.shares}</Text>
        </Pressable>

        <View style={styles.recordWrap}>
          <View style={styles.recordShell}>
            <Image source={{ uri: item.recordArt }} style={styles.recordArt} />
          </View>
        </View>
      </View>

      <View
        style={[
          styles.bottomInfo,
          {
            bottom: insets.bottom + 28,
            paddingHorizontal: 18,
            paddingRight: 88,
          },
        ]}
      >
        <View style={styles.creatorRow}>
          <Text style={styles.creatorHandle}>{item.handle}</Text>
          <MaterialIcons name="verified" size={16} color="#60a5fa" />
        </View>

        <Text style={styles.caption}>
          {item.caption.split('#')[0]}
          <Text style={styles.captionAccent}>
            {item.caption.includes('#') ? `#${item.caption.split('#').slice(1).join('#')}` : ''}
          </Text>
        </Text>

        <View style={styles.audioRow}>
          <MaterialIcons name="music-note" size={16} color="#ffffff" />
          <Text style={styles.audioText} numberOfLines={1}>
            {item.audio}
          </Text>
        </View>
      </View>

      <View style={[styles.progressWrap, { bottom: insets.bottom + 8 }]}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </View>
  );
};

const ChallengeFeed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { height: windowHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [voteOpen, setVoteOpen] = useState(false);
  const pageHeight = Math.max(windowHeight, 1);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <FlatList
          data={challengeItems}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          snapToInterval={pageHeight}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          renderItem={({ item, index }) => (
            <ChallengeFeedCard
              item={item}
              isActive={index === activeIndex}
              onBack={() => navigation.goBack()}
              onVote={() => setVoteOpen(true)}
              pageHeight={pageHeight}
            />
          )}
        />

        <Modal
          visible={voteOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setVoteOpen(false)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setVoteOpen(false)} />
          <VoteModalContent sheetMode onClose={() => setVoteOpen(false)} />
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1b1022',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1b1022',
  },
  page: {
    backgroundColor: '#1b1022',
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 16, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rightRail: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    gap: 18,
  },
  profileWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  addBadge: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d915d2',
  },
  primaryAction: {
    alignItems: 'center',
    gap: 4,
  },
  voteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  ghostAction: {
    alignItems: 'center',
    gap: 4,
  },
  ghostButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 16, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionLabel: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recordWrap: {
    marginTop: 4,
  },
  recordShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 16, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recordArt: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bottomInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    gap: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorHandle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(22),
  },
  caption: {
    color: '#e2e8f0',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(16),
    lineHeight: 22,
  },
  captionAccent: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  audioText: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
  },
  progressWrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 30,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    width: '33%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#d915d2',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.45)',
  },
});

export default ChallengeFeed;
