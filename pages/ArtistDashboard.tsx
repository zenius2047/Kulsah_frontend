import React, { useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlphaHex } from "../theme";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEIGHT, user, WIDTH } from '../types';
import NotificationIcon from '../assets/icons/notifications-svg.svg';
import MovieIcon from '../assets/icons/movie-edit-svg.svg';
import TicketIcon from '../assets/icons/ticket-svg.svg';
import ForumIcon from '../assets/icons/forum-svg.svg';
import PlayCircle from '../assets/icons/play-circle-svg.svg';
import StarsIcon from '../assets/icons/stars-svg.svg';
import { fontSize } from './typography';
import { useCreatorVideoAnalytics } from '../src';
// import PlayCircleIcon '../assets/icons/play-circle-svg.svg';

interface ArtistDashboardProps {
  onToggleRole?: () => void;
}

type MetricItem = {
  label: string;
  value: string;
  growth: string;
  icon: string;
  color: string;
  path: string;
};

type Collab = {
  id: number;
  partner: string;
  type: string;
  status: string;
  avatar: string;
  color: string; };

const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ onToggleRole }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { data: videoAnalytics } = useCreatorVideoAnalytics();

  const formatCompact = (value?: number) => {
    const safeValue = Number(value ?? 0);
    if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(1)}M`;
    if (safeValue >= 1_000) return `${(safeValue / 1_000).toFixed(1)}K`;
    return String(safeValue);
  };

  const viewData = [
    { name: 'Mon', views: 4200 },
    { name: 'Tue', views: 3800 },
    { name: 'Wed', views: 8400 },
    { name: 'Thu', views: 5100 },
    { name: 'Fri', views: 6200 },
    { name: 'Sat', views: 9500 },
    { name: 'Sun', views: 7800 },
  ];

  const metrics: MetricItem[] = [
    { label: 'Total Videos', value: formatCompact(videoAnalytics?.total_videos ?? 0), growth: `${videoAnalytics?.ready_videos ?? 0} ready`, icon: 'sensors', color: '#22c55e', path: 'Analytics' },
    { label: 'Subscribers', value: '2,842', growth: '+5.2%', icon: 'stars', color: PRIMARY_COLOR, path: '/subscribers' },
    { label: 'Total Views', value: formatCompact(videoAnalytics?.total_views ?? 0), growth: `${formatCompact(videoAnalytics?.average_views ?? 0)} avg`, icon: 'play-circle-filled', color: '#3b82f6', path: '/creator/revenue' },
    { label: 'Engagement', value: formatCompact((videoAnalytics?.total_likes ?? 0) + (videoAnalytics?.total_comments ?? 0)), growth: `${videoAnalytics?.premium_videos ?? 0} premium`, icon: 'favorite-border', color: '#f43f5e', path: 'Analytics' },
    // { label: 'Network Match', value: '94%', growth: 'High', icon: 'handshake', color: '#6366f1', path: '/creator/collaborations' },
  ];

  const collaborations:Collab[] = [
    { id: 1, partner: 'Zoe K', type: 'Podcast Guest', status: 'Pending', avatar: 'https://picsum.photos/seed/zoe/100', color: '#f97316' },
    { id: 2, partner: 'Marcus V', type: 'Co-Stream', status: 'Active', avatar: 'https://picsum.photos/seed/marcus/100', color: '#10b981' },
  ];

  const generateAIStrategy = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Missing API key');

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents:
          "You are a creator manager. Give a 1-sentence 'power move' for a video creator based on 80% of their fans being active right now. Focus on video content.",
      });

      const text = (response as { text?: string }).text;
      setInsight(text || 'Fans are peaking - perfect time for a surprise Live Transmission.');
    } catch {
      setInsight("Network density is high. Initiate a 'Flash Stream' now to capture the 400+ active viewers.");
    } finally {
      setLoading(false);
    }
  };

  const weeklyTotalViews = useMemo(() => viewData.reduce((sum, day) => sum + day.views, 0), [viewData]);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.headerCard, { paddingTop: Platform.OS == 'ios' ? 54: insets.top }]}>
          <View style={s.headerTopRow}>
            <View style={s.headerProfileRow}>
              <Image source={{ uri: 'https://picsum.photos/seed/mila/150' }} style={s.avatar} />
              <View>
                <Text style={[s.consoleLabel]}>Hi {user!.name.split(" ")[0]},</Text>
                <Text style={s.commander}>Good Morning.</Text>
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate('/notifications')} style={s.iconButton}>
              <NotificationIcon height={20} width={20} fill="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={s.section}>
          {/* <Pressable onPress={() => navigation.navigate('/creator/go-live')} style={s.liveCard}>
            <View style={s.livePulse} />
            <View style={s.liveInnerRow}>
              <View>
                <Text style={s.liveTitle}>Live Transmission</Text>
                <Text style={s.liveSubtitle}>Start Broadcast</Text>
              </View>
              <View style={s.liveIconWrap}>
                <MaterialIcons name="sensors" size={22} color="#fff" />
              </View>
            </View>
          </Pressable> */}
          <Pressable onPress={() => navigation.navigate('GoLive')} style={s.actionRowCard}>
            <View style={s.actionLeft}>
              <View style={[s.actionIconWrap, s.actionIconRed]}>
                <MaterialIcons name="sensors" size={20} color="#ef4444" />
              </View>
              <View>
                <Text style={s.actionTitle}>Live Transmission </Text>
                <Text style={s.actionMeta}>Start Broadcast • 2.4K Waiting</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={40} color="#ffffff33" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('UploadContent')} style={s.actionRowCard}>
            <View style={s.actionLeft}>
              <View style={[s.actionIconWrap, s.actionIconBlue]}>
                <MovieIcon height={20} width={20} fill="#3b82f6" />
              </View>
              <View>
                <Text style={s.actionTitle}>Upload Content</Text>
                <Text style={s.actionMeta}>Establish New Broadcast</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={40} color="#ffffff33" />
          </Pressable>

          <Pressable onPress={() => navigation.navigate('CreatorEvents')} style={s.actionRowCard}>
            <View style={s.actionLeft}>
              <View style={[s.actionIconWrap, s.actionIconGreen]}>
                <TicketIcon width={20} height={20} fill="#22c55e" />
              </View>
              <View>
                <Text style={s.actionTitle}>Manage Events</Text>
                <Text style={s.actionMeta}>12 Bookings - Next: O2 Arena</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={40} color="#ffffff33" />
          </Pressable>

          {/* <Pressable onPress={() => navigation.navigate('/creator/store')} style={s.actionRowCard}>
            <View style={s.actionLeft}>
              <View style={[s.actionIconWrap, s.actionIconOrange]}>
                <MaterialIcons name="shopping-bag" size={20} color="#f97316" />
              </View>
              <View>
                <Text style={s.actionTitle}>Manage Store</Text>
                <Text style={s.actionMeta}>3 Products - 833 Sales</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#8e91a6" />
          </Pressable> */}

          <View style={s.dualRow}>
            <Pressable onPress={() => navigation.navigate('Community')} style={s.compactCard}>
              <View style={s.compactIcon}>
                <ForumIcon height={20} width={20} fill={PRIMARY_COLOR} />
              </View>
              <Text style={s.compactTitle}>{'Community\nUpdate'}</Text>
              <Text style={s.compactMeta}>Engage 14k Fans</Text>
            </Pressable>

            <Pressable onPress={() => {}} style={s.compactCardAlt}>
              <View style={s.compactIconAlt}>
                <MaterialIcons name="emoji-events" size={20} color="#6366f1" />
              </View>
              <Text style={[s.compactTitle, s.compactTitleAlt]}>{'Fan\nChallenges'}</Text>
              <Text style={s.compactMeta}>Create Viral Drops</Text>
            </Pressable>
          </View>
        </View>

        {/* <View style={s.aiCard}>
          <View style={s.aiHeader}>
            <View style={s.aiTitleRow}>
              <MaterialIcons name="auto-awesome" size={18} color={PRIMARY_COLOR} />
              <Text style={s.aiTitle}>Gemini Power Move</Text>
            </View>
            {loading && <ActivityIndicator size="small" color={PRIMARY_COLOR} />}
          </View>
          <View style ={{
            borderLeftColor: '#ffffffe6',
            borderLeftWidth: 2,
            paddingLeft: 10
          }}>
            <Text style={s.aiText}>
            {loading
              ? 'Analyzing viewer patterns...'
              : insight || "Your network density is peaking. Initiate a 'Power Session' to maximize video revenue."}
          </Text>
          </View>
          <Pressable onPress={generateAIStrategy} disabled={loading} style={[s.aiButton, loading && s.aiButtonDisabled]}>
            <Text style={s.aiButtonText}>Generate Power Move</Text>
          </Pressable>
        </View> */}

        <View style={s.metricsGrid}>
          {metrics.map((m) => (
            <Pressable key={m.label} onPress={() => navigation.navigate(m.path)} style={s.metricCard}>
              <View style={s.metricTop}>
                <View style={[s.metricIconWrap, ]}>
                  {(m.label === 'Total Videos' ||m.label === 'Engagement') ?<MaterialIcons name={m.icon as any} size={24} color={m.color} /> :
                  m.label === 'Subscribers' ?
                  <StarsIcon height={24} width={24} fill={m.color}/>: <PlayCircle height={24} width={24} fill={m.color}/>}
                </View>
                <View
                style = {{
                  borderRadius: 8,
                  backgroundColor: '#10b9811a',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
                >
                  <Text style={s.metricGrowth}>{m.growth}</Text>
                </View>
              </View>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={s.metricLabel}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginVertical: 20,
        }}
        >
        <Text style={{
          letterSpacing: 2,
          ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
          color: '#ffffff4d',
        }}>
          COLLABORATION HUB
        </Text>
        <Text style={{
          letterSpacing: 2,
          ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
          color: PRIMARY_COLOR,
        }}>
          VIEW ALL
        </Text>
        </View>
        <ScrollView horizontal>
          <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          gap: 10
        }}
        >
          <View style={{
            width: 16
          }}/>
          {collaborations.map((item)=>(
            <View
            key={item.id}
            style={{
              backgroundColor: '#1f1022bf',
              borderColor: '#0000000d',
              borderRadius: 36,
              borderWidth: 1,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: 16,
            }}
            >
            <View
            style={{
              height : 55,
              width: 55,
              borderRadius: 16,
            }}
            >
             <Image source={{uri: item.avatar}} style={{
              borderRadius: 16,
              width: '100%',
              height: '100%'
             }}/>
             <View style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              padding: 2,
              backgroundColor: '#000',
              borderRadius: 999
             }}>
              <View style={{
              backgroundColor: item.color,
              height: 16,
              width: 16,
              borderRadius: 999,
             }}/>
             </View>
            </View>
            <View style={{
              paddingLeft: 15,
            }}>
              <Text style={{
                color: '#ffffff4d',
                textTransform: 'uppercase',
                ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1
              }}>
              {item.type}
            </Text>
            <Text style={{
                color: '#ffffff',
                // textTransform: 'uppercase',
                ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,

              }}>
              {item.partner}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: 15,
            }}>
              <Text style={{
                color: PRIMARY_COLOR,
                textTransform: 'uppercase',
                ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1
              }}>
                CHAT
              </Text>
              <View style={{
                backgroundColor: '#ffffff0d',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 12,
              }}>
                <Text style={{
                color: '#ffffff66',
                textTransform: 'uppercase',
                ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1
              }}>
                Details
              </Text>
              </View>
            </View>
            </View>
            </View>
          ))}
        <View style={{
          width: 16
        }}></View>
        </View>
        </ScrollView>
        {/* <View style={s.chartCard}>
          <Text style={s.chartTitle}>Engagement Velocity</Text>
          <View style={s.chartList}>
            {viewData.map((item) => (
              <View key={item.name} style={s.chartRowWrap}>
                <View style={s.chartRowHeader}>
                  <Text style={s.chartDay}>{item.name}</Text>
                  <Text style={s.chartViews}>{item.views.toLocaleString()}</Text>
                </View>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${(item.views / 10000) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
            <Text style={s.chartTotal}>Total: {weeklyTotalViews.toLocaleString()} weekly views</Text>
          </View>
        </View> */}

        <View style={s.switchWrap}>
          <Pressable onPress={onToggleRole} style={s.switchButton}>
            <MaterialIcons name="person" size={18} color="#9ea0b6" />
            <Text style={s.switchText}>Switch to Fan Experience</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913' },
  content: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 120, gap: 14 },
  headerCard: {
    // borderRadius: 24,
    // borderWidth: 1,
    // borderColor: '#ffffff18',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0d',
    backgroundColor: '#1f1022bf',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff20' },
  consoleLabel: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    // fontWeight: '900',
    // textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  commander: {
    color: '#ffffff66',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    marginTop: 2,
    // fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1022bf',
    borderWidth: 1,
    borderColor: '#ffffff14',
  },
  section: { gap: 10 },
  liveCard: {
    borderRadius: 24,
    backgroundColor: PRIMARY_COLOR,
    overflow: 'hidden',
    padding: 14,
  },
  livePulse: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#ffffff20',
  },
  liveInnerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveTitle: { color: '#fff', fontWeight: '900', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, textTransform: 'uppercase' },
  liveSubtitle: { color: '#ffffffd2', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, marginTop: 2, fontWeight: '700' },
  liveIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff44',
    backgroundColor: '#ffffff1f',
  },
  actionRowCard: {
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#1f1022bf',
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: HEIGHT * 0.08
    // height: HEIGHT * 0.25,
    // padding: 24
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  actionIconWrap: {
    // width: 38,
    height: HEIGHT * 0.14,
    width: HEIGHT * 0.15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlphaHex('1d'),
    borderWidth: 1,
    borderColor: primaryColorAlphaHex('3a'),
  },
  actionIconRed: { backgroundColor: '#ef44441a', borderColor: '#ef444433' },
  actionIconBlue: { backgroundColor: '#3b82f61a', borderColor: '#3b82f64a' },
  actionIconGreen: { backgroundColor: '#22c55e1a', borderColor: '#22c55e4a' },
  actionIconOrange: { backgroundColor: '#f973161a', borderColor: '#f973164a' },
  actionTitle: {
    color: '#fff',
    // fontWeight: '800',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    letterSpacing: -0.5
  },
  actionMeta: {
    color: '#ffffff66',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    marginTop: 2 },
  dualRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginVertical : 20 },
  compactCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff18',
    backgroundColor: '#1f1022bf',
    padding: 12,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  compactCardAlt: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f133',
    backgroundColor: '#6366f11a',
    padding: 12,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  compactIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    // backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  compactIconAlt: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6366f122',
    borderWidth: 1,
    borderColor: '#6366f155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    // fontWeight: '900',
    // lineHeight: 16,
    marginTop: 5
    // textTransform: 'uppercase',
  },
  compactTitleAlt: { color: '#818cf8' },
  compactMeta: {
    color: '#e5e7eb',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    // fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  aiCard: {
    marginTop: 4,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#ffffff20',
    backgroundColor: '#1f1022bf',
    paddingHorizontal: 14,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  aiText: {
    color: '#ffffffe6',
    ...fontSize.b5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  aiButton: {
    marginTop: 2,
    // alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    // borderColor: primaryColorAlphaHex('55'),
    backgroundColor: PRIMARY_COLOR,
    // paddingHorizontal: 14,
    // paddingVertical: 9,
    width: '100%',
    height: 48
  },
  aiButtonDisabled: { opacity: 0.55 },
  aiButtonText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    // fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1 },
  metricsGrid: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  metricCard: {
    width: '48.5%',
    height:144,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#1f1022bf',
    padding: 12,
    gap: 6,
    paddingVertical: 20,
  },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrowth: {
    color: '#22c55e',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    // fontWeight: '900'
   },
  metricLabel: {
    color: '#FFFFFF66',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
    // fontWeight: '700',
  },
  chartCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff18',
    backgroundColor: '#ffffff08',
    padding: 14,
    gap: 10,
  },
  chartTitle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, fontWeight: '900', textTransform: 'uppercase' },
  chartList: { gap: 10 },
  chartRowWrap: { gap: 5 },
  chartRowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  chartDay: { color: '#c7cade', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, fontWeight: '700' },
  chartViews: { color: '#8e91a6', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  barTrack: { height: 6, backgroundColor: '#1f2435', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 999 },
  chartTotal: { color: '#d6daee', fontWeight: '800', marginTop: 4, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  switchWrap: { paddingTop: 6, alignItems: 'center' },
  switchButton: {
    borderRadius: 20,
    width: '90%',
    borderWidth: 1,
    borderColor: '#ffffff18',
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchText: { color: '#9ea0b6', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});

export default ArtistDashboard;
