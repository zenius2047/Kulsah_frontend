import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from '../typography';
import { challengesApi } from '../src/api/challenges.api';
import { useAuth } from '../src/context/AuthContext';
import { useDiscovery } from '../src/hooks/queries/useDiscovery';
import { uploadCreatorVideoDirect } from '../src/services/creatorVideoDirectUpload.service';
import { buildChallengeCreatePayload, combineChallengeDateAndTime } from '../src/utils/challenges';
import { getApiErrorMessage } from '../src/utils/apiError';
import type { ChallengeMode, ChallengeStatus } from '../src/types/challenge.types';
import type { DiscoveryCreator } from '../src/types/discovery.types';

type WizardStep = 1 | 2 | 3 | 4;
type DatePickerField =
  | 'startDate'
  | 'startTime'
  | 'endDate'
  | 'endTime'
  | 'votingStartDate'
  | 'votingStartTime'
  | 'votingEndDate'
  | 'votingEndTime';
type ChoicePicker = { heading: string; options: string[]; onSelect: (value: string) => void };
type ChallengeVideo = { uri: string; name: string; type: string; size?: number; durationMs?: number | null };
type ChallengeCover = { uri: string; name: string; type: string; size?: number };
type VideoFrameOption = { uri: string; timeMs: number };
type BattleCreator = Pick<DiscoveryCreator, 'id' | 'name' | 'handle' | 'avatar_url' | 'is_verified' | 'followers_count'>;

type StoredChallenge = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  status: ChallengeStatus;
  image: string;
  category: string;
  hashtag: string;
  videos: ChallengeVideo[];
  wizard: Record<string, unknown>;
};

const DRAFTS_KEY = 'pulsar_challenge_drafts';
const ACTIVE_KEY = 'pulsar_challenges';
const USER_KEY = 'pulsar_user';
const MAX_CHALLENGE_VIDEOS = 1;
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85';
const CATEGORIES = ['Dance', 'Comedy', 'Travel', 'Food', 'Fitness', 'Music'];
const CHALLENGE_MODES: Array<{
  mode: ChallengeMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}> = [
  { mode: 'open', title: 'Open challenge', description: 'Anyone can discover and enter.', icon: 'public' },
  { mode: 'invite_only', title: 'Invite only', description: 'Only invited people can enter.', icon: 'lock' },
  { mode: 'creator_battle', title: 'Creator battle', description: 'Compete head-to-head with up to 3 creators.', icon: 'sports-kabaddi' },
];
const STEP_COPY: Record<WizardStep, { label: string; subtitle: string }> = {
  1: { label: 'Basics', subtitle: 'Set up a new creator challenge' },
  2: { label: 'Rules', subtitle: 'Add rules and submission requirements' },
  3: { label: 'Rewards', subtitle: 'Set rewards and challenge settings' },
  4: { label: 'Preview', subtitle: 'Preview and publish your challenge' },
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(date);

const formatShortDate = (date: Date) => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
}).format(date);

const formatTime = (date: Date) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
}).format(date);

const formatVideoDuration = (durationMs?: number | null) => {
  if (!durationMs || durationMs <= 0) return 'Video';
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

const formatFrameTime = (timeMs: number) => {
  const totalSeconds = Math.max(0, Math.round(timeMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

const formatFollowerCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
  return String(count);
};

const creatorFromStoredValue = (value: unknown): BattleCreator | null => {
  if (!value || typeof value !== 'object') return null;
  const creator = value as Record<string, unknown>;
  const id = Number(creator.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return {
    id,
    name: typeof creator.name === 'string' && creator.name.trim() ? creator.name : `Creator ${id}`,
    handle: typeof creator.handle === 'string' && creator.handle.trim() ? creator.handle : `creator_${id}`,
    avatar_url: typeof creator.avatar_url === 'string' ? creator.avatar_url : null,
    is_verified: creator.is_verified === true,
    followers_count: typeof creator.followers_count === 'number' ? creator.followers_count : 0,
  };
};

const CreateChallengeWizard: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const routeDraft = route.params?.draft as StoredChallenge | undefined;
  const { isDark, theme } = useThemeMode();
  const [step, setStep] = useState<WizardStep>(1);
  const [coverUri, setCoverUri] = useState('');
  const [coverSource, setCoverSource] = useState<'video' | 'library' | null>(null);
  const [coverFrameTimeMs, setCoverFrameTimeMs] = useState<number | null>(null);
  const [coverAsset, setCoverAsset] = useState<ChallengeCover | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Dance');
  const [description, setDescription] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [videoLength, setVideoLength] = useState('15s - 60s');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [allowedFormat, setAllowedFormat] = useState('MP4 / MOV');
  const [officialSound, setOfficialSound] = useState('No official sound');
  const [challengeVideos, setChallengeVideos] = useState<ChallengeVideo[]>([]);
  const [videoFrameOptions, setVideoFrameOptions] = useState<VideoFrameOption[]>([]);
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [primaryPrize, setPrimaryPrize] = useState('500');
  const [winnerCount, setWinnerCount] = useState(3);
  const [secondaryReward, setSecondaryReward] = useState('');
  const [startDate, setStartDate] = useState(() => addDays(new Date(), 1));
  const [endDate, setEndDate] = useState(() => addDays(new Date(), 31));
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 0, 0);
    return date;
  });
  const [votingStartDate, setVotingStartDate] = useState(() => addDays(new Date(), 1));
  const [votingEndDate, setVotingEndDate] = useState(() => addDays(new Date(), 31));
  const [votingStartTime, setVotingStartTime] = useState(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  });
  const [votingEndTime, setVotingEndTime] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 0, 0);
    return date;
  });
  const [openToEveryone, setOpenToEveryone] = useState(true);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>('open');
  const [battleCreators, setBattleCreators] = useState<BattleCreator[]>([]);
  const [battleCreatorPickerVisible, setBattleCreatorPickerVisible] = useState(false);
  const [battleCreatorSearch, setBattleCreatorSearch] = useState('');
  const [battleCreatorSearchQuery, setBattleCreatorSearchQuery] = useState('');
  const [limitEntries, setLimitEntries] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [judgeByVotes, setJudgeByVotes] = useState(false);
  const [judgeByReactions, setJudgeByReactions] = useState(true);
  const [datePickerField, setDatePickerField] = useState<DatePickerField | null>(null);
  const [pendingPickerValue, setPendingPickerValue] = useState<Date | null>(null);
  const [choicePicker, setChoicePicker] = useState<ChoicePicker | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState('');
  const [toast, setToast] = useState('');
  const [draftId] = useState(() => `challenge_${Date.now()}`);
  const [backendDraftId, setBackendDraftId] = useState<string | number | null>(null);

  const pageBackground = isDark ? '#0b1118' : '#f7f9fb';
  const cardBackground = isDark ? '#121b25' : '#ffffff';
  const inputBackground = isDark ? '#0f1720' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#151b27';
  const secondaryText = isDark ? '#a7b0bd' : '#69717f';
  const mutedText = isDark ? '#778190' : '#9aa1ad';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e1e5ea';
  const softPrimary = isDark ? primaryColorAlpha(0.14) : primaryColorAlpha(0.09);
  const selectedChallengeVideo = challengeVideos[0];
  const battleDiscovery = useDiscovery({
    tab: 'creators',
    limit: 24,
    ...(battleCreatorSearchQuery ? { search_query: battleCreatorSearchQuery } : {}),
  }, { enabled: battleCreatorPickerVisible });
  const discoveredBattleCreators = battleDiscovery.data?.data.creators ?? [];

  useEffect(() => {
    if (!routeDraft) return;
    const wizard = routeDraft.wizard ?? {};
    const stringValue = (key: string, fallback = '') => typeof wizard[key] === 'string' ? String(wizard[key]) : fallback;
    const booleanValue = (key: string, fallback: boolean) => typeof wizard[key] === 'boolean' ? Boolean(wizard[key]) : fallback;
    const dateValue = (key: string, fallback: Date) => {
      const value = new Date(String(wizard[key] ?? ''));
      return Number.isNaN(value.getTime()) ? fallback : value;
    };

    setCoverUri(stringValue('coverUri', routeDraft.image || ''));
    setCoverSource(wizard.coverSource === 'video' || wizard.coverSource === 'library' ? wizard.coverSource : null);
    setCoverFrameTimeMs(typeof wizard.coverFrameTimeMs === 'number' ? wizard.coverFrameTimeMs : null);
    setCoverAsset(wizard.coverAsset && typeof wizard.coverAsset === 'object' ? wizard.coverAsset as ChallengeCover : null);
    setTitle(stringValue('title', routeDraft.title || ''));
    setCategory(stringValue('category', routeDraft.category || 'Dance'));
    setDescription(stringValue('description', routeDraft.description || ''));
    setHashtag(stringValue('hashtag', routeDraft.hashtag || ''));
    setVideoLength(stringValue('videoLength', '15s - 60s'));
    setAspectRatio(stringValue('aspectRatio', '9:16'));
    setAllowedFormat(stringValue('allowedFormat', 'MP4 / MOV'));
    setOfficialSound(stringValue('officialSound', 'No official sound'));
    setChallengeVideos(Array.isArray(wizard.challengeVideos) ? wizard.challengeVideos as ChallengeVideo[] : routeDraft.videos || []);
    setInstructions(stringValue('instructions'));
    setPrimaryPrize(stringValue('primaryPrize', '500'));
    setWinnerCount(typeof wizard.winnerCount === 'number' ? wizard.winnerCount : 3);
    setSecondaryReward(stringValue('secondaryReward'));
    const restoredStartDate = dateValue('startDate', startDate);
    const restoredStartTime = dateValue('startTime', startTime);
    const restoredEndDate = dateValue('endDate', endDate);
    const restoredEndTime = dateValue('endTime', endTime);
    setStartDate(restoredStartDate);
    setStartTime(restoredStartTime);
    setEndDate(restoredEndDate);
    setEndTime(restoredEndTime);
    setVotingStartDate(dateValue('votingStartDate', restoredStartDate));
    setVotingStartTime(dateValue('votingStartTime', restoredStartTime));
    setVotingEndDate(dateValue('votingEndDate', restoredEndDate));
    setVotingEndTime(dateValue('votingEndTime', restoredEndTime));
    setOpenToEveryone(booleanValue('openToEveryone', true));
    setInviteOnly(booleanValue('inviteOnly', false));
    const restoredMode = stringValue('challengeMode');
    const normalizedRestoredMode: ChallengeMode = restoredMode === 'invite_only' || restoredMode === 'creator_battle'
      ? restoredMode
      : booleanValue('inviteOnly', false) ? 'invite_only' : 'open';
    setChallengeMode(normalizedRestoredMode);
    if (normalizedRestoredMode === 'creator_battle') setWinnerCount(1);
    const storedBattleCreators = Array.isArray(wizard.battleCreators)
      ? wizard.battleCreators.map(creatorFromStoredValue).filter((creator): creator is BattleCreator => Boolean(creator))
      : [];
    const storedBattleIds = Array.isArray(wizard.battleParticipantIds)
      ? wizard.battleParticipantIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      : stringValue('battleCreatorIds')
          .split(/[\s,]+/)
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0);
    setBattleCreators(storedBattleCreators.length
      ? storedBattleCreators.slice(0, 3)
      : Array.from(new Set(storedBattleIds)).slice(0, 3).map((id) => creatorFromStoredValue({ id }) as BattleCreator));
    setLimitEntries(booleanValue('limitEntries', true));
    setShowLeaderboard(booleanValue('showLeaderboard', true));
    const restoredJudgeByVotes = booleanValue('judgeByVotes', false);
    setJudgeByVotes(restoredJudgeByVotes);
    setJudgeByReactions(!restoredJudgeByVotes);
    setStep(typeof wizard.step === 'number' && wizard.step >= 1 && wizard.step <= 4 ? wizard.step as WizardStep : 1);
    if (/^\d+$/.test(routeDraft.id)) setBackendDraftId(routeDraft.id);
  }, [routeDraft?.id]);

  useEffect(() => {
    if (!battleCreatorPickerVisible) {
      setBattleCreatorSearchQuery('');
      return undefined;
    }
    const timer = setTimeout(() => setBattleCreatorSearchQuery(battleCreatorSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [battleCreatorPickerVisible, battleCreatorSearch]);

  useEffect(() => {
    if (!discoveredBattleCreators.length || !battleCreators.length) return;
    setBattleCreators((current) => {
      let changed = false;
      const hydrated = current.map((creator) => {
        const discovered = discoveredBattleCreators.find((item) => item.id === creator.id);
        if (!discovered || (
          creator.name === discovered.name
          && creator.handle === discovered.handle
          && creator.avatar_url === discovered.avatar_url
          && creator.is_verified === discovered.is_verified
          && creator.followers_count === discovered.followers_count
        )) return creator;
        changed = true;
        return discovered;
      });
      return changed ? hydrated : current;
    });
  }, [discoveredBattleCreators, battleCreators.length]);

  useEffect(() => {
    if (!selectedChallengeVideo) {
      setVideoFrameOptions([]);
      setIsGeneratingFrames(false);
      return undefined;
    }

    let isActive = true;
    const duration = selectedChallengeVideo.durationMs || 0;
    const frameTimes = duration > 0
      ? [0.08, 0.32, 0.58, 0.84].map((position) => Math.max(0, Math.min(duration - 1, Math.round(duration * position))))
      : [0, 500, 1000, 1500];

    setIsGeneratingFrames(true);
    void Promise.all(frameTimes.map(async (timeMs) => {
      try {
        const frame = await VideoThumbnails.getThumbnailAsync(selectedChallengeVideo.uri, { time: timeMs, quality: 0.8 });
        return { uri: frame.uri, timeMs };
      } catch {
        return null;
      }
    })).then((frames) => {
      if (!isActive) return;
      setVideoFrameOptions(frames.filter((frame): frame is VideoFrameOption => Boolean(frame)));
      setIsGeneratingFrames(false);
    });

    return () => {
      isActive = false;
    };
  }, [selectedChallengeVideo]);

  const normalizedHashtag = useMemo(() => {
    const value = hashtag.trim();
    if (!value) return '';
    return value.startsWith('#') ? value : `#${value}`;
  }, [hashtag]);
  const battleParticipantIds = useMemo(() => battleCreators.map((creator) => creator.id), [battleCreators]);
  const battleParticipantCount = battleCreators.length + 1;
  const challengeModeLabel = challengeMode === 'creator_battle'
    ? 'Creator battle'
    : challengeMode === 'invite_only'
      ? 'Invite only'
      : 'Open challenge';

  const rewardLabel = primaryPrize.trim()
    ? `$${primaryPrize.trim()} Cash Prize`
    : secondaryReward.trim() || 'Recognition prize';
  const dateRange = `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
  const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
  const judgingLabel = [judgeByVotes ? 'Vote' : '', judgeByReactions ? 'Reactions' : ''].filter(Boolean).join(' & ') || 'Creator review';
  const votingDateRange = `${formatShortDate(votingStartDate)} – ${formatShortDate(votingEndDate)}`;

  const handleJudgeByVotesChange = (value: boolean) => {
    setJudgeByVotes(value);
    setJudgeByReactions(!value);

    if (value) {
      setVotingStartDate(new Date(startDate));
      setVotingStartTime(new Date(startTime));
      setVotingEndDate(new Date(endDate));
      setVotingEndTime(new Date(endTime));
    }
  };

  const handleJudgeByReactionsChange = (value: boolean) => {
    setJudgeByReactions(value);
    setJudgeByVotes(!value);

    if (!value) {
      setVotingStartDate(new Date(startDate));
      setVotingStartTime(new Date(startTime));
      setVotingEndDate(new Date(endDate));
      setVotingEndTime(new Date(endTime));
    }
  };

  const selectChallengeMode = (nextMode: ChallengeMode) => {
    setChallengeMode(nextMode);
    setOpenToEveryone(nextMode === 'open');
    setInviteOnly(nextMode === 'invite_only');
    if (nextMode === 'creator_battle') {
      setLimitEntries(true);
      setWinnerCount(1);
      setVotingStartDate(new Date(endDate));
      setVotingStartTime(new Date(endTime));
      setVotingEndDate(addDays(endDate, 7));
      setVotingEndTime(new Date(endTime));
    }
  };

  const openBattleCreatorPicker = () => {
    setBattleCreatorSearch('');
    setBattleCreatorPickerVisible(true);
  };

  const toggleBattleCreator = (creator: DiscoveryCreator) => {
    if (Number(user?.id) === creator.id) {
      Alert.alert('You are already in the battle', 'Choose another creator for your lineup.');
      return;
    }
    setBattleCreators((current) => {
      if (current.some((item) => item.id === creator.id)) {
        return current.filter((item) => item.id !== creator.id);
      }
      if (current.length >= 3) {
        Alert.alert('Lineup is full', 'A creator battle can include you and up to 3 invited creators.');
        return current;
      }
      return [...current, creator];
    });
  };

  const removeBattleCreator = (creatorId: number) => {
    setBattleCreators((current) => current.filter((creator) => creator.id !== creatorId));
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  };

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow access to your library to add a challenge cover.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (!result.canceled && Array.isArray(result.assets) && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setCoverUri(asset.uri);
      setCoverSource('library');
      setCoverFrameTimeMs(null);
      setCoverAsset({
        uri: asset.uri,
        name: asset.fileName || 'challenge-cover.jpg',
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
    }
  };

  const pickChallengeVideos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Video access required', 'Allow access to your library to add challenge videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled || !Array.isArray(result.assets)) return;

    const selectedVideos: ChallengeVideo[] = result.assets.slice(0, MAX_CHALLENGE_VIDEOS).map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `Challenge video ${index + 1}`,
      type: asset.mimeType || 'video/mp4',
      size: asset.fileSize,
      durationMs: asset.duration,
    }));
    if (coverSource === 'video') {
      setCoverUri('');
      setCoverSource(null);
      setCoverFrameTimeMs(null);
      setCoverAsset(null);
    }
    setChallengeVideos(selectedVideos);
  };

  const removeChallengeVideo = () => {
    setChallengeVideos([]);
    setVideoFrameOptions([]);
    if (coverSource === 'video') {
      setCoverUri('');
      setCoverSource(null);
      setCoverFrameTimeMs(null);
      setCoverAsset(null);
    }
  };

  const selectVideoFrame = (frame: VideoFrameOption) => {
    setCoverUri(frame.uri);
    setCoverSource('video');
    setCoverFrameTimeMs(frame.timeMs);
    setCoverAsset(null);
  };

  const chooseOption = (
    heading: string,
    options: string[],
    onSelect: (value: string) => void,
  ) => {
    setChoicePicker({ heading, options, onSelect });
  };

  const buildStoredChallenge = async (
    status: StoredChallenge['status'],
    persistedId?: string | number,
  ): Promise<StoredChallenge> => {
    let creator: { id?: string | number; name?: string; handle?: string } = {};
    try {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) creator = JSON.parse(storedUser);
    } catch {
      creator = {};
    }

    return {
      id: persistedId != null ? String(persistedId) : status === 'active' ? `c_${Date.now()}` : draftId,
      creatorId: String(creator.id || creator.handle || 'creator'),
      creatorName: creator.name || 'Kulsah Creator',
      title: title.trim() || 'Untitled Challenge',
      description: description.trim(),
      reward: rewardLabel,
      deadline: `${durationDays} Days`,
      participants: 0,
      status,
      image: coverUri || DEFAULT_COVER,
      category,
      hashtag: normalizedHashtag,
      videos: challengeVideos,
      wizard: {
        step,
        coverUri,
        coverSource,
        coverFrameTimeMs,
        coverAsset,
        title,
        category,
        description,
        hashtag: normalizedHashtag,
        videoLength,
        aspectRatio,
        allowedFormat,
        officialSound,
        challengeVideos,
        instructions,
        primaryPrize,
        winnerCount,
        secondaryReward,
        startDate: startDate.toISOString(),
        startTime: startTime.toISOString(),
        endDate: endDate.toISOString(),
        endTime: endTime.toISOString(),
        votingStartDate: votingStartDate.toISOString(),
        votingStartTime: votingStartTime.toISOString(),
        votingEndDate: votingEndDate.toISOString(),
        votingEndTime: votingEndTime.toISOString(),
        openToEveryone,
        inviteOnly,
        challengeMode,
        battleCreatorIds: battleParticipantIds.join(','),
        battleParticipantIds,
        battleCreators,
        limitEntries,
        showLeaderboard,
        judgeByVotes,
        judgeByReactions,
      },
    };
  };

  const readStoredList = async (key: string): Promise<StoredChallenge[]> => {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let persistedId = backendDraftId;
      let cloudError: unknown = null;
      const draftStart = combineChallengeDateAndTime(startDate, startTime);
      const selectedDraftEnd = combineChallengeDateAndTime(endDate, endTime);
      const draftEndDate = selectedDraftEnd.getTime() > draftStart.getTime()
        ? endDate
        : addDays(startDate, 1);

      try {
        const payload = buildChallengeCreatePayload({
          title: title.trim() || 'Untitled Challenge',
          description: description.trim() || 'Draft challenge in progress.',
          instructions,
          category,
          hashtag: normalizedHashtag,
          videoLength,
          aspectRatio,
          allowedFormat,
          startDate,
          startTime,
          endDate: draftEndDate,
          endTime,
          votingStartDate,
          votingStartTime,
          votingEndDate,
          votingEndTime,
          mode: challengeMode,
          battleParticipantIds,
          inviteOnly,
          limitEntries,
          showLeaderboard,
          judgeByVotes: judgeByVotes || !judgeByReactions,
          judgeByReactions,
          primaryPrize: Number(primaryPrize) > 0 ? primaryPrize : '1',
          winnerCount: Math.max(1, winnerCount),
          secondaryReward,
          video: null,
        });
        const response = persistedId
          ? await challengesApi.updateChallenge(persistedId, payload)
          : await challengesApi.createChallengeDraft(payload);
        persistedId = response.data.data.id;
        setBackendDraftId(persistedId);
      } catch (error) {
        cloudError = error;
      }

      const draft = await buildStoredChallenge('draft', persistedId ?? undefined);
      const drafts = await readStoredList(DRAFTS_KEY);
      const nextDrafts = [draft, ...drafts.filter((item) => (
        item.id !== draft.id
        && item.id !== draftId
        && item.id !== routeDraft?.id
      ))];
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
      if (cloudError) {
        Alert.alert('Saved on this device', `The cloud draft could not be saved. ${getApiErrorMessage(cloudError)}`);
      } else {
        showToast('Challenge draft synced');
      }
    } catch {
      Alert.alert('Draft not saved', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateCurrentStep = (validationStep: WizardStep = step) => {
    if (validationStep === 1 && (!title.trim() || !description.trim() || !normalizedHashtag)) {
      Alert.alert('Complete the basics', 'Add a title, description, and hashtag before continuing.');
      return false;
    }
    if (validationStep === 2 && !instructions.trim()) {
      Alert.alert('Add instructions', 'Tell participants what they should create and submit.');
      return false;
    }
    if (validationStep === 3 && (!Number.isFinite(Number(primaryPrize)) || Number(primaryPrize) <= 0)) {
      Alert.alert('Check the prize', 'Enter a cash prize greater than zero.');
      return false;
    }
    if (validationStep === 3 && combineChallengeDateAndTime(endDate, endTime).getTime() <= combineChallengeDateAndTime(startDate, startTime).getTime()) {
      Alert.alert('Check the schedule', 'The end date must be after the start date.');
      return false;
    }
    if (validationStep === 3 && judgeByVotes
      && combineChallengeDateAndTime(votingEndDate, votingEndTime).getTime()
        <= combineChallengeDateAndTime(votingStartDate, votingStartTime).getTime()) {
      Alert.alert('Check voting duration', 'Voting must end after it starts.');
      return false;
    }
    if (validationStep === 3 && !judgeByVotes && !judgeByReactions) {
      Alert.alert('Choose judging criteria', 'Enable Vote, Reactions, or both.');
      return false;
    }
    if (validationStep === 3 && challengeMode === 'creator_battle' && (battleParticipantIds.length < 1 || battleParticipantIds.length > 3)) {
      Alert.alert('Choose battle creators', 'Add 1 to 3 creators to complete the battle lineup.');
      return false;
    }
    if (validationStep === 3 && challengeMode === 'creator_battle' && battleParticipantIds.includes(Number(user?.id))) {
      Alert.alert('Check the battle lineup', 'You cannot invite yourself to your own creator battle.');
      return false;
    }
    if (validationStep === 3 && challengeMode === 'creator_battle' && judgeByVotes
      && combineChallengeDateAndTime(votingStartDate, votingStartTime).getTime()
        < combineChallengeDateAndTime(endDate, endTime).getTime()) {
      Alert.alert('Check voting schedule', 'Voting for a creator battle must start when submissions close or later.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(4, current + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 1) {
      setStep((current) => Math.max(1, current - 1) as WizardStep);
      return;
    }
    navigation.goBack();
  };

  const cancelCreation = () => {
    const hasContent = Boolean(title.trim() || description.trim() || coverUri || challengeVideos.length);
    if (!hasContent) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard challenge?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const publishChallenge = async () => {
    if (isPublishing) return;
    for (const requiredStep of [1, 2, 3] as WizardStep[]) {
      if (!validateCurrentStep(requiredStep)) {
        setStep(requiredStep);
        return;
      }
    }
    setIsPublishing(true);
    setPublishProgress(challengeVideos.length ? 'Uploading video' : 'Creating challenge');
    try {
      let uploadedVideo: Awaited<ReturnType<typeof uploadCreatorVideoDirect>>['video'] | null = null;
      if (selectedChallengeVideo) {
        const upload = await uploadCreatorVideoDirect({
          video: {
            uri: selectedChallengeVideo.uri,
            name: selectedChallengeVideo.name,
            type: selectedChallengeVideo.type,
            size: selectedChallengeVideo.size,
          },
          thumbnail: coverSource === 'library' ? coverAsset : null,
          title: title.trim(),
          caption: description.trim(),
          contentType: category.toLowerCase(),
          visibility: 'public',
          purpose: 'challenge_video',
        }, {
          waitForProcessing: false,
          onProgress: (progress) => setPublishProgress(progress.message || 'Uploading video'),
        });
        uploadedVideo = upload.video;
      }

      setPublishProgress('Creating challenge');
      const payload = buildChallengeCreatePayload({
        title,
        description,
        instructions,
        category,
        hashtag: normalizedHashtag,
        videoLength,
        aspectRatio,
        allowedFormat,
        startDate,
        startTime,
        endDate,
        endTime,
        votingStartDate,
        votingStartTime,
        votingEndDate,
        votingEndTime,
        mode: challengeMode,
        battleParticipantIds,
        inviteOnly,
        limitEntries,
        showLeaderboard,
        judgeByVotes,
        judgeByReactions,
        primaryPrize,
        winnerCount,
        secondaryReward,
        video: uploadedVideo ? {
          id: uploadedVideo.id,
          coverSource,
          coverFrameTimeMs,
          coverUrl: coverSource === 'library' ? uploadedVideo.thumbnail : null,
        } : null,
      });
      const createResponse = await challengesApi.createChallenge(payload);
      const publishedChallenge = createResponse.data.data;
      if (backendDraftId) {
        void challengesApi.transitionChallenge(backendDraftId, {
          status: 'cancelled',
          reason: `Published as challenge ${publishedChallenge.id}`,
        }).catch(() => undefined);
      }

      const challenge = await buildStoredChallenge(publishedChallenge.status, publishedChallenge.id);
      const activeChallenges = await readStoredList(ACTIVE_KEY);
      await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify([
        challenge,
        ...activeChallenges.filter((item) => item.id !== challenge.id),
      ]));
      const drafts = await readStoredList(DRAFTS_KEY);
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter((item) => (
        item.id !== draftId
        && item.id !== routeDraft?.id
        && item.id !== String(backendDraftId ?? '')
      ))));
      Alert.alert(
        challengeMode === 'creator_battle' ? 'Battle invitations sent' : 'Challenge published',
        challengeMode === 'creator_battle'
          ? 'Your creator battle will open when every invited creator accepts.'
          : publishedChallenge.status === 'scheduled'
            ? 'Your challenge is scheduled and will open automatically.'
            : 'Your challenge is now active.',
        [
        {
          text: 'Done',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Arena' }),
        },
        ],
      );
    } catch (error) {
      Alert.alert('Could not publish challenge', getApiErrorMessage(error));
    } finally {
      setIsPublishing(false);
      setPublishProgress('');
    }
  };

  const getPickerValue = (field: DatePickerField) => {
    if (field === 'startDate') return startDate;
    if (field === 'startTime') return startTime;
    if (field === 'endDate') return endDate;
    if (field === 'endTime') return endTime;
    if (field === 'votingStartDate') return votingStartDate;
    if (field === 'votingStartTime') return votingStartTime;
    if (field === 'votingEndDate') return votingEndDate;
    return votingEndTime;
  };

  const pickerValue = datePickerField ? getPickerValue(datePickerField) : endTime;
  const pickerMinimumDate = datePickerField === 'endDate'
    ? startDate
    : datePickerField === 'votingEndDate'
      ? votingStartDate
      : undefined;

  const applyDatePickerValue = (field: DatePickerField, value: Date) => {
    if (field === 'startDate') setStartDate(value);
    if (field === 'startTime') setStartTime(value);
    if (field === 'endDate') setEndDate(value);
    if (field === 'endTime') setEndTime(value);
    if (field === 'votingStartDate') setVotingStartDate(value);
    if (field === 'votingStartTime') setVotingStartTime(value);
    if (field === 'votingEndDate') setVotingEndDate(value);
    if (field === 'votingEndTime') setVotingEndTime(value);
  };

  const openDatePicker = (field: DatePickerField) => {
    setPendingPickerValue(new Date(getPickerValue(field)));
    setDatePickerField(field);
  };

  const closeDatePicker = () => {
    setDatePickerField(null);
    setPendingPickerValue(null);
  };

  const confirmDatePicker = () => {
    if (datePickerField && pendingPickerValue) {
      applyDatePickerValue(datePickerField, pendingPickerValue);
    }
    closeDatePicker();
  };

  const handleDateChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (event.type !== 'dismissed' && nextDate) setPendingPickerValue(nextDate);
      return;
    }

    const field = datePickerField;
    setDatePickerField(null);
    setPendingPickerValue(null);
    if (event.type === 'dismissed' || !nextDate || !field) return;
    applyDatePickerValue(field, nextDate);
  };

  const renderRequirementRow = (
    icon: React.ComponentProps<typeof MaterialIcons>['name'],
    label: string,
    value: string,
    onPress: () => void,
  ) => (
    <Pressable onPress={onPress} style={[styles.requirementRow, { borderColor, backgroundColor: inputBackground }]}>
      <View style={[styles.requirementIcon, { backgroundColor: softPrimary }]}>
        <MaterialIcons name={icon} size={27} color={PRIMARY_COLOR} />
      </View>
      <Text style={[styles.requirementLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.requirementValue, { color: secondaryText }]}>{value}</Text>
      <MaterialIcons name="chevron-right" size={27} color={mutedText} />
    </Pressable>
  );

  const renderChallengeVideoPicker = (insideCard = false) => (
    <View style={[styles.challengeVideoSection, insideCard && styles.challengeVideoSectionInCard]}>
      <View style={styles.optionalSectionHeading}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Challenge Video</Text>
        <View style={[styles.optionalBadge, { backgroundColor: softPrimary }]}>
          <Text style={styles.optionalBadgeText}>Optional</Text>
        </View>
      </View>
      <Text style={[styles.optionalSectionCopy, { color: secondaryText }]}>Add one example or official video to guide participants.</Text>

      {challengeVideos.length > 0 ? (
        <View style={styles.challengeVideoList}>
          {challengeVideos.map((video, index) => (
            <View key={video.uri} style={[styles.challengeVideoRow, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.challengeVideoIcon, { backgroundColor: softPrimary }]}>
                <MaterialIcons name="play-arrow" size={28} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.challengeVideoCopy}>
                <Text numberOfLines={1} style={[styles.challengeVideoName, { color: textColor }]}>{video.name}</Text>
                <Text style={[styles.challengeVideoMeta, { color: mutedText }]}>Video {index + 1} · {formatVideoDuration(video.durationMs)}</Text>
              </View>
              <Pressable
                accessibilityLabel={`Remove ${video.name}`}
                onPress={removeChallengeVideo}
                style={styles.removeChallengeVideo}
              >
                <MaterialIcons name="close" size={22} color={mutedText} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => void pickChallengeVideos()}
        style={[
          styles.challengeVideoUpload,
          { borderColor: primaryColorAlpha(0.5), backgroundColor: softPrimary },
        ]}
      >
        <MaterialIcons name="video-library" size={26} color={PRIMARY_COLOR} />
        <View style={styles.challengeVideoUploadCopy}>
          <Text style={styles.challengeVideoUploadTitle}>{challengeVideos.length ? 'Change Video' : 'Add Challenge Video'}</Text>
          <Text style={[styles.challengeVideoUploadHint, { color: secondaryText }]}>{challengeVideos.length ? 'One video selected' : 'One video maximum'}</Text>
        </View>
        <MaterialIcons name={challengeVideos.length ? 'edit' : 'add'} size={25} color={PRIMARY_COLOR} />
      </Pressable>
    </View>
  );

  const renderBasics = () => (
    <View style={[styles.mainCard, { backgroundColor: cardBackground , borderColor }]}>
      {renderChallengeVideoPicker(true)}
      <View style={[styles.basicsSectionDivider, { backgroundColor: borderColor }]} />

      <Text style={[styles.fieldLabel, { color: textColor }]}>Cover</Text>
      {selectedChallengeVideo ? (
        <View style={styles.videoFramePicker}>
          <View style={styles.videoFrameHeading}>
            <Text style={[styles.videoFrameTitle, { color: textColor }]}>Choose a frame from your video</Text>
            <Text style={[styles.videoFrameHint, { color: mutedText }]}>or select from library below</Text>
          </View>
          {isGeneratingFrames ? (
            <View style={[styles.videoFramesLoading, { backgroundColor: softPrimary }]}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              <Text style={[styles.videoFrameHint, { color: secondaryText }]}>Preparing frames…</Text>
            </View>
          ) : videoFrameOptions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoFrameRow}>
              {videoFrameOptions.map((frame) => {
                const selected = coverSource === 'video' && coverUri === frame.uri;
                return (
                  <Pressable
                    key={`${frame.uri}-${frame.timeMs}`}
                    accessibilityLabel={`Use frame at ${formatFrameTime(frame.timeMs)}`}
                    onPress={() => selectVideoFrame(frame)}
                    style={[styles.videoFrameOption, { borderColor: selected ? PRIMARY_COLOR : borderColor }]}
                  >
                    <Image source={{ uri: frame.uri }} style={styles.videoFrameImage} resizeMode="cover" />
                    <View style={styles.videoFrameTimeBadge}>
                      <Text style={styles.videoFrameTimeText}>{formatFrameTime(frame.timeMs)}</Text>
                    </View>
                    {selected ? (
                      <View style={styles.videoFrameSelectedBadge}>
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.videoFrameHint, { color: mutedText }]}>Frames could not be generated. Select a cover from your library.</Text>
          )}
        </View>
      ) : null}
      <Pressable onPress={() => void pickCover()} style={[styles.coverPicker, { borderColor: primaryColorAlpha(0.5), backgroundColor: softPrimary }]}>
        {coverUri ? (
          <>
            <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.coverScrim} />
            <View style={styles.coverReplacePill}>
              <MaterialIcons name="photo-library" size={18} color="#ffffff" />
              <Text style={styles.coverReplaceText}>Select from Library</Text>
            </View>
          </>
        ) : (
          <>
            <MaterialIcons name="photo-library" size={32} color={PRIMARY_COLOR} />
            <Text style={styles.coverTitle}>Select Cover from Library</Text>
            <Text style={[styles.coverHint, { color: secondaryText }]}>PNG or JPG · 16:9 recommended</Text>
          </>
        )}
      </Pressable>

      <Text style={[styles.fieldLabel, { color: textColor }]}>Challenge Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        placeholder="Glow Up Dance Challenge"
        placeholderTextColor={mutedText}
        style={[styles.singleInput, { color: textColor, borderColor, backgroundColor: inputBackground }]}
      />

      <Text style={[styles.fieldLabel, { color: textColor }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((item) => {
          const selected = item === category;
          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.categoryChip, { borderColor }, selected && { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }]}
            >
              {item === 'Dance' ? <MaterialIcons name="music-note" size={17} color={selected ? '#ffffff' : secondaryText} /> : null}
              <Text style={[styles.categoryText, { color: selected ? '#ffffff' : secondaryText }]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.fieldLabel, { color: textColor }]}>Description</Text>
      <View style={[styles.multilineShell, { borderColor, backgroundColor: inputBackground }]}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          textAlignVertical="top"
          placeholder="Describe the challenge and inspire people to join..."
          placeholderTextColor={mutedText}
          style={[styles.multilineInput, { color: textColor }]}
        />
        <Text style={[styles.characterCount, { color: mutedText }]}>{description.length}/500</Text>
      </View>

      <Text style={[styles.fieldLabel, { color: textColor }]}>Hashtag</Text>
      <TextInput
        value={hashtag}
        onChangeText={setHashtag}
        maxLength={40}
        autoCapitalize="none"
        placeholder="#GlowUpChallenge"
        placeholderTextColor={mutedText}
        style={[styles.singleInput, { color: textColor, borderColor, backgroundColor: inputBackground }]}
      />
      <Text style={[styles.helperText, { color: mutedText }]}>Include a hashtag to make your challenge discoverable.</Text>
    </View>
  );

  const renderRules = () => (
    <>
      <View style={[styles.mainCard, { backgroundColor: cardBackground, borderColor }]}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Submission Requirements</Text>
        <View style={styles.requirementStack}>
          {renderRequirementRow('videocam', 'Video Length', videoLength, () => chooseOption('Video length', ['15s - 30s', '15s - 60s', 'Up to 3 min'], setVideoLength))}
          {renderRequirementRow('aspect-ratio', 'Aspect Ratio', aspectRatio, () => chooseOption('Aspect ratio', ['9:16', '1:1', '16:9'], setAspectRatio))}
          {renderRequirementRow('insert-drive-file', 'Allowed Format', allowedFormat, () => chooseOption('Allowed format', ['MP4 / MOV', 'MP4 only', 'Any video'], setAllowedFormat))}
        </View>
      </View>

      <View style={styles.standaloneSection}>
        <Text style={[styles.sectionHeading, { color: textColor, paddingHorizontal: 18 }]}>Official Sound</Text>
        <Pressable
          onPress={() => chooseOption('Official sound', ['No official sound', 'Choose from sound library', 'Use my latest release'], setOfficialSound)}
          style={[styles.wideSelection, { backgroundColor: cardBackground, borderColor }]}
        >
          <View style={[styles.requirementIcon, { backgroundColor: softPrimary }]}>
            <MaterialIcons name="audiotrack" size={27} color={PRIMARY_COLOR} />
          </View>
          <Text numberOfLines={1} style={[styles.wideSelectionText, { color: textColor }]}>{officialSound}</Text>
          <MaterialIcons name="chevron-right" size={27} color={mutedText} />
        </Pressable>
      </View>

      <View style={styles.standaloneSection}>
        <Text style={[styles.sectionHeading, { color: textColor, paddingHorizontal: 14 }]}>Required Hashtag</Text>
        <View style={[styles.hashtagDisplay, { backgroundColor: cardBackground, borderColor }]}>
          <View style={[styles.hashtagIcon, { backgroundColor: softPrimary }]}>
            <MaterialIcons name="tag" size={30} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.hashtagValue, { color: textColor }]}>{normalizedHashtag || '#YourChallenge'}</Text>
        </View>
      </View>

      <View style={styles.standaloneSection}>
        <Text style={[styles.sectionHeading, { color: textColor, paddingHorizontal: 14 }]}>Instructions to Participants</Text>
        <View style={[styles.instructionsShell, { backgroundColor: cardBackground, borderColor }]}>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            maxLength={700}
            multiline
            textAlignVertical="top"
            placeholder="Share what participants should create, include, and avoid..."
            placeholderTextColor={mutedText}
            style={[styles.instructionsInput, { color: textColor }]}
          />
          <Text style={[styles.characterCount, { color: mutedText }]}>{instructions.length}/700</Text>
        </View>
      </View>
    </>
  );

  const renderScheduleField = (
    label: string,
    value: string,
    icon: React.ComponentProps<typeof MaterialIcons>['name'],
    field: DatePickerField,
  ) => (
    <Pressable onPress={() => openDatePicker(field)} style={[styles.scheduleField, { backgroundColor: inputBackground, borderColor }]}>
      <MaterialIcons name={icon} size={22} color={mutedText} />
      <View style={styles.scheduleCopy}>
        <Text style={[styles.scheduleLabel, { color: mutedText }]}>{label}</Text>
        <Text style={[styles.scheduleValue, { color: textColor }]}>{value}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={21} color={borderColor} />
    </Pressable>
  );

  const renderToggle = (
    icon: React.ComponentProps<typeof MaterialIcons>['name'],
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    detail?: string,
  ) => (
    <View style={styles.toggleRow}>
      <MaterialIcons name={icon} size={22} color={value ? PRIMARY_COLOR : mutedText} />
      <Text style={[styles.toggleLabel, { color: secondaryText }]}>{label}</Text>
      {detail ? <Text style={[styles.toggleDetail, { color: mutedText }]}>{detail}</Text> : null}
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: isDark ? '#334155' : '#dfe3e8', true: PRIMARY_COLOR }}
        thumbColor="#ffffff"
        ios_backgroundColor={isDark ? '#334155' : '#dfe3e8'}
      />
    </View>
  );

  const renderRewards = () => (
    <View style={[styles.mainCard, { backgroundColor: cardBackground, borderColor }]}>
      <Text style={[styles.sectionHeading, { color: textColor }]}>Prize & Rewards</Text>
      <View style={styles.rewardStack}>
        <View style={[styles.rewardRow, { borderColor, backgroundColor: inputBackground }]}>
          <View style={[styles.rewardIcon, { backgroundColor: softPrimary }]}>
            <MaterialIcons name="emoji-events" size={25} color={PRIMARY_COLOR} />
          </View>
          <View style={styles.rewardCopy}>
            <Text style={[styles.rewardLabel, { color: mutedText }]}>Primary prize</Text>
            <Text style={[styles.rewardValue, { color: textColor }]}>{rewardLabel}</Text>
          </View>
          <View style={[styles.amountField, { borderColor }]}>
            <Text style={[styles.currency, { color: textColor }]}>$</Text>
            <TextInput
              value={primaryPrize}
              onChangeText={(value) => setPrimaryPrize(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={mutedText}
              style={[styles.amountInput, { color: textColor }]}
            />
          </View>
        </View>

        <Pressable
          disabled={challengeMode === 'creator_battle'}
          onPress={() => chooseOption('Number of winners', ['1', '2', '3', '5', '10'], (value) => setWinnerCount(Number(value)))}
          style={[styles.rewardRow, { borderColor, backgroundColor: inputBackground }]}
        >
          <View style={[styles.rewardIcon, { backgroundColor: isDark ? 'rgba(168,85,247,0.16)' : '#faf1ff' }]}>
            <MaterialIcons name="groups" size={25} color="#a855f7" />
          </View>
          <View style={styles.rewardCopy}>
            <Text style={[styles.rewardLabel, { color: mutedText }]}>Number of winners</Text>
            <Text style={[styles.rewardValue, { color: textColor }]}>
              {challengeMode === 'creator_battle' ? '1 battle winner' : winnerCount}
            </Text>
          </View>
          <MaterialIcons name={challengeMode === 'creator_battle' ? 'lock-outline' : 'keyboard-arrow-down'} size={25} color={mutedText} />
        </Pressable>

        <View style={[styles.rewardRow, { borderColor, backgroundColor: inputBackground }]}>
          <View style={[styles.rewardIcon, { backgroundColor: isDark ? 'rgba(236,72,153,0.14)' : '#fff1f7' }]}>
            <MaterialIcons name="card-giftcard" size={24} color="#ec4899" />
          </View>
          <View style={styles.rewardCopy}>
            <Text style={[styles.rewardLabel, { color: mutedText }]}>Secondary reward (optional)</Text>
            <TextInput
              value={secondaryReward}
              onChangeText={setSecondaryReward}
              maxLength={80}
              placeholder="Feature on Kulsah"
              placeholderTextColor={mutedText}
              style={[styles.inlineRewardInput, { color: textColor }]}
            />
          </View>
        </View>
      </View>

      <Text style={[styles.sectionHeading, styles.rewardsSectionSpacing, { color: textColor }]}>Schedule</Text>
      <View style={styles.scheduleGrid}>
        {renderScheduleField('START DATE', formatDate(startDate), 'calendar-today', 'startDate')}
        {renderScheduleField('START TIME', formatTime(startTime), 'schedule', 'startTime')}
        {renderScheduleField('END DATE', formatDate(endDate), 'calendar-today', 'endDate')}
        {renderScheduleField('END TIME', formatTime(endTime), 'schedule', 'endTime')}
      </View>

      <Text style={[styles.sectionHeading, styles.rewardsSectionSpacing, { color: textColor }]}>Participation Settings</Text>
      <Text style={[styles.modeSectionCopy, { color: secondaryText }]}>Choose who can take part in this challenge.</Text>
      <View style={styles.modeOptionStack}>
        {CHALLENGE_MODES.map((option) => {
          const selected = challengeMode === option.mode;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => selectChallengeMode(option.mode)}
              style={[
                styles.modeOption,
                {
                  backgroundColor: selected ? softPrimary : inputBackground,
                  borderColor: selected ? PRIMARY_COLOR : borderColor,
                },
              ]}
            >
              <View style={[styles.modeOptionIcon, { backgroundColor: selected ? PRIMARY_COLOR : softPrimary }]}>
                <MaterialIcons name={option.icon} size={24} color={selected ? '#ffffff' : PRIMARY_COLOR} />
              </View>
              <View style={styles.modeOptionCopy}>
                <Text style={[styles.modeOptionTitle, { color: textColor }]}>{option.title}</Text>
                <Text style={[styles.modeOptionDescription, { color: secondaryText }]}>{option.description}</Text>
              </View>
              <MaterialIcons name={selected ? 'check-circle' : 'radio-button-unchecked'} size={24} color={selected ? PRIMARY_COLOR : mutedText} />
            </Pressable>
          );
        })}
      </View>

      {challengeMode === 'creator_battle' ? (
        <View style={[styles.battleSetupCard, { backgroundColor: isDark ? '#0f1720' : '#f8fbff', borderColor }]}>
          <View style={styles.battleSetupHeader}>
            <View style={styles.battleSetupHeadingCopy}>
              <Text style={[styles.battleSetupTitle, { color: textColor }]}>Battle lineup</Text>
              <Text style={[styles.battleSetupSubtitle, { color: secondaryText }]}>You are the host. Add 1 to 3 opponents.</Text>
            </View>
            <View style={[styles.battleCountPill, { backgroundColor: softPrimary }]}>
              <Text style={styles.battleCountText}>{battleParticipantCount}/4</Text>
            </View>
          </View>

          <View style={[styles.battleCreatorRow, styles.battleHostRow, { borderColor, backgroundColor: cardBackground }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.battleCreatorAvatar} />
            ) : (
              <View style={[styles.battleCreatorAvatarFallback, { backgroundColor: softPrimary }]}>
                <MaterialIcons name="person" size={23} color={PRIMARY_COLOR} />
              </View>
            )}
            <View style={styles.battleCreatorCopy}>
              <View style={styles.battleCreatorNameRow}>
                <Text numberOfLines={1} style={[styles.battleCreatorName, { color: textColor }]}>{user?.name || 'You'}</Text>
                {user?.verified ? <MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} /> : null}
              </View>
              <Text numberOfLines={1} style={[styles.battleCreatorHandle, { color: secondaryText }]}>
                @{(user?.handle || 'creator').replace(/^@/, '')}
              </Text>
            </View>
            <View style={[styles.hostBadge, { backgroundColor: softPrimary }]}>
              <Text style={styles.hostBadgeText}>HOST</Text>
            </View>
          </View>

          <View style={styles.battleVersusRow}>
            <View style={[styles.battleVersusLine, { backgroundColor: borderColor }]} />
            <View style={[styles.battleVersusBadge, { backgroundColor: PRIMARY_COLOR }]}>
              <Text style={styles.battleVersusText}>VS</Text>
            </View>
            <View style={[styles.battleVersusLine, { backgroundColor: borderColor }]} />
          </View>

          <View style={styles.battleCreatorStack}>
            {battleCreators.map((creator) => (
              <View key={creator.id} style={[styles.battleCreatorRow, { borderColor, backgroundColor: cardBackground }]}>
                {creator.avatar_url ? (
                  <Image source={{ uri: creator.avatar_url }} style={styles.battleCreatorAvatar} />
                ) : (
                  <View style={[styles.battleCreatorAvatarFallback, { backgroundColor: softPrimary }]}>
                    <MaterialIcons name="person" size={23} color={PRIMARY_COLOR} />
                  </View>
                )}
                <View style={styles.battleCreatorCopy}>
                  <View style={styles.battleCreatorNameRow}>
                    <Text numberOfLines={1} style={[styles.battleCreatorName, { color: textColor }]}>{creator.name}</Text>
                    {creator.is_verified ? <MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} /> : null}
                  </View>
                  <Text numberOfLines={1} style={[styles.battleCreatorHandle, { color: secondaryText }]}>@{creator.handle.replace(/^@/, '')}</Text>
                </View>
                <Pressable accessibilityLabel={`Remove ${creator.name}`} onPress={() => removeBattleCreator(creator.id)} style={styles.removeBattleCreatorButton}>
                  <MaterialIcons name="close" size={21} color={mutedText} />
                </Pressable>
              </View>
            ))}
          </View>

          {battleCreators.length < 3 ? (
            <Pressable onPress={openBattleCreatorPicker} style={[styles.addBattleCreatorButton, { borderColor: primaryColorAlpha(0.45), backgroundColor: softPrimary }]}>
              <View style={styles.addBattleCreatorIcon}>
                <MaterialIcons name="person-add" size={22} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.addBattleCreatorCopy}>
                <Text style={styles.addBattleCreatorTitle}>{battleCreators.length ? 'Add another creator' : 'Choose battle creators'}</Text>
                <Text style={[styles.addBattleCreatorHint, { color: secondaryText }]}>Search the Kulsah creator community</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={PRIMARY_COLOR} />
            </Pressable>
          ) : null}

          <View style={[styles.battleNotice, { backgroundColor: softPrimary }]}>
            <MaterialIcons name="info-outline" size={20} color={PRIMARY_COLOR} />
            <Text style={[styles.battleNoticeText, { color: secondaryText }]}>Invitations are sent when you publish. The battle opens after every invited creator accepts.</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.toggleStack, { marginTop: 12 }]}>
        {renderToggle('confirmation-number', 'Limit entries per creator', limitEntries, setLimitEntries, limitEntries ? '1 entry' : undefined)}
        {renderToggle('leaderboard', 'Show leaderboard', showLeaderboard, setShowLeaderboard)}
      </View>

      <View style={styles.judgingTitleRow}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Judging Criteria</Text>
        <MaterialIcons name="help-outline" size={18} color={mutedText} />
      </View>
      <View style={[styles.judgingOptions, { backgroundColor: isDark ? '#0f1720' : '#f8fafc', borderColor }]}>
        {renderToggle('how-to-vote', 'Vote', judgeByVotes, handleJudgeByVotesChange, 'Community votes')}
        <View style={[styles.judgingOptionDivider, { backgroundColor: borderColor }]} />
        {renderToggle('favorite', 'Reactions', judgeByReactions, handleJudgeByReactionsChange, 'Likes & reactions')}
      </View>

      {judgeByVotes ? (
        <>
          <Text style={[styles.sectionHeading, styles.rewardsSectionSpacing, { color: textColor }]}>Voting Duration</Text>
          <View style={styles.scheduleGrid}>
            {renderScheduleField('START DATE', formatDate(votingStartDate), 'how-to-vote', 'votingStartDate')}
            {renderScheduleField('START TIME', formatTime(votingStartTime), 'schedule', 'votingStartTime')}
            {renderScheduleField('END DATE', formatDate(votingEndDate), 'event-available', 'votingEndDate')}
            {renderScheduleField('END TIME', formatTime(votingEndTime), 'schedule', 'votingEndTime')}
          </View>
          {challengeMode === 'creator_battle' ? (
            <View style={styles.battleScheduleHint}>
              <MaterialIcons name="schedule" size={18} color={PRIMARY_COLOR} />
              <Text style={[styles.battleScheduleHintText, { color: secondaryText }]}>Battle voting must begin when submissions close or later.</Text>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={[styles.reachCard, { backgroundColor: softPrimary, borderColor: primaryColorAlpha(0.22) }]}>
        <MaterialIcons name={challengeMode === 'creator_battle' ? 'auto-awesome' : 'groups'} size={27} color={PRIMARY_COLOR} />
        <View style={styles.reachCopy}>
          <Text style={styles.reachTitle}>{challengeMode === 'creator_battle' ? 'Automatic battle ranking' : 'Estimated reach'}</Text>
          <Text style={[styles.reachText, { color: secondaryText }]}>
            {challengeMode === 'creator_battle'
              ? 'The winner is selected automatically from your configured scoring criteria.'
              : 'Public challenges with rewards typically receive more entries.'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPreviewInfoCard = (
    icon: React.ComponentProps<typeof MaterialIcons>['name'],
    heading: string,
    children: React.ReactNode,
  ) => (
    <View style={[styles.previewInfoCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={[styles.previewInfoIcon, { backgroundColor: softPrimary }]}>
        <MaterialIcons name={icon} size={27} color={PRIMARY_COLOR} />
      </View>
      <View style={styles.previewInfoCopy}>
        <Text style={[styles.previewInfoHeading, { color: textColor }]}>{heading}</Text>
        {children}
      </View>
    </View>
  );

  const renderPreview = () => (
    <>
      <Text style={[styles.previewHeading, { color: textColor }]}>Challenge Preview</Text>
      <View style={[styles.previewChallengeCard, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.previewCover}>
          <Image source={{ uri: coverUri || DEFAULT_COVER }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.previewCoverScrim} />
          <Text style={styles.previewCategory}>{category}</Text>
        </View>
        <View style={styles.previewBody}>
          <Text style={[styles.previewTitle, { color: textColor }]}>{title.trim() || 'Your Challenge Title'}</Text>
          <View style={styles.creatorPreviewRow}>
            <View style={[styles.creatorPreviewAvatar, { backgroundColor: softPrimary }]}>
              <MaterialIcons name="person" size={23} color={PRIMARY_COLOR} />
            </View>
            <Text style={[styles.creatorPreviewHandle, { color: textColor }]}>@creator</Text>
          </View>
          <View style={styles.previewChipRow}>
            <View style={styles.prizeChip}>
              <Text style={styles.prizeChipText}>{rewardLabel}</Text>
            </View>
            <View style={[styles.dateChip, { borderColor, backgroundColor: inputBackground }]}>
              <Text style={[styles.dateChipText, { color: secondaryText }]}>{dateRange}</Text>
            </View>
            <View style={[styles.dateChip, { borderColor, backgroundColor: inputBackground }]}>
              <Text style={[styles.dateChipText, { color: secondaryText }]}>{challengeModeLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {challengeMode === 'creator_battle' ? renderPreviewInfoCard('sports-kabaddi', 'Battle Lineup', (
        <View style={styles.previewBattleStack}>
          <View style={styles.previewBattleParticipant}>
            <View style={[styles.previewBattleAvatar, { backgroundColor: softPrimary }]}>
              <MaterialIcons name="person" size={17} color={PRIMARY_COLOR} />
            </View>
            <Text numberOfLines={1} style={[styles.previewBattleName, { color: secondaryText }]}>
              {user?.name || 'You'} · Host
            </Text>
          </View>
          {battleCreators.map((creator) => (
            <View key={creator.id} style={styles.previewBattleParticipant}>
              {creator.avatar_url ? (
                <Image source={{ uri: creator.avatar_url }} style={styles.previewBattleAvatar} />
              ) : (
                <View style={[styles.previewBattleAvatar, { backgroundColor: softPrimary }]}>
                  <MaterialIcons name="person" size={17} color={PRIMARY_COLOR} />
                </View>
              )}
              <Text numberOfLines={1} style={[styles.previewBattleName, { color: secondaryText }]}>{creator.name}</Text>
              {creator.is_verified ? <MaterialIcons name="verified" size={15} color={PRIMARY_COLOR} /> : null}
            </View>
          ))}
          <Text style={[styles.previewBattleHint, { color: mutedText }]}>Invites are sent after publishing.</Text>
        </View>
      )) : null}

      {renderPreviewInfoCard('description', 'Challenge Brief', (
        <Text style={[styles.previewInfoText, { color: secondaryText }]}>{description || 'Your challenge description will appear here.'}</Text>
      ))}
      {renderPreviewInfoCard('rule', 'Rules & Submission', (
        <View style={styles.bulletList}>
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  Video length: {videoLength}</Text>
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  Format: {aspectRatio} · {allowedFormat}</Text>
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  Required hashtag: {normalizedHashtag}</Text>
          {challengeVideos.length ? (
            <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  {challengeVideos.length} optional challenge video{challengeVideos.length === 1 ? '' : 's'}</Text>
          ) : null}
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  {instructions}</Text>
        </View>
      ))}
      {renderPreviewInfoCard('emoji-events', 'Rewards & Schedule', (
        <View style={styles.bulletList}>
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  {rewardLabel} · {winnerCount} winner{winnerCount === 1 ? '' : 's'}</Text>
          {secondaryReward ? <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  {secondaryReward}</Text> : null}
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  {dateRange}</Text>
          <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  Judging: {judgingLabel}</Text>
          {judgeByVotes ? (
            <Text style={[styles.previewInfoText, { color: secondaryText }]}>•  Voting: {votingDateRange}</Text>
          ) : null}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBackground }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={cardBackground} />
      <View style={[styles.screen]}>
        {toast ? (
          <View style={styles.toast}>
            <MaterialIcons name="check-circle" size={19} color="#ffffff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <View style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
          <Pressable accessibilityLabel="Go back" onPress={goBack} style={styles.headerSideButton}>
            <MaterialIcons name="chevron-left" size={28} color={PRIMARY_COLOR} />
          </Pressable>
          <View pointerEvents="none" style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Create Challenge</Text>
            <Text style={[styles.headerSubtitle, { color: secondaryText }]}>{STEP_COPY[step].subtitle}</Text>
          </View>
          <Pressable accessibilityLabel="Save challenge draft" onPress={() => void saveDraft()} style={styles.saveDraftButton}>
            {isSaving ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : <Text style={styles.saveDraftText}>Save Draft</Text>}
          </Pressable>
        </View>

        <View style={[styles.stepper, { backgroundColor: cardBackground }]}>
          {([1, 2, 3, 4] as WizardStep[]).map((item) => {
            const active = item === step;
            return (
              <Pressable key={item} onPress={() => item < step && setStep(item)} style={styles.stepItem}>
                <View style={[styles.stepDash, { backgroundColor: active ? PRIMARY_COLOR : borderColor }]} />
                <Text style={[styles.stepLabel, { color: active ? PRIMARY_COLOR : mutedText }]}>{STEP_COPY[item].label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? renderBasics() : null}
          {step === 2 ? renderRules() : null}
          {step === 3 ? renderRewards() : null}
          {step === 4 ? renderPreview() : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: cardBackground, borderTopColor: borderColor }]}>
          <Pressable onPress={step === 1 ? cancelCreation : goBack} style={[styles.footerButton, { borderColor: PRIMARY_COLOR }]}>
            <Text style={styles.footerSecondaryText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </Pressable>
          <Pressable
            disabled={isPublishing}
            onPress={step === 4 ? () => void publishChallenge() : goNext}
            style={[styles.footerButton, styles.footerPrimaryButton, isPublishing && styles.disabledButton]}
          >
            {isPublishing ? (
              <View style={styles.publishProgressRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text numberOfLines={1} style={styles.publishProgressText}>{publishProgress || 'Submitting'}</Text>
              </View>
            ) : (
              <>
                {step < 4 ? <MaterialIcons name={step === 2 ? 'auto-awesome' : 'check'} size={21} color="#ffffff" /> : null}
                <Text style={styles.footerPrimaryText}>{step === 4 ? 'Publish Challenge' : 'Next'}</Text>
              </>
            )}
          </Pressable>
        </View>

        {datePickerField && Platform.OS !== 'ios' ? (
          <DateTimePicker
            value={pickerValue}
            mode={datePickerField.endsWith('Time') ? 'time' : 'date'}
            minimumDate={pickerMinimumDate}
            onChange={handleDateChange}
          />
        ) : null}

        <Modal
          visible={Platform.OS === 'ios' && Boolean(datePickerField)}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={closeDatePicker}
        >
          <View style={styles.datePickerModalRoot}>
            <Pressable style={styles.datePickerModalBackdrop} onPress={closeDatePicker} />
            <View style={[styles.datePickerModalCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.datePickerModalHeader, { borderBottomColor: borderColor }]}>
                <Text style={[styles.datePickerModalTitle, { color: textColor }]}>
                  {datePickerField?.startsWith('voting') ? 'Voting duration' : 'Challenge schedule'}
                </Text>
              </View>

              {datePickerField ? (
                <DateTimePicker
                  value={pendingPickerValue ?? pickerValue}
                  mode={datePickerField.endsWith('Time') ? 'time' : 'date'}
                  display={datePickerField.endsWith('Time') ? 'spinner' : 'inline'}
                  minimumDate={pickerMinimumDate}
                  accentColor={PRIMARY_COLOR}
                  themeVariant={isDark ? 'dark' : 'light'}
                  onChange={handleDateChange}
                  style={[
                    styles.iosDatePicker,
                    datePickerField.endsWith('Time')
                      ? styles.iosTimePicker
                      : styles.iosCalendarPicker,
                  ]}
                />
              ) : null}

              <View style={[styles.datePickerModalActions, { borderTopColor: borderColor }]}>
                <Pressable onPress={closeDatePicker} style={styles.datePickerModalButton}>
                  <Text style={[styles.datePickerModalCancelText, { color: secondaryText }]}>Cancel</Text>
                </Pressable>
                <View style={[styles.datePickerModalActionDivider, { backgroundColor: borderColor }]} />
                <Pressable onPress={confirmDatePicker} style={styles.datePickerModalButton}>
                  <Text style={styles.datePickerModalDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={battleCreatorPickerVisible}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setBattleCreatorPickerVisible(false)}
        >
          <View style={styles.creatorPickerModalRoot}>
            <Pressable style={styles.choiceModalBackdrop} onPress={() => setBattleCreatorPickerVisible(false)} />
            <View style={[styles.creatorPickerModalCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={[styles.creatorPickerHandle, { backgroundColor: borderColor }]} />
              <View style={styles.creatorPickerHeader}>
                <View style={styles.creatorPickerHeaderCopy}>
                  <Text style={[styles.creatorPickerTitle, { color: textColor }]}>Choose battle creators</Text>
                  <Text style={[styles.creatorPickerSubtitle, { color: secondaryText }]}>Select up to 3 opponents · {battleCreators.length}/3 selected</Text>
                </View>
                <Pressable accessibilityLabel="Close creator picker" onPress={() => setBattleCreatorPickerVisible(false)} style={styles.choiceModalClose}>
                  <MaterialIcons name="close" size={23} color={secondaryText} />
                </Pressable>
              </View>

              <View style={[styles.creatorSearchBox, { backgroundColor: inputBackground, borderColor }]}>
                <MaterialIcons name="search" size={22} color={mutedText} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={battleCreatorSearch}
                  onChangeText={setBattleCreatorSearch}
                  placeholder="Search by name or @handle"
                  placeholderTextColor={mutedText}
                  style={[styles.creatorSearchInput, { color: textColor }]}
                />
                {battleDiscovery.isFetching ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : battleCreatorSearch ? (
                  <Pressable accessibilityLabel="Clear search" onPress={() => setBattleCreatorSearch('')} style={styles.creatorSearchClear}>
                    <MaterialIcons name="cancel" size={19} color={mutedText} />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView
                style={styles.creatorPickerResults}
                contentContainerStyle={styles.creatorPickerResultsContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {battleDiscovery.isLoading ? (
                  <View style={styles.creatorPickerState}>
                    <ActivityIndicator color={PRIMARY_COLOR} />
                    <Text style={[styles.creatorPickerStateText, { color: secondaryText }]}>Finding creators…</Text>
                  </View>
                ) : battleDiscovery.isError ? (
                  <View style={styles.creatorPickerState}>
                    <View style={[styles.creatorPickerStateIcon, { backgroundColor: softPrimary }]}>
                      <MaterialIcons name="cloud-off" size={25} color={PRIMARY_COLOR} />
                    </View>
                    <Text style={[styles.creatorPickerStateTitle, { color: textColor }]}>Couldn’t load creators</Text>
                    <Text style={[styles.creatorPickerStateText, { color: secondaryText }]}>Check your connection and try again.</Text>
                    <Pressable onPress={() => void battleDiscovery.refetch()} style={[styles.creatorPickerRetry, { borderColor: PRIMARY_COLOR }]}>
                      <Text style={styles.creatorPickerRetryText}>Try again</Text>
                    </Pressable>
                  </View>
                ) : discoveredBattleCreators.filter((creator) => creator.id !== Number(user?.id)).length === 0 ? (
                  <View style={styles.creatorPickerState}>
                    <View style={[styles.creatorPickerStateIcon, { backgroundColor: softPrimary }]}>
                      <MaterialIcons name="person-search" size={25} color={PRIMARY_COLOR} />
                    </View>
                    <Text style={[styles.creatorPickerStateTitle, { color: textColor }]}>No creators found</Text>
                    <Text style={[styles.creatorPickerStateText, { color: secondaryText }]}>Try another name or handle.</Text>
                  </View>
                ) : discoveredBattleCreators
                    .filter((creator) => creator.id !== Number(user?.id))
                    .map((creator) => {
                      const selected = battleCreators.some((item) => item.id === creator.id);
                      const disabled = !selected && battleCreators.length >= 3;
                      return (
                        <Pressable
                          key={creator.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected, disabled }}
                          disabled={disabled}
                          onPress={() => toggleBattleCreator(creator)}
                          style={[
                            styles.creatorResultRow,
                            {
                              backgroundColor: selected ? softPrimary : cardBackground,
                              borderColor: selected ? primaryColorAlpha(0.45) : borderColor,
                            },
                            disabled && styles.creatorResultDisabled,
                          ]}
                        >
                          {creator.avatar_url ? (
                            <Image source={{ uri: creator.avatar_url }} style={styles.creatorResultAvatar} />
                          ) : (
                            <View style={[styles.creatorResultAvatarFallback, { backgroundColor: softPrimary }]}>
                              <MaterialIcons name="person" size={24} color={PRIMARY_COLOR} />
                            </View>
                          )}
                          <View style={styles.creatorResultCopy}>
                            <View style={styles.battleCreatorNameRow}>
                              <Text numberOfLines={1} style={[styles.creatorResultName, { color: textColor }]}>{creator.name}</Text>
                              {creator.is_verified ? <MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} /> : null}
                            </View>
                            <Text numberOfLines={1} style={[styles.creatorResultMeta, { color: secondaryText }]}>
                              @{creator.handle.replace(/^@/, '')} · {formatFollowerCount(creator.followers_count)} followers
                            </Text>
                          </View>
                          <MaterialIcons
                            name={selected ? 'check-circle' : 'radio-button-unchecked'}
                            size={25}
                            color={selected ? PRIMARY_COLOR : mutedText}
                          />
                        </Pressable>
                      );
                    })}
              </ScrollView>

              <View style={[styles.creatorPickerFooter, { borderTopColor: borderColor }]}>
                <Text style={[styles.creatorPickerFooterHint, { color: secondaryText }]}>
                  {battleCreators.length ? `${battleCreators.length + 1} creators in this battle` : 'Choose at least 1 creator'}
                </Text>
                <Pressable
                  disabled={!battleCreators.length}
                  onPress={() => setBattleCreatorPickerVisible(false)}
                  style={[styles.creatorPickerDone, !battleCreators.length && styles.disabledButton]}
                >
                  <Text style={styles.creatorPickerDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={Boolean(choicePicker)}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setChoicePicker(null)}
        >
          <View style={styles.choiceModalRoot}>
            <Pressable style={styles.choiceModalBackdrop} onPress={() => setChoicePicker(null)} />
            <View style={[styles.choiceModalCard, { backgroundColor: cardBackground, borderColor }]}>
              <View style={styles.choiceModalHeader}>
                <Text style={[styles.choiceModalTitle, { color: textColor }]}>{choicePicker?.heading}</Text>
                <Pressable onPress={() => setChoicePicker(null)} style={styles.choiceModalClose}>
                  <MaterialIcons name="close" size={23} color={secondaryText} />
                </Pressable>
              </View>
              {choicePicker?.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    choicePicker.onSelect(option);
                    setChoicePicker(null);
                  }}
                  style={[styles.choiceOption, { borderTopColor: borderColor }]}
                >
                  <Text style={[styles.choiceOptionText, { color: textColor }]}>{option}</Text>
                  <MaterialIcons name="chevron-right" size={23} color={mutedText} />
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  toast: {
    position: 'absolute',
    top: 74,
    alignSelf: 'center',
    zIndex: 50,
    minHeight: 46,
    borderRadius: 24,
    paddingHorizontal: 18,
    backgroundColor: '#17a56b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: { color: '#ffffff', ...fontSize.b2 },
  header: {
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideButton: { width: 82, height: 48, justifyContent: 'center', alignItems: 'flex-start' },
  headerCopy: { position: 'absolute', left: 96, right: 96, alignItems: 'center' },
  headerTitle: { ...fontSize.n3, textAlign: 'center' },
  headerSubtitle: { marginTop: 2, ...fontSize.reactionB5, textAlign: 'center' },
  saveDraftButton: { marginLeft: 'auto', width: 82, height: 48, justifyContent: 'center', alignItems: 'flex-end' },
  saveDraftText: { color: PRIMARY_COLOR, ...fontSize.b2 },
  stepper: {
    minHeight: 64,
    paddingHorizontal: 18,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: { width: '23%', alignItems: 'center', gap: 8 },
  stepDash: { width: 44, height: 5, borderRadius: 3 },
  stepLabel: { ...fontSize.reactionB5 },
  scroll: {flex: 1},
  content: { paddingHorizontal: 0, paddingTop: 10, paddingBottom: 28, gap: 22 },
  mainCard: {
    // borderRadius: 20,
    // borderWidth: 1,
    paddingHorizontal: 18,
    // shadowColor: '#0f172a',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.05,
    // shadowRadius: 10,
    // elevation: 2,
  },
  fieldLabel: { marginBottom: 9, ...fontSize.b2 },
  coverPicker: {
    height: 144,
    marginBottom: 22,
    borderRadius: 15,
    borderWidth: 1.5,
    borderStyle: 'solid',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  coverScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.25)' },
  coverReplacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.68)',
  },
  coverReplaceText: { color: '#ffffff', ...fontSize.b5 },
  coverTitle: { color: PRIMARY_COLOR, ...fontSize.b0 },
  coverHint: { ...fontSize.reactionB5 },
  videoFramePicker: { marginBottom: 15, gap: 10 },
  videoFrameHeading: { gap: 2 },
  videoFrameTitle: { ...fontSize.b2 },
  videoFrameHint: { ...fontSize.b6 },
  videoFramesLoading: {
    minHeight: 92,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  videoFrameRow: { gap: 10, paddingRight: 4 },
  videoFrameOption: {
    position: 'relative',
    width: 126,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  videoFrameImage: { width: '100%', height: '100%' },
  videoFrameTimeBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    minHeight: 22,
    borderRadius: 8,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoFrameTimeText: { color: '#ffffff', ...fontSize.b6 },
  videoFrameSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 22,
    ...fontSize.reactionB3,
  },
  categoryRow: { gap: 9, paddingBottom: 22 },
  categoryChip: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryText: { ...fontSize.b5 },
  multilineShell: {
    minHeight: 132,
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    marginBottom: 22,
  },
  multilineInput: { minHeight: 92, padding: 0, ...fontSize.reactionB3 },
  characterCount: { alignSelf: 'flex-end', ...fontSize.b6 },
  helperText: { marginTop: -17, ...fontSize.b6 },
  sectionHeading: { ...fontSize.n3, paddingHorizontal: 0 },
  requirementStack: { gap: 14, marginTop: 20 },
  requirementRow: {
    minHeight: 86,
    // borderRadius: 16,
    // borderWidth: 1,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  requirementLabel: { flex: 1, ...fontSize.b0 },
  requirementValue: { ...fontSize.reactionB5 },
  standaloneSection: { gap: 13 },
  challengeVideoSection: { paddingHorizontal: 18, gap: 12 },
  challengeVideoSectionInCard: { paddingHorizontal: 0 },
  basicsSectionDivider: { height: StyleSheet.hairlineWidth, marginVertical: 22 },
  optionalSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionalBadge: { minHeight: 24, borderRadius: 12, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  optionalBadgeText: { color: PRIMARY_COLOR, ...fontSize.b6 },
  optionalSectionCopy: { marginTop: -5, ...fontSize.reactionB5 },
  challengeVideoList: { gap: 9 },
  challengeVideoRow: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  challengeVideoIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  challengeVideoCopy: { flex: 1, minWidth: 0 },
  challengeVideoName: { ...fontSize.b2 },
  challengeVideoMeta: { marginTop: 2, ...fontSize.b6 },
  removeChallengeVideo: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  challengeVideoUpload: {
    minHeight: 72,
    borderRadius: 15,
    borderWidth: 1.5,
    borderStyle: 'solid',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeVideoUploadCopy: { flex: 1 },
  challengeVideoUploadTitle: { color: PRIMARY_COLOR, ...fontSize.b2 },
  challengeVideoUploadHint: { marginTop: 2, ...fontSize.b6 },
  wideSelection: {
    minHeight: 82,
    // borderRadius: 17,
    // borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  wideSelectionText: { flex: 1, ...fontSize.b0 },
  hashtagDisplay: {
    minHeight: 70,
    // borderRadius: 16,
    // borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hashtagIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hashtagValue: { flex: 1, ...fontSize.b0 },
  instructionsShell: { minHeight: 180, borderRadius: 17, padding: 16 },
  instructionsInput: { minHeight: 135, padding: 0, ...fontSize.reactionB3 },
  rewardStack: { gap: 11, marginTop: 18 },
  rewardRow: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  rewardIcon: { width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rewardCopy: { flex: 1, minWidth: 0 },
  rewardLabel: { ...fontSize.b6 },
  rewardValue: { marginTop: 2, ...fontSize.b5 },
  amountField: { width: 86, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  currency: { ...fontSize.b5 },
  amountInput: { flex: 1, padding: 0, textAlign: 'right', ...fontSize.b5 },
  inlineRewardInput: { minHeight: 30, padding: 0, ...fontSize.b5 },
  rewardsSectionSpacing: { marginTop: 30, marginBottom: 15 },
  modeSectionCopy: { marginTop: -8, marginBottom: 13, ...fontSize.reactionB5 },
  modeOptionStack: { gap: 10 },
  modeOption: {
    minHeight: 82,
    borderRadius: 15,
    borderWidth: 1.25,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeOptionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeOptionCopy: { flex: 1, minWidth: 0 },
  modeOptionTitle: { ...fontSize.b2 },
  modeOptionDescription: { marginTop: 3, ...fontSize.b6 },
  battleSetupCard: { marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 14 },
  battleSetupHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  battleSetupHeadingCopy: { flex: 1, minWidth: 0 },
  battleSetupTitle: { ...fontSize.n3 },
  battleSetupSubtitle: { marginTop: 3, ...fontSize.b6 },
  battleCountPill: { minWidth: 48, minHeight: 28, borderRadius: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  battleCountText: { color: PRIMARY_COLOR, ...fontSize.b5 },
  battleCreatorStack: { gap: 8 },
  battleCreatorRow: {
    minHeight: 66,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  battleHostRow: { minHeight: 70 },
  battleCreatorAvatar: { width: 44, height: 44, borderRadius: 22 },
  battleCreatorAvatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  battleCreatorCopy: { flex: 1, minWidth: 0 },
  battleCreatorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  battleCreatorName: { flexShrink: 1, ...fontSize.b5 },
  battleCreatorHandle: { marginTop: 2, ...fontSize.b6 },
  hostBadge: { minHeight: 25, borderRadius: 13, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  hostBadgeText: { color: PRIMARY_COLOR, ...fontSize.b6 },
  removeBattleCreatorButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  battleVersusRow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  battleVersusLine: { flex: 1, height: StyleSheet.hairlineWidth },
  battleVersusBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  battleVersusText: { color: '#ffffff', ...fontSize.b6 },
  addBattleCreatorButton: {
    minHeight: 68,
    marginTop: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  addBattleCreatorIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addBattleCreatorCopy: { flex: 1, minWidth: 0 },
  addBattleCreatorTitle: { color: PRIMARY_COLOR, ...fontSize.b5 },
  addBattleCreatorHint: { marginTop: 2, ...fontSize.b6 },
  battleNotice: { marginTop: 12, borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  battleNoticeText: { flex: 1, ...fontSize.b6 },
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  scheduleField: {
    width: '48.3%',
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleCopy: { flex: 1, minWidth: 0 },
  scheduleLabel: { ...fontSize.b6, letterSpacing: 0.5 },
  scheduleValue: { marginTop: 3, ...fontSize.b5Variant },
  toggleStack: { gap: 10 },
  toggleRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { flex: 1, ...fontSize.b5 },
  toggleDetail: { maxWidth: 70, ...fontSize.b6, textAlign: 'right' },
  judgingTitleRow: { marginTop: 28, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  judgingOptions: { borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 7 },
  judgingOptionDivider: { height: StyleSheet.hairlineWidth },
  battleScheduleHint: { marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  battleScheduleHintText: { flex: 1, ...fontSize.b6 },
  reachCard: { marginTop: 22, borderRadius: 15, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reachCopy: { flex: 1 },
  reachTitle: { color: PRIMARY_COLOR, ...fontSize.b5 },
  reachText: { marginTop: 2, ...fontSize.b6 },
  previewHeading: { ...fontSize.n3, marginHorizontal: 12 },
  previewChallengeCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginHorizontal: 12 },
  previewCover: { height: 246, position: 'relative', justifyContent: 'flex-start', alignItems: 'flex-start', padding: 22 },
  previewCoverScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.16)' },
  previewCategory: { color: '#ffffff', ...fontSize.b1 },
  previewBody: { padding: 24 },
  previewTitle: { ...fontSize.n1 },
  creatorPreviewRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorPreviewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  creatorPreviewHandle: { ...fontSize.handleTextMedium },
  previewChipRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prizeChip: { minHeight: 38, borderRadius: 20, paddingHorizontal: 14, backgroundColor: '#effcf4', justifyContent: 'center' },
  prizeChipText: { color: '#148148', ...fontSize.b5 },
  dateChip: { minHeight: 38, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  dateChipText: { ...fontSize.b5 },
  previewInfoCard: { borderRadius: 19, borderWidth: 1, padding: 22, flexDirection: 'row', gap: 17, marginHorizontal: 12 },
  previewInfoIcon: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewInfoCopy: { flex: 1, minWidth: 0 },
  previewInfoHeading: { ...fontSize.reactionB1, marginBottom: 8 },
  previewInfoText: { ...fontSize.reactionB3 },
  bulletList: { gap: 4 },
  previewBattleStack: { gap: 9 },
  previewBattleParticipant: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewBattleAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  previewBattleName: { flexShrink: 1, ...fontSize.reactionB3 },
  previewBattleHint: { marginTop: 2, ...fontSize.b6 },
  footer: {
    minHeight: 84,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerPrimaryButton: { flex: 1.2, borderColor: PRIMARY_COLOR, backgroundColor: PRIMARY_COLOR },
  footerSecondaryText: { color: PRIMARY_COLOR, ...fontSize.b0 },
  footerPrimaryText: { color: '#ffffff', ...fontSize.b0 },
  publishProgressRow: { flex: 1, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  publishProgressText: { flexShrink: 1, color: '#ffffff', ...fontSize.b5 },
  disabledButton: { opacity: 0.5 },
  datePickerModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  datePickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  datePickerModalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  datePickerModalHeader: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  datePickerModalTitle: { ...fontSize.n3, textAlign: 'center' },
  iosDatePicker: { alignSelf: 'center', width: '100%' },
  iosCalendarPicker: { height: 335 },
  iosTimePicker: { height: 216 },
  datePickerModalActions: {
    minHeight: 54,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  datePickerModalButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  datePickerModalActionDivider: { width: StyleSheet.hairlineWidth },
  datePickerModalCancelText: { ...fontSize.b2 },
  datePickerModalDoneText: { color: PRIMARY_COLOR, ...fontSize.b2 },
  creatorPickerModalRoot: { flex: 1, justifyContent: 'flex-end' },
  creatorPickerModalCard: {
    maxHeight: '88%',
    minHeight: '68%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 9,
    overflow: 'hidden',
  },
  creatorPickerHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center' },
  creatorPickerHeader: { minHeight: 74, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  creatorPickerHeaderCopy: { flex: 1, minWidth: 0 },
  creatorPickerTitle: { ...fontSize.n3 },
  creatorPickerSubtitle: { marginTop: 3, ...fontSize.b6 },
  creatorSearchBox: {
    height: 52,
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  creatorSearchInput: { flex: 1, height: '100%', padding: 0, ...fontSize.reactionB3 },
  creatorSearchClear: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  creatorPickerResults: { flex: 1, paddingHorizontal: 18 },
  creatorPickerResultsContent: { paddingBottom: 12, gap: 9, flexGrow: 1 },
  creatorPickerState: { flex: 1, minHeight: 230, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 8 },
  creatorPickerStateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  creatorPickerStateTitle: { ...fontSize.b2, textAlign: 'center' },
  creatorPickerStateText: { ...fontSize.b6, textAlign: 'center' },
  creatorPickerRetry: { minHeight: 38, marginTop: 5, borderRadius: 19, borderWidth: 1, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  creatorPickerRetryText: { color: PRIMARY_COLOR, ...fontSize.b5 },
  creatorResultRow: {
    minHeight: 72,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  creatorResultDisabled: { opacity: 0.45 },
  creatorResultAvatar: { width: 48, height: 48, borderRadius: 24 },
  creatorResultAvatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  creatorResultCopy: { flex: 1, minWidth: 0 },
  creatorResultName: { flexShrink: 1, ...fontSize.b5 },
  creatorResultMeta: { marginTop: 3, ...fontSize.b6 },
  creatorPickerFooter: {
    minHeight: 82,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  creatorPickerFooterHint: { flex: 1, ...fontSize.b6 },
  creatorPickerDone: { minWidth: 104, minHeight: 48, borderRadius: 24, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  creatorPickerDoneText: { color: '#ffffff', ...fontSize.b2 },
  choiceModalRoot: { flex: 1, justifyContent: 'flex-end' },
  choiceModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  choiceModalCard: {
    margin: 18,
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
    overflow: 'hidden',
  },
  choiceModalHeader: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  choiceModalTitle: { flex: 1, ...fontSize.n3 },
  choiceModalClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  choiceOption: {
    minHeight: 58,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceOptionText: { flex: 1, ...fontSize.reactionB3 },
});

export default CreateChallengeWizard;
