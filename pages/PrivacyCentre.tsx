import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

type ProtocolNode = {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const PrivacyCentre: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const exportTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [allowLocation, setAllowLocation] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const [diagnostics, setDiagnostics] = useState(false);
  const [stealthVisits, setStealthVisits] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isConfirmEraseOpen, setIsConfirmEraseOpen] = useState(false);
  const [eraseStep, setEraseStep] = useState(1);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleRunExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    exportTimerRef.current = setInterval(() => {
      setExportProgress((current) => {
        const next = Math.min(current + 20, 100);
        if (next >= 100 && exportTimerRef.current) {
          clearInterval(exportTimerRef.current);
          exportTimerRef.current = null;
          setTimeout(() => {
            setIsExporting(false);
            setExportProgress(0);
            triggerToast('Identity archive prepared successfully!');
          }, 600);
        }
        return next;
      });
    }, 500);
  };

  const executeNodeWipe = async () => {
    setEraseStep(2);
    setTimeout(() => {
      void (async () => {
        await AsyncStorage.multiRemove(['pulsar_challenge_drafts', 'pulsar_challenges']);
        setIsConfirmEraseOpen(false);
        setEraseStep(1);
        triggerToast('Your diagnostic node registry has been soft-erased!');
      })();
    }, 2000);
  };

  const surface = isDark ? '#12121a' : theme.card;
  const softSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const cardSurface = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const muted = isDark ? 'rgba(255,255,255,0.4)' : theme.textMuted;
  const secondary = isDark ? 'rgba(255,255,255,0.62)' : theme.textSecondary;

  const protocolNodes: ProtocolNode[] = [
    {
      label: 'Geocentric Antenna Alignment',
      desc: 'Grant coarse city location context to find nearby live events and local sound waves.',
      enabled: allowLocation,
      onToggle: () => setAllowLocation((prev) => !prev),
      icon: 'near-me',
    },
    {
      label: 'Algorithmic Personalization',
      desc: 'Allow our recommended engines to curate challenges and stream broadcasts matching your taste patterns.',
      enabled: personalization,
      onToggle: () => setPersonalization((prev) => !prev),
      icon: 'insights',
    },
    {
      label: 'Stealth Profile Exploration',
      desc: 'Prevent creators from knowing when you observe their open-chamber livestreams.',
      enabled: stealthVisits,
      onToggle: () => setStealthVisits((prev) => !prev),
      icon: 'visibility-off',
    },
    {
      label: 'Ecosystem Telemetry Logs',
      desc: 'Transmit performance crash logs to aid engineers in strengthening app responsiveness.',
      enabled: diagnostics,
      onToggle: () => setDiagnostics((prev) => !prev),
      icon: 'developer-mode',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(18,18,26,0.92)' : 'rgba(255,255,255,0.94)', borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Centre</Text>
            {/* <Text style={[styles.headerSubtitle, { color: muted }]}>Control your footprint</Text> */}
          </View>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: primaryColorAlpha(0.12) }]}>
          <MaterialIcons name="admin-panel-settings" size={22} color={PRIMARY_COLOR} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.introCard, { backgroundColor: cardSurface, borderColor: border }]}>
          <View style={styles.securityRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.securityText}>End-To-End Security Active</Text>
          </View>
          <Text style={[styles.introText, { color: secondary }]}>
            At Kulsah, we build networks that respect digital boundaries. Take full command over what telemetry signals you broadcast, who views your collections, and audit your saved archive.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: muted }]}>Privacy Protocols</Text>
          <View style={styles.cardList}>
            {protocolNodes.map((node) => (
              <View key={node.label} style={[styles.protocolCard, { backgroundColor: cardSurface, borderColor: border }]}>
                <View style={styles.protocolLeft}>
                  <View style={[styles.protocolIcon, { backgroundColor: softSurface }]}>
                    <MaterialIcons name={node.icon} size={20} color={PRIMARY_COLOR} />
                  </View>
                  <View style={styles.protocolCopy}>
                    <Text style={[styles.protocolTitle, { color: theme.text }]}>{node.label}</Text>
                    <Text style={[styles.protocolBody, { color: muted }]}>{node.desc}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={node.onToggle}
                  style={[styles.switchTrack, { backgroundColor: node.enabled ? PRIMARY_COLOR : softSurface }]}
                >
                  <View style={[styles.switchKnob, node.enabled && styles.switchKnobActive]} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: muted }]}>Identity & Archives</Text>

          <View style={[styles.archiveCard, { backgroundColor: cardSurface, borderColor: border }]}>
            <View style={styles.archiveHeader}>
              <View style={[styles.archiveIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <MaterialIcons name="download-for-offline" size={21} color="#3b82f6" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.archiveTitle, { color: theme.text }]}>Download Identity Vault</Text>
                <Text style={[styles.archiveBody, { color: muted }]}>
                  Extract a secure JSON copy of your profile states, memberships, and active permissions.
                </Text>
              </View>
            </View>

            {isExporting ? (
              <View style={styles.progressBlock}>
                <View style={[styles.progressTrack, { backgroundColor: softSurface }]}>
                  <View style={[styles.progressFill, { width: `${exportProgress}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: muted }]}>Extracting Node...</Text>
                  <Text style={[styles.progressLabel, { color: muted }]}>{exportProgress}%</Text>
                </View>
              </View>
            ) : (
              <Pressable onPress={handleRunExport} style={styles.exportButton}>
                <MaterialIcons name="download" size={16} color="#3b82f6" />
                <Text style={styles.exportButtonText}>Request Archive Extraction</Text>
              </Pressable>
            )}
          </View>

          <View style={[styles.eraseCard, { backgroundColor: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.2)' }]}>
            <View style={styles.archiveHeader}>
              <View style={[styles.archiveIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <MaterialIcons name="delete-sweep" size={21} color="#ef4444" />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.eraseTitle}>Purge Node Coordinates</Text>
                <Text style={[styles.archiveBody, { color: muted }]}>
                  Clear your cached challenges, locally constructed workspace blueprints, and settings metadata.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setEraseStep(1);
                setIsConfirmEraseOpen(true);
              }}
              style={styles.eraseButton}
            >
              <MaterialIcons name="dangerous" size={16} color="#ef4444" />
              <Text style={styles.eraseButtonText}>Execute Node Purge Protocol</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isConfirmEraseOpen} transparent animationType="fade" onRequestClose={() => setIsConfirmEraseOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => eraseStep === 1 && setIsConfirmEraseOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: surface, borderColor: border }]}>
            {eraseStep === 1 ? (
              <>
                <View style={styles.warningIcon}>
                  <MaterialIcons name="warning" size={34} color="#ef4444" />
                </View>
                <View style={styles.modalCopy}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm Node Purge</Text>
                  <Text style={[styles.modalBody, { color: secondary }]}>
                    This action will soft-purge your drafts history and saved orbits. Your cloud authenticated credentials will remain secure. Are you sure you want to proceed?
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  <Pressable onPress={() => void executeNodeWipe()} style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>Confirm Wipe</Text>
                  </Pressable>
                  <Pressable onPress={() => setIsConfirmEraseOpen(false)} style={[styles.abortButton, { backgroundColor: softSurface, borderColor: border }]}>
                    <Text style={[styles.abortButtonText, { color: theme.text }]}>Abort</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.purgingBlock}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.purgingText}>Purging telemetry indexes...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {showToast ? (
        <View style={[styles.toast, { bottom: 24 + insets.bottom }]}>
          <MaterialIcons name="verified-user" size={16} color={PRIMARY_COLOR} />
          <Text style={styles.toastText}>{showToast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...fontSize.h1,
    lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    marginTop: 2,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 28,
  },
  introCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
  },
  securityText: {
    color: PRIMARY_COLOR,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  introText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '600',
  },
  section: {
    gap: 14,
  },
  sectionLabel: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '900',
  },
  cardList: {
    gap: 12,
  },
  protocolCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  protocolLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  protocolIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolCopy: {
    flex: 1,
    gap: 5,
  },
  protocolTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  protocolBody: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '600',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 4,
  },
  switchKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  switchKnobActive: {
    transform: [{ translateX: 20 }],
  },
  archiveCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  eraseCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  archiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  archiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  eraseTitle: {
    color: '#ef4444',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  archiveBody: {
    marginTop: 5,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '600',
  },
  exportButton: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.22)',
    backgroundColor: 'rgba(59,130,246,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    color: '#3b82f6',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '900',
  },
  eraseButton: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eraseButtonText: {
    color: '#ef4444',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '900',
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCopy: {
    gap: 8,
  },
  modalTitle: {
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: '900',
  },
  modalBody: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  abortButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abortButtonText: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  purgingBlock: {
    paddingVertical: 28,
    gap: 16,
    alignItems: 'center',
  },
  purgingText: {
    color: '#ef4444',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toastText: {
    flexShrink: 1,
    color: '#ffffff',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default PrivacyCentre;
