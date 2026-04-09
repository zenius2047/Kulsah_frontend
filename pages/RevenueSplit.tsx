import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { mediumScreen } from '../types';
import { fontScale } from '../fonts';

const CREATOR_RATIO = 0.2;
const WINNER_RATIO = 0.3;
const PLATFORM_RATIO = 0.5;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_REVENUE = 100;
const MAX_REVENUE = 10000;
const STEP = 100;

const RevenueSplit: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [projectedRevenue, setProjectedRevenue] = useState(1000);

  const breakdown = useMemo(
    () => ({
      creator: Math.round(projectedRevenue * CREATOR_RATIO),
      winner: Math.round(projectedRevenue * WINNER_RATIO),
      platform: Math.round(projectedRevenue * PLATFORM_RATIO),
    }),
    [projectedRevenue]
  );

  const progressWidth = `${((projectedRevenue - MIN_REVENUE) / (MAX_REVENUE - MIN_REVENUE)) * 100}%`;
  const bgGradient = isDark
    ? ['#120617', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const headerBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.92)';
  const buttonBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#ffffff' : theme.text;
  const footerFade = isDark
    ? ['rgba(10,5,13,0)', 'rgba(10,5,13,0.9)', '#0a050d']
    : ['rgba(248,250,252,0)', 'rgba(248,250,252,0.92)', '#f8fafc'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.glowPrimary} pointerEvents="none" />
        <View style={styles.glowSecondary} pointerEvents="none" /> */}

        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <Pressable style={[styles.iconButton, { backgroundColor: buttonBg }]} onPress={() => navigation.goBack()}>
            <MaterialIcons name="chevron-left" size={22} color={subtle} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: titleTone }]}>Revenue Split</Text>
          <Pressable style={[styles.iconButton, { backgroundColor: buttonBg }]}>
            <MaterialIcons name="settings" size={22} color={subtle} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chartSection}>
            <View style={styles.chartContainer}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#930df2"
                  strokeWidth="12"
                  strokeDasharray={`${CIRCUMFERENCE * PLATFORM_RATIO} ${CIRCUMFERENCE}`}
                  strokeDashoffset="0"
                  origin="50, 50"
                  rotation="-90"
                />
                <Circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#d915d2"
                  strokeWidth="12"
                  strokeDasharray={`${CIRCUMFERENCE * WINNER_RATIO} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-CIRCUMFERENCE * PLATFORM_RATIO}
                  origin="50, 50"
                  rotation="-90"
                />
                <Circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#d0c1d8"
                  strokeWidth="12"
                  strokeDasharray={`${CIRCUMFERENCE * CREATOR_RATIO} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-CIRCUMFERENCE * (PLATFORM_RATIO + WINNER_RATIO)}
                  origin="50, 50"
                  rotation="-90"
                />
              </Svg>

              <View style={styles.chartCenter}>
                <Text style={[styles.chartValue, { color: titleTone }]}>100%</Text>
                <Text style={[styles.chartLabel, { color: subtle }]}>Total Pool</Text>
              </View>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.creatorDot]} />
                <Text style={[styles.legendLabel, { color: subtle }]}>Creator</Text>
                <Text style={[styles.legendValue, { color: titleTone }]}>20%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.winnerDot]} />
                <Text style={[styles.legendLabel, { color: subtle }]}>Winner</Text>
                <Text style={[styles.legendValue, { color: titleTone }]}>30%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.platformDot]} />
                <Text style={[styles.legendLabel, { color: subtle }]}>Platform</Text>
                <Text style={[styles.legendValue, { color: titleTone }]}>50%</Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.glassCard}>
            <View style={styles.estimateHeader}>
              <View>
                <Text style={styles.estimateLabel}>Projected Revenue</Text>
                <Text style={styles.estimateValue}>${projectedRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.editButton}>
                <MaterialIcons name="edit" size={18} color="#94a3b8" />
              </View>
            </View>

            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepButton}
                onPress={() =>
                  setProjectedRevenue((value) => Math.max(MIN_REVENUE, value - STEP))
                }
              >
                <MaterialIcons name="remove" size={18} color="#ffffff" />
              </Pressable>

              <View style={styles.rangeTrack}>
                <View style={[styles.rangeFill, { width: progressWidth }]} />
                <View style={[styles.rangeThumb, { left: progressWidth }]} />
              </View>

              <Pressable
                style={styles.stepButton}
                onPress={() =>
                  setProjectedRevenue((value) => Math.min(MAX_REVENUE, value + STEP))
                }
              >
                <MaterialIcons name="add" size={18} color="#ffffff" />
              </Pressable>
            </View>

            <View style={styles.sliderScale}>
              <Text style={styles.sliderScaleText}>$100</Text>
              <Text style={styles.sliderScaleText}>$10,000</Text>
            </View>
          </View> */}

          <View style={styles.breakdownSection}>
            <Text style={[styles.breakdownHeading, { color: muted }]}>Detailed Breakdown</Text>

            <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.breakdownIconWrap, styles.creatorWrap]}>
                <MaterialIcons name="stars" size={22} color="#d0c1d8" />
              </View>
              <View style={styles.breakdownBody}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownTitle, { color: titleTone }]}>Your Share (20%)</Text>
                  {/* <Text style={styles.breakdownAmount}>${breakdown.creator}</Text> */}
                </View>
                <Text style={[styles.breakdownText, { color: subtle }]}>
                  Earnings for hosting, managing the audience engagement, and
                  creator-led marketing.
                </Text>
              </View>
            </View>

            <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.breakdownIconWrap, styles.winnerWrap]}>
                <MaterialIcons name="emoji-events" size={22} color="#d915d2" />
              </View>
              <View style={styles.breakdownBody}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownTitle, { color: titleTone }]}>Winner&apos;s Share (30%)</Text>
                  {/* <Text style={styles.breakdownAmount}>${breakdown.winner}</Text> */}
                </View>
                <Text style={[styles.breakdownText, { color: subtle }]}>
                  The jackpot awarded directly to the top-voted participant in
                  this challenge.
                </Text>
              </View>
            </View>

            <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={[styles.breakdownIconWrap, styles.platformWrap]}>
                <MaterialIcons name="hub" size={22} color="#930df2" />
              </View>
              <View style={styles.breakdownBody}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownTitle, { color: titleTone }]}>Platform (50%)</Text>
                  {/* <Text style={styles.breakdownAmount}>${breakdown.platform}</Text> */}
                </View>
                <Text style={[styles.breakdownText, { color: subtle }]}>
                  Covers secure payment processing, high-speed streaming, and
                  platform maintenance.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <LinearGradient
            colors={footerFade}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
          onPress={()=>(
            navigation.navigate("RewardConfig")
  )}
          style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Confirm Split & Continue</Text>
          </Pressable>
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
  glowPrimary: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(147,13,242,0.18)',
  },
  glowSecondary: {
    position: 'absolute',
    top: 220,
    left: -60,
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
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 18:15,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 24,
  },
  chartSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartContainer: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  chartValue: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 29:25,
  },
  chartLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14:10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  legendRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  legendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  creatorDot: {
    backgroundColor: '#d0c1d8',
  },
  winnerDot: {
    backgroundColor: '#d915d2',
  },
  platformDot: {
    backgroundColor: '#930df2',
  },
  legendLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  legendValue: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? 19:15,
  },
  glassCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  estimateLabel: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  estimateValue: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(34),
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rangeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  rangeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: '#d915d2',
  },
  rangeThumb: {
    position: 'absolute',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d915d2',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  sliderScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderScaleText: {
    color: '#64748b',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  breakdownSection: {
    gap: 14,
  },
  breakdownHeading: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? 13:9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
  breakdownCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  breakdownIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorWrap: {
    backgroundColor: 'rgba(208,193,216,0.12)',
  },
  winnerWrap: {
    backgroundColor: 'rgba(217,21,210,0.12)',
  },
  platformWrap: {
    backgroundColor: 'rgba(147,13,242,0.12)',
  },
  breakdownBody: {
    flex: 1,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
    flex: 1,
  },
  breakdownAmount: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(24),
  },
  breakdownText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen? 16:12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  footerButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 8,
  },
  footerButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? 14:10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default RevenueSplit;

