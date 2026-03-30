import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  color: string;
}

const TIERS: TicketTier[] = [
  { id: 'pit', name: 'Golden Circle Pit', price: 350, description: 'Directly in front of the stage. High energy.', available: true, color: '#cd2bee' },
  { id: 'floor', name: 'Standing Floor', price: 125, description: 'Main standing area. Great visibility.', available: true, color: '#3b82f6' },
  { id: 'mezz', name: 'Premium Seated', price: 185, description: 'Elevated view with comfortable seating.', available: true, color: '#22c55e' },
  { id: 'rear', name: 'Seated - Tier 2', price: 95, description: 'Affordable views of the whole stage.', available: true, color: '#6b7280' },
];

const SelectTickets: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const eventId = route.params?.id ?? 'burna-boy';

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

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
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
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
      <View style={styles.successScreen}>
        <View style={styles.successIconWrap}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={72} color="#cd2bee" />
          </View>
        </View>
        <Text style={styles.successTitle}>Payment Success!</Text>
        <Text style={styles.successBody}>
          Your tickets for Burna Boy: Love, Damini have been added to your Kulsah Wallet.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>View in Wallet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color="#ffffff" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Select Tickets</Text>
            <Text style={styles.headerSubtitle}>Burna Boy • O2 Arena</Text>
          </View>

          <View style={styles.stepBlock}>
            <Text style={styles.stepLabel}>Step 1 of 3</Text>
            <View style={styles.stepBars}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={styles.stepBar} />
              <View style={styles.stepBar} />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Live Seating Map</Text>
          <View style={styles.venueBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.venueBadgeText}>O2 Arena</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.stage}>
            <Text style={styles.stageText}>Stage</Text>
          </View>

          <View style={styles.mapZones}>
            <Pressable
              onPress={() => setSelectedZone('pit')}
              style={[styles.zoneLarge, selectedZone === 'pit' && styles.zonePitActive]}
            >
              <Text style={[styles.zoneText, selectedZone === 'pit' && styles.zonePitTextActive]}>Pit</Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedZone('floor')}
              style={[styles.zoneLarge, styles.zoneFloor, selectedZone === 'floor' && styles.zoneFloorActive]}
            >
              <Text style={[styles.zoneText, selectedZone === 'floor' && styles.zoneFloorTextActive]}>Floor</Text>
            </Pressable>

            <View style={styles.mapBottomRow}>
              <Pressable
                onPress={() => setSelectedZone('mezz')}
                style={[styles.zoneSmall, styles.zoneMezz, selectedZone === 'mezz' && styles.zoneMezzActive]}
              >
                <Text style={[styles.zoneText, selectedZone === 'mezz' && styles.zoneMezzTextActive]}>Level 1</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="auto-awesome" size={22} color="#cd2bee" />
            <Text style={styles.aiTitle}>Gemini Scout</Text>
          </View>

          {aiSuggestion ? (
            <Text style={styles.aiSuggestion}>"{aiSuggestion}"</Text>
          ) : (
            <>
              <Text style={styles.aiDescription}>
                Let Gemini analyze stage viewing angles and crowd density based on Burna Boy&apos;s performance style.
              </Text>
              <Pressable onPress={getAiRecommendation} disabled={aiLoading} style={styles.aiButton}>
                {aiLoading ? (
                  <ActivityIndicator color="#cd2bee" />
                ) : (
                  <Text style={styles.aiButtonText}>Get AI Recommendation</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.sectionEyebrow}>Available Tiers</Text>
        {TIERS.map((tier) => (
          <View
            key={tier.id}
            style={[
              styles.tierCard,
              selectedZone === tier.id && styles.tierCardActive,
            ]}
          >
            <View style={styles.tierTopRow}>
              <View style={styles.tierMain}>
                <View style={styles.tierTitleRow}>
                  <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                  <Text style={styles.tierName}>{tier.name}</Text>
                </View>
                <Text style={styles.tierDescription}>{tier.description}</Text>
              </View>
              <Text style={styles.tierPrice}>${tier.price.toFixed(2)}</Text>
            </View>

            <View style={styles.tierBottomRow}>
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={16} color="#cd2bee" />
                <Text style={styles.verifiedText}>Kulsah Verified</Text>
              </View>

              <View style={styles.quantityWrap}>
                <Pressable onPress={() => updateQuantity(tier.id, -1)} style={styles.quantityButton}>
                  <MaterialIcons name="remove" size={20} color="#9ca3af" />
                </Pressable>
                <Text style={styles.quantityText}>{quantities[tier.id] || 0}</Text>
                <Pressable onPress={() => updateQuantity(tier.id, 1)} style={styles.quantityButton}>
                  <MaterialIcons name="add" size={20} color="#cd2bee" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.hiddenText}>{eventId}</Text>
      </ScrollView>

      <View style={[styles.footer, totalTickets > 0 ? styles.footerVisible : styles.footerHidden]}>
        <View style={styles.footerTopRow}>
          <View>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            <Text style={styles.totalTickets}>
              {totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}
            </Text>
          </View>

          <View style={styles.socialProof}>
            {[1, 2, 3].map((i) => (
              <Image
                key={i}
                source={{ uri: `https://picsum.photos/seed/fan${i}/50` }}
                style={styles.socialAvatar}
              />
            ))}
          </View>
        </View>

        <Pressable onPress={handlePurchase} disabled={isProcessing} style={styles.purchaseButton}>
          {isProcessing ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>Confirm & Purchase</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>
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
    borderBottomColor: '#ffffff10',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff12',
  },
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: {
    color: '#ffffff',
    fontSize: fontScale(16),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#8f95af',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginTop: 2,
  },
  stepBlock: { alignItems: 'flex-end', marginLeft: 8 },
  stepLabel: {
    color: '#cd2bee',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  stepBars: { flexDirection: 'row', gap: 4, marginTop: 6 },
  stepBar: { width: 24, height: 4, borderRadius: 999, backgroundColor: '#ffffff14' },
  stepBarActive: { backgroundColor: '#cd2bee' },
  content: { padding: 16, paddingBottom: 180, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: {
    color: '#8f95af',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  venueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#cd2bee18',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cd2bee24',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cd2bee' },
  venueBadgeText: {
    color: '#cd2bee',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  mapCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#ffffff10',
    backgroundColor: '#101521',
    padding: 18,
    gap: 14,
  },
  stage: {
    alignSelf: 'center',
    width: '70%',
    height: 42,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    color: '#8f95af',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  mapZones: { gap: 12, marginTop: 8 },
  zoneLarge: {
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#cd2bee24',
    backgroundColor: '#ffffff08',
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
    backgroundColor: '#ffffff08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBottomRow: { flexDirection: 'row', gap: 12 },
  zonePitActive: { backgroundColor: '#cd2bee22', borderColor: '#cd2bee88' },
  zoneFloorActive: { backgroundColor: '#3b82f622', borderColor: '#3b82f688' },
  zoneMezz: { borderColor: '#22c55e24' },
  zoneMezzActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e88' },
  zoneText: {
    color: '#6b7280',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  zonePitTextActive: { color: '#cd2bee' },
  zoneFloorTextActive: { color: '#60a5fa' },
  zoneMezzTextActive: { color: '#4ade80' },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cd2bee24',
    backgroundColor: '#cd2bee12',
    padding: 16,
    gap: 12,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: {
    color: '#cd2bee',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  aiDescription: {
    color: '#a5abc0',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 18,
  },
  aiSuggestion: {
    color: '#f5f7ff',
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  aiButton: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cd2bee40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#cd2bee',
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tierCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ffffff10',
    backgroundColor: '#121827',
    padding: 16,
    gap: 16,
  },
  tierCardActive: {
    borderColor: '#cd2bee66',
    shadowColor: '#cd2bee',
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
    color: '#ffffff',
    fontSize: fontScale(15),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  tierDescription: {
    color: '#8f95af',
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 16,
    marginTop: 6,
  },
  tierPrice: {
    color: '#cd2bee',
    fontSize: fontScale(20),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  tierBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: {
    color: '#8f95af',
    fontSize: fontScale(7),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff10',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  quantityButton: { alignItems: 'center', justifyContent: 'center' },
  quantityText: {
    color: '#ffffff',
    minWidth: 20,
    textAlign: 'center',
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    backgroundColor: '#0b0f18f2',
    gap: 14,
  },
  footerVisible: { opacity: 1 },
  footerHidden: { opacity: 0 },
  footerTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalLabel: {
    color: '#8f95af',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  totalPrice: {
    color: '#ffffff',
    fontSize: fontScale(28),
    fontFamily: 'PlusJakartaSansExtraBold',
    marginTop: 4,
  },
  totalTickets: {
    color: '#cd2bee',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
  },
  socialProof: { flexDirection: 'row', marginLeft: 8 },
  socialAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#0b0f18',
  },
  purchaseButton: {
    height: 58,
    borderRadius: 24,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  successScreen: {
    flex: 1,
    backgroundColor: '#060913',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: { marginBottom: 28 },
  successIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#cd2bee20',
    borderWidth: 1,
    borderColor: '#cd2bee55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#ffffff',
    fontSize: fontScale(28),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successBody: {
    color: '#a5abc0',
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansMedium',
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
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default SelectTickets;
