import React, { useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mediumScreen } from '../types';
import { fontSize } from './typography';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  img?: string;
}

const EVENT_TYPES: Array<CreatorEvent['type']> = ['Physical', 'Live Stream', 'Workshop'];

const CreatorEvents: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingVenue, setVerifyingVenue] = useState(false);
  const [aiHelperText, setAiHelperText] = useState('');
  const [venueMapUri, setVenueMapUri] = useState<string | null>(null);

  const [coverImg, setCoverImg] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  // const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState<CreatorEvent['type']>('Physical');
  const [ticketTiers, setTicketTiers] = useState<EventTicketTier[]>([
    { name: 'General Admission', price: '45.00', capacity: '1000' },
  ]);

  const textPrimary = isDark ? '#ffffff' : theme.text;
  const textSecondary = isDark ? '#94a3b8' : theme.textSecondary;
  const textMuted = isDark ? '#6b7280' : theme.textMuted;
  const cardBg = isDark ? '#12131a' : theme.card;
  const shellBg = isDark ? '#111218' : theme.card;
  const screenBg = isDark ? '#09090b' : theme.screen;
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const softBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const iconBtnBg = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15, 23, 42, 0.89)';


  const [eventDate, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (_event: any, selectedDate?: Date) => {
    setShow(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };


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
      img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
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
      img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
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
      img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
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
    setDate(new Date());
    // setEventDate(new Date());
    setEventDesc('');
    setEventType('Physical');
    setCoverImg(null);
    setTicketTiers([{ name: 'General Admission', price: '45.00', capacity: '1000' }]);
    setVenueMapUri(null);
    setAiHelperText('');
    setLoading(false);
  };

  const openEditor = (event?: CreatorEvent) => {
    if (event) {
      setEditingEventId(event.id);
      setEventTitle(event.title);
      setEventLocation(event.venue);
      setEventType(event.type);
      setDate(new Date);
      // setEventDate(new);
      setEventDesc('');
      setCoverImg(event.img ?? null);
      setAiHelperText('');
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
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDate.toDateString().trim()) {
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
                img: coverImg ?? e.img,
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
        img: coverImg ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
      };
      setCurrentEvents((prev) => [newEvent, ...prev]);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const verifyVenue = async () => {
    if (!eventLocation.trim()) return;
    setVerifyingVenue(true);
    try {
      setVenueMapUri(`https://www.google.com/maps/search/${encodeURIComponent(eventLocation)}`);
    } finally {
      setVerifyingVenue(false);
    }
  };

  const useAiArchitect = () => {
    setLoading(true);
    setAiHelperText('');

    setTimeout(() => {
      const title = eventTitle.trim() || 'Your event';
      const location = eventLocation.trim() || 'a stellar venue';
      setAiHelperText(
        `${title} at ${location} can feel like a galaxy-lit fan rendezvous: open with an immersive visual intro, keep the crowd close with a creator Q&A, and offer General, VIP, and Meet & Greet tiers for different fan orbits.`,
      );
      setLoading(false);
    }, 650);
  };

  React.useEffect(() => {
    if (!route.params?.openComposer) return;

    openEditor();
    navigation.setParams?.({ openComposer: undefined });
  }, [navigation, route.params?.openComposer]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <View style={[styles.header, { backgroundColor: shellBg, borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Event Studio</Text>
        </View>
        <Pressable onPress={() => openEditor()} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: border, backgroundColor: cardBg }]}>
            <Text style={[styles.statLabel, { color: textSecondary }]}>TOTAL BOOKINGS</Text>
            <Text style={[styles.statValue, { color: textPrimary }]}>{totalBookings}</Text>
            <Text style={styles.statSub}>+2 Upcoming</Text>
          </View>
          <View style={[styles.statCard, styles.statPrimary, { backgroundColor: isDark ? primaryColorAlpha(0.12) : primaryColorAlpha(0.08) }]}>
            <Text style={[styles.statLabel, { color: PRIMARY_COLOR }]}>TOTAL REVENUE</Text>
            <Text style={[styles.statValue, { color: PRIMARY_COLOR }]}>$2.8M</Text>
            <Text style={[styles.statSub, { color: textSecondary }]}>Ticket sales only</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textMuted }]}>ACTIVE ENGAGEMENTS</Text>
        <View style={{ gap: 16 }}>
          {currentEvents.map((event) => {
            const occupancyPct = Math.round((event.ticketsSold / Math.max(event.totalTickets, 1)) * 100);
            const isNearlySoldOut = occupancyPct >= 90;
            return (
              <Pressable key={event.id} onPress={() => openEditor(event)} style={[styles.eventCard, { borderColor: border, backgroundColor: cardBg }]}>
                <View style={styles.eventVisual}>
                  <Image
                    source={{ uri: event.img ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800' }}
                    style={styles.eventImage}
                  />
                  <LinearGradient colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusPill, event.status === 'published' ? styles.statusLiveVisual : styles.statusDraftVisual]}>
                      <Text style={styles.statusTextVisual}>{event.status.toUpperCase()}</Text>
                    </View>
                    <View style={styles.eventTypeBadge}>
                      <Text style={styles.statusTextVisual}>{event.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.visualTitleWrap}>
                    <Text style={styles.visualTitle}>{event.title}</Text>
                    <View style={styles.visualDateRow}>
                      <MaterialIcons name="calendar-month" size={14} color={PRIMARY_COLOR} />
                      <Text style={styles.visualDate}>{event.date}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.eventBody}>
                  <View style={styles.eventMetaRow}>
                    <View style={styles.eventLocationWrap}>
                      <View style={styles.eventLocationLine}>
                        <MaterialIcons name="location-on" size={14} color={textSecondary} />
                        <Text style={[styles.eventVenue, { color: textSecondary }]} numberOfLines={1}>
                          {event.venue}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.eventRevenueWrap}>
                      <Text style={styles.revenueAccent}>{event.revenue}</Text>
                      <Text style={[styles.revenueLabel, { color: textMuted }]}>GROSS REV</Text>
                    </View>
                  </View>

                  <View style={styles.ticketBlock}>
                    <View style={styles.ticketSalesRow}>
                      <View>
                        <Text style={[styles.ticketSalesTitle, { color: textPrimary }]}>TICKET SALES</Text>
                        <Text style={[styles.ticketSalesMeta, { color: textMuted }]}>
                          {event.ticketsSold.toLocaleString()} / {event.totalTickets.toLocaleString()} SOLD
                        </Text>
                      </View>
                      <Text style={[styles.ticketSalesPercent, { color: isNearlySoldOut ? '#22c55e' : PRIMARY_COLOR }]}>
                        {occupancyPct}%
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
                      <View style={[styles.progressFill, { width: `${occupancyPct}%` as `${number}%`, backgroundColor: isNearlySoldOut ? '#22c55e' : PRIMARY_COLOR }]} />
                    </View>
                  </View>

                  <View style={[styles.eventFooter, { borderTopColor: border }]}>
                    <View style={styles.activeTicketChip}>
                      <MaterialIcons name="confirmation-number" size={13} color={PRIMARY_COLOR} />
                      <Text style={styles.activeTicketText}>ACTIVE TICKETS</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.eventActionButton, { backgroundColor: inputBg }]}
                        onPress={(pressEvent) => {
                          pressEvent.stopPropagation();
                          openEditor(event);
                        }}
                      >
                        <MaterialIcons name="edit" size={16} color={textSecondary} />
                      </Pressable>
                      <Pressable
                        style={[styles.eventActionButton, { backgroundColor: inputBg }]}
                        onPress={(pressEvent) => {
                          pressEvent.stopPropagation();
                          navigation.navigate('/creator/analytics', { event: event.id });
                        }}
                      >
                        <MaterialIcons name="insert-chart" size={16} color={textSecondary} />
                      </Pressable>
                      <Pressable
                        style={[styles.eventActionButton, { backgroundColor: inputBg }]}
                        onPress={(pressEvent) => {
                          pressEvent.stopPropagation();
                          deleteEvent(event.id);
                        }}
                      >
                        <MaterialIcons name="delete" size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { opacity: 0.7, color: textMuted }]}>EVENT ARCHIVES</Text>
        <View style={[styles.archiveCard, { borderColor: border, backgroundColor: cardBg }]}>
          <View style={styles.archiveLeft}>
            <MaterialIcons name="history" size={18} color={textSecondary} />
            <Text style={[styles.archiveText, { color: textPrimary }]}>2023 Summer Festival Run</Text>
          </View>
          <Text style={[styles.archiveStatus, { color: textMuted }]}>COMPLETED</Text>
        </View>
      </ScrollView>

      <Modal
      visible={isModalOpen}
      statusBarTranslucent
      transparent animationType="slide"
      onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
        <View style={styles.modalRoot}>
          <Pressable style={[styles.modalBackdrop, { backgroundColor: modalBackdrop }]} onPress={() => setIsModalOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: shellBg, borderColor: border }]}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>{editingEventId ? 'Edit Event' : 'Launch New Event'}</Text>
              <Pressable style={[styles.iconBtn, { borderColor: border, backgroundColor: iconBtnBg }]} onPress={() => setIsModalOpen(false)}>
                <MaterialIcons name="close" size={18} color={textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: textMuted }]}>PROMOTIONAL COVER</Text>
              <Pressable
                style={[styles.coverBox, { borderColor: softBorder, backgroundColor: inputBg }]}
                onPress={() => setCoverImg('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800')}
              >
                {coverImg ? (
                  <Image source={{ uri: coverImg }} style={styles.coverImg} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={26} color="#9ca3af" />
                    <Text style={[styles.coverText, { color: textSecondary }]}>Tap to use sample visual</Text>
                  </View>
                )}
              </Pressable>

              <Text style={[styles.inputLabel, { color: textMuted }]}>EVENT TYPE</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setEventType(type)}
                    style={[styles.typeBtn, { borderColor: softBorder, backgroundColor: inputBg }, eventType === type && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeBtnText, { color: textSecondary }, eventType === type && styles.typeBtnTextActive]}>{type.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: textMuted }]}>EVENT TITLE</Text>
              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="e.g. Moonlight Symphony"
                placeholderTextColor={textMuted}
                style={[styles.input, { borderColor: softBorder, backgroundColor: inputBg, color: textPrimary }]}
              />

              <Text style={[styles.inputLabel, { color: textMuted }]}>EVENT DATE (YYYY-MM-DD)</Text>
              <View style={styles.locationRow}>
                <TextInput
                value={eventDate.toDateString()}
                onChangeText={onChange}
                placeholder="2026-12-01"
                placeholderTextColor={textMuted}
                style={[styles.input, {flex: 1, borderColor: softBorder, backgroundColor: inputBg, color: textPrimary,}]}
              />
              <Pressable onPress={()=>setShow(true)} 
              // disabled={verifyingVenue || !eventLocation.trim()} 
              style={[styles.mapBtn, { borderColor: softBorder, 
              backgroundColor: inputBg }]}>
                <MaterialIcons name="date-range" size={20} color={PRIMARY_COLOR} />
                </Pressable>
              </View>

              <View style={styles.locationHeader}>
                <Text style={[styles.inputLabel, { color: textMuted }]}>EVENT LOCATION</Text>
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
                  placeholderTextColor={textMuted}
                  style={[styles.input, { flex: 1, borderColor: softBorder, backgroundColor: inputBg, color: textPrimary }]}
                />
                <Pressable onPress={verifyVenue} disabled={verifyingVenue || !eventLocation.trim()} style={[styles.mapBtn, { borderColor: softBorder, backgroundColor: inputBg }]}>
                  {verifyingVenue ? <ActivityIndicator color={PRIMARY_COLOR} /> : <MaterialIcons name="map" size={20} color={PRIMARY_COLOR} />}
                </Pressable>
              </View>

              {!!venueMapUri && (
                <Pressable onPress={() => void Linking.openURL(venueMapUri)} style={styles.mapsLink}>
                  <MaterialIcons name="open-in-new" size={14} color={PRIMARY_COLOR} />
                  <Text style={styles.mapsLinkText}>Verify location on maps</Text>
                </Pressable>
              )}

              {/* <View style={[styles.aiCard, { borderColor: primaryColorAlpha(0.25), backgroundColor: primaryColorAlpha(isDark ? 0.12 : 0.08) }]}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiTitleRow}>
                    <MaterialIcons name="auto-awesome" size={22} color={PRIMARY_COLOR} />
                    <Text style={styles.aiTitle}>AI EVENT ARCHITECT</Text>
                  </View>
                  {loading && <ActivityIndicator color={PRIMARY_COLOR} />}
                </View>
                <Text style={[styles.aiBody, { color: aiHelperText ? textPrimary : textSecondary }]}>
                  {aiHelperText ||
                    'Generate a galaxy-ready event description and ticket tier direction based on the title, venue, and fan experience.'}
                </Text>
                <Pressable disabled={loading} onPress={useAiArchitect} style={[styles.aiButton, { opacity: loading ? 0.7 : 1 }]}>
                  <Text style={styles.aiButtonText}>{loading ? 'CONSULTING STARS...' : 'GENERATE DESCRIPTION & TIERS'}</Text>
                </Pressable>
              </View> */}

              <Text style={[styles.inputLabel, { color: textMuted }]}>EVENT DESCRIPTION</Text>
              <TextInput
                value={eventDesc}
                onChangeText={setEventDesc}
                placeholder="Tell your fans what to expect..."
                placeholderTextColor={textMuted}
                style={[styles.input, styles.descInput, { borderColor: softBorder, backgroundColor: inputBg, color: textPrimary }]}
                multiline
              />

              <View style={styles.tierHeader}>
                <Text style={[styles.inputLabel, { color: textMuted }]}>TICKET TIERS</Text>
                <Pressable onPress={addTier}>
                  <Text style={styles.addTierText}>+ ADD TIER</Text>
                </Pressable>
              </View>

              {ticketTiers.map((tier, idx) => (
                <View key={`${tier.name}-${idx}`} style={[styles.tierCard, { borderColor: border, backgroundColor: inputBg }]}>
                  <Pressable onPress={() => removeTier(idx)} style={styles.removeTierBtn}>
                    <MaterialIcons name="delete" size={14} color="#ef4444" />
                  </Pressable>
                  <TextInput value={tier.name} onChangeText={(v) => updateTier(idx, 'name', v)} style={[styles.tierInput, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', color: textPrimary }]} placeholder="Tier Name" placeholderTextColor={textMuted} />
                  <View style={styles.tierRow}>
                    <View style = {{
                      width: '48%',
                      gap: 5
                    }}>
                    <Text style={{
                      fontFamily: 'Pogonia_500Medium',
                      fontSize: fontSize.b4.fontSize,
                      lineHeight: fontSize.b4.lineHeight,
                      color: textMuted
                    }}>
                      Ticket Price
                    </Text>
                      <TextInput 
                    value={tier.price} 
                    onChangeText={(v) => updateTier(idx, 'price', v)}
                    style={[styles.tierInput, 
                      { flex: 1, borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', color: textPrimary }]} 
                      placeholder="Price" placeholderTextColor={textMuted} 
                      keyboardType="decimal-pad" />
                    </View>
                    <View style = {{
                      width: '48%',
                      gap: 5
                    }}>
                    <Text  style={{
                      fontFamily: 'Pogonia_500Medium',
                      fontSize: fontSize.b4.fontSize,
                      lineHeight: fontSize.b4.lineHeight,
                      color: textMuted
                    }}>
                      Event Capacity
                    </Text>
                      <TextInput 
                    value={tier.capacity} 
                    onChangeText={(v) => updateTier(idx, 'capacity', v)} 
                    style={[styles.tierInput, 
                          { flex: 1, borderColor: border, 
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', color: textPrimary }]} 
                          placeholder="Capacity" 
                          placeholderTextColor={textMuted} 
                          keyboardType="number-pad" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: border, backgroundColor: shellBg }]}>
              <Pressable onPress={() => handleLaunchEvent('draft')} style={[styles.draftBtn, { borderColor: softBorder, backgroundColor: inputBg }]}>
                <Text style={[styles.draftText, { color: isDark ? '#cbd5e1' : textPrimary }]}>{editingEventId ? 'KEEP AS DRAFT' : 'SAVE DRAFT'}</Text>
              </Pressable>
              <Pressable onPress={() => handleLaunchEvent('published')} style={styles.launchBtn}>
                <Text style={styles.launchText}>{editingEventId ? 'UPDATE EVENT' : 'LAUNCH EVENT'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
         {show && <Pressable
         onPress={()=> setShow(false)} 
         style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            zIndex: 3,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: modalBackdrop,
         }}>
           
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onValueChange={onChange}
        />
      
          </Pressable>}
      </Modal>
    </View>
   
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
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
  headerTitle: {  ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', letterSpacing: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 14, gap: 14, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  statPrimary: { borderColor: primaryColorAlpha(0.35), backgroundColor: primaryColorAlpha(0.12) },
  statLabel: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.1 },
  statValue: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, marginTop: 2 },
  statSub: { color: '#22c55e', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginTop: 2 },
  sectionTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 2, marginTop: 6 },
  eventCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventVisual: { height: 190, overflow: 'hidden', backgroundColor: '#020617' },
  eventImage: { width: '100%', height: '100%' },
  badgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLiveVisual: { borderColor: 'rgba(34,197,94,0.45)', backgroundColor: 'rgba(34,197,94,0.35)' },
  statusDraftVisual: { borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(0,0,0,0.38)' },
  eventTypeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTextVisual: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1 },
  visualTitleWrap: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  visualTitle: { color: '#fff', ...fontSize.h2, lineHeight: fontSize.h2.lineHeight },
  visualDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  visualDate: { color: 'rgba(255,255,255,0.82)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1 },
  eventBody: { padding: 16, gap: 16 },
  eventMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eventLocationWrap: { flex: 1, minWidth: 0 },
  eventLocationLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventRevenueWrap: { alignItems: 'flex-end' },
  revenueAccent: { color: PRIMARY_COLOR, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  revenueLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.5 },
  ticketBlock: { gap: 8 },
  ticketSalesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  ticketSalesTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1 },
  ticketSalesMeta: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.6, marginTop: 2 },
  ticketSalesPercent: { ...fontSize.b2, lineHeight: fontSize.b2.lineHeight },
  eventFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  activeTicketChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: primaryColorAlpha(0.12),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.28),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeTicketText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventActionButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  eventVenue: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginTop: 2 },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusLive: { borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.12)' },
  statusDraft: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  statusText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1 },
  typePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: primaryColorAlpha(0.15) },
  typeText: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1 },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  occupancyText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  occupancyValue: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PRIMARY_COLOR },
  eventBottom: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revenueText: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scanBtn: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    backgroundColor: primaryColorAlpha(0.12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  menuBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  archiveCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  archiveText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  archiveStatus: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  modalKeyboardAvoiding: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    maxHeight: '92%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  inputLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1.4 },
  coverBox: { height: 160, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  coverText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  typeBtnText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  typeBtnTextActive: { color: '#fff' },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: '#22c55e', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  locationRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsLink: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    backgroundColor: primaryColorAlpha(0.12),
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  mapsLinkText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1.2 },
  aiBody: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  aiButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: primaryColorAlpha(0.12),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiButtonText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1 },
  descInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addTierText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  tierCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    justifyContent: 'center',
  },
  removeTierBtn: { position: 'absolute', right: 20, top: 23, zIndex: 2 },
  tierInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    paddingTop: 8,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    flexDirection: 'row',
    gap: 8,
  },
  draftBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1 },
  launchBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  launchText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.1 },
});

export default CreatorEvents;
