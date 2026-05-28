import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { ActivityIndicator, Dimensions, Image, ImageBackground, Modal, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PlayIcon from '../assets/icons/play-circle-svg.svg';
import StarsIcon from '../assets/icons/premium-svg.svg';
import CalenderIcon from '../assets/icons/calendar-svg.svg';
import TrophyIcon from '../assets/icons/trophy-svg.svg';
import BookmarkIcon from '../assets/icons/bookmark-svg.svg';
import EditIcon from '../assets/icons/edit-svg.svg';
import { mediumScreen, subscribeUser, user, User } from '../types';
import { FontFamily, FontSize } from '../fonts';
import { BlurView } from 'expo-blur';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import FireIcon from '../assets/icons/fireIcon-svg.svg';
import PublicIcon from '../assets/icons/public-svg.svg';
import KulCoinPrompt from '../components/KulCoinPrompt';


type Tab = 'Videos' | 'Public' | 'Premium'  | 'Tickets' | 'Events' | 'Challenges' | 'Favorites' | 'Saved';
type Billing = 'monthly' | 'annually';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');

interface SubscriptionTier {
  name: string;
  price: string;
  perks: string[];
}

const INITIAL_SUBSCRIPTION: SubscriptionTier = {
  name: 'Kulsah Access',
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

const  ArtistProfile: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
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
      return ['Videos', 'Public', 'Premium',  'Tickets', 'Events', 'Challenges', 'Favorites', 'Saved'] as Tab[];
    }
    return ['Videos', 'Public', 'Premium',  'Events', 'Challenges'] as Tab[];
  }, [isOwner]);
  const [activeTab, setActiveTab] = useState<Tab>('Videos');
  const [selectedSub, setSelectedSub] = useState<SubscriptionTier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [coinBalance, setCoinBalance] = useState(1250);
  const [showKulCoinPrompt, setShowKulCoinPrompt] = useState(false);
  const [toast, setToast] = useState('');
  const [following, setFollowing] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<Billing>('monthly');
  const ping = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const share = async () => { try { await Share.share({ title: `${name} on Kulsah`, message: `Check out ${name}'s creative universe on Kulsah!` }); } catch { ping('Share failed'); } };

  useEffect(() => subscribeUser(setCurrentUser), []);
  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('Videos');
    }
  }, [activeTab, tabs]);

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
              aspectRatio: 9 / 16,
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
      <View style={[s.header, { backgroundColor: isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)', borderBottomColor: isDark ? '#27272a' : '#e2e8f0' }]}>
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
            <Text style={[s.btnText, { color: theme.text }]}>{" "}Share</Text></Pressable></> :
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
                        fontSize: FontSize.eight,
                        fontFamily: FontFamily.extraBold,
                        textTransform: 'uppercase'
                      }}>-15%</Text>
                </View>
              </Pressable>
            </View>
          </View>


          <Pressable style={[s.card, { backgroundColor: isDark ? '#ffffff0d' : theme.card, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: isDark ? 0 : 0.08, shadowRadius: 16, elevation: isDark ? 0 : 2 }]} onPress={openSubscription}>
            <Text style={[s.cardTitle, { color: theme.textSecondary, fontFamily: FontFamily.medium }]}>{INITIAL_SUBSCRIPTION.name}</Text>
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
                  fontFamily: FontFamily.bold,
                  fontSize: mediumScreen? FontSize.twelve:FontSize.eight,
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
            tab === 'Public' ? <PublicIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Tickets'? <MaterialIcons name="local-activity" size={22} color={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Events'? <CalenderIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Challenges'?<TrophyIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>:
            tab === 'Favorites'? <MaterialIcons name="favorite-border" size={22} color={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>: <BookmarkIcon height={22} width={22} fill={activeTab === tab ? PRIMARY_COLOR : '#69738d'}/>
          }
          {/* <MaterialIcons name={{ Videos: 'play-circle', Premium: 'stars', Events: 'calendar-month', Challenges: 'emoji-events', Favorites: 'favorite', Saved: 'bookmark' }[tab]}
          size={22} color={activeTab === tab ? PRIMARY_COLOR : '#69738d'} /> */}
          <Text style={[s.tabText, { color: activeTab === tab ? PRIMARY_COLOR : theme.textSecondary }, activeTab === tab && s.tabOn]}>{tab}</Text>
          {activeTab === tab ? <View style={s.tabIndicator} /> : null}
          </Pressable>)}</ScrollView>

        <View style={s.body}>
          {activeTab === 'Videos' ? renderGrid(videos) : null}
          {activeTab === 'Premium' || activeTab === 'Public'
            ? renderGrid(premiumVideos, () => {
                if (isOwner) {
                  navigation.navigate('CreatorLibrary');
                } else {
                  openSubscription();
                }
              })
            : null}
          {activeTab === 'Tickets' ? (
            <View style={s.stack}>
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
                      <MaterialIcons name="local-activity" size={24} color={PRIMARY_COLOR} />
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
          {activeTab === 'Events' ? <View style={s.stack}>{events.map((item) =>
            <Pressable key={item.id} onPress={() => navigation.navigate('EventDetail')} style={[s.banner, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}>
              <Image source={{ uri: item.img }} style={[s.image, {borderRadius: 0}]} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
                  <View style={s.bannerBottom}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      // backgroundColor: 'red',
                    }}>
                      <Text style={s.bannerText}>{item.title}</Text>
                      <View style={{
                        borderWidth: 2,
                        borderColor: '#ffffff1a',
                        borderRadius: 16,
                        height: 40,
                        width: 80,
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
                              width: 80,
                              height: 40,
                              justifyContent: 'center',
                              alignItems: 'center',
                              // padding: 20,
                            }}
                          >
                            <Text style={{
                          color: PRIMARY_COLOR,
                          fontFamily: FontFamily.bold,
                          fontSize: FontSize.twelve,
                          lineHeight: 15,
                        }}>
                          {item.price}
                        </Text>
                          </BlurView>

                      </View>
                    </View>
                      <View style={{
                        flexDirection: 'row',
                        marginTop: 5,
                        gap: 10
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
                            <Text style={[{ color: '#ffffff66', width: '100%', fontSize: mediumScreen ? FontSize.twelve: FontSize.eight, fontFamily: FontFamily.extraBold}]}>Date</Text>
                          <Text style={[s.sub, { color: '#dbe4f0', width: '70%', fontSize: mediumScreen ? FontSize.ten: FontSize.six }]}>{item.meta}</Text>
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
                            <Text style={[{ color: '#ffffff66', width: '100%', fontSize: mediumScreen ? FontSize.twelve: FontSize.eight, fontFamily: FontFamily.extraBold}]}>Location</Text>
                          <Text style={[s.sub, { color: '#dbe4f0', width: '60%', fontSize: mediumScreen ? FontSize.ten: FontSize.six }]}>{item.location}</Text>
                          </View>
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
                          width: '30%',
                          height: 40,
                        }}>
                          <Text style={{
                            fontFamily: FontFamily.bold,
                            textAlign: 'center',
                            fontSize: mediumScreen ? FontSize.twelve: FontSize.eight,
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
          <View style={s.stack}>{sounds.map((sound) =>
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
                      <MaterialIcons name="monetization-on" size={34} color="#f59e0b" />
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
  toast: { position: 'absolute', top: 56, alignSelf: 'center', zIndex: 40, backgroundColor: PRIMARY_COLOR, color: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, fontSize: FontSize.ten, fontFamily: FontFamily.extraBold },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  header: { paddingTop: 46, paddingBottom: 7, borderBottomWidth: 1 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
  headerRoundBtn: { height: 40, width: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { textAlign: 'center', color: '#fff', fontSize: FontSize.body, fontFamily: FontFamily.displayExtraBold, letterSpacing: 2.2, textTransform: 'uppercase' },
  headerSubtitle: { color: PRIMARY_COLOR, marginTop: 4, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, letterSpacing: 1.5, textTransform: 'uppercase' },
  content: { paddingBottom: 120, }, cover: { height: 180, }, hero: { marginTop: -88, paddingHorizontal: 20, alignItems: 'center' }, avatarWrap: { width: 148, height: 148, borderRadius: 999, borderWidth: 1, borderColor: '#060913', padding: 7}, image: { width: '100%', height: '100%', borderRadius: 999 }, fire: { position: 'absolute', right: 12, bottom: -2, width: 40, height: 40, borderRadius: 999, backgroundColor: '#f97316', borderWidth: 0, borderColor: '#060913', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, fireText: { color: '#fff', fontSize: FontSize.eight, fontFamily: FontFamily.extraBold },
  name: {color: '#fff', fontSize: FontSize.sixteen, fontFamily: FontFamily.bold, textTransform: 'uppercase' }, role: { marginTop: 4, color: PRIMARY_COLOR, fontSize: FontSize.nine, fontFamily: FontFamily.extraBold, textTransform: 'uppercase', letterSpacing: 2 }, stat: { flex: 1, textAlign: 'center', color: '#fff', fontSize: FontSize.eighteen, fontFamily: FontFamily.extraBold }, muted: { color: '#7d859e', fontSize: FontSize.eight, fontFamily: FontFamily.extraBold }, purple: { color: PRIMARY_COLOR, fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.twelve: FontSize.ten },
  actions: { marginTop: 22, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  action: { height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: PRIMARY_COLOR, minHeight: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', },
  secondary: { height: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, iconAction: { width: 56, height: 36, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, btnText: { color: '#fff', fontSize: mediumScreen ? FontSize.fifteen:FontSize.eleven, fontFamily: FontFamily.extraBold, textTransform: 'uppercase', lineHeight: 15}, follow: { flex: 1, height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, followOn: { backgroundColor: primaryColorAlpha(0.12) }, followText: { color: '#fff', fontSize: FontSize.eleven, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' }, followTextOn: { color: PRIMARY_COLOR },
  bio: { paddingHorizontal: 34, marginTop: 18, marginBottom: 18, color: '#8b94ad', fontSize: mediumScreen? FontSize.fourteen:FontSize.twelve, lineHeight: 20, fontStyle: 'italic', textAlign: 'center', fontFamily: FontFamily.medium },
  membership: { paddingHorizontal: 16, gap: 14 }, membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }, section: { color: '#fff', fontSize: mediumScreen? FontSize.eighteen: FontSize.fourteen, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' }, toggle: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)' }, toggleBtn: { minHeight: 34, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toggleOn: { backgroundColor: 'rgba(255,255,255,0.08)' }, toggleText: { color: '#8b94ad', fontSize: FontSize.ten, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' },
 cardLabel: { color: '#8b94ad', fontSize: FontSize.ten, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' }, price: { color: '#fff', fontSize: FontSize.twentyEight, fontFamily: FontFamily.extraBold }, perk: { color: '#d4d8e8', fontSize: FontSize.twelve, fontFamily: FontFamily.medium },
  tabs: {
    // backgroundColor: 'white',
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }, tab: { minWidth: 74, alignItems: 'center', paddingBottom: 14, marginRight: 14 }, tabText: { marginTop: 4, color: '#69738d', fontSize: FontSize.eight, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' }, tabOn: { color: PRIMARY_COLOR },
  body: {
    paddingHorizontal: 16,
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
  videoGridMetaText: { color: '#fff', fontFamily: FontFamily.bold, fontSize: FontSize.eleven },
  sub: { marginTop: 0, color: '#9ca3af', fontSize: FontSize.eight, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' },
  stack: { gap: 16 }, banner: { height: 230, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, bannerText: { color: '#fff', fontSize: mediumScreen ? FontSize.sixteen:FontSize.twelve, fontFamily: FontFamily.extraBold, textTransform: 'uppercase', width:'50%' },
  bannerBottom: { position: 'absolute', left: 18, right: 18, bottom: 18 }, eventCard: { height: 240, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, chip: { position: 'absolute', top: 18, left: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: primaryColorAlpha(0.14) }, chipText: { color: PRIMARY_COLOR, fontSize: FontSize.nine, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' },
  sound: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)' },
  play: { width: 58, height: 58, borderRadius: 20, backgroundColor: primaryColorAlpha(0.2), alignItems: 'center', justifyContent: 'center' }, playOn: { backgroundColor: PRIMARY_COLOR }, soundTitle: { color: '#fff', fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' }, soundMeta: { marginTop: 4, color: '#8b94ad', fontSize: FontSize.nine, fontFamily: FontFamily.bold, textTransform: 'uppercase' }, soundUsage: { color: PRIMARY_COLOR, fontSize: FontSize.eight, fontFamily: FontFamily.extraBold, textTransform: 'uppercase' },
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
    borderRadius: 28,
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionHeaderText: { flex: 1 },
  subscriptionTitle: {
    fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
  },
  subscriptionMeta: {
    marginTop: 6,
    fontSize: FontSize.nine,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subscriptionSection: { rowGap: 14 },
  subscriptionLabel: {
    marginLeft: 4,
    fontSize: FontSize.eight,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 3,
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
    fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven,
    fontFamily: FontFamily.bold,
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
    fontSize: FontSize.eight,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  balanceSubLabel: {
    fontSize: FontSize.eight,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  balanceValue: {
    fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
    fontFamily: FontFamily.extraBold,
  },
  balanceCost: {
    color: PRIMARY_COLOR,
    fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
    fontFamily: FontFamily.extraBold,
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
    fontSize: mediumScreen ? FontSize.fifteen : FontSize.eleven,
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
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
    fontSize: mediumScreen ? FontSize.thirty : FontSize.twentyFour,
    lineHeight: mediumScreen ? 40 : 30,
    fontFamily: FontFamily.extraBold,
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
  switchText: { color: '#a9a9bd', fontSize: mediumScreen? FontSize.twelve:FontSize.eight, fontWeight: '900', textTransform: 'uppercase' },
  switchTextOn: { color: PRIMARY_COLOR },
  cardPrice: {
    color: '#fff',
    fontSize: FontSize.thirty,
    lineHeight: 42,
    // fontWeight: '900',
    fontFamily: FontFamily.bold },
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
    fontSize: FontSize.nine,
    textTransform: 'uppercase',
    // fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: FontFamily.medium
  },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end' },
  saveText: {
    color: '#22c55e',
    fontSize: FontSize.ten,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  priceSuffix: {
    color: '#818398',
    fontSize: FontSize.twelve,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: FontFamily.bold
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
  },
  statsTablet: { paddingHorizontal: 24 },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: mediumScreen? FontSize.sixteen:FontSize.twelve, fontFamily: FontFamily.extraBold },
  statLabel: {
    color: '#9ea0b6',
    fontSize: mediumScreen? FontSize.twelve:FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
    fontFamily: FontFamily.bold
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
    borderRadius: 18,
    backgroundColor: primaryColorAlpha(0.1),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    fontSize: FontSize.thirteen,
    fontFamily: FontFamily.extraBold,
  },
  ticketMeta: {
    marginTop: 2,
    fontSize: FontSize.ten,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
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

export default ArtistProfile;
