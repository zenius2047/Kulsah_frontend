import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, primaryColorAlphaHex } from "../theme";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mediumScreen } from '../types';
import PaymentSuccess from '../assets/icons/payment-success.svg'
import { fontSize } from './typography';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  color: string;
}

type PaymentMethod = 'momo' | 'card' | 'kulcoins';
type MomoProvider = 'mtn' | 'telecel' | 'airteltigo';

const TIERS: TicketTier[] = [
  { id: 'pit', name: 'Golden Circle Pit', price: 350, description: 'Directly in front of the stage. High energy.', available: true, color: PRIMARY_COLOR },
  { id: 'floor', name: 'Standing Floor', price: 125, description: 'Main standing area. Great visibility.', available: true, color: '#3b82f6' },
  { id: 'mezz', name: 'Premium Seated', price: 185, description: 'Elevated view with comfortable seating.', available: true, color: '#22c55e' },
  { id: 'rear', name: 'Seated - Tier 2', price: 95, description: 'Affordable views of the whole stage.', available: true, color: '#6b7280' },
];

const SelectTickets: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.id ?? 'burna-boy';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [errorText, setErrorText] = useState('');
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

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

  const updateQuantity = (tierId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [tierId]: Math.max(0, (prev[tierId] || 0) + delta),
    }));
  };

  const totalPrice = useMemo(
    () => TIERS.reduce((acc, tier) => acc + tier.price * (quantities[tier.id] || 0), 0),
    [quantities],
  );
  const totalTickets = useMemo(
    () => Object.values(quantities).reduce((acc, quantity) => acc + quantity, 0),
    [quantities],
  );

  const handlePurchase = () => {
    setErrorText('');

    if (totalTickets <= 0) {
      setErrorText('Select at least one ticket.');
      return;
    }

    if (paymentMethod === 'momo' && phoneNumber.trim().length < 9) {
      setErrorText('Enter a valid mobile money number.');
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setErrorText('Enter all card details.');
      return;
    }

    if (paymentMethod === 'kulcoins' && walletBalance < totalPrice) {
      setErrorText('Insufficient Kulcoins for this ticket purchase.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDrawerOpen(false);
      setShowSuccess(true);
    }, 2000);
  };

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
        <Text style={[styles.successTitle, { color: titleColor }]}>Payment Success!</Text>
        <Text style={[styles.successBody, { color: subtle }]}>
          Your tickets for Burna Boy: Love, Damini have been added to your Kulsah Wallet.
        </Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: accent }]} onPress={() => navigation.navigate('FanTicket')}>
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
            <MaterialIcons name="close" size={22} color={titleColor} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: titleColor }]}>Select Tickets</Text>
            <Text style={[styles.headerSubtitle, { color: subtle }]}>Burna Boy � O2 Arena</Text>
          </View>

          <View style={styles.stepBlock}>
            <Text style={[styles.stepLabel, { color: accent }]}>Step 1 of 3</Text>
            <View style={styles.stepBars}>
              <View style={[styles.stepBar, { backgroundColor: accent }]} />
              <View style={[styles.stepBar, { backgroundColor: softSurface }]} />
              <View style={[styles.stepBar, { backgroundColor: softSurface }]} />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
              onPress={() => setSelectedZone('pit')}
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
              onPress={() => setSelectedZone('floor')}
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
                onPress={() => setSelectedZone('mezz')}
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
        {TIERS.map((tier) => (
          <View
            key={tier.id}
            style={[
              styles.tierCard,
              { borderColor: border, backgroundColor: cardBg },
              selectedZone === tier.id && styles.tierCardActive,
              selectedZone === tier.id && { borderColor: `${accent}66`, shadowColor: accent },
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
              <Text style={[styles.tierPrice, { color: accent }]}>${tier.price.toFixed(2)}</Text>
            </View>

            <View style={styles.tierBottomRow}>
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={16} color={accent} />
                <Text style={[styles.verifiedText, { color: subtle }]}>Kulsah Verified</Text>
              </View>

              <View style={[styles.quantityWrap, { backgroundColor: softSurface, borderColor: border }]}>
                <Pressable onPress={() => updateQuantity(tier.id, -1)} style={styles.quantityButton}>
                  <MaterialIcons name="remove" size={20} color={muted} />
                </Pressable>
                <Text style={[styles.quantityText, { color: titleColor }]}>{quantities[tier.id] || 0}</Text>
                <Pressable onPress={() => updateQuantity(tier.id, 1)} style={styles.quantityButton}>
                  <MaterialIcons name="add" size={20} color={accent} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <View style={{
          height: 80,
        }}/>
        <Text style={styles.hiddenText}>{eventId}</Text>
      </ScrollView>

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
            <Text style={[styles.totalPrice, { color: titleColor }]}>${totalPrice.toFixed(2)}</Text>
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
          onPress={() => {
            setErrorText('');
            setPaymentDrawerOpen(true);
          }}
          disabled={isProcessing}
          style={[styles.purchaseButton, { backgroundColor: accent }]}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>Continue to Payment</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>

      <Modal visible={paymentDrawerOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPaymentDrawerOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.paymentModalRoot}>
          <Pressable style={styles.paymentModalBackdrop} onPress={() => setPaymentDrawerOpen(false)} />
          <View style={[styles.paymentDrawer, { backgroundColor: cardBg, borderColor: border, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[styles.drawerHandle, { backgroundColor: border }]} />
            <View style={styles.paymentHeader}>
              <View>
                <Text style={[styles.paymentEyebrow, { color: subtle }]}>Payment Gateway</Text>
                <Text style={[styles.paymentTitle, { color: titleColor }]}>Choose how to pay</Text>
              </View>
              <Pressable onPress={() => setPaymentDrawerOpen(false)} style={[styles.drawerClose, { backgroundColor: softSurface, borderColor: border }]}>
                <MaterialIcons name="close" size={20} color={titleColor} />
              </Pressable>
            </View>

            <View style={[styles.paymentSummary, { backgroundColor: softSurface, borderColor: border }]}>
              <Text style={[styles.totalLabel, { color: subtle }]}>Total Payment</Text>
              <Text style={[styles.totalPrice, { color: titleColor }]}>${totalPrice.toFixed(2)}</Text>
              <Text style={[styles.totalTickets, { color: accent }]}>{totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}</Text>
            </View>

            <View style={styles.paymentMethodRow}>
              {([
                { key: 'momo', label: 'Mobile Money', icon: 'phone-iphone' },
                { key: 'card', label: 'Card', icon: 'credit-card' },
                { key: 'kulcoins', label: 'Kulcoins', icon: 'toll' },
              ] as const).map((method) => {
                const selected = paymentMethod === method.key;
                return (
                  <Pressable
                    key={method.key}
                    onPress={() => {
                      setPaymentMethod(method.key);
                      setErrorText('');
                    }}
                    style={[styles.paymentMethod, { backgroundColor: selected ? primaryColorAlpha(0.12) : softSurface, borderColor: selected ? accent : border }]}
                  >
                    <MaterialIcons name={method.icon as any} size={19} color={selected ? accent : muted} />
                    <Text style={[styles.paymentMethodText, { color: selected ? accent : subtle }]}>{method.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {paymentMethod === 'momo' ? (
              <View style={styles.paymentFields}>
                <View style={styles.providerRow}>
                  {([
                    { key: 'mtn', label: 'MTN MoMo', color: '#fbbf24' },
                    { key: 'telecel', label: 'Telecel', color: '#ef4444' },
                    { key: 'airteltigo', label: 'AT Money', color: '#2563eb' },
                  ] as const).map((provider) => {
                    const selected = momoProvider === provider.key;
                    return (
                      <Pressable
                        key={provider.key}
                        onPress={() => setMomoProvider(provider.key)}
                        style={[styles.providerChip, { backgroundColor: selected ? provider.color : softSurface, borderColor: selected ? provider.color : border }]}
                      >
                        <Text style={[styles.providerText, { color: selected ? '#ffffff' : subtle }]}>{provider.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="024 000 0000"
                  placeholderTextColor={muted}
                  style={[styles.paymentInput, { backgroundColor: inputBg, borderColor: border, color: titleColor }]}
                />
              </View>
            ) : null}

            {paymentMethod === 'card' ? (
              <View style={styles.paymentFields}>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  maxLength={19}
                  placeholder="4111 2222 3333 4444"
                  placeholderTextColor={muted}
                  style={[styles.paymentInput, { backgroundColor: inputBg, borderColor: border, color: titleColor }]}
                />
                <View style={styles.cardFieldRow}>
                  <TextInput value={cardExpiry} onChangeText={setCardExpiry} maxLength={5} placeholder="MM/YY" placeholderTextColor={muted} style={[styles.paymentInput, styles.cardSmallInput, { backgroundColor: inputBg, borderColor: border, color: titleColor }]} />
                  <TextInput value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" maxLength={3} secureTextEntry placeholder="CVV" placeholderTextColor={muted} style={[styles.paymentInput, styles.cardSmallInput, { backgroundColor: inputBg, borderColor: border, color: titleColor }]} />
                </View>
              </View>
            ) : null}

            {paymentMethod === 'kulcoins' ? (
              <View style={[styles.walletSummary, { backgroundColor: softSurface, borderColor: border }]}>
                <View style={styles.walletRow}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={accent} />
                  <Text style={[styles.walletText, { color: titleColor }]}>Balance: {walletBalance.toLocaleString()} KC</Text>
                </View>
                <Text style={[styles.walletHint, { color: walletBalance >= totalPrice ? subtle : '#ef4444' }]}>
                  {walletBalance >= totalPrice ? 'Ticket total can be deducted from your Kulcoin balance.' : 'Top up Kulcoins before completing this purchase.'}
                </Text>
              </View>
            ) : null}

            {errorText ? <Text style={styles.paymentError}>{errorText}</Text> : null}

            <Pressable onPress={handlePurchase} disabled={isProcessing} style={[styles.purchaseButton, { backgroundColor: accent }]}>
              {isProcessing ? (
                <>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.purchaseButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.purchaseButtonText}>Confirm & Purchase</Text>
                  <MaterialIcons name="lock" size={18} color="#ffffff" />
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: {
    ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginTop: 2,
  },
  stepBlock: { alignItems: 'flex-end', marginLeft: 8 },
  stepLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  stepBars: { flexDirection: 'row', gap: 4, marginTop: 6 },
  stepBar: { width: 24, height: 4, borderRadius: 999 },
  content: { padding: 16, paddingBottom: 180, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  aiDescription: {
    ...fontSize.b5,
    lineHeight: 18,
  },
  aiSuggestion: {
    ...fontSize.b4,
    lineHeight: 20,
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
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
  },
  tierDescription: {
    ...fontSize.b5,
    lineHeight: 16,
    marginTop: 6,
  },
  tierPrice: {
    ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2,
  },
  tierBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
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
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  paymentTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
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
    lineHeight: fontSize.b5.fontSize + 1,
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
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  paymentInput: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
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
    lineHeight: fontSize.b4.fontSize + 1,
  },
  walletHint: {
    ...fontSize.b5,
    lineHeight: 17,
  },
  paymentError: {
    color: '#ef4444',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
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
  footerVisible: { opacity: 1 },
  footerHidden: { opacity: 0 },
  footerTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  totalPrice: {
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    marginTop: 4,
  },
  totalTickets: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
    lineHeight: 14,
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
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successBody: {
    ...fontSize.b4,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 12,
    marginBottom: 28,
  },
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
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default SelectTickets;

