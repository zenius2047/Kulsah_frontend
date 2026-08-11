import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
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
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { fontSize } from '../typography';

type RangeOption = '7d' | '30d' | 'All';

const RANGE_FACTORS: Record<RangeOption, number> = {
  '7d': 0.4,
  '30d': 1,
  All: 1.8,
};

const SOURCE_COLORS = [PRIMARY_COLOR, '#3b82f6', '#2ecc71', '#f59e0b'];
const GROWTH_CHART = { width: 320, top: 18, bottom: 138, left: 20, right: 300 };

type ChartPoint = { x: number; y: number };

const getSmoothPath = (points: ChartPoint[]) =>
  points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, '');

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
    { name: 'Week 5', subs: 3120, active: 2660 },
  ];

  const engagementData = [
    { name: 'Likes', value: 45000, color: PRIMARY_COLOR },
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

  const growthChart = useMemo(() => {
    const chartHeight = GROWTH_CHART.bottom - GROWTH_CHART.top;
    const chartWidth = GROWTH_CHART.right - GROWTH_CHART.left;
    const xStep = chartWidth / Math.max(adjustedGrowth.length - 1, 1);
    const toY = (value: number) =>
      GROWTH_CHART.bottom - (value / maxGrowth) * chartHeight;
    const subsPoints = adjustedGrowth.map((point, index) => ({
      x: GROWTH_CHART.left + index * xStep,
      y: toY(point.subs),
    }));
    const activePoints = adjustedGrowth.map((point, index) => ({
      x: GROWTH_CHART.left + index * xStep,
      y: toY(point.active),
    }));
    const subsPath = getSmoothPath(subsPoints);

    return {
      subsPoints,
      activePoints,
      subsPath,
      activePath: getSmoothPath(activePoints),
      areaPath: `${subsPath} L ${subsPoints.at(-1)?.x ?? GROWTH_CHART.right} ${GROWTH_CHART.bottom} L ${GROWTH_CHART.left} ${GROWTH_CHART.bottom} Z`,
    };
  }, [adjustedGrowth, maxGrowth]);

  const communityGrowthPercent = useMemo(() => {
    const first = adjustedGrowth[0]?.subs ?? 0;
    const last = adjustedGrowth.at(-1)?.subs ?? first;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [adjustedGrowth]);

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
  const headerBackground = isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.94)';
  const cardBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const softSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const softSurfaceStrong = isDark ? 'rgba(255,255,255,0.08)' : theme.surface;
  const textPrimary = isDark ? '#fff' : theme.text;
  const textSecondary = isDark ? '#d4d6e4' : theme.textSecondary;
  const textMuted = isDark ? '#8d91a8' : theme.textMuted;
  const accent = theme.accent;
  const accentSoft = isDark ? primaryColorAlphaHex('14') : theme.accentSoft;
  const accentBorder = isDark ? primaryColorAlphaHex('44') : primaryColorAlpha(0.2);
  const accentMuted = isDark ? primaryColorAlphaHex('99') : primaryColorAlpha(0.68);
  const blueMuted = isDark ? '#60a5fa' : '#2563eb';
  const trackBackground = isDark ? '#ffffff0f' : 'rgba(15,23,42,0.08)';

  return (
    <View style={[s.screen, { backgroundColor: shellBackground }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={[s.safeTop, { backgroundColor: headerBackground }]}>
        <View style={[s.header, { borderBottomColor: cardBorder }]}>
          <View style={s.headerLeft}>
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
            <View style={s.growthSummary}>
              <View>
                <Text style={[s.growthTotal, { color: textPrimary }]}>
                  {adjustedGrowth.at(-1)?.subs.toLocaleString()}
                </Text>
                <Text style={[s.growthCaption, { color: textMuted }]}>Total community</Text>
              </View>
              <View style={[s.growthBadge, { backgroundColor: primaryColorAlpha(0.12) }]}>
                <MaterialIcons name="trending-up" size={15} color={accent} />
                <Text style={[s.growthBadgeText, { color: accent }]}>
                  +{communityGrowthPercent.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={s.growthLegend}>
              <View style={s.growthLegendItem}>
                <View style={[s.growthLegendDot, { backgroundColor: accent }]} />
                <Text style={[s.growthLegendText, { color: textSecondary }]}>Subscribers</Text>
              </View>
              <View style={s.growthLegendItem}>
                <View style={[s.growthLegendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[s.growthLegendText, { color: textSecondary }]}>Active</Text>
              </View>
            </View>

            <Svg width="100%" height={190} viewBox={`0 0 ${GROWTH_CHART.width} 180`}>
              <Defs>
                <SvgLinearGradient id="subscriberArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={accent} stopOpacity="0.38" />
                  <Stop offset="1" stopColor={accent} stopOpacity="0.02" />
                </SvgLinearGradient>
              </Defs>
              {[GROWTH_CHART.top, 58, 98, GROWTH_CHART.bottom].map((y) => (
                <Line
                  key={y}
                  x1={GROWTH_CHART.left}
                  x2={GROWTH_CHART.right}
                  y1={y}
                  y2={y}
                  stroke={trackBackground}
                  strokeWidth={1}
                />
              ))}
              <Path d={growthChart.areaPath} fill="url(#subscriberArea)" />
              <Path
                d={growthChart.subsPath}
                fill="none"
                stroke={accent}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <Path
                d={growthChart.activePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              {growthChart.subsPoints.map((point, index) => (
                <Circle
                  key={`subs-${adjustedGrowth[index].name}`}
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={cardBackground}
                  stroke={accent}
                  strokeWidth={2.5}
                />
              ))}
              {growthChart.activePoints.map((point, index) => (
                <Circle
                  key={`active-${adjustedGrowth[index].name}`}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={cardBackground}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              ))}
              {adjustedGrowth.map((point, index) => (
                <SvgText
                  key={point.name}
                  x={growthChart.subsPoints[index].x}
                  y={163}
                  fill={textMuted}
                  fontFamily="Poppins_500Medium"
                  fontSize={8}
                  textAnchor="middle"
                >
                  {`W${index + 1}`}
                </SvgText>
              ))}
            </Svg>
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
                  <View style={[s.regionFill, { width: `${region.percent}%` as `${number}%`, backgroundColor: isDark ? primaryColorAlphaHex('88') : accentMuted }]} />
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
  safeTop: { backgroundColor: 'rgba(6,9,19,0.94)' },
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
  headerTitle: { color: '#fff', ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', letterSpacing: 2 },
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
  rangePillActive: { backgroundColor: PRIMARY_COLOR },
  rangeText: { color: '#9093a7', ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, textTransform: 'uppercase' },
  rangeTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricCardPrimary: { borderColor: primaryColorAlphaHex('44'), backgroundColor: primaryColorAlphaHex('14') },
  metricValue: { color: '#fff', ...fontSize.n3, lineHeight: fontSize.n3.lineHeight, fontFamily: 'PlusJakartaSans_600SemiBold' },
  metricLabel: {
    color: '#8d91a8',
    ...fontSize.b5Variant,
    lineHeight: fontSize.b5Variant.lineHeight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cardGlow: { borderRadius: 24, backgroundColor: primaryColorAlphaHex('12'), padding: 1 },
  auditCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: primaryColorAlphaHex('44'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 10,
  },
  auditTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  auditTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auditIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: primaryColorAlphaHex('22'),
    borderWidth: 1,
    borderColor: primaryColorAlphaHex('44'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitle: { color: PRIMARY_COLOR, ...fontSize.mediumTitleText, lineHeight: fontSize.mediumTitleText.lineHeight, letterSpacing: 1.6, textTransform: 'uppercase' },
  auditSubtitle: { color: primaryColorAlphaHex('99'), ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', marginTop: 2 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlphaHex('22'),
  },
  auditText: {
    color: '#f8f8ff',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    borderLeftWidth: 2,
    borderLeftColor: primaryColorAlphaHex('77'),
    paddingLeft: 8,
    fontStyle: 'italic',
  },
  section: { gap: 8 },
  sectionTitle: {
    color: '#8d91a8',
    ...fontSize.mediumTitleText,
    lineHeight: fontSize.mediumTitleText.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2.1,
    paddingHorizontal: 2,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    gap: 10,
  },
  growthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  growthTotal: {
    ...fontSize.n3,
    lineHeight: fontSize.n3.lineHeight,
  },
  growthCaption: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  growthBadgeText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  growthLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  growthLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  growthLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  growthLegendText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  rowBlock: { gap: 4 },
  rowLabel: { color: '#d5d6e2', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  track: { height: 14, backgroundColor: '#ffffff0f', borderRadius: 999, overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 14, borderRadius: 999, opacity: 0.25 },
  fillThin: { position: 'absolute', left: 0, height: 4, borderRadius: 999 },
  rowValues: { flexDirection: 'row', justifyContent: 'space-between' },
  rowValue: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  rowValueMuted: { color: '#60a5fa', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  sourceSection: { flexDirection: 'row', gap: 8, },
  sourceCol: { flex: 1, gap: 8 },
  sectionTitleCenter: {
    color: '#8d91a8',
    ...fontSize.mediumTitleText,
    lineHeight: fontSize.mediumTitleText.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  pieLegendWrap: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { color: '#d4d6e4', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, flex: 1 },
  legendValue: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  regionRow: { gap: 3 },
  regionHead: { flexDirection: 'row', justifyContent: 'space-between' },
  regionCountry: { color: '#d4d6e4', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  regionPct: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  regionTrack: { height: 6, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  regionFill: { height: '100%', borderRadius: 999, backgroundColor: primaryColorAlphaHex('88') },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  engagementLabel: { color: '#d4d6e4', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, width: 66 },
  engagementTrack: { flex: 1, height: 14, borderRadius: 999, backgroundColor: '#ffffff10', overflow: 'hidden' },
  engagementFill: { height: '100%', borderRadius: 999 },
  engagementValue: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, width: 40, textAlign: 'right' },
  effCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff12',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  effType: { color: '#fff', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  effMeta: { color: '#8d91a8', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  effRight: { alignItems: 'flex-end' },
  effValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  effValue: { color: '#fff', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
});

export default CreatorAnalytics;

