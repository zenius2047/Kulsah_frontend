import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenAI } from '@google/genai';
import { useThemeMode } from '../theme';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

type SubscriptionTier = {
  name: string;
  price: string;
  perks: string[];
  currentMembers: number;
  color: string;
};

const INITIAL_SUBSCRIPTION: SubscriptionTier = {
  name: 'Pulsar Access',
  price: '9.99',
  perks: ['Exclusive feed access', 'Direct messaging', 'Badge of honor'],
  currentMembers: 1248,
  color: '#cd2bee',
};

const MembershipTiers: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [subscription, setSubscription] = useState<SubscriptionTier>(INITIAL_SUBSCRIPTION);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionTier | null>(null);
  const [newPerkText, setNewPerkText] = useState('');

  const totalMonthlyRevenue = useMemo(() => {
    const price = Number.parseFloat(subscription.price) || 0;
    return price * subscription.currentMembers;
  }, [subscription]);

  const totalYearlyRevenue = useMemo(() => {
    const annualMembers = Math.round(subscription.currentMembers * 0.3);
    const monthlyMembers = subscription.currentMembers - annualMembers;
    const monthlyPrice = Number.parseFloat(subscription.price) || 0;
    const annualPrice = monthlyPrice * 12 * 0.85;
    return monthlyMembers * monthlyPrice * 12 + annualMembers * annualPrice;
  }, [subscription]);

  const openEditor = () => {
    setEditingSub({ ...subscription, perks: [...subscription.perks] });
    setNewPerkText('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingSub(null);
    setNewPerkText('');
  };

  const saveSubscription = () => {
    if (!editingSub) return;
    setSubscription(editingSub);
    closeEditor();
  };

  const addPerk = () => {
    if (!editingSub || !newPerkText.trim()) return;
    setEditingSub({ ...editingSub, perks: [...editingSub.perks, newPerkText.trim()] });
    setNewPerkText('');
  };

  const getAiPricingAdvice = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a creator economy expert. An artist has a subscription priced at $${subscription.price}. Suggest a 1-sentence perk addition to justify this price or increase conversion.`,
      });
      Alert.alert('AI Suggestion', response.text || 'Add personalized video shout-outs to your premium offering.');
    } catch {
      Alert.alert('AI Suggestion', 'Include early access to all future concert ticket pre-sales.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGlobalSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Published', 'Your membership tier updates are now live.');
    }, 1500);
  };

  const revenueLabel = `$${totalMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const yearlyLabel = `$${totalYearlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const monthlyLtv = `$${((Number.parseFloat(subscription.price) || 0) * subscription.currentMembers).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]} edges={[]}>
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(31, 16, 34, 0.78)' : theme.card, borderBottomColor: theme.border }]}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={[s.iconButton, { backgroundColor: isDark ? '#ffffff14' : theme.surface }]}>
            <MaterialIcons name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: theme.text }]}>Galaxy Economy</Text>
        </View>
        <Pressable
          onPress={getAiPricingAdvice}
          disabled={isAiLoading}
          style={[s.aiButton, { backgroundColor: isDark ? '#cd2bee24' : theme.accentSoft, borderColor: isDark ? '#cd2bee4a' : '#cd2bee2b' }]}
        >
          {isAiLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <MaterialIcons name="auto-awesome" size={20} color={theme.accent} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[s.heroCard, { backgroundColor: isDark ? '#101625' : theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={s.heroGlow} />
          <View style={s.heroMetrics}>
            <View>
              <Text style={[s.metricLabel, { color: theme.textMuted }]}>Projected MRR</Text>
              <Text style={[s.metricValue, { color: '#22c55e' }]}>{revenueLabel}</Text>
            </View>
            <View style={s.metricRight}>
              <Text style={[s.metricLabel, { color: theme.textMuted }]}>Projected ARR</Text>
              <Text style={[s.metricValue, { color: theme.accent }]}>{yearlyLabel}</Text>
            </View>
          </View>
          <View style={[s.progressTrack, { backgroundColor: isDark ? '#ffffff10' : '#e2e8f0' }]}>
            <View style={s.progressFill} />
          </View>
          <View style={s.metaRow}>
            <Text style={[s.microText, { color: theme.textMuted }]}>Based on {subscription.currentMembers} active members</Text>
            <Text style={[s.microText, { color: theme.accent }]}>Includes 15% annual discount</Text>
          </View>
        </View>

        <View style={s.sectionBlock}>
          <Text style={[s.sectionTitle, { color: theme.textMuted }]}>Subscription Management</Text>
          <View style={[s.tierCard, { backgroundColor: isDark ? 'rgba(31, 16, 34, 0.75)' : theme.card, borderColor: subscription.color }]}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[s.tierName, { color: theme.text }]}>{subscription.name}</Text>
                <Text style={[s.tierCaption, { color: theme.textMuted }]}>Active offering</Text>
              </View>
              <View style={[s.pricePill, { backgroundColor: isDark ? '#00000040' : theme.surface, borderColor: theme.border }]}>
                <Text style={[s.priceDollar, { color: theme.accent }]}>$</Text>
                <TextInput
                  value={subscription.price}
                  onChangeText={(value) => setSubscription((prev) => ({ ...prev, price: value }))}
                  keyboardType="decimal-pad"
                  style={[s.priceInput, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={s.perksSection}>
              <Text style={[s.perksLabel, { color: theme.textMuted }]}>Active Perks</Text>
              <View style={s.perksWrap}>
                {subscription.perks.map((perk, index) => (
                  <View key={`${perk}-${index}`} style={[s.perkChip, { backgroundColor: isDark ? '#ffffff0d' : theme.surface, borderColor: theme.border }]}>
                    <Text style={[s.perkText, { color: theme.textSecondary }]}>{perk}</Text>
                  </View>
                ))}
                <Pressable onPress={openEditor} style={[s.editChip, { borderColor: theme.border }]}>
                  <MaterialIcons name="edit" size={16} color={theme.accent} />
                </Pressable>
              </View>
            </View>

            <View style={[s.footerStats, { borderTopColor: theme.border }]}>
              <View style={s.statsRow}>
                <View>
                  <Text style={[s.statValue, { color: theme.text }]}>{subscription.currentMembers}</Text>
                  <Text style={[s.statLabel, { color: theme.textMuted }]}>Members</Text>
                </View>
                <View style={[s.divider, { backgroundColor: theme.border }]} />
                <View>
                  <Text style={[s.statValue, { color: '#22c55e' }]}>{monthlyLtv}</Text>
                  <Text style={[s.statLabel, { color: theme.textMuted }]}>LTV Monthly</Text>
                </View>
              </View>
              <Pressable onPress={openEditor} style={[s.settingsButton, { backgroundColor: isDark ? '#ffffff12' : theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="settings-suggest" size={20} color={theme.accent} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { backgroundColor: isDark ? 'rgba(10, 5, 13, 0.95)' : 'rgba(255,255,255,0.95)', borderTopColor: theme.border }]}>
        <Pressable onPress={handleGlobalSave} disabled={isSaving} style={[s.publishButton, isSaving && s.publishButtonDisabled]}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={s.publishText}>Publish</Text>
              <MaterialIcons name="rocket-launch" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>

      <Modal visible={isEditorOpen} transparent animationType="slide" onRequestClose={closeEditor}>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={closeEditor} />
          {editingSub ? (
            <View style={[s.modalCard, { backgroundColor: isDark ? theme.background : theme.card, borderTopColor: theme.border }]}>
              <View style={[s.grabber, { backgroundColor: isDark ? '#ffffff20' : '#cbd5e1' }]} />

              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: theme.text }]}>Refine Subscription</Text>
                <Pressable onPress={closeEditor} style={[s.modalClose, { backgroundColor: isDark ? '#ffffff12' : theme.surface, borderColor: theme.border }]}>
                  <MaterialIcons name="close" size={18} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalContent}>
                <View style={s.fieldBlock}>
                  <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Identity Label</Text>
                  <TextInput
                    value={editingSub.name}
                    onChangeText={(value) => setEditingSub({ ...editingSub, name: value })}
                    style={[s.textField, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
                    placeholder="Subscription name"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={s.fieldBlock}>
                  <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Pricing Strategy (USD)</Text>
                  <View style={[s.priceEditorWrap, { backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}>
                    <Text style={[s.editorDollar, { color: theme.accent }]}>$</Text>
                    <TextInput
                      value={editingSub.price}
                      onChangeText={(value) => setEditingSub({ ...editingSub, price: value })}
                      keyboardType="decimal-pad"
                      style={[s.priceEditorInput, { color: theme.text }]}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                <View style={s.fieldBlock}>
                  <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Perk Pipeline</Text>
                  <View style={s.listWrap}>
                    {editingSub.perks.map((perk, index) => (
                      <View key={`${perk}-${index}`} style={[s.listItem, { backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}>
                        <Text style={[s.listItemText, { color: theme.text }]}>{perk}</Text>
                        <Pressable onPress={() => setEditingSub({ ...editingSub, perks: editingSub.perks.filter((_, i) => i !== index) })}>
                          <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  <View style={s.addRow}>
                    <TextInput
                      value={newPerkText}
                      onChangeText={setNewPerkText}
                      onSubmitEditing={addPerk}
                      returnKeyType="done"
                      placeholder="New value-add..."
                      placeholderTextColor={theme.textMuted}
                      style={[s.addInput, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
                    />
                    <Pressable onPress={addPerk} style={s.addButton}>
                      <MaterialIcons name="add" size={22} color="#fff" />
                    </Pressable>
                  </View>
                </View>

                <Pressable onPress={saveSubscription} style={s.syncButton}>
                  <Text style={s.syncButtonText}>Synchronize Subscription</Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: mediumScreen ? fontScale(14) : fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  aiButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: { padding: 16, paddingBottom: 150, gap: 18 },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metricRight: { alignItems: 'flex-end' },
  metricLabel: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 4,
    fontSize: mediumScreen ? fontScale(18) : fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  progressTrack: {
    marginTop: 18,
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    width: '65%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4ade80',
  },
  metaRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  microText: {
    flex: 1,
    fontSize: mediumScreen ? fontScale(11):fontScale(7),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionBlock: { gap: 10 },
  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  tierCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  tierName: {
    fontSize: mediumScreen ? fontScale(20) : fontScale(16),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  tierCaption: {
    marginTop: 4,
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  pricePill: {
    minWidth: 100,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  priceDollar: {
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  priceInput: {
    minWidth: 54,
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
    padding: 0,
  },
  perksSection: { gap: 10 },
  perksLabel: {
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  perksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  perkChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  perkText: {
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansBold',
  },
  editChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  footerStats: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  statValue: {
    fontSize: fontScale(18),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  statLabel: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
  },
  divider: { width: 1, height: 34 },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  publishButton: {
    height: 58,
    borderRadius: 30,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  publishButtonDisabled: { opacity: 0.8 },
  publishText: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scrim: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    maxHeight: '92%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grabber: {
    alignSelf: 'center',
    width: 52,
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: {
    fontSize: mediumScreen ? fontScale(20):fontScale(16),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalContent: { paddingBottom: 8, gap: 18 },
  fieldBlock: { gap: 10 },
  fieldLabel: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  textField: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansBold',
  },
  priceEditorWrap: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editorDollar: {
    fontSize: mediumScreen ? fontScale(18):fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  priceEditorInput: {
    flex: 1,
    fontSize: mediumScreen ? fontScale(20): fontScale(16),
    fontFamily: 'PlusJakartaSansExtraBold',
    padding: 0,
  },
  listWrap: { gap: 10 },
  listItem: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
  },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSans',
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
  },
  syncButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd2bee',
    marginTop: 6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

export default MembershipTiers;
