import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { fontSize } from './typography';
import {
  parseApiError,
  useCreateSubscriptionPlan,
  useCreatorSubscriptionPlans,
  useUpdateSubscriptionPlan,
} from '../src';
import type { CreatorSubscriptionPlan } from '../src';

type SubscriptionTier = {
  id?: string | number;
  name: string;
  price: string;
  description: string;
  currency: string;
  billingInterval: string;
};

type ModalMode = 'add' | 'edit';

const EMPTY_SUBSCRIPTION: SubscriptionTier = {
  name: '',
  price: '',
  description: '',
  currency: 'USD',
  billingInterval: 'monthly',
};

const tierFromPlan = (plan: CreatorSubscriptionPlan): SubscriptionTier => ({
  id: plan.id,
  name: plan.name,
  price: String(plan.price ?? ''),
  description: plan.description || '',
  currency: plan.currency,
  billingInterval: plan.billing_interval,
});

const MembershipTiers: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const { data, isLoading, isRefetching, error, refetch } = useCreatorSubscriptionPlans();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('edit');
  const [editingSub, setEditingSub] = useState<SubscriptionTier | null>(null);
  const createSubscriptionPlan = useCreateSubscriptionPlan();
  const updateSubscriptionPlan = useUpdateSubscriptionPlan();

  const subscriptionPlan = data?.data?.find((plan) => plan.is_active) ?? data?.data?.[0] ?? null;
  const subscription = subscriptionPlan ? tierFromPlan(subscriptionPlan) : null;
  const apiError = error ? parseApiError(error) : null;

  const projectedMonthlyRevenue = useMemo(() => {
    const price = Number.parseFloat(subscription?.price ?? '') || 0;
    return price * 100;
  }, [subscription]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingSub({ ...EMPTY_SUBSCRIPTION });
    setIsEditorOpen(true);
  };

  const openEditor = () => {
    if (!subscription) return;
    setModalMode('edit');
    setEditingSub({ ...subscription });
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingSub(null);
  };

  const publishSubscription = async () => {
    if (!editingSub) return;

    const name = editingSub.name.trim();
    const price = Number.parseFloat(editingSub.price);
    if (!name) {
      Alert.alert('Check your details', 'Subscription name is required.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Check your details', 'Price must be greater than zero.');
      return;
    }

    try {
      setIsSaving(true);

      if (modalMode === 'add') {
        await createSubscriptionPlan.mutateAsync({
          name,
          description: editingSub.description.trim() || null,
          price,
          currency: 'USD',
          billing_interval: 'monthly',
        });
      } else if (editingSub.id != null) {
        await updateSubscriptionPlan.mutateAsync({
          subscriptionPlan: editingSub.id,
          payload: {
            name,
            description: editingSub.description.trim() || null,
            price,
            currency: 'USD',
            billing_interval: 'monthly',
          },
        });
      }

      await refetch();
      closeEditor();
      Alert.alert('Published', 'Your membership tier updates are now live.');
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setIsSaving(false);
    }
  };

  const projectedRevenueLabel = `$${projectedMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]} edges={[]}>
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(6,9,19,0.94)' : theme.card, borderBottomColor: theme.border }]}>
        <View style={s.headerLeft}>
          <Text style={[s.headerTitle, { color: theme.text }]}>Galaxy Economy</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.sectionBlock}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.textMuted }]}>Subscription Management</Text>
            {!isLoading && !apiError && !subscription ? (
              <Pressable onPress={openAddModal} style={[s.addSubscriptionButton, { backgroundColor: PRIMARY_COLOR }]}>
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={s.addSubscriptionText}>Add</Text>
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <View style={[s.stateCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[s.stateTitle, { color: theme.text }]}>Loading subscription plan</Text>
              <Text style={[s.stateText, { color: theme.textMuted }]}>Fetching your current membership offer.</Text>
            </View>
          ) : apiError ? (
            <View style={[s.stateCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="error-outline" size={34} color="#ef4444" />
              <Text style={[s.stateTitle, { color: theme.text }]}>{apiError.title}</Text>
              <Text style={[s.stateText, { color: theme.textMuted }]}>{apiError.message}</Text>
              <Pressable onPress={() => void refetch()} disabled={isRefetching} style={s.secondaryActionButton}>
                {isRefetching ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.secondaryActionText}>Retry</Text>}
              </Pressable>
            </View>
          ) : !subscription ? (
            <View style={[s.stateCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="workspace-premium" size={38} color={theme.accent} />
              <Text style={[s.stateTitle, { color: theme.text }]}>No subscription plan yet</Text>
              <Text style={[s.stateText, { color: theme.textMuted }]}>Create a monthly plan before fans can subscribe.</Text>
              <Pressable onPress={openAddModal} style={s.secondaryActionButton}>
                <Text style={s.secondaryActionText}>Add Plan</Text>
              </Pressable>
            </View>
          ) : (
          <>
          <View style={[s.heroCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
            <View style={s.heroGlow} />
            <View style={s.heroMetrics}>
              <View>
                <Text style={[s.metricLabel, { color: theme.textMuted }]}>Projected MRR</Text>
                <Text style={[s.metricValue, { color: '#22c55e' }]}>{projectedRevenueLabel}</Text>
              </View>
              <View style={s.metricRight}>
                <Text style={[s.metricLabel, { color: theme.textMuted }]}>Billing</Text>
                <Text style={[s.metricValue, { color: theme.accent }]}>{subscription.billingInterval}</Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <Text style={[s.microText, { color: theme.textMuted }]}>Projection at 100 subscribers</Text>
          <Text style={[s.microText, { color: theme.accent }]}>Plan data from API</Text>
            </View>
          </View>

          <View style={[s.tierCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: PRIMARY_COLOR }]}> 
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[s.tierName, { color: theme.text }]}>{subscription.name}</Text>
                <Text style={[s.tierCaption, { color: theme.textMuted }]}>Active offering</Text>
              </View>
              <View style={[s.pricePill, { backgroundColor: isDark ? '#00000040' : theme.surface, borderColor: theme.border }]}>
                <Text style={[s.priceDollar, { color: theme.accent }]}>{subscription.currency}</Text>
                <Text style={[s.priceValue, { color: theme.text }]}>{subscription.price}</Text>
              </View>
            </View>

            <View style={s.descriptionSection}>
              <View style={s.descriptionHeader}>
                <Text style={[s.descriptionLabel, { color: theme.textMuted }]}>Description</Text>
                <Pressable onPress={openEditor} style={[s.editChip, { borderColor: theme.border }]}>
                  <MaterialIcons name="edit" size={16} color={theme.accent} />
                </Pressable>
              </View>
              <Text style={[s.descriptionText, { color: theme.textSecondary }]}>
                {subscription.description || 'No description added yet.'}
              </Text>
            </View>

            <View style={[s.footerStats, { borderTopColor: theme.border }]}>
              <View style={s.statsRow}>
                <View>
                  <Text style={[s.statValue, { color: theme.text }]}>{subscription.currency}</Text>
                  <Text style={[s.statLabel, { color: theme.textMuted }]}>Currency</Text>
                </View>
                <View style={[s.divider, { backgroundColor: theme.border }]} />
                <View>
                  <Text style={[s.statValue, { color: '#22c55e' }]}>{subscription.billingInterval}</Text>
                  <Text style={[s.statLabel, { color: theme.textMuted }]}>Billing</Text>
                </View>
              </View>
              <Pressable onPress={openEditor} style={[s.settingsButton, { backgroundColor: isDark ? '#ffffff12' : theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="settings-suggest" size={20} color={theme.accent} />
              </Pressable>
            </View>
          </View>
          </>
          )}
        </View>
      </ScrollView>

      <Modal
      statusBarTranslucent
      visible={isEditorOpen} transparent animationType="slide" onRequestClose={closeEditor}>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={closeEditor} />
          {editingSub ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
              style={s.modalKeyboardWrap}
            >
              <View style={[s.modalCard, { backgroundColor: isDark ? theme.background : theme.card, borderTopColor: theme.border }]}>
                <View style={[s.grabber, { backgroundColor: isDark ? '#ffffff20' : '#cbd5e1' }]} />

                <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: theme.text }]}>
                    {modalMode === 'add' ? 'Add Subscription' : 'Refine Subscription'}
                  </Text>
                  <Pressable onPress={closeEditor} style={[s.modalClose, { backgroundColor: isDark ? '#ffffff12' : theme.surface, borderColor: theme.border }]}>
                    <MaterialIcons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={s.modalContent}
                >
                  <View style={s.fieldBlock}>
                    <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Identity Label</Text>
                    <TextInput includeFontPadding={false}
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
                      <TextInput includeFontPadding={false}
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
                    <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Description</Text>
                    <TextInput includeFontPadding={false}
                      value={editingSub.description}
                      onChangeText={(value) => setEditingSub({ ...editingSub, description: value })}
                      multiline
                      textAlignVertical="top"
                      style={[s.textArea, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
                      placeholder="Describe what subscribers unlock..."
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  <Pressable onPress={() => void publishSubscription()} disabled={isSaving} style={[s.syncButton, isSaving && s.publishButtonDisabled]}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={s.syncButtonText}>Publish</Text>
                        <MaterialIcons name="rocket-launch" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
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
     ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, textTransform: 'uppercase', letterSpacing: 2
  },
  aiButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: { padding: 16, paddingBottom: 40, gap: 18 },
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
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 4,
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
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
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionBlock: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: {
    paddingHorizontal: 4,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  addSubscriptionButton: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addSubscriptionText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tierCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  tierName: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  tierCaption: {
    marginTop: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  priceInput: {
    minWidth: 54,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    padding: 0,
  },
  priceValue: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  stateCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  stateTitle: {
    ...fontSize.b2, lineHeight: fontSize.b2.lineHeight,
    textAlign: 'center',
  },
  stateText: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  secondaryActionButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryActionText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  descriptionSection: { gap: 10 },
  descriptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  descriptionLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  descriptionText: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  statLabel: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  publishButtonDisabled: { opacity: 0.8 },
  publishText: {
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalKeyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
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
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  textField: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  textArea: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  priceEditorInput: {
    flex: 1,
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    padding: 0,
  },
  syncButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: PRIMARY_COLOR,
    marginTop: 6,
  },
  syncButtonText: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

export default MembershipTiers;
