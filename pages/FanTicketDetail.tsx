import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import { fontSize } from './typography';
import type { EventResource, EventTicketPurchaseResource, EventTicketResource } from '../src/types/event.types';

const EVENT_IMAGE =
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800';

type TicketDetailPayload = {
  ticket: EventTicketResource;
  event: EventResource;
  purchase?: EventTicketPurchaseResource['purchase'] | null;
};

const FanTicketDetail: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const routePayload = route.params?.ticket && route.params?.event
    ? { ticket: route.params.ticket, event: route.params.event, purchase: route.params.purchase ?? null } as TicketDetailPayload
    : null;
  const [payload, setPayload] = useState<TicketDetailPayload | null>(routePayload);
  const [isLoading, setIsLoading] = useState(!routePayload);

  useEffect(() => {
    if (routePayload) {
      setPayload(routePayload);
      setIsLoading(false);
      return;
    }
    AsyncStorage.getItem('fan-ticket:latest')
      .then((stored: string | null) => setPayload(stored ? JSON.parse(stored) as TicketDetailPayload : null))
      .catch(() => setPayload(null))
      .finally(() => setIsLoading(false));
  }, [route.params?.ticket, route.params?.event, route.params?.purchase]);

  const headerBackground = isDark ? 'rgba(10,5,13,0.72)' : 'rgba(255,255,255,0.78)';
  const softBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const glassSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)';
  const detailSurface = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const qrSurface = isDark ? '#f8fafc' : '#f8fafc';
  const footerSurface = isDark ? 'rgba(10,5,13,0.74)' : 'rgba(248,250,252,0.84)';
  const metaText = isDark ? '#cbd5e1' : theme.textSecondary;
  const mutedText = isDark ? 'rgba(255,255,255,0.46)' : theme.textMuted;
  const notchColor = theme.background;

  if (isLoading) {
    return <SafeAreaView style={[styles.emptyScreen, { backgroundColor: theme.background }]}><Text style={[styles.emptyText, { color: metaText }]}>Loading ticket...</Text></SafeAreaView>;
  }

  if (!payload?.ticket || !payload.event) {
    return (
      <SafeAreaView style={[styles.emptyScreen, { backgroundColor: theme.background }]}>
        <MaterialIcons name="confirmation-number" size={48} color={mutedText} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No ticket available</Text>
        <Text style={[styles.emptyText, { color: metaText }]}>Purchase an event ticket to see its entry pass here.</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.emptyButton, { backgroundColor: theme.accent }]}><Text style={styles.emptyButtonText}>Go Back</Text></Pressable>
      </SafeAreaView>
    );
  }

  const { ticket, event, purchase } = payload;
  const startsAt = event.starts_at ? new Date(event.starts_at) : null;
  const validStart = startsAt && !Number.isNaN(startsAt.getTime());
  const eventDate = validStart ? startsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable';
  const eventTime = validStart ? startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: event.timezone }) : '';
  const venueName = event.venue?.name || (event.event_type === 'online' || event.venue_type === 'online' ? 'Online Event' : 'Venue unavailable');
  const venueLocation = [event.venue?.city, event.venue?.country].filter(Boolean).join(', ') || event.venue?.address || '';
  const ticketType = ticket.ticket_type_name || ticket.ticket_type_code || purchase?.ticket_type_name || purchase?.ticket_type_code || 'Event admission';
  const ticketCode = ticket.ticket_id || String(ticket.id);
  const coverImage = event.cover_image_url || EVENT_IMAGE;
  const shareTicket = () => Share.share({ title: `${event.title} ticket`, message: `My ticket for ${event.title}. Ticket ID: ${ticketCode}${purchase?.reference ? ` · Purchase: ${purchase.reference}` : ''}` });

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? 44 : insets.top,
        },
      ]}
      edges={[]}
    >
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.backgroundWrap}>
          <Image source={{ uri: coverImage }} style={styles.backgroundImage} />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(10,5,13,0.28)', 'rgba(10,5,13,0.84)', '#0a050d']
                : ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.82)', '#ffffff']
            }
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <Pressable style={[styles.headerButton, {  }]} onPress={() => navigation.goBack()}>
            {/* <MaterialIcons name="close" size={20} color={theme.text} /> */}
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerKicker, { color: theme.accent }]}>Entry Pass</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {event.title}
            </Text>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Share ticket" onPress={() => void shareTicket()} style={[styles.headerButton, { borderColor: softBorder }]}>
            <MaterialIcons name="share" size={18} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, {backgroundColor: theme.background}]}>
          <View style={styles.ticketWrap}>
            <View style={[styles.ticketCard, { borderColor: softBorder }]}>
              <View style={styles.visualHeader}>
                <Image source={{ uri: coverImage }} style={styles.visualImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.84)']} style={styles.visualFade} />
                <View style={styles.visualMeta}>
                  <View style={styles.visualText}>
                    <Text style={styles.artistName}>{event.creator?.name || event.title}</Text>
                    <Text style={styles.artistSub}>{event.title}</Text>
                  </View>
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>{ticket.status === 'active' ? 'Valid' : ticket.status}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.detailsGrid, { borderBottomColor: softBorder, backgroundColor: detailSurface }]}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: mutedText }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{eventDate}</Text>
                  <Text style={[styles.detailSub, { color: metaText }]}>{eventTime}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: mutedText }]}>Venue</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{venueName}</Text>
                  <Text style={[styles.detailSub, { color: metaText }]}>{venueLocation}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: mutedText }]}>Section</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{ticketType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: mutedText }]}>Ticket Number</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{ticket.ticket_number ?? '—'}</Text>
                </View>
              </View>

              <View style={[styles.qrSection, { backgroundColor: qrSurface }]}>
                <View style={styles.qrCard}>
                  {ticket.qr_code_url
                    ? <Image source={{ uri: ticket.qr_code_url }} style={styles.qrImage} />
                    : <View style={[styles.qrImage, styles.qrFallback]}><MaterialIcons name="qr-code" size={96} color="#64748b" /></View>}
                </View>
                <Text style={styles.scanTitle}>SCAN TO ENTER</Text>
                <Text style={[styles.scanHint, { color: '#64748b' }]}>Screen brightness optimized for scanner</Text>
              </View>

              <View style={[styles.footerCard, { backgroundColor: footerSurface, borderTopColor: softBorder }]}>
                <View style={styles.footerTextWrap}>
                  <Text style={[styles.detailLabel, { color: mutedText }]}>Digital Ticket ID</Text>
                  <Text style={[styles.ticketCode, { color: theme.text }]}>{ticketCode}</Text>
                </View>
                <View style={[styles.nfcBadge, { backgroundColor: isDark ? primaryColorAlpha(0.12) : theme.accentSoft, borderColor: isDark ? primaryColorAlpha(0.22) : primaryColorAlpha(0.18) }]}>
                  <MaterialIcons name="nfc" size={22} color={theme.accent} />
                </View>
              </View>
            </View>

            {/* <View style={styles.actionRow}>
              <Pressable style={[styles.actionButton, { backgroundColor: glassSurface, borderColor: softBorder }]}>
                <MaterialIcons name="phone-iphone" size={20} color={theme.text} />
                <Text style={[styles.actionText, { color: theme.text }]}>Apple Wallet</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, { backgroundColor: glassSurface, borderColor: softBorder }]}>
                <MaterialIcons name="account-balance-wallet" size={20} color={theme.text} />
                <Text style={[styles.actionText, { color: theme.text }]}>Add to Wallet</Text>
              </Pressable>
            </View> */}
          </View>
        </ScrollView>

        <View style={[styles.perfLeft, { backgroundColor: notchColor, borderColor: softBorder }]} />
        <View style={[styles.perfRight, { backgroundColor: notchColor, borderColor: softBorder }]} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  emptyTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textAlign: 'center' },
  emptyText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' },
  emptyButton: { minWidth: 132, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyButtonText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.1 },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  backgroundWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerKicker: {
    ...fontSize.h1, lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  headerTitle: {
    marginTop: 4,
    ...fontSize.h2, lineHeight: fontSize.h2.lineHeight,
    textTransform: 'uppercase',
    maxWidth: 180,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  ticketWrap: {
    paddingBottom: 20,
  },
  ticketCard: {
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
  },
  visualHeader: {
    height: 160,
    position: 'relative',
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  visualFade: {
    ...StyleSheet.absoluteFillObject,
  },
  visualMeta: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  visualText: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
  },
  artistSub: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.72)',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  verifiedPill: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderBottomWidth: 1,
  },
  detailItem: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 20,
  },
  detailLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  detailValue: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  detailSub: {
    marginTop: 3,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
  },
  qrImage: {
    width: 192,
    height: 192,
    borderRadius: 20,
  },
  qrFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' },
  scanTitle: {
    marginTop: 22,
    color: '#0f172a',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  scanHint: {
    marginTop: 8,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  footerCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  footerTextWrap: {
    gap: 2,
  },
  ticketCode: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 0.6,
  },
  nfcBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingBottom: 18,
  },
  actionButton: {
    flex: 1,
    height: 62,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  perfLeft: {
    position: 'absolute',
    left: -14,
    bottom: 272,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
  perfRight: {
    position: 'absolute',
    right: -14,
    bottom: 272,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
});

export default FanTicketDetail;
