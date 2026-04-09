import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

type StreakData = {
  count: number;
};

type StreakRewardItem = {
  name: string;
  days: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
};

const STREAK_REWARDS: StreakRewardItem[] = [
  { name: 'Spark Badge', days: 3, icon: 'bolt', color: '#f59e0b' },
  { name: 'Comet Pass', days: 7, icon: 'rocket-launch', color: '#a855f7' },
  { name: 'Nebula Crown', days: 14, icon: 'auto-awesome', color: '#d915d2' },
  { name: 'Galaxy Legend', days: 30, icon: 'stars', color: '#22c55e' },
];

const getStreakData = (): StreakData => ({ count: 6 });

const StreakReward: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [streak, setStreak] = useState<StreakData>(getStreakData());

  useEffect(() => {
    setStreak(getStreakData());
  }, []);

  const shell = isDark ? '#0a050d' : theme.background;
  const headerBg = isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const card = isDark ? 'rgba(255,255,255,0.04)' : theme.card;
  const textPrimary = isDark ? '#ffffff' : theme.text;
  const textMuted = isDark ? '#94a3b8' : theme.textSecondary;
  const labelMuted = isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted;
  const softBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: shell }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: shell }]}>
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: softBg, borderColor: border }]}
          >
            <MaterialIcons name="chevron-left" size={22} color={textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>STREAK REWARDS</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.fireGlow} pointerEvents="none" />
            <View style={[styles.streakCard, { backgroundColor: card, borderColor: 'rgba(249,115,22,0.25)' }]}>
              <View style={styles.fireIconWrap}>
                <MaterialIcons name="local-fire-department" size={52} color="#ffffff" />
              </View>
              <Text style={[styles.streakCount, { color: textPrimary }]}>{streak.count}</Text>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
              <Text style={[styles.streakDesc, { color: textMuted }]}>
                Keep the fire burning. Visit Kulsah daily to unlock exclusive galaxy rewards.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: labelMuted }]}>GALAXY MILESTONES</Text>
            <View style={styles.list}>
              {STREAK_REWARDS.map((reward) => {
                const isUnlocked = streak.count >= reward.days;
                const progress = Math.min(100, (streak.count / reward.days) * 100);

                return (
                  <View
                    key={reward.name}
                    style={[
                      styles.rewardCard,
                      {
                        backgroundColor: isUnlocked ? 'rgba(147,13,242,0.08)' : card,
                        borderColor: isUnlocked ? 'rgba(147,13,242,0.3)' : border,
                        opacity: isUnlocked ? 1 : 0.8,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <View style={styles.rowStart}>
                        <View
                          style={[
                            styles.iconWrap,
                            {
                              backgroundColor: isUnlocked ? softBg : 'rgba(148,163,184,0.14)',
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={reward.icon}
                            size={28}
                            color={isUnlocked ? reward.color : '#94a3b8'}
                          />
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.rewardName,
                              { color: isUnlocked ? textPrimary : textMuted },
                            ]}
                          >
                            {reward.name}
                          </Text>
                          <Text style={[styles.rewardDays, { color: labelMuted }]}>
                            {reward.days} DAY MILESTONE
                          </Text>
                        </View>
                      </View>

                      {isUnlocked ? (
                        <View style={styles.unlockedPill}>
                          <MaterialIcons name="check" size={18} color="#22c55e" />
                        </View>
                      ) : (
                        <View style={styles.daysLeftWrap}>
                          <Text style={[styles.daysLeftValue, { color: textPrimary }]}>
                            {reward.days - streak.count}
                          </Text>
                          <Text style={[styles.daysLeftLabel, { color: labelMuted }]}>
                            DAYS LEFT
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isUnlocked && (
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: softBg, borderColor: border }]}>
            <MaterialIcons name="info" size={26} color="#930df2" />
            <Text style={[styles.infoTitle, { color: textPrimary }]}>HOW IT WORKS</Text>
            <Text style={[styles.infoBody, { color: textMuted }]}>
              Streaks are based on your daily transmissions. Miss a day and the streak resets.
              Unlocked rewards appear on your profile as badges.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 26 },
  fireGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    marginHorizontal: 'auto',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  streakCard: {
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fireIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  streakCount: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(36),
    lineHeight: fontScale(40),
  },
  streakLabel: {
    marginTop: 2,
    color: '#f97316',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    letterSpacing: 3.5,
  },
  streakDesc: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
    lineHeight: fontScale(14),
    maxWidth: 220,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 2,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    letterSpacing: 2.5,
  },
  list: { gap: 10 },
  rewardCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardName: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
  },
  rewardDays: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(7),
    letterSpacing: 1.2,
  },
  unlockedPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  daysLeftWrap: { alignItems: 'flex-end' },
  daysLeftValue: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
  },
  daysLeftLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(6.5),
    letterSpacing: 1.2,
  },
  progressTrack: {
    marginTop: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#930df2',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  infoBody: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
    lineHeight: fontScale(14),
  },
});

export default StreakReward;
