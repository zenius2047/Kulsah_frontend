import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DarkIcon from '../assets/icons/dark-mode-svg.svg';
import AccountIcon from '../assets/icons/account-circle-svg.svg';
import AnalyticsIcon from '../assets/icons/analytics-svg.svg';
import EditIcon from '../assets/icons/edit-svg.svg';
import ImageIcon from '../assets/icons/image-svg.svg';
import LockIcon from '../assets/icons/lock-svg.svg';
import MonitoringIcon from '../assets/icons/monitoring-svg.svg';
import NotificationsIcon from '../assets/icons/notifications-svg.svg';
import PaymentsIcon from '../assets/icons/payments-svg.svg';
import SecurityIcon from '../assets/icons/security-svg.svg';
import SellIcon from '../assets/icons/sell-svg.svg';
import ShopIcon from '../assets/icons/shopping-bag-svg.svg';
import StarsIcon from '../assets/icons/stars-svg.svg';
import VisibilityOff from '../assets/icons/visibility-off-svg.svg';
import VpnKeyIcon from '../assets/icons/vpn-key-svg.svg';
import DevicesIcon from '../assets/icons/devices-svg.svg';
import EventIcon from '../assets/icons/event-svg.svg';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import { SvgProps } from 'react-native-svg';
import { setUser, user } from '../types';


type SettingsSubView = 'main' | 'socials' | 'tags' | 'security' | 'privacy' | 'identity';

interface CreatorSettingsProps {
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleRole?: () => void;
}

interface SettingItem {
  label: string;
  icon: React.FC<SvgProps> |string;
  desc: string;
  isToggle?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  action?: () => void;
  path?: string;
}

const ALL_TAGS = ['Synthwave', 'Indie-Soul', 'Live-Looping', 'Afrobeats', 'Techno', 'Cinematic', 'Visual Art', 'Jazz Fusion'];

const CreatorSettings: React.FC<CreatorSettingsProps> = ({ onLogout, isDarkMode, onToggleTheme, onToggleRole }) => {
  const navigation = useNavigation<any>();
  const [activeSubView, setActiveSubView] = useState<SettingsSubView>('main');

  const [bio, setBio] = useState('Exploring the nexus of synthwave and soul. Join the journey.');
  const [handle, setHandle] = useState('@elena_rose_cre8');
  const [name, setName] = useState('Elena Rose');
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200',
  );
  const [avatarImage, setAvatarImage] = useState('https://picsum.photos/seed/elena/200');

  const [showEvents, setShowEvents] = useState(true);
  const [socials, setSocials] = useState({ instagram: '@elena_rose', twitter: '@elenarose_synth', website: 'elenarose.io' });
  const [tags, setTags] = useState<string[]>(['Synthwave', 'Indie-Soul', 'Live-Looping']);

  const [hideSubs, setHideSubs] = useState(false);
  const [exclusiveMode, setExclusiveMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [contentProtection, setContentProtection] = useState(true);

  useEffect(() => {
    const loadPrefs = async () => {
      const eventsFlag = await AsyncStorage.getItem('pulsar_show_events');
      setShowEvents(eventsFlag !== 'false');
    };
    void loadPrefs();
  }, []);

  const toggleEventsVisibility = async () => {
    const next = !showEvents;
    setShowEvents(next);
    await AsyncStorage.setItem('pulsar_show_events', String(next));
  };

  const fanToggle = async()=>{
    await AsyncStorage.setItem('pulsar_user', JSON.stringify({...user, role: 'fan'}));
    setUser({id: '', name: user!.name, role: 'fan'})
    navigation.navigate('MainTabs')
  }

  const pickImageStub = (type: 'avatar' | 'banner') => {
    const seed = Date.now();
    if (type === 'avatar') {
      setAvatarImage(`https://picsum.photos/seed/avatar${seed}/200`);
    } else {
      setBannerImage(`https://picsum.photos/seed/banner${seed}/1200/700`);
    }
    Alert.alert('Image Updated', `Updated ${type} with a placeholder image. Integrate Expo ImagePicker for device uploads.`);
  };

  const sections = useMemo(
    () => [
      {
        title: 'Appearance',
        items: [
          {
            label: 'Dark Mode',
            icon: DarkIcon,
            desc: 'Sync with cosmic energy',
            isToggle: true,
            enabled: !!isDarkMode,
            onToggle: onToggleTheme,
          },
          {
            label: 'Switch to Fan',
            icon: 'person-outline',
            desc: 'Return to fan experience',
            action: fanToggle,
          },
        ] as SettingItem[],
      },
      {
        title: 'Visual Identity',
        items: [
          { label: 'Update Avatar', icon: AccountIcon, desc: 'Change your main profile photo', action: () => pickImageStub('avatar') },
          { label: 'Banner Aesthetic', icon: ImageIcon, desc: 'Customize your profile header image', action: () => pickImageStub('banner') },
          { label: 'Identity & Bio', icon: EditIcon, desc: 'Manage your @handle and story', action: () => setActiveSubView('identity') },
        ] as SettingItem[],
      },
      {
        title: 'Monetization Hub',
        items: [
          { label: 'Membership Tiers', icon: StarsIcon, desc: 'Manage pricing and exclusive perks', path: '/creator/memberships' },
          { label: 'Payout Settings', icon: PaymentsIcon, desc: 'Bank account and withdrawal methods', path: '/creator/revenue' },
          { label: 'Financial Insights', icon: MonitoringIcon, desc: 'Deep revenue and transaction analytics', path: '/creator/analytics' },
        ] as SettingItem[],
      },
      {
        title: 'Galaxy Presence',
        items: [
          { label: 'Social Links', icon: 'link', desc: 'Connect Instagram, Twitter, and more', action: () => setActiveSubView('socials') },
          { label: 'Discovery Tags', icon: SellIcon, desc: 'Edit genres and SEO keywords', action: () => setActiveSubView('tags') },
          {
            label: 'Events Visibility',
            icon: EventIcon,
            desc: 'Toggle calendar tab on profile',
            isToggle: true,
            enabled: showEvents,
            onToggle: () => void toggleEventsVisibility(),
          },
          { label: 'Store Access', icon: ShopIcon, desc: 'Manage digital store items', path: '/creator/store' },
        ] as SettingItem[],
      },
      {
        title: 'Security',
        items: [
          {
            label: 'Two-Factor Auth',
            icon: 'security',
            desc: 'Biometric and SMS verification',
            isToggle: true,
            enabled: twoFactor,
            onToggle: () => setTwoFactor((prev) => !prev),
          },
          { label: 'Login Activity', icon: DevicesIcon, desc: 'Devices synced with this node', action: () => Alert.alert('Coming Soon') },
          { label: 'Signal Encryption', icon: VpnKeyIcon, desc: 'Private key management', action: () => Alert.alert('Coming Soon') },
        ] as SettingItem[],
      },
      {
        title: 'Privacy',
        items: [
          {
            label: 'Incognito Subs',
            icon: VisibilityOff,
            desc: 'Hide subscriber counts from public',
            isToggle: true,
            enabled: hideSubs,
            onToggle: () => setHideSubs((prev) => !prev),
          },
          {
            label: 'Exclusive Mode',
            icon: LockIcon,
            desc: 'Lock profile for members only',
            isToggle: true,
            enabled: exclusiveMode,
            onToggle: () => setExclusiveMode((prev) => !prev),
          },
          {
            label: 'Content Protection',
            icon: SecurityIcon,
            desc: 'Disable screenshots for vault items',
            isToggle: true,
            enabled: contentProtection,
            onToggle: () => setContentProtection((prev) => !prev),
          },
          { label: 'Push Notifications', icon: NotificationsIcon, desc: 'Manage tip and new sub alerts', path: '/notifications' },
        ] as SettingItem[],
      },
      {
        title: 'AI & Performance',
        items: [
          { label: 'Gemini Strategy Engine', icon: 'auto-awesome', desc: 'AI-driven content recommendations', path: '/dashboard' },
          { label: 'Fan Audit', icon: AnalyticsIcon, desc: 'Detailed subscriber demographics', path: '/subscribers' },
        ] as SettingItem[],
      },
    ],
    [contentProtection, exclusiveMode, hideSubs, isDarkMode, onToggleRole, onToggleTheme, showEvents, twoFactor],
  );

  const renderHeader = (title: string, onBack: () => void) => (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Pressable onPress={onBack} style={s.iconButton}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>{title}</Text>
      </View>
      {activeSubView === 'main' ? (
        <Pressable onPress={() => navigation.navigate('/dashboard')} style={s.donePill}>
          <Text style={s.donePillText}>Done</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => setActiveSubView('main')}>
          <Text style={s.saveText}>Save</Text>
        </Pressable>
      )}
    </View>
  );

  const IdentityView = () => (
    <View style={s.screen}>
      {renderHeader('Identity & Bio', () => setActiveSubView('main'))}
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>
        <View style={s.formBlock}>
          <Text style={s.inputLabel}>Creator Handle</Text>
          <View style={s.inputWrapRow}>
            <Text style={s.inputPrefix}>@</Text>
            <TextInput
              value={handle.startsWith('@') ? handle.slice(1) : handle}
              onChangeText={(value) => setHandle(`@${value.replace(/^@/, '')}`)}
              placeholder="handle"
              placeholderTextColor="#8f95af"
              style={s.inputWithPrefix}
            />
          </View>
          <Text style={s.helpText}>Visible in galaxy feeds and searches.</Text>
        </View>

        <View style={s.formBlock}>
          <Text style={s.inputLabel}>Display Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your Stage Name"
            placeholderTextColor="#8f95af"
            style={s.input}
          />
        </View>

        <View style={s.formBlock}>
          <View style={s.rowBetween}>
            <Text style={s.inputLabel}>Story / Bio</Text>
            <Text style={[s.counterText, bio.length > 160 && s.counterWarn]}>{bio.length}/160</Text>
          </View>
          <TextInput
            value={bio}
            onChangeText={setBio}
            maxLength={160}
            multiline
            textAlignVertical="top"
            placeholder="Tell the galaxy your story..."
            placeholderTextColor="#8f95af"
            style={s.textarea}
          />
        </View>

        <View style={s.noteCard}>
          <Text style={s.noteText}>
            Your handle is your unique planetary coordinate. Changing it may disrupt existing external links to your hub.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const SocialsView = () => (
    <View style={s.screen}>
      {renderHeader('Galaxy Presence', () => setActiveSubView('main'))}
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHeading}>Social Uplinks</Text>

        {(['instagram', 'twitter', 'website'] as const).map((platform) => (
          <View key={platform} style={s.formBlock}>
            <Text style={s.fieldName}>{platform}</Text>
            <View style={s.inputWrapRow}>
              <Text style={s.inputPrefix}>{platform === 'website' ? 'link' : '@'}</Text>
              <TextInput
                value={socials[platform]}
                onChangeText={(value) => setSocials((prev) => ({ ...prev, [platform]: value }))}
                placeholderTextColor="#8f95af"
                style={s.inputWithPrefix}
              />
            </View>
          </View>
        ))}

        <View style={s.noteCard}>
          <Text style={s.noteText}>
            Connected uplinks appear on your public profile and allow fans to follow your journey across star systems.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const TagsView = () => (
    <View style={s.screen}>
      {renderHeader('Discovery Tags', () => setActiveSubView('main'))}
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionHeading}>Algorithm Alignment</Text>

        <View style={s.tagsWrap}>
          {ALL_TAGS.map((tag) => {
            const isOn = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
                style={[s.tagChip, isOn && s.tagChipOn]}
              >
                <Text style={[s.tagText, isOn && s.tagTextOn]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.tagsFooter}>
          Discovery tags help the Kulsah recommendation engine place your transmissions in front of the right audience orbits.
        </Text>
      </ScrollView>
    </View>
  );

  if (activeSubView === 'identity') return <IdentityView />;
  if (activeSubView === 'socials') return <SocialsView />;
  if (activeSubView === 'tags') return <TagsView />;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={[]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {renderHeader('Settings', () => navigation.goBack())}

        {/* <ImageBackground source={{ uri: bannerImage }} style={s.banner} imageStyle={s.bannerImage}>
          <View style={s.bannerShade} />
        </ImageBackground> */}

        <View style={s.profileTop}>
          <Pressable onPress={() => pickImageStub('avatar')} style={s.avatarWrap}>
            <Image source={{ uri: avatarImage }} style={s.avatar} />
            <View style={s.avatarEdit}>
              <MaterialIcons name="edit" size={13} color="#fff" />
            </View>
          </Pressable>
          <View style={s.profileNameBlock}>
            <View style={s.nameRow}>
              <Text style={s.profileName}>{name}</Text>
              {/* <MaterialIcons name="verified" size={18} color="#cd2bee" /> */}
              <VerifiedIcon width={18} height={18} fill = "#cd2bee"/>
            </View>
            <Text style={s.profileHandle}>{handle}</Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={s.sectionBlock}>
            <Text style={s.sectionTitle}>{section.title}</Text>

            <View style={s.itemsWrap}>
              {section.items.map((item) => (
                <Pressable
                  key={item.label}
                  style={s.itemRow}
                  onPress={() => {
                    if (item.action) item.action();
                    else if (item.path) navigation.navigate(item.path);
                  }}
                >
                  <View style={s.itemLeft}>
                    <View style={s.itemIconWrap}>
                      {typeof item.icon === 'string' ? (
                            <MaterialIcons name={item.icon as any} size={18} color="white" />
                          ) : (
                            <item.icon width={18} height={18} fill="white" />
                          )}
                    </View>
                    <View style={s.itemCopy}>
                      <Text style={s.itemLabel}>{item.label}</Text>
                      <Text style={s.itemDesc}>{item.desc}</Text>
                    </View>
                  </View>

                  {item.isToggle ? (
                    <Switch
                      trackColor={{ false: '#30384a', true: '#cd2bee' }}
                      thumbColor="#fff"
                      value={!!item.enabled}
                      onValueChange={() => item.onToggle?.()}
                    />
                  ) : (
                    <MaterialIcons name="chevron-right" size={20} color="#ffffff22" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={s.footerActions}>
          <Pressable onPress={onLogout} style={s.signOutBtn}>
            <MaterialIcons name="logout" size={18} color="#fff" />
            <Text style={s.signOutText}>Sign Out of Kulsah</Text>
          </Pressable>

          <Pressable style={s.deactivateBtn} onPress={() => Alert.alert('Coming Soon', 'Deactivate Studio flow is not wired yet.') }>
            <MaterialIcons name="delete-forever" size={18} color="#ef4444" />
            <Text style={s.deactivateText}>Deactivate Studio</Text>
          </Pressable>

          <Text style={s.versionText}>Creator Protocol v2.5.0</Text>
        </View>
      </ScrollView>
      </SafeAreaView>
      
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 120 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 16, 34, 0.75)',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffffff1a',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff14',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  donePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff4f',
    backgroundColor: '#cd2bee1f',
  },
  donePillText: {
    color: '#cd2bee',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  saveText: { color: '#cd2bee', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  banner: { height: 180, marginHorizontal: 16, marginTop: 12, borderRadius: 22, overflow: 'hidden' },
  bannerImage: { borderRadius: 22 },
  bannerShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0000004f' },
  profileTop: {
    marginTop: 44,
    // backgroundColor: 'gold',
    width: '100%',
    height: 200,
    paddingHorizontal: 20,
    // flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#cd2bee',
    padding: 5,
    backgroundColor: 'black',
    width: 96, 
    height: 96, 
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: { width: 84, height: 84, borderRadius: 42},
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#060913',
    backgroundColor: '#cd2bee',
  },
  profileNameBlock: { paddingBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',},
  profileName: { color: '#fff', fontSize: 20, fontWeight: '900' },
  profileHandle: {
    color: '#cd2bee',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  sectionBlock: { marginTop: 18, paddingHorizontal: 16 },
  sectionTitle: {
    color: '#8b90a8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemsWrap: { gap: 8 },
  itemRow: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgb(255 255 255 / 0.05)',
    backgroundColor: 'rgba(31, 16, 34, 0.75)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee20',
    borderWidth: 1,
    borderColor: 'rgba(0 0 0 / 0.05)',
  },
  itemCopy: { flex: 1 },
  itemLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemDesc: { color: '#8e91a6', marginTop: 2, fontSize: 11 },
  footerActions: { paddingHorizontal: 16, marginTop: 22, gap: 10 },
  signOutBtn: {
    height: 58,
    borderRadius: 22,
    backgroundColor: '#ffffff12',
    borderWidth: 1,
    borderColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signOutText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  deactivateBtn: {
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ef444433',
    backgroundColor: '#ef444412',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deactivateText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
  versionText: {
    marginTop: 2,
    color: '#70758f',
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  subContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 14 },
  formBlock: { gap: 8 },
  inputLabel: {
    color: '#8b90a8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 3,
  },
  inputWrapRow: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff1a',
    backgroundColor: '#ffffff08',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputPrefix: {
    color: '#cd2bee',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
    marginRight: 6,
  },
  inputWithPrefix: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14, paddingVertical: 0 },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffffff1a',
    backgroundColor: '#ffffff08',
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 14,
  },
  helpText: {
    color: '#7f849f',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    paddingHorizontal: 3,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterText: { color: '#8f95af', fontSize: 10, fontWeight: '700' },
  counterWarn: { color: '#ef4444' },
  textarea: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff1a',
    backgroundColor: '#ffffff08',
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cd2bee32',
    backgroundColor: '#cd2bee14',
    padding: 14,
  },
  noteText: { color: '#c5c9de', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  sectionHeading: {
    color: '#8b90a8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    paddingHorizontal: 3,
    marginBottom: 2,
  },
  fieldName: {
    color: '#8f95af',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    paddingHorizontal: 3,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff20',
    backgroundColor: '#ffffff10',
  },
  tagChipOn: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  tagText: {
    color: '#a8adc4',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  tagTextOn: { color: '#fff' },
  tagsFooter: {
    color: '#8f95af',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 8,
    fontWeight: '700',
  },
});

export default CreatorSettings;
