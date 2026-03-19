import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VerifyIcon from '../assets/icons/verified-svg.svg';
import SettingsIcon from '../assets/icons/settings-svg.svg';


type Tab = 'Videos' | 'Premium' | 'Store' | 'Events';
type Billing = 'monthly' | 'annually';
type ModalStep = 'details' | 'payment';

interface SubscriptionTier {
  name: string;
  price: string;
  perks: string[];
}

interface ArtistProfileProps {
  onLogout?: () => void;
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

const videos = [
  {
    id: 'v1',
    title: 'Moonlight Symphony',
    views: '1.2M',
    duration: '4:20',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'v2',
    title: 'Summer Tour Highlights',
    views: '450K',
    duration: '12:15',
    img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'v3',
    title: 'Studio Session #4',
    views: '120K',
    duration: '45:00',
    img: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'v4',
    title: 'Late Night Production',
    views: '89K',
    duration: '3:45',
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
  },
];

const ArtistProfile: React.FC<ArtistProfileProps> = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();

  const id = (route.params as { id?: string } | undefined)?.id;
  const isOwner = id === 'Me';
  const name = id || 'Elena Rose';
  const isTablet = width >= 768;
  const contentWidth = Math.min(width - 24, 960);
  const columns = isTablet ? 3 : 2;
  const gap = 12;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);

  const [activeTab, setActiveTab] = useState<Tab>('Videos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(84200);
  const [showStore, setShowStore] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [billingCycle, setBillingCycle] = useState<Billing>('monthly');
  const [selectedSub, setSelectedSub] = useState<SubscriptionTier | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank' | null>(null);
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Vodafone' | 'AirtelTigo' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      const [storeFlag, eventsFlag] = await Promise.all([
        AsyncStorage.getItem('pulsar_show_store'),
        AsyncStorage.getItem('pulsar_show_events'),
      ]);
      setShowStore(storeFlag !== 'false');
      setShowEvents(eventsFlag !== 'false');
    };
    void load();
  }, []);

  const tabs = useMemo(() => {
    const list: Tab[] = ['Videos', 'Premium'];
    // if (showStore) list.push('Store');
    if (showEvents) list.push('Events');
    return list;
  }, [showEvents, showStore]);

  const toastNow = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    if (billingCycle === 'monthly') return price.toFixed(2);
    return (price * 12 * 0.85).toFixed(2);
  };

  const openSubscription = () => {
    setSelectedSub(INITIAL_SUBSCRIPTION);
    setModalStep('details');
    setPaymentMethod(null);
    setMomoProvider(null);
    setPhoneNumber('');
    setShowSuccess(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${name} on Kulsah`,
        message: `Check out ${name}'s creative universe on Kulsah!`,
      });
    } catch {
      toastNow('Share failed');
    }
  };

  const handlePurchase = () => {
    if (modalStep === 'details') {
      setModalStep('payment');
      return;
    }
    if (!paymentMethod) {
      toastNow('Please select a payment method');
      return;
    }
    if (paymentMethod === 'momo' && (!momoProvider || !phoneNumber.trim())) {
      toastNow('Please complete MoMo details');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedSub(null);
        setShowSuccess(false);
        toastNow(`Welcome to ${INITIAL_SUBSCRIPTION.name}!`);
      }, 2200);
    }, 1800);
  };

  

  return (
    <View style={s.screen}>
      {!!toast && <Text style={s.toast}>{toast}</Text>}

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={[s.iconBtn, {backgroundColor: '#1f1022bf', borderColor: '#FFFFFF0D', borderWidth: 1}, ]}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <Text style={s.headerTitle} numberOfLines={1}>
          Your Galaxy 
        </Text>

        {/* {isOwner ? (
          <Pressable onPress={() => navigation.navigate('/creator/settings')} style={s.iconBtn}>
            <MaterialIcons name="settings" size={20} color="#fff" />
          </Pressable>
        ) : (
          <Pressable onPress={handleShare} style={s.iconBtn}>
            <MaterialIcons name="share" size={20} color="#fff" />
          </Pressable>
        )} */}
      <Pressable onPress={() => navigation.navigate('Settings')} style={[s.iconBtn, {backgroundColor: '#1f1022bf', borderColor: '#FFFFFF0D', borderWidth: 1}]}>
            <SettingsIcon fill='white' height={20} width={20}/>
          </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.container, { width: contentWidth }]}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200' }}
            style={[s.banner, { height: isTablet ? 260 : 200 }]}
            imageStyle={s.bannerImage}
          >
            <View style={s.bannerOverlay} />
          </ImageBackground>

          <View style={[s.avatarWrap, { marginTop: isTablet ? -72 : -60 }]}>
            <Image source={{ uri: 'https://picsum.photos/seed/elena/300' }} style={s.avatar} />
          </View>

          <View style={s.profileCenter}>
            <View style={s.nameRow}>
              <Text style={[s.name, { fontSize: isTablet ? 28 : 20 }]}>Me</Text>
              <VerifyIcon height={24} width={24} fill='#cd2bee'/>
            </View>
            <Text style={s.subtitle}>Universal Creator</Text>
          </View>

          <View style={[s.stats, isTablet && s.statsTablet]}>
            <View style={s.statBlock}>
              <Text style={s.statValue}>{isFollowing ? '14,201' : '14,200'}</Text>
              <Text style={s.statLabel}>Followers</Text>
            </View>
            <View style={s.sep} />
            <View style={s.statBlock}>
              <Text style={s.statValue}>{(likeCount / 1000).toFixed(1)}K</Text>
              <Text style={s.statLabel}>Likes</Text>
            </View>
            <View style={s.sep} />
            <Pressable style={s.statBlock} onPress={() => isOwner && navigation.navigate('/subscribers')}>
              <Text style={[s.statValue, s.accent]}>2,842</Text>
              <Text style={[s.statLabel, s.accent]}>Subscribers</Text>
            </Pressable>
          </View>
          <View style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pressable style={s.primary} onPress={() => navigation.navigate('/creator/settings')}>
              <Text style={s.primaryText}>Edit Profile</Text>
            </Pressable>
          </View>
          {/* {isOwner ? (
            <Pressable style={s.primary} onPress={() => navigation.navigate('/creator/settings')}>
              <Text style={s.primaryText}>Edit Profile</Text>
            </Pressable>
          ) : (
            <View style={s.row}>
              <Pressable
                style={[s.iconAction, isLiked && s.iconActionLiked]}
                onPress={() => {
                  const next = !isLiked;
                  setIsLiked(next);
                  setLikeCount((prev) => (next ? prev + 1 : prev - 1));
                  toastNow(next ? 'Added to favorites' : 'Removed from favorites');
                }}
              >
                <MaterialIcons name="favorite-border" size={22} color="#fff" />
              </Pressable>

              <Pressable
                style={[s.follow, isFollowing && s.followActive]}
                onPress={() => {
                  const next = !isFollowing;
                  setIsFollowing(next);
                  toastNow(next ? 'Following' : 'Unfollowed');
                }}
              >
                <MaterialIcons name={isFollowing ? 'verified' : 'person-add'} size={18} color={isFollowing ? '#cd2bee' : '#fff'} />
                <Text style={[s.followText, isFollowing && s.followTextActive]}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </Pressable>

              <Pressable style={[s.primary, s.subscribe]} onPress={openSubscription}>
                <MaterialIcons name="stars" size={18} color="#fff" />
                <Text style={s.primaryText}>Subscribe</Text>
              </Pressable>
            </View>
          )} */}
          <View style={{
            paddingHorizontal: 20,
            marginTop: 15,
          }}>
            <Text style = {{
            textAlign: "center",
            color: 'rgb(100 116 139)',
            fontSize: 12,
            fontWeight: '600',
            fontStyle: 'italic'
            // fontVariant: 
          }}>
            Exploring the nexus of synthwave rhythms and{"\n"}
            cinematic soul. Join the journey through the star{"\n"}
            systems of sound
          </Text>
          </View>

          <View style={s.membershipHeader}>
            <Text style={s.section}>Membership</Text>
            <View style={s.rowTight}>
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
                        fontSize: 8,
                        fontWeight: '900',
                        textTransform: 'uppercase'
                      }}>-15%</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <Pressable style={s.card} onPress={openSubscription}>
            <Text style={s.cardTitle}>{INITIAL_SUBSCRIPTION.name}</Text>
            <View style={s.priceLine}>
              <Text style={s.cardPrice}>${calculatePrice(INITIAL_SUBSCRIPTION.price)}</Text>
              <Text style={s.priceSuffix}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</Text>
            </View>
            {billingCycle === 'annually' && (
              <Text style={s.saveText}>Billed yearly. Save ${(parseFloat(INITIAL_SUBSCRIPTION.price) * 12 * 0.15).toFixed(2)}/year</Text>
            )}
            {INITIAL_SUBSCRIPTION.perks.map((perk, i) => (
              <View key={i} style={s.perkRow}>
                <MaterialIcons name="check-circle-outline" size={18} color="#cd2bee" />
                <Text style={s.perk}>{perk}</Text>
              </View>
            ))}
            <Pressable>
              <View style = {{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                paddingVertical: 15,
                paddingHorizontal: 10,
                alignItems: "center",
                marginTop: 10
              }}>
                <Text style = {{
                  color: 'white',
                  // fontWeight: 'bold',
                  fontFamily: 'PlusJakartaSansBold',
                  fontSize: 12
                }}>
                  {billingCycle === 'monthly' ? 'SUBSCRIBE MONTHLY': 'SUBSCRIBE ANUALLY'}
                </Text>
              </View>
            </Pressable>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsInner}>
            {tabs.map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tab}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextOn]}>{tab}</Text>
                {activeTab === tab && <View
                style = {{
                  borderRadius: 999,
                  backgroundColor: '#cd2bee',
                  height: 5,
                  marginTop: 10,
                }}
                ></View>}
              </Pressable>
            ))}
          </ScrollView>

          {activeTab === 'Videos' && (
            <View style={s.grid}>
              {videos.map((item) => (
                <Pressable key={item.id} style={[s.videoCard, { width: cardWidth-15 }]} onPress={() => navigation.navigate(`/video/${item.id}`)}>
                  <Image source={{ uri: item.img }} style={s.videoImage} />
                  <LinearGradient
                  colors={['transparent', '#00000037']}
                  start={{ x: 0, y: 0.6 }}
                  end={{ x: 0, y: 1 }}
                  style = {{
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      zIndex: 1,
                      // borderRadius: 20,
                    }}
                  ></LinearGradient>
                  <View style={s.duration}>
                    <Text style={s.durationText}>{item.duration}</Text>
                  </View>
                  <View style={s.videoMetaWrap}>
                    <Text style={s.videoTitle} numberOfLines={2}>
                      {item.title.toUpperCase()}
                    </Text>
                    <Text style={s.videoMeta}>{item.views.toUpperCase()} views</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {activeTab === 'Premium' &&
            [1, 2, 3].map((i) => (
              <Pressable key={i} style={s.premium} onPress={() => (isOwner ? navigation.navigate('/creator/library') : openSubscription())}>
                <Image source={{ uri: `https://picsum.photos/seed/prem${i}/800/450` }} style={s.premiumImg} />
                <View style={s.premiumOverlay} />
                {!isOwner && (
                  <View style={s.lockBadge}>
                    <MaterialIcons name="lock" size={16} color="#fff" />
                    <Text style={s.lockText}>Subscribers only</Text>
                  </View>
                )}
                <View style={s.premiumBottom}>
                  <Text style={s.premiumText}>Project Node #{i + 102}</Text>
                </View>
              </Pressable>
            ))}

          {/* {activeTab === 'Store' && (
            <View style={s.grid}>
              {[1, 2].map((i) => (
                <View key={i} style={[s.store, { width: cardWidth }]}>
                  <Image source={{ uri: `https://picsum.photos/seed/merch${i}/300` }} style={s.storeImg} />
                  <Text style={s.videoTitle}>Official Artifact #{i}</Text>
                  <Text style={s.price}>$45.00</Text>
                </View>
              ))}
            </View>
          )} */}

          {activeTab === 'Events' && (
            <View style={s.empty}>
              <MaterialIcons name="event" size={22} color="#818398" />
              <Text style={s.videoMeta}>Events feed coming soon.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selectedSub} transparent animationType="slide" onRequestClose={() => !isProcessing && setSelectedSub(null)}>
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !isProcessing && setSelectedSub(null)} />
          <View style={[s.modal, { maxHeight: Dimensions.get('window').height * 0.9 }]}>
            {showSuccess ? (
              <>
                <Text style={s.modalTitle}>Identity Verified</Text>
                <Pressable style={s.primary} onPress={() => setSelectedSub(null)}>
                  <Text style={s.primaryText}>Start Watching</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={s.modalTitle}>{selectedSub?.name} Access</Text>
                {modalStep === 'details' ? (
                  selectedSub?.perks.map((perk, i) => (
                    <View key={i} style={s.perkRow}>
                      <MaterialIcons name="check-circle" size={16} color="#cd2bee" />
                      <Text style={s.perk}>{perk}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={s.row}>
                      <Pressable style={[s.switchBtn, paymentMethod === 'momo' && s.switchBtnOn]} onPress={() => setPaymentMethod('momo')}>
                        <Text style={[s.switchText, paymentMethod === 'momo' && s.switchTextOn]}>Mobile Money</Text>
                      </Pressable>
                      <Pressable style={[s.switchBtn, paymentMethod === 'bank' && s.switchBtnOn]} onPress={() => setPaymentMethod('bank')}>
                        <Text style={[s.switchText, paymentMethod === 'bank' && s.switchTextOn]}>Bank Transfer</Text>
                      </Pressable>
                    </View>

                    {paymentMethod === 'momo' && (
                      <>
                        <View style={s.row}>
                          {(['MTN', 'Vodafone', 'AirtelTigo'] as const).map((provider) => (
                            <Pressable key={provider} style={[s.switchBtn, momoProvider === provider && s.switchBtnOn]} onPress={() => setMomoProvider(provider)}>
                              <Text style={[s.switchText, momoProvider === provider && s.switchTextOn]}>{provider}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <TextInput
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          placeholder="+233 Mobile Number"
                          placeholderTextColor="#888"
                          style={s.input}
                          keyboardType="phone-pad"
                        />
                      </>
                    )}

                    {paymentMethod === 'bank' && <Text style={s.videoMeta}>EcoBank Ghana - 1441000234567 - KULSAH CREATOR HUB</Text>}
                  </>
                )}

                <Pressable style={s.primary} onPress={handlePurchase} disabled={isProcessing}>
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.primaryText}>{modalStep === 'details' ? 'Continue to Payment' : `Pay $${calculatePrice(selectedSub?.price || '0')} Now`}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913', },
  toast: {
    position: 'absolute',
    zIndex: 40,
    top: 56,
    alignSelf: 'center',
    backgroundColor: '#cd2bee',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    paddingTop: 46,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffffff1a',
    backgroundColor: '#1f1022bf'
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff1a',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: { paddingBottom: 120, alignItems: 'center' },
  container: { rowGap: 14, marginTop: 10 },
  banner: { width: '100%', borderRadius: 0, overflow: 'hidden' },
  bannerImage: { borderRadius: 0 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0000006a' },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 38,
    borderWidth: 2,
    backgroundColor: "#000",
    borderColor: 'rgba(59 130 246 / 0.5)',
    alignSelf: 'center',
    overflow: 'hidden',
    padding: 5,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 30 },
  profileCenter: { alignItems: 'center', rowGap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', columnGap: 5 },
  name: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5},
  subtitle: {
    color: '#cd2bee',
    fontSize: 10,
    fontWeight: '900',
    alignSelf: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  statValue: { color: '#fff', fontSize: 15, fontWeight: '900' },
  statLabel: {
    color: '#9ea0b6',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
    fontWeight: '700',
  },
  accent: { color: '#cd2bee' },
  sep: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: '#ffffff2d' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal : 25 },
  rowTight: { 
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderColor: 'rgba(255 255 255 / 0.1)',
    borderWidth: 1,
    backgroundColor: 'rgba(255 255 255 / 0.05)',
    borderRadius: 18,
    padding: 6,
    marginLeft: 6
  },
  iconAction: {
    width: 62,
    height: 62,
    borderRadius: 25,
    backgroundColor: '#ffffff0D',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255 255 255 / 0.1)',
    borderWidth: 1,
    // borderStyle: 'solid'
  },
  iconActionLiked: { backgroundColor: '#ff4d67' },
  follow: {
    flex: 1,
    height: 62,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff1a',
    flexDirection: 'row',
    gap: 6,
    borderColor: 'rgba(255 255 255 / 0.1)',
    borderWidth: 1,
  },
  followActive: { borderColor: '#cd2bee6f', borderWidth: 1, backgroundColor: '#cd2bee1a' },
  followText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', fontSize: 14 },
  followTextActive: { color: '#cd2bee' },
  primary: {
    flex: 1,
    height: 52,
    width: '90%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
    flexDirection: 'row',
    gap: 6,
  },
  subscribe: { backgroundColor: '#7a19e6', height: 62, borderRadius: 25 },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  membershipHeader: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  section: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
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
  switchBtnOn: { backgroundColor: '#FFFFFF1A', borderWidth: 0, flexDirection: 'row' },
  switchText: { color: '#a9a9bd', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  switchTextOn: { color: '#cd2bee' },
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
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end' },
  cardPrice: { 
    color: '#fff',
    fontSize: 30,
    lineHeight: 42,
    // fontWeight: '900', 
    fontFamily: 'PlusJakartaSansBold' },
  priceSuffix: { 
    color: '#818398',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'PlusJakartaSansBold'
   },
  saveText: {
    color: '#22c55e',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.5,
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
  perk: { color: '#d4d4e5', fontSize: 12, flex: 1, },
  tabs: { marginTop: 6, marginBottom: 2 },
  tabsInner: { columnGap: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 8 },
  tabOn: { backgroundColor: '#cd2bee44' },
  tabText: { color: '#FFFFFF33', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  tabTextOn: { color: '#cd2bee', letterSpacing: 1.5, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 15 },
  videoCard: {
    backgroundColor: '#0d1220',
    borderRadius: 18,
    overflow: 'hidden',
    height: 226,
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  videoImage: { width: '100%', height: '100%' },
  duration: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: '#0000008d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    zIndex:2
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700', position: 'absolute' },
  videoMetaWrap: { paddingHorizontal: 9, paddingVertical: 9, rowGap: 3, position: 'absolute', bottom: 0},
  videoTitle: { color: '#fff', fontWeight: '800', fontSize: 12 },
  videoMeta: { color: '#8e91a6', fontSize: 11, fontWeight: '800' },
  premium: {
    backgroundColor: '#0d1220',
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  premiumImg: { width: '100%', height: '100%' },
  premiumOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  lockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#0000008c',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  lockText: { color: '#fff', fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  premiumBottom: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  premiumText: { color: '#fff', fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
  store: {
    backgroundColor: '#0d1220',
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#ffffff16',
  },
  storeImg: { width: '100%', height: 130 },
  price: { color: '#cd2bee', paddingHorizontal: 8, fontWeight: '900', fontSize: 18 },
  empty: { minHeight: 100, alignItems: 'center', justifyContent: 'center', rowGap: 8 },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#0d1220',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 14,
    gap: 12,
  },
  modalTitle: { color: '#fff', fontWeight: '900', fontSize: 24 },
  input: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ffffff12',
    borderWidth: 1,
    borderColor: '#ffffff22',
    color: '#fff',
    paddingHorizontal: 12,
  },
});

export default ArtistProfile;
