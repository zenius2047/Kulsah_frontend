import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';

interface EventTicketTier {
  name: string;
  price: string;
  capacity: string;
}

interface CreatorEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: string;
  status: 'published' | 'draft' | 'completed';
  type: 'Live Stream' | 'Workshop' | 'Physical';
}

const EVENT_TYPES: Array<CreatorEvent['type']> = ['Physical', 'Live Stream', 'Workshop'];

const CreatorEvents: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingVenue, setVerifyingVenue] = useState(false);
  const [aiHelperText, setAiHelperText] = useState('');
  const [venueMapUri, setVenueMapUri] = useState<string | null>(null);

  const [coverImg, setCoverImg] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState<CreatorEvent['type']>('Physical');
  const [ticketTiers, setTicketTiers] = useState<EventTicketTier[]>([
    { name: 'General Admission', price: '45.00', capacity: '1000' },
  ]);

  const [currentEvents, setCurrentEvents] = useState<CreatorEvent[]>([
    {
      id: '1',
      title: 'Neon Nights Tour',
      date: 'Aug 24, 2024',
      venue: 'O2 Arena, London',
      ticketsSold: 18450,
      totalTickets: 20000,
      revenue: '$2.3M',
      status: 'published',
      type: 'Physical',
    },
    {
      id: '2',
      title: 'Synth Soul Session',
      date: 'Sep 12, 2024',
      venue: 'The Blue Room, SF',
      ticketsSold: 420,
      totalTickets: 500,
      revenue: '$45K',
      status: 'published',
      type: 'Workshop',
    },
    {
      id: '3',
      title: 'Midnight Unplugged',
      date: 'Dec 05, 2024',
      venue: 'Warehouse 42, NYC',
      ticketsSold: 0,
      totalTickets: 1200,
      revenue: '$0',
      status: 'draft',
      type: 'Live Stream',
    },
  ]);

  const totalBookings = useMemo(() => currentEvents.length, [currentEvents.length]);

  const addTier = () => {
    setTicketTiers((prev) => [...prev, { name: 'New Tier', price: '0.00', capacity: '100' }]);
  };

  const removeTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof EventTicketTier, value: string) => {
    setTicketTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
  };

  const resetForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventLocation('');
    setEventDate('');
    setEventDesc('');
    setEventType('Physical');
    setCoverImg(null);
    setTicketTiers([{ name: 'General Admission', price: '45.00', capacity: '1000' }]);
    setVenueMapUri(null);
    setAiHelperText('');
  };

  const openEditor = (event?: CreatorEvent) => {
    if (event) {
      setEditingEventId(event.id);
      setEventTitle(event.title);
      setEventLocation(event.venue);
      setEventType(event.type);
      setEventDate('2026-12-01');
      setEventDesc('');
      setTicketTiers([{ name: 'General Admission', price: '45.00', capacity: String(event.totalTickets) }]);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const deleteEvent = (id: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setCurrentEvents((prev) => prev.filter((e) => e.id !== id)) },
    ]);
  };

  const handleLaunchEvent = (status: 'published' | 'draft') => {
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDate.trim()) {
      Alert.alert('Missing Details', 'Please fill in title, location and date.');
      return;
    }
    const totalCapacity = ticketTiers.reduce((acc, tier) => acc + parseInt(tier.capacity || '0', 10), 0);
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (editingEventId) {
      setCurrentEvents((prev) =>
        prev.map((e) =>
          e.id === editingEventId
            ? {
                ...e,
                title: eventTitle,
                date: formattedDate,
                venue: eventLocation,
                totalTickets: totalCapacity,
                status,
                type: eventType,
              }
            : e,
        ),
      );
    } else {
      const newEvent: CreatorEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        date: formattedDate,
        venue: eventLocation,
        ticketsSold: 0,
        totalTickets: totalCapacity,
        revenue: '$0',
        status,
        type: eventType,
      };
      setCurrentEvents((prev) => [newEvent, ...prev]);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const useAiArchitect = async () => {
    setLoading(true);
    try {
      const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate a short 2-sentence description and 3 pricing tiers for a music event titled "${eventTitle || 'Unnamed Event'}" at "${eventLocation || 'a specific venue and city'}".`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      setAiHelperText(
        response.text ||
          'Suggested tiers: GA $45 (1000), VIP $120 (120), Meet & Greet $250 (40). Use neon-soul branding language.',
      );
    } catch {
      setAiHelperText(
        'Suggested tiers: GA $45 (1000), VIP $120 (120), Meet & Greet $250 (40). Use neon-soul branding language.',
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyVenue = async () => {
    if (!eventLocation.trim()) return;
    setVerifyingVenue(true);
    try {
      const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find a Google Maps url for this venue: ${eventLocation}`,
      });

      const mapMatch = response.text?.match(/https?:\/\/[^\s]+/);
      if (mapMatch?.[0]) setVenueMapUri(mapMatch[0]);
    } catch {
      setVenueMapUri(`https://www.google.com/maps/search/${encodeURIComponent(eventLocation)}`);
    } finally {
      setVerifyingVenue(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.screen }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Event Studio</Text>
        </View>
        <Pressable onPress={() => openEditor()} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL BOOKINGS</Text>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statSub}>+2 Upcoming</Text>
          </View>
          <View style={[styles.statCard, styles.statPrimary]}>
            <Text style={[styles.statLabel, { color: '#cd2bee' }]}>TOTAL REVENUE</Text>
            <Text style={[styles.statValue, { color: '#cd2bee' }]}>$2.8M</Text>
            <Text style={styles.statSub}>Ticket sales only</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACTIVE ENGAGEMENTS</Text>
        <View style={{ gap: 12 }}>
          {currentEvents.map((event) => {
            const occupancyPct = Math.round((event.ticketsSold / Math.max(event.totalTickets, 1)) * 100);
            return (
              <Pressable key={event.id} onPress={() => openEditor(event)} style={styles.eventCard}>
                <View style={styles.eventTop}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventVenue}>{event.venue}</Text>
                  </View>
                  <View style={[styles.statusPill, event.status === 'published' ? styles.statusLive : styles.statusDraft]}>
                    <Text style={[styles.statusText, event.status === 'published' ? { color: '#22c55e' } : { color: '#94a3b8' }]}>
                      {event.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.typePill}>
                  <Text style={styles.typeText}>{event.type.toUpperCase()}</Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  <View style={styles.occupancyRow}>
                    <Text style={styles.occupancyText}>
                      Occupancy: {event.ticketsSold} / {event.totalTickets}
                    </Text>
                    <Text style={styles.occupancyValue}>{occupancyPct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${occupancyPct}%` as `${number}%` }]} />
                  </View>
                </View>

                <View style={styles.eventBottom}>
                  <View style={styles.revenueWrap}>
                    <MaterialIcons name="payments" size={16} color="#cd2bee" />
                    <Text style={styles.revenueText}>{event.revenue}</Text>
                  </View>
                  <View style={styles.eventActions}>
                    {event.status === 'published' && (
                      <Pressable style={styles.scanBtn} onPress={() => navigation.navigate('MainTabs')}>
                        <MaterialIcons name="qr-code-scanner" size={14} color="#cd2bee" />
                        <Text style={styles.scanText}>SCAN</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.menuBtn} onPress={() => deleteEvent(event.id)}>
                      <MaterialIcons name="delete" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { opacity: 0.7 }]}>EVENT ARCHIVES</Text>
        <View style={styles.archiveCard}>
          <View style={styles.archiveLeft}>
            <MaterialIcons name="history" size={18} color="#94a3b8" />
            <Text style={styles.archiveText}>2023 Summer Festival Run</Text>
          </View>
          <Text style={styles.archiveStatus}>COMPLETED</Text>
        </View>
      </ScrollView>

      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.grabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEventId ? 'Edit Event' : 'Launch New Event'}</Text>
              <Pressable style={styles.iconBtn} onPress={() => setIsModalOpen(false)}>
                <MaterialIcons name="close" size={18} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 120 }}>
              <Text style={styles.inputLabel}>PROMOTIONAL COVER</Text>
              <Pressable
                style={styles.coverBox}
                onPress={() => setCoverImg('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800')}
              >
                {coverImg ? (
                  <Image source={{ uri: coverImg }} style={styles.coverImg} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={26} color="#9ca3af" />
                    <Text style={styles.coverText}>Tap to use sample visual</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.inputLabel}>EVENT TYPE</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setEventType(type)}
                    style={[styles.typeBtn, eventType === type && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeBtnText, eventType === type && styles.typeBtnTextActive]}>{type.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>EVENT TITLE</Text>
              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="e.g. Moonlight Symphony"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>EVENT DATE (YYYY-MM-DD)</Text>
              <TextInput
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="2026-12-01"
                placeholderTextColor="#6b7280"
                style={styles.input}
              />

              <View style={styles.locationHeader}>
                <Text style={styles.inputLabel}>EVENT LOCATION</Text>
                {venueMapUri && (
                  <View style={styles.verifiedTag}>
                    <MaterialIcons name="verified" size={12} color="#22c55e" />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <TextInput
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder="e.g. Royal Albert Hall, London"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={verifyVenue} disabled={verifyingVenue || !eventLocation.trim()} style={styles.mapBtn}>
                  {verifyingVenue ? <ActivityIndicator color="#cd2bee" /> : <MaterialIcons name="map" size={20} color="#cd2bee" />}
                </Pressable>
              </View>

              {!!venueMapUri && (
                <Pressable onPress={() => void Linking.openURL(venueMapUri)} style={styles.mapsLink}>
                  <MaterialIcons name="open-in-new" size={14} color="#cd2bee" />
                  <Text style={styles.mapsLinkText}>Verify location on maps</Text>
                </Pressable>
              )}

              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiTitleWrap}>
                    <MaterialIcons name="auto-awesome" size={20} color="#cd2bee" />
                    <Text style={styles.aiTitle}>AI EVENT ARCHITECT</Text>
                  </View>
                  {loading && <ActivityIndicator color="#cd2bee" size="small" />}
                </View>

                <Text style={styles.aiBody}>
                  {aiHelperText ||
                    'Let Gemini suggest the event description and pricing tiers based on title and location.'}
                </Text>

                <Pressable onPress={() => void useAiArchitect()} disabled={loading} style={styles.aiBtn}>
                  <Text style={styles.aiBtnText}>{loading ? 'CONSULTING GEMINI...' : 'GENERATE DESCRIPTION & TIERS'}</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>EVENT DESCRIPTION</Text>
              <TextInput
                value={eventDesc}
                onChangeText={setEventDesc}
                placeholder="Tell your fans what to expect..."
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.descInput]}
                multiline
              />

              <View style={styles.tierHeader}>
                <Text style={styles.inputLabel}>TICKET TIERS</Text>
                <Pressable onPress={addTier}>
                  <Text style={styles.addTierText}>+ ADD TIER</Text>
                </Pressable>
              </View>

              {ticketTiers.map((tier, idx) => (
                <View key={`${tier.name}-${idx}`} style={styles.tierCard}>
                  <Pressable onPress={() => removeTier(idx)} style={styles.removeTierBtn}>
                    <MaterialIcons name="delete" size={14} color="#ef4444" />
                  </Pressable>
                  <TextInput value={tier.name} onChangeText={(v) => updateTier(idx, 'name', v)} style={styles.tierInput} placeholder="Tier Name" placeholderTextColor="#6b7280" />
                  <View style={styles.tierRow}>
                    <TextInput value={tier.price} onChangeText={(v) => updateTier(idx, 'price', v)} style={[styles.tierInput, { flex: 1 }]} placeholder="Price" placeholderTextColor="#6b7280" keyboardType="decimal-pad" />
                    <TextInput value={tier.capacity} onChangeText={(v) => updateTier(idx, 'capacity', v)} style={[styles.tierInput, { flex: 1 }]} placeholder="Capacity" placeholderTextColor="#6b7280" keyboardType="number-pad" />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => handleLaunchEvent('draft')} style={styles.draftBtn}>
                <Text style={styles.draftText}>{editingEventId ? 'KEEP AS DRAFT' : 'SAVE DRAFT'}</Text>
              </Pressable>
              <Pressable onPress={() => handleLaunchEvent('published')} style={styles.launchBtn}>
                <Text style={styles.launchText}>{editingEventId ? 'UPDATE EVENT' : 'LAUNCH EVENT'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111218',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: fontScale(16), fontFamily: 'PlusJakartaSansExtraBold' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#cd2bee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 14, gap: 14, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#12131a',
    padding: 14,
  },
  statPrimary: { borderColor: 'rgba(205,43,238,0.35)', backgroundColor: 'rgba(205,43,238,0.12)' },
  statLabel: { color: '#94a3b8', fontSize: fontScale(9), letterSpacing: 1.1, fontFamily: 'PlusJakartaSansExtraBold' },
  statValue: { color: '#fff', fontSize: fontScale(29), fontFamily: 'PlusJakartaSansExtraBold', marginTop: 2 },
  statSub: { color: '#22c55e', fontSize: fontScale(10), marginTop: 2, fontFamily: 'PlusJakartaSansBold' },
  sectionTitle: { color: '#6b7280', fontSize: fontScale(9), letterSpacing: 2, fontFamily: 'PlusJakartaSansExtraBold', marginTop: 6 },
  eventCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#12131a',
    padding: 14,
    gap: 10,
  },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { color: '#fff', fontSize: fontScale(16), fontFamily: 'PlusJakartaSansExtraBold' },
  eventVenue: { color: '#94a3b8', fontSize: fontScale(10), marginTop: 2, fontFamily: 'PlusJakartaSansBold' },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusLive: { borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.12)' },
  statusDraft: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  statusText: { fontSize: fontScale(8), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
  typePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(205,43,238,0.15)' },
  typeText: { color: '#cd2bee', fontSize: fontScale(8), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  occupancyText: { color: '#94a3b8', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold' },
  occupancyValue: { color: '#cd2bee', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  progressTrack: { height: 7, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#cd2bee' },
  eventBottom: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revenueText: { color: '#fff', fontSize: fontScale(14), fontFamily: 'PlusJakartaSansExtraBold' },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scanBtn: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
    backgroundColor: 'rgba(205,43,238,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanText: { color: '#cd2bee', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold' },
  menuBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  archiveCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#12131a',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  archiveText: { color: '#cbd5e1', fontSize: fontScale(12), fontFamily: 'PlusJakartaSansBold' },
  archiveStatus: { color: '#6b7280', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#111218',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#334155', marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { color: '#fff', fontSize: fontScale(21), fontFamily: 'PlusJakartaSansExtraBold' },
  inputLabel: { color: '#6b7280', fontSize: fontScale(10), letterSpacing: 1.4, fontFamily: 'PlusJakartaSansExtraBold' },
  coverBox: { height: 160, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  coverText: { color: '#9ca3af', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  typeBtnText: { color: '#94a3b8', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold' },
  typeBtnTextActive: { color: '#fff' },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansBold',
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: '#22c55e', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold' },
  locationRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsLink: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
    backgroundColor: 'rgba(205,43,238,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  mapsLinkText: { color: '#cd2bee', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  aiCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
    backgroundColor: 'rgba(205,43,238,0.1)',
    padding: 12,
    gap: 8,
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { color: '#cd2bee', fontSize: fontScale(9), letterSpacing: 1.2, fontFamily: 'PlusJakartaSansExtraBold' },
  aiBody: { color: '#e2e8f0', fontSize: fontScale(12), lineHeight: 18, fontFamily: 'PlusJakartaSansMedium' },
  aiBtn: { height: 42, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(205,43,238,0.4)', justifyContent: 'center', alignItems: 'center' },
  aiBtnText: { color: '#cd2bee', fontSize: fontScale(10), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
  descInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addTierText: { color: '#cd2bee', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  tierCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    gap: 8,
  },
  removeTierBtn: { position: 'absolute', right: 8, top: 8, zIndex: 2 },
  tierInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    color: '#fff',
    fontSize: fontScale(12),
  },
  tierRow: { flexDirection: 'row', gap: 6 },
  modalFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111218',
    flexDirection: 'row',
    gap: 8,
  },
  draftBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftText: { color: '#cbd5e1', fontSize: fontScale(10), letterSpacing: 1, fontFamily: 'PlusJakartaSansExtraBold' },
  launchBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: '#cd2bee', justifyContent: 'center', alignItems: 'center' },
  launchText: { color: '#fff', fontSize: fontScale(10), letterSpacing: 1.1, fontFamily: 'PlusJakartaSansExtraBold' },
});

export default CreatorEvents;
