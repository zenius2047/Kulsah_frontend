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

type HistoryStatus = 'Winner' | 'Top 10%' | 'Participated';

type HistoryItem = {
  id: string;
  date: string;
  status: HistoryStatus;
  title: string;
  description: string;
  rank: string;
  reward: string;
  image: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const historyItems: HistoryItem[] = [
  {
    id: 'winner',
    date: 'Oct 24, 2023',
    status: 'Winner',
    title: 'Neon Skyline Photography',
    description: 'Capturing the pulse of the city at 3 AM. A study in blue and violet light.',
    rank: '#1 / 1,420',
    reward: '500 PULSE',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdAuR_1unZsKcgfCtXDcy06pIRRIRa8SR72uNP9K1WBO9_SFN8lrxWSa4Gvia1O1eSWAJ2Q0Kjj6SRBZh1DNscxtJEIdUu476maUj4_UUWY3czqTfm7RA34iNvfa4ZbTQS_z30WAfc8sI0GV6QEvT33fktDF7c9ZyvQcmt9bTSCkCcfSwhUieVv_WmxcyH5u6A5-x5B17AEoiId7wwLWviAuaE_IZn8IE-S9zMEMW1x4zGOtstDHFxsHG7WhusJRACzFIgp6GEGVxD',
    icon: 'military-tech',
  },
  {
    id: 'top10',
    date: 'Sep 12, 2023',
    status: 'Top 10%',
    title: 'Liquid Motion Graphics',
    description: 'Procedural animations simulating high-viscosity digital fluids.',
    rank: '#42 / 850',
    reward: 'Badge Earned',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAli96ohiwMXIRI6mWSkLoGGIgFMqp-R_HlnB00akbV1mux4u2pm_u5HCgMUi3zUtT2iZGBMzjAFtUgCsQvANZx9mFkl2Eqy_T37b7BcAZdHxgG94YobRQkmxUjhWWcVDWSqy3EwSa_PniiR0RZymtZ6zxIX6XisRqYKMcJQWa9bcs0CR2TnWW1TC_t-Lwix91NLQn2IQYprCXvtiy9fR-TGI9durhMKI0ETMGlzLjPIlH6kp0FBnXGnE1KrHq2T_D5iW4FWRaRgqxG',
    icon: 'star',
  },
  {
    id: 'participated',
    date: 'Aug 29, 2023',
    status: 'Participated',
    title: 'Streetwear Concept Art',
    description: 'Cyberpunk aesthetic applied to traditional urban fashion silhouettes.',
    rank: '#210 / 2,100',
    reward: 'Exp +50',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8TYMYfZQEinhyGk6mjzYAbp4Nk4QxmlRN4u8Lnd62jqEj1BXmFRr0Qw1a6KS0qh9z5P_7OShesPjjg2hZQVEveIJjoZRVmnl0iM8DleEi0wIklJkGqlVNMIU84aPFlv43Pg_eT43ptDH-v0-BlDSmEgEAUiKComKLKm10jfguKsPxPcmEHaqQyZBZJq0dDv_0V0CdcNyVykQDMHHJpgjXQGQeLYHXPI9KawVStFuHirgtQ_VzHIacGUdn-N_Wd_5gNOlOXct5gWqe',
    icon: 'history',
  },
];

const ParticipantHistory: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={isDark ? ['#120816', '#0a050d', '#050207'] : ['#f8fafc', '#eef2ff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.canvas}>
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.pageTitle, { color: theme.text }]}>Participation History</Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                Review your past performance and legendary moments.
              </Text>
            </View>

            <View style={styles.timelineWrap}>
              <LinearGradient
                colors={['rgba(147,13,242,0.3)', 'rgba(217,21,210,0.18)', 'transparent']}
                style={[styles.timelineLine, isTablet ? styles.timelineLineTablet : null]}
              />

              {historyItems.map((item) => {
                const isWinner = item.status === 'Winner';
                const isTopTen = item.status === 'Top 10%';

                return (
                  <View key={item.id} style={[styles.timelineItem, isTablet ? styles.timelineItemTablet : null]}>
                    <View style={[styles.timelineBadge, { backgroundColor: theme.screen, borderColor: theme.border }, isWinner ? styles.timelineBadgeWinner : null]}>
                      <MaterialIcons
                        name={item.icon}
                        size={isTablet ? 26 : 22}
                        color={isWinner ? '#d915d2' : isTopTen ? '#930df2' : theme.textMuted}
                      />
                    </View>

                    <View style={[styles.historyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.card, borderColor: theme.border }]}>
                      <View style={[styles.historyContentRow, isTablet ? styles.historyContentRowTablet : null]}>
                        <View style={styles.historyMain}>
                          <View style={styles.metaRow}>
                            <Text style={[styles.dateText, isWinner ? styles.dateTextWinner : null]}>
                              {item.date}
                            </Text>
                            <View
                              style={[
                                styles.statusPill,
                                isWinner
                                  ? styles.statusPillWinner
                                  : isTopTen
                                    ? styles.statusPillTopTen
                                    : styles.statusPillNeutral,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusPillText,
                                  isWinner
                                    ? styles.statusPillTextWinner
                                    : isTopTen
                                      ? styles.statusPillTextTopTen
                                      : styles.statusPillTextNeutral,
                                ]}
                              >
                                {item.status}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>{item.description}</Text>

                          <View style={styles.statsRow}>
                            <View style={styles.statBlock}>
                              <Text style={styles.statLabel}>Rank</Text>
                              <Text style={[styles.statValue, { color: theme.text }]}>{item.rank}</Text>
                            </View>
                            <View style={styles.statBlock}>
                              <Text style={styles.statLabel}>Reward</Text>
                              <Text
                                style={[
                                  styles.statValue,
                                  isWinner
                                    ? styles.rewardWinner
                                    : isTopTen
                                      ? styles.rewardTopTen
                                      : styles.rewardNeutral,
                                ]}
                              >
                                {item.reward}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.previewColumn}>
                          <Image source={{ uri: item.image }} style={[styles.previewImage, { borderColor: theme.border }]} />
                          <Pressable style={styles.viewEntryButton}>
                            <Text style={styles.viewEntryText}>View Entry</Text>
                            <MaterialIcons name="open-in-new" size={14} color="#930df2" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={{
              height: 100,
            }}/>
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
  sectionHeader: {
    marginBottom: 28,
  },
  pageTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
  },
  timelineWrap: {
    position: 'relative',
    gap: 22,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 999,
  },
  timelineLineTablet: {
    left: 31,
  },
  timelineItem: {
    paddingLeft: 56,
    position: 'relative',
  },
  timelineItemTablet: {
    paddingLeft: 80,
  },
  timelineBadge: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0a050d',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineBadgeWinner: {
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  historyCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  historyContentRow: {
    gap: 18,
  },
  historyContentRowTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMain: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  dateText: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  dateTextWinner: {
    color: '#d915d2',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillWinner: {
    backgroundColor: 'rgba(217,21,210,0.18)',
  },
  statusPillTopTen: {
    backgroundColor: 'rgba(147,13,242,0.18)',
  },
  statusPillNeutral: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusPillText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
  },
  statusPillTextWinner: {
    color: '#d915d2',
  },
  statusPillTextTopTen: {
    color: '#930df2',
  },
  statusPillTextNeutral: {
    color: '#94A3B8',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
    marginBottom: 8,
  },
  cardDescription: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 26,
    flexWrap: 'wrap',
  },
  statBlock: {
    minWidth: 110,
  },
  statLabel: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
  },
  rewardWinner: {
    color: '#d915d2',
  },
  rewardTopTen: {
    color: '#930df2',
  },
  rewardNeutral: {
    color: '#64748B',
  },
  previewColumn: {
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 96,
    height: 128,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewEntryText: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default ParticipantHistory;
