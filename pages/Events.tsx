import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { fontSize } from './typography';

type FilterMode = 'day' | 'week' | 'month' | 'all';
type EventType = 'Live' | 'Workshop' | 'Physical';

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  creator: string;
  creatorAvatar: string;
  type: EventType;
  image: string;
  location: string;
  price: string;
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const locationPills = ['Global', 'London', 'San Francisco', 'Accra', 'Lagos', 'NYC'];

const upcomingEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Neon Nights Tour',
    date: new Date(2024, 7, 24),
    creator: 'Mila Ray',
    creatorAvatar: 'https://picsum.photos/seed/mila/100',
    type: 'Physical',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    location: 'O2 Arena, London',
    price: 'From $45',
  },
  {
    id: 'e2',
    title: 'Synth Soul Session',
    date: new Date(2024, 8, 12),
    creator: 'Elena Rose',
    creatorAvatar: 'https://picsum.photos/seed/elena/100',
    type: 'Workshop',
    image: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    location: 'The Blue Room, SF',
    price: 'Free',
  },
  {
    id: 'e3',
    title: 'Midnight Unplugged',
    date: new Date(2024, 11, 5),
    creator: 'Nova Pulse',
    creatorAvatar: 'https://picsum.photos/seed/nova/100',
    type: 'Live',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=800',
    location: 'Kulsah Live',
    price: '50 KC',
  },
  {
    id: 'e4',
    title: 'Summer Solstice',
    date: new Date(2024, 5, 21),
    creator: 'Alex Vibes',
    creatorAvatar: 'https://picsum.photos/seed/alex/100',
    type: 'Physical',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
    location: 'Ibiza Beach',
    price: 'From $80',
  },
  {
    id: 'e5',
    title: 'Afro-Soul Intensive',
    date: new Date(2024, 8, 15),
    creator: 'Lulu Vibe',
    creatorAvatar: 'https://picsum.photos/seed/lulu/100',
    type: 'Workshop',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
    location: 'Dance Loft, Accra',
    price: '100 KC',
  },
];

const Events: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
  const [activeLocation, setActiveLocation] = useState('Global');
  const [searchQuery, setSearchQuery] = useState('');
  // const [purchasingEvent, setPurchasingEvent] = useState<CalendarEvent | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const screenBg = theme.background;
  const glass = isDark ? 'rgba(255,255,255,0.06)' : theme.card;
  const softBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const chipIdleBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';
  const mutedText = isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : theme.textSecondary;
  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)';
  const modalBg = isDark ? 'rgba(9,9,11,0.94)' : 'rgba(255,255,255,0.96)';

  const changeMonth = (offset: number) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + offset);
    setSelectedMonth(next);
    setActiveFilter('month');
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return date >= monday && date <= sunday;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const filteredEvents = useMemo(() => {
    return upcomingEvents
      .filter((event) => {
        const searchMatch =
          !searchQuery ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase());

        if (!searchMatch) return false;

        const locationMatch =
          activeLocation === 'Global' ||
          event.location.toLowerCase().includes(activeLocation.toLowerCase()) ||
          (activeLocation === 'NYC' && event.location.toLowerCase().includes('new york'));

        if (!locationMatch) return false;

        if (activeFilter === 'all') return true;
        if (activeFilter === 'day') return isToday(event.date);
        if (activeFilter === 'week') return isThisWeek(event.date);

        return (
          event.date.getMonth() === selectedMonth.getMonth() &&
          event.date.getFullYear() === selectedMonth.getFullYear()
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeFilter, activeLocation, searchQuery, selectedMonth]);

  const confirmPurchase = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      // setPurchasingEvent(null);
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: screenBg }]}>
        <View style={[styles.header, { backgroundColor: screenBg, borderBottomColor: headerBorder }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: chipIdleBg, borderColor: softBorder }]}
            >
              <MaterialIcons name="chevron-left" size={20} color={theme.text} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>More Events</Text>
              <Text style={styles.headerSubtitle}>Galaxy Events Schedule</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchWrap}>
            <View style={[styles.searchBar, { backgroundColor: chipIdleBg, borderColor: softBorder }]}>
              <MaterialIcons name="search" size={20} color={secondaryText} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search events or locations..."
                placeholderTextColor={mutedText}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={secondaryText} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <View style={[styles.filterGroup, { borderRightColor: softBorder }]}>
                {[
                  { id: 'day', label: 'Today' },
                  { id: 'week', label: 'Weekly' },
                  { id: 'month', label: 'Monthly' },
                  { id: 'all', label: 'All Time' },
                ].map((item) => {
                  const active = activeFilter === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setActiveFilter(item.id as FilterMode)}
                      style={[
                        styles.filterChip,
                        { backgroundColor: active ? PRIMARY_COLOR : chipIdleBg },
                      ]}
                    >
                      <Text style={[styles.filterChipText, { color: active ? '#ffffff' : secondaryText }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {locationPills.map((location) => {
                const active = activeLocation === location;
                return (
                  <Pressable
                    key={location}
                    onPress={() => setActiveLocation(location)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? (isDark ? '#ffffff' : '#0f172a') : chipIdleBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? (isDark ? '#0f172a' : '#ffffff') : secondaryText },
                      ]}
                    >
                      {location}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {activeFilter === 'month' ? (
            <View style={styles.monthRow}>
              <View>
                <Text style={[styles.monthTitle, { color: theme.text }]}>
                  {months[selectedMonth.getMonth()]}
                </Text>
                <Text style={styles.monthYear}>{selectedMonth.getFullYear()}</Text>
              </View>

              <View style={[styles.monthControls, { backgroundColor: chipIdleBg }]}>
                <Pressable
                  onPress={() => changeMonth(-1)}
                  style={[styles.monthButton, { backgroundColor: surface }]}
                >
                  <MaterialIcons name="chevron-left" size={22} color={theme.text} />
                </Pressable>
                <Pressable
                  onPress={() => changeMonth(1)}
                  style={[styles.monthButton, { backgroundColor: surface }]}
                >
                  <MaterialIcons name="chevron-right" size={22} color={theme.text} />
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Pressable
                key={event.id}
                // onPress={() => navigation.navigate('EventDetail', { id: event.id })}
                style={[styles.eventCard, { backgroundColor: surface, borderColor: softBorder }]}
              >
                <View style={styles.visualWrap}>
                  <Image source={{ uri: event.image }} style={styles.eventImage} />
                  <View style={styles.imageOverlay} />

                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeMonth}>
                      {months[event.date.getMonth()].slice(0, 3)}
                    </Text>
                    <Text style={styles.dateBadgeDay}>{event.date.getDate()}</Text>
                  </View>

                  <View
                    style={[
                      styles.typeBadge,
                      event.type === 'Live'
                        ? { backgroundColor: '#ef4444' }
                        : event.type === 'Workshop'
                          ? { backgroundColor: '#a855f7' }
                          : { backgroundColor: '#f59e0b' },
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>{event.type}</Text>
                  </View>

                  <View style={styles.visualCopy}>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={14} color="#ffffff" />
                      <Text style={styles.locationText}>{event.location}</Text>
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                </View>

                <View style={styles.eventBody}>
                  <View style={styles.eventMetaRow}>
                    <View style={styles.creatorWrap}>
                      <View style={styles.creatorAvatarWrap}>
                        <Image source={{ uri: event.creatorAvatar }} style={styles.creatorAvatar} />
                        <View style={styles.creatorVerify}>
                          <MaterialIcons name="verified" size={10} color="#ffffff" />
                        </View>
                      </View>

                      <View>
                        <Text style={[styles.metaLabel, { color: mutedText }]}>Featuring</Text>
                        <Text style={[styles.creatorName, { color: theme.text }]}>{event.creator}</Text>
                      </View>
                    </View>

                    <View style={styles.ticketCopy}>
                      <Text style={[styles.metaLabel, { color: mutedText }]}>Tickets</Text>
                      <Text style={styles.ticketPrice}>{event.price}</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      navigation.navigate('EventDetail', { id: event.id })
                      // pressEvent.stopPropagation();
                      // setPurchasingEvent(event);
                    }}
                    style={[
                      styles.ctaButton,
                      { backgroundColor: isDark ? '#ffffff' : '#0f172a' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ctaText,
                        { color: isDark ? '#0f172a' : '#ffffff' },
                      ]}
                    >
                      Secure Your Spot
                    </Text>
                    <MaterialIcons
                      name="confirmation-number"
                      size={16}
                      color={isDark ? '#0f172a' : '#ffffff'}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: chipIdleBg }]}>
                <MaterialIcons name="event-busy" size={36} color={mutedText} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Events Scheduled</Text>
              <Text style={[styles.emptyBody, { color: secondaryText }]}>
                Try looking for another month
              </Text>
            </View>
          )}
        </ScrollView>

        {/* <Modal
          visible={!!purchasingEvent}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (!isSuccess) setPurchasingEvent(null);
          }}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => {
                if (!isSuccess) setPurchasingEvent(null);
              }}
            />
            <View style={[styles.modalCard, { backgroundColor: modalBg, borderColor: softBorder }]}>
              {purchasingEvent ? (
                isSuccess ? (
                  <View style={styles.successWrap}>
                    <View style={styles.successIcon}>
                      <MaterialIcons name="check-circle" size={42} color="#22c55e" />
                    </View>
                    <Text style={[styles.successTitle, { color: theme.text }]}>Ticket Secured!</Text>
                    <Text style={[styles.successBody, { color: secondaryText }]}>
                      See you at {purchasingEvent.title}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm Ticket</Text>
                    <Text style={[styles.modalSubtitle, { color: secondaryText }]}>
                      Purchase ticket for {purchasingEvent.title}
                    </Text>

                    <View style={styles.modalSummary}>
                      <View style={[styles.modalRow, { backgroundColor: chipIdleBg, borderColor: softBorder }]}>
                        <Text style={[styles.modalRowLabel, { color: mutedText }]}>Event</Text>
                        <Text style={[styles.modalRowValue, { color: theme.text }]}>
                          {purchasingEvent.title}
                        </Text>
                      </View>
                      <View style={[styles.modalRow, { backgroundColor: chipIdleBg, borderColor: softBorder }]}>
                        <Text style={[styles.modalRowLabel, { color: mutedText }]}>Price</Text>
                        <Text style={styles.modalPrice}>{purchasingEvent.price}</Text>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <Pressable
                        onPress={() => setPurchasingEvent(null)}
                        style={[styles.modalButtonSecondary, { borderColor: softBorder }]}
                      >
                        <Text style={[styles.modalButtonTextSecondary, { color: theme.text }]}>
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable onPress={confirmPurchase} style={styles.modalButtonPrimary}>
                        <Text style={styles.modalButtonTextPrimary}>Confirm</Text>
                      </Pressable>
                    </View>
                  </>
                )
              ) : null}
            </View>
          </View>
        </Modal> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    // paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: PRIMARY_COLOR,
    marginTop: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: {
    width: 42,
  },
  searchWrap: {
    gap: 14,
  },
  searchBar: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20
  },
  searchInput: {
    flex: 1,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  filterScroll: {
    gap: 10,
    paddingBottom: 2,
    paddingHorizontal: 20,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
    marginRight: 2,
    borderRightWidth: 1,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  monthRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
  },
  monthYear: {
    marginTop: 4,
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  monthControls: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 18,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 22,
    paddingBottom: 120,
  },
  eventCard: {
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
  },
  visualWrap: {
    height: 260,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  dateBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeMonth: {
    color: '#64748b',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dateBadgeDay: {
    color: PRIMARY_COLOR,
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
  },
  typeBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeBadgeText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  visualCopy: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.82)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  eventTitle: {
    color: '#ffffff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    width: '82%',
    textTransform: 'uppercase',
  },
  eventBody: {
    padding: 22,
    gap: 18,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  creatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  creatorAvatarWrap: {
    position: 'relative',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: primaryColorAlpha(0.2),
  },
  creatorVerify: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY_COLOR,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  creatorName: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  ticketCopy: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
  },
  ctaButton: {
    minHeight: 54,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 14,
  },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
  },
  emptyBody: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalSubtitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    marginBottom: 22,
  },
  modalSummary: {
    gap: 12,
    marginBottom: 22,
  },
  modalRow: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalRowLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  modalRowValue: {
    flex: 1,
    textAlign: 'right',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  modalPrice: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonTextSecondary: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  successWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 18,
  },
  successIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  successTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
  },
  successBody: {
    textAlign: 'center',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
});

export default Events;
