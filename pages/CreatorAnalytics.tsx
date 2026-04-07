import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';

type RangeOption = '7d' | '30d' | 'All';

const RANGE_FACTORS: Record<RangeOption, number> = {
  '7d': 0.4,
  '30d': 1,
  All: 1.8,
};

const SOURCE_COLORS = ['#cd2bee', '#3b82f6', '#2ecc71', '#f59e0b'];

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

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={s.safeTop}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={s.iconButton}>
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <Text style={s.headerTitle}>Deep Insights</Text>
          </View>
          <View style={s.rangeWrap}>
            {(['7d', '30d', 'All'] as const).map((range) => {
              const isActive = range === activeRange;
              return (
                <Pressable
                  key={range}
                  onPress={() => setActiveRange(range)}
                  style={[s.rangePill, isActive && s.rangePillActive]}
                >
                  <Text style={[s.rangeText, isActive && s.rangeTextActive]}>{range}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.metricGrid}>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>15.4%</Text>
            <Text style={s.metricLabel}>Avg. Retention</Text>
          </View>
          <View style={[s.metricCard, s.metricCardPrimary]}>
            <Text style={[s.metricValue, { color: '#cd2bee' }]}>{(8.2 * rangeFactor).toFixed(1)}m</Text>
            <Text style={[s.metricLabel, { color: '#cd2bee99' }]}>Watch Mins</Text>
          </View>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>{Math.round(240 * rangeFactor)}</Text>
            <Text style={s.metricLabel}>Avg. Viewers</Text>
          </View>
        </View>

        <View style={s.cardGlow}>
          <View style={s.auditCard}>
            <View style={s.auditTop}>
              <View style={s.auditTitleRow}>
                <View style={s.auditIconWrap}>
                  <MaterialIcons name="analytics" size={22} color="#cd2bee" />
                </View>
                <View>
                  <Text style={s.auditTitle}>AI Performance Audit</Text>
                  <Text style={s.auditSubtitle}>Powered by Gemini</Text>
                </View>
              </View>
              <Pressable onPress={runAIAudit} disabled={isAiLoading} style={s.refreshBtn}>
                {isAiLoading ? (
                  <ActivityIndicator size="small" color="#cd2bee" />
                ) : (
                  <MaterialIcons name="sync" size={20} color="#cd2bee" />
                )}
              </Pressable>
            </View>
            <Text style={s.auditText}>
              {isAiLoading
                ? 'Synthesizing cross-platform engagement data...'
                : aiInsight || 'No audit data yet.'}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Community Growth</Text>
          <View style={s.panel}>
            {adjustedGrowth.map((point) => {
              const subsWidth = `${Math.max((point.subs / maxGrowth) * 100, 6)}%` as `${number}%`;
              const activeWidth = `${Math.max((point.active / maxGrowth) * 100, 6)}%` as `${number}%`;
              return (
                <View key={point.name} style={s.rowBlock}>
                  <Text style={s.rowLabel}>{point.name}</Text>
                  <View style={s.track}>
                    <View style={[s.fill, { width: subsWidth, backgroundColor: '#cd2bee' }]} />
                    <View style={[s.fillThin, { width: activeWidth, backgroundColor: '#3b82f6' }]} />
                  </View>
                  <View style={s.rowValues}>
                    <Text style={s.rowValue}>Subs {point.subs.toLocaleString()}</Text>
                    <Text style={s.rowValueMuted}>Active {point.active.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={s.sourceSection}>
          <View style={s.sourceCol}>
            <Text style={s.sectionTitleCenter}>View Sources</Text>
            <View style={s.panel}>
              <View style={s.pieLegendWrap}>
                {sourceData.map((item, idx) => (
                  <View key={item.name} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }]} />
                    <Text style={s.legendName}>{item.name}</Text>
                    <Text style={s.legendValue}>{item.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={s.sourceCol}>
            <Text style={s.sectionTitleCenter}>Top Regions</Text>
            <View style={s.panel}>
              {audienceData.map((region) => (
                <View key={region.country} style={s.regionRow}>
                  <View style={s.regionHead}>
                    <Text style={s.regionCountry}>{region.country}</Text>
                    <Text style={s.regionPct}>{region.percent}%</Text>
                  </View>
                  <View style={s.regionTrack}>
                  <View style={[s.regionFill, { width: `${region.percent}%` as `${number}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={s.sectionTitle}>Interaction Density</Text>
            <Text style={s.totalText}>Total: {(totalInteractions / 1000).toFixed(1)}k</Text>
          </View>
          <View style={s.panel}>
            {adjustedEngagement.map((item) => (
              <View key={item.name} style={s.engagementRow}>
                <Text style={s.engagementLabel}>{item.name}</Text>
                <View style={s.engagementTrack}>
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
                <Text style={s.engagementValue}>{(item.value / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Content Efficiency</Text>
          {[
            { type: 'Live Streams', efficiency: 94, trend: 'up', icon: 'sensors' },
            { type: 'Exclusives (Premium)', efficiency: 82, trend: 'up', icon: 'stars' },
            { type: 'Galaxy Clips (Feed)', efficiency: 65, trend: 'down', icon: 'movie' },
          ].map((item) => {
            const rising = item.trend === 'up';
            return (
              <View key={item.type} style={s.effCard}>
                <View style={s.effLeft}>
                  <View style={s.effIconWrap}>
                    <MaterialIcons name={item.icon as any} size={20} color="#a1a1aa" />
                  </View>
                  <View>
                    <Text style={s.effType}>{item.type}</Text>
                    <Text style={s.effMeta}>Performance Score</Text>
                  </View>
                </View>
                <View style={s.effRight}>
                  <View style={s.effValueRow}>
                    <Text style={s.effValue}>{item.efficiency}%</Text>
                    <MaterialIcons
                      name={rising ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={rising ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                  <Text style={s.effMeta}>vs prev period</Text>
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
  headerTitle: { color: '#fff', fontSize: fontScale(16), fontWeight: '900' },
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
  rangeText: { color: '#9093a7', fontSize: fontScale(10), fontWeight: '900', textTransform: 'uppercase' },
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
  metricValue: { color: '#fff', fontSize: fontScale(22), fontWeight: '900' },
  metricLabel: {
    color: '#8d91a8',
    fontSize: fontScale(8),
    fontWeight: '900',
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
  auditTitle: { color: '#cd2bee', fontWeight: '900', fontSize: fontScale(9), letterSpacing: 1.6, textTransform: 'uppercase' },
  auditSubtitle: { color: '#cd2bee99', fontSize: fontScale(7), fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
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
    fontSize: fontScale(13),
    lineHeight: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#cd2bee77',
    paddingLeft: 8,
    fontStyle: 'italic',
  },
  section: { gap: 8 },
  sectionTitle: {
    color: '#8d91a8',
    fontSize: fontScale(9),
    fontWeight: '900',
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
  rowLabel: { color: '#d5d6e2', fontSize: fontScale(10), fontWeight: '700' },
  track: { height: 14, backgroundColor: '#ffffff0f', borderRadius: 999, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 14, borderRadius: 999, opacity: 0.25 },
  fillThin: { position: 'absolute', left: 0, height: 4, borderRadius: 999 },
  rowValues: { flexDirection: 'row', justifyContent: 'space-between' },
  rowValue: { color: '#cd2bee', fontSize: fontScale(10), fontWeight: '800' },
  rowValueMuted: { color: '#60a5fa', fontSize: fontScale(10), fontWeight: '800' },
  sourceSection: { flexDirection: 'row', gap: 8 },
  sourceCol: { flex: 1, gap: 8 },
  sectionTitleCenter: {
    color: '#8d91a8',
    fontSize: fontScale(10),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  pieLegendWrap: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { color: '#d4d6e4', fontSize: fontScale(9), flex: 1 },
  legendValue: { color: '#fff', fontSize: fontScale(10), fontWeight: '900' },
  regionRow: { gap: 3 },
  regionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  regionCountry: { color: '#d4d6e4', fontSize: fontScale(10), fontWeight: '700' },
  regionPct: { color: '#cd2bee', fontSize: fontScale(10), fontWeight: '900' },
  regionTrack: { height: 6, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  regionFill: { height: '100%', borderRadius: 999, backgroundColor: '#cd2bee88' },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { color: '#cd2bee', fontSize: fontScale(9), fontWeight: '900', textTransform: 'uppercase' },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  engagementLabel: { color: '#d4d6e4', fontSize: fontScale(10), width: 66 },
  engagementTrack: { flex: 1, height: 14, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  engagementFill: { height: '100%', borderRadius: 999 },
  engagementValue: { color: '#fff', fontSize: fontScale(10), fontWeight: '800', width: 40, textAlign: 'right' },
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
  effType: { color: '#fff', fontWeight: '800', fontSize: fontScale(13) },
  effMeta: { color: '#8d91a8', fontSize: fontScale(9), fontWeight: '800', textTransform: 'uppercase' },
  effRight: { alignItems: 'flex-end' },
  effValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  effValue: { color: '#fff', fontWeight: '900', fontSize: fontScale(16) },
});

export default CreatorAnalytics;
