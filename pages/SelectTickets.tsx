import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenAI } from '@google/genai';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediumScreen } from '../types';
import PaymentSuccess from '../assets/icons/payment-success.svg'
import { fontSize } from '../typography';
import { PageSkeleton } from '../components/PageSkeleton';
import { useEvent } from '../src/hooks/events/useEvents';
import { usePurchaseEventTickets } from '../src/hooks/events/useEventMutations';
import { createIdempotencyKey, getMaxPurchaseQuantity, multiplyDecimal } from '../src/utils/events';
import { parseApiError } from '../src/utils/apiError';
import type { EventTicketPurchaseResource, EventTicketResource } from '../src/types/event.types';

interface TicketTier {
  id: string;
  code?: string;
  name: string;
  price: string;
  currency: string;
  description: string;
  totalQuantity: number;
  soldQuantity: number;
  availableQuantity: number;
  maxQuantity: number;
  available: boolean;
  color: string;
}

const TIERS: TicketTier[] = [
  { id: 'pit', name: 'Golden Circle Pit', price: '350.0000', currency: 'GHS', description: 'Directly in front of the stage. High energy.', totalQuantity: 0, soldQuantity: 0, availableQuantity: 0, maxQuantity: 0, available: false, color: PRIMARY_COLOR },
  { id: 'floor', name: 'Standing Floor', price: '125.0000', currency: 'GHS', description: 'Main standing area. Great visibility.', totalQuantity: 0, soldQuantity: 0, availableQuantity: 0, maxQuantity: 0, available: false, color: '#3b82f6' },
  { id: 'mezz', name: 'Premium Seated', price: '185.0000', currency: 'GHS', description: 'Elevated view with comfortable seating.', totalQuantity: 0, soldQuantity: 0, availableQuantity: 0, maxQuantity: 0, available: false, color: '#22c55e' },
  { id: 'rear', name: 'Seated - Tier 2', price: '95.0000', currency: 'GHS', description: 'Affordable views of the whole stage.', totalQuantity: 0, soldQuantity: 0, availableQuantity: 0, maxQuantity: 0, available: false, color: '#6b7280' },
];

const SelectTickets: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.id ?? 'burna-boy';
  const apiEventId = /^(?:event_)?\d+$/.test(String(eventId)) ? eventId : undefined;
  const eventQuery = useEvent(apiEventId);
  const purchaseMutation = usePurchaseEventTickets(apiEventId ?? 1);
  const purchaseKey = useRef<string | null>(null);
  const purchaseStorageKey = `event-ticket-purchase:${String(apiEventId ?? eventId)}`;
  const [purchasedTickets, setPurchasedTickets] = useState<EventTicketResource[]>([]);
  const [purchaseSummary, setPurchaseSummary] = useState<EventTicketPurchaseResource['purchase'] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const showLiveSeatingMap = route.params?.showLiveSeatingMap === true;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const accent = isDark ? PRIMARY_COLOR : theme.accent;
  const screenBg = isDark ? '#060913' : '#f8fafc';
  const headerBg = isDark ? '#11131bcc' : 'rgba(255,255,255,0.96)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const softBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const headerButtonBg = isDark ? 'rgba(255,255,255,0.08)' : theme.surface;
  const cardBg = isDark ? '#121827' : theme.card;
  const panelBg = isDark ? '#101521' : '#ffffff';
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
  const titleColor = isDark ? '#ffffff' : theme.text;
  const subtle = isDark ? '#8f95af' : theme.textSecondary;
  const muted = isDark ? '#6b7280' : theme.textMuted;
  const footerBg = isDark ? '#0b0f18f2' : 'rgba(255,255,255,0.98)';
  const successIconBg = isDark ? primaryColorAlphaHex('20') : primaryColorAlpha(0.12);
  const successIconBorder = isDark ? primaryColorAlphaHex('55') : primaryColorAlpha(0.28);
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)';
  const walletBalance = 1240;
  const tiers = useMemo<TicketTier[]>(() => eventQuery.data?.ticket_types?.map((ticket, index) => ({
    id: String(ticket.id ?? ticket.code), code: ticket.code, name: ticket.name,
    price: String(ticket.price ?? ticket.unit_price ?? '0'), currency: ticket.currency,
    description: ticket.description || 'Event admission ticket', totalQuantity: Number(ticket.quantity || 0),
    soldQuantity: Number(ticket.sold_count ?? ticket.sold_quantity ?? 0),
    availableQuantity: Number(ticket.available_quantity ?? ticket.remaining_count ?? 0),
    maxQuantity: getMaxPurchaseQuantity(eventQuery.data!, ticket),
    available: ticket.is_available && getMaxPurchaseQuantity(eventQuery.data!, ticket) > 0,
    color: [PRIMARY_COLOR, '#3b82f6', '#22c55e', '#6b7280'][index % 4],
  })) ?? TIERS, [eventQuery.data]);

  useEffect(() => {
    AsyncStorage.getItem(purchaseStorageKey).then((key: string | null) => { if (key && !purchaseKey.current) purchaseKey.current = key; }).catch(() => undefined);
  }, [purchaseStorageKey]);

  const setAttemptKey = (key: string) => {
    purchaseKey.current = key;
    void AsyncStorage.setItem(purchaseStorageKey, key);
  };

  const updateQuantity = (tierId: string, delta: number) => {
    const tier = tiers.find((item) => item.id === tierId);
    setQuantities((prev) => ({ [tierId]: Math.min(tier?.maxQuantity ?? 0, Math.max(1, (prev[tierId] || 1) + delta)) }));
    if (!purchaseKey.current) setAttemptKey(createIdempotencyKey());
  };

  const selectedTier = tiers.find((tier) => tier.id === selectedZone);
  const selectedQuantity = selectedTier ? quantities[selectedTier.id] || 0 : 0;
  const totalPrice = selectedTier ? multiplyDecimal(selectedTier.price, selectedQuantity) : '0.0000';
  const totalTickets = useMemo(
    () => Object.values(quantities).reduce((acc, quantity) => acc + quantity, 0),
    [quantities],
  );

  const handlePurchase = async () => {
    setErrorText('');
    setFieldErrors({});

    if (totalTickets <= 0) {
      setErrorText('Select at least one ticket.');
      return;
    }
    const tier = selectedTier;
    if (!tier || !apiEventId) { setErrorText('This ticket is unavailable.'); return; }
    const key = purchaseKey.current ?? createIdempotencyKey();
    setAttemptKey(key);
    try {
      const response = await purchaseMutation.mutateAsync({
        ...(tier.code ? { ticket_type_code: tier.code } : { ticket_type_name: tier.name }),
        quantity: quantities[tier.id] || 0,
        idempotency_key: key,
        metadata: { source: Platform.OS, client: 'kulsah-mobile' },
      });
      setPurchaseSummary(response.data.data.purchase);
      setPurchasedTickets(response.data.data.purchase.tickets || []);
      const firstTicket = response.data.data.purchase.tickets?.[0];
      if (firstTicket) {
        void AsyncStorage.setItem('fan-ticket:latest', JSON.stringify({ ticket: firstTicket, event: response.data.data.event, purchase: response.data.data.purchase }));
      }
      purchaseKey.current = null;
      void AsyncStorage.removeItem(purchaseStorageKey);
      setShowSuccess(true);
    } catch (error: any) {
      const parsed = parseApiError(error);
      setFieldErrors(parsed.validationErrors ?? {});
      setErrorText(parsed.message);
      if ([403, 422].includes(parsed.status ?? 0)) {
        const refreshed = await eventQuery.refetch();
        const freshTicket = refreshed.data?.ticket_types?.find((item) => String(item.id ?? item.code) === tier.id || item.name === tier.name);
        if (freshTicket) setQuantities({ [tier.id]: Math.max(1, Math.min(quantities[tier.id] || 1, getMaxPurchaseQuantity(refreshed.data!, freshTicket))) });
      }
    }
  };

  const selectTier = (tierId: string) => {
    const tier = tiers.find((item) => item.id === tierId);
    if (!tier?.available || purchaseMutation.isPending) return;
    if (tierId !== selectedZone) setAttemptKey(createIdempotencyKey());
    setSelectedZone(tierId);
    setQuantities((prev) => ({ [tierId]: prev[tierId] > 0 ? prev[tierId] : 1 }));
    if (!purchaseKey.current) setAttemptKey(createIdempotencyKey());
  };

  const hasStarted = eventQuery.data?.starts_at ? new Date(eventQuery.data.starts_at).getTime() <= Date.now() : false;
  const purchasingDisabled = purchaseMutation.isPending || !selectedTier || selectedQuantity < 1 || selectedQuantity > (selectedTier?.maxQuantity ?? 0) || eventQuery.data?.status !== 'published' || hasStarted || eventQuery.data?.is_sold_out === true || eventQuery.data?.viewer?.can_book === false;

  const getAiRecommendation = async () => {
    setAiLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Missing API key');

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents:
          "Based on Burna Boy's high-energy Afrobeats performance style at the O2 Arena, should a fan choose the Pit for dancing or Mezzanine for visuals? Give a 1-sentence recommendation.",
      });

      const text = (response as { text?: string }).text;
      setAiSuggestion(text || 'Choose the Pit for the ultimate Afrobeats energy.');
    } catch {
      setAiSuggestion('The Pit is the best choice for this artist!');
    } finally {
      setAiLoading(false);
    }
  };

  if (eventQuery.isLoading) {
    return <PageSkeleton isDark={isDark} variant="tickets" />;
  }

  if (eventQuery.isError || !eventQuery.data || !apiEventId) {
    const loadError = eventQuery.isError ? parseApiError(eventQuery.error).message : 'This event is unavailable.';
    return (
      <View style={[styles.loaderScreen, { backgroundColor: screenBg }]}>
        <MaterialIcons name="confirmation-number" size={42} color={muted} />
        <Text style={[styles.loaderText, { color: subtle }]}>{loadError}</Text>
        <Pressable onPress={() => void eventQuery.refetch()} style={[styles.retryButton, { backgroundColor: accent }]}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.successScreen, { backgroundColor: screenBg }]}>
        <View style={styles.successIconWrap}>
          <View style={{
            // backgroundColor: 'blue',
            height: 250,
            width: 400,
          }}>
            <PaymentSuccess width="100%" height="100%"/>
          </View>
        </View>
        <Text style={[styles.successTitle, { color: titleColor }]}>Purchase Successful!</Text>
        <Text style={[styles.successBody, { color: subtle }]}>
          Your tickets for {eventQuery.data.title} have been added to your Kulsah Wallet.
        </Text>
        {purchaseSummary ? <Text style={[styles.totalTickets, { color: subtle }]}>Reference: {purchaseSummary.reference} · {purchaseSummary.currency} {purchaseSummary.total_amount}</Text> : null}
        {purchasedTickets.map((ticket) => (
          <View key={ticket.id} style={[styles.successTicket, { borderColor: border }]}>
            <View style={{ flex: 1 }}><Text style={[styles.totalTickets, { color: accent }]}>{ticket.ticket_number || ticket.id}</Text><Text style={[styles.ticketStatus, { color: subtle }]}>{ticket.status}</Text></View>
            {ticket.qr_code_url ? <Image source={{ uri: ticket.qr_code_url }} style={styles.successQr} /> : <MaterialIcons name="qr-code" size={42} color={muted} />}
          </View>
        ))}
        <Pressable style={[styles.primaryButton, { backgroundColor: accent }]} onPress={() => navigation.navigate('FanTicket', { ticket: purchasedTickets[0], event: eventQuery.data, purchase: purchaseSummary })}>
          <Text style={styles.primaryButtonText}>View Ticket</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBg }]} edges={[]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS == 'ios' ? 54 : insets.top,
              borderBottomColor: border,
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.closeButton, { backgroundColor: headerButtonBg, borderColor: softBorder }]}
          >
            <MaterialIcons name="chevron-left" size={22} color={titleColor} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Select Tickets</Text>
            <Text style={[styles.headerSubtitle, { color: accent }]} numberOfLines={1}>{eventQuery.data.title} · {eventQuery.data.venue?.name || 'Event'}</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {showLiveSeatingMap ? <>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionEyebrow, { color: subtle }]}>Live Seating Map</Text>
          <View style={[styles.venueBadge, { backgroundColor: `${accent}12`, borderColor: `${accent}24` }]}>
            <View style={[styles.liveDot, { backgroundColor: accent }]} />
            <Text style={[styles.venueBadgeText, { color: accent }]}>O2 Arena</Text>
          </View>
        </View>

        <View style={[styles.mapCard, { borderColor: border, backgroundColor: panelBg }]}>
          <View style={[styles.stage, { backgroundColor: softSurface, borderColor: softBorder }]}>
            <Text style={[styles.stageText, { color: muted }]}>Stage</Text>
          </View>

          <View style={styles.mapZones}>
            <Pressable
              onPress={() => selectTier('pit')}
              style={[
                styles.zoneLarge,
                { backgroundColor: softSurface },
                selectedZone === 'pit' && styles.zonePitActive,
              ]}
            >
              <Text
                style={[
                  styles.zoneText,
                  { color: subtle },
                  selectedZone === 'pit' && { color: accent },
                ]}
              >
                Pit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => selectTier('floor')}
              style={[
                styles.zoneLarge,
                styles.zoneFloor,
                { backgroundColor: softSurface },
                selectedZone === 'floor' && styles.zoneFloorActive,
              ]}
            >
              <Text
                style={[
                  styles.zoneText,
                  { color: subtle },
                  selectedZone === 'floor' && styles.zoneFloorTextActive,
                ]}
              >
                Floor
              </Text>
            </Pressable>

            <View style={styles.mapBottomRow}>
              <Pressable
                onPress={() => selectTier('mezz')}
                style={[
                  styles.zoneSmall,
                  styles.zoneMezz,
                  { backgroundColor: softSurface },
                  selectedZone === 'mezz' && styles.zoneMezzActive,
                ]}
              >
                <Text
                  style={[
                    styles.zoneText,
                    { color: subtle },
                    selectedZone === 'mezz' && styles.zoneMezzTextActive,
                  ]}
                >
                  Level 1
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        </> : null}

        {/* <View style={[styles.aiCard, { borderColor: `${accent}24`, backgroundColor: `${accent}10` }]}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="auto-awesome" size={22} color={accent} />
            <Text style={[styles.aiTitle, { color: accent }]}>Gemini Scout</Text>
          </View>

          {aiSuggestion ? (
            <Text style={[styles.aiSuggestion, { color: titleColor }]}>"{aiSuggestion}"</Text>
          ) : (
            <>
              <Text style={[styles.aiDescription, { color: subtle }]}>
                Let Gemini analyze stage viewing angles and crowd density based on Burna Boy&apos;s performance style.
              </Text>
              <Pressable onPress={getAiRecommendation} disabled={aiLoading} style={[styles.aiButton, { borderColor: `${accent}32` }]}>
                {aiLoading ? (
                  <ActivityIndicator color={accent} />
                ) : (
                  <Text style={[styles.aiButtonText, { color: accent }]}>Get AI Recommendation</Text>
                )}
              </Pressable>
            </>
          )}
        </View> */}

        <Text style={[styles.sectionEyebrow, { color: subtle }]}>Available Tiers</Text>
        {tiers.map((tier) => (
          <Pressable
            key={tier.id}
            onPress={() => selectTier(tier.id)}
            disabled={!tier.available || purchaseMutation.isPending}
            style={[
              styles.tierCard,
              { borderColor: border, backgroundColor: cardBg },
              selectedZone === tier.id && styles.tierCardActive,
              selectedZone === tier.id && { borderColor: `${accent}66`, shadowColor: accent },
              (!tier.available || purchaseMutation.isPending) && { opacity: 0.55 },
            ]}
          >
            <View style={styles.tierTopRow}>
              <View style={styles.tierMain}>
                <View style={styles.tierTitleRow}>
                  <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                  <Text style={[styles.tierName, { color: titleColor }]}>{tier.name}</Text>
                </View>
                <Text style={[styles.tierDescription, { color: subtle }]}>{tier.description}</Text>
              </View>
              <Text style={[styles.tierPrice, { color: accent }]}>{tier.currency} {tier.price}</Text>
            </View>

            <View style={styles.tierBottomRow}>
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={16} color={accent} />
                <Text style={[styles.verifiedText, { color: subtle }]}>{tier.soldQuantity} sold · {tier.availableQuantity} available · {tier.totalQuantity} total</Text>
              </View>

              <View style={[styles.quantityWrap, { backgroundColor: softSurface, borderColor: border }]}>
                <Pressable disabled={purchaseMutation.isPending || !tier.available || (quantities[tier.id] || 1) <= 1} onPress={(event) => { event.stopPropagation(); setSelectedZone(tier.id); updateQuantity(tier.id, -1); }} style={styles.quantityButton}>
                  <MaterialIcons name="remove" size={20} color={muted} />
                </Pressable>
                <Text style={[styles.quantityText, { color: titleColor }]}>{quantities[tier.id] || 0}</Text>
                <Pressable disabled={purchaseMutation.isPending || !tier.available || (quantities[tier.id] || 0) >= tier.maxQuantity} onPress={(event) => { event.stopPropagation(); setSelectedZone(tier.id); updateQuantity(tier.id, 1); }} style={styles.quantityButton}>
                  <MaterialIcons name="add" size={20} color={accent} />
                </Pressable>
              </View>
            </View>
            {selectedZone === tier.id && fieldErrors.quantity?.[0] ? <Text style={styles.fieldError}>{fieldErrors.quantity[0]}</Text> : null}
            {selectedZone === tier.id && (fieldErrors.ticket_type_code?.[0] || fieldErrors.ticket_type_name?.[0]) ? <Text style={styles.fieldError}>{fieldErrors.ticket_type_code?.[0] || fieldErrors.ticket_type_name?.[0]}</Text> : null}
          </Pressable>
        ))}

        <View style={{
          height: 80,
        }}/>
        <Text style={styles.hiddenText}>{eventId}</Text>
      </ScrollView>

      {errorText ? <View style={[styles.purchaseError, { bottom: Math.max(insets.bottom, 20) + 138 }]}><Text style={styles.purchaseErrorText}>{errorText}</Text></View> : null}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: footerBg,
            borderTopColor: border,
            paddingBottom: Math.max(insets.bottom, 20),
          },
          totalTickets > 0 ? styles.footerVisible : styles.footerHidden,
        ]}
      >
        <View style={styles.footerTopRow}>
          <View>
            <Text style={[styles.totalLabel, { color: subtle }]}>Total Payment</Text>
            <Text style={[styles.totalPrice, { color: titleColor }]}>{selectedTier?.currency ?? eventQuery.data?.currency ?? 'GHS'} {totalPrice}</Text>
            {selectedTier ? <Text style={[styles.totalTickets, { color: subtle }]}>Unit: {selectedTier.currency} {selectedTier.price}</Text> : null}
            <Text style={[styles.totalTickets, { color: accent }]}>
              {totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}
            </Text>
          </View>

          <View style={styles.socialProof}>
            {[1, 2, 3].map((i) => (
              <Image
                key={i}
                source={{ uri: `https://picsum.photos/seed/fan${i}/50` }}
                style={[styles.socialAvatar, { borderColor: isDark ? '#0b0f18' : '#ffffff' }]}
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={handlePurchase}
          disabled={purchasingDisabled}
          style={[styles.purchaseButton, { backgroundColor: accent, opacity: purchasingDisabled ? 0.55 : 1 }]}
        >
          {purchaseMutation.isPending ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>Confirm Purchase</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  loaderScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  loaderText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' },
  retryButton: { minWidth: 130, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  retryButtonText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.1 },
  screen: { flex: 1, backgroundColor: '#060913' },
  safeArea: { backgroundColor: '#11131bcc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: {
    ...fontSize.h1, lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headerSpacer: { width: 40, height: 40 },
  content: { padding: 16, paddingBottom: 180, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  venueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  venueBadgeText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  mapCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  stage: {
    alignSelf: 'center',
    width: '70%',
    height: 42,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  mapZones: { gap: 12, marginTop: 8 },
  zoneLarge: {
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: primaryColorAlphaHex('24'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneFloor: { borderColor: '#3b82f624' },
  zoneSmall: {
    flex: 1,
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#22c55e24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBottomRow: { flexDirection: 'row', gap: 12 },
  zonePitActive: { backgroundColor: primaryColorAlphaHex('22'), borderColor: primaryColorAlphaHex('88') },
  zoneFloorActive: { backgroundColor: '#3b82f622', borderColor: '#3b82f688' },
  zoneMezz: { borderColor: '#22c55e24' },
  zoneMezzActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e88' },
  zoneText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  zoneFloorTextActive: { color: '#60a5fa' },
  zoneMezzTextActive: { color: '#4ade80' },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  aiDescription: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  aiSuggestion: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontStyle: 'italic',
  },
  aiButton: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tierCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  tierCardActive: {
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tierTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tierMain: { flex: 1 },
  tierTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  tierDescription: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    marginTop: 6,
  },
  tierPrice: {
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  tierBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  quantityButton: { alignItems: 'center', justifyContent: 'center' },
  quantityText: {
    minWidth: 20,
    textAlign: 'center',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  paymentModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  paymentModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  paymentDrawer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 14,
  },
  drawerHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 4,
  },
  drawerClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentSummary: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentEyebrow: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  paymentTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  paymentMethodText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  paymentFields: {
    gap: 10,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  providerText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  paymentInput: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  cardFieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardSmallInput: {
    flex: 1,
    textAlign: 'center',
  },
  walletSummary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletText: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  walletHint: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  paymentError: {
    color: '#ef4444',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 14,
  },
  purchaseError: { position: 'absolute', left: 20, right: 20, zIndex: 5, borderRadius: 14, padding: 12, backgroundColor: '#7f1d1d' },
  purchaseErrorText: { color: '#fff', textAlign: 'center', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  fieldError: { color: '#ef4444', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  footerVisible: { opacity: 1 },
  footerHidden: { opacity: 0 },
  footerTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  totalPrice: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    marginTop: 4,
  },
  totalTickets: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  socialProof: { flexDirection: 'row', marginLeft: 8 },
  socialAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
  },
  purchaseButton: {
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  purchaseButtonText: {
    color: '#ffffff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: {},
  successIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successBody: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 12,
    marginBottom: 28,
  },
  successTicket: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  successQr: { width: 64, height: 64, borderRadius: 8 },
  ticketStatus: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', marginTop: 4 },
  hiddenText: { height: 0, width: 0, opacity: 0 },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    height: 58,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default SelectTickets;

