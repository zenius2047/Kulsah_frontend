import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  ViewToken
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
// import { ResizeMode, Video } from 'expo-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import { TurnCoverage } from '@google/genai/web';
import { useEvent } from 'expo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mediumScreen, RootStackParamList, smallWidth } from '../types';
import TickIcon from '../assets/icons/ticket-svg.svg';
import PlayFilledIcon from '../assets/icons/play-arrow-filled-svg.svg';
import FireIcon from '../assets/icons/fire-svg.svg';

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
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');


const VideoFeedItem: React.FC<{
  item: FeedItem;
  isPlaying: boolean;
  onSubscribe: (id: string) => void;
  isGlobalMuted: boolean;
  isLive?: boolean;
  shouldPreload?: any;
  nextVideo: string;
  onToggleMute: () => void;
}> = ({ item, onSubscribe, isGlobalMuted, onToggleMute, isPlaying , isLive, nextVideo}) => {
  // console.log("Viewport Height:", SCREEN_HEIGHT);
  // console.log("Viewport Width:", SCREEN_WIDTH);
  const navigation = useNavigation<any>();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [playVideo, setIsPlaying] = useState(true);
  const { height: vh } = useWindowDimensions();
  // const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });


  const togglePlayPause = () => {
    console.log("Video is tapped");
    setIsPlaying((v) => !v)
  };
  // const videoRef = React.useRef<VideoRef>(null);
  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
      });

  const nextPlayer = useVideoPlayer(nextVideo, (p)=>{
    p.currentTime = 1;
  });
  
  // const [currentPlayer, setCurrentPlayer] = useState(player);
  // const [videoDimensions, setVideoDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });


   const loadedMetadata = useEvent(player, 'sourceLoad');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Extract dimensions once the video source loads
  React.useEffect(() => {
    if (loadedMetadata?.availableVideoTracks?.[0]) {
      const { width, height } = loadedMetadata.availableVideoTracks[0].size;
      setDimensions({ width, height });
           console.log(`This is the height : ${height}`)
      console.log(`This is the width : ${width}`)
    }
  }, [loadedMetadata]);
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

  if (isPlaying && playVideo === true) {
    player.play();
  } else {
    player.pause();
  }
}, [isPlaying, playVideo]);

useEffect(() => {
  player.muted = isGlobalMuted;
}, [isGlobalMuted]);

// const { buffering } = useEvent(player, 'bufferingChange', { buffering: true });
const { isPlaying : isReady } = useEvent(player, 'playingChange', { isPlaying: player.playing });

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
        onPress={togglePlayPause}
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
      <View style={{ position: 'absolute', right: 16, bottom: 30, alignItems: 'center' }}>
        <Pressable style={{ marginBottom: 16 }}>
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
            {isLive && <View style={{
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
                fontSize: mediumScreen ? 8: 4,
                color: 'white',
                fontFamily: 'PlusJakartaSansBold'
              }}>
                LIVE
              </Text>
            </View>}
          </View>
        </Pressable>

        {/* {!item.isSubscribed && (
          <Pressable onPress={() => onSubscribe(item.id)} style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', fontSize: 12 }}>Add</Text>
          </Pressable>
        )} */}

        <Pressable onPress={() => setIsLiked(v => !v)} style={{ marginBottom: 16, alignItems: 'center' }}>
          <MaterialIcons name={isLiked ? 'favorite' : 'favorite-border'} size={28} color={isLiked ? '#cd2bee' : 'white'} />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: mediumScreen ? 14:10, fontFamily: "PlusJakartaSansBold" }}>{item.likes}</Text>
        </Pressable>

        <Pressable onPress={() => setShowComments(true)} style={{ marginBottom: 16, alignItems: 'center' }}>
          <MaterialIcons name="chat-bubble-outline" size={28} color="white" />
          <Text style={{ color: 'white', fontSize: mediumScreen ? 14:10, fontFamily: "PlusJakartaSansBold"}}>{item.comments}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Video')} style={{ marginBottom: 16, alignItems: 'center' }}>
          <View style={{
            // borderRadius: 20,
            // width: 40,
            // height: 40,
            // borderColor: item.isSubscribed ? '#cd2bee' : 'white',
            // borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              borderWidth: 2,
              borderColor: item.isSubscribed ? '#cd2bee' : 'white',
              height: 24,
              width: 24,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialIcons name="star" size={14} color={item.isSubscribed ? '#cd2bee' : 'white'} />
            </View>
          </View>
          <Text style={{ color: item.isSubscribed ? '#cd2bee' : 'white', fontSize: mediumScreen ? 14:10, fontFamily: "PlusJakartaSansBold" }}>
            {item.isSubscribed ? 'SUBBED' : 'Sub'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Video')} style={{ alignItems: 'center' }}>
          <MaterialIcons name="share" size={28} color="white" />
          <Text style={{ color: 'white', fontSize: mediumScreen ? 14:10, fontFamily: "PlusJakartaSansBold" }}>Share</Text>
        </Pressable>
      </View>

      {/* Bottom overlay: captions, ticket button */}
      <View style={{ position: 'absolute', bottom: 0, left: 16, right: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable 
          onPress={()=> navigation.navigate('ArtistProfile')}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: mediumScreen ? 18: 14 }}>@{item.handle}</Text>
          </Pressable>
          {item.isPremium && (
            <View style={{ borderRadius: 6, borderColor: '#cd2bee', borderWidth: 1, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: mediumScreen ? 12: 8 }}>Premium</Text>
            </View>
          )}
        </View>

        <View style={{
          width: '80%'
        }}>
          <Text style={{ color: 'white', marginTop: 4, fontFamily:'PlusJakartaSans', fontSize: mediumScreen ? 14: 12 }}>
          {item.caption}
        </Text>
        </View>

        {item.ticketsAvailable && (
          <Pressable
            style={{
              marginTop: 10,
              backgroundColor: '#22c55e',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              alignSelf: 'flex-start', 
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
             }}
            onPress={() => navigation.navigate('Video')}
          >
            <TickIcon/>
            <Text style={{ color: 'black', fontFamily: 'PlusJakartaSansBold', fontSize: mediumScreen ? 14: 10, textTransform: 'uppercase' }}>  Tickets • {item.ticketLocation}</Text>
          </Pressable>
        )}

        <Text style={{ color: '#cbd5e1', marginTop: 10, fontSize: mediumScreen ? 16: 12 }}>{isPlaying ? 'Playing' : 'Paused'} preview</Text>
      </View>

      {/* Comments modal */}
      <Modal visible={showComments} transparent animationType="slide" onRequestClose={() => setShowComments(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={() => setShowComments(false)}>
          <Pressable style={{ backgroundColor: '#111827', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: 'white', fontFamily: 'PlusJakartaSans' }}>{item.comments} Comments</Text>
              <Pressable onPress={() => setShowComments(false)}>
                <Text style={{ color: 'white' }}>close</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 14 }}>
                  <Image source={{ uri: `https://picsum.photos/seed/fan${i}/100` }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '700' }}>GalaxyFan_{i}</Text>
                    <Text style={{ color: '#cbd5e1' }}>This visual is absolute fire!</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <TextInput
                placeholder="Add a comment..."
                placeholderTextColor="#94a3b8"
                style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
              />
              <Pressable style={{ marginLeft: 10 }}>
                <Text style={{ color: '#cd2bee', fontWeight: '700' }}>Post</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Feed: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'premium' | 'foryou' | 'following' | 'challenges'>('foryou');
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const colors = [
    'red',
    'white',
    'green',
    'black',
    'orange',
    'violet',
    'pink',
  ]
  const [items, setItems] = useState<FeedItem[]>([
    {
      id: '15',
      artist: 'Elena Rose',
      handle: 'elena_rose',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.59.32+AM.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
    },
    {
      id: '1',
      artist: 'Elena Rose',
      handle: 'elena_rose',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
      background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.10.25+AM.mp4',
      likes: '2.4M',
      comments: '88.1K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
    },
    {
      id: '4',
      artist: 'Marcus Thorne',
      handle: 'mthorne_bass',
      avatar: 'https://picsum.photos/seed/mthorne/150/150',
      caption: "SUBSCRIBER REHEARSAL: Early draft of the winter tour set. Gold Tier circle, let's vibe.",
      background: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.09.04+AM.mp4',
      likes: '450K',
      comments: '12.2K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
      isLive: true,
    },
    {
      id: '2',
      artist: 'Zion King',
      handle: 'zionking_afro',
      avatar: 'https://picsum.photos/seed/zion/150/150',
      caption: 'Live from the main stage! This crowd is unmatched. #Kulsah #LiveMusic #Afrobeats',
      background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
      likes: '1.2M',
      comments: '45.8K',
      isLiked: true,
      isSubscribed: false,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '5',
      artist: 'Sarah Chen',
      handle: 'schen_music',
      avatar: 'https://picsum.photos/seed/sarah/150/150',
      caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
      background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+10.44.57+AM.mp4',
      likes: '89K',
      comments: '4.5K',
      isLiked: true,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '8',
      artist: 'Gabriel Music',
      handle: 'gabbeat',
      avatar: 'https://picsum.photos/seed/sarah/150/150',
      caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
      background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+10.44.57+AM.mp4',
      likes: '89K',
      comments: '4.5K',
      isLiked: true,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '10',
      artist: 'Kulsah',
      handle: 'kulsah_development',
      avatar: 'https://picsum.photos/seed/sarah/150/150',
      caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
      background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+10.44.57+AM+(1).mp4',
      likes: '89K',
      comments: '4.5K',
      isLiked: true,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '3',
      artist: 'Amara',
      handle: 'amara_official',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.59.32+AM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: false,
    },
    {
      id: '11',
      artist: 'Bill',
      handle: 'bill_official',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.55.09+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '9',
      artist: 'Godfred',
      handle: 'Godfred_Kofi',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.56.16+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '12',
      artist: 'Godfred',
      handle: 'Godfred_Kofi',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.56.01+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '13',
      artist: 'Prince Gabriel',
      handle: 'Prince_Gabriel',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
    },
    {
      id: '14',
      artist: 'Prince Gabriel',
      handle: 'Prince_Gabriel',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: false,
      ticketsAvailable: false,
    },
  ]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'premium') return items.filter((i) => i.isSubscribed);
    return items;
  }, [activeTab, items]);

  const [activeIndex, setActiveIndex] = useState(0);

  const onViewRef = React.useRef(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
      }
    );

  const viewConfigRef = React.useRef({
  viewAreaCoveragePercentThreshold: 80,
  });


  const handleSubscribe = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isSubscribed: true } : item)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'blue', padding: 0, margin: 0 }}>
      <StatusBar  backgroundColor="transparent" translucent = {true} />
      <View
        style={{
          position: 'absolute',
          top: 54,
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
        onPress={() => navigation.navigate('Discover')}>
          <MaterialIcons name="search" size={18} color="white" />
        </Pressable>
        </View>
        <View style={{
          flexDirection: "row",
              height: 44,
              width: "75%",
              alignItems: "center",
              paddingHorizontal: 2,
              paddingVertical: 2,
              // backgroundColor: 'red',
              gap: 10
                  }}>
                  <Pressable onPress={() => setActiveTab("foryou")} style={{ justifyContent: 'center', alignItems: 'center',  }}>
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? 10.5 : mediumScreen ? 13.5:8.5, fontFamily: "PlusJakartaSansBold", letterSpacing: -0.2, marginBottom: 5 }, activeTab === "foryou" && {color: 'white', letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold'}]}>
                        FOR YOU
                      </Text>
                      {activeTab === "foryou" && <View style={{
                        backgroundColor: '#cd2bee',
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("following")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? 10.5 : mediumScreen ? 13.5:8.5, fontFamily: "PlusJakartaSansBold", marginBottom: 5 }, activeTab === "following" && {color: 'white', letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold'}]}>
                        FOLLOWING
                      </Text>
                      {activeTab === "following" && <View style={{
                        backgroundColor: '#cd2bee',
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("challenges")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? 10.5 : mediumScreen ? 13.5:8.5, fontFamily: "PlusJakartaSansBold", marginBottom: 5 }, activeTab === "challenges" && {color: 'white', letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 5}]}>
                        CHALLENGES
                      </Text>
                      {activeTab === "challenges" && <View style={{
                        backgroundColor: '#cd2bee',
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("premium")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{ color: "#94a3b8", fontSize: smallWidth ? 10.5 : mediumScreen ? 13.5:8.5, fontFamily: "PlusJakartaSansBold", marginBottom: 5 }, activeTab === "premium" && {color: 'white', letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 5}]}>
                        PREMIUM
                      </Text>
                      {activeTab === "premium" && <View style={{
                        backgroundColor: '#cd2bee',
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
        
                  
                </View>
            <View
            style={{
              // width: "15%",
              // backgroundColor: '#f9731633',
              // borderColor: '#f973164d',
              // borderWidth: 1,
              // borderRadius: 16,
              height: 35,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 5,
              paddingVertical: 2.5,
            }}
            >
              <FireIcon fill='#f97316' height={18} width={18}/>
              <Text style={{
                color: '#f97316',
                fontFamily: "PlusJakartaSansBold",
                fontSize: mediumScreen ? 14: 10,
              }}>
                3
              </Text>
            </View>

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
          renderItem={({ item, index}) => (
            <View style={{
              height: SCREEN_HEIGHT <= 808 ? SCREEN_HEIGHT + 60 : SCREEN_HEIGHT ,
              backgroundColor: 'black',
              paddingBottom: SCREEN_HEIGHT <= 808 ?'22%': '20%'
            }}>
              <VideoFeedItem
              item={item}
              isPlaying = {index === activeIndex}
              onSubscribe={handleSubscribe}
              isGlobalMuted={isGlobalMuted}
              onToggleMute={() => setIsGlobalMuted((v) => !v)}
              isLive = {item.isLive}
              shouldPreload={Math.abs(index - activeIndex) <= 1}
              nextVideo={index !== displayedItems.length-1 ? displayedItems[index+1].video : item.video}
            />
            </View>
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          ListFooterComponent={() => (
            <View style={{ height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'gold' }}>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>Syncing more galaxy feed...</Text>
            </View>
          )}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          removeClippedSubviews
          initialNumToRender={4}
          windowSize={4}
          maxToRenderPerBatch={4}
        />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Your Orbit is Empty</Text>
          <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            Follow creators in the galaxy to see their latest transmissions.
          </Text>
          <Pressable onPress={() => setActiveTab('foryou')} style={{ marginTop: 18 }}>
            <Text style={{ color: '#cd2bee', fontWeight: '700' }}>Discover Creators</Text>
          </Pressable>
        </View>
      )}
    </View>
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
