import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

type RangeOption = '7d' | '30d' | 'All';

const RANGE_FACTORS: Record<RangeOption, number> = {
  '7d': 0.4,
  '30d': 1,
  All: 1.8,
};

const SOURCE_COLORS = ['#cd2bee', '#3b82f6', '#2ecc71', '#f59e0b'];
const responsiveFont = (size: number) => (mediumScreen ? fontScale(size - 4) : fontScale(size));

const CreatorAnalytics: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [activeRange, setActiveRange] = useState<RangeOption>('30d');

  const growthData = [
    { name: 'Week 1', subs: 2100, active: 1800 },
    { name: 'Week 2', subs: 2350, active: 1950 },
    { name: 'Week 3', subs: 2600, active: 2200 },
    { name: 'Week 4', subs: 2842, active: 2400 },
  ];

  const engagementData = [
    { name: 'Likes', value: 45000, color: '#cd2bee' },
    { name: 'Comments', value: 12000, color: '#3b82f6' },
    { name: 'Shares', value: 8500, color: '#2ecc71' },
    { name: 'Saves', value: 3400, color: '#f59e0b' },
  ];

  const audienceData = [
    { country: 'USA', percent: 45 },
    { country: 'UK', percent: 22 },
    { country: 'Germany', percent: 12 },
    { country: 'Japan', percent: 8 },
    { country: 'Other', percent: 13 },
  ];

  const sourceData = [
    { name: 'Galaxy Feed', value: 55 },
    { name: 'Search', value: 20 },
    { name: 'Sub Notifications', value: 15 },
    { name: 'Direct Links', value: 10 },
  ];

  const rangeFactor = RANGE_FACTORS[activeRange];

  const adjustedGrowth = useMemo(
    () =>
      growthData.map((item) => ({
        ...item,
        subs: Math.round(item.subs * rangeFactor),
        active: Math.round(item.active * rangeFactor),
      })),
    [rangeFactor],
  );

  const adjustedEngagement = useMemo(
    () => engagementData.map((item) => ({ ...item, value: Math.round(item.value * rangeFactor) })),
    [rangeFactor],
  );

  const totalInteractions = useMemo(
    () => adjustedEngagement.reduce((sum, item) => sum + item.value, 0),
    [adjustedEngagement],
  );

  const maxGrowth = useMemo(
    () => Math.max(...adjustedGrowth.map((item) => item.subs), 1),
    [adjustedGrowth],
  );

  const maxEngagement = useMemo(
    () => Math.max(...adjustedEngagement.map((item) => item.value), 1),
    [adjustedEngagement],
  );

  const runAIAudit = async () => {
    setIsAiLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error('Missing API key');
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents:
          'You are a creator performance analyst for Pulsar. Review these stats: 2,842 subs, 45k views, 15% conversion rate. Weekend engagement is 3x higher than weekdays. Give a specific 2-sentence performance audit for Mila Ray.',
      });

      const text = (response as { text?: string }).text;
      setAiInsight(
        text || 'Engagement is peaking during weekend live sessions. Schedule high-value content drops on Saturdays to maximize conversion.',
      );
    } catch (error) {
      console.error('AI Audit Error:', error);
      setAiInsight(
        'Conversion from view to subscriber is 15%, which is 5% above industry average. Double down on weekend live streams to maintain this momentum.',
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    void runAIAudit();
  }, []);

  const shellBackground = isDark ? '#060913' : theme.background;
  const headerBackground = isDark ? '#1f1022d4' : 'rgba(255,255,255,0.94)';
  const cardBackground = isDark ? '#1f1022bf' : theme.card;
  const cardBorder = isDark ? '#ffffff12' : theme.border;
  const softSurface = isDark ? '#ffffff10' : theme.surface;
  const softSurfaceStrong = isDark ? '#ffffff12' : theme.surface;
  const textPrimary = isDark ? '#fff' : theme.text;
  const textSecondary = isDark ? '#d4d6e4' : theme.textSecondary;
  const textMuted = isDark ? '#8d91a8' : theme.textMuted;
  const accent = theme.accent;
  const accentSoft = isDark ? '#cd2bee14' : theme.accentSoft;
  const accentBorder = isDark ? '#cd2bee44' : 'rgba(217,21,210,0.2)';
  const accentMuted = isDark ? '#cd2bee99' : 'rgba(217,21,210,0.68)';
  const blueMuted = isDark ? '#60a5fa' : '#2563eb';
  const trackBackground = isDark ? '#ffffff0f' : 'rgba(15,23,42,0.08)';

  return (
    <View style={[s.screen, { backgroundColor: shellBackground }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={[s.safeTop, { backgroundColor: headerBackground }]}>
        <View style={[s.header, { borderBottomColor: cardBorder }]}>
          <View style={s.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={[s.iconButton, { backgroundColor: softSurfaceStrong, borderColor: cardBorder }]}>
              <MaterialIcons name="chevron-left" size={20} color={textPrimary} />
            </Pressable>
            <Text style={[s.headerTitle, { color: textPrimary }]}>Deep Insights</Text>
          </View>
          <View style={[s.rangeWrap, { backgroundColor: softSurface, borderColor: cardBorder }]}>
            {(['7d', '30d', 'All'] as const).map((range) => {
              const isActive = range === activeRange;
              return (
                <Pressable
                  key={range}
                  onPress={() => setActiveRange(range)}
                  style={[s.rangePill, isActive && s.rangePillActive, isActive && { backgroundColor: accent }]}
                >
                  <Text style={[s.rangeText, { color: isActive ? '#fff' : textMuted }, isActive && s.rangeTextActive]}>{range}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.metricGrid}>
          <View style={[s.metricCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
            <Text style={[s.metricValue, { color: textPrimary }]}>15.4%</Text>
            <Text style={[s.metricLabel, { color: textMuted }]}>Avg. Retention</Text>
          </View>
          <View style={[s.metricCard, s.metricCardPrimary, { borderColor: accentBorder, backgroundColor: accentSoft }]}>
            <Text style={[s.metricValue, { color: accent }]}>{(8.2 * rangeFactor).toFixed(1)}m</Text>
            <Text style={[s.metricLabel, { color: accentMuted }]}>Watch Mins</Text>
          </View>
          <View style={[s.metricCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
            <Text style={[s.metricValue, { color: textPrimary }]}>{Math.round(240 * rangeFactor)}</Text>
            <Text style={[s.metricLabel, { color: textMuted }]}>Avg. Viewers</Text>
          </View>
        </View>

        {/* <View style={[s.cardGlow, { backgroundColor: accentSoft }]}>
          <View style={[s.auditCard, { borderColor: accentBorder, backgroundColor: cardBackground }]}>
            <View style={s.auditTop}>
              <View style={s.auditTitleRow}>
                <View style={[s.auditIconWrap, { backgroundColor: accentSoft, borderColor: accentBorder }]}>
                  <MaterialIcons name="analytics" size={22} color={accent} />
                </View>
                <View>
                  <Text style={[s.auditTitle, { color: accent }]}>AI Performance Audit</Text>
                  <Text style={[s.auditSubtitle, { color: accentMuted }]}>Powered by Gemini</Text>
                </View>
              </View>
              <Pressable onPress={runAIAudit} disabled={isAiLoading} style={[s.refreshBtn, { backgroundColor: accentSoft }]}>
                {isAiLoading ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <MaterialIcons name="sync" size={20} color={accent} />
                )}
              </Pressable>
            </View>
            <Text style={[s.auditText, { color: textPrimary, borderLeftColor: accentMuted }]}>
              {isAiLoading
                ? 'Synthesizing cross-platform engagement data...'
                : aiInsight || 'No audit data yet.'}
            </Text>
          </View>
        </View> */}

        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: textMuted }]}>Community Growth</Text>
          <View style={[s.panel, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
            {adjustedGrowth.map((point) => {
              const subsWidth = `${Math.max((point.subs / maxGrowth) * 100, 6)}%` as `${number}%`;
              const activeWidth = `${Math.max((point.active / maxGrowth) * 100, 6)}%` as `${number}%`;
              return (
                <View key={point.name} style={s.rowBlock}>
                  <Text style={[s.rowLabel, { color: textSecondary }]}>{point.name}</Text>
                  <View style={[s.track, { backgroundColor: trackBackground }]}>
                    <View style={[s.fill, { width: subsWidth, backgroundColor: accent }]} />
                    <View style={[s.fillThin, { width: activeWidth, backgroundColor: '#3b82f6' }]} />
                  </View>
                  <View style={s.rowValues}>
                    <Text style={[s.rowValue, { color: accent }]}>Subs {point.subs.toLocaleString()}</Text>
                    <Text style={[s.rowValueMuted, { color: blueMuted }]}>Active {point.active.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={s.sourceSection}>
          <View style={s.sourceCol}>
            <Text style={[s.sectionTitleCenter, { color: textMuted }]}>View Sources</Text>
            <View style={[s.panel, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
              <View style={s.pieLegendWrap}>
                {sourceData.map((item, idx) => (
                  <View key={item.name} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }]} />
                    <Text style={[s.legendName, { color: textSecondary }]}>{item.name}</Text>
                    <Text style={[s.legendValue, { color: textPrimary }]}>{item.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[s.sourceCol,]}>
            <Text style={[s.sectionTitleCenter, { color: textMuted }]}>Top Regions</Text>
            <View style={[s.panel, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
              {audienceData.map((region) => (
                <View key={region.country} style={s.regionRow}>
                  <View style={s.regionHead}>
                    <Text style={[s.regionCountry, { color: textSecondary }]}>{region.country}</Text>
                    <Text style={[s.regionPct, { color: accent }]}>{region.percent}%</Text>
                  </View>
                  <View style={[s.regionTrack, { backgroundColor: trackBackground }]}>
                  <View style={[s.regionFill, { width: `${region.percent}%` as `${number}%`, backgroundColor: isDark ? '#cd2bee88' : accentMuted }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>Interaction Density</Text>
            <Text style={[s.totalText, { color: accent }]}>Total: {(totalInteractions / 1000).toFixed(1)}k</Text>
          </View>
          <View style={[s.panel, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
            {adjustedEngagement.map((item) => (
              <View key={item.name} style={s.engagementRow}>
                <Text style={[s.engagementLabel, { color: textSecondary }]}>{item.name}</Text>
                <View style={[s.engagementTrack, { backgroundColor: trackBackground }]}>
                  <View
                    style={[
                      s.engagementFill,
                      {
                        width: `${Math.max((item.value / maxEngagement) * 100, 8)}%` as `${number}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.engagementValue, { color: textPrimary }]}>{(item.value / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: textMuted }]}>Content Efficiency</Text>
          {[
            { type: 'Live Streams', efficiency: 94, trend: 'up', icon: 'sensors' },
            { type: 'Exclusives (Premium)', efficiency: 82, trend: 'up', icon: 'stars' },
            { type: 'Galaxy Clips (Feed)', efficiency: 65, trend: 'down', icon: 'movie' },
          ].map((item) => {
            const rising = item.trend === 'up';
            return (
              <View key={item.type} style={[s.effCard, { borderColor: cardBorder, backgroundColor: cardBackground }]}>
                <View style={s.effLeft}>
                  <View style={[s.effIconWrap, { backgroundColor: softSurface, borderColor: cardBorder }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={textMuted} />
                  </View>
                  <View>
                    <Text style={[s.effType, { color: textPrimary }]}>{item.type}</Text>
                    <Text style={[s.effMeta, { color: textMuted }]}>Performance Score</Text>
                  </View>
                </View>
                <View style={s.effRight}>
                  <View style={s.effValueRow}>
                    <Text style={[s.effValue, { color: textPrimary }]}>{item.efficiency}%</Text>
                    <MaterialIcons
                      name={rising ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={rising ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                  <Text style={[s.effMeta, { color: textMuted }]}>vs prev period</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913' },
  safeTop: { backgroundColor: '#1f1022d4' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff14',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff12',
    borderWidth: 1,
    borderColor: '#ffffff14',
  },
  headerTitle: { color: '#fff', fontSize: responsiveFont(14), fontFamily: 'PlusJakartaSansExtraBold' },
  rangeWrap: {
    flexDirection: 'row',
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff12',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  rangePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  rangePillActive: { backgroundColor: '#cd2bee' },
  rangeText: { color: '#9093a7', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  rangeTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: '#1f1022bf',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricCardPrimary: { borderColor: '#cd2bee44', backgroundColor: '#cd2bee14' },
  metricValue: { color: '#fff', fontSize: responsiveFont(16), fontFamily: 'PlusJakartaSansExtraBold' },
  metricLabel: {
    color: '#8d91a8',
    fontSize: responsiveFont(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cardGlow: { borderRadius: 24, backgroundColor: '#cd2bee12', padding: 1 },
  auditCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cd2bee44',
    backgroundColor: '#1f1022e6',
    padding: 14,
    gap: 10,
  },
  auditTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  auditTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auditIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#cd2bee22',
    borderWidth: 1,
    borderColor: '#cd2bee44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitle: { color: '#cd2bee', fontFamily: 'PlusJakartaSansExtraBold', fontSize: responsiveFont(9), letterSpacing: 1.6, textTransform: 'uppercase' },
  auditSubtitle: { color: '#cd2bee99', fontSize: responsiveFont(7), fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase', marginTop: 2 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee22',
  },
  auditText: {
    color: '#f8f8ff',
    fontSize: responsiveFont(13),
    lineHeight: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#cd2bee77',
    paddingLeft: 8,
    fontStyle: 'italic',
    fontFamily: 'PlusJakartaSansMedium',
  },
  section: { gap: 8 },
  sectionTitle: {
    color: '#8d91a8',
    fontSize: responsiveFont(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2.1,
    paddingHorizontal: 2,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: '#1f1022bf',
    padding: 12,
    gap: 10,
  },
  rowBlock: { gap: 4 },
  rowLabel: { color: '#d5d6e2', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansBold' },
  track: { height: 14, backgroundColor: '#ffffff0f', borderRadius: 999, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 14, borderRadius: 999, opacity: 0.25 },
  fillThin: { position: 'absolute', left: 0, height: 4, borderRadius: 999 },
  rowValues: { flexDirection: 'row', justifyContent: 'space-between' },
  rowValue: { color: '#cd2bee', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansBold' },
  rowValueMuted: { color: '#60a5fa', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansBold' },
  sourceSection: { flexDirection: 'row', gap: 8, },
  sourceCol: { flex: 1, gap: 8 },
  sectionTitleCenter: {
    color: '#8d91a8',
    fontSize: responsiveFont(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  pieLegendWrap: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { color: '#d4d6e4', fontSize: responsiveFont(9), flex: 1, fontFamily: 'PlusJakartaSansMedium' },
  legendValue: { color: '#fff', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansExtraBold' },
  regionRow: { gap: 3 },
  regionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  regionCountry: { color: '#d4d6e4', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansBold' },
  regionPct: { color: '#cd2bee', fontSize: responsiveFont(10), fontFamily: 'PlusJakartaSansExtraBold' },
  regionTrack: { height: 6, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  regionFill: { height: '100%', borderRadius: 999, backgroundColor: '#cd2bee88' },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { color: '#cd2bee', fontSize: responsiveFont(9), fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  engagementLabel: { color: '#d4d6e4', fontSize: responsiveFont(10), width: 66, fontFamily: 'PlusJakartaSansMedium' },
  engagementTrack: { flex: 1, height: 14, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  engagementFill: { height: '100%', borderRadius: 999 },
  engagementValue: { color: '#fff', fontSize: responsiveFont(10), width: 40, textAlign: 'right', fontFamily: 'PlusJakartaSansBold' },
  effCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: '#1f1022bf',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  effLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  effIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff0e',
    borderWidth: 1,
    borderColor: '#ffffff12',
  },
  effType: { color: '#fff', fontSize: responsiveFont(12), fontFamily: 'PlusJakartaSansBold' },
  effMeta: { color: '#8d91a8', fontSize: responsiveFont(8), fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase' },
  effRight: { alignItems: 'flex-end' },
  effValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  effValue: { color: '#fff', fontSize: responsiveFont(12), fontFamily: 'PlusJakartaSansExtraBold' },
});

export default CreatorAnalytics;

