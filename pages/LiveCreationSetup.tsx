import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';
import { useCreateLive } from '../src/hooks/live/useLive';
import { getApiErrorMessage } from '../src/utils/apiError';

type Screen = 'setup' | 'more-settings';
type Audience = 'public' | 'subscribers';

const categories = ['Music', 'Gaming', 'Talk show', 'Lifestyle', 'Education'];
const qualities = ['720p · 30fps', '1080p · 30fps', '1080p · 60fps'];

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
      <View style={[styles.rowIcon, { backgroundColor: primaryColorAlpha(0.1) }]}>
        <MaterialIcons name={icon} size={24} color={PRIMARY_COLOR} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color }]}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      {trailing}
    </>
  );

  const rowStyle = [styles.moreRow, separator && styles.moreRowSeparator];

  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>{content}</Pressable>
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
  const [title, setTitle] = useState('Sunday vibes ✨ let\'s chill and sing together 💜');
  const [category, setCategory] = useState(categories[0]);
  const [audience, setAudience] = useState<Audience>('public');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quality, setQuality] = useState(qualities[2]);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const createLive = useCreateLive();

  const background = isDark ? theme.screen : '#ffffff';
  const card = isDark ? theme.card : '#ffffff';
  const text = theme.text;
  const muted = isDark ? '#a1a1aa' : theme.textSecondary;
  const border = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.1)';
  const switchOff = isDark ? '#3f3f46' : '#d4d4d8';

  const ensureBroadcastPermissions = async () => {
    const [nextCameraPermission, nextMicrophonePermission] = await Promise.all([
      cameraPermission?.granted ? Promise.resolve(cameraPermission) : requestCameraPermission(),
      microphonePermission?.granted ? Promise.resolve(microphonePermission) : requestMicrophonePermission(),
    ]);

    if (!nextCameraPermission?.granted || !nextMicrophonePermission?.granted) {
      Alert.alert('Permissions required', 'Camera and microphone access are required before starting a live stream.');
      return false;
    }

    return true;
  };

  const handleGoLive = async () => {
    if (!title.trim() || createLive.isPending) return;

    try {
      if (!await ensureBroadcastPermissions()) return;

      const live = await createLive.mutateAsync({
        title: title.trim(),
        category,
        visibility: subscriberOnly || audience === 'subscribers' ? 'subscribers' : 'public',
        recording_enabled: recordingEnabled,
        chat_enabled: chatEnabled,
        gifts_enabled: giftsEnabled,
      });

      navigation.replace('CreatorLiveStream', {
        liveSessionId: live.id,
        initialLive: live,
        quality,
        notificationsEnabled,
        ageRestricted,
      });
    } catch (error) {
      Alert.alert('Could not create Live', getApiErrorMessage(error));
    }
  };

  const handleTestStream = async () => {
    if (!await ensureBroadcastPermissions()) return;
    Alert.alert('Camera and mic are ready', 'Your device is ready for a test stream.');
  };

  const cycle = (values: string[], value: string, setter: (next: string) => void) => {
    setter(values[(values.indexOf(value) + 1) % values.length]);
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
              <MoreSettingRow icon="videocam" title="Save Recording" description="Automatically save a copy of your live stream" color={text} trailing={<Switch value={recordingEnabled} onValueChange={setRecordingEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="chat-bubble-outline" title="Chat Enabled" description="Allow viewers to send messages" color={text} trailing={<Switch value={chatEnabled} onValueChange={setChatEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="card-giftcard" title="Gifts Enabled" description="Viewers can send gifts during your live" color={text} trailing={<Switch value={giftsEnabled} onValueChange={setGiftsEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
              <MoreSettingRow icon="stars" title="Subscriber-only Live" description="Only your subscribers can join this live" color={text} separator={false} trailing={<Switch value={subscriberOnly} onValueChange={(enabled) => { setSubscriberOnly(enabled); setAudience(enabled ? 'subscribers' : 'public'); }} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />} />
            </View>

            <View style={[styles.settingsGroup, { borderColor: border, backgroundColor: card }]}>
              <MoreSettingRow icon="shield" title="Moderation Tools" description="Manage blocked words, muting and filters" color={text} trailing={chevron} onPress={() => Alert.alert('Moderation Tools', 'Moderation controls will be available once your stream starts.')} />
              <MoreSettingRow icon="18-up-rating" title="Age Restriction" description="Restrict your stream to viewers 18+" color={text} trailing={<View style={styles.trailingWithChevron}><Text style={[styles.trailingValue, { color: ageRestricted ? PRIMARY_COLOR : muted }]}>{ageRestricted ? '18+ Only' : 'Everyone'}</Text>{chevron}</View>} onPress={() => setAgeRestricted((value) => !value)} />
              <MoreSettingRow icon="calendar-month" title="Schedule Live" description="Plan your live and notify your audience" color={text} separator={false} trailing={chevron} onPress={() => Alert.alert('Schedule Live', 'Scheduling will be available in a future update.')} />
            </View>

            <View style={[styles.settingsGroup, { borderColor: border, backgroundColor: card }]}>
              <MoreSettingRow icon="graphic-eq" title="Camera & Mic Check" description="Check your camera and microphone" color={text} trailing={<View style={styles.trailingWithChevron}><Text style={styles.goodValue}>Good</Text>{chevron}</View>} onPress={() => void handleTestStream()} />
              <MoreSettingRow icon="screen-rotation" title="Stream Orientation" description="Choose how your stream will appear" color={text} trailing={<View style={styles.trailingWithChevron}><Text style={[styles.trailingValue, { color: muted }]}>Portrait</Text>{chevron}</View>} onPress={() => Alert.alert('Stream Orientation', 'Portrait is selected for this live stream.')} />
              <MoreSettingRow icon="wifi" title="Network / Quality Diagnostics" description="Test your connection and stream quality" color={text} separator={false} trailing={<View style={styles.trailingWithChevron}><Text style={styles.goodValue}>Excellent</Text>{chevron}</View>} onPress={() => Alert.alert('Network Diagnostics', 'Your connection quality is excellent.')} />
            </View>

            <View style={[styles.guidelinesCard, { borderColor: primaryColorAlpha(0.22), backgroundColor: primaryColorAlpha(isDark ? 0.12 : 0.06) }]}>
              <MaterialIcons name="health-and-safety" size={38} color={PRIMARY_COLOR} />
              <View style={styles.guidelineCopy}>
                <Text style={[styles.guidelineTitle, { color: text }]}>Let's keep Kulsah safe and positive</Text>
                <Text style={[styles.guidelineDescription, { color: muted }]}>Be kind, respect others and follow our <Text style={{ color: PRIMARY_COLOR }}>Community Guidelines.</Text></Text>
              </View>
              {chevron}
            </View>
          </ScrollView>

          <View style={[styles.doneFooter, { borderTopColor: border, backgroundColor: background }]}>
            <Pressable testID="save-more-live-settings" onPress={() => setScreen('setup')} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
              <LinearGradient colors={[PRIMARY_COLOR, '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                <View>
                  <Text style={styles.doneTitle}>Done</Text>
                  <Text style={styles.doneSubtitle}>Save and apply settings</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top', 'bottom']}>
      <View style={[styles.screen, { backgroundColor: background }]}>
        <View style={styles.chevronOnly}>{renderBackChevron(() => navigation.goBack(), 'go-live-back')}</View>
        <ScrollView contentContainerStyle={styles.setupContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={[styles.pageTitle, { color: text }]}>Go Live Setup</Text>
            <Text style={[styles.pageSubtitle, { color: muted }]}>Set up your stream and go live to connect with your audience.</Text>
          </View>

          <View style={[styles.titleCard, { 
            // borderColor: border, 
            backgroundColor: card }]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Stream Title</Text>
            <View style={[styles.titleInputWrap, {
              // borderColor: border, 
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

          <Pressable onPress={() => cycle(categories, category, setCategory)} style={({ pressed }) => [styles.selectionCard, {backgroundColor: card }, pressed && styles.pressed]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Category</Text>
            <View style={styles.selectionLine}>
              <MaterialIcons name="mic" size={30} color={PRIMARY_COLOR} />
              <Text style={[styles.selectionValue, { color: text }]}>{category}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={28} color={muted} />
            </View>
          </Pressable>

          <Pressable onPress={() => setAudience((value) => value === 'public' ? 'subscribers' : 'public')} style={({ pressed }) => [styles.selectionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <Text style={[styles.fieldLabel, { color: text }]}>Audience</Text>
            <View style={styles.selectionLine}>
              <MaterialIcons name={audience === 'public' ? 'public' : 'stars'} size={30} color={PRIMARY_COLOR} />
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
              <MaterialIcons name="notifications-none" size={30} color={PRIMARY_COLOR} />
              <View style={styles.selectionCopy}>
                <Text style={[styles.selectionValue, { color: text }]}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                <Text style={[styles.selectionHelper, { color: muted }]}>Followers will be notified when you go live</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: switchOff, true: PRIMARY_COLOR }} thumbColor="#ffffff" />
            </View>
          </View>

          <Pressable onPress={() => cycle(qualities, quality, setQuality)} style={({ pressed }) => [styles.selectionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
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

          <Pressable onPress={() => Alert.alert('Preview', 'Your stream preview will be shown in the For You feed.')} style={({ pressed }) => [styles.actionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <MaterialIcons name="visibility" size={29} color={PRIMARY_COLOR} />
            <Text style={[styles.actionLabel, { color: text }]}>Preview: For You Feed</Text>
            {chevron}
          </Pressable>

          <Pressable testID="open-more-live-settings" onPress={() => setScreen('more-settings')} style={({ pressed }) => [styles.actionCard, { borderColor: border, backgroundColor: card }, pressed && styles.pressed]}>
            <MaterialIcons name="settings" size={29} color={PRIMARY_COLOR} />
            <Text style={[styles.actionLabel, { color: text }]}>More Settings</Text>
            {chevron}
          </Pressable>
        </ScrollView>

        <View style={[styles.bottomActions, { borderTopColor: border, backgroundColor: background }]}>
          <Pressable onPress={() => void handleTestStream()} style={({ pressed }) => [styles.testButton, { borderColor: border }, pressed && styles.pressed]}>
            <MaterialIcons name="sensors" size={24} color={PRIMARY_COLOR} />
            <Text style={[styles.testButtonText, { color: text }]}>Test Stream</Text>
          </Pressable>
          <Pressable disabled={!title.trim() || createLive.isPending} onPress={() => void handleGoLive()} style={({ pressed }) => [styles.goLiveButton, (!title.trim() || createLive.isPending) && styles.disabled, pressed && styles.pressed]}>
            <LinearGradient colors={[PRIMARY_COLOR, '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
              {createLive.isPending ? <ActivityIndicator color="#ffffff" /> : <><MaterialIcons name="sensors" size={24} color="#ffffff" /><Text style={styles.goLiveText}>Go Live</Text></>}
            </LinearGradient>
          </Pressable>
        </View>
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
  pageTitle: { ...fontSize.n1 },
  pageSubtitle: { ...fontSize.b0Variant },
  setupContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 142, gap: 14 },
  titleCard: { 
    // borderWidth: 1, 
    borderRadius: 22, padding: 18, gap: 13 },
  fieldLabel: { ...fontSize.b0Variant },
  titleInputWrap: { minHeight: 116, borderWidth: 0, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  titleInput: { flex: 1, minHeight: 58, padding: 0, ...fontSize.b0Variant },
  characterCount: { alignSelf: 'flex-end', ...fontSize.b3 },
  selectionCard: { borderWidth: 0, borderRadius: 22, padding: 18, gap: 14 },
  selectionLine: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  selectionCopy: { flex: 1, gap: 3 },
  selectionValue: { flex: 1, ...fontSize.b0Variant },
  selectionHelper: { ...fontSize.b3 },
  hdBadge: { width: 54, height: 36, borderWidth: 2, borderColor: PRIMARY_COLOR, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  hdBadgeText: { color: PRIMARY_COLOR, ...fontSize.b0Variant },
  actionCard: { minHeight: 76, borderWidth: 0, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionLabel: { flex: 1, ...fontSize.b0Variant },
  bottomActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  testButton: { flex: 1, minHeight: 58, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  testButtonText: { ...fontSize.b0Variant },
  goLiveButton: { flex: 1, minHeight: 58, overflow: 'hidden', borderRadius: 16 },
  gradientButton: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  goLiveText: { color: '#ffffff', ...fontSize.b0Variant },
  disabled: { opacity: 0.45 },
  moreContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 126, gap: 20 },
  settingsGroup: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16 },
  moreRow: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 13 },
  moreRowSeparator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.28)' },
  rowIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { ...fontSize.b0Variant },
  rowDescription: { color: '#6b7280', ...fontSize.b3 },
  trailingWithChevron: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trailingValue: { ...fontSize.b3 },
  goodValue: { color: '#16a34a', ...fontSize.b0 },
  guidelinesCard: { minHeight: 108, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  guidelineCopy: { flex: 1, gap: 3 },
  guidelineTitle: { ...fontSize.b0 },
  guidelineDescription: { ...fontSize.b3 },
  doneFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  doneButton: { height: 66, borderRadius: 16, overflow: 'hidden' },
  doneTitle: { color: '#ffffff', textAlign: 'center', ...fontSize.b0Variant },
  doneSubtitle: { color: 'rgba(255,255,255,0.82)', textAlign: 'center', ...fontSize.b3 },
});

export default LiveCreationSetup;
