import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';

type Step = 'media' | 'details' | 'protocol';

interface QualityOption {
  id: string;
  label: string;
  bitrate: string;
  desc: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  { id: '480p', label: '480p', bitrate: '2.5 Mbps', desc: 'Standard Definition' },
  { id: '720p', label: '720p', bitrate: '5.0 Mbps', desc: 'High Definition' },
  { id: '1080p', label: '1080p', bitrate: '8.0 Mbps', desc: 'Full HD' },
];

const VIBES = ['Synthwave', 'Afrobeats', 'Midnight R&B', 'Techno', 'Lo-Fi', 'Pop', 'Acoustic', 'Electric'];

const GoLiveSetup: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState<Step>('media');
  const [title, setTitle] = useState('Midnight Synthesis - Live Session');
  const [vibe, setVibe] = useState('Synthwave');
  const [access, setAccess] = useState<'public' | 'premium'>('public');
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [thumbnail] = useState<string | null>(null);

  const steps: { id: Step; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'media', label: 'Media', icon: 'videocam' },
    { id: 'details', label: 'Details', icon: 'edit-note' },
    { id: 'protocol', label: 'Protocol', icon: 'security' },
  ];

  const handleNext = () => {
    if (currentStep === 'media') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('protocol');
  };

  const handleBack = () => {
    if (currentStep === 'protocol') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('media');
    else navigation.goBack();
  };

  const canGoNext = () => {
    if (currentStep === 'details') return title.trim() !== '' && vibe !== '';
    return true;
  };

  const progressValue = currentStep === 'media' ? 33 : currentStep === 'details' ? 66 : 100;
  const activeQuality = QUALITY_OPTIONS.find((q) => q.id === selectedQuality);

  const progressWidth = `${progressValue}%` as `${number}%`;

  return (
    <View style={[styles.screen, { backgroundColor: theme.screen }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <MaterialIcons name={currentStep === 'media' ? 'close' : 'arrow-back'} size={20} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>LIVE STUDIO</Text>
          </View>
          <View style={styles.readyPill}>
            <Text style={styles.readyText}>UPLINK READY</Text>
          </View>
        </View>

        <View style={styles.stepperRow}>
          <View style={styles.stepTrack}>
            <View style={[styles.stepFill, { width: currentStep === 'media' ? '0%' : currentStep === 'details' ? '50%' : '100%' }]} />
          </View>
          {steps.map((s, idx) => {
            const isActive = currentStep === s.id;
            const isCompleted = steps.findIndex((st) => st.id === currentStep) > idx;
            return (
              <View key={s.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepIcon,
                    isActive && styles.stepIconActive,
                    isCompleted && styles.stepIconCompleted,
                  ]}
                >
                  <MaterialIcons
                    name={isCompleted ? 'check' : s.icon}
                    size={14}
                    color={isActive || isCompleted ? '#fff' : '#6b7280'}
                  />
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{s.label.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {currentStep === 'media' && (
          <View style={styles.sectionWrap}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRANSMISSION FEED</Text>
              <View style={styles.previewCard}>
                <Image
                  source={{
                    uri:
                      thumbnail ||
                      'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
                  }}
                  style={styles.previewImg}
                />
                <View style={styles.previewOverlay}>
                  <View style={styles.previewIconWrap}>
                    <MaterialIcons name="videocam" size={38} color="#cd2bee" />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STREAMING QUALITY</Text>
              <View style={styles.qualityGrid}>
                {QUALITY_OPTIONS.map((opt) => {
                  const selected = selectedQuality === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setSelectedQuality(opt.id)}
                      style={[styles.qualityItem, selected && styles.qualityItemActive]}
                    >
                      <Text style={[styles.qualityLabel, selected && styles.qualityTextActive]}>{opt.label}</Text>
                      <Text style={[styles.qualityBitrate, selected && styles.qualityTextActive]}>{opt.bitrate}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {activeQuality && <Text style={styles.helperText}>Selected: {activeQuality.desc}</Text>}
            </View>
          </View>
        )}

        {currentStep === 'details' && (
          <View style={styles.sectionWrap}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRANSMISSION TITLE</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter stream title"
                placeholderTextColor="#6b7280"
                style={styles.titleInput}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ATMOSPHERE</Text>
              <View style={styles.vibeWrap}>
                {VIBES.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setVibe(v)}
                    style={[styles.vibeChip, vibe === v && styles.vibeChipActive]}
                  >
                    <Text style={[styles.vibeText, vibe === v && styles.vibeTextActive]}>{v.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {currentStep === 'protocol' && (
          <View style={styles.sectionWrap}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCESS PROTOCOL</Text>
              <View style={styles.protocolRow}>
                <Pressable
                  onPress={() => setAccess('public')}
                  style={[styles.protocolCard, access === 'public' && styles.protocolCardPublic]}
                >
                  <View style={styles.protocolTop}>
                    <View style={styles.protocolIconWrap}>
                      <MaterialIcons name="public" size={22} color={access === 'public' ? '#cd2bee' : '#9ca3af'} />
                    </View>
                    <View style={[styles.radioOuter, access === 'public' && styles.radioOuterPublic]}>
                      <View style={[styles.radioInner, access === 'public' ? { opacity: 1 } : { opacity: 0 }]} />
                    </View>
                  </View>
                  <Text style={styles.protocolTitle}>Public</Text>
                  <Text style={styles.protocolSub}>Visible to all</Text>
                </Pressable>

                <Pressable
                  onPress={() => setAccess('premium')}
                  style={[styles.protocolCard, access === 'premium' && styles.protocolCardPremium]}
                >
                  <View style={styles.protocolTop}>
                    <View style={styles.protocolIconWrap}>
                      <MaterialIcons name="stars" size={22} color={access === 'premium' ? '#eab308' : '#9ca3af'} />
                    </View>
                    <View style={[styles.radioOuter, access === 'premium' && styles.radioOuterPremium]}>
                      <View style={[styles.radioInnerPremium, access === 'premium' ? { opacity: 1 } : { opacity: 0 }]} />
                    </View>
                  </View>
                  <Text style={styles.protocolTitle}>Premium</Text>
                  <Text style={styles.protocolSub}>Subscribers only</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FOLLOWER NOTIFICATIONS</Text>
              <View style={styles.notifyRow}>
                <View>
                  <Text style={styles.notifyTitle}>Notify followers when stream starts</Text>
                  <Text style={styles.notifySub}>Push + in-app alert broadcast</Text>
                </View>
                <Switch
                  value={notifyFollowers}
                  onValueChange={setNotifyFollowers}
                  trackColor={{ false: '#334155', true: '#a21caf' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressText}>Syncing broadcast data...</Text>
          <Text style={styles.progressValue}>{progressValue}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {currentStep !== 'protocol' ? (
          <Pressable onPress={handleNext} disabled={!canGoNext()} style={[styles.primaryBtn, !canGoNext() && styles.primaryBtnDisabled]}>
            <Text style={styles.primaryBtnText}>NEXT</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('CreatorLiveStream')}
            style={[styles.primaryBtn, { backgroundColor: '#7c3aed' }]}
          >
            <Text style={styles.primaryBtnText}>GO LIVE NOW</Text>
            <MaterialIcons name="sensors" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111218',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { color: '#fff', fontSize: fontScale(18), fontFamily: 'PlusJakartaSansExtraBold' },
  readyPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.4)',
    backgroundColor: 'rgba(205,43,238,0.15)',
  },
  readyText: { color: '#cd2bee', fontSize: fontScale(9), letterSpacing: 1.2, fontFamily: 'PlusJakartaSansExtraBold' },
  stepperRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  stepTrack: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: 15,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepFill: { height: '100%', backgroundColor: '#cd2bee' },
  stepItem: { alignItems: 'center', gap: 6, zIndex: 2 },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#111218',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  stepIconCompleted: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  stepLabel: { color: '#6b7280', fontSize: fontScale(8), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
  stepLabelActive: { color: '#cd2bee' },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 220, gap: 18 },
  sectionWrap: { gap: 22 },
  section: { gap: 10 },
  sectionLabel: { color: '#6b7280', fontSize: fontScale(10), letterSpacing: 1.6, fontFamily: 'PlusJakartaSansExtraBold' },
  previewCard: {
    height: 210,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(205,43,238,0.45)',
  },
  previewImg: { width: '100%', height: '100%', opacity: 0.65 },
  previewOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  previewIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
    backgroundColor: 'rgba(205,43,238,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityGrid: { flexDirection: 'row', gap: 8 },
  qualityItem: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  qualityItemActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  qualityLabel: { color: '#e5e7eb', fontSize: fontScale(18), fontFamily: 'PlusJakartaSansExtraBold' },
  qualityBitrate: { color: '#9ca3af', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  qualityTextActive: { color: '#fff' },
  helperText: { color: '#9ca3af', fontSize: fontScale(11), fontFamily: 'PlusJakartaSansMedium' },
  titleInput: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: fontScale(16),
    fontFamily: 'PlusJakartaSansBold',
  },
  vibeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vibeChipActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  vibeText: { color: '#9ca3af', fontSize: fontScale(10), letterSpacing: 0.8, fontFamily: 'PlusJakartaSansExtraBold' },
  vibeTextActive: { color: '#fff' },
  protocolRow: { flexDirection: 'row', gap: 10 },
  protocolCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    gap: 8,
  },
  protocolCardPublic: { borderColor: '#cd2bee', backgroundColor: 'rgba(205,43,238,0.12)' },
  protocolCardPremium: { borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,0.12)' },
  protocolTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  protocolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterPublic: { borderColor: '#cd2bee' },
  radioOuterPremium: { borderColor: '#eab308' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cd2bee' },
  radioInnerPremium: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#eab308' },
  protocolTitle: { color: '#fff', fontSize: fontScale(14), fontFamily: 'PlusJakartaSansExtraBold' },
  protocolSub: { color: '#94a3b8', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  notifyRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifyTitle: { color: '#fff', fontSize: fontScale(13), fontFamily: 'PlusJakartaSansBold' },
  notifySub: { color: '#94a3b8', fontSize: fontScale(10), marginTop: 2, fontFamily: 'PlusJakartaSansMedium' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#111218',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { color: '#94a3b8', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  progressValue: { color: '#cd2bee', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  progressTrack: {
    height: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#cd2bee' },
  primaryBtn: {
    height: 54,
    borderRadius: 20,
    backgroundColor: '#cd2bee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: '#fff', fontSize: fontScale(13), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
});

export default GoLiveSetup;
