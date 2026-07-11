import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useThemeMode, PRIMARY_COLOR, primaryColorAlphaHex } from '../theme';
import { fontSize } from './typography';
import {
  parseApiError,
  useCreateSubscriptionPlan,
  useCreatorSubscriptionPlans,
  useDisableSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from '../src';
import type { CreatorSubscriptionPlan } from '../src';

type PlanForm = {
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_interval: 'monthly';
};

const emptyForm: PlanForm = {
  name: 'Monthly Plan',
  description: '',
  price: '10.00',
  currency: 'USD',
  billing_interval: 'monthly',
};

const formFromPlan = (plan?: CreatorSubscriptionPlan | null): PlanForm =>
  plan
    ? {
        name: plan.name,
        description: plan.description || '',
        price: String(plan.price ?? ''),
        currency: plan.currency || 'USD',
        billing_interval: plan.billing_interval || 'monthly',
      }
    : emptyForm;

const MembershipTiers: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const { data, isLoading, isRefetching, error, refetch } = useCreatorSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const disablePlan = useDisableSubscriptionPlan();
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const plan = data?.data?.[0] ?? null;
  const apiError = error ? parseApiError(error) : null;
  const mutationError = createPlan.error || updatePlan.error || disablePlan.error;
  const parsedMutationError = mutationError ? parseApiError(mutationError) : null;
  const isSaving = createPlan.isPending || updatePlan.isPending;

  useEffect(() => {
    setForm(formFromPlan(plan));
  }, [plan?.id]);

  const projectedMonthlyRevenue = useMemo(() => {
    const price = Number.parseFloat(form.price) || 0;
    return price * 100;
  }, [form.price]);

  const updateField = (key: keyof PlanForm, value: string) => {
    setSuccessMessage('');
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Plan name is required.';
    if (!form.currency.trim()) return 'Currency is required.';
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return 'Price must be greater than zero.';
    return null;
  };

  const submitPlan = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      Alert.alert('Check your details', validationMessage);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        currency: form.currency.trim().toUpperCase(),
        billing_interval: form.billing_interval,
      };

      if (plan) {
        await updatePlan.mutateAsync({ subscriptionPlan: plan.id, payload });
        setSuccessMessage('Subscription plan updated.');
      } else {
        await createPlan.mutateAsync(payload);
        setSuccessMessage('Subscription plan created.');
      }

      setIsEditorOpen(false);
    } catch (caughtError) {
      const parsed = parseApiError(caughtError);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  const confirmDisablePlan = () => {
    if (!plan) return;

    Alert.alert(
      'Disable subscription plan?',
      'New subscribers will not be able to join this plan. Existing subscribers keep access until their current subscription expires.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await disablePlan.mutateAsync(plan.id);
              setSuccessMessage('Plan disabled. Existing subscribers keep access until expiry.');
            } catch (caughtError) {
              const parsed = parseApiError(caughtError);
              Alert.alert(parsed.title, parsed.message);
            }
          },
        },
      ],
    );
  };

  const openEditor = () => {
    setForm(formFromPlan(plan));
    setIsEditorOpen(true);
  };

  const renderForm = (compact = false) => (
    <View style={compact ? s.modalFields : s.formCard}>
      <View style={s.fieldBlock}>
        <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Plan Name</Text>
        <TextInput
          value={form.name}
          onChangeText={(value) => updateField('name', value)}
          style={[s.textField, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
          placeholder="Monthly Plan"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={s.fieldBlock}>
        <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Description</Text>
        <TextInput
          value={form.description}
          onChangeText={(value) => updateField('description', value)}
          multiline
          style={[s.textArea, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
          placeholder="Optional description"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={s.formRow}>
        <View style={[s.fieldBlock, s.priceField]}>
          <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Price</Text>
          <TextInput
            value={form.price}
            onChangeText={(value) => updateField('price', value)}
            keyboardType="decimal-pad"
            style={[s.textField, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
            placeholder="10.00"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={[s.fieldBlock, s.currencyField]}>
          <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Currency</Text>
          <TextInput
            value={form.currency}
            onChangeText={(value) => updateField('currency', value.toUpperCase())}
            autoCapitalize="characters"
            maxLength={3}
            style={[s.textField, { color: theme.text, backgroundColor: isDark ? '#ffffff08' : theme.surface, borderColor: theme.border }]}
            placeholder="USD"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={s.fieldBlock}>
        <Text style={[s.fieldLabel, { color: theme.textMuted }]}>Billing Interval</Text>
        <View style={[s.intervalPill, { backgroundColor: primaryColorAlphaHex(isDark ? '26' : '18'), borderColor: primaryColorAlphaHex('44') }]}>
          <MaterialIcons name="calendar-month" size={18} color={theme.accent} />
          <Text style={[s.intervalText, { color: theme.text }]}>Monthly</Text>
        </View>
      </View>

      {parsedMutationError ? (
        <View style={[s.messageBox, { backgroundColor: '#ef44441a', borderColor: '#ef444455' }]}>
          <Text style={[s.messageText, { color: '#ef4444' }]}>{parsedMutationError.message}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => void submitPlan()} disabled={isSaving} style={[s.primaryButton, isSaving && s.disabledButton]}>
        {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryButtonText}>{plan ? 'Save Plan' : 'Create Plan'}</Text>}
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]} edges={[]}>
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(31,16,34,0.78)' : theme.card, borderBottomColor: theme.border }]}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={[s.iconButton, { backgroundColor: isDark ? '#ffffff14' : theme.surface }]}>
            <MaterialIcons name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: theme.text }]}>Subscription Settings</Text>
        </View>
        <Pressable onPress={() => void refetch()} disabled={isRefetching} style={[s.iconButton, { backgroundColor: isDark ? '#ffffff14' : theme.surface }]}>
          {isRefetching ? <ActivityIndicator size="small" color={theme.accent} /> : <MaterialIcons name="refresh" size={18} color={theme.text} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {successMessage ? (
          <View style={[s.messageBox, { backgroundColor: '#22c55e1a', borderColor: '#22c55e55' }]}>
            <Text style={[s.messageText, { color: '#16a34a' }]}>{successMessage}</Text>
          </View>
        ) : null}

        {apiError ? (
          <View style={[s.messageBox, { backgroundColor: '#ef44441a', borderColor: '#ef444455' }]}>
            <Text style={[s.messageText, { color: '#ef4444' }]}>{apiError.message}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={s.centerState}>
            <ActivityIndicator color={theme.accent} />
            <Text style={[s.centerText, { color: theme.textMuted }]}>Loading subscription plan...</Text>
          </View>
        ) : plan ? (
          <>
            <View style={[s.planCard, { backgroundColor: isDark ? '#101625' : theme.card, borderColor: plan.is_active ? PRIMARY_COLOR : theme.border }]}>
              <View style={s.rowBetween}>
                <View style={s.flex}>
                  <Text style={[s.planName, { color: theme.text }]}>{plan.name}</Text>
                  <Text style={[s.planMeta, { color: theme.textMuted }]}>
                    {plan.currency} {plan.price} / {plan.billing_interval}
                  </Text>
                </View>
                <View style={[s.statusPill, { backgroundColor: plan.is_active ? '#22c55e1f' : '#64748b1f' }]}>
                  <Text style={[s.statusText, { color: plan.is_active ? '#16a34a' : theme.textMuted }]}>{plan.is_active ? 'Active' : 'Disabled'}</Text>
                </View>
              </View>

              <Text style={[s.description, { color: theme.textSecondary }]}>
                {plan.description || 'No description added yet.'}
              </Text>

              <View style={[s.revenueStrip, { backgroundColor: isDark ? '#ffffff0a' : theme.surface, borderColor: theme.border }]}>
                <View>
                  <Text style={[s.metricLabel, { color: theme.textMuted }]}>Projected MRR at 100 fans</Text>
                  <Text style={[s.metricValue, { color: '#22c55e' }]}>
                    ${projectedMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={s.actionRow}>
                <Pressable onPress={openEditor} style={[s.secondaryButton, { borderColor: theme.border, backgroundColor: isDark ? '#ffffff0d' : theme.surface }]}>
                  <MaterialIcons name="edit" size={18} color={theme.accent} />
                  <Text style={[s.secondaryButtonText, { color: theme.text }]}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDisablePlan}
                  disabled={!plan.is_active || disablePlan.isPending}
                  style={[s.dangerButton, (!plan.is_active || disablePlan.isPending) && s.disabledButton]}
                >
                  {disablePlan.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.dangerButtonText}>Disable</Text>}
                </Pressable>
              </View>

              {!plan.is_active ? (
                <Text style={[s.noticeText, { color: theme.textMuted }]}>
                  New subscribers cannot join. Existing subscribers keep access until expiry.
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <View style={s.centerState}>
              <MaterialIcons name="workspace-premium" size={44} color={theme.accent} />
              <Text style={[s.emptyTitle, { color: theme.text }]}>Create your one subscription plan</Text>
              <Text style={[s.centerText, { color: theme.textMuted }]}>Creators can only have one active plan. Set the monthly offer fans will see.</Text>
            </View>
            {renderForm()}
          </>
        )}
      </ScrollView>

      <Modal statusBarTranslucent visible={isEditorOpen} transparent animationType="slide" onRequestClose={() => setIsEditorOpen(false)}>
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={() => setIsEditorOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalKeyboardWrap}>
            <View style={[s.modalCard, { backgroundColor: isDark ? theme.background : theme.card, borderTopColor: theme.border }]}>
              <View style={[s.grabber, { backgroundColor: isDark ? '#ffffff20' : '#cbd5e1' }]} />
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: theme.text }]}>Edit Plan</Text>
                <Pressable onPress={() => setIsEditorOpen(false)} style={[s.modalClose, { backgroundColor: isDark ? '#ffffff12' : theme.surface, borderColor: theme.border }]}>
                  <MaterialIcons name="close" size={18} color={theme.text} />
                </Pressable>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {renderForm(true)}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2, textTransform: 'uppercase', flex: 1 },
  content: { padding: 16, paddingBottom: 80, gap: 16 },
  centerState: { alignItems: 'center', gap: 10, paddingVertical: 32, paddingHorizontal: 24 },
  centerText: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 4, textAlign: 'center' },
  emptyTitle: { ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 3, textAlign: 'center' },
  formCard: { gap: 16 },
  modalFields: { gap: 16, paddingBottom: 24 },
  fieldBlock: { gap: 8 },
  fieldLabel: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4 },
  textField: { minHeight: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 2 },
  textArea: { minHeight: 96, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: 'top', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 4 },
  formRow: { flexDirection: 'row', gap: 12 },
  priceField: { flex: 1 },
  currencyField: { width: 104 },
  intervalPill: { height: 48, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  intervalText: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  disabledButton: { opacity: 0.55 },
  messageBox: { borderWidth: 1, borderRadius: 16, padding: 14 },
  messageText: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 4 },
  planCard: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1 },
  planName: { ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 3 },
  planMeta: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 2, marginTop: 4, textTransform: 'uppercase' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  description: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 5 },
  revenueStrip: { borderRadius: 16, borderWidth: 1, padding: 14 },
  metricLabel: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  metricValue: { ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 3, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1, minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryButtonText: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  dangerButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  dangerButtonText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  noticeText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 4 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  scrim: { ...StyleSheet.absoluteFillObject },
  modalKeyboardWrap: { justifyContent: 'flex-end' },
  modalCard: { maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  grabber: { alignSelf: 'center', width: 52, height: 6, borderRadius: 999, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 2 },
  modalClose: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

export default MembershipTiers;
