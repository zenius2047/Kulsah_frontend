import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import { ActivityIndicator, Image, ImageBackground, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PlayIcon from '../assets/icons/play-circle-svg.svg';
import StarsIcon from '../assets/icons/premium-svg.svg';
import CalenderIcon from '../assets/icons/calendar-svg.svg';
import TrophyIcon from '../assets/icons/trophy-svg.svg';
import BookmarkIcon from '../assets/icons/bookmark-svg.svg';
import EditIcon from '../assets/icons/edit-svg.svg';
import { mediumScreen, user } from '../types';
import { fontScale } from '../fonts';
import { BlurView } from 'expo-blur';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import FireIcon from '../assets/icons/fireIcon-svg.svg';


type Tab = 'Videos' | 'Premium' | 'Events' | 'Challenges' | 'Favorites' | 'Saved';
type Billing = 'monthly' | 'annually';
type Step = 'details' | 'payment';

interface SubscriptionTier {
  name: string;
  price: string;
  perks: string[];
}

const INITIAL_SUBSCRIPTION: SubscriptionTier = {
  name: 'Pulsar Access',
  price: '9.99',
  perks: [
    'Exclusive Feed Access',
    'Direct Messaging',
    'Badge of Honor',
  ],
};



const SUB = { name: 'Pulsar Access', price: '9.99', perks: ['Exclusive Feed Access', 'Direct Messaging', 'Badge of Honor'] };
const videos = [
  { id: 'v1', title: 'Moonlight Symphony', views: '1.2M', duration: '4:20', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600' },
  { id: 'v2', title: 'Summer Tour Highlights', views: '450K', duration: '12:15', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600' },
];
const events = [
  { id: 'e1', title: 'Neon Nights: Live Concert', meta: 'Sept 15, 2024', price: 'Free', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600', location: 'Virtual Arena' },
  { id: 'e2', title: 'Synthwave Workshop', meta: 'Sept 20, 2024', price: '$25.00', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600', location: 'Creator Studio' },
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
  const isTablet = width >= 768;
  const route = useRoute<any>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(84200);
  const isOwner = route.params?.isOwner;
  const name = route.params?.id || 'Kulsah';
  // const isOwner = !route.params?.id || route.params?.id === 'Me';
  const tabs = useMemo(() => (isOwner ? ['Videos', 'Premium', 'Events', 'Challenges', 'Favorites', 'Saved'] : ['Videos', 'Premium', 'Events', 'Challenges', 'Favorites']) as Tab[], [isOwner]);
  const [activeTab, setActiveTab] = useState<Tab>('Videos');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [selectedSub, setSelectedSub] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank' | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState('');
  const [following, setFollowing] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<Billing>('monthly');
  const price = billing === 'monthly' ? Number(SUB.price).toFixed(2) : (Number(SUB.price) * 12 * 0.85).toFixed(2);
  const ping = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const share = async () => { try { await Share.share({ title: `${name} on Kulsah`, message: `Check out ${name}'s creative universe on Kulsah!` }); } catch { ping('Share failed'); } };
  const buy = () => {
    if (step === 'details') return setStep('payment');
    if (!paymentMethod) return ping('Please select a payment method');
    if (paymentMethod === 'momo' && !phone.trim()) return ping('Please complete MoMo details');
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(() => { setSelectedSub(false); setSuccess(false); ping(`Welcome to ${SUB.name}!`); }, 1600); }, 1200);
  };

  const renderGrid = (items: Array<{ id: string; title: string; views?: string; img?: string }>) => (
    <View style={s.grid}>{items.map((item) => <Pressable key={item.id} onPress={() => {
      if(user!.role === 'creator'){
        navigation.navigate('Video')
      }
    }} style={s.gridItem}>
      <View style={s.thumb}>
        {item.img ? <Image source={{ uri: item.img }}
          style={s.image} /> : null}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFillObject} />
            <View style={s.meta}>
              <Text style={s.title} numberOfLines={2}>
                {item.title}</Text>
                  {item.views ? <Text style={s.sub}>
                      {item.views} VIEWS</Text> : null}
                      </View>
                    </View>
                  </Pressable>)}
              </View>
  );

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    if (billingCycle === 'monthly') return price.toFixed(2);
    return (price * 12 * 0.85).toFixed(2);
  };

  const openSubscription = () => {
    // setSelectedSub(INITIAL_SUBSCRIPTION);
    // setModalStep('details');
    // setPaymentMethod(null);
    // setMomoProvider(null);
    // setPhoneNumber('');
    // setShowSuccess(false);
  };

  function replaceNewlineAfterComma(text:String, replacement = " ") {
  return text.replace(/,\n/g, "," + replacement);
}
 
  return (
    <View style={[s.screen, { backgroundColor: theme.screen }]}>
      {toast ? <Text style={s.toast}>{toast}</Text> : null}
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)', borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
        <Pressable onPress={() => navigation.goBack()} style={[s.icon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}>
          <MaterialIcons name="chevron-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: theme.text }]}>{isOwner ? 'Your Galaxy' : name}</Text>
        <Pressable onPress={isOwner ? () => navigation.navigate('Settings') : share} style={[s.icon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}>
          <MaterialIcons name={isOwner ? 'settings' : 'share'} size={20} color={theme.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800' }} style={s.cover}><LinearGradient colors={isDark ? ['rgba(0,0,0,0.1)', '#060913'] : ['rgba(255,255,255,0.06)', '#f8fafc']} style={StyleSheet.absoluteFillObject} /></ImageBackground>
        <View style={s.hero}>
          <View style={[s.avatarWrap, { borderColor: theme.screen }]}>
            <Image source={{ uri: 'https://picsum.photos/seed/elena/300' }} 
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
            <VerifiedIcon height={24} width={24} fill='#cd2bee'/>
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
          <View style={s.actions}>{isOwner ? <>
          <Pressable onPress={() => navigation.navigate('Settings')} style={[s.primary, {width:20}]}>
            <EditIcon height={24} width={24} fill='white'/>
            <Text style={s.btnText}>{" "}Edit</Text>
            </Pressable>
            <Pressable onPress={share} 
            style={[s.secondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface, flexDirection: 'row' , alignItems: 'center', justifyContent: 'center'}]}>
            <MaterialIcons name='share' size={18}/>
            <Text style={[s.btnText, { color: theme.text }]}>{" "}Share</Text></Pressable></> : <><Pressable onPress={() => navigation.navigate('Chat')} style={[s.iconAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}><MaterialIcons name="mail" size={20} color={theme.text} /></Pressable><Pressable onPress={() => { setFollowing((v) => !v); ping(following ? 'Unfollowed' : 'Following'); }} style={[s.secondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}><Text style={[s.btnText, { color: theme.text }]}>{following ? 'Following' : 'Follow'}</Text></Pressable><Pressable onPress={() => { setSelectedSub(true); setStep('details'); }} style={s.primary}><Text style={s.btnText}>Subscribe</Text></Pressable></>}</View>
        </View>

        <Text style={[s.bio, { color: theme.textSecondary }]}>"Exploring the nexus of synthwave rhythms and cinematic soul. Join the journey through the star systems of sound."</Text>

        {/* <View style={s.membership}><View style={s.membershipHeader}><Text style={s.section}>Membership</Text><View style={s.toggle}><Pressable onPress={() => setBilling('monthly')} style={[s.toggleBtn, billing === 'monthly' && s.toggleOn]}><Text style={s.toggleText}>Monthly</Text></Pressable><Pressable onPress={() => setBilling('annually')} style={[s.toggleBtn, billing === 'annually' && s.toggleOn]}><Text style={s.toggleText}>Yearly</Text></Pressable></View></View><Pressable onPress={() => { setSelectedSub(true); setStep('details'); }} style={s.card}><Text style={s.cardLabel}>{SUB.name}</Text><Text style={s.price}>${price} / {billing === 'monthly' ? 'mo' : 'yr'}</Text>{SUB.perks.map((perk) => <Text key={perk} style={s.perk}>- {perk}</Text>)}</Pressable></View> */}
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
                        fontSize: fontScale(8),
                        fontFamily: 'PlusJakartaSansExtraBold',
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
                <MaterialIcons name="check-circle-outline" size={18} color="#cd2bee" />
                <Text style={[s.perk, { color: theme.text }]}>{perk}</Text>
              </View>
            ))}
            <Pressable>
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
                  fontFamily: 'PlusJakartaSansBold',
                  fontSize: mediumScreen? fontScale(14):fontScale(10),
                }}>
                  {billingCycle === 'monthly' ? 'SUBSCRIBE MONTHLY': 'SUBSCRIBE ANUALLY'}
                </Text>
              </View>
            </Pressable>
          </Pressable>


        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{tabs.map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tab}>
          {
            tab === 'Videos' ? <PlayIcon height={22} width={22} fill={activeTab === tab ? '#cd2bee' : '#69738d'}/>:
            tab === 'Premium'? <StarsIcon height={22} width={22} fill={activeTab === tab ? '#cd2bee' : '#69738d'}/>:
            tab === 'Events'? <CalenderIcon height={22} width={22} fill={activeTab === tab ? '#cd2bee' : '#69738d'}/>:
            tab === 'Challenges'?<TrophyIcon height={22} width={22} fill={activeTab === tab ? '#cd2bee' : '#69738d'}/>:
            tab === 'Favorites'? <MaterialIcons name="favorite-border" size={22} color={activeTab === tab ? '#cd2bee' : '#69738d'}/>: <BookmarkIcon height={22} width={22} fill={activeTab === tab ? '#cd2bee' : '#69738d'}/>
          }
          {/* <MaterialIcons name={{ Videos: 'play-circle', Premium: 'stars', Events: 'calendar-month', Challenges: 'emoji-events', Favorites: 'favorite', Saved: 'bookmark' }[tab]}
          size={22} color={activeTab === tab ? '#cd2bee' : '#69738d'} /> */}
          <Text style={[s.tabText, { color: activeTab === tab ? '#cd2bee' : theme.textSecondary }, activeTab === tab && s.tabOn]}>{tab}</Text>
          </Pressable>)}</ScrollView>

        <View style={s.body}>
          {activeTab === 'Videos' ? renderGrid(videos) : null}
          {activeTab === 'Premium' ? <View style={s.stack}>{[1, 2, 3].map((i) => <Pressable key={i} onPress={() => isOwner ? navigation.navigate('CreatorLibrary') : setSelectedSub(true)} style={[s.banner, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}><Image source={{ uri: `https://picsum.photos/seed/prem${i}/800/450` }} style={s.image} /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} /><Text style={s.bannerText}>Project Node #{i + 102}</Text></Pressable>)}</View> : null}
          {activeTab === 'Events' ? <View style={s.stack}>{events.map((item) =>
            <Pressable key={item.id} onPress={() => navigation.navigate('EventDetail')} style={[s.banner, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}>
              <Image source={{ uri: item.img }} style={s.image} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
                  <View style={s.bannerBottom}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'red',
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
                        overflow: 'hidden'
                      }}>
                         <BlurView
                            intensity={50} // controls blur strength
                            tint="light"
                            style={{
                              // position: 'absolute',
                              // bottom: 0,
                              width: '100%',
                              height: '100%',
                              justifyContent: 'center',
                              alignItems: 'center',
                              // padding: 20,
                            }}
                          >
                            <Text style={{
                          color: '#cd2bee',
                          fontFamily: 'PlusJakartaSansBold',
                          fontSize: fontScale(12),
                          lineHeight: 15,
                        }}>
                          {item.price}
                        </Text>
                          </BlurView>
                        
                      </View>
                    </View>
                      <View style={{
                        flexDirection: 'row',
                      }}>
                        <Text style={[s.sub, { color: '#dbe4f0', width: '20%' }]}>{item.meta}</Text>
                      </View>
                  </View>
                  </Pressable>)}
                  </View> : null}
          {activeTab === 'Challenges' ? <View style={s.stack}>{challenges.map((item) => <Pressable key={item.id} onPress={() => navigation.navigate('Challenges')} style={[s.banner, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}><Image source={{ uri: item.img }} style={s.image} /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} /><View style={s.bannerBottom}><Text style={s.bannerText}>{item.title}</Text><Text style={[s.sub, { color: '#dbe4f0' }]}>{item.meta}</Text></View></Pressable>)}</View> : null}
          {activeTab === 'Favorites' ? renderGrid(favorites) : null}
          {activeTab === 'Saved' ? 
          <View style={s.stack}>{sounds.map((sound) => 
            <Pressable key={sound.id} onPress={() => navigation.navigate('UploadContent')}
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
      </ScrollView>

      <Modal visible={selectedSub} transparent animationType="slide" onRequestClose={() => !loading && setSelectedSub(false)}>
        <View style={s.overlay}><Pressable style={StyleSheet.absoluteFillObject} onPress={() => !loading && setSelectedSub(false)} /><View style={[s.modal, { backgroundColor: isDark ? '#0f172a' : theme.card, borderWidth: isDark ? 0 : 1, borderColor: theme.border }]}>{success ? <View style={s.stack}><MaterialIcons name="verified" size={56} color="#cd2bee" /><Text style={[s.modalTitle, { color: theme.text }]}>Identity Verified</Text><Pressable onPress={() => setSelectedSub(false)} style={s.primary}><Text style={s.btnText}>Start Watching</Text></Pressable></View> : <><Text style={[s.modalTitle, { color: theme.text }]}>{SUB.name} Access</Text>{step === 'details' ? <View style={s.stack}>{SUB.perks.map((perk) => <Text key={perk} style={[s.perk, { color: theme.text }]}>- {perk}</Text>)}</View> : <View style={s.stack}><View style={s.payRow}><Pressable onPress={() => setPaymentMethod('momo')} style={[s.payBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderWidth: isDark ? 0 : 1, borderColor: theme.border }, paymentMethod === 'momo' && s.toggleOn]}><Text style={[s.toggleText, { color: paymentMethod === 'momo' ? '#cd2bee' : theme.textSecondary }]}>Mobile Money</Text></Pressable><Pressable onPress={() => setPaymentMethod('bank')} style={[s.payBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderWidth: isDark ? 0 : 1, borderColor: theme.border }, paymentMethod === 'bank' && s.toggleOn]}><Text style={[s.toggleText, { color: paymentMethod === 'bank' ? '#cd2bee' : theme.textSecondary }]}>Bank Transfer</Text></Pressable></View>{paymentMethod === 'momo' ? <TextInput value={phone} onChangeText={setPhone} placeholder="+233 Mobile Number" placeholderTextColor={theme.textMuted} style={[s.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, color: theme.text, borderWidth: isDark ? 0 : 1, borderColor: theme.border }]} /> : null}{paymentMethod === 'bank' ? <Text style={[s.sub, { color: theme.textSecondary }]}>EcoBank Ghana - 1441000234567 - KULSAH CREATOR HUB</Text> : null}</View>}<Pressable onPress={buy} disabled={loading} style={s.primary}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{step === 'details' ? 'Continue to Payment' : `Pay $${price} Now`}</Text>}</Pressable></>}</View></View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913' },
  toast: { position: 'absolute', top: 56, alignSelf: 'center', zIndex: 40, backgroundColor: '#cd2bee', color: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, header: { paddingTop: 46, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15,23,42,0.72)' }, headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: 10, color: '#fff', fontSize: mediumScreen? fontScale(16):fontScale(12), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  content: { paddingBottom: 120 }, cover: { height: 280 }, hero: { marginTop: -88, paddingHorizontal: 20, alignItems: 'center' }, avatarWrap: { width: 148, height: 148, borderRadius: 44, borderWidth: 8, borderColor: '#060913', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, fire: { position: 'absolute', right: 12, bottom: 8, width: 40, height: 40, borderRadius: 12, backgroundColor: '#f97316', borderWidth: 4, borderColor: '#060913', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, fireText: { color: '#fff', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold' },
  name: {color: '#fff', fontSize: fontScale(16), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, role: { marginTop: 4, color: '#cd2bee', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 2 }, stat: { flex: 1, textAlign: 'center', color: '#fff', fontSize: fontScale(18), fontFamily: 'PlusJakartaSansExtraBold' }, muted: { color: '#7d859e', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold' }, purple: { color: '#cd2bee', fontFamily: 'PlusJakartaSansBold', fontSize: mediumScreen ? fontScale(12): fontScale(10) }, 
  actions: { marginTop: 22, width: '80%', flexDirection: 'row', gap: 10, alignItems: 'center' },
  action: { height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, 
  primary: { flex: 1, backgroundColor: '#cd2bee', minHeight: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', }, 
  secondary: { flex: 1, height: 36, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, iconAction: { width: 56, height: 36, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, btnText: { color: '#fff', fontSize: mediumScreen ? 15:11, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', lineHeight: 15}, follow: { flex: 1, height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }, followOn: { backgroundColor: 'rgba(205,43,238,0.12)' }, followText: { color: '#fff', fontSize: fontScale(11), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, followTextOn: { color: '#cd2bee' },
  bio: { paddingHorizontal: 34, marginTop: 18, marginBottom: 18, color: '#8b94ad', fontSize: mediumScreen? fontScale(16):fontScale(12), lineHeight: 20, fontStyle: 'italic', textAlign: 'center', fontFamily: 'PlusJakartaSansMedium' },
  membership: { paddingHorizontal: 16, gap: 14 }, membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }, section: { color: '#fff', fontSize: mediumScreen? 18: 14, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, toggle: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)' }, toggleBtn: { minHeight: 34, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toggleOn: { backgroundColor: 'rgba(255,255,255,0.08)' }, toggleText: { color: '#8b94ad', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
 cardLabel: { color: '#8b94ad', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, price: { color: '#fff', fontSize: fontScale(28), fontFamily: 'PlusJakartaSansExtraBold' }, perk: { color: '#d4d8e8', fontSize: fontScale(12), fontFamily: 'PlusJakartaSansMedium' },
  tabs: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }, tab: { minWidth: 74, alignItems: 'center', paddingBottom: 14, marginRight: 14 }, tabText: { marginTop: 4, color: '#69738d', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, tabOn: { color: '#cd2bee' }, body: { paddingHorizontal: 16, paddingTop: 18, gap: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 }, gridItem: { width: '47.5%' }, thumb: { aspectRatio: 4 / 5, borderRadius: 34, overflow: 'hidden', backgroundColor: '#0f172a' }, meta: { position: 'absolute', left: 12, right: 12, bottom: 12 }, title: { color: '#fff', fontSize: mediumScreen ? fontScale(14):fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' }, sub: { marginTop: 0, color: '#9ca3af', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  stack: { gap: 16 }, banner: { height: 230, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, bannerText: { color: '#fff', fontSize: fontScale(14), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', width:'50%' }, 
  bannerBottom: { position: 'absolute', left: 18, right: 18, bottom: 18 }, eventCard: { height: 240, borderRadius: 40, overflow: 'hidden', backgroundColor: '#0f172a' }, chip: { position: 'absolute', top: 18, left: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(205,43,238,0.14)' }, chipText: { color: '#cd2bee', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  sound: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)' }, 
  play: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(205,43,238,0.2)', alignItems: 'center', justifyContent: 'center' }, playOn: { backgroundColor: '#cd2bee' }, soundTitle: { color: '#fff', fontSize: mediumScreen ? fontScale(14): fontScale(10), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, soundMeta: { marginTop: 4, color: '#8b94ad', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase' }, soundUsage: { color: '#cd2bee', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }, modal: { backgroundColor: '#0f172a', borderTopLeftRadius: 34, borderTopRightRadius: 34, padding: 18, gap: 16 }, modalTitle: { color: '#fff', fontSize: fontScale(24), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' }, modalPerk: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)' }, payRow: { flexDirection: 'row', gap: 8 }, payBtn: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }, input: { height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 12, fontFamily: 'PlusJakartaSansBold' }, bank: { color: '#8b94ad', fontSize: fontScale(11), fontFamily: 'PlusJakartaSansBold' }, success: { gap: 18, alignItems: 'center', paddingVertical: 10 },
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
  switchText: { color: '#a9a9bd', fontSize: mediumScreen? fontScale(12):fontScale(8), fontWeight: '900', textTransform: 'uppercase' },
  switchTextOn: { color: '#cd2bee' },
  cardPrice: { 
    color: '#fff',
    fontSize: fontScale(30),
    lineHeight: 42,
    // fontWeight: '900', 
    fontFamily: 'PlusJakartaSansBold' },
  card: { 
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 42,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    marginHorizontal: 15,
    marginTop: 10,
  },
  cardTitle: {
    color: '#9ea0a5',
    fontSize: fontScale(9),
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end' },
  saveText: {
    color: '#22c55e',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  priceSuffix: { 
    color: '#818398',
    fontSize: fontScale(12),
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'PlusJakartaSansBold'
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
  statValue: { color: '#fff', fontSize: mediumScreen? fontScale(16):fontScale(12), fontWeight: '900' },
  statLabel: {
    color: '#9ea0b6',
    fontSize: mediumScreen? fontScale(12):fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
    fontWeight: '700',
  },
  accent: { color: '#cd2bee' },
  sep: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: '#ffffff2d' },
});

export default ArtistProfile;

