import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';
import { useCreateLive } from '../src/hooks/live/useLive';
import type { LiveCategory, LiveOrientation, LiveStreamQuality } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';

type Screen = 'setup' | 'more-settings';
type Audience = 'public' | 'subscribers';
type Category = 'Music' | 'Gaming' | 'Talk show' | 'Lifestyle' | 'Education';
type StreamQualityLabel = '720p · 30fps' | '1080p · 30fps' | '1080p · 60fps';
type StreamOrientationLabel = 'Portrait' | 'Landscape' | 'Auto-rotate';
type ScheduleDay = 'Today' | 'Tomorrow' | 'This weekend';
type ScheduleTime = '10:00 AM' | '2:00 PM' | '7:00 PM' | '9:00 PM';
type SheetName =
  | 'category'
  | 'audience'
  | 'quality'
  | 'preview'
  | 'moderation'
  | 'age-restriction'
  | 'schedule'
  | 'device-check'
  | 'orientation'
  | 'network'
  | 'guidelines';
type CheckStatus = 'idle' | 'checking' | 'ready' | 'blocked';

const ICON_COLOR = '#000000';
const ICON_BACKGROUND = 'rgba(0,0,0,0.1)';

const categoryPayloadValues: Record<Category, LiveCategory> = {
  Music: 'music',
  Gaming: 'gaming',
  'Talk show': 'talk_show',
  Lifestyle: 'lifestyle',
  Education: 'education',
};

const qualityPayloadValues: Record<StreamQualityLabel, LiveStreamQuality> = {
  '720p · 30fps': '720p_30fps',
  '1080p · 30fps': '1080p_30fps',
  '1080p · 60fps': '1080p_60fps',
};

const orientationPayloadValues: Record<StreamOrientationLabel, LiveOrientation> = {
  Portrait: 'portrait',
  Landscape: 'landscape',
  'Auto-rotate': 'auto_rotate',
};

const scheduleDays: ScheduleDay[] = ['Today', 'Tomorrow', 'This weekend'];
const scheduleTimes: ScheduleTime[] = ['10:00 AM', '2:00 PM', '7:00 PM', '9:00 PM'];
const scheduleHours: Record<ScheduleTime, number> = {
  '10:00 AM': 10,
  '2:00 PM': 14,
  '7:00 PM': 19,
  '9:00 PM': 21,
};

const buildScheduledAt = (day: ScheduleDay, time: ScheduleTime, now = new Date()): string | null => {
  const scheduled = new Date(now);

  if (day === 'Tomorrow') {
    scheduled.setDate(scheduled.getDate() + 1);
  } else if (day === 'This weekend') {
    const currentDay = scheduled.getDay();
    const daysUntilSaturday = currentDay === 0 ? 0 : (6 - currentDay + 7) % 7;
    scheduled.setDate(scheduled.getDate() + daysUntilSaturday);
  }

  scheduled.setHours(scheduleHours[time], 0, 0, 0);

  if (scheduled.getTime() <= now.getTime() && day === 'This weekend' && now.getDay() === 6) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled.getTime() > now.getTime() ? scheduled.toISOString() : null;
};

const parseBlockedWords = (value: string): string[] => (
  Array.from(new Set(value.split(',').map((word) => word.trim()).filter(Boolean)))
);

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const categoryOptions: ChoiceOption<Category>[] = [
  { value: 'Music', label: 'Music', description: 'Performances, sessions and listening parties', icon: 'music-note' },
  { value: 'Gaming', label: 'Gaming', description: 'Gameplay, walkthroughs and live reactions', icon: 'sports-esports' },
  { value: 'Talk show', label: 'Talk show', description: 'Conversations, interviews and Q&As', icon: 'record-voice-over' },
  { value: 'Lifestyle', label: 'Lifestyle', description: 'Wellness, fashion, food and daily life', icon: 'favorite-outline' },
  { value: 'Education', label: 'Education', description: 'Tutorials, lessons and live workshops', icon: 'school' },
];

const audienceOptions: ChoiceOption<Audience>[] = [
  { value: 'public', label: 'Public', description: 'Anyone can discover and join your live stream', icon: 'public' },
  { value: 'subscribers', label: 'Subscribers only', description: 'Only your subscribers can join this live', icon: 'stars' },
];

const qualityOptions: ChoiceOption<StreamQualityLabel>[] = [
  { value: '720p · 30fps', label: '720p · 30fps', description: 'Balanced quality with lower data usage', icon: 'speed' },
  { value: '1080p · 30fps', label: '1080p · 30fps', description: 'Sharp Full HD video for most streams', icon: 'hd' },
  { value: '1080p · 60fps', label: '1080p · 60fps', description: 'Smooth Full HD video with higher data usage', icon: 'high-quality' },
];

const orientationOptions: ChoiceOption<StreamOrientationLabel>[] = [
  { value: 'Portrait', label: 'Portrait', description: 'Best for the Kulsah mobile feed', icon: 'stay-current-portrait' },
  { value: 'Landscape', label: 'Landscape', description: 'Best for games and wide scenes', icon: 'stay-current-landscape' },
  { value: 'Auto-rotate', label: 'Auto-rotate', description: 'Follow your device orientation', icon: 'screen-rotation' },
];

const ageOptions: ChoiceOption<'everyone' | 'restricted'>[] = [
  { value: 'everyone', label: 'Everyone', description: 'Your live can be viewed by people of all ages', icon: 'people-outline' },
  { value: 'restricted', label: '18+ only', description: 'Viewers must confirm they are at least 18', icon: '18-up-rating' },
];

interface SheetShellProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  cardColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  children: React.ReactNode;
  onClose: () => void;
}

const SheetShell: React.FC<SheetShellProps> = ({
  visible,
  title,
  subtitle,
  cardColor,
  borderColor,
  textColor,
  mutedColor,
  children,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.sheetRoot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${title}`}
        style={styles.sheetBackdrop}
        onPress={onClose}
      />
      <SafeAreaView
        accessibilityViewIsModal
        edges={['bottom']}
        style={[styles.sheetCard, { backgroundColor: cardColor, borderColor }]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: borderColor }]} />
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderCopy}>
            <Text style={[styles.sheetTitle, { color: textColor }]}>{title}</Text>
            {subtitle ? <Text style={[styles.sheetSubtitle, { color: mutedColor }]}>{subtitle}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            onPress={onClose}
            style={({ pressed }) => [styles.sheetCloseButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="close" size={24} color={mutedColor} />
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>
);

interface ChoiceSheetProps<T extends string> extends Omit<SheetShellProps, 'children'> {
  options: ChoiceOption<T>[];
  value: T;
  onSelect: (value: T) => void;
}

const ChoiceSheet = <T extends string>({ options, value, onSelect, onClose, ...shellProps }: ChoiceSheetProps<T>) => (
  <SheetShell {...shellProps} onClose={onClose}>
    <View style={styles.choiceList}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => {
              onSelect(option.value);
              onClose();
            }}
            style={({ pressed }) => [
              styles.choiceRow,
              { borderColor: isSelected ? PRIMARY_COLOR : shellProps.borderColor },
              isSelected && { backgroundColor: primaryColorAlpha(0.08) },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.choiceIcon, { backgroundColor: ICON_BACKGROUND }]}>
              <MaterialIcons name={option.icon} size={24} color={ICON_COLOR} />
            </View>
            <View style={styles.choiceCopy}>
              <Text style={[styles.choiceLabel, { color: shellProps.textColor }]}>{option.label}</Text>
              <Text style={[styles.choiceDescription, { color: shellProps.mutedColor }]}>{option.description}</Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: isSelected ? PRIMARY_COLOR : shellProps.mutedColor }]}>
              {isSelected ? <View style={styles.radioInner} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  </SheetShell>
);

interface MoreSettingRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  color: string;
  separator?: boolean;
  trailing: React.ReactNode;
  onPress?: () => void;
}

const MoreSettingRow: React.FC<MoreSettingRowProps> = ({
  icon,
  title,
  description,
  color,
  separator = true,
  trailing,
  onPress,
}) => {
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: ICON_BACKGROUND }]}>
        <MaterialIcons name={icon} size={24} color={ICON_COLOR} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color }]}>{title}</Text>
        <Text style={[styles.rowDescription, { color, opacity: 0.65 }]}>{description}</Text>
      </View>
      {trailing}
    </>
  );

  const rowStyle = [styles.moreRow, separator && styles.moreRowSeparator];

  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>{content}</Pressable>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
};

const LiveCreationSetup: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [screen, setScreen] = useState<Screen>('setup');
  const [activeSheet, setActiveSheet] = useState<SheetName | null>(null);
  const [title, setTitle] = useState('Sunday vibes ✨ let\'s chill and sing together 💜');
  const [category, setCategory] = useState<Category>('Music');
  const [audience, setAudience] = useState<Audience>('public');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quality, setQuality] = useState<StreamQualityLabel>('1080p · 60fps');
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [orientation, setOrientation] = useState<StreamOrientationLabel>('Portrait');
  const [profanityFilterEnabled, setProfanityFilterEnabled] = useState(true);
  const [followersOnlyChat, setFollowersOnlyChat] = useState(false);
  const [slowModeEnabled, setSlowModeEnabled] = useState(false);
  const [blockedWords, setBlockedWords] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDay, setScheduleDay] = useState<ScheduleDay>('Tomorrow');
  const [scheduleTime, setScheduleTime] = useState<ScheduleTime>('7:00 PM');
  const [deviceCheckStatus, setDeviceCheckStatus] = useState<CheckStatus>('idle');
  const [networkCheckStatus, setNetworkCheckStatus] = useState<CheckStatus>('idle');
  const [networkSummary, setNetworkSummary] = useState('Ready to test your connection');
  const [networkType, setNetworkType] = useState('Not checked');
  const createLive = useCreateLive();

  const background = isDark ? theme.screen : '#ffffff';
  const card = isDark ? theme.card : '#ffffff';
  const text = theme.text;
  const muted = isDark ? '#a1a1aa' : theme.textSecondary;
  const border = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.1)';
  const switchOff = isDark ? '#3f3f46' : '#d4d4d8';
  const sheetProps = {
    cardColor: card,
    borderColor: border,
    textColor: text,
    mutedColor: muted,
  };

  const ensureBroadcastPermissions = async (showAlert = true) => {
    const [nextCameraPermission, nextMicrophonePermission] = await Promise.all([
      cameraPermission?.granted ? Promise.resolve(cameraPermission) : requestCameraPermission(),
      microphonePermission?.granted ? Promise.resolve(microphonePermission) : requestMicrophonePermission(),
    ]);

    if (!nextCameraPermission?.granted || !nextMicrophonePermission?.granted) {
      if (showAlert) {
        Alert.alert('Permissions required', 'Camera and microphone access are required before starting a live stream.');
      }
      return false;
    }

    return true;
  };

  const handleGoLive = async () => {
    if (!title.trim() || createLive.isPending) return;

    const scheduledAt = scheduleEnabled ? buildScheduledAt(scheduleDay, scheduleTime) : null;
    if (scheduleEnabled && !scheduledAt) {
      Alert.alert('Choose a future time', 'The selected schedule time has already passed. Choose a later time to continue.');
      setActiveSheet('schedule');
      return;
    }

    const moderationBlockedWords = parseBlockedWords(blockedWords);
    if (moderationBlockedWords.some((word) => word.length > 100)) {
      Alert.alert('Blocked word is too long', 'Each blocked word or phrase must be 100 characters or fewer.');
      setScreen('more-settings');
      setActiveSheet('moderation');
      return;
    }

    try {
      if (!scheduleEnabled && !await ensureBroadcastPermissions()) return;

      const live = await createLive.mutateAsync({
        title: title.trim(),
        category: categoryPayloadValues[category],
        visibility: subscriberOnly || audience === 'subscribers' ? 'subscribers' : 'public',
        scheduled_at: scheduledAt,
        notify_followers: notificationsEnabled,
        recording_enabled: recordingEnabled,
        chat_enabled: chatEnabled,
        gifts_enabled: giftsEnabled,
        age_restricted: ageRestricted,
        stream_quality: qualityPayloadValues[quality],
        orientation: orientationPayloadValues[orientation],
        moderation: {
          profanity_filter_enabled: profanityFilterEnabled,
          followers_only_chat: followersOnlyChat,
          slow_mode_seconds: slowModeEnabled ? 10 : null,
          blocked_words: moderationBlockedWords,
        },
      });

      if (scheduleEnabled) {
        Alert.alert(
          'Live scheduled',
          `Your live is scheduled for ${scheduleDay.toLowerCase()} at ${scheduleTime}.`,
          [{ text: 'Done', onPress: () => navigation.navigate('MainTabs') }],
        );
        return;
      }

      navigation.replace('CreatorLiveStream', {
        liveSessionId: live.id,
        initialLive: live,
        quality: live.stream_quality,
      });
    } catch (error) {
      Alert.alert(scheduleEnabled ? 'Could not schedule Live' : 'Could not create Live', getApiErrorMessage(error));
    }
  };

  const handleDeviceCheck = async () => {
    setActiveSheet('device-check');
    setDeviceCheckStatus('checking');

    try {
      const isReady = await ensureBroadcastPermissions(false);
      setDeviceCheckStatus(isReady ? 'ready' : 'blocked');
    } catch {
      setDeviceCheckStatus('blocked');
    }
  };

  const handleNetworkDiagnostics = async () => {
    setActiveSheet('network');
    setNetworkCheckStatus('checking');
    setNetworkSummary('Testing your current connection…');

    try {
      const connection = await NetInfo.fetch();
      const isOnline = connection.isConnected && connection.isInternetReachable !== false;
      const typeLabel = connection.type === 'none' || connection.type === 'unknown'
        ? 'Unknown connection'
        : connection.type.charAt(0).toUpperCase() + connection.type.slice(1);

      setNetworkType(typeLabel);
      if (!isOnline) {
        setNetworkCheckStatus('blocked');
        setNetworkSummary('No reliable internet connection was detected');
        return;
      }

      setNetworkCheckStatus('ready');
      setNetworkSummary(
        connection.type === 'wifi' || connection.type === 'ethernet'
          ? 'Excellent — ready for high-quality streaming'
          : 'Good — 720p is recommended on this connection',
      );
    } catch {
      setNetworkCheckStatus('blocked');
      setNetworkSummary('The connection test could not be completed');
      setNetworkType('Unavailable');
    }
  };

  const handleAudienceChange = (value: Audience) => {
    setAudience(value);
    setSubscriberOnly(value === 'subscribers');
  };

  const chevron = <MaterialIcons name="chevron-right" size={28} color={muted} />;

  const renderBackChevron = (onPress: () => void, testID: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      testID={testID}
      onPress={onPress}
      style={
        ({ pressed }) => [
          // styles.backChevron, 
          { borderColor: border, backgroundColor: card }, 
          pressed && styles.pressed]}
    >
      <MaterialIcons name="chevron-left" size={29} color={text} />
    </Pressable>
  );

  const renderSheets = () => (
    <>
      <ChoiceSheet
        visible={activeSheet === 'category'}
        title="Choose a category"
        subtitle="Help the right audience discover your live."
        options={categoryOptions}
        value={category}
        onSelect={setCategory}
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      />

      <ChoiceSheet
        visible={activeSheet === 'audience'}
        title="Choose your audience"
        subtitle="Control who can discover and join this stream."
        options={audienceOptions}
        value={audience}
        onSelect={handleAudienceChange}
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      />

      <ChoiceSheet
        visible={activeSheet === 'quality'}
        title="Stream quality"
        subtitle="Higher quality uses more data and needs a stronger connection."
        options={qualityOptions}
        value={quality}
        onSelect={setQuality}
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      />

      <ChoiceSheet
        visible={activeSheet === 'orientation'}
        title="Stream orientation"
        subtitle="Choose how viewers will see your broadcast."
        options={orientationOptions}
        value={orientation}
        onSelect={setOrientation}
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      />

      <ChoiceSheet
        visible={activeSheet === 'age-restriction'}
        title="Age restriction"
        subtitle="Choose the age rating that fits your live."
        options={ageOptions}
        value={ageRestricted ? 'restricted' : 'everyone'}
        onSelect={(value) => setAgeRestricted(value === 'restricted')}
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      />

      <SheetShell
        visible={activeSheet === 'preview'}
        title="For You feed preview"
        subtitle="This is how your live card may appear before someone joins."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        <View style={[styles.previewFrame, { borderColor: border }]}>
          <LinearGradient colors={['#111827', '#312e81', '#6d28d9']} style={styles.previewGradient}>
            <View style={styles.previewTopRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              <View style={styles.viewerBadge}>
                <MaterialIcons name="visibility" size={14} color="#ffffff" />
                <Text style={styles.viewerBadgeText}>Preview</Text>
              </View>
            </View>
            <View style={styles.previewCenter}>
              <View style={styles.previewAvatar}>
                <MaterialIcons name="person" size={34} color="#ffffff" />
              </View>
              <Text style={styles.previewCreator}>Your creator profile</Text>
            </View>
            <View style={styles.previewBottom}>
              <Text style={styles.previewTitle} numberOfLines={2}>{title.trim() || 'Untitled live stream'}</Text>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMeta}>{category}</Text>
                <View style={styles.previewMetaDot} />
                <Text style={styles.previewMeta}>{audience === 'public' ? 'Public' : 'Subscribers only'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveSheet(null)}
          style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}
        >
          <Text style={styles.primarySheetButtonText}>Looks good</Text>
        </Pressable>
      </SheetShell>

      <SheetShell
        visible={activeSheet === 'moderation'}
        title="Moderation tools"
        subtitle="Set the tone for chat before your live begins."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionTitle, { color: text }]}>Chat filters</Text>
          <View style={[styles.controlGroup, { borderColor: border }]}>
            <View style={[styles.controlRow, { borderBottomColor: border }]}>
              <View style={styles.controlCopy}>
                <Text style={[styles.controlTitle, { color: text }]}>Filter offensive comments</Text>
                <Text style={[styles.controlDescription, { color: muted }]}>Automatically hide potentially harmful language</Text>
              </View>
              <Switch accessibilityLabel="Filter offensive comments" value={profanityFilterEnabled} onValueChange={setProfanityFilterEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />
            </View>
            <View style={[styles.controlRow, { borderBottomColor: border }]}>
              <View style={styles.controlCopy}>
                <Text style={[styles.controlTitle, { color: text }]}>Followers-only chat</Text>
                <Text style={[styles.controlDescription, { color: muted }]}>Only followers can send messages</Text>
              </View>
              <Switch accessibilityLabel="Followers-only chat" value={followersOnlyChat} onValueChange={setFollowersOnlyChat} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />
            </View>
            <View style={styles.controlRow}>
              <View style={styles.controlCopy}>
                <Text style={[styles.controlTitle, { color: text }]}>Slow mode</Text>
                <Text style={[styles.controlDescription, { color: muted }]}>Limit viewers to one message every 10 seconds</Text>
              </View>
              <Switch accessibilityLabel="Slow mode" value={slowModeEnabled} onValueChange={setSlowModeEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />
            </View>
          </View>
        </View>
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionTitle, { color: text }]}>Blocked words</Text>
          <TextInput
            accessibilityLabel="Blocked words"
            value={blockedWords}
            onChangeText={setBlockedWords}
            placeholder="Add words separated by commas"
            placeholderTextColor={muted}
            multiline
            style={[styles.blockedWordsInput, { color: text, borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}
          />
          <Text style={[styles.inputHint, { color: muted }]}>Comments containing these words will be hidden from the live chat.</Text>
        </View>
        <Pressable onPress={() => setActiveSheet(null)} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
          <Text style={styles.primarySheetButtonText}>Save moderation settings</Text>
        </Pressable>
      </SheetShell>

      <SheetShell
        visible={activeSheet === 'schedule'}
        title="Schedule live"
        subtitle="Pick a time to let your audience know in advance."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionTitle, { color: text }]}>Day</Text>
          <View style={styles.chipWrap}>
            {scheduleDays.map((day) => {
              const selected = scheduleDay === day;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setScheduleDay(day)}
                  style={({ pressed }) => [styles.choiceChip, { borderColor: selected ? PRIMARY_COLOR : border, backgroundColor: selected ? primaryColorAlpha(0.1) : 'transparent' }, pressed && styles.pressed]}
                >
                  <Text style={[styles.choiceChipText, { color: selected ? PRIMARY_COLOR : text }]}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionTitle, { color: text }]}>Start time</Text>
          <View style={styles.chipWrap}>
            {scheduleTimes.map((time) => {
              const selected = scheduleTime === time;
              return (
                <Pressable
                  key={time}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setScheduleTime(time)}
                  style={({ pressed }) => [styles.choiceChip, { borderColor: selected ? PRIMARY_COLOR : border, backgroundColor: selected ? primaryColorAlpha(0.1) : 'transparent' }, pressed && styles.pressed]}
                >
                  <Text style={[styles.choiceChipText, { color: selected ? PRIMARY_COLOR : text }]}>{time}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={[styles.scheduleSummary, { backgroundColor: primaryColorAlpha(0.08) }]}>
          <View style={styles.inlineIcon}>
            <MaterialIcons name="event-available" size={22} color={ICON_COLOR} />
          </View>
          <View style={styles.scheduleSummaryCopy}>
            <Text style={[styles.scheduleSummaryTitle, { color: text }]}>{scheduleDay} at {scheduleTime}</Text>
            <Text style={[styles.scheduleSummaryDescription, { color: muted }]}>Followers will receive a reminder before you start.</Text>
          </View>
        </View>
        <View style={styles.sheetButtonRow}>
          {scheduleEnabled ? (
            <Pressable
              onPress={() => {
                setScheduleEnabled(false);
                setActiveSheet(null);
              }}
              style={({ pressed }) => [styles.secondarySheetButton, { borderColor: border }, pressed && styles.pressed]}
            >
              <Text style={[styles.secondarySheetButtonText, { color: text }]}>Remove</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              setScheduleEnabled(true);
              setActiveSheet(null);
            }}
            style={({ pressed }) => [styles.primarySheetButton, styles.flexButton, pressed && styles.pressed]}
          >
            <Text style={styles.primarySheetButtonText}>{scheduleEnabled ? 'Update schedule' : 'Schedule live'}</Text>
          </Pressable>
        </View>
      </SheetShell>

      <SheetShell
        visible={activeSheet === 'device-check'}
        title="Camera & mic check"
        subtitle="Make sure your device is ready before you go live."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        <View style={[styles.statusHero, { backgroundColor: primaryColorAlpha(0.08) }]}>
          {deviceCheckStatus === 'checking' ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          ) : (
            <MaterialIcons
              name={deviceCheckStatus === 'ready' ? 'check-circle' : 'error-outline'}
              size={52}
              color={deviceCheckStatus === 'ready' ? '#16a34a' : '#dc2626'}
            />
          )}
          <Text style={[styles.statusHeroTitle, { color: text }]}>
            {deviceCheckStatus === 'checking' ? 'Checking your device…' : deviceCheckStatus === 'ready' ? 'You’re ready to stream' : 'Permissions are needed'}
          </Text>
          <Text style={[styles.statusHeroDescription, { color: muted }]}>
            {deviceCheckStatus === 'checking'
              ? 'Please respond to any permission prompts.'
              : deviceCheckStatus === 'ready'
                ? 'Your camera and microphone are available.'
                : 'Allow camera and microphone access in your device settings, then try again.'}
          </Text>
        </View>
        <View style={[styles.diagnosticGroup, { borderColor: border }]}>
          <View style={[styles.diagnosticRow, { borderBottomColor: border }]}>
            <View style={styles.inlineIcon}>
              <MaterialIcons name="videocam" size={21} color={ICON_COLOR} />
            </View>
            <Text style={[styles.diagnosticLabel, { color: text }]}>Camera</Text>
            <Text style={[styles.diagnosticValue, { color: deviceCheckStatus === 'ready' ? '#16a34a' : muted }]}>{deviceCheckStatus === 'ready' ? 'Ready' : 'Checking'}</Text>
          </View>
          <View style={styles.diagnosticRow}>
            <View style={styles.inlineIcon}>
              <MaterialIcons name="mic" size={21} color={ICON_COLOR} />
            </View>
            <Text style={[styles.diagnosticLabel, { color: text }]}>Microphone</Text>
            <Text style={[styles.diagnosticValue, { color: deviceCheckStatus === 'ready' ? '#16a34a' : muted }]}>{deviceCheckStatus === 'ready' ? 'Ready' : 'Checking'}</Text>
          </View>
        </View>
        {deviceCheckStatus === 'blocked' ? (
          <Pressable onPress={() => void handleDeviceCheck()} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
            <Text style={styles.primarySheetButtonText}>Try again</Text>
          </Pressable>
        ) : deviceCheckStatus === 'ready' ? (
          <Pressable onPress={() => setActiveSheet(null)} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
            <Text style={styles.primarySheetButtonText}>Done</Text>
          </Pressable>
        ) : null}
      </SheetShell>

      <SheetShell
        visible={activeSheet === 'network'}
        title="Network diagnostics"
        subtitle="Check whether your connection is ready for streaming."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        <View style={[styles.statusHero, { backgroundColor: primaryColorAlpha(0.08) }]}>
          {networkCheckStatus === 'checking' ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          ) : (
            <MaterialIcons
              name={networkCheckStatus === 'ready' ? 'wifi' : 'wifi-off'}
              size={52}
              color={networkCheckStatus === 'ready' ? '#16a34a' : '#dc2626'}
            />
          )}
          <Text style={[styles.statusHeroTitle, { color: text }]}>{networkCheckStatus === 'checking' ? 'Running connection test…' : networkSummary}</Text>
          <Text style={[styles.statusHeroDescription, { color: muted }]}>Results reflect your current connection and can change while streaming.</Text>
        </View>
        <View style={[styles.diagnosticGroup, { borderColor: border }]}>
          <View style={[styles.diagnosticRow, { borderBottomColor: border }]}>
            <View style={styles.inlineIcon}>
              <MaterialIcons name="settings-ethernet" size={21} color={ICON_COLOR} />
            </View>
            <Text style={[styles.diagnosticLabel, { color: text }]}>Connection</Text>
            <Text style={[styles.diagnosticValue, { color: muted }]}>{networkType}</Text>
          </View>
          <View style={styles.diagnosticRow}>
            <View style={styles.inlineIcon}>
              <MaterialIcons name="high-quality" size={21} color={ICON_COLOR} />
            </View>
            <Text style={[styles.diagnosticLabel, { color: text }]}>Recommended</Text>
            <Text style={[styles.diagnosticValue, { color: muted }]}>{networkCheckStatus === 'ready' ? quality : '—'}</Text>
          </View>
        </View>
        {networkCheckStatus !== 'checking' ? (
          <Pressable onPress={() => void handleNetworkDiagnostics()} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
            <Text style={styles.primarySheetButtonText}>Run test again</Text>
          </Pressable>
        ) : null}
      </SheetShell>

      <SheetShell
        visible={activeSheet === 'guidelines'}
        title="Community guidelines"
        subtitle="A few simple principles keep every Kulsah live welcoming."
        onClose={() => setActiveSheet(null)}
        {...sheetProps}
      >
        {[
          { icon: 'favorite-outline' as const, title: 'Be respectful', description: 'No harassment, hate speech, bullying or targeted abuse.' },
          { icon: 'verified-user' as const, title: 'Keep people safe', description: 'Do not share private information or encourage dangerous behavior.' },
          { icon: 'copyright' as const, title: 'Share what you can use', description: 'Only stream content you created or have permission to broadcast.' },
        ].map((item) => (
          <View key={item.title} style={[styles.guidelineRule, { borderColor: border }]}>
            <View style={[styles.choiceIcon, { backgroundColor: ICON_BACKGROUND }]}>
              <MaterialIcons name={item.icon} size={24} color={ICON_COLOR} />
            </View>
            <View style={styles.choiceCopy}>
              <Text style={[styles.choiceLabel, { color: text }]}>{item.title}</Text>
              <Text style={[styles.choiceDescription, { color: muted }]}>{item.description}</Text>
            </View>
          </View>
        ))}
        <Pressable onPress={() => setActiveSheet(null)} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
          <Text style={styles.primarySheetButtonText}>I understand</Text>
        </Pressable>
      </SheetShell>
    </>
  );

  if (screen === 'more-settings') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top', 'bottom']}>
        <View style={[styles.screen, { backgroundColor: background }]}>
          <View style={styles.chevronOnly}>{renderBackChevron(() => setScreen('setup'), 'more-live-settings-back')}</View>
          <ScrollView contentContainerStyle={styles.moreContent} showsVerticalScrollIndicator={false}>
            <View style={styles.intro}>
              <Text style={[styles.pageTitle, { color: text }]}>More Settings</Text>
              <Text style={[styles.pageSubtitle, { color: muted }]}>Advanced options to level up your live.</Text>
            </View>

            <View style={[styles.settingsGroup, { borderColor: border, backgroundColor: card }]}>
              <MoreSettingRow icon="videocam" title="Save Recording" description="Automatically save a copy of your live stream" color={text} trailing={<Switch accessibilityLabel="Save recording" value={recordingEnabled} onValueChange={setRecordingEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="chat-bubble-outline" title="Chat Enabled" description="Allow viewers to send messages" color={text} trailing={<Switch accessibilityLabel="Enable chat" value={chatEnabled} onValueChange={setChatEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="card-giftcard" title="Gifts Enabled" description="Viewers can send gifts during your live" color={text} trailing={<Switch accessibilityLabel="Enable gifts" value={giftsEnabled} onValueChange={setGiftsEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="stars" title="Subscriber-only Live" description="Only your subscribers can join this live" color={text} separator={false} trailing={<Switch accessibilityLabel="Subscribers only" value={subscriberOnly} onValueChange={(enabled) => { setSubscriberOnly(enabled); setAudience(enabled ? 'subscribers' : 'public'); }} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
            </View>

            <View style={[styles.settingsGroup, { borderColor: border, backgroundColor: card }]}>
              <MoreSettingRow icon="shield" title="Moderation Tools" description="Manage blocked words, muting and filters" color={text} trailing={chevron} onPress={() => setActiveSheet('moderation')} />
              <MoreSettingRow icon="18-up-rating" title="Age Restriction" description="Restrict your stream to viewers 18+" color={text} trailing={<View style={styles.trailingWithChevron}><Text style={[styles.trailingValue, { color: ageRestricted ? PRIMARY_COLOR : muted }]}>{ageRestricted ? '18+ Only' : 'Everyone'}</Text>{chevron}</View>} onPress={() => setActiveSheet('age-restriction')} />
              <MoreSettingRow icon="calendar-month" title="Schedule Live" description="Plan your live and notify your audience" color={text} separator={false} trailing={<View style={styles.trailingWithChevron}>{scheduleEnabled ? <Text style={[styles.trailingValue, { color: PRIMARY_COLOR }]}>{scheduleDay}</Text> : null}{chevron}</View>} onPress={() => setActiveSheet('schedule')} />
            </View>

            <View style={[styles.settingsGroup, { borderColor: border, backgroundColor: card }]}>
              <MoreSettingRow icon="graphic-eq" title="Camera & Mic Check" description="Check your camera and microphone" color={text} trailing={<View style={styles.trailingWithChevron}>{deviceCheckStatus === 'ready' ? <Text style={styles.goodValue}>Ready</Text> : null}{chevron}</View>} onPress={() => void handleDeviceCheck()} />
              <MoreSettingRow icon="screen-rotation" title="Stream Orientation" description="Choose how your stream will appear" color={text} trailing={<View style={styles.trailingWithChevron}><Text style={[styles.trailingValue, { color: muted }]}>{orientation}</Text>{chevron}</View>} onPress={() => setActiveSheet('orientation')} />
              <MoreSettingRow icon="wifi" title="Network / Quality Diagnostics" description="Test your connection and stream quality" color={text} separator={false} trailing={<View style={styles.trailingWithChevron}>{networkCheckStatus === 'ready' ? <Text style={styles.goodValue}>Ready</Text> : null}{chevron}</View>} onPress={() => void handleNetworkDiagnostics()} />
            </View>

            <Pressable onPress={() => setActiveSheet('guidelines')} style={({ pressed }) => [styles.guidelinesCard, { borderColor: primaryColorAlpha(0.22), backgroundColor: primaryColorAlpha(isDark ? 0.12 : 0.06) }, pressed && styles.pressed]}>
              <View style={[styles.rowIcon, { backgroundColor: ICON_BACKGROUND }]}>
                <MaterialIcons name="health-and-safety" size={27} color={ICON_COLOR} />
              </View>
              <View style={styles.guidelineCopy}>
                <Text style={[styles.guidelineTitle, { color: text }]}>Let's keep Kulsah safe and positive</Text>
                <Text style={[styles.guidelineDescription, { color: muted }]}>Be kind, respect others and follow our <Text style={{ color: PRIMARY_COLOR }}>Community Guidelines.</Text></Text>
              </View>
              {chevron}
            </Pressable>
          </ScrollView>

          <View style={[styles.doneFooter, { borderTopColor: border, backgroundColor: background }]}>
            <Pressable testID="save-more-live-settings" onPress={() => setScreen('setup')} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
              <LinearGradient colors={[PRIMARY_COLOR, PRIMARY_COLOR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                <View>
                  <Text style={styles.doneTitle}>Done</Text>
                  {/* <Text style={styles.doneSubtitle}>Save and apply settings</Text> */}
                </View>
              </LinearGradient>
            </Pressable>
          </View>
          {renderSheets()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top', 'bottom']}>
      <View style={[styles.screen, { backgroundColor: background }]}>
        <ScrollView contentContainerStyle={styles.setupContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={[styles.pageTitle, { color: text }]}>Go Live Setup</Text>
            <Text style={[styles.pageSubtitle, { color: muted }]}>Set up your stream and go live to connect with your audience.</Text>
          </View>

          <View style={[styles.titleCard, {
            borderColor: border,
            backgroundColor: card }]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Stream Title</Text>
            <View style={[styles.titleInputWrap, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff' }]}>
              <TextInput
                value={title}
                onChangeText={(value) => setTitle(value.slice(0, 100))}
                placeholder="Enter stream title"
                placeholderTextColor={muted}
                multiline
                textAlignVertical="top"
                style={[styles.titleInput, { color: text }]}
              />
              <Text style={[styles.characterCount, { color: muted }]}>{title.length}/100</Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Choose category" testID="live-category-dropdown" onPress={() => setActiveSheet('category')} style={({ pressed }) => [styles.selectionCard, {backgroundColor: card, borderColor: border }, pressed && styles.pressed]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Category</Text>
            <View style={styles.selectionLine}>
              <View style={styles.selectionIcon}>
                <MaterialIcons name="mic" size={25} color={ICON_COLOR} />
              </View>
              <Text style={[styles.selectionValue, { color: text }]}>{category}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={28} color={muted} />
            </View>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Choose audience" testID="live-audience-dropdown" onPress={() => setActiveSheet('audience')} style={({ pressed }) => [styles.selectionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Audience</Text>
            <View style={styles.selectionLine}>
              <View style={styles.selectionIcon}>
                <MaterialIcons name={audience === 'public' ? 'public' : 'stars'} size={25} color={ICON_COLOR} />
              </View>
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionValue, { color: text }]}>{audience === 'public' ? 'Public' : 'Subscribers only'}</Text>
                <Text style={[styles.selectionHelper, { color: muted }]}>{audience === 'public' ? 'Anyone can discover your live stream' : 'Only your subscribers can join this live'}</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={28} color={muted} />
            </View>
          </Pressable>

          <View style={[styles.selectionCard, { borderColor: border, backgroundColor: card }]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Go Live Notifications</Text>
            <View style={styles.selectionLine}>
              <View style={styles.selectionIcon}>
                <MaterialIcons name="notifications-none" size={25} color={ICON_COLOR} />
              </View>
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionValue, { color: text }]}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                <Text style={[styles.selectionHelper, { color: muted }]}>Followers will be notified when you go live</Text>
              </View>
              <Switch accessibilityLabel="Go live notifications" value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Choose stream quality" testID="live-quality-dropdown" onPress={() => setActiveSheet('quality')} style={({ pressed }) => [styles.selectionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Stream Quality</Text>
            <View style={styles.selectionLine}>
              <View style={styles.hdBadge}><Text style={styles.hdBadgeText}>HD</Text></View>
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionValue, { color: text }]}>{quality}</Text>
                <Text style={[styles.selectionHelper, { color: muted }]}>High quality streaming</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={28} color={muted} />
            </View>
          </Pressable>

          <Pressable onPress={() => setActiveSheet('preview')} style={({ pressed }) => [styles.actionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <View style={styles.selectionIcon}>
              <MaterialIcons name="visibility" size={24} color={ICON_COLOR} />
            </View>
            <Text style={[styles.actionLabel, { color: text }]}>Preview: For You Feed</Text>
            {chevron}
          </Pressable>

          <Pressable testID="open-more-live-settings" onPress={() => setScreen('more-settings')} style={({ pressed }) => [styles.actionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <View style={styles.selectionIcon}>
              <MaterialIcons name="settings" size={24} color={ICON_COLOR} />
            </View>
            <Text style={[styles.actionLabel, { color: text }]}>More Settings</Text>
            {chevron}
          </Pressable>
        </ScrollView>

        <View style={[styles.bottomActions, { borderTopColor: border, backgroundColor: background }]}>
          <Pressable onPress={() => void handleDeviceCheck()} style={({ pressed }) => [styles.testButton, { borderColor: border }, pressed && styles.pressed]}>
            <View style={styles.buttonIcon}>
              <MaterialIcons name="sensors" size={20} color={ICON_COLOR} />
            </View>
            <Text style={[styles.testButtonText, { color: text }]}>Test Stream</Text>
          </Pressable>
          <Pressable disabled={!title.trim() || createLive.isPending} onPress={() => void handleGoLive()} style={({ pressed }) => [styles.goLiveButton, (!title.trim() || createLive.isPending) && styles.disabled, pressed && styles.pressed]}>
            <LinearGradient colors={[PRIMARY_COLOR, PRIMARY_COLOR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
              {createLive.isPending ? <ActivityIndicator color="#ffffff" /> : <><MaterialIcons name={scheduleEnabled ? 'event' : 'sensors'} size={24} color="#ffffff" /><Text style={styles.goLiveText}>{scheduleEnabled ? 'Schedule Live' : 'Go Live'}</Text></>}
            </LinearGradient>
          </Pressable>
        </View>
        {renderSheets()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  chevronOnly: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 4 },
  backChevron: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
  intro: { gap: 6, marginBottom: 8 },
  pageTitle: { ...fontSize.b0Variant },
  pageSubtitle: { fontSize: fontSize.b1.fontSize, fontFamily: 'Inter_500Medium' },
  setupContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 50, gap: 14 },
  titleCard: {
    borderWidth: 1,
    borderRadius: 22, padding: 18, gap: 13 },
  fieldLabel: { ...fontSize.b0 },
  titleInputWrap: { minHeight: 116, borderWidth: 0, borderRadius: 16, paddingHorizontal: 6, paddingTop: 5, paddingBottom: 12 },
  titleInput: { flex: 1, minHeight: 58, padding: 0, fontSize:fontSize.b1.fontSize, fontFamily: 'Inter_500Medium' },
  characterCount: { alignSelf: 'flex-end', ...fontSize.b4 },
  selectionCard: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 14 },
  selectionLine: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  selectionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: ICON_BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  inlineIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: ICON_BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  selectionCopy: { flex: 1, gap: 3 },
  selectionValue: { flex: 1, ...fontSize.b1 },
  selectionHelper: { ...fontSize.b1 },
  hdBadge: { width: 54, height: 36, borderWidth: 2, borderColor: PRIMARY_COLOR, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  hdBadgeText: { color: PRIMARY_COLOR, ...fontSize.b2 },
  actionCard: { minHeight: 76, borderWidth: 0, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionLabel: { flex: 1, ...fontSize.b1 },
  bottomActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  testButton: { flex: 1, minHeight: 58, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: ICON_BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  testButtonText: { ...fontSize.b1 },
  goLiveButton: { flex: 1, minHeight: 58, overflow: 'hidden', borderRadius: 999 },
  gradientButton: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  goLiveText: { color: '#ffffff', ...fontSize.b1 },
  disabled: { opacity: 0.45 },
  moreContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 126, gap: 20 },
  settingsGroup: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16 },
  moreRow: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 13 },
  moreRowSeparator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.28)' },
  rowIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { ...fontSize.b1 },
  rowDescription: { ...fontSize.b2 },
  trailingWithChevron: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trailingValue: { ...fontSize.b2 },
  goodValue: { color: '#16a34a', ...fontSize.b0 },
  guidelinesCard: { minHeight: 108, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  guidelineCopy: { flex: 1, gap: 3 },
  guidelineTitle: { ...fontSize.b0 },
  guidelineDescription: { ...fontSize.b2 },
  doneFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  doneButton: { height: 66, borderRadius: 999, overflow: 'hidden' },
  doneTitle: { color: '#ffffff', textAlign: 'center', ...fontSize.b0 },
  doneSubtitle: { color: 'rgba(255,255,255,0.82)', textAlign: 'center', ...fontSize.b1 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.58)' },
  sheetCard: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 9,
    overflow: 'hidden',
  },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetHeader: { minHeight: 80, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetHeaderCopy: { flex: 1, minWidth: 0 },
  sheetTitle: { ...fontSize.b0Variant },
  sheetSubtitle: { marginTop: 4, ...fontSize.b2 },
  sheetCloseButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 22, gap: 18 },
  choiceList: { gap: 10 },
  choiceRow: { minHeight: 78, borderRadius: 17, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceLabel: { ...fontSize.b1 },
  choiceDescription: { marginTop: 3, ...fontSize.b2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY_COLOR },
  previewFrame: { height: 430, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  previewGradient: { flex: 1, padding: 18 },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: { height: 30, borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffffff' },
  liveBadgeText: { color: '#ffffff', ...fontSize.b4 },
  viewerBadge: { height: 30, borderRadius: 15, paddingHorizontal: 10, backgroundColor: 'rgba(15,23,42,0.46)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewerBadgeText: { color: '#ffffff', ...fontSize.b4 },
  previewCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewAvatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  previewCreator: { marginTop: 10, color: '#ffffff', ...fontSize.b2 },
  previewBottom: { paddingTop: 18 },
  previewTitle: { color: '#ffffff', ...fontSize.b0Variant },
  previewMetaRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  previewMeta: { color: 'rgba(255,255,255,0.82)', ...fontSize.b2 },
  previewMetaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  primarySheetButton: { minHeight: 54, borderRadius: 16, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primarySheetButtonText: { color: '#ffffff', textAlign: 'center', ...fontSize.b1 },
  sheetSection: { gap: 10 },
  sheetSectionTitle: { ...fontSize.b1 },
  controlGroup: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  controlRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  controlCopy: { flex: 1, minWidth: 0 },
  controlTitle: { ...fontSize.b1 },
  controlDescription: { marginTop: 3, ...fontSize.b2 },
  blockedWordsInput: { minHeight: 98, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: 'top', ...fontSize.b1 },
  inputHint: { ...fontSize.b2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  choiceChip: { minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  choiceChipText: { ...fontSize.b2 },
  scheduleSummary: { minHeight: 84, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduleSummaryCopy: { flex: 1 },
  scheduleSummaryTitle: { ...fontSize.b1 },
  scheduleSummaryDescription: { marginTop: 3, ...fontSize.b2 },
  sheetButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondarySheetButton: { minHeight: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  secondarySheetButtonText: { ...fontSize.b1 },
  flexButton: { flex: 1 },
  statusHero: { minHeight: 210, borderRadius: 22, padding: 24, alignItems: 'center', justifyContent: 'center' },
  statusHeroTitle: { marginTop: 14, textAlign: 'center', ...fontSize.b0Variant },
  statusHeroDescription: { marginTop: 7, textAlign: 'center', ...fontSize.b2 },
  diagnosticGroup: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  diagnosticRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  diagnosticLabel: { flex: 1, ...fontSize.b1 },
  diagnosticValue: { ...fontSize.b2 },
  guidelineRule: { minHeight: 82, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
});

export default LiveCreationSetup;
