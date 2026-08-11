import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
import {
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediumScreen, setDark, setUser, subscribeUser, user } from '../types';
import CreatorSettings from './CreatorSettings';
import DarkIcon from '../assets/icons/dark-mode-svg.svg';
import AccountIcon from '../assets/icons/account-circle-svg.svg';
import PaymentsIcon from '../assets/icons/payments-svg.svg';
import NotificationsIcon from '../assets/icons/notifications-svg.svg';
import VerifiedIcon from '../assets/icons/verified-svg.svg';
import FireIcon from '../assets/icons/fire-svg.svg';
import { SvgProps } from 'react-native-svg';
import CoinsIcon from '../assets/icons/coins-svg.svg';
import CreatorSwitch from '../assets/icons/switch-creator.svg';
import { fontSize } from '../typography';
import { parseApiError, useSwitchRole, useUpdateProfile, useUploadAvatar } from '../src';
import type { AvatarUploadSource, User } from '../src';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
const SHAKE_TO_REFRESH_STORAGE_KEY = 'pulsar_shake_to_refresh';

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

type CoinPack = {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  popular?: boolean;
};

type PendingTopUp = {
  label: string;
  coins: number;
  bonus: number;
  price: number;
};

const DEFAULT_PROFILE_NAME = 'Alex Rivera';
const DEFAULT_PROFILE_HANDLE = 'alex_vibes_2024';
const DEFAULT_PROFILE_BIO =
  'Synthwave enthusiast. Collecting limited drops and supporting indie talent across the soundscape.';
const DEFAULT_PROFILE_AVATAR = 'https://picsum.photos/seed/profile/200';
const PROFILE_BIO_LIMIT = 160;
const AVATAR_CROP_STAGE = 280;
const AVATAR_CROP_MIN_SCALE = 1;
const AVATAR_CROP_MAX_SCALE = 3;
const COIN_PACKS: CoinPack[] = [
  { id: 'starter', coins: 10, bonus: 0, price: 1 },
  { id: 'popular', coins: 50, bonus: 5, price: 5, popular: true },
  { id: 'boost', coins: 100, bonus: 15, price: 10 },
  { id: 'vault', coins: 250, bonus: 50, price: 25 },
];


const createProfileDraft = (source?: User | null) => ({
  name: source?.name?.trim() || DEFAULT_PROFILE_NAME,
  handle: (source?.handle?.trim() || DEFAULT_PROFILE_HANDLE).replace(/^@/, ''),
  bio: source?.bio?.trim() || DEFAULT_PROFILE_BIO,
  avatar: source?.avatar?.trim() || DEFAULT_PROFILE_AVATAR,
});

const resolveAvatarUri = (payload: unknown): string | null => {
  if (typeof payload === 'string' && payload.trim()) return payload.trim();

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record.avatar,
      record.avatar_url,
      record.avatarUrl,
      record.url,
      record.path,
      record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>).avatar : undefined,
      record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>).avatar_url : undefined,
      record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>).avatarUrl : undefined,
      record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>).url : undefined,
      record.user && typeof record.user === 'object' ? (record.user as Record<string, unknown>).avatar : undefined,
      record.user && typeof record.user === 'object' ? (record.user as Record<string, unknown>).avatar_url : undefined,
      record.user && typeof record.user === 'object' ? (record.user as Record<string, unknown>).avatarUrl : undefined,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
};

type CropOffset = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getAvatarCropBaseSize = (asset: ImagePicker.ImagePickerAsset) => {
  const width = asset.width || AVATAR_CROP_STAGE;
  const height = asset.height || AVATAR_CROP_STAGE;
  const aspectRatio = width / height;

  if (aspectRatio >= 1) {
    return { width: AVATAR_CROP_STAGE * aspectRatio, height: AVATAR_CROP_STAGE };
  }

  return { width: AVATAR_CROP_STAGE, height: AVATAR_CROP_STAGE / aspectRatio };
};

const getAvatarCropBounds = (asset: ImagePicker.ImagePickerAsset, scale: number) => {
  const base = getAvatarCropBaseSize(asset);
  const width = base.width * scale;
  const height = base.height * scale;

  return {
    width,
    height,
    maxOffsetX: Math.max(0, (width - AVATAR_CROP_STAGE) / 2),
    maxOffsetY: Math.max(0, (height - AVATAR_CROP_STAGE) / 2),
  };
};

const createAvatarCropData = async (
  asset: ImagePicker.ImagePickerAsset,
  scale: number,
  offset: CropOffset,
) => {
  const sourceWidth = asset.width || AVATAR_CROP_STAGE;
  const sourceHeight = asset.height || AVATAR_CROP_STAGE;
  const bounds = getAvatarCropBounds(asset, scale);

  const cropWidth = Math.min(
    sourceWidth,
    Math.max(1, Math.round(sourceWidth * (AVATAR_CROP_STAGE / bounds.width))),
  );
  const cropHeight = Math.min(
    sourceHeight,
    Math.max(1, Math.round(sourceHeight * (AVATAR_CROP_STAGE / bounds.height))),
  );
  const originX = clamp(
    Math.round(((bounds.width - AVATAR_CROP_STAGE) / 2 - offset.x) * (sourceWidth / bounds.width)),
    0,
    Math.max(0, sourceWidth - cropWidth),
  );
  const originY = clamp(
    Math.round(((bounds.height - AVATAR_CROP_STAGE) / 2 - offset.y) * (sourceHeight / bounds.height)),
    0,
    Math.max(0, sourceHeight - cropHeight),
  );

  const cropped = await ImageManipulator.manipulateAsync(
    asset.uri,
    [
      {
        crop: {
          originX,
          originY,
          width: cropWidth,
          height: cropHeight,
        },
      },
      {
        resize: {
          width: 1024,
          height: 1024,
        },
      },
    ],
    {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: cropped.uri,
    name: asset.fileName || `avatar-${Date.now()}.jpg`,
    type: 'image/jpeg',
  };
};

const getPickedAvatarSource = (asset: ImagePicker.ImagePickerAsset): AvatarUploadSource => {
  const extension = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const mimeType =
    asset.mimeType ||
    (extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg');

  return {
    uri: asset.uri,
    name: asset.fileName || `avatar-${Date.now()}.${extension === 'jpg' ? 'jpeg' : extension}`,
    type: mimeType,
  };
};


const FanSettings: React.FC<FanSettingsProps> = ({ onLogout, isDarkMode, onToggleTheme, onToggleRole }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [activeView, setActiveView] = useState<SubView>('main');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarCropModalOpen, setIsAvatarCropModalOpen] = useState(false);
  const [isAvatarFullscreenOpen, setIsAvatarFullscreenOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [shakeToRefreshEnabled, setShakeToRefreshEnabled] = useState(false);
  const [showCoinPacks, setShowCoinPacks] = useState(false);
  const [customCoinAmount, setCustomCoinAmount] = useState('');
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const giftsScrollRef = useRef<ScrollView>(null);

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [tokenTime, setTokenTime] = useState(30);
  const { mutateAsync: updateProfile, isPending: isSavingProfile } = useUpdateProfile();
  const { mutateAsync: uploadAvatar } = useUploadAvatar();
  const { mutateAsync: switchRole } = useSwitchRole();

  const [profile, setProfile] = useState(() => createProfileDraft(user));
  const [pendingAvatarAsset, setPendingAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [avatarCropScale, setAvatarCropScale] = useState(1);
  const [avatarCropOffset, setAvatarCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const avatarCropOffsetRef = useRef<CropOffset>({ x: 0, y: 0 });
  const avatarCropStartOffsetRef = useRef<CropOffset>({ x: 0, y: 0 });
  const avatarCropScaleRef = useRef(1);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = subscribeUser(setCurrentUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setProfile((prev) => ({
      name: currentUser.name?.trim() || prev.name,
      handle: (currentUser.handle?.trim() || prev.handle).replace(/^@/, ''),
      bio: typeof currentUser.bio === 'string' && currentUser.bio.trim() ? currentUser.bio : prev.bio,
      avatar: currentUser.avatar?.trim() || prev.avatar,
    }));
  }, [currentUser]);

  useEffect(() => {
    const loadShakePreference = async () => {
      const saved = await AsyncStorage.getItem(SHAKE_TO_REFRESH_STORAGE_KEY);
      setShakeToRefreshEnabled(saved === 'true');
    };

    void loadShakePreference();
  }, []);

  const toggleShakeToRefresh = async () => {
    const next = !shakeToRefreshEnabled;
    setShakeToRefreshEnabled(next);
    await AsyncStorage.setItem(SHAKE_TO_REFRESH_STORAGE_KEY, String(next));
  };

  const openCoinPacks = () => {
    setShowCoinPacks(true);
    setTimeout(() => {
      giftsScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const proceedToPaymentHub = (topUp: PendingTopUp) => {
    setPendingTopUp(topUp);
    setActiveView('payments');
  };

  const handleCoinPackPress = (pack: CoinPack) => {
    proceedToPaymentHub({
      label: `${pack.coins + pack.bonus} Coins`,
      coins: pack.coins,
      bonus: pack.bonus,
      price: pack.price,
    });
  };

  const handleCustomCoinTopUp = () => {
    const coins = Number.parseInt(customCoinAmount, 10);
    if (!Number.isFinite(coins) || coins <= 0) {
      Alert.alert('Enter coins', 'Add a valid number of coins to top up.');
      return;
    }

    proceedToPaymentHub({
      label: `${coins} Custom Coins`,
      coins,
      bonus: 0,
      price: Number((coins / 10).toFixed(2)),
    });
  };

  const creatorToggle = async()=>{
    try {
      await switchRole({ role: 'creator' });
      const nextUser = {
        id: user?.id || 'mila_ray_01',
        name: user?.name || 'Mila Ray',
        role: 'creator' as const,
        email: user?.email || '',
        handle: user?.handle || 'mila_ray_01',
      };
      setUser(nextUser);
      await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
      navigation.navigate('MainTabs', { screen: 'Galaxy' });
    } catch (caughtError) {
      const parsed = parseApiError(caughtError);
      Alert.alert(parsed.title, parsed.message);
    }
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
    avatarCropOffsetRef.current = avatarCropOffset;
  }, [avatarCropOffset]);

  useEffect(() => {
    avatarCropScaleRef.current = avatarCropScale;
  }, [avatarCropScale]);

  const resetAvatarCropState = () => {
    setPendingAvatarAsset(null);
    setAvatarCropScale(1);
    setAvatarCropOffset({ x: 0, y: 0 });
    avatarCropOffsetRef.current = { x: 0, y: 0 };
    avatarCropStartOffsetRef.current = { x: 0, y: 0 };
    avatarCropScaleRef.current = 1;
  };

  const persistUser = async (nextUser: User) => {
    setUser(nextUser);
    setCurrentUser(nextUser);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
  };

  const openAvatarModal = () => setIsAvatarModalOpen(true);

  const handleAvatarUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow access to your photo library so you can choose a new avatar.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Upload failed', 'We could not read the selected image. Please try again.');
        return;
      }

      setIsAvatarModalOpen(false);
      setPendingAvatarAsset(asset);
      setAvatarCropScale(1);
      setAvatarCropOffset({ x: 0, y: 0 });
      avatarCropOffsetRef.current = { x: 0, y: 0 };
      avatarCropStartOffsetRef.current = { x: 0, y: 0 };
      avatarCropScaleRef.current = 1;
      setIsAvatarCropModalOpen(true);
    } catch (error: any) {
      Alert.alert(
        'Avatar picker failed',
        error?.response?.data?.message || error?.message || 'Please try again.',
      );
    }
  };

  const handleAvatarCropSubmit = async () => {
    if (!pendingAvatarAsset) {
      setIsAvatarCropModalOpen(false);
      resetAvatarCropState();
      return;
    }

    try {
      setIsAvatarCropModalOpen(false);
      setIsAvatarUploading(true);
      const croppedAvatar = await createAvatarCropData(
        pendingAvatarAsset,
        avatarCropScaleRef.current,
        avatarCropOffsetRef.current,
      );
      const uploadResult = await uploadAvatar(croppedAvatar);
      const avatarUri = resolveAvatarUri(uploadResult) || croppedAvatar.uri;

      if (!avatarUri) {
        throw new Error('Avatar upload did not return a usable image URL.');
      }

      const nextProfile = { ...profile, avatar: avatarUri };
      setProfile(nextProfile);

      if (currentUser) {
        await persistUser({
          ...currentUser,
          avatar: avatarUri,
          bio: nextProfile.bio,
          name: nextProfile.name,
          handle: nextProfile.handle,
        });
      }

      resetAvatarCropState();
      setIsAvatarModalOpen(false);
    } catch (error: any) {
      Alert.alert(
        'Avatar upload failed',
        error?.response?.data?.message || error?.message || 'Please try again.',
      );
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const avatarCropResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!pendingAvatarAsset,
        onMoveShouldSetPanResponder: () => !!pendingAvatarAsset,
        onMoveShouldSetPanResponderCapture: () => !!pendingAvatarAsset,
        onPanResponderGrant: () => {
          avatarCropStartOffsetRef.current = avatarCropOffsetRef.current;
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!pendingAvatarAsset) return;

          const bounds = getAvatarCropBounds(pendingAvatarAsset, avatarCropScaleRef.current);
          const maxOffsetX = bounds.maxOffsetX;
          const maxOffsetY = bounds.maxOffsetY;

          const nextOffset = {
            x: clamp(avatarCropStartOffsetRef.current.x + gestureState.dx, -maxOffsetX, maxOffsetX),
            y: clamp(avatarCropStartOffsetRef.current.y + gestureState.dy, -maxOffsetY, maxOffsetY),
          };

          avatarCropOffsetRef.current = nextOffset;
          setAvatarCropOffset(nextOffset);
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [pendingAvatarAsset],
  );

  const zoomAvatarCrop = (delta: number) => {
    if (!pendingAvatarAsset) return;

    setAvatarCropScale((prev) => {
      const next = clamp(Number((prev + delta).toFixed(2)), AVATAR_CROP_MIN_SCALE, AVATAR_CROP_MAX_SCALE);
      avatarCropScaleRef.current = next;

      const bounds = getAvatarCropBounds(pendingAvatarAsset, next);
      const nextOffset = {
        x: clamp(avatarCropOffsetRef.current.x, -bounds.maxOffsetX, bounds.maxOffsetX),
        y: clamp(avatarCropOffsetRef.current.y, -bounds.maxOffsetY, bounds.maxOffsetY),
      };

      avatarCropOffsetRef.current = nextOffset;
      setAvatarCropOffset(nextOffset);

      return next;
    });
  };

  useEffect(() => {
    if (activeView !== 'identity') return;
    const interval = setInterval(() => {
      setTokenTime((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeView]);

  const handleSaveProfile = async () => {
    try {
      const username = profile.handle.trim().replace(/^@/, '');
      await updateProfile({
        name: profile.name.trim(),
        username,
        bio: profile.bio.trim(),
      });

      const nextUser = currentUser
        ? {
            ...currentUser,
            name: profile.name.trim() || currentUser.name,
            handle: username || currentUser.handle,
            bio: profile.bio.trim(),
          }
        : currentUser;

      if (nextUser) {
        await persistUser(nextUser);
      }

      setActiveView('main');
    } catch (error: any) {
      Alert.alert(
        'Profile update failed',
        error?.response?.data?.message || error?.message || 'Please try again.'
      );
    }
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
  const elevatedSurface = 'transparent';
  const subtleSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const secondaryText = isDark ? '#94a3b8' : theme.textSecondary;
  const mutedText = isDark ? '#6b7280' : theme.textMuted;
  const inputBackground = isDark ? '#0f172a' : '#ffffff';
  const chipSurface = isDark ? primaryColorAlpha(0.12) : '#f5f3ff';
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

  const renderHeader = (title: string, backToMain = true) => (
    <View style={[s.header, { backgroundColor: 'transparent' }]}>
      <Text style={[s.headerTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  const renderProfileView = () => (
    <KeyboardAvoidingView
      style={[s.viewWrap, { backgroundColor: theme.screen }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      {renderHeader('Profile')}
      <ScrollView
        contentContainerStyle={s.formCard}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileAvatarWrap}>
          <Pressable onPress={() => setIsAvatarFullscreenOpen(true)} style={s.avatarRing} disabled={isAvatarUploading}>
            <Image source={{ uri: profile.avatar }} style={s.avatarImage} />
            {isAvatarUploading ? (
              <View style={s.avatarUploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : null}
          </Pressable>
          <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                openAvatarModal();
              }}
              disabled={isAvatarUploading}
              style={[s.avatarEditDot, isAvatarUploading && s.avatarEditDotDisabled]}
            >
              {isAvatarUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="edit" size={14} color="#fff" />
              )}
            </Pressable>
        </View>

        <View style={s.formBlock}>
          <Text style={[s.label, { color: secondaryText }]}>Display Name</Text>
          <TextInput includeFontPadding={false}
            value={profile.name}
            onChangeText={(value) => setProfile({ ...profile, name: value })}
            style={[s.input, { borderColor: theme.border, backgroundColor: inputBackground, color: theme.text }]}
            placeholderTextColor={mutedText}
          />
        </View>

        <View style={s.formBlock}>
          <Text style={[s.label, { color: secondaryText }]}>Galaxy Handle</Text>
          <View style={[s.handleWrap, {borderColor: theme.border, backgroundColor: inputBackground, height: 52, justifyContent: 'center'}]}>
            <Text style={[s.handlePrefix, { color: PRIMARY_COLOR, fontSize: fontSize.b3.fontSize, lineHeight: fontSize.b3.lineHeight, justifyContent: 'center'}]}>@</Text>
            <TextInput includeFontPadding={false}
              value={profile.handle}
              onChangeText={(value) => setProfile({ ...profile, handle: value })}
              style={[s.input, s.handleInput, { color: theme.text, borderRadius: 0, borderWidth: 0, height: 40 }]}
              placeholderTextColor={mutedText}
            />
          </View>
        </View>

        <View style={s.formBlock}>
          <View style={s.rowBetween}>
            <Text style={[s.label, { color: secondaryText }]}>Bio</Text>
            <Text style={[s.counter, { color: secondaryText }]}>{profile.bio.length}/160</Text>
          </View>
          <TextInput includeFontPadding={false}
            value={profile.bio}
            onChangeText={(value) => setProfile({ ...profile, bio: value })}
            maxLength={160}
            multiline
            numberOfLines={4}
            style={[s.textArea, { borderColor: theme.border, backgroundColor: inputBackground, color: theme.text }]}
            placeholderTextColor={mutedText}
          />
        </View>

        <Pressable
          onPress={() => void handleSaveProfile()}
          disabled={isSavingProfile || isAvatarUploading}
          style={[
            s.primaryButton,
            { backgroundColor: theme.accent },
            (isSavingProfile || isAvatarUploading) && { opacity: 0.7 },
          ]}
        >
          <Text style={s.primaryButtonText}>
            {isSavingProfile ? 'Saving...' : isAvatarUploading ? 'Uploading Avatar...' : 'Update Profile'}
          </Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={isAvatarModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsAvatarModalOpen(false)}
      >
        <View style={s.avatarModalRoot}>
          <Pressable style={s.avatarModalBackdrop} onPress={() => setIsAvatarModalOpen(false)} />
          <View style={[s.avatarModalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={[s.avatarModalIcon, { backgroundColor: isDark ? '#ffffff14' : theme.accentSoft }]}>
              <MaterialIcons name="photo-library" size={28} color={theme.accent} />
            </View>
            <View style={s.avatarModalCopy}>
              <Text style={[s.avatarModalTitle, { color: theme.text }]}>Update Avatar</Text>
              <Text style={[s.avatarModalBody, { color: theme.textSecondary }]}>
                Choose a new image from your device, upload it, and we&apos;ll update your profile once the server confirms it.
              </Text>
            </View>
            <View style={s.avatarModalActions}>
              <Pressable
                onPress={() => void handleAvatarUpload()}
                disabled={isAvatarUploading}
                style={[s.avatarModalPrimary, isAvatarUploading && { opacity: 0.7 }]}
              >
                <Text style={s.avatarModalPrimaryText}>Choose Image</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsAvatarModalOpen(false)}
                style={[s.avatarModalSecondary, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={[s.avatarModalSecondaryText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAvatarCropModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setIsAvatarCropModalOpen(false);
          resetAvatarCropState();
        }}
      >
        <View style={[s.avatarCropRoot, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            style={s.avatarCropBackdrop}
            onPress={() => {
              setIsAvatarCropModalOpen(false);
              resetAvatarCropState();
            }}
          />

          <View style={[s.avatarCropCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={s.avatarCropHeader}>
              <Pressable
                onPress={() => {
                  setIsAvatarCropModalOpen(false);
                  resetAvatarCropState();
                }}
                style={[s.avatarCropHeaderButton, { backgroundColor: isDark ? '#ffffff14' : theme.surface }]}
              >
                <MaterialIcons name="close" size={18} color={theme.text} />
              </Pressable>
              <View style={s.avatarCropTitleWrap}>
                <Text style={[s.avatarCropTitle, { color: theme.text }]}>Crop Avatar</Text>
                <Text style={[s.avatarCropSubtitle, { color: theme.textSecondary }]}>
                  Drag and zoom until the frame feels right.
                </Text>
              </View>
              <Pressable
                onPress={() => void handleAvatarCropSubmit()}
                disabled={isAvatarUploading || !pendingAvatarAsset}
                style={[s.avatarCropHeaderButton, { backgroundColor: theme.accent }, (isAvatarUploading || !pendingAvatarAsset) && { opacity: 0.7 }]}
              >
                {isAvatarUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.avatarCropHeaderButtonText}>Done</Text>
                )}
              </Pressable>
            </View>

            <View style={s.avatarCropStageShell}>
              <View
                {...avatarCropResponder.panHandlers}
                style={[s.avatarCropStage, { width: AVATAR_CROP_STAGE, height: AVATAR_CROP_STAGE }]}
              >
                {pendingAvatarAsset ? (
                  <>
                    <Animated.Image
                      source={{ uri: pendingAvatarAsset.uri }}
                      style={[
                        s.avatarCropImage,
                        (() => {
                          const bounds = getAvatarCropBounds(pendingAvatarAsset, avatarCropScale);
                          return {
                            width: bounds.width,
                            height: bounds.height,
                            transform: [
                              { translateX: -bounds.width / 2 + avatarCropOffset.x },
                              { translateY: -bounds.height / 2 + avatarCropOffset.y },
                            ],
                          };
                        })(),
                      ]}
                      resizeMode="cover"
                    />
                    <View pointerEvents="none" style={s.avatarCropGrid}>
                      <View style={[s.avatarCropGridRow, { top: '33.333%' }]} />
                      <View style={[s.avatarCropGridRow, { top: '66.666%' }]} />
                      <View style={[s.avatarCropGridCol, { left: '33.333%' }]} />
                      <View style={[s.avatarCropGridCol, { left: '66.666%' }]} />
                    </View>
                    <View pointerEvents="none" style={s.avatarCropFrame} />
                  </>
                ) : null}
              </View>
            </View>

            <View style={s.avatarCropControls}>
              <Pressable
                onPress={() => zoomAvatarCrop(-0.15)}
                disabled={!pendingAvatarAsset || isAvatarUploading}
                style={[s.avatarCropControl, { borderColor: theme.border, backgroundColor: isDark ? '#ffffff10' : theme.surface }, (!pendingAvatarAsset || isAvatarUploading) && { opacity: 0.5 }]}
              >
                <MaterialIcons name="remove" size={20} color={theme.text} />
              </Pressable>
              <View style={s.avatarCropScaleInfo}>
                <Text style={[s.avatarCropScaleText, { color: theme.text }]}>
                  {Math.round(avatarCropScale * 100)}%
                </Text>
                <Text style={[s.avatarCropScaleHint, { color: theme.textSecondary }]}>Zoom</Text>
              </View>
              <Pressable
                onPress={() => zoomAvatarCrop(0.15)}
                disabled={!pendingAvatarAsset || isAvatarUploading}
                style={[s.avatarCropControl, { borderColor: theme.border, backgroundColor: isDark ? '#ffffff10' : theme.surface }, (!pendingAvatarAsset || isAvatarUploading) && { opacity: 0.5 }]}
              >
                <MaterialIcons name="add" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAvatarFullscreenOpen}
        transparent
        animationType="fade"
        // statusBarTranslucent
        onRequestClose={() => setIsAvatarFullscreenOpen(false)}
      >
        <View style={s.avatarFullscreenRoot}>
          <Pressable
            style={s.avatarFullscreenBackdrop}
            onPress={() => setIsAvatarFullscreenOpen(false)}
          />
          <View style={s.avatarFullscreenChrome}>
            <Pressable
              onPress={() => setIsAvatarFullscreenOpen(false)}
              style={[s.avatarFullscreenClose, {}]}
            >
              <MaterialIcons name="close" size={22} color="#fff" />
            </Pressable>
          </View>
          <Image source={{ uri: profile.avatar }} style={s.avatarFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
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
        {pendingTopUp ? (
          <View style={[s.pendingTopUpCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
            <View style={s.pendingTopUpIcon}>
              <MaterialIcons name="toll" size={22} color={theme.accent} />
            </View>
            <View style={s.pendingTopUpText}>
              <Text style={[s.pendingTopUpLabel, { color: secondaryText }]}>Pending Top Up</Text>
              <Text style={[s.pendingTopUpTitle, { color: theme.text }]}>{pendingTopUp.label}</Text>
              <Text style={[s.pendingTopUpMeta, { color: secondaryText }]}>
                {pendingTopUp.bonus > 0 ? `${pendingTopUp.coins} + ${pendingTopUp.bonus} bonus coins` : `${pendingTopUp.coins} coins`}
              </Text>
            </View>
            <View style={s.pendingTopUpAmount}>
              <Text style={[s.pendingTopUpPrice, { color: theme.accent }]}>{pendingTopUp.price} GHS</Text>
              <Pressable onPress={() => setActiveView('gifts')}>
                <Text style={[s.pendingTopUpChange, { color: secondaryText }]}>Change</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

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
      <ScrollView ref={giftsScrollRef} contentContainerStyle={s.paymentsContent} showsVerticalScrollIndicator={false}>
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
              <Pressable onPress={openCoinPacks} style={[s.walletPrimaryButton, { backgroundColor: theme.accent }]}>
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

        {showCoinPacks ? (
          <View style={s.sectionBlock}>
            <View style={s.rowBetween}>
              <Text style={[s.sectionTitle, { color: secondaryText }]}>Coin Packs</Text>
              <Text style={[s.moreItemsMeta, { color: mutedText }]}>Choose Amount</Text>
            </View>

            <View style={s.coinPackGrid}>
              {COIN_PACKS.map((pack) => (
                <Pressable
                  key={pack.id}
                  onPress={() => handleCoinPackPress(pack)}
                  style={[
                    s.coinPackCard,
                    {
                      backgroundColor: elevatedSurface,
                      borderColor: pack.popular ? theme.accent : theme.border,
                    },
                  ]}
                >
                  {pack.popular ? (
                    <View style={[s.coinPackBadge, { backgroundColor: theme.accent }]}>
                      <Text style={s.coinPackBadgeText}>Popular</Text>
                    </View>
                  ) : null}
                  <MaterialIcons name="toll" size={24} color={theme.accent} />
                  <Text style={[s.coinPackCoins, { color: theme.text }]}>{pack.coins}</Text>
                  {pack.bonus > 0 ? (
                    <Text style={s.coinPackBonus}>+{pack.bonus} Bonus</Text>
                  ) : (
                    <Text style={[s.coinPackBonus, { color: mutedText }]}>No Bonus</Text>
                  )}
                  <Text style={[s.coinPackPrice, { color: theme.accent }]}>{pack.price} GHS</Text>
                </Pressable>
              ))}
            </View>

            <View style={[s.customCoinCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
              <View style={s.customCoinCopy}>
                <Text style={[s.giftTitle, { color: theme.text }]}>Custom Amount</Text>
                <Text style={[s.giftDesc, { color: secondaryText }]}>Enter the exact number of coins you want.</Text>
              </View>
              <View style={s.customCoinRow}>
                <TextInput includeFontPadding={false}
                  value={customCoinAmount}
                  onChangeText={(value) => setCustomCoinAmount(value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="Coins"
                  placeholderTextColor={mutedText}
                  style={[s.customCoinInput, { color: theme.text, backgroundColor: inputBackground, borderColor: theme.border }]}
                />
                <Pressable onPress={handleCustomCoinTopUp} style={[s.customCoinButton, { backgroundColor: theme.accent }]}>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

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
        {
          label: 'Shake to Refresh Feed',
          icon: 'vibration',
          desc: 'Shake your phone on Feed to reload orbit',
          isToggle: true,
          enabled: shakeToRefreshEnabled,
          onToggle: () => void toggleShakeToRefresh(),
        },
        { label: 'Switch to Creator', icon: FireIcon, desc: 'Unlock creator tools', onClick: () => setIsRoleSwitchModalOpen(true) },
      ],
    },
    {
      title: 'Digital ID',
      items: [
        { label: 'Profile', icon: AccountIcon, desc: 'Avatar, name, and story', id: 'profile' },
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
            </View>
            {/* <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                openAvatarModal();
              }}
              disabled={isAvatarUploading}
              style={[s.avatarEditDot, isAvatarUploading && s.avatarEditDotDisabled]}
            >
              {isAvatarUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="edit" size={14} color="#fff" />
              )}
            </Pressable> */}
          </View>
          <View style={s.profileTextWrap}>
            <View style={s.profileNameRow}>
              <Text style={[s.profileName, { color: theme.text }]}>{profile.name}</Text>
              <VerifiedIcon width={16} height={16} fill={theme.accent} />
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
                  <View style={{
                    gap: 4,
                  }}>
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
            <Text style={s.logoutText}>Logout</Text>
          </Pressable>
          <Text style={[s.versionText, { color: secondaryText }]}>Kulsah Ecosystem v2.4.2</Text>
        </View>
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
          <View style={[s.roleModalCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <CreatorSwitch height={88} width={88} color={theme.accent} />
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
  headerTitle: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', color: '#0f172a', letterSpacing: 2 },
  viewWrap: { flex: 1, backgroundColor: '#f8fafc' },
  formCard: { padding: 16, gap: 18, alignItems: 'center' },
  profileAvatarWrap: { alignItems: 'center', marginBottom: 12, },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 0,
    borderColor: PRIMARY_COLOR,
    padding: 4,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 999 },
  avatarUploadingOverlay: {
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
  avatarEditDotDisabled: {
    opacity: 0.75,
  },
  avatarFullscreenRoot: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFullscreenBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  avatarFullscreenChrome: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    right: 18,
    left: 18,
    zIndex: 2,
    alignItems: 'flex-end',
  },
  avatarFullscreenClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  avatarFullscreenImage: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  formBlock: { gap: 8, width: '100%'},
  label: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  input: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    backgroundColor: 'fff',
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    fontFamily: 'Inter_500Medium',
    color: '#0f172a',
  },
  handleWrap: { position: 'relative', justifyContent: 'center', borderRadius: 18,
    borderWidth: 1, },
  handlePrefix: {
    position: 'absolute',
    left: 16,
    color: PRIMARY_COLOR,
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    fontFamily: 'Inter_500Medium',
  },
  handleInput: {
    paddingLeft: 34,
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    fontFamily: 'Inter_500Medium',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8' },
  textArea: {
    minHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#334155',
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    fontFamily: 'Inter_500Medium',
  },
  primaryButton: {
    marginTop: 6,
    height: 56,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  primaryButtonText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase', letterSpacing: 2,  },
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
  cardTag: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 3, color: PRIMARY_COLOR },
  cardName: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, color: '#0f172a', textTransform: 'uppercase' },
  cardSub: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8', textTransform: 'uppercase' },
  cardTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, color: '#0f172a', textTransform: 'uppercase' },
  cardLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 3, color: PRIMARY_COLOR, textTransform: 'uppercase' },
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
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  smallLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 },
  monoText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#64748b' },
  iconRow: { flexDirection: 'row', gap: 8 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketValue: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, color: '#0f172a' },
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
  tokenText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#7c3aed' },
  tokenTextAlt: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#16a34a' },
  tokenHint: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8', textAlign: 'center' },
  progressBarWrap: { gap: 8 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: '#e2e8f0' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', color: '#94a3b8' },
  progressTextActive: { color: PRIMARY_COLOR },
  sectionBlock: { gap: 10 },
  sectionTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  sectionBadge: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', color: PRIMARY_COLOR },
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
  railTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#0f172a' },
  railMeta: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8', textTransform: 'uppercase' },
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
  statusText: { ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, color: '#0f172a', fontFamily: 'Poppins_500Medium' },
  statusBadge: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    color: '#0f172a',
    marginTop: 4,
  },
  walletUnit: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
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
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
  coinPackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  coinPackCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coinPackBadge: {
    position: 'absolute',
    top: -9,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coinPackBadgeText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coinPackCoins: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
  },
  coinPackBonus: {
    color: '#22c55e',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coinPackPrice: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  customCoinCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  customCoinCopy: {
    gap: 4,
  },
  customCoinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customCoinInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  customCoinButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTopUpCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingTopUpIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: primaryColorAlpha(0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTopUpText: {
    flex: 1,
  },
  pendingTopUpLabel: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pendingTopUpTitle: {
    marginTop: 2,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  pendingTopUpMeta: {
    marginTop: 2,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  pendingTopUpAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pendingTopUpPrice: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  pendingTopUpChange: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moreItemsMeta: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.tabTextLarge, lineHeight: fontSize.b4.lineHeight, fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
  },
  giftDesc: {
    marginTop: 2,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  giftRight: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  giftCount: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
  },
  giftMeta: {
    marginTop: 2,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  marketplaceDesc: {
    ...fontSize.b5,
    textAlign: 'center',
    lineHeight: fontSize.b3.lineHeight,
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
  methodTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, color: '#0f172a' },
  methodMeta: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, color: '#94a3b8', textTransform: 'uppercase' },
  methodBadge: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
  emptyText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8' },
  mainContent: { padding: 16, paddingBottom: 120, gap: 18 },
  profileHeader: { alignItems: 'center', gap: 12 },
  profileTextWrap: { alignItems: 'center' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  profileName: {
    ...fontSize.b0Variant,
    lineHeight: fontSize.b0Variant.lineHeight - 2,
    color: '#0f172a',
    fontFamily: 'Inter_500Medium',
  },
  profileHandle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.5, color: PRIMARY_COLOR },
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
  itemLabel: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight, color: '#0f172a' },
  itemDesc: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight+ 2, color: '#94a3b8' },
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
  logoutText: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight + 1,
    color: '#ef4444',
    fontFamily: 'Poppins_500Medium',
  },
  versionText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 1.5,
    fontWeight: '900',
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
    lineHeight: fontSize.b1.lineHeight,
  },
  roleModalBody: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  roleModalActions: {
    width: '100%',
    gap: 12,
    marginTop: 28,
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
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
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
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  avatarModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  avatarModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 40,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  avatarModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarModalCopy: {
    alignItems: 'center',
    gap: 8,
  },
  avatarModalTitle: {
    ...fontSize.b1,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: fontSize.b1.lineHeight,
  },
  avatarModalBody: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  avatarModalActions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  avatarModalPrimary: {
    width: '100%',
    minHeight: 60,
    borderRadius: 22,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalPrimaryText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  avatarModalSecondary: {
    width: '100%',
    minHeight: 60,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalSecondaryText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  avatarCropRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  avatarCropBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  avatarCropCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 34,
    borderWidth: 1,
    padding: 18,
    gap: 18,
  },
  avatarCropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  avatarCropHeaderButton: {
    minWidth: 50,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  avatarCropHeaderButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  avatarCropTitleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  avatarCropTitle: {
    ...fontSize.b2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  avatarCropSubtitle: {
    ...fontSize.b5,
    textAlign: 'center',
    lineHeight: fontSize.b5.lineHeight,
  },
  avatarCropStageShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCropStage: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCropImage: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  avatarCropGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarCropGridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  avatarCropGridCol: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  avatarCropFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  avatarCropControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarCropControl: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCropScaleInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  avatarCropScaleText: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  avatarCropScaleHint: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default FanSettings;
