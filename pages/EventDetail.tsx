import React, { useEffect, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { mediumScreen, subscribeUser, user } from '../types';
import { fontSize } from './typography';
import { useEvent } from '../src/hooks/events/useEvents';

const reminderOptions = [
  { label: '30 minutes before', value: '30m' },
  { label: '1 hour before', value: '1h' },
  { label: '6 hours before', value: '6h' },
  { label: '1 day before', value: '1d' },
  { label: '1 week before', value: '1w' },
];

const EventDetail: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId ?? route.params?.id;
  const normalizedEventId = String(eventId ?? '').replace(/^event_/, '');
  const apiEventId = /^\d+$/.test(normalizedEventId) ? normalizedEventId : undefined;
  const eventQuery = useEvent(apiEventId);
  const [currentUser, setCurrentUser] = useState(user);
  const [toast, setToast] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);
  const [failedQrCodes, setFailedQrCodes] = useState<Record<string, boolean>>({});
  const apiEvent = eventQuery.data;
  const eventType = apiEvent?.event_type ?? apiEvent?.venue_type;
  const startingTicket = apiEvent?.ticket_types?.filter((ticket) => ticket.is_available).sort((a, b) => Number(a.price ?? a.unit_price ?? 0) - Number(b.price ?? b.unit_price ?? 0))[0];
  const startsAt = apiEvent?.starts_at ? new Date(apiEvent.starts_at) : null;
  const currentEvent = apiEvent ? {
    title: apiEvent.title,
    date: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '',
    time: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: apiEvent.timezone }) : '',
    location: apiEvent.venue?.city || apiEvent.venue?.country || apiEvent.venue?.name || (eventType === 'online' ? 'Online' : ''),
    venue: apiEvent.venue?.name || (eventType === 'online' ? 'Online Event' : ''),
    price: startingTicket ? `${startingTicket.currency} ${startingTicket.price ?? startingTicket.unit_price}` : 'Free',
    type: eventType || apiEvent.category || 'Event',
    img: apiEvent.cover_image_url || '',
    desc: apiEvent.description || '',
    ticketsSold: Number(apiEvent.tickets_sold || 0), capacity: Number(apiEvent.capacity || 0),
    revenue: String(apiEvent.creator_insights?.gross_revenue ?? ''), payoutStatus: String(apiEvent.creator_insights?.payout_status ?? ''),
  } : { title: '', date: '', time: '', location: '', venue: '', price: '', type: '', img: '', desc: '', ticketsSold: 0, capacity: 0, revenue: '', payoutStatus: '' };
  const venueMapUri = currentEvent.venue
    ? `https://maps.google.com/?q=${encodeURIComponent(`${currentEvent.venue} ${currentEvent.location}`)}`
    : null;
  // Creator accounts are attendees when viewing another creator's event.
  // Existing creator event entry points retain their owner view by default.
  const isOwner = apiEvent?.viewer?.is_owner ?? route.params?.isOwner ?? currentUser?.role === 'creator';
  const attendance = currentEvent.capacity > 0 ? Math.round((currentEvent.ticketsSold / currentEvent.capacity) * 100) : 0;

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

  if (eventQuery.isLoading) {
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background, alignItems: 'center', justifyContent: 'center' }]}><View style={[styles.spinner, { borderColor: accent, borderTopColor: 'transparent' }]} /></SafeAreaView>;
  }

  if (!apiEventId || eventQuery.isError || !apiEvent) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <MaterialIcons name="event-busy" size={48} color={accent} />
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Event unavailable</Text>
        <Text style={[styles.body, { color: subtle, textAlign: 'center', marginTop: 8 }]}>This event could not be loaded from Kulsah.</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.routeButton, { backgroundColor: accent, marginTop: 20 }]}><Text style={styles.routeButtonText}>Go back</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background }]} edges={[]}>
      {toast ? <View style={[styles.toastWrap, { top: insets.top + 12 }]}><Text style={styles.toastText}>{toast}</Text></View> : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Image source={{ uri: currentEvent.img }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)', isDark ? '#050505' : theme.background]} style={StyleSheet.absoluteFillObject} />

          <Pressable onPress={() => navigation.goBack()} style={[styles.topButton, styles.backButton, { top: insets.top + 12, left: 16, borderColor: 'rgba(255,255,255,0.12)' }]}>
            <MaterialIcons name="chevron-left" size={22} color="#fff" />
          </Pressable>

          <View style={[styles.topRight, { top: insets.top + 12 }]}>
            {isOwner ? (
              <Pressable onPress={() => navigation.navigate('CreatorEvents')} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
                <MaterialIcons name="edit" size={22} color="#fff" />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setReminderOpen(true)} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <MaterialIcons name="notifications-active" size={22} color={activeReminder ? PRIMARY_COLOR : '#fff'} />
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
              {/* <View style={styles.fastBadge}><Text style={styles.fastBadgeText}>Selling Fast</Text></View> */}
            </View>

            <View style={[styles.infoBlock, { borderColor: border }]}>
              {[{ icon: 'calendar-month', title: currentEvent.date, sub: `Starts at ${currentEvent.time}` }, { icon: 'location-on', title: currentEvent.location, sub: currentEvent.venue }].map((item) => (
                <View key={item.title} style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name={item.icon as any} size={20} color={accent} /></View>
                  <View><Text style={[styles.infoTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.infoSub, { color: subtle }]}>{item.sub}</Text></View>
                </View>
              ))}
            </View>

            {isOwner ? (
              <View style={styles.creatorSection}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.eyebrowAccent, { color: accent }]}>Creator Insights</Text>
                  {/* <View style={styles.liveBadge}>
                    <View style={styles.liveBadgeDot} />
                    <Text style={styles.liveBadgeText}>Live Updates</Text>
                  </View> */}
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
              </View>

              {venueMapUri ? <Pressable onPress={openMap} style={[styles.routeButton, { backgroundColor: accent }]}><MaterialIcons name="directions" size={18} color="#fff" /><Text style={styles.routeButtonText}>Open venue in Maps</Text></Pressable> : null}

              {/* <View style={[styles.tipCard, { backgroundColor: soft, borderColor: border }]}>
                <Text style={[styles.body, { color: subtle }]}>{locationInsights}</Text>
                {venueSnippets.map((snippet) => (
                  <View key={snippet} style={styles.tipRow}>
                    <MaterialIcons name="chat-bubble" size={14} color={accent} />
                    <Text style={[styles.tipText, { color: faint }]}>"{snippet}"</Text>
                  </View>
                ))}
                {venueMapUri ? <Pressable onPress={openMap} style={[styles.routeButton, { backgroundColor: accent }]}><MaterialIcons name="directions" size={18} color="#fff" /><Text style={styles.routeButtonText}>Find Best Route</Text></Pressable> : null}
              </View> */}
            </View>
          </View>

          <View style={styles.sectionGap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About the Event</Text>
            <Text style={[styles.body, { color: subtle }]}>{currentEvent.desc}</Text>
          </View>

          <View style={styles.sectionGap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tickets</Text>
            {(apiEvent.ticket_types ?? []).map((ticket, index) => ({ name: ticket.name, meta: ticket.description || `${ticket.remaining_count ?? ticket.available_quantity ?? 0} available`, price: `${ticket.currency} ${ticket.price ?? ticket.unit_price}`, featured: index === 0 })).map((ticket) => (
              <View key={ticket.name} style={[styles.ticketRow, { backgroundColor: ticket.featured ? theme.accentSoft : card, borderColor: ticket.featured ? accent : border }]}>
                <View><Text style={[styles.ticketTitle, { color: theme.text }]}>{ticket.name}</Text><Text style={[styles.ticketMeta, { color: subtle }]}>{ticket.meta}</Text></View>
                <Text style={[styles.ticketPrice, { color: accent }]}>{ticket.price}</Text>
              </View>
            ))}
          </View>

          {(apiEvent?.viewer?.bookings ?? apiEvent?.bookings)?.flatMap((booking) => booking.tickets || []).length ? (
            <View style={styles.sectionGap}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>My Tickets</Text>
              {(apiEvent.viewer?.bookings ?? apiEvent.bookings ?? []).flatMap((booking) => booking.tickets || []).map((ticket) => (
                <View key={ticket.id} style={[styles.viewerTicket, { backgroundColor: card, borderColor: border }]}>
                  <View style={{ flex: 1, gap: 4 }}><Text style={[styles.ticketTitle, { color: theme.text }]}>{ticket.ticket_type_name || ticket.ticket_type_code || 'Event Ticket'}</Text><Text style={[styles.ticketMeta, { color: subtle }]}>{ticket.ticket_number || ticket.id}</Text><Text style={[styles.ticketMeta, { color: ticket.status === 'active' ? '#22c55e' : ticket.status === 'used' ? '#f59e0b' : '#ef4444' }]}>{ticket.status}</Text></View>
                  {ticket.qr_code_url && !failedQrCodes[ticket.id] ? <Image source={{ uri: ticket.qr_code_url }} onError={() => setFailedQrCodes((prev) => ({ ...prev, [ticket.id]: true }))} style={styles.ticketQr} /> : <View style={[styles.ticketQr, styles.ticketQrFallback]}><MaterialIcons name="qr-code" size={30} color={faint} /></View>}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!isOwner && apiEvent?.viewer?.can_book !== false && !apiEvent?.is_sold_out ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? 'rgba(5,5,5,0.95)' : 'rgba(255,255,255,0.96)', borderColor: border }]}>
          <Pressable onPress={() => navigation.navigate('SelectTickets', { id: eventId, showLiveSeatingMap: apiEvent?.venue?.seating_map_enabled === true })} style={[styles.footerButton, { backgroundColor: accent }]}>
            <Text style={styles.footerButtonText}>Select Tickets</Text>
            {/* <MaterialIcons name="arrow-forward" size={20} color="#fff" /> */}
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
  safeArea: { flex: 1 }, toastWrap: { position: 'absolute', left: 20, right: 20, zIndex: 50, alignItems: 'center' }, toastText: { color: '#fff', backgroundColor: PRIMARY_COLOR, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  hero: { height: 320, width: '100%' }, heroImage: { width: '100%', height: '100%' }, topButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.34)', alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, backButton: { position: 'absolute' }, topRight: { position: 'absolute', right: 16, flexDirection: 'row', gap: 10 },
  content: { paddingHorizontal: 16, gap: 22 }, panel: { borderRadius: 28, borderWidth: 1, padding: 18, gap: 18 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, eyebrowAccent: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.8 }, title: { ...fontSize.b1, lineHeight: mediumScreen ? 28 : 22 }, fastBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }, fastBadgeText: { color: '#ef4444', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  infoBlock: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, gap: 14 }, infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, infoIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, infoTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }, infoSub: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  creatorSection: { gap: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)' },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#22c55e' },
  liveBadgeText: { color: '#22c55e', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCardLarge: { width: '48%', borderWidth: 1, borderRadius: 22, padding: 14 },
  statCard: { width: '48%', borderWidth: 1, borderRadius: 18, padding: 14 },
  statLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.1 },
  statValueLarge: { marginTop: 6, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  statValue: { marginTop: 6, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight, textTransform: 'uppercase' },
  statMeta: { marginTop: 3, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  performanceCard: { borderRadius: 22, padding: 14, backgroundColor: primaryColorAlpha(0.08), borderWidth: 1, borderColor: primaryColorAlpha(0.2), gap: 10 },
  performanceLabel: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  performanceMeta: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  performanceTrack: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(148,163,184,0.2)' },
  performanceFill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  sectionGap: { gap: 12 }, eyebrow: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.6 }, spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, mapCard: { aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', borderWidth: 1 }, mapImage: { width: '100%', height: '100%' }, mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 }, mapText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  tipCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 }, body: { ...fontSize.b4, lineHeight: mediumScreen ? 24 : 20 }, tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, tipText: { flex: 1, ...fontSize.b5, lineHeight: mediumScreen ? 20 : 16 }, routeButton: { height: 46, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, routeButtonText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight }, ticketRow: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, ticketTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, ticketMeta: { marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.6 }, ticketPrice: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  viewerTicket: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }, ticketQr: { width: 82, height: 82, borderRadius: 10 }, ticketQrFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.12)' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 }, footerButton: { height: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, footerButtonText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' }, modalCard: { borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, gap: 12 }, sheetHandle: { width: 46, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 6 }, centerBlock: { alignItems: 'center', gap: 6, marginBottom: 8 }, reminderRow: { height: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reminderText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, removeButton: { height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, removeButtonText: { color: '#ef4444', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 }, cancelButton: { height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});

export default EventDetail;
