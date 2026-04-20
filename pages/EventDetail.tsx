import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fontScale } from '../fonts';

const reminderOptions = [
  { label: '30 minutes before', value: '30m' },
  { label: '1 hour before', value: '1h' },
  { label: '6 hours before', value: '6h' },
  { label: '1 day before', value: '1d' },
  { label: '1 week before', value: '1w' },
];

const EventDetail: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.id ?? 'burna-boy';
  const [loading, setLoading] = useState(true);
  const [locationInsights, setLocationInsights] = useState('');
  const [venueMapUri, setVenueMapUri] = useState<string | null>(null);
  const [venueSnippets, setVenueSnippets] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);

  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const card = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const soft = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const faint = isDark ? 'rgba(255,255,255,0.45)' : theme.textMuted;
  const accent = isDark ? '#cd2bee' : '#a21caf';

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
        title: 'Burna Boy: Love, Damini Live | Kulsah',
        message: 'Join me at Burna Boy: Love, Damini Live on Kulsah.',
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
          <Image source={{ uri: 'https://picsum.photos/seed/eventdetail/800/600' }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)', isDark ? '#050505' : theme.background]} style={StyleSheet.absoluteFillObject} />

          <Pressable onPress={() => navigation.goBack()} style={[styles.topButton, { top: insets.top + 12, left: 16, borderColor: 'rgba(255,255,255,0.12)' }]}>
            <MaterialIcons name="chevron-left" size={22} color="#fff" />
          </Pressable>

          <View style={[styles.topRight, { top: insets.top + 12 }]}>
            <Pressable onPress={() => setReminderOpen(true)} style={[styles.topButton, { borderColor: 'rgba(255,255,255,0.12)' }]}>
              <MaterialIcons name={activeReminder ? 'notifications-active' : 'notifications'} size={22} color={activeReminder ? '#cd2bee' : '#fff'} />
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
                <Text style={[styles.eyebrowAccent, { color: accent }]}>World Tour 2024</Text>
                <Text style={[styles.title, { color: theme.text }]}>Burna Boy: Love, Damini Live</Text>
              </View>
              <View style={styles.fastBadge}><Text style={styles.fastBadgeText}>Selling Fast</Text></View>
            </View>

            <View style={[styles.infoBlock, { borderColor: border }]}>
              {[{ icon: 'calendar-month', title: 'Saturday, Aug 24', sub: 'Starts at 8:00 PM' }, { icon: 'location-on', title: 'The O2 Arena', sub: 'Peninsula Square, London' }].map((item) => (
                <View key={item.title} style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name={item.icon as any} size={20} color={accent} /></View>
                  <View><Text style={[styles.infoTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.infoSub, { color: subtle }]}>{item.sub}</Text></View>
                </View>
              ))}
            </View>

            <View style={styles.sectionGap}>
              <View style={styles.rowBetween}>
                <Text style={[styles.eyebrow, { color: faint }]}>Venue Map & Insights</Text>
                {loading ? <View style={[styles.spinner, { borderColor: accent, borderTopColor: 'transparent' }]} /> : null}
              </View>

              <Pressable onPress={openMap} style={[styles.mapCard, { borderColor: border }]}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800' }} style={styles.mapImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.mapOverlay}><MaterialIcons name="location-on" size={36} color="#cd2bee" /><Text style={styles.mapText}>Tap to navigate</Text></View>
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
            <Text style={[styles.body, { color: subtle }]}>The African Giant returns to London for an unforgettable night of Afrobeats, culture, and high-energy performance. Featuring special guests and immersive 360 visuals.</Text>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: isDark ? 'rgba(5,5,5,0.95)' : 'rgba(255,255,255,0.96)', borderColor: border }]}>
        <Pressable onPress={() => navigation.navigate('SelectTickets', { id: eventId })} style={[styles.footerButton, { backgroundColor: accent }]}>
          <Text style={styles.footerButtonText}>Select Tickets</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={reminderOpen} transparent animationType="slide" onRequestClose={() => setReminderOpen(false)}>
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
  safeArea: { flex: 1 }, toastWrap: { position: 'absolute', left: 20, right: 20, zIndex: 50, alignItems: 'center' }, toastText: { color: '#fff', backgroundColor: '#cd2bee', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.4 },
  hero: { height: 320, width: '100%' }, heroImage: { width: '100%', height: '100%' }, topButton: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.34)', alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, topRight: { position: 'absolute', right: 16, flexDirection: 'row', gap: 10 },
  content: { paddingHorizontal: 16, gap: 22 }, panel: { borderRadius: 28, borderWidth: 1, padding: 18, gap: 18 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, eyebrowAccent: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 1.8 }, title: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(20), lineHeight: 28 }, fastBadge: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }, fastBadgeText: { color: '#ef4444', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 1 },
  infoBlock: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 16, gap: 14 }, infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, infoIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, infoTitle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(11) }, infoSub: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(9) },
  sectionGap: { gap: 12 }, eyebrow: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 1.6 }, spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, mapCard: { aspectRatio: 16 / 9, borderRadius: 22, overflow: 'hidden', borderWidth: 1 }, mapImage: { width: '100%', height: '100%' }, mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 6 }, mapText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.2 },
  tipCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 }, body: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(11), lineHeight: 20 }, tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, tipText: { flex: 1, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(9), lineHeight: 16 }, routeButton: { height: 46, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, routeButtonText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(16) }, ticketRow: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, ticketTitle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) }, ticketMeta: { marginTop: 4, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 0.6 }, ticketPrice: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(10) },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 }, footerButton: { height: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, footerButtonText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(10), textTransform: 'uppercase', letterSpacing: 1.2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' }, modalCard: { borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, gap: 12 }, sheetHandle: { width: 46, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 6 }, centerBlock: { alignItems: 'center', gap: 6, marginBottom: 8 }, reminderRow: { height: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reminderText: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) }, removeButton: { height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, removeButtonText: { color: '#ef4444', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.2 }, cancelButton: { height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});

export default EventDetail;

