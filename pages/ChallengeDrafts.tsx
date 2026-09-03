import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from '../typography';
import { ListSkeleton } from '../components/PageSkeleton';
import { user } from '../types';

type ChallengeDraft = {
  id: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  status?: 'draft' | 'active';
  image: string;
  wizard?: Record<string, unknown>;
};

const DRAFTS_KEY = 'pulsar_challenge_drafts';
const ACTIVE_KEY = 'pulsar_challenges';

const coverPresets = [
  { title: 'Acoustic Cover', url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800' },
  { title: 'Neon Jam', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800' },
  { title: 'DJ Beats', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
  { title: 'Midnight Live', url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800' },
];

const fallbackDrafts: ChallengeDraft[] = [
  {
    id: 'd1',
    creatorId: 'mila_ray_01',
    title: 'Acoustic Soul Session',
    description: 'Record your best acoustic cover of my latest track.',
    reward: '$200 + Signed Vinyl',
    deadline: '14 Days',
    participants: 0,
    status: 'draft',
    image: coverPresets[0].url,
  },
  {
    id: 'd2',
    creatorId: 'mila_ray_01',
    title: 'Dance Choreography',
    description: 'Create a 15 second dance routine for the chorus.',
    reward: 'Feature in Music Video',
    deadline: '7 Days',
    participants: 0,
    status: 'draft',
    image: coverPresets[1].url,
  },
  {
    id: 'd3',
    creatorId: 'mila_ray_01',
    title: 'Lyric Video Contest',
    description: 'Design a creative lyric video for Neon Nights.',
    reward: '$150 + Credit',
    deadline: '21 Days',
    participants: 0,
    status: 'draft',
    image: coverPresets[3].url,
  },
];

const ChallengeDrafts: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, theme } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<ChallengeDraft[]>([]);
  const [editingDraft, setEditingDraft] = useState<ChallengeDraft | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editDeadline, setEditDeadline] = useState('7 Days');
  const [editImage, setEditImage] = useState(coverPresets[0].url);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [celebratedChallenge, setCelebratedChallenge] = useState<ChallengeDraft | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const surface = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const inputSurface = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const titleTone = isDark ? '#ffffff' : theme.text;
  const muted = isDark ? 'rgba(255,255,255,0.42)' : theme.textMuted;

  const routeDraft = route.params?.draft as ChallengeDraft | undefined;

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const persistDrafts = async (nextDrafts: ChallengeDraft[]) => {
    setDrafts(nextDrafts);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
  };

  const startResume = (draft: ChallengeDraft) => {
    setEditingDraft(draft);
    setEditTitle(draft.title);
    setEditDesc(draft.description || '');
    setEditReward(draft.reward || '');
    setEditDeadline(draft.deadline || '7 Days');
    setEditImage(draft.image || coverPresets[0].url);
  };

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(DRAFTS_KEY)
      .then(async (saved: string | null) => {
        const nextDrafts = saved ? JSON.parse(saved) : fallbackDrafts;
        if (!saved) {
          await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(fallbackDrafts));
        }
        if (mounted) {
          setDrafts(nextDrafts);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setDrafts(fallbackDrafts);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && routeDraft) {
      const storedDraft = drafts.find((draft) => draft.id === routeDraft.id) || routeDraft;
      startResume(storedDraft);
    }
  }, [drafts, loading, routeDraft]);

  const handleSaveDraftEdit = async () => {
    if (!editingDraft) return;
    const updatedDrafts = drafts.map((draft) => (
      draft.id === editingDraft.id
        ? { ...draft, title: editTitle, description: editDesc, reward: editReward, deadline: editDeadline, image: editImage }
        : draft
    ));
    await persistDrafts(updatedDrafts);
    triggerToast('Draft settings successfully saved!');
    setEditingDraft(null);
  };

  const handleLaunchDraft = async () => {
    if (!editingDraft) return;
    const newChallenge: ChallengeDraft = {
      ...editingDraft,
      id: `c_${Date.now()}`,
      creatorId: String(user?.id || editingDraft.creatorId || 'mila_ray_01'),
      creatorName: user?.name || 'Nova Pulse',
      title: editTitle,
      description: editDesc,
      reward: editReward,
      deadline: editDeadline,
      participants: 0,
      status: 'active',
      image: editImage,
    };

    const savedActive = await AsyncStorage.getItem(ACTIVE_KEY);
    const activeList = savedActive ? JSON.parse(savedActive) : [];
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify([newChallenge, ...activeList]));

    const updatedDrafts = drafts.filter((draft) => draft.id !== editingDraft.id);
    await persistDrafts(updatedDrafts);
    setCelebratedChallenge(newChallenge);
    setShowCelebrate(true);
    setEditingDraft(null);
  };

  const handleDeleteDraft = (id: string) => {
    Alert.alert('Discard Draft', 'Are you sure you want to discard this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await persistDrafts(drafts.filter((draft) => draft.id !== id));
          triggerToast('Draft discarded successfully.');
          setEditingDraft(null);
        },
      },
    ]);
  };

  const shareLaunchedChallenge = async () => {
    if (!celebratedChallenge) return;
    await Share.share({
      message: `Check out my new challenge: ${celebratedChallenge.title}. Join now for a chance to win ${celebratedChallenge.reward}.`,
    });
  };

  const emptyState = useMemo(() => (
    <View style={[styles.emptyCard, { borderColor: border, backgroundColor: surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: inputSurface }]}>
        <MaterialIcons name="inbox" size={34} color={muted} />
      </View>
      <Text style={[styles.emptyTitle, { color: titleTone }]}>No Drafts Exist</Text>
      <Text style={[styles.emptyCopy, { color: muted }]}>All your orbits have been launched successfully.</Text>
      <Pressable onPress={() => navigation.navigate('CreateChallenge')} style={styles.startButton}>
        <Text style={styles.startButtonText}>Start New Challenge</Text>
      </Pressable>
    </View>
  ), [border, inputSurface, muted, navigation, surface, titleTone]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(5,2,7,0.92)' : theme.card, borderBottomColor: border }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.headerButton, { backgroundColor: inputSurface }]}>
          <MaterialIcons name="arrow-back" size={23} color={titleTone} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: titleTone }]}>Saved Drafts</Text>
        <Pressable onPress={() => navigation.navigate('CreateChallenge')} style={[styles.headerButton, styles.headerPrimary]}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ListSkeleton isDark={isDark} />
        ) : drafts.length === 0 ? (
          emptyState
        ) : (
          <View style={styles.draftStack}>
            {drafts.map((draft) => (
              <View key={draft.id} style={[styles.draftCard, { backgroundColor: surface, borderColor: border }]}>
                <Image source={{ uri: draft.image }} style={styles.draftImage} />
                <View style={styles.draftBody}>
                  <Text numberOfLines={1} style={[styles.draftTitle, { color: titleTone }]}>{draft.title}</Text>
                  <Text numberOfLines={1} style={[styles.draftDesc, { color: muted }]}>{draft.description}</Text>
                  <View style={styles.draftMeta}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="emoji-events" size={16} color={PRIMARY_COLOR} />
                      <Text numberOfLines={1} style={styles.rewardText}>{draft.reward}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="schedule" size={16} color={muted} />
                      <Text style={[styles.editedText, { color: muted }]}>Edited 2d ago</Text>
                    </View>
                  </View>
                </View>
                <Pressable onPress={() => navigation.navigate('CreateChallenge', { draft })} style={styles.resumeButton}>
                  <MaterialIcons name="edit-note" size={17} color={PRIMARY_COLOR} />
                  <Text style={styles.resumeText}>Resume</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.launchHint, { backgroundColor: primaryColorAlpha(0.06), borderColor: primaryColorAlpha(0.3) }]}>
          <View style={[styles.launchIcon, { backgroundColor: primaryColorAlpha(0.12) }]}>
            <MaterialIcons name="rocket-launch" size={32} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.hintTitle, { color: titleTone }]}>Ready to launch?</Text>
          <Text style={[styles.hintCopy, { color: muted }]}>Complete your drafts and start your orbit.</Text>
        </View>
      </ScrollView>

      {toastMessage ? (
        <View style={styles.toast}>
          <MaterialIcons name="cloud-done" size={15} color={PRIMARY_COLOR} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <Modal visible={Boolean(editingDraft)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEditingDraft(null)}>
        <View style={styles.modalRoot}>
          <View style={[styles.composerCard, { backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.composerHeader}>
              <View style={styles.composerHeaderLeft}>
                <MaterialIcons name="compost" size={21} color={PRIMARY_COLOR} />
                <Text style={styles.composerTitle}>Resume Challenge Composer</Text>
              </View>
              <Pressable onPress={() => setEditingDraft(null)} style={styles.closeButton}>
                <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.65)" />
              </Pressable>
            </View>

            <ScrollView style={styles.composerScroll} contentContainerStyle={styles.composerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.coverPreview}>
                <Image source={{ uri: editImage }} style={styles.coverImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.coverText}>
                  <Text style={styles.coverPill}>Draft Editing Protocol</Text>
                  <Text numberOfLines={1} style={styles.coverTitle}>{editTitle || 'Untitled Session'}</Text>
                </View>
              </View>

              <FieldLabel label="Challenge Title" />
              <TextInput includeFontPadding={false} value={editTitle} onChangeText={setEditTitle} placeholder="e.g. Acoustic Soul Cover" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />

              <FieldLabel label="Instructions & Rules" />
              <TextInput includeFontPadding={false}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Invite fans to participate..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />

              <FieldLabel label="Deadline Duration" />
              <View style={styles.durationGrid}>
                {['7 Days', '14 Days', '30 Days'].map((day) => {
                  const active = editDeadline === day;
                  return (
                    <Pressable key={day} onPress={() => setEditDeadline(day)} style={[styles.durationButton, active && styles.durationButtonActive]}>
                      <Text style={[styles.durationText, active && styles.durationTextActive]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <FieldLabel label="Reward & Perks" />
              <TextInput includeFontPadding={false} value={editReward} onChangeText={setEditReward} placeholder="e.g. $100 + Video Credit" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} />

              <FieldLabel label="Aesthetic Cover Art Preset" />
              <View style={styles.presetGrid}>
                {coverPresets.map((preset) => {
                  const active = editImage === preset.url;
                  return (
                    <Pressable key={preset.url} onPress={() => setEditImage(preset.url)} style={[styles.presetButton, active && styles.presetButtonActive]}>
                      <Image source={{ uri: preset.url }} style={styles.presetImage} />
                      <View style={styles.presetOverlay}>
                        {active ? <MaterialIcons name="done" size={14} color={PRIMARY_COLOR} style={styles.presetCheck} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.composerFooter}>
              <Pressable onPress={() => editingDraft && handleDeleteDraft(editingDraft.id)} style={styles.deleteButton}>
                <MaterialIcons name="delete" size={22} color="rgba(255,255,255,0.55)" />
              </Pressable>
              <Pressable onPress={handleSaveDraftEdit} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Save Settings</Text>
              </Pressable>
              <Pressable onPress={handleLaunchDraft} style={styles.launchButton}>
                <MaterialIcons name="rocket-launch" size={15} color="#fff" />
                <Text style={styles.launchButtonText}>Launch Orbit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCelebrate && Boolean(celebratedChallenge)} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.celebrateRoot}>
          {celebratedChallenge ? (
            <View style={styles.celebrateCard}>
              <View style={styles.orbitVisual}>
                <View style={styles.orbitRing} />
                <View style={[styles.orbitRing, styles.orbitRingInner]} />
                <View style={[styles.celebrateCover, { transform: [{ rotate: '6deg' }] }]}>
                  <Image source={{ uri: celebratedChallenge.image }} style={styles.fill} />
                  <LinearGradient colors={['transparent', primaryColorAlpha(0.85)]} style={StyleSheet.absoluteFillObject} />
                </View>
                <View style={[styles.celebrateCover, { transform: [{ rotate: '-6deg' }], opacity: 0.75 }]}>
                  <Image source={{ uri: celebratedChallenge.image }} style={styles.fill} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
                </View>
              </View>

              <Text style={styles.celebrateKicker}>Orbit Established</Text>
              <Text style={styles.celebrateTitle}>{celebratedChallenge.title}</Text>
              <Text style={styles.celebrateCopy}>Your challenge is active and broadcasting to all fans.</Text>

              <View style={styles.receipt}>
                <ReceiptRow label="Broadcaster" value={`@${user?.name || 'nova_pulse'}`} />
                <ReceiptRow label="Reward Perk" value={celebratedChallenge.reward} accent />
                <ReceiptRow label="Expires In" value={celebratedChallenge.deadline} />
              </View>

              <Pressable
                onPress={() => {
                  setShowCelebrate(false);
                  setCelebratedChallenge(null);
                  navigation.navigate('MainTabs');
                }}
                style={styles.dashboardButton}
              >
                <Text style={styles.dashboardButtonText}>Go To Orbit Dashboard</Text>
              </Pressable>
              <Pressable onPress={shareLaunchedChallenge} style={styles.shareButton}>
                <MaterialIcons name="share" size={16} color="#fff" />
                <Text style={styles.shareButtonText}>Broadcast Share Link</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const FieldLabel = ({ label }: { label: string }) => (
  <Text style={styles.fieldLabel}>{label}</Text>
);

const ReceiptRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <View style={styles.receiptRow}>
    <Text style={styles.receiptLabel}>{label}</Text>
    <Text numberOfLines={1} style={[styles.receiptValue, accent && { color: PRIMARY_COLOR }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPrimary: {
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTitle: {
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 22,
  },
  loadingWrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 34,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
  },
  emptyCopy: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 10,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  draftStack: {
    gap: 14,
  },
  draftCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  draftImage: {
    width: 86,
    height: 86,
    borderRadius: 26,
    opacity: 0.72,
  },
  draftBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  draftTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
  },
  draftDesc: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  draftMeta: {
    gap: 5,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  rewardText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  editedText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resumeButton: {
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: primaryColorAlpha(0.12),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.2),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  resumeText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  launchHint: {
    borderRadius: 34,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  launchIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hintTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
  },
  hintCopy: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  toastText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    padding: 16,
  },
  composerCard: {
    maxHeight: '92%',
    borderRadius: 36,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  composerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  composerTitle: {
    color: '#fff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    flexShrink: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerScroll: {
    maxHeight: 520,
  },
  composerContent: {
    gap: 10,
    paddingBottom: 4,
  },
  coverPreview: {
    height: 132,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.64,
  },
  coverText: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    gap: 6,
  },
  coverPill: {
    alignSelf: 'flex-start',
    color: '#fff',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coverTitle: {
    color: '#fff',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    marginLeft: 4,
    color: 'rgba(255,255,255,0.42)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    color: '#fff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  textArea: {
    height: 96,
    paddingTop: 12,
    paddingBottom: 12,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: primaryColorAlpha(0.2),
  },
  durationText: {
    color: 'rgba(255,255,255,0.55)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  durationTextActive: {
    color: PRIMARY_COLOR,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  presetButtonActive: {
    borderColor: PRIMARY_COLOR,
    opacity: 1,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCheck: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 9,
    overflow: 'hidden',
    padding: 2,
  },
  composerFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  launchButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  launchButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  celebrateRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  celebrateCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 16,
  },
  orbitVisual: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: primaryColorAlpha(0.22),
  },
  orbitRingInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderColor: primaryColorAlpha(0.4),
  },
  celebrateCover: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  celebrateKicker: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  celebrateTitle: {
    color: '#fff',
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  celebrateCopy: {
    color: '#94a3b8',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  receipt: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  receiptRow: {
    minHeight: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptLabel: {
    color: 'rgba(255,255,255,0.4)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receiptValue: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    flexShrink: 1,
  },
  dashboardButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardButtonText: {
    color: '#000',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  shareButton: {
    width: '100%',
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default ChallengeDrafts;
