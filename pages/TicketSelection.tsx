import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
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
  { id: 'pit', name: 'Golden Circle Pit', price: 350, description: 'Directly in front of stage. High energy.', available: true, color: '#cd2bee' },
  { id: 'floor', name: 'Standing Floor', price: 125, description: 'Main standing area. Great visibility.', available: true, color: '#3b82f6' },
  { id: 'mezz', name: 'Premium Seated', price: 185, description: 'Elevated view with comfortable seating.', available: true, color: '#22c55e' },
  { id: 'rear', name: 'Seated - Tier 2', price: 95, description: 'Affordable views of the whole stage.', available: true, color: '#6b7280' },
];

const TicketSelection: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const eventId = route.params?.id;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const updateQuantity = (tierId: string, delta: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: Math.max(0, (prev[tierId] || 0) + delta) }));
  };

  const totalPrice = useMemo(
    () => TIERS.reduce((acc, tier) => acc + tier.price * (quantities[tier.id] || 0), 0),
    [quantities],
  );
  const totalTickets = useMemo(
    () => Object.values(quantities).reduce((acc, q) => acc + q, 0),
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
      setAiSuggestion(text || 'Choose the Pit for the most immersive Afrobeats energy.');
    } catch {
      setAiSuggestion('Choose the Pit for the highest-energy experience.');
    } finally {
      setAiLoading(false);
    }
  };
  if (showSuccess) {
    return (
      <View style={s.successScreen}>
        <View style={s.successIcon}>
          <MaterialIcons name="check-circle" size={72} color="#cd2bee" />
        </View>
        <Text style={s.successTitle}>Payment Success!</Text>
        <Text style={s.successBody}>Your tickets were added to your Kulsah Wallet.</Text>
        <Pressable style={s.primaryButton} onPress={() => navigation.navigate('Wallet')}>
          <Text style={s.primaryButtonText}>View in Wallet</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.headerBtn}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </Pressable>
          <View>
            <Text style={s.headerTitle}>Select Tickets</Text>
            <Text style={s.headerSub}>Burna Boy • O2 Arena</Text>
          </View>
          <Text style={s.stepLabel}>Step 1 of 3</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.mapCard}>
          <Text style={s.sectionTitle}>Live Seating Map</Text>
          <View style={s.stage}><Text style={s.stageText}>STAGE</Text></View>
          <Pressable style={[s.zone, selectedZone === 'pit' && s.zonePit]} onPress={() => setSelectedZone('pit')}><Text style={s.zoneText}>PIT</Text></Pressable>
          <Pressable style={[s.zone, selectedZone === 'floor' && s.zoneFloor]} onPress={() => setSelectedZone('floor')}><Text style={s.zoneText}>FLOOR</Text></Pressable>
          <Pressable style={[s.zone, selectedZone === 'mezz' && s.zoneMezz]} onPress={() => setSelectedZone('mezz')}><Text style={s.zoneText}>LEVEL 1</Text></Pressable>
        </View>

        <View style={s.aiCard}>
          <Text style={s.aiTitle}>Gemini Scout</Text>
          <Text style={s.aiBody}>{aiSuggestion || 'Let Gemini analyze crowd energy and viewing angles for this show.'}</Text>
          {!aiSuggestion && (
            <Pressable style={s.aiButton} onPress={getAiRecommendation} disabled={aiLoading}>
              {aiLoading ? <ActivityIndicator color="#cd2bee" /> : <Text style={s.aiButtonText}>Get AI Recommendation</Text>}
            </Pressable>
          )}
        </View>

        <Text style={s.sectionTitle}>Available Tiers</Text>
        {TIERS.map((tier) => (
          <View key={tier.id} style={[s.tierCard, selectedZone === tier.id && s.tierCardActive]}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={s.tierName}>{tier.name}</Text>
                <Text style={s.tierDesc}>{tier.description}</Text>
              </View>
              <Text style={[s.price, { color: tier.color }]}>${tier.price.toFixed(2)}</Text>
            </View>
            <View style={s.rowBetween}>
              <Text style={s.badge}>Kulsah Verified</Text>
              <View style={s.qtyWrap}>
                <Pressable onPress={() => updateQuantity(tier.id, -1)}><MaterialIcons name="remove" size={20} color="#9ca3af" /></Pressable>
                <Text style={s.qtyText}>{quantities[tier.id] || 0}</Text>
                <Pressable onPress={() => updateQuantity(tier.id, 1)}><MaterialIcons name="add" size={20} color="#cd2bee" /></Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {totalTickets > 0 && (
        <View style={s.footer}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.totalLabel}>Total Payment</Text>
              <Text style={s.totalPrice}>${totalPrice.toFixed(2)}</Text>
              <Text style={s.totalTickets}>{totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}</Text>
            </View>
            <View style={s.fans}>
              {[1, 2, 3].map((i) => (
                <Image key={i} source={{ uri: 'https://picsum.photos/seed/fan' + i + '/50' }} style={s.fan} />
              ))}
            </View>
          </View>
          <Pressable style={s.primaryButton} onPress={handlePurchase} disabled={isProcessing}>
            {isProcessing && <ActivityIndicator color="#fff" />}
            {!isProcessing && <Text style={s.primaryButtonText}>Confirm & Purchase</Text>}
          </Pressable>
        </View>
      )}
      <Text style={s.hiddenText}>{eventId ? 'Event: ' + eventId : ''}</Text>
    </View>
  );
};
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060913' },
  safe: { backgroundColor: '#1f1022d4' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff14' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff10' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '900', textTransform: 'uppercase' },
  headerSub: { color: '#8f95af', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  stepLabel: { marginLeft: 'auto', color: '#cd2bee', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  content: { padding: 16, paddingBottom: 180, gap: 12 },
  sectionTitle: { color: '#8f95af', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },
  mapCard: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff14', backgroundColor: '#1f1022bf', padding: 12, gap: 8 },
  stage: { height: 38, borderRadius: 12, backgroundColor: '#ffffff14', alignItems: 'center', justifyContent: 'center' },
  stageText: { color: '#8f95af', fontWeight: '900', letterSpacing: 3, fontSize: 10 },
  zone: { height: 44, borderRadius: 14, borderWidth: 1, borderColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff08' },
  zonePit: { borderColor: '#cd2bee77', backgroundColor: '#cd2bee2b' },
  zoneFloor: { borderColor: '#3b82f677', backgroundColor: '#3b82f62b' },
  zoneMezz: { borderColor: '#22c55e77', backgroundColor: '#22c55e2b' },
  zoneText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  aiCard: { borderRadius: 20, borderWidth: 1, borderColor: '#cd2bee30', backgroundColor: '#cd2bee14', padding: 12, gap: 8 },
  aiTitle: { color: '#cd2bee', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8 },
  aiBody: { color: '#d9dce9', fontSize: 13, fontStyle: 'italic' },
  aiButton: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#cd2bee4a', alignItems: 'center', justifyContent: 'center' },
  aiButtonText: { color: '#cd2bee', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tierCard: { borderRadius: 20, borderWidth: 1, borderColor: '#ffffff14', backgroundColor: '#1f1022bf', padding: 12, gap: 10 },
  tierCardActive: { borderColor: '#cd2bee66' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tierName: { color: '#fff', fontWeight: '900', fontSize: 15 },
  tierDesc: { color: '#8f95af', fontSize: 11, marginTop: 2 },
  price: { fontSize: 20, fontWeight: '900' },
  badge: { color: '#8f95af', fontSize: 9, textTransform: 'uppercase', fontWeight: '900' },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff10', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  qtyText: { color: '#fff', fontWeight: '900', minWidth: 18, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: '#ffffff14', backgroundColor: '#11131bcc', padding: 16, gap: 10 },
  totalLabel: { color: '#8f95af', fontSize: 10, textTransform: 'uppercase', fontWeight: '900' },
  totalPrice: { color: '#fff', fontSize: 30, fontWeight: '900' },
  totalTickets: { color: '#cd2bee', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  fans: { flexDirection: 'row', marginLeft: 6 },
  fan: { width: 28, height: 28, borderRadius: 14, marginLeft: -8, borderWidth: 1, borderColor: '#11131b' },
  primaryButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cd2bee' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  successScreen: { flex: 1, backgroundColor: '#060913', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#cd2bee1f', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cd2bee55' },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
  successBody: { color: '#a5abc0', textAlign: 'center', fontSize: 14, maxWidth: 280 },
  hiddenText: { height: 0, width: 0, opacity: 0 },
});

export default TicketSelection;

