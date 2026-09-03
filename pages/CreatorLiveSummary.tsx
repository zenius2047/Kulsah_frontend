import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { useLiveAnalytics, useLiveSession } from '../src/hooks/live/useLive';
import type { LiveSession } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { formatLiveCount } from '../src/utils/live';
import { fontSize } from './typography';

type LiveSummaryRoute = {
  params?: {
    liveSessionId?: string;
    endedLive?: LiveSession;
  };
};

const formatDuration = (startedAt?: string | null, endedAt?: string | null) => {
  if (!startedAt || !endedAt) return '—';
  const seconds = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${remainingSeconds}s`;
};

const CreatorLiveSummary: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<LiveSummaryRoute>();
  const liveSessionId = route.params?.liveSessionId ?? route.params?.endedLive?.id ?? '';
  const liveQuery = useLiveSession(liveSessionId, Boolean(liveSessionId));
  const analyticsQuery = useLiveAnalytics(liveSessionId, Boolean(liveSessionId));
  const live = liveQuery.data ?? route.params?.endedLive;
  const analytics = analyticsQuery.data;
  const isRefreshing = liveQuery.isRefetching || analyticsQuery.isRefetching;

  const stats = [
    { label: 'Duration', value: formatDuration(live?.started_at, live?.ended_at), icon: 'schedule' as const },
    { label: 'Unique viewers', value: formatLiveCount(analytics?.unique_viewers ?? live?.unique_viewers ?? 0), icon: 'groups' as const },
    { label: 'Peak viewers', value: formatLiveCount(analytics?.peak_viewers ?? live?.peak_viewers ?? 0), icon: 'trending-up' as const },
    { label: 'Average viewers', value: formatLiveCount(analytics?.average_viewers ?? live?.average_viewers ?? 0), icon: 'visibility' as const },
    { label: 'Likes', value: formatLiveCount(analytics?.likes_count ?? live?.likes_count ?? 0), icon: 'favorite' as const },
    { label: 'Comments', value: formatLiveCount(analytics?.comments_count ?? live?.comments_count ?? 0), icon: 'chat-bubble' as const },
    { label: 'Gifts', value: formatLiveCount(analytics?.gifts_count ?? live?.gifts_count ?? 0), icon: 'redeem' as const },
    { label: 'Earnings', value: `${formatLiveCount(analytics?.creator_earnings_kc ?? live?.earnings_kc ?? 0)} KC`, icon: 'paid' as const },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#201025', '#100812', '#050505']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.navigate('MainTabs')}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Live summary</Text>
        <Pressable
          style={styles.headerButton}
          disabled={isRefreshing}
          onPress={() => void Promise.all([liveQuery.refetch(), analyticsQuery.refetch()])}
        >
          {isRefreshing ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="refresh" size={23} color="#fff" />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {live?.cover_url ? <Image source={{ uri: live.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
          <View style={styles.endedPill}>
            <MaterialIcons name="sensors-off" size={15} color="#fff" />
            <Text style={styles.endedText}>ENDED</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{live?.title ?? 'Your Live'}</Text>
            <Text style={styles.heroSubtitle}>
              {live?.termination_reason === 'creator_ended' ? 'You ended this Live.' : 'The Live session has finished.'}
            </Text>
          </View>
        </View>

        {analyticsQuery.isError ? (
          <View style={styles.errorCard}>
            <MaterialIcons name="info-outline" size={19} color="#fbbf24" />
            <Text style={styles.errorText}>{getApiErrorMessage(analyticsQuery.error)}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <MaterialIcons name={stat.icon} size={20} color={PRIMARY_COLOR} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.replace('GoLive')}>
          <MaterialIcons name="sensors" size={21} color="#fff" />
          <Text style={styles.primaryButtonText}>START ANOTHER LIVE</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.secondaryButtonText}>Back to dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  headerButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', textAlign: 'center', ...fontSize.b3 },
  content: { padding: 16, paddingBottom: 36 },
  hero: { minHeight: 290, borderRadius: 24, overflow: 'hidden', backgroundColor: '#32113c' },
  endedPill: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: 'rgba(220,38,38,0.92)' },
  endedText: { color: '#fff', ...fontSize.b5, letterSpacing: 1.4 },
  heroCopy: { marginTop: 'auto', padding: 18 },
  heroTitle: { color: '#fff', ...fontSize.b1, lineHeight: 30 },
  heroSubtitle: { color: '#cbd5e1', marginTop: 6, ...fontSize.b4 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, borderRadius: 14, padding: 12, backgroundColor: 'rgba(245,158,11,0.12)' },
  errorText: { flex: 1, color: '#fde68a', ...fontSize.b5 },
  sectionTitle: { color: '#fff', marginTop: 24, marginBottom: 12, ...fontSize.b1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', minHeight: 116, borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  statValue: { color: '#fff', marginTop: 11, ...fontSize.b1 },
  statLabel: { color: '#94a3b8', marginTop: 4, ...fontSize.b5 },
  primaryButton: { height: 56, marginTop: 24, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY_COLOR, shadowColor: PRIMARY_COLOR, shadowOpacity: 0.3, shadowRadius: 18 },
  primaryButtonText: { color: '#fff', ...fontSize.b4, letterSpacing: 1.2 },
  secondaryButton: { height: 52, marginTop: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColorAlpha(0.1) },
  secondaryButtonText: { color: '#e9d5ff', ...fontSize.b4 },
});

export default CreatorLiveSummary;
