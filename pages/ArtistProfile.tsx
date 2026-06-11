import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
import { ActivityIndicator, Alert, Dimensions, Image, ImageBackground, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayIcon from '../assets/icons/play-circle-svg.svg';
import StarsIcon from '../assets/icons/premium-svg.svg';
import CalenderIcon from '../assets/icons/calendar-svg.svg';
import TrophyIcon from '../assets/icons/trophy-svg.svg';
import BookmarkIcon from '../assets/icons/bookmark-svg.svg';
import EditIcon from '../assets/icons/edit-svg.svg';
import { mediumScreen, setUser, subscribeUser, user, User } from '../types';
import { BlurView } from 'expo-blur';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import FireIcon from '../assets/icons/fireIcon-svg.svg';
import KulCoinPrompt from '../components/KulCoinPrompt';
import { fontSize } from '../typography';
import TicketIcon from '../assets/icons/Ticket1.svg';
import LocalActivity from '../assets/icons/local_activity.svg';
import LibraryMusic from '../assets/icons/library_music.svg';


type Tab = 'Videos' | 'Library' | 'Premium'  | 'Tickets' | 'Events' | 'Challenges' | 'Favorites' | 'Saved';
type LibrarySubTab = 'All' | 'Public' | 'Premium' | 'Drafts';
type Billing = 'monthly' | 'annually';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const KULCOIN_ICON = require('../assets/coin.png');

interface SubscriptionTier {
  name: string;
  price: string;
  perks: string[];
}

type LibraryVideo = {
  id: string;
  title: string;
  views: string;
  date: string;
  duration: string;
  category: string;
  img: string;
  likes: string;
  premium?: boolean;
  draft?: boolean;
};

const INITIAL_SUBSCRIPTION: SubscriptionTier = {
  name: 'Kulsah',
  price: '9.99',
  perks: [
    'Exclusive Feed Access',
    'Direct Messaging',
    'Badge of Honor',
  ],
};



const MONTHLY_KULCOINS = 100;
const YEARLY_KULCOINS = 1000;
const videos = [
  { id: 'v1', title: 'Moonlight Symphony', views: '1.2M', duration: '4:20', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600' },
  { id: 'v2', title: 'Summer Tour Highlights', views: '450K', duration: '12:15', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600' },
  { id: 'v3', title: 'Velvet Signal', views: '856K', duration: '3:41', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600' },
  { id: 'v4', title: 'Orbit Session', views: '2.1M', duration: '5:08', img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=600' },
  { id: 'v5', title: 'Neon Rehearsal', views: '432K', duration: '2:57', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=600' },
  { id: 'v6', title: 'Pulse Room', views: '1.5M', duration: '4:56', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=600' },
];
const premiumVideos = [
  { id: 'p1', title: 'Project Node #103', views: 'Members only', img: 'https://picsum.photos/seed/prem1/800/450' },
  { id: 'p2', title: 'Project Node #104', views: 'Premium drop', img: 'https://picsum.photos/seed/prem2/800/450' },
  { id: 'p3', title: 'Project Node #105', views: 'Vault access', img: 'https://picsum.photos/seed/prem3/800/450' },
  { id: 'p4', title: 'Studio Artifact', views: 'Exclusive cut', img: 'https://picsum.photos/seed/prem4/800/450' },
  { id: 'p5', title: 'Signal Archive', views: 'Private replay', img: 'https://picsum.photos/seed/prem5/800/450' },
  { id: 'p6', title: 'Afterglow Session', views: 'Locked episode', img: 'https://picsum.photos/seed/prem6/800/450' },
];
const events = [
  { id: 'e1', title: 'Neon Nights: Live Concert', meta: 'Sept 15, 2024', price: 'Free', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600', location: 'Virtual Arena' },
  { id: 'e2', title: 'Synthwave Workshop', meta: 'Sept 20, 2024', price: '$25.00', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600', location: 'Creator Studio' },
];
const tickets = [
  { id: 't1', title: 'Neon Nights: Live Concert', meta: 'Sept 15, 2024 - Virtual Arena' },
  { id: 't2', title: 'Synthwave Workshop', meta: 'Sept 20, 2024 - Creator Studio' },
];
const challenges = [
  { id: 'c1', title: 'Vocal Harmony Challenge', meta: '45 fans - $300 + Feature', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800' },
  { id: 'c2', title: 'Midnight Remix', meta: '12 fans - Studio Equipment', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800' },
];
const favorites = [
  { id: 'f1', title: 'Urban Rhythm', views: '240K', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=600' },
  { id: 'f2', title: 'Digital Dreams', views: '1.1M', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
];
const sounds = [
  { id: 's1', title: 'Midnight Echoes (Stem)', meta: 'Kulsah Beats - 0:30', usage: '1.2K uses' },
  { id: 's2', title: 'Synthwave Pulse', meta: 'Retro Wave - 0:15', usage: '850 uses' },
];
const initialLibraryVideos: LibraryVideo[] = [
  { id: 'v1', title: 'Moonlight Symphony (Official Track)', views: '1.2M', date: 'Aug 24, 2024', duration: '4:20', category: 'Music Videos', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600', likes: '142K' },
  { id: 'v2', title: 'Summer Tour Highlights Vlog', views: '450K', date: 'Aug 22, 2024', duration: '12:15', category: 'Vlogs', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600', likes: '54K' },
  { id: 'v3', title: 'Studio Rehearsal Session #4 (Behind the Scenes)', views: '120K', date: 'Aug 20, 2024', duration: '45:00', category: 'Sessions', img: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=600', likes: '12K' },
  { id: 'v4', title: 'Late Night Synth Production & Sound Layering', views: '89K', date: 'Aug 18, 2024', duration: '3:45', category: 'Tutorials', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600', likes: '9.8K' },
  { id: 'pv1', title: 'Odo Pa feat. Kweku Flick (Official Video)', views: '849K', date: 'Jul 15, 2024', duration: '2:36', category: 'Music Videos', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800', likes: '98K', premium: true },
  { id: 'pv4', title: 'You & I [Remix] (Official Lyric Video)', views: '64K', date: 'Jun 10, 2024', duration: '2:41', category: 'Sessions', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800', likes: '8K', premium: true },
  { id: 'pv6', title: 'Put It On God ft. AlorG (Exclusive Raw Tape)', views: '403K', date: 'May 05, 2024', duration: '3:32', category: 'Sessions', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', likes: '42K', premium: true },
  { id: 'v5', title: 'Acoustic Soul Session (Direct Studio Feed)', views: '210K', date: 'Apr 28, 2024', duration: '3:10', category: 'Sessions', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=600', likes: '19K' },
  { id: 'v6', title: 'In-Ear Focus & Audio Monitor Setup Guide', views: '73K', date: 'Mar 15, 2024', duration: '8:45', category: 'Tutorials', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600', likes: '6.7K' },
  { id: '4', title: 'Secret Project 24 (Visual Album Outline)', views: '0', date: 'Just now', duration: '9:15', category: 'Drafts', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=400', likes: '0', draft: true },
  { id: 'dv2', title: 'Cyberpunk Beats Jam [WIP Raw Take]', views: '0', date: 'Just now', duration: '5:40', category: 'Drafts', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400', likes: '0', draft: true },
];



const  ArtistProfile: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const elevatedSurface = isDark ? 'rgba(31, 16, 34, 0.75)' : theme.card;
  const isTablet = width >= 768;
  const gridColumns = 3;
  const gridGap = isTablet ? 5 : 1;
  const gridHorizontalPadding = isTablet ? 15 : 3;
  const gridItemWidth = `${99.8 / gridColumns}%` as const;
  const route = useRoute<any>();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(84200);
  const isOwner = route.params?.isOwner ?? false;
  const name = route.params?.id || 'Kulsah';
  // const isOwner = !route.params?.id || route.params?.id === 'Me';
  const tabs = useMemo(() => {
    if (isOwner) {
      return ['Videos', 'Library', 'Premium',  'Tickets', 'Events', 'Challenges', 'Favorites', 'Saved'] as Tab[];
    }
    return ['Videos', 'Library', 'Premium',  'Events', 'Challenges'] as Tab[];
  }, [isOwner]);
  const [activeTab, setActiveTab] = useState<Tab>('Videos');
  const [librarySubTab, setLibrarySubTab] = useState<LibrarySubTab>('All');
  const [selectedSub, setSelectedSub] = useState<SubscriptionTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [coinBalance, setCoinBalance] = useState(1250);
  const [showKulCoinPrompt, setShowKulCoinPrompt] = useState(false);
  const [toast, setToast] = useState('');
  const [following, setFollowing] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<Billing>('monthly');
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);
  const [libraryVideos, setLibraryVideos] = useState<LibraryVideo[]>(initialLibraryVideos);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<LibraryVideo | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const ping = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const share = async () => { try { await Share.share({ title: `${name} on Kulsah`, message: `Check out ${name}'s creative universe on Kulsah!` }); } catch { ping('Share failed'); } };

  useEffect(() => subscribeUser(setCurrentUser), []);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('pulsar_library_videos')
      .then((stored) => {
        if (stored && mounted) {
          setLibraryVideos(JSON.parse(stored));
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('Videos');
    }
  }, [activeTab, tabs]);
  useEffect(() => {
    if (librarySubTab === 'Drafts' && !isOwner) {
      setLibrarySubTab('All');
    }
  }, [isOwner, librarySubTab]);

  const persistLibraryVideos = (videosToPersist: LibraryVideo[]) => {
    setLibraryVideos(videosToPersist);
    void AsyncStorage.setItem('pulsar_library_videos', JSON.stringify(videosToPersist));
  };

  const updateLibraryVideo = (videoId: string, patch: Partial<LibraryVideo>) => {
    persistLibraryVideos(libraryVideos.map((video) => (video.id === videoId ? { ...video, ...patch } : video)));
  };

  const deleteLibraryVideo = (videoId: string) => {
    Alert.alert('Delete Video', 'Are you sure you want to delete this video from your catalog?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setActiveMenuId(null) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          persistLibraryVideos(libraryVideos.filter((video) => video.id !== videoId));
          ping('Video has been deleted successfully');
          setActiveMenuId(null);
        },
      },
    ]);
  };


  const recentVideos = [
  {
    id: 'pv1',
    title: `${isOwner ? 'Me': name} - Odo Pa feat. Kweku Flick (Official Music Video)`,
    description: `Exclusive VIP access to the premium production master of "Odo Pa". Merging acoustic instruments with sub-bass synthesis, recorded live at our state studio vault.`,
    views: '849K views',
    timeAgo: '1 month ago',
    duration: '2:36',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    isMusic: true
  }
]


const musicReleases = [
  {
    id: 'pv4',
    title: 'Elena Rose Ft Olivetheboy - You & I [Remix] (Official Lyrics Video)',
    views: '64K views',
    timeAgo: '5 months ago',
    duration: '2:41',
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    isMusic: true,
  },
  {
    id: 'pv5',
    title: 'Elena Rose - You & I (Official Extended Audio Version)',
    views: '90K views',
    timeAgo: '5 months ago',
    duration: '2:41',
    img: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    isMusic: true,
  },
  {
    id: 'pv6',
    title: 'Elena Rose - Put It On God ft. AlorG (Exclusive Studio Master)',
    views: '403K views',
    timeAgo: '6 months ago',
    duration: '3:32',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    isMusic: true,
  },
];



interface Playlist {
  id: string;
  title: string;
  videoCount: number;
  views: string;
  timeAgo: string;
  img: string;
}

const playlists: Playlist[] = [
  {
    id: 'pl1',
    title: 'VIP Acoustic Sessions',
    videoCount: 3,
    views: '1.2M views',
    timeAgo: 'Updated 2 days ago',
    img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'pl2',
    title: 'Behind The Scenes & Vlogs',
    videoCount: 3,
    views: '250K views',
    timeAgo: 'Updated 1 week ago',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
  },
];


const PlaylistSection = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const isSubscribed = false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, {
            // marginVertical: 10,
                fontSize: fontSize.b2.fontSize + 2,
                fontFamily: fontSize.b2.fontFamily,
                lineHeight: fontSize.b2.fontSize + 4,
                paddingLeft: 16,
                color: theme.text,
          }]}>Playlists</Text>

          <MaterialIcons
            name="chevron-right"
            size={22}
            color={theme.textSecondary}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {playlists.map(item => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => {
              navigation.navigate('PlaylistPlayer', { id: item.id });
            }}
          >
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: item.img }}
                style={styles.thumbnail}
              />

              <View style={styles.playlistOverlay}>
                <MaterialIcons
                  name="playlist-play"
                  size={24}
                  color="#d4d4d8"
                />

                <Text style={styles.videoCount}>
                  {item.videoCount} VIDEOS
                </Text>
              </View>

              {!isSubscribed && (
                <View style={styles.lockOverlay}>
                  <View style={styles.lockCircle}>
                    <MaterialIcons
                      name="lock"
                      size={16}
                      color={PRIMARY_COLOR}
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.info}>
              <Text
                numberOfLines={2}
                style={[styles.playlistTitle, {...fontSize.b4, color: theme.text}]}
              >
                {item.title}
              </Text>

              <Text style={[styles.meta, {...fontSize.b5, color: theme.textSecondary}]}>
                {item.views} • {item.timeAgo}
              </Text>

              {/* {isSubscribed ? (
                <View style={styles.unlockedBadge}>
                  <View style={styles.dot} />

                  <Text style={styles.unlockedText}>
                    Unlocked
                  </Text>
                </View>
              ) : (
                <View style={styles.vaultBadge}>
                  <MaterialIcons
                    name="stars"
                    size={10}
                    color="#cca514"
                  />

                  <Text style={styles.vaultText}>
                    Studio Vault
                  </Text>
                </View>
              )} */}
            </View>

            <Pressable
              style={[
                styles.shareButton,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                },
              ]}
              onPress={() => {
                console.log('share');
              }}
            >
              <MaterialIcons
                name="share"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

  const renderGrid = (
    items: Array<{ id: string; title: string; views?: string; img?: string }>,
    onPressItem?: () => void
  ) => (
    <View style={s.videoGridWrap}>
      <View style={[s.videoGrid, { paddingHorizontal: gridHorizontalPadding }]}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            if (onPressItem) {
              onPressItem();
              return;
            }
            if (currentUser?.role === 'creator') {
              navigation.navigate('MainTabs');
            }
          }}
          style={[
            s.videoGridCard,
            {
              width: gridItemWidth,
              height: 180,
              marginBottom: gridGap,
              backgroundColor: isDark ? '#0f172a' : theme.surface,
            },
          ]}
        >
          {item.img ? <Image source={{ uri: item.img }} style={s.videoGridImage} /> : null}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={s.videoGridOverlay}
          />
          <View style={s.videoGridMeta}>
            <MaterialIcons name="play-arrow" size={14} color="#fff" />
            <Text style={s.videoGridMetaText}>{item.views ?? item.title}</Text>
          </View>
        </Pressable>
      ))}
      </View>
    </View>
  );

  const renderLibrary = () => {
    const isSubscribed = Boolean((currentUser as any)?.subscribedTo?.includes(name)) || isOwner;
    const canManageLibrary = isOwner || currentUser?.role === 'creator';
    const subTabs = (isOwner ? ['All', 'Public', 'Premium', 'Drafts'] : ['All', 'Public', 'Premium']) as LibrarySubTab[];
    const filteredLibrary = libraryVideos.filter((item) => {
      if (librarySubTab === 'Drafts') return Boolean(item.draft);
      if (item.draft) return false;
      if (librarySubTab === 'All') return true;
      if (librarySubTab === 'Premium') return Boolean(item.premium);
      return !item.premium;
    });

    return (
      <View style={s.librarySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.librarySubTabs}>
          {subTabs.map((subTab) => {
            const active = librarySubTab === subTab;
            return (
              <Pressable
                key={subTab}
                onPress={() => setLibrarySubTab(subTab)}
                style={[s.librarySubTab, { backgroundColor: active ? PRIMARY_COLOR : faintSurface }]}
              >
                <Text style={[s.librarySubTabText, { color: active ? '#fff' : theme.textSecondary }]}>{subTab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.libraryGrid}>
          {filteredLibrary.map((item) => {
            const isLocked = Boolean(item.premium) && !isSubscribed;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setActiveMenuId(null);
                  if (isLocked) {
                    ping('Unlock the exclusive Galaxy tier to access this library video!');
                    openSubscription();
                    return;
                  }
                  ping(`Loading Video: ${item.title}`);
                  navigation.navigate('VideoPlayer');
                }}
                style={[s.libraryCard, { backgroundColor: isDark ? '#0f172a' : theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.border }]}
              >
                <Image source={{ uri: item.img }} style={s.libraryImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFillObject} />

                <View style={[s.libraryBadge, { backgroundColor: item.draft ? 'rgba(82,82,91,0.92)' : item.premium ? 'rgba(245,158,11,0.88)' : 'rgba(37,99,235,0.88)', borderStyle: item.draft ? 'dashed' : 'solid' }]}>
                  <MaterialIcons name={item.draft ? 'drafts' : item.premium ? 'stars' : 'public'} size={10} color="#fff" />
                  <Text style={s.libraryBadgeText}>{item.draft ? 'Draft' : item.premium ? 'Premium' : 'Public'}</Text>
                </View>

                {canManageLibrary ? (
                  <View style={s.libraryMenuWrap}>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      style={s.libraryMenuTrigger}
                    >
                      <MaterialIcons name="more-vert" size={20} color="#fff" />
                    </Pressable>

                    {activeMenuId === item.id ? (
                      <View style={[s.libraryMenu, { backgroundColor: isDark ? '#09090b' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border }]}>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            setEditingVideo(item);
                            setEditTitleValue(item.title);
                            setActiveMenuId(null);
                          }}
                          style={s.libraryMenuItem}
                        >
                          <MaterialIcons name="edit" size={15} color={theme.textSecondary} />
                          <Text style={[s.libraryMenuText, { color: theme.text }]}>Edit Title</Text>
                        </Pressable>

                        {item.draft ? (
                          <>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation();
                                updateLibraryVideo(item.id, { draft: false, premium: false });
                                ping('Video published to Public!');
                                setActiveMenuId(null);
                              }}
                              style={s.libraryMenuItem}
                            >
                              <MaterialIcons name="public" size={15} color="#2563eb" />
                              <Text style={[s.libraryMenuText, { color: theme.text }]}>Publish to Public</Text>
                            </Pressable>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation();
                                updateLibraryVideo(item.id, { draft: false, premium: true });
                                ping('Video published to Premium!');
                                setActiveMenuId(null);
                              }}
                              style={s.libraryMenuItem}
                            >
                              <MaterialIcons name="stars" size={15} color="#f59e0b" />
                              <Text style={[s.libraryMenuText, { color: theme.text }]}>Publish as Premium</Text>
                            </Pressable>
                          </>
                        ) : (
                          <>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation();
                                updateLibraryVideo(item.id, { premium: !item.premium });
                                ping(`Video moved to ${item.premium ? 'Public' : 'Premium'}`);
                                setActiveMenuId(null);
                              }}
                              style={s.libraryMenuItem}
                            >
                              <MaterialIcons name={item.premium ? 'public' : 'stars'} size={15} color={theme.textSecondary} />
                              <Text style={[s.libraryMenuText, { color: theme.text }]}>Move to {item.premium ? 'Public' : 'Premium'}</Text>
                            </Pressable>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation();
                                updateLibraryVideo(item.id, { draft: true });
                                ping('Video has been moved to Drafts!');
                                setActiveMenuId(null);
                              }}
                              style={s.libraryMenuItem}
                            >
                              <MaterialIcons name="drafts" size={15} color="#71717a" />
                              <Text style={[s.libraryMenuText, { color: theme.text }]}>Revert to Draft</Text>
                            </Pressable>
                          </>
                        )}

                        <View style={[s.libraryMenuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }]} />
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            deleteLibraryVideo(item.id);
                          }}
                          style={s.libraryMenuItem}
                        >
                          <MaterialIcons name="delete" size={15} color="#f43f5e" />
                          <Text style={[s.libraryMenuText, { color: '#e11d48' }]}>Delete Video</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={s.libraryDuration}>
                  <Text style={s.libraryDurationText}>{item.duration}</Text>
                </View>

                {!isLocked ? (
                  <View style={s.libraryPlay}>
                    <MaterialIcons name="play-arrow" size={25} color="#fff" />
                  </View>
                ) : null}

                {isLocked ? (
                  <View style={s.libraryLockOverlay}>
                    <View style={s.libraryLockIcon}>
                      <MaterialIcons name="lock" size={22} color="#cca514" />
                    </View>
                    <Text style={s.libraryLockText}>VIP Subscribers Only</Text>
                  </View>
                ) : null}

                <View style={s.libraryCardText}>
                  <Text numberOfLines={1} style={s.libraryMeta}>{item.category || 'Sessions'}</Text>
                  <Text numberOfLines={1} style={s.libraryTitle}>{item.title}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Modal visible={Boolean(editingVideo)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEditingVideo(null)}>
          <View style={s.libraryEditOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setEditingVideo(null)} />
            <View style={[s.libraryEditCard, { backgroundColor: isDark ? '#09090b' : theme.card, borderColor: theme.border }]}>
              <Text style={[s.libraryEditTitle, { color: theme.text }]}>Edit Title</Text>
              <TextInput
                value={editTitleValue}
                onChangeText={setEditTitleValue}
                placeholder="Video title"
                placeholderTextColor={theme.textSecondary}
                style={[s.libraryEditInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)' }]}
              />
              <View style={s.libraryEditActions}>
                <Pressable onPress={() => setEditingVideo(null)} style={[s.libraryEditButton, { backgroundColor: faintSurface }]}>
                  <Text style={[s.libraryEditButtonText, { color: theme.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!editingVideo) return;
                    const nextTitle = editTitleValue.trim();
                    if (!nextTitle) {
                      ping('Title cannot be empty');
                      return;
                    }
                    updateLibraryVideo(editingVideo.id, { title: nextTitle });
                    setEditingVideo(null);
                    ping('Video title updated');
                  }}
                  style={[s.libraryEditButton, s.libraryEditPrimary]}
                >
                  <Text style={[s.libraryEditButtonText, { color: '#fff' }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    if (billingCycle === 'monthly') return price.toFixed(2);
    return (price * 12 * 0.85).toFixed(2);
  };

  const subscriptionCost = billingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS;
  const subscriptionLabel = billingCycle === 'monthly' ? 'Monthly' : 'Annual';

  const openSubscription = () => {
    setSelectedSub(INITIAL_SUBSCRIPTION);
    setShowSuccess(false);
  };

  const creatorToggle = async () => {
    const nextUser: User = {
      id: currentUser?.id || user?.id || 'mila_ray_01',
      name: currentUser?.name || user?.name || 'Mila Ray',
      role: 'creator',
    };
    setUser(nextUser);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
    setIsRoleSwitchModalOpen(false);
    navigation.navigate('MainTabs', { screen: 'Galaxy' });
  };

  const closeSubscription = () => {
    if (isProcessing) return;
    setSelectedSub(null);
    setShowSuccess(false);
  };

  const handlePurchase = () => {
    if (!selectedSub) return;
    if (coinBalance > subscriptionCost) {
      setShowKulCoinPrompt(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setCoinBalance((prev) => prev - subscriptionCost);
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedSub(null);
        setShowSuccess(false);
        ping(`Welcome to ${selectedSub.name}!`);
      }, 1800);
    }, 1200);
  };

  return (
    <View style={[s.screen, { backgroundColor: theme.screen }]}>
      {toast ? <Text style={s.toast}>{toast}</Text> : null}
      <View style={[s.header, { backgroundColor: 'transparent', }]}>
        <View style={s.headerTopRow}>
          <Pressable onPress={() => navigation.goBack()} style={[s.headerRoundBtn, { backgroundColor: faintSurface, borderColor: theme.border }]}>
            <MaterialIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>

          <View style={s.headerTitleWrap}>
            <Text numberOfLines={1} style={[s.headerTitle, { color: theme.text }]}>{isOwner ? 'Profile' : name}</Text>
            <Text numberOfLines={1} style={s.headerSubtitle}>{isOwner ? 'Your Galaxy' : 'Creator Universe'}</Text>
          </View>

          <Pressable onPress={isOwner ? () => navigation.navigate('Settings') : share} style={[s.headerRoundBtn, { backgroundColor: faintSurface, borderColor: theme.border }]}>
            <MaterialIcons name={isOwner ? 'settings' : 'share'} size={20} color={theme.text} />
          </Pressable>
        </View>
        <View />
      </View>
      <ScrollView
      stickyHeaderIndices={isOwner?[3]:[4]}
      contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ImageBackground
        resizeMode= 'contain'
        source={{ uri: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792408/banner_image_001_ewjudx.jpg' }} style={[s.cover, {width: SCREEN_WIDTH}]}><LinearGradient colors={isDark ? ['rgba(0,0,0,0.1)', '#060913'] : ['rgba(255,255,255,0.06)', '#f8fafc']} style={StyleSheet.absoluteFillObject} /></ImageBackground>
        <View style={s.hero}>
          <View style={[s.avatarWrap, { borderColor: 'rgba(59 130 246 / 0.5)' }]}>
            <Image source={{ uri: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792408/profile_image_001_utl9qa.jpg' }}
                style={s.image} />
                  <Pressable
                  onPress={()=>{
                    navigation.navigate('StreakReward')
                  }}
                  style={[s.fire, { borderColor: theme.screen }]}>
                  <FireIcon height={15} width={15}/><Text style={s.fireText}>5</Text>
                  </Pressable>
                </View>
          <View style={{
            flexDirection: 'row',
            gap: 5,
            alignItems: 'center',
            justifyContent: 'center',
            // backgroundColor: 'red',
            // height: 35
          }}>
            <Text style={[s.name, { color: theme.text }]}>{isOwner ? "Me": name}</Text>
            <VerifiedIcon height={24} width={24} fill={PRIMARY_COLOR}/>
          </View>
          <Text style={s.role}>Universal Creator</Text>
          {/* <View style={s.stats}><Text style={s.stat}>14,200{'\n'}<Text style={s.muted}>Followers</Text></Text><Text style={s.stat}>84.2K{'\n'}<Text style={s.muted}>Likes</Text></Text><Text style={[s.stat, s.purple]}>2,842{'\n'}<Text style={s.purple}>Subscribers</Text></Text></View> */}
          <View style={[s.stats, isTablet && s.statsTablet]}>
            <View style={s.statBlock}>
              <Text style={[s.statValue, { color: theme.text }]}>{isFollowing ? '14,201' : '14,200'}</Text>
              <Text style={[s.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
            <View style={s.sep} />
            <View style={s.statBlock}>
              <Text style={[s.statValue, { color: theme.text }]}>{(likeCount / 1000).toFixed(1)}K</Text>
              <Text style={[s.statLabel, { color: theme.textSecondary }]}>Likes</Text>
            </View>
            <View style={s.sep} />
            <Pressable style={s.statBlock} onPress={() => isOwner && navigation.navigate('/subscribers')}>
              <Text style={[s.statValue, {color: theme.text}]}>2,842</Text>
              <Text style={[s.statLabel, {color: theme.text}]}>Subscribers</Text>
            </Pressable>
          </View>
          <View style={[s.actions, ]}>{isOwner ? <>
          <Pressable onPress={() => navigation.navigate('Settings')} style={[s.primary, {width: '30%'}]}>
            <EditIcon height={24} width={24} fill={theme.background}/>
            <Text style={[s.btnText, {color: theme.background}]}>{" "}Edit</Text>
            </Pressable>
            <Pressable onPress={share}
            style={[s.secondary, { width: '30%', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface, flexDirection: 'row' , alignItems: 'center', justifyContent: 'center'}]}>
            <MaterialIcons name='share' size={20} color= {theme.text}/>
            <Text style={[s.btnText, { color: theme.text, }]}>{" "}Share</Text></Pressable></> :
            <><Pressable onPress={() => navigation.navigate('Chat')}
            style={[s.iconAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}>
              <MaterialIcons name="mail" size={20} color={theme.text} /></Pressable>
                <Pressable onPress={() => { setFollowing((v) => !v); ping(following ? 'Unfollowed' : 'Following'); }}
                    style={[s.secondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface, width: '30%' }]}>
                      <Text style={[s.btnText, { color: theme.text }]}>{following ? 'Following' : 'Follow'}
                        </Text></Pressable>
                        <Pressable onPress={openSubscription} style={[s.primary, {width: '30%'}]}>
                          <Text style={s.btnText}>Subscribe</Text></Pressable>
                          </>}
                          </View>
          {currentUser?.role !== 'creator' ? (
            <Pressable onPress={() => setIsRoleSwitchModalOpen(true)} style={s.switchCreatorButton}>
              <LinearGradient
                colors={['#4f46e5', PRIMARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.switchCreatorGradient}
              >
                <MaterialIcons name="rocket-launch" size={18} color="#ffffff" />
                <Text style={s.switchCreatorText}>Switch to Creator</Text>
                <MaterialIcons name="chevron-right" size={20} color="#ffffff" />
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>

        <Text style={[s.bio, { color: theme.textSecondary }]}>"Exploring the nexus of synthwave rhythms and cinematic soul. Join the journey through the star systems of sound."</Text>

        {/* <View style={s.membership}><View style={s.membershipHeader}><Text style={s.section}>Membership</Text><View style={s.toggle}><Pressable onPress={() => setBilling('monthly')} style={[s.toggleBtn, billing === 'monthly' && s.toggleOn]}><Text style={s.toggleText}>Monthly</Text></Pressable><Pressable onPress={() => setBilling('annually')} style={[s.toggleBtn, billing === 'annually' && s.toggleOn]}><Text style={s.toggleText}>Yearly</Text></Pressable></View></View><Pressable onPress={() => { setSelectedSub(true); setStep('details'); }} style={s.card}><Text style={s.cardLabel}>{SUB.name}</Text><Text style={s.price}>${price} / {billing === 'monthly' ? 'mo' : 'yr'}</Text>{SUB.perks.map((perk) => <Text key={perk} style={s.perk}>- {perk}</Text>)}</Pressable></View> */}
        {!isOwner &&
        <>
        <View style={s.membershipHeader}>
            <Text style={[s.section, { color: theme.text }]}>Membership</Text>
            <View style={{
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
              borderColor: theme.border,
              borderWidth: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#0000000d',
              borderRadius: 18,
              padding: 6,
              marginLeft: 6
            }}>
              <Pressable style={[s.switchBtn, billingCycle === 'monthly' && s.switchBtnOn]} onPress={() => setBillingCycle('monthly')}>
                <Text style={[s.switchText, billingCycle === 'monthly' && s.switchTextOn]}>Monthly</Text>
              </Pressable>
              <Pressable style={[s.switchBtn, billingCycle === 'annually' && s.switchBtnOn]} onPress={() => setBillingCycle('annually')}>
                <Text style={[s.switchText, billingCycle === 'annually' && s.switchTextOn]}>Yearly</Text>
                <View style = {{
                  backgroundColor: "#22c55e30",
                  borderRadius: 5,
                  marginLeft: 5,
                  paddingHorizontal: 3,
                }}>
                  <Text
                      style = {{
                        color: "rgb(34 197 94)",
                        ...fontSize.b5,
                        lineHeight: fontSize.b5.fontSize + 1,
                        textTransform: 'uppercase'
                      }}>-15%</Text>
                </View>
              </Pressable>
            </View>
          </View>


          <Pressable style={[s.card, { backgroundColor: isDark ? '#ffffff0d' : theme.card, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: isDark ? 0 : 0.08, shadowRadius: 16, elevation: isDark ? 0 : 2 }]} onPress={openSubscription}>
            <Text style={[s.cardTitle, { color: theme.textSecondary }]}>{INITIAL_SUBSCRIPTION.name}</Text>
            <View style={s.priceLine}>
              <Text style={[s.cardPrice, { color: theme.text }]}>${calculatePrice(INITIAL_SUBSCRIPTION.price)}</Text>
              <Text style={[s.priceSuffix, { color: theme.textSecondary }]}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</Text>
            </View>
            {billingCycle === 'annually' && (
              <Text style={s.saveText}>Billed yearly. Save ${(parseFloat(INITIAL_SUBSCRIPTION.price) * 12 * 0.15).toFixed(2)}/year</Text>
            )}
            {INITIAL_SUBSCRIPTION.perks.map((perk, i) => (
              <View key={i} style={s.perkRow}>
                <MaterialIcons name="check-circle-outline" size={18} color={PRIMARY_COLOR} />
                <Text style={[s.perk, { color: theme.text }]}>{perk}</Text>
              </View>
            ))}
            <Pressable onPress={openSubscription}>
              <View style = {{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                paddingVertical: 15,
                paddingHorizontal: 10,
                alignItems: "center",
                marginTop: 10
              }}>
                <Text style = {{
                  color: theme.text,
                  // fontWeight: 'bold',
                  ...fontSize.b5,
                  lineHeight: fontSize.b5.fontSize + 1,
                }}>
                  {billingCycle === 'monthly' ? 'SUBSCRIBE MONTHLY': 'SUBSCRIBE ANNUALLY'}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </>}


        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.tabs, {backgroundColor: theme.screen}]}>{tabs.map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tab}>
          {
            tab === 'Videos' ? <PlayIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Premium' ? <StarsIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Library' ? <LibraryMusic height={22} width={24} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Tickets'? <LocalActivity height={22} width={24} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Events'? <CalenderIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Challenges'?<TrophyIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Favorites'? <MaterialIcons name="favorite-border" size={22} color={activeTab === tab ? '#f43f5e' : '#69738d'}/>: <BookmarkIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>
          }
          {/* <MaterialIcons name={{ Videos: 'play-circle', Premium: 'stars', Events: 'calendar-month', Challenges: 'emoji-events', Favorites: 'favorite', Saved: 'bookmark' }[tab]}
          size={22} color={activeTab === tab ? PRIMARY_COLOR : '#69738d'} /> */}
          <Text style={[s.tabText, { color: activeTab === tab ? PRIMARY_COLOR : theme.textSecondary }, activeTab === tab && s.tabOn]}>{tab}</Text>
          {activeTab === tab ? <View style={s.tabIndicator} /> : null}
          </Pressable>)}</ScrollView>

        <View style={s.body}>
          {activeTab === 'Videos' ? renderGrid(videos) : null}
          {activeTab === 'Premium'
            ? 
            // renderGrid(premiumVideos, () => {
            //     if (isOwner) {
            //       navigation.navigate('CreatorLibrary');
            //     } else {
            //       openSubscription();
            //     }
            //   })
            (<View style={{
              gap: 20,
            }}>
              <Text style={{
                // marginVertical: 10,
                fontSize: fontSize.b2.fontSize+ 2,
                fontFamily: fontSize.b2.fontFamily,
                lineHeight: fontSize.b2.fontSize + 3,
                paddingHorizontal: 16,
                color: theme.text,
              }}>
                Recent Videos
              </Text>

              {recentVideos.map((video)=>(
                <View
                key = {video.id}
                style = {{
                borderRadius: 24,
                // overflow: 'hidden',
                // alignSelf: 'flex-start',
                height: 320,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)': theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                // backgroundColor: 'blue',
                gap: 10,
                shadowColor: theme.shadow,
                shadowOffset: {
                  width: 0,
                  height: 20,
                },
                shadowOpacity: 0.1,
                shadowRadius: 25,
                marginHorizontal: 16,
                elevation: 12,
              }}>
                <Image source={{ uri : video.img}} style={{
                  height: '55%',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}/>
                <View style={{
                  position: 'absolute',
                  backgroundColor: 'transparent',
                  top: 0,
                  left: 0,
                  right: 0,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  height: '55%',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <View
                    style={{
                      width: 66,
                      height: 66,
                      borderRadius: 33,
                      backgroundColor: primaryColorAlpha(0.24),
                      borderWidth: 1,
                      borderColor: primaryColorAlpha(0.5),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    // height: 20,
                    alignSelf: 'baseline',
                    backgroundColor: '#00000097',
                    alignItems: 'center',
                    paddingHorizontal: 3.5,
                    paddingVertical: 3,
                    borderRadius: 999
                  }}>
                    <MaterialIcons name="music-note" color="white" size={16}/>
                    <Text
                    style={{
                      ...fontSize.b2,
                      color: 'white'
                    }}
                    >{video.duration}</Text>
                  </View>
                </View>
                <View style={{
                  flexDirection: 'row',
                  paddingHorizontal: 15,
                  gap: 10,
                  // width: SCREEN_WIDTH
                }}>

                  <View style={{
                    borderRadius: 999,
                    padding: 1,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.18)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.10)',
                    height: 45,
                    width: 45,
                    overflow: 'hidden'
                  }}>
                    <Image source={{uri: video.img}} style={{height: '100%', width: '100%', borderRadius: 999}} />
                  </View>
                  <View style={{
                    width: '80%',
                    gap: 5,
                    // borderBottomWidth: 0.5,
                    // borderBottomColor: 'rgba(100, 116, 139, 0.09)'
                  }}>
                    <Text
                  numberOfLines={2}
                  style={{
                    fontSize: fontSize.b2.fontSize,
                    fontFamily: 'Pogonia_700Bold',
                    color: theme.text,
                  }}
                  >{video.title}</Text>

                  <Text style={{
                    fontSize: fontSize.b4.fontSize,
                    fontFamily: 'Inter_600SemiBold',
                    color: theme.textSecondary,
                    marginBottom: 15,
                  }}>
                    {`${video.views} • ${video.timeAgo}`}
                  </Text>

                  <View style={{
                    height: 0.5,
                    backgroundColor: theme.border,
                  }}/>

                  <Text 
                  numberOfLines = {2}
                  style={{
                    marginTop: 10,
                    color: theme.textSecondary,
                    fontSize: fontSize.b4.fontSize,
                    fontFamily: 'Inter_700Bold',
                  }}>
                    Exclusive Master Series
                  </Text>
                  </View>
                </View>
              </View>))}

              <PlaylistSection />

              <View style={[styles.section, {paddingHorizontal: 16}]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, {
                 fontSize: fontSize.b2.fontSize + 2,
                fontFamily: fontSize.b2.fontFamily,
                lineHeight: fontSize.b2.fontSize + 4,
                color: theme.text,
              }]}>Videos</Text>

                  <MaterialIcons
                    name="chevron-right"
                    size={18}
                    color={theme.textSecondary}
                  />
                </View>

                <View style={styles.releaseList}>
                  {musicReleases.map(item => {
                    const isSubscribed = false;

                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.releaseCard,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
                          },
                        ]}
                        onPress={() => {
                          if (isSubscribed) {
                            console.log('play premium');
                          } else {
                            console.log('show subscription');
                          }
                        }}
                      >
                        {/* Thumbnail */}
                        <View style={styles.thumbContainer}>
                          <Image
                            source={{ uri: item.img }}
                            style={styles.playListthumbnail}
                          />

                          {!isSubscribed && (
                            <View style={styles.playListlockOverlay}>
                              <View style={styles.lockButton}>
                                <MaterialIcons
                                  name="lock"
                                  size={15}
                                  color={PRIMARY_COLOR}
                                />
                              </View>
                            </View>
                          )}

                          <View style={styles.durationBadge}>
                            {item.isMusic && (
                              <MaterialIcons
                                name="music-note"
                                size={10}
                                color="#d4d4d8"
                              />
                            )}

                            <Text style={styles.durationText}>
                              {item.duration}
                            </Text>
                          </View>
                        </View>

                        {/* Info */}
                        <View style={styles.infoContainer}>
                          <View>
                            <Text
                              numberOfLines={4}
                              style={[styles.videoTitle, {
                                width: '80%',
                                ...fontSize.b4,
                                lineHeight: fontSize.b4.fontSize + 2,
                                color: theme.text,
                              }]}
                            >
                              {item.title}
                            </Text>

                            <Text style={[styles.metaText, {...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, color: theme.textSecondary}]}>
                              {item.views} • {item.timeAgo}
                            </Text>
                          </View>

                          {/* {isSubscribed ? (
                            <View style={styles.unlockedPlayListBadge}>
                              <View style={styles.greenDot} />

                              <Text style={styles.unlockedText}>
                                Unlocked
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.premiumBadge}>
                              <MaterialIcons
                                name="stars"
                                size={10}
                                color="#cca514"
                              />

                              <Text style={styles.premiumText}>
                                Studio Master
                              </Text>
                            </View>
                          )} */}
                        </View>

                        {/* More Button */}
                        <Pressable
                          style={styles.moreButton}
                          onPress={() => {
                            console.log('more');
                          }}
                        >
                          <MaterialIcons
                            name="more-vert"
                            size={20}
                            color={theme.textSecondary}
                          />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              </View>)
              : null}
          {activeTab === 'Library' ? renderLibrary() : null}




          {activeTab === 'Tickets' ? (
            <View style={[s.stack, {marginHorizontal: 18}]}>
              {tickets.map((ticket) => (
                <Pressable
                  key={ticket.id}
                  onPress={() => navigation.navigate('EventDetail')}
                  style={[
                    s.ticketCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={s.ticketLeft}>
                    <View style={s.ticketIconWrap}>
                      <TicketIcon height={24} width={24}/>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.ticketTitle, { color: theme.text }]}>{ticket.title}</Text>
                      <Text style={[s.ticketMeta, { color: theme.textSecondary }]}>{ticket.meta}</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {activeTab === 'Events' ? <View style={[s.stack, {marginHorizontal: 18}]}>{events.map((item) =>
            <Pressable key={item.id} onPress={() => navigation.navigate('EventDetail')} style={[s.banner, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}>
              <Image source={{ uri: item.img }} style={[s.image, {borderRadius: 0}]} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
                  <View style={s.bannerBottom}>
                    <View style={{
                      // flexDirection: 'row',
                      // justifyContent: 'space-between',
                      // alignItems: 'center',
                      // backgroundColor: 'red',
                      justifyContent: 'flex-end',
                      // backgroundColor: 'green',
                      gap: 10
                    }}>
                      <Text style={s.bannerText}>{item.title}</Text>
                      

                     <View style={{
                      flexDirection: 'row'
                     }}>
                       <View style={{
                          flexDirection: 'row',
                          // backgroundColor: 'blue',
                          alignItems: 'center'
                          // height: 50,
                          // width: 200,
                        }}>
                          <View style={{
                            borderRadius: 8,
                            backgroundColor: '#ffffff1a',
                            // backgroundColor: 'green',
                            // padding: 6,
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 30,
                            width: 30,
                          }}>
                          <CalenderIcon height={18} width={18} fill='#ffffff99' />
                          </View>
                          <View style={{
                            marginLeft: 5
                          }}>
                            <Text style={[{ color: '#ffffff66', width: '100%', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Date</Text>
                          <Text style={[s.sub, { color: '#dbe4f0', width: '70%' }]}>{item.meta}</Text>
                          </View>
                        </View>



                        <View style={{
                          flexDirection: 'row',
                          // backgroundColor: 'blue',
                          alignItems: 'center'
                          // height: 50,
                          // width: 200,
                        }}>
                          <View style={{
                            borderRadius: 8,
                            backgroundColor: '#ffffff1a',
                            // backgroundColor: 'green',
                            // padding: 6,
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 30,
                            width: 30,
                          }}>
                          <CalenderIcon height={18} width={18} fill='#ffffff99' />
                          </View>
                          <View style={{
                            marginLeft: 5
                          }}>
                            <Text style={[{ color: '#ffffff66', width: '100%', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }]}>Location</Text>
                          <Text style={[s.sub, { color: '#dbe4f0', width: '60%' }]}>{item.location}</Text>
                          </View>
                        </View>
                     </View>
                    </View>
                      <View style={{
                        // flexDirection: 'row',
                        // backgroundColor: 'blue',
                        // height: '100%',

                        // alignItems: 'center',
                        justifyContent: isOwner ? 'center' : 'space-between',
                        // gap: 10
                      }}>
                        <View style={{
                        borderWidth: 2,
                        borderColor: '#ffffff1a',
                        borderRadius: 999,
                        width: isOwner ? 90: 80,
                        height:isOwner ? 50: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                      }}>
                         <BlurView
                            intensity={50} // controls blur strength
                            tint="light"
                            style={{
                              // position: 'absolute',
                              // bottom: 0,
                              width: isOwner ? 90: 80,
                              height:isOwner ? 50: 40,
                              justifyContent: 'center',
                              alignItems: 'center',
                              // padding: 20,
                            }}
                          >
                            <Text style={{
                          color: PRIMARY_COLOR,
                          ...fontSize.b4,
                          lineHeight: fontSize.b4.fontSize + 1,
                        }}>
                          {item.price}
                        </Text>
                          </BlurView>

                      </View>


                        


                        {!isOwner && <Pressable
                        onPress={()=>{
                          navigation.navigate('EventDetail')
                        }}
                        style={{
                          backgroundColor: 'white',
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          borderRadius: 12,
                          // paddingHorizontal: 5,
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%',
                          height: 40,
                        }}>
                          <Text style={{
                            ...fontSize.b5,
                            lineHeight: fontSize.b5.fontSize + 1,
                            textAlign: 'center',
                          }}>Get{"\n"}Ticket</Text>
                        </Pressable>}


                      </View>
                  </View>
                  </Pressable>)}
                  </View> : null}
          {activeTab === 'Challenges'
            ? renderGrid(
                challenges.map((item) => ({ ...item, views: item.meta })),
                () => navigation.navigate('ChallengeFeed')
              )
            : null}
          {activeTab === 'Favorites' ? renderGrid(favorites) : null}
          {activeTab === 'Saved' ?
          <View style={[s.stack, {marginHorizontal: 18}]}>{sounds.map((sound) =>
            <Pressable key={sound.id} onPress={() => navigation.navigate('RecordContent', { sound: {sound}})}
                style={[s.sound, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderWidth: isDark ? 0 : 1,
                    borderColor: theme.border }]}>
                      <Pressable onPress={() => setPlayingSoundId((cur) => cur === sound.id ? null : sound.id)}
                          style={[s.play, playingSoundId === sound.id && s.playOn]}>
                            <MaterialIcons name={playingSoundId === sound.id ? 'pause' : 'play-arrow'} size={24} color="#fff" />
                                </Pressable><View style={{ flex: 1 }}>
                                  <Text style={[s.soundTitle, { color: theme.text }]}>
                                    {sound.title}</Text>
                                      <Text style={[s.sub, { color: theme.textSecondary }]}>{sound.meta}
                                        </Text></View>
                                        <Text style={s.purple}>{sound.usage}
                                          </Text></Pressable>)}</View> : null}
        </View>
        {/* <View style={{
          height: mediumScreen ? 120:70,
        }}/> */}
      </ScrollView>

      <Modal
        visible={isRoleSwitchModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsRoleSwitchModalOpen(false)}
      >
        <View style={s.roleModalRoot}>
          <Pressable
            style={s.roleModalBackdrop}
            onPress={() => setIsRoleSwitchModalOpen(false)}
          />
          <View style={[s.roleModalCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
            <View style={[s.roleModalIcon, { backgroundColor: isDark ? primaryColorAlphaHex('20') : theme.accentSoft }]}>
              <MaterialIcons name="rocket-launch" size={38} color={theme.accent} />
            </View>
            <View style={s.roleModalCopy}>
              <Text style={[s.roleModalTitle, { color: theme.text }]}>Switch to Creator?</Text>
              <Text style={[s.roleModalBody, { color: theme.textSecondary }]}>
                You're about to unlock creator tools. You'll be able to upload content, manage events, and track your revenue.
              </Text>
            </View>
            <View style={s.roleModalActions}>
              <Pressable
                onPress={() => {
                  setIsRoleSwitchModalOpen(false);
                  void creatorToggle();
                }}
                style={s.roleModalPrimary}
              >
                <Text style={s.roleModalPrimaryText}>Confirm Switch</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsRoleSwitchModalOpen(false)}
                style={[s.roleModalSecondary, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={[s.roleModalSecondaryText, { color: theme.text }]}>Stay as Fan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedSub} transparent animationType="slide" statusBarTranslucent onRequestClose={closeSubscription}>
        {selectedSub ? (
          <View style={s.overlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeSubscription} />
            <View style={[s.subscriptionModal, { backgroundColor: isDark ? '#08111f' : theme.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border }]}>
              <View style={[s.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.12)' }]} />
              {showSuccess ? (
                <View style={s.successWrap}>
                  <View style={s.successBadge}>
                    <MaterialIcons name="verified" size={54} color={PRIMARY_COLOR} />
                  </View>
                  <Text style={[s.successTitle, { color: theme.text }]}>Identity{'\n'}Verified</Text>
                  <Pressable onPress={closeSubscription} style={s.subscriptionPrimary}>
                    <Text style={s.subscriptionPrimaryText}>Start Watching</Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.subscriptionContent}>
                  <View style={s.subscriptionHeader}>
                    <View style={s.subscriptionIconWrap}>
                      <Image source={KULCOIN_ICON} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                    </View>
                    <View style={s.subscriptionHeaderText}>
                      <Text style={[s.subscriptionTitle, { color: theme.text }]}>{selectedSub.name}</Text>
                      <Text style={[s.subscriptionMeta, { color: theme.textSecondary }]}>
                        {subscriptionLabel} • {subscriptionCost} KulCoins
                      </Text>
                    </View>
                  </View>

                  <View style={s.subscriptionSection}>
                    <Text style={[s.subscriptionLabel, { color: theme.textSecondary }]}>Unlocked Privileges</Text>
                    {selectedSub.perks.map((perk, i) => (
                      <View
                        key={`${perk}-${i}`}
                        style={[
                          s.subscriptionPerkCard,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                          },
                        ]}
                      >
                        <View style={s.subscriptionPerkIcon}>
                          <MaterialIcons name="check-circle" size={16} color={PRIMARY_COLOR} />
                        </View>
                        <Text style={[s.subscriptionPerkText, { color: theme.text }]}>{perk.trim()}</Text>
                      </View>
                    ))}

                    <View style={s.balanceCard}>
                      <View style={s.balanceRow}>
                        <Text style={s.balanceLabel}>Your Balance</Text>
                        <Text style={[s.balanceValue, { color: theme.text }]}>{coinBalance} KC</Text>
                      </View>
                      <View style={s.balanceRow}>
                        <Text style={[s.balanceSubLabel, { color: theme.textSecondary }]}>Subscription Cost</Text>
                        <Text style={s.balanceCost}>-{subscriptionCost} KC</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable onPress={handlePurchase} disabled={isProcessing} style={s.subscriptionPrimary}>
                    {isProcessing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={s.subscriptionPrimaryInner}>
                        <Text style={s.subscriptionPrimaryText}>Subscribe Now</Text>
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
      <KulCoinPrompt
        isOpen={showKulCoinPrompt}
        onClose={() => setShowKulCoinPrompt(false)}
        requiredCoins={subscriptionCost}
        currentCoins={coinBalance}
        onPurchaseKulCoins={() => {
          setShowKulCoinPrompt(false);
          setSelectedSub(null);
          setShowSuccess(false);
          navigation.navigate('TopUpCoins');
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913' },
  toast: { position: 'absolute', top: 56, alignSelf: 'center', zIndex: 40, backgroundColor: PRIMARY_COLOR, color: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  header: { paddingTop: 46, paddingBottom: 7, },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
  headerRoundBtn: { height: 40, width: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { textAlign: 'center', color: '#fff', ...fontSize.h1, lineHeight: fontSize.h1.fontSize + 1, letterSpacing: 2, textTransform: 'uppercase' },
  headerSubtitle: { color: PRIMARY_COLOR, marginTop: 4, ...fontSize.h2, lineHeight: fontSize.h2.fontSize + 1, letterSpacing: 1.5, textTransform: 'uppercase' },
  content: { paddingBottom: 120, }, cover: { height: 180, }, hero: { marginTop: -88, paddingHorizontal: 20, alignItems: 'center' }, avatarWrap: { width: 148, height: 148, borderRadius: 999, borderWidth: 1, borderColor: '#060913', padding: 7}, image: { width: '100%', height: '100%', borderRadius: 999 }, fire: { position: 'absolute', right: 12, bottom: -2, width: 40, height: 40, borderRadius: 999, backgroundColor: '#f97316', borderWidth: 0, borderColor: '#060913', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, fireText: { color: '#fff', ...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1 },
  name: {color: '#fff', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase' }, role: { marginTop: 4, color: PRIMARY_COLOR, ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 }, stat: { flex: 1, textAlign: 'center', color: '#fff', ...fontSize.n5, lineHeight: fontSize.n5.fontSize + 1 }, muted: { color: '#7d859e', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }, purple: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  actions: { marginTop: 22, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  action: { height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: PRIMARY_COLOR, minHeight: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', },
  secondary: { height: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, iconAction: { width: 56, height: 36, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, btnText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 4, textTransform: 'uppercase'}, follow: { flex: 1, height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, followOn: { backgroundColor: primaryColorAlpha(0.12) }, followText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' }, followTextOn: { color: PRIMARY_COLOR },
  bio: { paddingHorizontal: 34, marginTop: 18, marginBottom: 18, color: '#8b94ad', ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 6, fontStyle: 'italic', textAlign: 'center' },
  membership: { paddingHorizontal: 16, gap: 14 }, membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }, section: { color: '#fff', ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 1, textTransform: 'uppercase' }, toggle: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)' }, toggleBtn: { minHeight: 34, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toggleOn: { backgroundColor: 'rgba(255,255,255,0.08)' }, toggleText: { color: '#8b94ad', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
 cardLabel: { color: '#8b94ad', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' }, price: { color: '#fff', ...fontSize.n1, lineHeight: fontSize.n1.fontSize + 1 }, perk: { color: '#d4d8e8', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  tabs: {
    // backgroundColor: 'white',
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }, tab: { minWidth: 74, alignItems: 'center', paddingBottom: 14, marginRight: 14 }, tabText: { marginTop: 4, color: '#69738d', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' }, tabOn: { color: PRIMARY_COLOR },
  body: {
    // paddingHorizontal: 16,
    paddingTop: 10,
    gap: 18,
    // backgroundColor: 'green',
    // marginBottom: mediumScreen ? 120: 170,
    minHeight: mediumScreen ? SCREEN_HEIGHT * 0.87: SCREEN_HEIGHT * 0.63,
    // marginBottom: 450
  },
  videoGridWrap: { marginHorizontal: -16 },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  videoGridCard: { overflow: 'hidden', borderRadius: 0, position: 'relative' },
  videoGridImage: { width: '100%', height: '100%' },
  videoGridOverlay: { ...StyleSheet.absoluteFillObject },
  videoGridMeta: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 2 },
  videoGridMetaText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  sub: { marginTop: 0, color: '#9ca3af', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  stack: { gap: 16 }, banner: { height: 230, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, bannerText: { color: '#fff', ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 2, textTransform: 'uppercase', width:'100%' },
  bannerBottom: { position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', justifyContent: 'space-between', height: 90,  }, eventCard: { height: 240, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, chip: { position: 'absolute', top: 18, left: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: primaryColorAlpha(0.14) }, chipText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  sound: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)' },
  play: { width: 58, height: 58, borderRadius: 20, backgroundColor: primaryColorAlpha(0.2), alignItems: 'center', justifyContent: 'center' }, playOn: { backgroundColor: PRIMARY_COLOR }, soundTitle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, textTransform: 'uppercase' }, soundMeta: { marginTop: 4, color: '#8b94ad', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' }, soundUsage: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  subscriptionModal: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: SCREEN_HEIGHT * 0.92,
  },
  modalHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  subscriptionContent: {
    paddingBottom: 8,
    rowGap: 24,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
  },
  subscriptionIconWrap: {
    width: 78,
    height: 78,
    // borderRadius: 28,
    // backgroundColor: 'rgba(245,158,11,0.18)',
    // borderWidth: 1,
    // borderColor: 'rgba(245,158,11,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionHeaderText: { flex: 1 },
  subscriptionTitle: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
  },
  subscriptionMeta: {
    marginTop: 6,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subscriptionSection: { rowGap: 14 },
  subscriptionLabel: {
    marginLeft: 4,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  subscriptionPerkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  subscriptionPerkIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: primaryColorAlpha(0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionPerkText: {
    flex: 1,
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 2,
  },
  balanceCard: {
    marginTop: 4,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    backgroundColor: 'rgba(245,158,11,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    rowGap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  balanceLabel: {
    color: '#d97706',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceSubLabel: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.fontSize + 1,
  },
  balanceCost: {
    color: PRIMARY_COLOR,
    ...fontSize.n5,
    lineHeight: fontSize.n5.fontSize + 1,
  },
  subscriptionPrimary: {
    minHeight: 55,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  subscriptionPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  subscriptionPrimaryText: {
    color: '#fff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  successWrap: {
    paddingVertical: 28,
    rowGap: 28,
    alignItems: 'center',
  },
  successBadge: {
    width: 112,
    height: 112,
    borderRadius: 38,
    backgroundColor: primaryColorAlpha(0.18),
    borderWidth: 2,
    borderColor: primaryColorAlpha(0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    textAlign: 'center',
    ...fontSize.n1,
    lineHeight: fontSize.n1.fontSize + 4,
    textTransform: 'uppercase',
  },
  switchBtn: {
    minWidth: 88,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // backgroundColor: '#ffffff14',
  },
  switchBtnOn: { backgroundColor: '#FFFFFF', borderWidth: 0, flexDirection: 'row' },
  switchText: { color: '#a9a9bd', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  switchTextOn: { color: PRIMARY_COLOR },
  cardPrice: {
    color: '#fff',
    ...fontSize.n1,
    lineHeight: fontSize.n1.fontSize + 6,
    // fontWeight: '900',
  },
  card: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    marginHorizontal: 15,
    marginVertical: 20,
  },
  cardTitle: {
    color: '#9ea0a5',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    // fontWeight: '800',
    letterSpacing: 1.5,
  },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end' },
  saveText: {
    color: '#22c55e',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchCreatorButton: {
    width: '70%',
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  switchCreatorGradient: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchCreatorText: {
    color: '#ffffff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  roleModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  roleModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  roleModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 48,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
  },
  roleModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  roleModalCopy: {
    alignItems: 'center',
    gap: 8,
  },
  roleModalTitle: {
    ...fontSize.b1,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: fontSize.b1.fontSize + 4,
  },
  roleModalBody: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.fontSize + 5,
    textAlign: 'center',
  },
  roleModalActions: {
    width: '100%',
    gap: 12,
    marginTop: 28,
  },
  roleModalPrimary: {
    width: '100%',
    minHeight: 64,
    borderRadius: 24,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  roleModalPrimaryText: {
    color: '#ffffff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleModalSecondary: {
    width: '100%',
    minHeight: 64,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleModalSecondaryText: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceSuffix: {
    color: '#818398',
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    marginBottom: 8,
    marginLeft: 4,
   },
   perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    justifyContent:"flex-start",
    // backgroundColor: '#ffffff12',
    // borderWidth: 1,
    // borderColor: '#ffffff18',
    borderRadius: 12,
    // paddingHorizontal: 10,
    // paddingVertical: 9,
  },
   stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: '#0d1220',
    // borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 15
  },
  statsTablet: { paddingHorizontal: 24, marginTop: 10 },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', ...fontSize.n3, lineHeight: fontSize.n3.fontSize + 2 },
  statLabel: {
    color: '#9ea0b6',
    ...fontSize.b4,
    lineHeight: fontSize.b5.fontSize + 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  accent: { color: PRIMARY_COLOR },
  sep: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: '#ffffff2d' },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketIconWrap: {
    width: 56,
    height: 56,
    // borderRadius: 18,
    // backgroundColor: primaryColorAlpha(0.1),
    // borderWidth: 1,
    // borderColor: primaryColorAlpha(0.24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
  },
  ticketMeta: {
    marginTop: 2,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  librarySection: {
    gap: 12,
  },
  librarySubTabs: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  librarySubTab: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  librarySubTabText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 1,
    // paddingHorizontal: 3,
    overflow: 'visible',
  },
  libraryCard: {
    width: '49.9%',
    height: 300,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    // marginTop: 4,
  },
  libraryImage: {
    width: '100%',
    height: '100%',
  },
  libraryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 8,
  },
  libraryBadgeText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  libraryDuration: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.76)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    zIndex: 7,
  },
  libraryDurationText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  libraryPlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  libraryLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 12,
  },
  libraryLockIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(204,165,20,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryLockText: {
    color: '#cca514',
    textAlign: 'center',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  libraryCardText: {
    position: 'absolute',
    left: 10,
    right: 48,
    bottom: 10,
    gap: 3,
    zIndex: 7,
  },
  libraryTitle: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 2,
    textTransform: 'uppercase',
  },
  libraryMeta: {
    color: '#fb7185',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  libraryLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  libraryLikes: {
    color: 'rgba(255,255,255,0.72)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  libraryMenuWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 30,
    alignItems: 'flex-end',
  },
  libraryMenuTrigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryMenu: {
    width: 176,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 12,
  },
  libraryMenuItem: {
    minHeight: 38,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  libraryMenuText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  libraryMenuDivider: {
    height: 1,
    marginVertical: 4,
  },
  libraryEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  libraryEditCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  libraryEditTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.fontSize + 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  libraryEditInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 4,
  },
  libraryEditActions: {
    flexDirection: 'row',
    gap: 10,
  },
  libraryEditButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryEditPrimary: {
    backgroundColor: PRIMARY_COLOR,
  },
  libraryEditButtonText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabIndicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: -1,
    height: 2,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
});

const styles = StyleSheet.create({
  container: {
    // paddingHorizontal: 4,
    gap: 12,
  },
   section: {
    gap: 12,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    // fontSize: 16,
    // fontWeight: '700',
    color: '#0f172a',
  },

  scrollContent: {
    gap: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },

  card: {
    width: 260,
    position: 'relative',
  },

  thumbnailContainer: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  playlistOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  lockOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  info: {
    marginTop: 8,
  },

  playlistTitle: {
    // fontSize: 13,
    // fontWeight: '700',
    color: '#18181b',
  },

  meta: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 4,
  },

  unlockedBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    marginRight: 4,
  },

  unlockedText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },

  vaultBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(204,165,20,0.1)',
  },

  vaultText: {
    color: PRIMARY_COLOR,
    fontSize: 9,
    fontWeight: '800',
  },

  shareButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
   sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },

  releaseList: {
    gap: 6,
  },

  releaseCard: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    position: 'relative',
  },

  thumbContainer: {
    width: 150,
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },

  playListthumbnail: {
    width: '100%',
    height: '100%',
  },

  playListlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  durationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  durationText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    fontWeight: '700',
  },

  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  videoTitle: {
    // fontSize: 13,
    // fontWeight: '600',
    color: '#18181b',
    // lineHeight: 18,
  },

  metaText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 4,
  },

  premiumBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204,165,20,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(204,165,20,0.20)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  premiumText: {
    color: PRIMARY_COLOR,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },

  unlockedPlayListBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    marginRight: 4,
  },

  unlockedPlyaListText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },

  moreButton: {
    position: 'absolute',
    right: 4,
    top: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ArtistProfile;
