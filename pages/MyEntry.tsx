import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';

type PendingEntry = {
  id: string;
  title: string;
  submittedAt: string;
  image: string;
  progress?: number;
  status: string;
};

const pendingEntries: PendingEntry[] = [
  {
    id: '1',
    title: 'Night City Vibes',
    submittedAt: 'Submitted 2h ago',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB0wncHvvOQO4wyOb-LqZzZpiOvVFFQTysnGIT1zDdafz6VOntUjxmd6ZUAqhfBRU9COwHO6dOvEyP0_wJVUJS68SWdlgYbFA8_vRdV9LQz0n8UhVDLucXQ7BQRnpb5DfihKSQSbMM6ACrMnVZxNQLWqbarFexCQTbWHB0J9nrmn37WBOYL-vJwQ-5QyFB30yb-2Lyi-asGl4RuyYVKDXKJRt2Sx_hNfmNjuVgyl_y9YHno6hAPBefy7vWkUs1aoGzEnoLkeL9QyySO',
    progress: 0.85,
    status: 'Safety Check...',
  },
  {
    id: '2',
    title: 'Neon Reflexes',
    submittedAt: 'Submitted 5h ago',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCO2I4320d9S_AYI-sZaCRRJNSlxpueMYrCSxMHfxrhcSwSCwmxC3PUt-Mdzht5P7cGebHJMlLb5yZ5jF_fQkPcMxrM1UbiawkIIqGnJhxOj-zFD9ol4JW6EdGkMDaAuWE3WEmez1x81IMVO8snKGL9UO8hEL5HpFoXNdJNzKjZUSPWS7UMea6r_81_Q26WJ0EasWNN1SU4blMj7Zx9C7BExdUeEroCO5nh0mBaiBRUTfi9xITeanOGk-pGFxL36XIvgk6Pe-xGrZVE',
    status: 'In Moderator Queue',
  },
];

const voterAvatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDRX_HR8x72VDY0BNiEbOb23LhDP1y_WLRotHSJZPGoCEAGCEe6kPYvyhfYY-q7gJMu-I62lnr_dg1hkzV-pQEzZeC5_Mh2bd2UULh0oV6hVZ21nMiCbcJnfVzvYuFzPAEIp1t-o0kkHv27XfbGSSQ0y5G9Or1dJR1XAkxo1C4DCcV_zkUaV4yD_bFyTO5iMV4wpFbUduV7bCquO2kwUvON0pvU6WSQA-XXtI_-7U4rl6pF-TIgAexKq_8VUQ-BIAjzmHbZd9P1VqM_',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCLsQ3Zc57GS9ExkCOv_2-0rUSla41YD_C4LLbqN8Dvmp2ZCBxiCcx5ouqpkxNyRuP009vYTFGwckfVakw1_PoNcxXglkX-Z3m7fDDHTrA8HGtYP8X1S2vkInue7WopUsHsmOVgChwFyuFn4wXb_D83TivRcWXm8AP9J8Hplh422FkLMuREyhNIhqxx-P_kG0yFNpt3CF9ijdbyAomplR9WIZ8tqfUeEeqCiu6oATJ-iZcTIdJW8mbS0CNjKg9_C8jh0n03r7HQULsP',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAZzh_IPbG6WZ7A0hw44pjSVHLzNqVdKAQTbVXGxgffOZB0ZlIHu8J0eXAeYe5_qZLQWxdhJm_3Si1A372G4nivwEcmwlY-VWpfSXXKhikGA0afS6grouv2Zhl9Wbgr9cbLKmFQFeuHdEYPkBcuOrH9HTlvuqeT-7t3Z0jLpdPkS8pE5AgC42FyMA7G5Sn8dJ-gFX3zldS3kWrPflq1kDUCFTJeYkc2y0DMQV2VbTBlHDupXZZxf5RM4eCrGF9iyrCgSGuUifewiiK2',
];

const MyEntry: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isWide = width >= 1280;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={isDark ? ['#120816', '#0a050d', '#050207'] : ['#f8fafc', '#eef2ff', '#ffffff']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.canvas}>
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <View>
                <Text style={styles.liveLabel}>Live Participation</Text>
                <Text style={[styles.pageTitle, { color: theme.text }]}>Cyberpunk Street Dance</Text>
              </View>

              <View style={[styles.timerPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: theme.border }]}>
                <View style={styles.liveDotOuter}>
                  <View style={styles.liveDotInner} />
                </View>
                <Text style={[styles.timerText, { color: theme.textSecondary }]}>Ends in 14h 22m</Text>
              </View>
            </View>

            <View style={[styles.contentGrid, isWide ? styles.contentGridWide : null]}>
              <View style={[styles.mainColumn, isWide ? styles.mainColumnWide : null]}>
                <View style={[styles.videoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }]}>
                  <View style={styles.videoPreview}>
                    <Image
                      source={{
                        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1KY9XollzUZFMS7QZhfA3QqeVBs2gK-1BXDmmOcUUzBqAg69-GnJnA2MOqk-CQLbhOS43g1p3I4R5skluFZYCmXMumgn7POLv8LqYr33XhOIzJmYhCyTe3s6VyGPpHdmXDFi2kHeZ7YlJ6jLS-QBHxDULuZvdFlrfFlnQJhj8NNt_Zv2vhayonX-lW_3WLKt0FJfz0zFJ0948An5QTsTOrG4qEELgToInkZ3cQwf6D0OArBrJG_SxF3W_l-idTH-NkCYnjgNqAzLY',
                      }}
                      style={styles.videoImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(10,5,13,0.88)']}
                      style={styles.videoOverlay}
                    />

                    <View style={styles.playButton}>
                      <MaterialIcons name="play-arrow" size={34} color="#fff" />
                    </View>

                    <View style={styles.videoStats}>
                      <View>
                      <Text style={[styles.videoStatLabel, { color: theme.textSecondary }]}>Current Rank</Text>
                      <Text style={styles.videoStatValue}>#12</Text>
                      </View>
                      <View style={styles.videoDivider} />
                      <View>
                      <Text style={[styles.videoStatLabel, { color: theme.textSecondary }]}>Total Votes</Text>
                      <Text style={styles.videoStatValue}>2.4K</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.videoFooter}>
                    <View style={styles.voterRow}>
                      <View style={styles.avatarStack}>
                        {voterAvatars.map((uri, index) => (
                          <Image
                            key={uri}
                            source={{ uri }}
                            style={[styles.voterAvatar, { marginLeft: index === 0 ? 0 : -10 }]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.voterText, { color: theme.textSecondary }]}>+142 New Votes today</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable style={[styles.secondaryButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Share Entry</Text>
                      </Pressable>
                      <Pressable style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>View Leaderboard</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.insightsGrid}>
                  <View style={[styles.insightCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }]}>
                    <View style={styles.insightHeader}>
                      <MaterialIcons name="trending-up" size={20} color="#cd2bee" />
                      <Text style={[styles.insightTitle, { color: theme.text }]}>Performance Trend</Text>
                    </View>

                    <View style={styles.chartArea}>
                      {[0.4, 0.65, 0.45, 0.85, 1].map((value, index) => (
                        <View
                          key={String(index)}
                          style={[
                            styles.chartBar,
                            { height: `${value * 100}%` },
                            index === 4 ? styles.chartBarActive : null,
                            index === 3 ? styles.chartBarHighlight : null,
                          ]}
                        />
                      ))}
                    </View>

                    <View style={styles.chartLabels}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Today'].map((label) => (
                        <Text key={label} style={styles.chartLabelText}>
                          {label}
                        </Text>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.insightCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }]}>
                    <View style={styles.insightHeader}>
                      <MaterialIcons name="emoji-events" size={20} color="#cd2bee" />
                      <Text style={[styles.insightTitle, { color: theme.text }]}>Projected Rewards</Text>
                    </View>
                    <Text style={[styles.insightSubtitle, { color: theme.textSecondary }]}>Based on current #12 rank</Text>

                    <Text style={styles.rewardValue}>250 PULSE</Text>
                    <View style={styles.rewardTrack}>
                      <View style={styles.rewardFill} />
                    </View>
                    <Text style={styles.rewardHint}>Top 5% get double bonus</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sideColumn}>
                <View style={styles.pendingHeader}>
                  <Text style={[styles.pendingTitle, { color: theme.text }]}>Pending Approval</Text>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>2 Entries</Text>
                  </View>
                </View>

                {pendingEntries.map((entry) => (
                  <View
                    key={entry.id}
                    style={[styles.pendingCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }, entry.id === '2' ? styles.pendingCardMuted : null]}
                  >
                    <View style={styles.pendingThumbWrap}>
                      <Image source={{ uri: entry.image }} style={styles.pendingThumb} />
                      <View style={styles.pendingThumbOverlay}>
                        <MaterialIcons name="timer" size={18} color="#fff" />
                      </View>
                    </View>

                    <View style={styles.pendingBody}>
                      <View>
                        <Text style={[styles.pendingEntryTitle, { color: theme.text }]}>{entry.title}</Text>
                        <Text style={[styles.pendingEntryTime, { color: theme.textMuted }]}>{entry.submittedAt}</Text>
                      </View>

                      {entry.progress ? (
                        <View style={styles.pendingProgressWrap}>
                          <View style={styles.pendingProgressRow}>
                            <View style={styles.pendingProgressTrack}>
                              <View
                                style={[
                                  styles.pendingProgressFill,
                                  { width: `${entry.progress * 100}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.pendingProgressValue}>
                              {Math.round(entry.progress * 100)}%
                            </Text>
                          </View>
                          <Text style={[styles.pendingStatus, { color: theme.textSecondary }]}>{entry.status}</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingQueueRow}>
                          <MaterialIcons name="visibility" size={14} color={theme.textMuted} />
                          <Text style={[styles.pendingQueueText, { color: theme.textMuted }]}>{entry.status}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                <View style={[styles.guideCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.surface, borderColor: theme.border }]}>
                  <Text style={styles.guideTitle}>Submission Guide</Text>
                  {[
                    'High resolution vertical video',
                    'Minimum 15 seconds duration',
                    'Appropriate visual content',
                  ].map((item) => (
                    <View key={item} style={styles.guideRow}>
                      <MaterialIcons name="check-circle" size={16} color="#cd2bee" />
                      <Text style={[styles.guideText, { color: theme.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
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
  canvas: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerSection: {
    gap: 16,
    marginBottom: 28,
  },
  liveLabel: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pageTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(27),
  },
  timerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  liveDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(205,43,238,0.22)',
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#cd2bee',
  },
  timerText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contentGrid: {
    gap: 24,
  },
  contentGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainColumn: {
    gap: 24,
  },
  mainColumnWide: {
    flex: 2,
  },
  sideColumn: {
    gap: 18,
    flex: 1,
  },
  videoCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  videoPreview: {
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  videoStats: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  videoStatLabel: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  videoStatValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(30),
  },
  videoDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  videoFooter: {
    padding: 20,
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  voterText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#cd2bee',
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
  },
  insightsGrid: {
    gap: 16,
  },
  insightCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  insightTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  chartArea: {
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartBarHighlight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chartBarActive: {
    backgroundColor: '#cd2bee',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chartLabelText: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
  },
  insightSubtitle: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
    marginBottom: 16,
  },
  rewardValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(30),
    fontStyle: 'italic',
    marginBottom: 14,
  },
  rewardTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  rewardFill: {
    width: '66%',
    height: '100%',
    backgroundColor: '#cd2bee',
  },
  rewardHint: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pendingTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
  pendingPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,183,129,0.18)',
  },
  pendingPillText: {
    color: '#ffb781',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pendingCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pendingCardMuted: {
    opacity: 0.82,
  },
  pendingThumbWrap: {
    width: 96,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  pendingThumb: {
    width: '100%',
    height: '100%',
  },
  pendingThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  pendingBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pendingEntryTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
    marginBottom: 4,
  },
  pendingEntryTime: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
  },
  pendingProgressWrap: {
    gap: 8,
  },
  pendingProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  pendingProgressFill: {
    height: '100%',
    backgroundColor: '#ffb781',
  },
  pendingProgressValue: {
    color: '#ffb781',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  pendingStatus: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pendingQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingQueueText: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontStyle: 'italic',
  },
  guideCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  guideTitle: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  guideText: {
    flex: 1,
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(13),
  },
});

export default MyEntry;
