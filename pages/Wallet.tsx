import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import {
  getApiErrorMessage,
  useAuth,
  useWallet,
  useWalletLedger,
  useWalletTopUpMutation,
  useWalletTransactions,
  useWalletTransferMutation,
} from '../src';
import { fontSize } from './typography';

type WalletTab = 'transactions' | 'ledger';

const money = (value: unknown, currency = 'GHS') => {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${currency} ${safeValue.toFixed(2)}`;
  }
};

const Wallet: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>('transactions');
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpReference, setTopUpReference] = useState('');

  const walletQuery = useWallet();
  const transactionsQuery = useWalletTransactions(1);
  const ledgerQuery = useWalletLedger(1);
  const transferMutation = useWalletTransferMutation();
  const topUpMutation = useWalletTopUpMutation();

  const wallet = walletQuery.data?.data;
  const balances = wallet?.balances;
  const currency = balances?.currency ?? wallet?.base_currency ?? 'GHS';
  const listData = activeTab === 'transactions'
    ? transactionsQuery.data?.data ?? []
    : ledgerQuery.data?.data ?? [];
  const listLoading = activeTab === 'transactions'
    ? transactionsQuery.isLoading
    : ledgerQuery.isLoading;
  const listError = activeTab === 'transactions'
    ? transactionsQuery.error
    : ledgerQuery.error;
  const panelBg = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;

  const canSubmitTransfer = useMemo(
    () => recipientId.trim() && Number(transferAmount) >= 0.0001 && !transferMutation.isPending,
    [recipientId, transferAmount, transferMutation.isPending],
  );

  const canSubmitTopUp = useMemo(
    () => Number(topUpAmount) >= 0.0001 && !topUpMutation.isPending,
    [topUpAmount, topUpMutation.isPending],
  );

  const submitTransfer = async () => {
    const parsedRecipientId = Number(recipientId);
    const parsedAmount = Number(transferAmount);

    if (!Number.isInteger(parsedRecipientId)) {
      Alert.alert('Check recipient', 'Recipient id must be a valid user id.');
      return;
    }

    if (String(parsedRecipientId) === String(user?.id)) {
      Alert.alert('Not available', 'You cannot transfer wallet funds to yourself.');
      return;
    }

    try {
      await transferMutation.mutateAsync({
        recipient_id: parsedRecipientId,
        amount: parsedAmount,
        // Keep the deprecated alias until the backend service reads `amount` directly.
        amount_usd: parsedAmount,
        description: transferDescription.trim() || undefined,
      });
      setRecipientId('');
      setTransferAmount('');
      setTransferDescription('');
      Alert.alert('Transfer sent', 'Your wallet transfer was created.');
    } catch {
      // Mutation hook shows the parsed API error.
    }
  };

  const submitTopUp = async () => {
    try {
      await topUpMutation.mutateAsync({
        amount: Number(topUpAmount),
        // Keep the deprecated alias until the backend service reads `amount` directly.
        amount_usd: Number(topUpAmount),
        payment_reference: topUpReference.trim() || undefined,
      });
      setTopUpAmount('');
      setTopUpReference('');
      Alert.alert('Top-up created', 'Your wallet top-up was created.');
    } catch {
      // Mutation hook shows the parsed API error.
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: panelBg }]}>
          <MaterialIcons name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallet</Text>
        <Pressable onPress={() => void walletQuery.refetch()} style={[styles.iconButton, { backgroundColor: panelBg }]}>
          <MaterialIcons name="refresh" size={20} color={theme.text} />
        </Pressable>
      </View>

      {walletQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>Loading wallet...</Text>
        </View>
      ) : walletQuery.isError ? (
        <View style={styles.centerState}>
          <MaterialIcons name="account-balance-wallet" size={44} color={PRIMARY_COLOR} />
          <Text style={[styles.stateTitle, { color: theme.text }]}>Wallet unavailable</Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>{getApiErrorMessage(walletQuery.error)}</Text>
          <Pressable onPress={() => void walletQuery.refetch()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.balanceCard, { backgroundColor: panelBg, borderColor: border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{wallet?.account_name ?? 'Kulsah Wallet'}</Text>
            <Text style={[styles.totalBalance, { color: theme.text }]}>{money(balances?.total ?? balances?.total_usd, currency)}</Text>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {wallet?.account_key ?? 'Account key pending'} / {wallet?.status ?? 'active'}
            </Text>

            <View style={styles.balanceGrid}>
              <BalanceTile label="Available" value={money(balances?.available ?? balances?.available_usd, currency)} />
              <BalanceTile label="Pending" value={money(balances?.pending ?? balances?.pending_usd, currency)} />
              <BalanceTile label="Held" value={money(balances?.held ?? balances?.held_usd, currency)} />
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={[styles.formCard, { backgroundColor: panelBg, borderColor: border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Transfer</Text>
              <TextInput includeFontPadding={false} value={recipientId} onChangeText={setRecipientId} keyboardType="number-pad" placeholder="Recipient user id" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: border }]} />
              <TextInput includeFontPadding={false} value={transferAmount} onChangeText={setTransferAmount} keyboardType="decimal-pad" placeholder={`Amount ${currency}`} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: border }]} />
              <TextInput includeFontPadding={false} value={transferDescription} onChangeText={setTransferDescription} placeholder="Description" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: border }]} />
              <Pressable disabled={!canSubmitTransfer} onPress={() => void submitTransfer()} style={[styles.primaryButton, !canSubmitTransfer && styles.disabled]}>
                {transferMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Transfer</Text>}
              </Pressable>
            </View>

            <View style={[styles.formCard, { backgroundColor: panelBg, borderColor: border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Top Up</Text>
              <TextInput includeFontPadding={false} value={topUpAmount} onChangeText={setTopUpAmount} keyboardType="decimal-pad" placeholder={`Amount ${currency}`} placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: border }]} />
              <TextInput includeFontPadding={false} value={topUpReference} onChangeText={setTopUpReference} placeholder="Payment reference" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.text, borderColor: border }]} />
              <Pressable disabled={!canSubmitTopUp} onPress={() => void submitTopUp()} style={[styles.primaryButton, !canSubmitTopUp && styles.disabled]}>
                {topUpMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create Top-up</Text>}
              </Pressable>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['transactions', 'ledger'] as WalletTab[]).map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
                <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : theme.textSecondary }]}>{tab.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          {listLoading ? (
            <View style={styles.listState}>
              <ActivityIndicator color={PRIMARY_COLOR} />
            </View>
          ) : listError ? (
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>{getApiErrorMessage(listError)}</Text>
          ) : listData.length === 0 ? (
            <View style={styles.listState}>
              <MaterialIcons name="receipt-long" size={36} color={primaryColorAlpha(0.6)} />
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>No {activeTab} yet.</Text>
            </View>
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.rowCard, { borderColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{String(item.type ?? item.entry_type ?? item.status ?? activeTab)}</Text>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{String(item.description ?? item.narration ?? item.created_at ?? '')}</Text>
                  </View>
                  <Text style={[styles.rowAmount, { color: PRIMARY_COLOR }]}>{money(item.amount ?? item.amount_usd, item.currency ?? currency)}</Text>
                </View>
              )}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const BalanceTile = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.balanceTile}>
    <Text style={styles.balanceTileLabel}>{label}</Text>
    <Text style={styles.balanceTileValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { height: 64, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...fontSize.b2, lineHeight: fontSize.b2.lineHeight },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { marginTop: 12, ...fontSize.b2, lineHeight: fontSize.b2.lineHeight },
  stateText: { marginTop: 8, textAlign: 'center', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  balanceCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 10 },
  label: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  totalBalance: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight },
  balanceGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  balanceTile: { flex: 1, borderRadius: 12, padding: 10, backgroundColor: primaryColorAlpha(0.12) },
  balanceTileLabel: { color: '#94a3b8', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  balanceTileValue: { color: '#fff', marginTop: 4, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  formGrid: { gap: 12 },
  formCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  cardTitle: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  primaryButton: { minHeight: 44, borderRadius: 999, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryButtonText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  disabled: { opacity: 0.5 },
  tabs: { flexDirection: 'row', gap: 8 },
  tabButton: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(148,163,184,0.14)' },
  tabButtonActive: { backgroundColor: PRIMARY_COLOR },
  tabText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  listState: { minHeight: 110, alignItems: 'center', justifyContent: 'center' },
  rowCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'capitalize' },
  rowAmount: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
});

export default Wallet;
