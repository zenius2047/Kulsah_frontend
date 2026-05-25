import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediumScreen, setDark, setUser, subscribeUser, user } from '../types';
import { FontSize } from '../fonts';
import CreatorSettings from './CreatorSettings';
import DarkIcon from '../assets/icons/dark-mode-svg.svg';
import AccountIcon from '../assets/icons/account-circle-svg.svg';
import PaymentsIcon from '../assets/icons/payments-svg.svg';
import NotificationsIcon from '../assets/icons/notifications-svg.svg';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import FireIcon from '../assets/icons/fire-svg.svg';
import { SvgProps } from 'react-native-svg';
import CoinsIcon from '../assets/icons/coins-svg.svg';

type SubView = 'main' | 'profile' | 'identity' | 'gifts' | 'payments' | 'notifications';

type FanSettingsProps = {
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleRole?: () => void;
};

interface FanTicket {
  id: string;
  artist: string;
  event: string;
  date: string;
  location: string;
  qrData: string;
  color: 'primary' | 'blue';
}

type SettingIcon = React.FC<SvgProps> | string;

interface SettingItem {
  label: string;
  icon: SettingIcon;
  desc: string;
  isToggle?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  id?: SubView;
  path?: string;
}


const FanSettings: React.FC<FanSettingsProps> = ({ onLogout, isDarkMode, onToggleTheme, onToggleRole }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [currentUser, setCurrentUser] = useState(user);
  const [activeView, setActiveView] = useState<SubView>('main');
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [tokenTime, setTokenTime] = useState(30);

  const [profile, setProfile] = useState({
    name: 'Alex Rivera',
    handle: 'alex_vibes_2024',
    bio: 'Synthwave enthusiast. Collecting limited drops and supporting indie talent across the soundscape.',
    avatar: 'https://picsum.photos/seed/profile/200',
  });

  useEffect(() => {
    const unsubscribe = subscribeUser(setCurrentUser);
    return unsubscribe;
  }, []);

  const creatorToggle = async()=>{
    const nextUser = {
      id: user?.id || 'mila_ray_01',
      name: user?.name || 'Mila Ray',
      role: 'creator' as const,
    };
    setUser(nextUser);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
    navigation.reset({
      index: 1,
      routes: [{ name: 'MainTabs' }, { name: 'Settings' }],
    });
  }


  const purchasedTickets: FanTicket[] = [
    {
      id: 't1',
      artist: 'Burna Boy',
      event: 'Love, Damini Tour',
      date: 'Aug 24',
      location: 'O2 Arena, London',
      qrData: 'KULS_ENTRY_BB_8829_ALEX',
      color: 'primary',
    },
    {
      id: 't2',
      artist: 'Elena Rose',
      event: 'Ethereal Experience',
      date: 'Sep 12',
      location: 'Fillmore, SF',
      qrData: 'KULS_ENTRY_ER_9102_ALEX',
      color: 'blue',
    },
  ];

  const paymentMethods = [
    { id: 'pm1', type: 'visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: 'pm2', type: 'momo', provider: 'MTN', phone: '+233 24 123 4567', isDefault: false },
  ];

  const ownedGifts = [
    { name: 'Fan Sticker Pack', count: 12, icon: 'sticky-note-2', desc: 'Express yourself in live chat' },
    { name: 'Buy Coffee', count: 5, icon: 'coffee', desc: 'Support creators with caffeine' },
    { name: 'Season Sticker', count: 2, icon: 'workspace-premium', desc: 'Limited edition seasonal drop' },
  ];

  useEffect(() => {
    if (route.params?.view) {
      setActiveView(route.params.view as SubView);
    }
  }, [route]);

  useEffect(() => {
    if (activeView !== 'identity') return;
    const interval = setInterval(() => {
      setTokenTime((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeView]);

  const handleSaveProfile = () => {
    setActiveView('main');
  };

  const handleSlideScroll = (e: any) => {
    const width = e.nativeEvent.layoutMeasurement.width;
    if (!width) return;
    const progress = e.nativeEvent.contentOffset.x / width;
    const newSlide = Math.round(progress);
    if (newSlide !== currentSlide) setCurrentSlide(newSlide);
  };

  const scrollToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * 320, animated: true });
  };

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const surfaceColor = isDark ? '#111827' : theme.card;
  const elevatedSurface = isDark ? 'rgba(31, 16, 34, 0.75)' : theme.card;
  const subtleSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const secondaryText = isDark ? '#94a3b8' : theme.textSecondary;
  const mutedText = isDark ? '#6b7280' : theme.textMuted;
  const inputBackground = isDark ? '#0f172a' : '#ffffff';
  const chipSurface = isDark ? primaryColorAlpha(0.12) : '#f5f3ff';
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

  const renderHeader = (title: string, backToMain = true) => (
    <View style={[s.header, { backgroundColor: isDark ? 'rgba(31, 16, 34, 0.75)' : theme.card, borderBottomColor: theme.border }]}>
      <Pressable
        onPress={() => (backToMain ? setActiveView('main') : navigation.goBack())}
        style={[s.backButton, { backgroundColor: isDark ? '#ffffff14' : theme.surface }]}
      >
        <MaterialIcons name="chevron-left" size={20} color={theme.text} />
      </Pressable>
      <Text style={[s.headerTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  const renderProfileView = () => (
    <KeyboardAvoidingView
      style={[s.viewWrap, { backgroundColor: theme.screen }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      {renderHeader('Persona Studio')}
      <ScrollView
        contentContainerStyle={s.formCard}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileAvatarWrap}>
          <View style={s.avatarRing}>
            <Image source={{ uri: profile.avatar }} style={s.avatarImage} />
            <View style={s.avatarOverlay}>
              <MaterialIcons name="photo-camera" size={18} color="#fff" />
            </View>
          </View>
          <View style={s.avatarEditDot}>
            <MaterialIcons name="edit" size={14} color="#fff" />
          </View>
        </View>

        <View style={s.formBlock}>
          <Text style={[s.label, { color: secondaryText }]}>Display Name</Text>
          <TextInput
            value={profile.name}
            onChangeText={(value) => setProfile({ ...profile, name: value })}
            style={[s.input, { borderColor: theme.border, backgroundColor: inputBackground, color: theme.text }]}
            placeholderTextColor={mutedText}
          />
        </View>

        <View style={s.formBlock}>
          <Text style={[s.label, { color: secondaryText }]}>Galaxy Handle</Text>
          <View style={s.handleWrap}>
            <Text style={[s.handlePrefix, { color: theme.accent }]}>@</Text>
            <TextInput
              value={profile.handle}
              onChangeText={(value) => setProfile({ ...profile, handle: value })}
              style={[s.input, s.handleInput, { borderColor: theme.border, backgroundColor: inputBackground, color: theme.text }]}
              placeholderTextColor={mutedText}
            />
          </View>
        </View>

        <View style={s.formBlock}>
          <View style={s.rowBetween}>
            <Text style={[s.label, { color: secondaryText }]}>Bio</Text>
            <Text style={[s.counter, { color: secondaryText }]}>{profile.bio.length}/160</Text>
          </View>
          <TextInput
            value={profile.bio}
            onChangeText={(value) => setProfile({ ...profile, bio: value })}
            maxLength={160}
            multiline
            numberOfLines={4}
            style={[s.textArea, { borderColor: theme.border, backgroundColor: inputBackground, color: theme.text }]}
            placeholderTextColor={mutedText}
          />
        </View>

        <Pressable onPress={handleSaveProfile} style={[s.primaryButton, { backgroundColor: theme.accent }]}>
          <Text style={s.primaryButtonText}>Update Persona</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderIdentityView = () => (
    <View style={[s.viewWrap, { backgroundColor: theme.screen }]}>
      {renderHeader('Identity Pass')}
      <ScrollView contentContainerStyle={s.identityContent} showsVerticalScrollIndicator={false}>
        <View style={s.carouselWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleSlideScroll}
            scrollEventThrottle={16}
          >
            <View style={s.cardSlide}>
              <Pressable onPress={() => toggleFlip('main')} style={[s.identityCard, { backgroundColor: surfaceColor, borderColor: theme.border }]}>
                {flippedCards['main'] ? (
                  <View style={s.cardBack}>
                    <Text style={[s.cardLabel, { color: theme.accent }]}>Identity Pass</Text>
                    <Text style={[s.cardTitle, { color: theme.text }]}>Verification</Text>
                    <View style={[s.qrWrap, { backgroundColor: softSurface }]}>
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ID_REF_${profile.name.replace(' ', '_')}&bgcolor=ffffff&color=0f172a`,
                        }}
                        style={s.qrImage}
                      />
                    </View>
                    <View style={[s.tokenPill, { borderColor: isDark ? primaryColorAlpha(0.3) : primaryColorAlphaHex('44'), backgroundColor: chipSurface }]}>
                      <View style={s.tokenDot} />
                      <Text style={[s.tokenText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>Refreshes in {tokenTime}s</Text>
                    </View>
                    <Text style={[s.tokenHint, { color: secondaryText }]}>Encrypted Galaxy Protocol Active</Text>
                  </View>
                ) : (
                  <View style={s.cardFront}>
                    <View style={s.cardRowBetween}>
                      <View>
                        <Text style={[s.cardTag, { color: theme.accent }]}>Ecosystem Node</Text>
                        <Text style={[s.cardName, { color: theme.text }]}>{profile.name}</Text>
                      </View>
                      <View style={[s.cardIconBadge, { backgroundColor: softSurface }]}>
                        <MaterialIcons name="stars" size={18} color={theme.accent} />
                      </View>
                    </View>
                    <View style={[s.profileOrb, { borderColor: softSurface }]}>
                      <Image source={{ uri: profile.avatar }} style={s.profileOrbImage} />
                    </View>
                    <Text style={[s.memberTag, { backgroundColor: softSurface, color: theme.text }]}>Member #0042</Text>
                    <View style={s.cardRowBetween}>
                      <View>
                        <Text style={[s.smallLabel, { color: secondaryText }]}>Digital Signature</Text>
                        <Text style={[s.monoText, { color: mutedText }]}>REF: KULS-8829-X</Text>
                      </View>
                      <View style={s.iconRow}>
                        <MaterialIcons name="nfc" size={18} color={secondaryText} />
                        <MaterialIcons name="fingerprint" size={18} color={secondaryText} />
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </View>

            {purchasedTickets.map((ticket) => (
              <View key={ticket.id} style={s.cardSlide}>
                <Pressable onPress={() => toggleFlip(ticket.id)} style={[s.identityCard, { backgroundColor: surfaceColor, borderColor: theme.border }]}>
                  {flippedCards[ticket.id] ? (
                    <View style={s.cardBack}>
                      <Text style={[s.cardLabel, { color: theme.accent }]}>Gate Scan Protocol</Text>
                      <Text style={[s.cardTitle, { color: theme.text }]}>Live Admission</Text>
                      <View style={[s.qrWrap, { backgroundColor: softSurface }]}>
                        <Image
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.qrData}&bgcolor=ffffff&color=0f172a`,
                          }}
                          style={s.qrImage}
                        />
                      </View>
                      <View style={[s.tokenPillAlt, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: isDark ? 'rgba(34,197,94,0.14)' : '#f0fdf4' }]}>
                        <View style={[s.tokenDot, { backgroundColor: '#22c55e' }]} />
                        <Text style={s.tokenTextAlt}>Secure Token: {tokenTime}s</Text>
                      </View>
                      <Text style={[s.tokenHint, { color: secondaryText }]}>Ensure screen brightness is maxed during scan.</Text>
                    </View>
                  ) : (
                    <View style={s.cardFront}>
                      <Text style={[s.cardTag, { color: ticket.color === 'blue' ? '#3b82f6' : theme.accent }]}>Upcoming Entry</Text>
                      <Text style={[s.cardName, { color: theme.text }]}>{ticket.artist}</Text>
                      <Text style={[s.cardSub, { color: secondaryText }]}>{ticket.event}</Text>
                      <View style={s.ticketRow}>
                        <View>
                          <Text style={[s.smallLabel, { color: secondaryText }]}>Date</Text>
                          <Text style={[s.ticketValue, { color: theme.text }]}>{ticket.date}</Text>
                        </View>
                        <View>
                          <Text style={[s.smallLabel, { color: secondaryText }]}>Location</Text>
                          <Text style={[s.ticketValue, { color: theme.text }]}>{ticket.location.split(',')[0]}</Text>
                        </View>
                      </View>
                      <View style={s.ticketRow}>
                        <View>
                          <Text style={[s.smallLabel, { color: secondaryText }]}>Gate Zone</Text>
                          <Text style={[s.ticketValue, { color: theme.text }]}>Pit North</Text>
                        </View>
                        <View style={[s.qrBadge, { backgroundColor: subtleSurface }]}>
                          <MaterialIcons name="qr-code-2" size={18} color={theme.accent} />
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={s.progressBarWrap}>
            <View style={[s.progressTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  s.progressFill,
                  { backgroundColor: theme.accent },
                  { width: `${((currentSlide + 1) / (purchasedTickets.length + 1)) * 100}%` },
                ]}
              />
            </View>
            <View style={s.progressLabels}>
              <Text style={[s.progressText, { color: secondaryText }, currentSlide === 0 && { color: theme.accent }]}>Identity</Text>
              <Text style={[s.progressText, { color: secondaryText }, currentSlide > 0 && { color: theme.accent }]}>Event Keys</Text>
            </View>
          </View>
        </View>

        <View style={s.sectionBlock}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle, { color: secondaryText }]}>Pass Selection</Text>
            <Text style={[s.sectionBadge, { color: theme.accent }]}>{purchasedTickets.length} Entry Keys</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rail}>
            <Pressable onPress={() => scrollToSlide(0)} style={[s.railCard, { backgroundColor: surfaceColor, borderColor: theme.border }]}>
              <View style={[s.railIcon, { backgroundColor: chipSurface }]}>
                <MaterialIcons name="account-circle" size={18} color={theme.accent} />
              </View>
              <Text style={[s.railTitle, { color: theme.text }]}>Global Profile</Text>
              <Text style={[s.railMeta, { color: secondaryText }]}>Ecosystem ID #0042</Text>
            </Pressable>
            {purchasedTickets.map((ticket, idx) => (
              <Pressable
                key={ticket.id}
                onPress={() => {
                  scrollToSlide(idx + 1);
                  if (flippedCards[ticket.id]) toggleFlip(ticket.id);
                }}
                style={[s.railCard, { backgroundColor: surfaceColor, borderColor: theme.border }]}
              >
                <View style={[s.railIcon, { backgroundColor: ticket.color === 'blue' ? (isDark ? 'rgba(59,130,246,0.14)' : '#eff6ff') : chipSurface }]}>
                  <MaterialIcons name="confirmation-number" size={18} color={ticket.color === 'blue' ? '#3b82f6' : theme.accent} />
                </View>
                <Text style={[s.railTitle, { color: theme.text }]}>{ticket.artist}</Text>
                <Text style={[s.railMeta, { color: secondaryText }]}>{ticket.event}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.sectionBlock}>
          <Text style={[s.sectionTitle, { color: secondaryText }]}>Protocol Sync</Text>
          {[
            { label: 'Gate Access Synchronized', icon: 'sensors', status: 'Online' },
            { label: 'Biometric Handshake', icon: 'fingerprint', status: 'Ready' },
            { label: 'Blockchain ID Verified', icon: 'shield', status: 'Passed' },
          ].map((cred) => (
            <View key={cred.label} style={[s.statusCard, { borderColor: theme.border, backgroundColor: surfaceColor }]}>
              <View style={s.statusRow}>
                <View style={[s.statusIcon, { backgroundColor: chipSurface }]}>
                  <MaterialIcons name={cred.icon as any} size={18} color={theme.accent} />
                </View>
                <Text style={[s.statusText, { color: theme.text }]}>{cred.label}</Text>
              </View>
              <Text style={[s.statusBadge, { color: theme.accent, backgroundColor: chipSurface }]}>{cred.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPaymentsView = () => (
    <View style={[s.viewWrap, { backgroundColor: theme.screen }]}>
      {renderHeader('Payment Hub')}
      <ScrollView contentContainerStyle={s.paymentsContent} showsVerticalScrollIndicator={false}>
        <View style={s.sectionBlock}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle, { color: secondaryText }]}>Verified Methods</Text>
            <Pressable>
              <Text style={[s.sectionBadge, { color: theme.accent }]}>+ Add New</Text>
            </Pressable>
          </View>
          {paymentMethods.map((method) => (
            <View key={method.id} style={[s.methodCard, { borderColor: theme.border, backgroundColor: surfaceColor }]}>
              <View style={s.methodRow}>
                <View style={[s.methodIcon, { backgroundColor: chipSurface }]}>
                  <MaterialIcons name={method.type === 'visa' ? 'credit-card' : 'smartphone'} size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={[s.methodTitle, { color: theme.text }]}>
                    {method.type === 'visa' ? `Visa ���� ${method.last4}` : `${method.provider} Mobile Money`}
                  </Text>
                  <Text style={[s.methodMeta, { color: secondaryText }]}>{method.type === 'visa' ? `Exp ${method.expiry}` : method.phone}</Text>
                </View>
              </View>
              {method.isDefault && <Text style={[s.methodBadge, { color: theme.accent, backgroundColor: chipSurface }]}>Default</Text>}
            </View>
          ))}
        </View>

        <View style={s.sectionBlock}>
          <Text style={[s.sectionTitle, { color: secondaryText }]}>Transactions</Text>
          <View style={[s.emptyCard, { borderColor: theme.border, backgroundColor: surfaceColor }]}>
            <MaterialIcons name="receipt-long" size={32} color={secondaryText} />
            <Text style={[s.emptyText, { color: secondaryText }]}>No recent billing activity</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderGiftsView = () => (
    <View style={[s.viewWrap, { backgroundColor: theme.screen }]}>
      {renderHeader('Gifts & Coins')}
      <ScrollView contentContainerStyle={s.paymentsContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            s.walletCard,
            {
              backgroundColor: isDark ? primaryColorAlpha(0.08) : '#faf5ff',
              borderColor: isDark ? primaryColorAlpha(0.22) : '#e9d5ff',
            },
          ]}
        >
          <View style={s.walletWatermark}>
            <MaterialIcons name="toll" size={88} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'} />
          </View>
          <View style={s.walletContent}>
            <Text style={[s.sectionTitle, { color: theme.accent }]}>Kulsah Wallet</Text>
            <Text style={[s.walletValue, { color: theme.text }]}>
              1,240 <Text style={[s.walletUnit, { color: theme.accent }]}>Coins</Text>
            </Text>
            <View style={s.walletActions}>
              <Pressable onPress={() => setActiveView('payments')} style={[s.walletPrimaryButton, { backgroundColor: theme.accent }]}>
                <Text style={s.walletPrimaryButtonText}>Top Up Wallet</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveView('payments')}
                style={[
                  s.walletIconButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    borderColor: isDark ? primaryColorAlpha(0.22) : '#e9d5ff',
                  },
                ]}
              >
                <MaterialIcons name="history" size={20} color={theme.accent} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={s.sectionBlock}>
          <View style={s.rowBetween}>
            <Text style={[s.sectionTitle, { color: secondaryText }]}>Digital Assets Stock</Text>
            <Text style={[s.moreItemsMeta, { color: mutedText }]}>3 Types Owned</Text>
          </View>
          {ownedGifts.map((gift) => (
            <View key={gift.name} style={[s.giftCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
              <View style={s.giftLeft}>
                <View style={[s.giftIconWrap, { backgroundColor: softSurface, borderColor: theme.border }]}>
                  <MaterialIcons name={gift.icon as any} size={22} color={theme.accent} />
                </View>
                <View style={s.giftTextWrap}>
                  <Text style={[s.giftTitle, { color: theme.text }]} numberOfLines={1}>
                    {gift.name}
                  </Text>
                  <Text style={[s.giftDesc, { color: secondaryText }]}>{gift.desc}</Text>
                </View>
              </View>
              <View style={s.giftRight}>
                <Text style={[s.giftCount, { color: theme.accent }]}>{gift.count}</Text>
                <Text style={[s.giftMeta, { color: mutedText }]}>Owned</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.sectionBlock}>
          <Text style={[s.sectionTitle, { color: secondaryText }]}>More Items</Text>
          <View
            style={[
              s.marketplaceCard,
              {
                backgroundColor: elevatedSurface,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1',
              },
            ]}
          >
            <View style={[s.marketplaceIconWrap, { backgroundColor: softSurface }]}>
              <MaterialIcons name="add-shopping-cart" size={22} color={secondaryText} />
            </View>
            <View style={s.marketplaceTextWrap}>
              <Text style={[s.marketplaceTitle, { color: theme.text }]}>Discover New Gifts</Text>
              <Text style={[s.marketplaceDesc, { color: secondaryText }]}>
                Visit the Kulsah Marketplace to find more digital assets and support your favorite artists.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (currentUser?.role === 'creator' && activeView === 'main') {
    return <CreatorSettings onLogout={onLogout} />;
  }
  if (activeView === 'profile') return renderProfileView();
  if (activeView === 'identity') return renderIdentityView();
  if (activeView === 'gifts') return renderGiftsView();
  if (activeView === 'payments') return renderPaymentsView();

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Experience',
      items: [
        {
          label: 'Dark Mode',
          icon: DarkIcon,
          desc: 'Sync with galaxy energy',
          isToggle: true,
          enabled: isDark,
          onToggle: ()=>{
            setDark(!isDark);
          },
        },
        { label: 'Switch to Creator', icon: FireIcon, desc: 'Unlock creator tools', onClick: creatorToggle },
      ],
    },
    {
      title: 'Digital ID',
      items: [
        { label: 'Persona Profile', icon: AccountIcon, desc: 'Avatar, name, and story', id: 'profile' },
        { label: 'Entry Passes & QR', icon: 'badge', desc: 'Active tickets and identity', id: 'identity' },
      ],
    },
    {
      title: 'Premium & Billing',
      items: [
        { label: 'Gifts & Coins', icon: CoinsIcon, desc: 'Wallet, stickers, and assets', id: 'gifts' },
        { label: 'Payment Hub', icon: PaymentsIcon, desc: 'Wallet and saved methods', id: 'payments' },
        { label: 'Active Subscriptions', icon: 'stars', desc: 'Creators you support', path: 'FanSubscriptions' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Global Alerts', icon: NotificationsIcon, desc: 'Manage your feed pings', id: 'notifications' },
        { label: 'Vibe Signature', icon: 'settings-input-antenna', desc: 'Recalibrate your algorithm', path: 'VibePicker' },
      ],
    },
  ];

  return (
    <View style={[s.screen, { backgroundColor: theme.screen }]}>
      {renderHeader('Fan Cockpit', false)}
      <ScrollView contentContainerStyle={s.mainContent} showsVerticalScrollIndicator={false}>
        <Pressable style={s.profileHeader} onPress={() => setActiveView('profile')}>
          <View style={s.profileAvatarWrap}>
            <View style={s.avatarRing}>
              <Image source={{ uri: profile.avatar }} style={s.avatarImage} />
              <View style={s.avatarOverlay}>
                <MaterialIcons name="photo-camera" size={18} color="#fff" />
              </View>
            </View>
            <View style={s.avatarEditDot}>
              <MaterialIcons name="edit" size={14} color="#fff" />
            </View>
          </View>
          <View style={s.profileTextWrap}>
            <View style={s.profileNameRow}>
              <Text style={[s.profileName, { color: theme.text }]}>{profile.name}</Text>
              <VerifiedIcon width={18} height={18} fill={theme.accent} />
            </View>
            <Text style={[s.profileHandle, { color: theme.accent }]}>@{profile.handle}</Text>
          </View>
        </Pressable>

        {sections.map((section) => (
          <View key={section.title} style={s.sectionBlock}>
            <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={item.label}
                style={[s.itemRow, { borderColor: theme.border, backgroundColor: elevatedSurface }]}
                onPress={() => {
                  if (item.onClick) item.onClick();
                  else if (item.id) setActiveView(item.id as SubView);
                  else if (item.path) navigation.navigate(item.path);
                }}
              >
                <View style={s.itemLeft}>
                  <View style={[s.itemIcon, { borderColor: theme.border, backgroundColor: isDark ? primaryColorAlphaHex('20') : theme.accentSoft }]}>
                    {typeof item.icon === 'string' ? (
                      <MaterialIcons name={item.icon as any} size={18} color={isDark ? '#fff' : theme.accent} />
                    ) : (
                      <item.icon width={18} height={18} fill={isDark ? '#fff' : theme.accent} />
                    )}
                  </View>
                  <View>
                    <Text style={[s.itemLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[s.itemDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                  </View>
                </View>
                {item.isToggle ? (
                  <Pressable onPress={item.onToggle} style={[s.toggle, { backgroundColor: isDark ? '#30384a' : '#cbd5e1' }, item.enabled && { backgroundColor: theme.accent }]}>
                    <View style={[s.toggleDot, item.enabled && s.toggleDotEnabled]} />
                  </Pressable>
                ) : (
                  <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                )}
              </Pressable>
            ))}
          </View>
        ))}

        <View style={s.logoutWrap}>
          <Pressable onPress={onLogout} style={s.logoutButton}>
            <MaterialIcons name="logout" size={18} color="#ef4444" />
            <Text style={s.logoutText}>Exit Galaxy Hub</Text>
          </Pressable>
          <Text style={[s.versionText, { color: secondaryText }]}>Kulsah Ecosystem v2.4.2</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  headerTitle: { fontSize: mediumScreen ? FontSize.sixteen:FontSize.twelve, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', color: '#0f172a' },
  viewWrap: { flex: 1, backgroundColor: '#f8fafc' },
  formCard: { padding: 16, gap: 18 },
  profileAvatarWrap: { alignItems: 'center', marginBottom: 12 },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: PRIMARY_COLOR,
    padding: 4,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 999 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  avatarEditDot: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBlock: { gap: 8 },
  label: { fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  input: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten,
    color: '#0f172a',
    fontFamily: 'PlusJakartaSansBold',
  },
  handleWrap: { position: 'relative', justifyContent: 'center' },
  handlePrefix: { position: 'absolute', left: 16, color: PRIMARY_COLOR, fontFamily: 'PlusJakartaSansExtraBold' },
  handleInput: { paddingLeft: 34 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, fontFamily: 'PlusJakartaSansBold', color: '#94a3b8' },
  textArea: {
    minHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#334155',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten
  },
  primaryButton: {
    marginTop: 6,
    height: 56,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 2 },
  identityContent: { padding: 16, paddingBottom: 120, gap: 20 },
  carouselWrap: { gap: 12 },
  cardSlide: { width: 360, paddingRight: 12 },
  identityCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 420,
    justifyContent: 'space-between',


  },
  cardFront: { gap: 16 },
  cardBack: { gap: 14, alignItems: 'center' },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTag: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 3, color: PRIMARY_COLOR },
  cardName: { fontSize: FontSize.twentyThree, fontFamily: 'PlusJakartaSansExtraBold', color: '#0f172a', textTransform: 'uppercase' },
  cardSub: { fontSize: FontSize.eleven, fontFamily: 'PlusJakartaSansBold', color: '#94a3b8', textTransform: 'uppercase' },
  cardTitle: { fontSize: FontSize.eighteen, fontFamily: 'PlusJakartaSansExtraBold', color: '#0f172a', textTransform: 'uppercase' },
  cardLabel: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 3, color: PRIMARY_COLOR, textTransform: 'uppercase' },
  cardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  profileOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  profileOrbImage: { width: '100%', height: '100%' },
  memberTag: {
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: FontSize.ten,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  smallLabel: { fontSize: FontSize.nine, fontFamily: 'PlusJakartaSansExtraBold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 },
  monoText: { fontSize: FontSize.eleven, fontFamily: 'PlusJakartaSansBold', color: '#64748b' },
  iconRow: { flexDirection: 'row', gap: 8 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketValue: { fontSize: FontSize.thirteen, fontFamily: 'PlusJakartaSansBold', color: '#0f172a' },
  blueText: { color: '#3b82f6' },
  qrBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  qrWrap: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 24,
  },
  qrImage: { width: 170, height: 170, borderRadius: 16 },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: primaryColorAlphaHex('44'),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
  },
  tokenPillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#22c55e44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f0fdf4',
  },
  tokenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_COLOR },
  tokenText: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', color: '#7c3aed' },
  tokenTextAlt: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', color: '#16a34a' },
  tokenHint: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', color: '#94a3b8', textAlign: 'center' },
  progressBarWrap: { gap: 8 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: '#e2e8f0' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase', color: '#94a3b8' },
  progressTextActive: { color: PRIMARY_COLOR },
  sectionBlock: { gap: 10 },
  sectionTitle: { fontSize: FontSize.nine, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  sectionBadge: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase', color: PRIMARY_COLOR },
  rail: { marginTop: 6 },
  railCard: {
    width: 170,
    marginRight: 12,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  railIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIconBlue: { backgroundColor: '#eff6ff' },
  railTitle: { fontSize: FontSize.eleven, fontFamily: 'PlusJakartaSansExtraBold', color: '#0f172a' },
  railMeta: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', color: '#94a3b8', textTransform: 'uppercase' },
  statusCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansBold', color: '#0f172a' },
  statusBadge: {
    fontSize: FontSize.nine,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    color: PRIMARY_COLOR,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentsContent: { padding: 16, paddingBottom: 120, gap: 16 },
  walletCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
  walletWatermark: {
    position: 'absolute',
    top: 20,
    right: 18,
  },
  walletContent: { gap: 12 },
  walletValue: {
    fontSize: mediumScreen ? FontSize.thirtyTwo : FontSize.twentyEight,
    fontFamily: 'PlusJakartaSansExtraBold',
    color: '#0f172a',
    marginTop: 4,
  },
  walletUnit: {
    fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
    fontFamily: 'PlusJakartaSansExtraBold',
    color: PRIMARY_COLOR,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  walletPrimaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  walletPrimaryButtonText: {
    color: '#fff',
    fontSize: FontSize.ten,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  walletIconButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreItemsMeta: {
    fontSize: FontSize.nine,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  giftCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    paddingRight: 8,
  },
  giftIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTextWrap: { flex: 1 },
  giftTitle: {
    fontSize: FontSize.twelve,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  giftDesc: {
    marginTop: 2,
    fontSize: FontSize.ten,
    fontFamily: 'PlusJakartaSansMedium',
  },
  giftRight: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  giftCount: {
    fontSize: FontSize.eighteen,
    fontFamily: 'PlusJakartaSansExtraBold',
    lineHeight: FontSize.twenty,
  },
  giftMeta: {
    marginTop: 2,
    fontSize: FontSize.eight,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  marketplaceCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
  },
  marketplaceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  marketplaceTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  marketplaceTitle: {
    fontSize: FontSize.twelve,
    fontFamily: 'PlusJakartaSansBold',
  },
  marketplaceDesc: {
    fontSize: FontSize.ten,
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
    lineHeight: FontSize.sixteen,
  },
  methodCard: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: { fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansBold', color: '#0f172a' },
  methodMeta: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', color: '#94a3b8', textTransform: 'uppercase' },
  methodBadge: {
    fontSize: FontSize.nine,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    color: PRIMARY_COLOR,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyCard: {
    paddingVertical: 30,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  mainContent: { padding: 16, paddingBottom: 120, gap: 18 },
  profileHeader: { alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'center' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: FontSize.sixteen, fontFamily: 'PlusJakartaSansExtraBold', color: '#0f172a' },
  profileHandle: { fontSize: FontSize.ten, fontFamily: 'PlusJakartaSansBold', letterSpacing: 0.5, color: PRIMARY_COLOR, textTransform: 'uppercase' },
  itemRow: {
    marginTop: 8,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: 'rgba(0 0 0 / 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansExtraBold', color: '#0f172a' },
  itemDesc: { fontSize: FontSize.eleven, fontFamily: 'PlusJakartaSansMedium', color: '#94a3b8' },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleEnabled: { backgroundColor: PRIMARY_COLOR },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleDotEnabled: { alignSelf: 'flex-end' },
  logoutWrap: { paddingTop: 12, alignItems: 'center', gap: 10 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
  },
  logoutText: { fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansBold', color: '#ef4444' },
  versionText: { fontSize: FontSize.nine, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 2 },
});

export default FanSettings;

