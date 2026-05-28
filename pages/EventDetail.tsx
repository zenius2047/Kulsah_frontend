import React, { useEffect, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontFamily, FontSize } from '../fonts';
import { mediumScreen, subscribeUser, user } from '../types';

const reminderOptions = [
  { label: '30 minutes before', value: '30m' },
  { label: '1 hour before', value: '1h' },
  { label: '6 hours before', value: '6h' },
  { label: '1 day before', value: '1d' },
  { label: '1 week before', value: '1w' },
];

const eventDetails: Record<
  string,
  {
    title: string;
    date: string;
    time: string;
    location: string;
    venue: string;
    price: string;
    type: string;
    img: string;
    desc: string;
    ticketsSold: number;
    capacity: number;
    revenue: string;
    payoutStatus: string;
  }
> = {
  e1: {
    title: 'Neon Nights: Live Concert',
    date: 'Sept 15, 2024',
    time: '8:00 PM GMT',
    location: 'Virtual Arena',
    venue: 'Virtual Arena Platform',
    price: 'Free',
    type: 'Live Stream',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    desc: 'Experience the ultimate synthwave journey with Neon Nights. A 360-degree virtual concert experience like never before.',
    ticketsSold: 1240,
    capacity: 5000,
    revenue: '$0.00',
    payoutStatus: 'N/A',
  },
  e2: {
    title: 'Synthwave Workshop',
    date: 'Sept 20, 2024',
    time: '2:00 PM GMT',
    location: 'Creator Studio',
    venue: 'Pulsar Creator Labs',
    price: '$25.00',
    type: 'Workshop',
    img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    desc: 'Learn the secrets of modern synth production. We will dive deep into oscillators, filters, and soul-infusing melodies.',
    ticketsSold: 45,
    capacity: 100,
    revenue: '$1,125.00',
    payoutStatus: 'Pending',
  },
  e3: {
    title: 'Album Launch Party',
    date: 'Oct 05, 2024',
    time: '10:00 PM GMT',
    location: 'Metropolis Club',
    venue: 'Metropolis Club, London',
    price: '$15.00',
    type: 'Physical',
    img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800',
    desc: "Celebrate the release of Star Systems. Heavy bass, retro lasers, and a specialized secret set you don't want to miss.",
    ticketsSold: 180,
    capacity: 250,
    revenue: '$2,700.00',
    payoutStatus: 'Scheduled',
  },
  '1': {
    title: 'Neon Nights Tour',
    date: 'Aug 24, 2024',
    time: '8:00 PM',
    location: 'London',
    venue: 'O2 Arena, London',
    price: '$45.00+',
    type: 'Physical',
    img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    desc: 'The blockbuster tour arrives in London. Full production, live band, and special guest appearances.',
    ticketsSold: 14200,
    capacity: 20000,
    revenue: '$639,000.00',
    payoutStatus: 'Processing',
  },
};

const EventDetail: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.id ?? 'burna-boy';
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [locationInsights, setLocationInsights] = useState('');
  const [venueMapUri, setVenueMapUri] = useState<string | null>(null);
  const [venueSnippets, setVenueSnippets] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);
  const currentEvent = eventDetails[eventId] ?? {
    title: 'Burna Boy: Love, Damini Live',
    date: 'Saturday, Aug 24',
    time: '8:00 PM',
    location: 'London',
    venue: 'The O2 Arena',
    price: '$125.00+',
    type: 'Physical',
    img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    desc: 'The African Giant returns to London for an unforgettable night of Afrobeats, culture, and high-energy performance.',
    ticketsSold: 18500,
    capacity: 20000,
    revenue: '$2,312,500.00',
    payoutStatus: 'Completed',
  };
  const isCreator = currentUser?.role === 'creator';
  const attendance = Math.round((currentEvent.ticketsSold / currentEvent.capacity) * 100);

  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const card = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const soft = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const faint = isDark ? 'rgba(255,255,255,0.45)' : theme.textMuted;
  const accent = PRIMARY_COLOR;

  useEffect(() => {
    const unsubscribe = subscribeUser(setCurrentUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLocationInsights('Arrive early for smoother entry, use the North Greenwich approach for the fastest drop-off, and target nearby dining before the peak pre-show rush.');
      setVenueMapUri('https://maps.google.com/?q=The+O2+Arena+London');
      setVenueSnippets([
        'Parking fills quickly near doors opening, so pre-book if you are driving.',
        'Food lines near the main concourse spike one hour before showtime.',
        'The Jubilee line is usually the fastest post-show option back into central London.',
      ]);
      setLoading(false);
    }, 900);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${currentEvent.title} | Kulsah`,
        message: `Join me at ${currentEvent.title} on Kulsah.`,
      });
    } catch {
      setToast('Share unavailable');
    }
  };

  const openMap = async () => {
    if (!venueMapUri) return;
    const supported = await Linking.canOpenURL(venueMapUri);
    if (supported) await Linking.openURL(venueMapUri);
  };

  const setReminder = (value: string, label: string) => {
    setActiveReminder(value);
    setReminderOpen(false);
    setToast(`Reminder set for ${label}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background }]} edges={[]}>
      {toast ? <View style={[styles.toastWrap, { top: insets.top + 12 }]}><Text style={styles.toastText}>{toast}</Text></View> : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Image source={{ uri: currentEvent.img }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)', isDark ? '#050505' : theme.background]} style={StyleSheet.absoluteFillObject} />

          <Pressable onPress={() => navigation.goBack()} style={[styles.topButton, { top: insets.top + 12, left: 16, borderColor: 'rgba(255,255,255,0.12)' }]}>
            <MaterialIcons name="chevron-left" size={22} color="#fff" />
          </Pressable>

          <View style={[styles.topRight, { top: insets.top + 12 }]}>
            {isCreator ? (
              <Pressable onPress={() => navigation.navigate('CreatorEvents')} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
                <MaterialIcons name="edit" size={22} color="#fff" />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setReminderOpen(true)} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <MaterialIcons name={activeReminder ? 'notifications-active' : 'notifications'} size={22} color={activeReminder ? PRIMARY_COLOR : '#fff'} />
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <MaterialIcons name="share" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.panel, { marginTop: -34, backgroundColor: card, borderColor: border }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrowAccent, { color: accent }]}>{currentEvent.type} Event</Text>
                <Text style={[styles.title, { color: theme.text }]}>{currentEvent.title}</Text>
              </View>
              <View style={styles.fastBadge}><Text style={styles.fastBadgeText}>Selling Fast</Text></View>
            </View>

            <View style={[styles.infoBlock, { borderColor: border }]}>
              {[{ icon: 'calendar-month', title: currentEvent.date, sub: `Starts at ${currentEvent.time}` }, { icon: 'location-on', title: currentEvent.location, sub: currentEvent.venue }].map((item) => (
                <View key={item.title} style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name={item.icon as any} size={20} color={accent} /></View>
                  <View><Text style={[styles.infoTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.infoSub, { color: subtle }]}>{item.sub}</Text></View>
                </View>
              ))}
            </View>

            {isCreator ? (
              <View style={styles.creatorSection}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.eyebrowAccent, { color: accent }]}>Creator Insights</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveBadgeDot} />
                    <Text style={styles.liveBadgeText}>Live Updates</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCardLarge, { backgroundColor: soft, borderColor: border }]}>
                    <Text style={[styles.statLabel, { color: faint }]}>Tickets Sold</Text>
                    <Text style={[styles.statValueLarge, { color: theme.text }]}>{currentEvent.ticketsSold.toLocaleString()}</Text>
                    <Text style={[styles.statMeta, { color: subtle }]}>of {currentEvent.capacity.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.statCardLarge, { backgroundColor: soft, borderColor: border }]}>
                    <Text style={[styles.statLabel, { color: faint }]}>Total Revenue</Text>
                    <Text style={[styles.statValueLarge, { color: accent }]}>{currentEvent.revenue}</Text>
                    <Text style={[styles.statMeta, { color: subtle }]}>Gross Sales</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: soft, borderColor: border }]}>
                    <Text style={[styles.statLabel, { color: faint }]}>Attendance</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{attendance}%</Text>
                    <Text style={[styles.statMeta, { color: subtle }]}>Fill rate</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: soft, borderColor: border }]}>
                    <Text style={[styles.statLabel, { color: faint }]}>Payout Status</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{currentEvent.payoutStatus}</Text>
                    <Text style={[styles.statMeta, { color: subtle }]}>Bank transfer</Text>
                  </View>
                </View>

                <View style={styles.performanceCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.performanceLabel}>Sales Performance</Text>
                    <Text style={styles.performanceMeta}>{attendance}% Capacity reached</Text>
                  </View>
                  <View style={styles.performanceTrack}>
                    <View style={[styles.performanceFill, { width: `${attendance}%` }]} />
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.sectionGap}>
              <View style={styles.rowBetween}>
                <Text style={[styles.eyebrow, { color: faint }]}>Venue Map & Insights</Text>
                {loading ? <View style={[styles.spinner, { borderColor: accent, borderTopColor: 'transparent' }]} /> : null}
              </View>

              <Pressable onPress={openMap} style={[styles.mapCard, { borderColor: border }]}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800' }} style={styles.mapImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.mapOverlay}><MaterialIcons name="location-on" size={36} color={PRIMARY_COLOR} /><Text style={styles.mapText}>Tap to navigate</Text></View>
              </Pressable>

              <View style={[styles.tipCard, { backgroundColor: soft, borderColor: border }]}>
                <Text style={[styles.body, { color: subtle }]}>{locationInsights}</Text>
                {venueSnippets.map((snippet) => (
                  <View key={snippet} style={styles.tipRow}>
                    <MaterialIcons name="chat-bubble" size={14} color={accent} />
                    <Text style={[styles.tipText, { color: faint }]}>"{snippet}"</Text>
                  </View>
                ))}
                {venueMapUri ? <Pressable onPress={openMap} style={[styles.routeButton, { backgroundColor: accent }]}><MaterialIcons name="directions" size={18} color="#fff" /><Text style={styles.routeButtonText}>Find Best Route</Text></Pressable> : null}
              </View>
            </View>
          </View>

          <View style={styles.sectionGap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About the Event</Text>
            <Text style={[styles.body, { color: subtle }]}>{currentEvent.desc}</Text>
          </View>

          <View style={styles.sectionGap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tickets</Text>
            {[{ name: 'Standard Standing', meta: 'Limited availability', price: '$125.00', featured: false }, { name: 'VIP Pit Access', meta: 'Includes merch pack', price: '$350.00', featured: true }].map((ticket) => (
              <View key={ticket.name} style={[styles.ticketRow, { backgroundColor: ticket.featured ? theme.accentSoft : card, borderColor: ticket.featured ? accent : border }]}>
                <View><Text style={[styles.ticketTitle, { color: theme.text }]}>{ticket.name}</Text><Text style={[styles.ticketMeta, { color: subtle }]}>{ticket.meta}</Text></View>
                <Text style={[styles.ticketPrice, { color: accent }]}>{ticket.price}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {!isCreator ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? 'rgba(5,5,5,0.95)' : 'rgba(255,255,255,0.96)', borderColor: border }]}>
          <Pressable onPress={() => navigation.navigate('SelectTickets', { id: eventId })} style={[styles.footerButton, { backgroundColor: accent }]}>
            <Text style={styles.footerButtonText}>Select Tickets</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      <Modal visible={reminderOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setReminderOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setReminderOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#050505' : theme.background, borderColor: border, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={[styles.sheetHandle, { backgroundColor: border }]} />
            <View style={styles.centerBlock}><Text style={[styles.sectionTitle, { color: theme.text }]}>Set Event Reminder</Text><Text style={[styles.tipText, { color: faint }]}>Get notified before the show starts</Text></View>
            {reminderOptions.map((option) => (
              <Pressable key={option.value} onPress={() => setReminder(option.value, option.label)} style={[styles.reminderRow, { backgroundColor: activeReminder === option.value ? accent : soft, borderColor: activeReminder === option.value ? accent : border }]}>
                <Text style={[styles.reminderText, { color: activeReminder === option.value ? '#fff' : theme.text }]}>{option.label}</Text>
                {activeReminder === option.value ? <MaterialIcons name="check-circle" size={20} color="#fff" /> : null}
              </Pressable>
            ))}
            {activeReminder ? <Pressable onPress={() => { setActiveReminder(null); setReminderOpen(false); setToast('Reminder removed'); }} style={styles.removeButton}><Text style={styles.removeButtonText}>Remove Existing Reminder</Text></Pressable> : null}
            <Pressable onPress={() => setReminderOpen(false)} style={[styles.cancelButton, { backgroundColor: soft, borderColor: border }]}><Text style={[styles.reminderText, { color: faint }]}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, toastWrap: { position: 'absolute', left: 20, right: 20, zIndex: 50, alignItems: 'center' }, toastText: { color: '#fff', backgroundColor: PRIMARY_COLOR, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.4 },
  hero: { height: 320, width: '100%' }, heroImage: { width: '100%', height: '100%' }, topButton: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.34)', alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, topRight: { position: 'absolute', right: 16, flexDirection: 'row', gap: 10 },
  content: { paddingHorizontal: 16, gap: 22 }, panel: { borderRadius: 28, borderWidth: 1, padding: 18, gap: 18 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, eyebrowAccent: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 1.8 }, title: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.twenty: FontSize.sixteen, lineHeight: mediumScreen ? 28 : 22 }, fastBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }, fastBadgeText: { color: '#ef4444', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 1 },
  infoBlock: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, gap: 14 }, infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, infoIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, infoTitle: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven }, infoSub: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.eleven : FontSize.nine },
  creatorSection: { gap: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)' },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#22c55e' },
  liveBadgeText: { color: '#22c55e', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCardLarge: { width: '48.5%', borderWidth: 1, borderRadius: 22, padding: 14 },
  statCard: { width: '48.5%', borderWidth: 1, borderRadius: 18, padding: 14 },
  statLabel: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 1.1 },
  statValueLarge: { marginTop: 6, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.eighteen: FontSize.fourteen },
  statValue: { marginTop: 6, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve, textTransform: 'uppercase' },
  statMeta: { marginTop: 3, fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight },
  performanceCard: { borderRadius: 22, padding: 14, backgroundColor: primaryColorAlpha(0.08), borderWidth: 1, borderColor: primaryColorAlpha(0.2), gap: 10 },
  performanceLabel: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.2 },
  performanceMeta: { color: PRIMARY_COLOR, fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight },
  performanceTrack: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(148,163,184,0.2)' },
  performanceFill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  sectionGap: { gap: 12 }, eyebrow: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 1.6 }, spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, mapCard: { aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', borderWidth: 1 }, mapImage: { width: '100%', height: '100%' }, mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 }, mapText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.2 },
  tipCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 }, body: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven, lineHeight: mediumScreen ? 24 : 20 }, tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, tipText: { flex: 1, fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.eleven : FontSize.nine, lineHeight: mediumScreen ? 20 : 16 }, routeButton: { height: 46, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, routeButtonText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitle: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.eighteen : FontSize.sixteen }, ticketRow: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, ticketTitle: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.twelve : FontSize.ten }, ticketMeta: { marginTop: 4, fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.nine : FontSize.seven, textTransform: 'uppercase', letterSpacing: 0.6 }, ticketPrice: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.twelve : FontSize.ten },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 }, footerButton: { height: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, footerButtonText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.twelve : FontSize.ten, textTransform: 'uppercase', letterSpacing: 1.2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' }, modalCard: { borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, gap: 12 }, sheetHandle: { width: 46, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 6 }, centerBlock: { alignItems: 'center', gap: 6, marginBottom: 8 }, reminderRow: { height: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reminderText: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.twelve : FontSize.ten }, removeButton: { height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, removeButtonText: { color: '#ef4444', fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.ten : FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.2 }, cancelButton: { height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});

export default EventDetail;
