import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const PREVIEW_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD4p7h11bg5U9Z6RSsPsIfQk-rlU3SruP7pi_FImXVehBiQsAwlOuVbyN142vLLex2bMPo6nnXl3vH53AZcipo_URsznvwCtv41wCTYP9RB4vvJMkuvoRMiiJ8XexsgadolwG-XWhAbTtvYnHWgiRB8C159wxZB3iXLdeOKxMfaF_NqvzxB3_F7B5GVjO5RgJmOhaPPy2ojQu109ZNEFr2nFpJiYhPuKbpRTzu4nVAoh5GhAjWJTOcWwC3sFCkcuFBMGTSlvdTnNth9';

const participantAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBK9-WpcocLptJ66xgq2w_jtsO6p5L26rRf9FRrzREpSr8olWvaQ6a6lmLIzADrXSWNrr3fwhADDk-PnpZx-F457ZxRP18y5rADk1zc8TurMZdHdKHeZa3lhPtiWYW47S77n0cjLo26gyQfKq1XJJL02VJrnUDQPi11O1jLKwDObg4J7GoLHFQ2H2dmrmdv3PBEBUkUWrcVimI7ZRWBAEa11gjAOdDHX7jvbWZj2fwud2-jBDicPBrValoFB4tiSrHJSG3QpXCQPPeH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD7y7sH937RuRoDN2mZMgF5T45lDePF30txVK58SaM2SbxB1NfvCnObOviBc_I5G_a3pp5zMc5Mt1MEBmVfpngM9_jMiLPgfTAHaOIhysaqG4BqNPKHDQE68WatJAooDsEToS2cqVuzGaJ2a7jvBCcOGNZycUDQvZCRfT2gddzXxjciDB3d6_p2s76p_dNU781GujbCh1X6ZLlYJs0_Rhm_aatQwQ-pfIrF1OFfELGeC_xjoc7IRGoRb76PIuAFI5-PQqLUi66TYThh',
];

const checklistItems = [
  {
    title: 'Entry Fee: Free',
    subtitle: 'Open to all verified creators',
  },
  {
    title: 'Duration: 7 Days',
    subtitle: 'Ends Nov 24, 11:59 PM PST',
  },
  {
    title: 'Category: Performance Art',
    subtitle: "Broadcast to 'Dance' & 'Electronic'",
  },
];

const FinalStep: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const bgGradient = isDark
    ? ['#120617', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const headerBg = isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.92)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : theme.border;
  const iconButtonBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#ffffff' : theme.text;
  const chipBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.glowOne} pointerEvents="none" />
        <View style={styles.glowTwo} pointerEvents="none" /> */}

        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <View style={styles.headerLeft}>
            <Pressable style={[styles.headerButton, { backgroundColor: iconButtonBg }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="close" size={22} color={subtle} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: titleTone }]}>CREATOR PULSE</Text>
          </View>
          <Pressable style={[styles.headerButton, { backgroundColor: iconButtonBg }]}>
            <MaterialIcons name="more-vert" size={22} color={subtle} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 4 of 4: Final Review</Text>
            </View>
            <Text style={[styles.heroTitle, { color: titleTone }]}>Review & Launch</Text>
            <Text style={[styles.heroSubtitle, { color: subtle }]}>
              Your stage is set. Review your challenge parameters before
              broadcasting to the pulse community.
            </Text>
          </View>

          <View style={styles.mainStack}>
            <View style={styles.leftColumn}>
              <View style={styles.previewSection}>
                <Text style={styles.sectionEyebrow}>Live Feed Preview</Text>

                <View style={[styles.previewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.previewMedia}>
                    <Image source={{ uri: PREVIEW_IMAGE }} style={styles.previewImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(10,5,13,0.95)']}
                      locations={[0.35, 1]}
                      style={styles.previewOverlay}
                    />

                    <View style={styles.previewPills}>
                      <View style={styles.hotPill}>
                        <Text style={styles.hotPillText}>HOT NOW</Text>
                      </View>
                      <View style={styles.enteredPill}>
                        <Text style={styles.enteredPillText}>3.4k ENTERED</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.previewBody}>
                    <Text style={[styles.previewTitle, { color: titleTone }]}>Neon Velocity Dance-Off</Text>
                    <Text style={[styles.previewDescription, { color: subtle }]}>
                      Show us your smoothest moves under the pulse. High energy,
                      rhythmic precision, and pure neon aesthetic required.
                    </Text>

                    <View style={styles.joiningRow}>
                      <View style={styles.avatarGroup}>
                        {participantAvatars.map((uri, index) => (
                          <Image
                            key={uri}
                            source={{ uri }}
                            style={[
                              styles.avatar,
                              index > 0 && styles.avatarOverlap,
                            ]}
                          />
                        ))}
                        <View style={[styles.avatarCount, styles.avatarOverlap, { backgroundColor: chipBg, borderColor: cardBorder }]}>
                          <Text style={styles.avatarCountText}>+12</Text>
                        </View>
                      </View>

                      <Text style={styles.joiningText}>Joining now</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.bentoGrid}>
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.infoIconWrap, styles.infoIconPrimary]}>
                      <MaterialIcons name="how-to-vote" size={20} color="#930df2" />
                    </View>
                    <Text style={[styles.infoLabel, { color: subtle }]}>Voting Model</Text>
                  </View>

                  <Text style={[styles.infoTitle, { color: titleTone }]}>Community Consensus</Text>
                  <Text style={[styles.infoText, { color: subtle }]}>
                    Winner decided by 100% audience upvotes. Real-time ranking
                    with pulse-weighted algorithm enabled.
                  </Text>
                </View>

                {/* <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <View style={[styles.infoIconWrap, styles.infoIconSecondary]}>
                      <MaterialIcons name="payments" size={20} color="#d915d2" />
                    </View>
                    <Text style={styles.infoLabel}>Reward Pool</Text>
                  </View>

                  <Text style={styles.rewardValue}>$2,500.00 USD</Text>
                  <View style={styles.rewardChip}>
                    <Text style={styles.rewardChipText}>TOP 1% ELIGIBLE</Text>
                  </View>
                </View> */}
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={[styles.checklistCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.checklistGlow} pointerEvents="none" />

                <View style={styles.checklistHeader}>
                  <MaterialIcons name="assignment-turned-in" size={22} color="#930df2" />
                  <Text style={[styles.checklistTitle, { color: titleTone }]}>Final Checklist</Text>
                </View>

                <View style={styles.checklistList}>
                  {checklistItems.map((item) => (
                    <View key={item.title} style={styles.checklistItem}>
                      <MaterialIcons name="check-circle" size={18} color="#d915d2" />
                      <View style={styles.checklistTextWrap}>
                        <Text style={[styles.checklistItemTitle, { color: titleTone }]}>{item.title}</Text>
                        <Text style={[styles.checklistItemSubtitle, { color: subtle }]}>{item.subtitle}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[styles.costSection, { borderTopColor: cardBorder }]}>
                  <View style={styles.costRow}>
                    <Text style={[styles.costLabel, { color: subtle }]}>Platform Fee</Text>
                    <Text style={[styles.costValue, { color: titleTone }]}>0.00%</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: titleTone }]}>Total to Launch</Text>
                    <Text style={styles.totalValue}>$0.00</Text>
                  </View>
                </View>

                <Pressable style={styles.launchButton}>
                  <Text style={styles.launchButtonText}>Launch Challenge</Text>
                  <MaterialIcons name="rocket-launch" size={20} color="#fff" />
                </Pressable>

                <Text style={[styles.disclaimer, { color: muted }]}>
                  By launching, you agree to the Creator Terms of Service and
                  Pulse Community Guidelines.
                </Text>
              </View>

              <View style={styles.secondaryActions}>
                <Pressable style={[styles.editButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: cardBorder }]}>
                  <MaterialIcons name="edit" size={16} color={subtle} />
                  <Text style={[styles.editButtonText, { color: subtle }]}>Edit Details</Text>
                </Pressable>

                <Pressable style={styles.draftButton}>
                  <Text style={[styles.draftButtonText, { color: muted }]}>Save as Draft</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  glowOne: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(147,13,242,0.16)',
  },
  glowTwo: {
    position: 'absolute',
    top: 240,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(217,21,210,0.10)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(13),
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 28,
  },
  heroSection: {
    gap: 10,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.28)',
  },
  stepBadgeText: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    lineHeight: 40,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(13),
    lineHeight: 22,
    maxWidth: 420,
  },
  mainStack: {
    gap: 24,
  },
  leftColumn: {
    gap: 24,
  },
  rightColumn: {
    gap: 16,
  },
  previewSection: {
    gap: 12,
  },
  sectionEyebrow: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  previewCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewMedia: {
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  previewPills: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  hotPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  hotPillText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
  },
  enteredPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  enteredPillText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
  },
  previewBody: {
    padding: 20,
    gap: 10,
  },
  previewTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
    lineHeight: 32,
  },
  previewDescription: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
    lineHeight: 20,
  },
  joiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarCountText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  joiningText: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
  },
  bentoGrid: {
    gap: 14,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconPrimary: {
    backgroundColor: 'rgba(147,13,242,0.12)',
  },
  infoIconSecondary: {
    backgroundColor: 'rgba(217,21,210,0.12)',
  },
  infoLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  infoTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
    lineHeight: 26,
  },
  infoText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
    lineHeight: 18,
  },
  rewardValue: {
    color: '#ffade8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(24),
  },
  rewardChip: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardChipText: {
    color: '#cbd5e1',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  checklistCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    gap: 20,
  },
  checklistGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(147,13,242,0.16)',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  checklistList: {
    gap: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checklistTextWrap: {
    flex: 1,
    gap: 4,
  },
  checklistItemTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  checklistItemSubtitle: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(11),
  },
  costSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 14,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
  },
  costValue: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  totalValue: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 7,
  },
  launchButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  disclaimer: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    lineHeight: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secondaryActions: {
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
  },
  editButtonText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  draftButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  draftButtonText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
});

export default FinalStep;
