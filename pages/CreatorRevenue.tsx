import React, { useEffect, useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontSize } from '../fonts';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';

interface Transaction {
  id: string;
  type: 'tip' | 'subscription' | 'ticket' | 'payout';
  amount: string;
  user?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

type PayoutMethod = 'bank' | 'momo' | 'paypal' | 'crypto';

const revenueData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 1100 },
];

const distributionData = [
  { name: 'Subscriptions', value: 60, color: PRIMARY_COLOR },
  { name: 'Tickets', value: 30, color: '#3b82f6' },
  { name: 'Tips', value: 10, color: '#22c55e' },
];

const transactions: Transaction[] = [
  { id: 'tx1', type: 'tip', amount: '+$50.00', user: 'Alex_Vibes', date: 'Oct 24, 2:45 PM', status: 'completed' },
  { id: 'tx2', type: 'subscription', amount: '+$14.99', user: 'Sarah_Music', date: 'Oct 24, 1:12 PM', status: 'completed' },
  { id: 'tx3', type: 'ticket', amount: '+$350.00', user: 'Echo_Fan', date: 'Oct 23, 11:30 PM', status: 'completed' },
  { id: 'tx4', type: 'payout', amount: '-$5,000.00', date: 'Oct 20, 9:00 AM', status: 'completed' },
  { id: 'tx5', type: 'subscription', amount: '+$49.99', user: 'Mark_Gold', date: 'Oct 19, 4:20 PM', status: 'pending' },
];

const payoutMethods: Array<{
  id: PayoutMethod;
  label: string;
  sub: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  bg: string;
  border: string;
}> = [
  { id: 'momo', label: 'Mobile Money', sub: 'MoMo / Airtel', icon: 'smartphone', tint: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.22)' },
  { id: 'bank', label: 'Bank Transfer', sub: 'Chase ...4292', icon: 'account-balance', tint: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.22)' },
  { id: 'paypal', label: 'PayPal', sub: 'Instant Transfer', icon: 'payments', tint: PRIMARY_COLOR, bg: primaryColorAlpha(0.12), border: primaryColorAlpha(0.22) },
  { id: 'crypto', label: 'Crypto Wallet', sub: 'USDT / USDC', icon: 'currency-bitcoin', tint: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.22)' },
];

const availableBalance = 12450.0;

const CreatorRevenue: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutProgress, setPayoutProgress] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(availableBalance.toString());
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod>('bank');
  const [momoNumber, setMomoNumber] = useState('');

  const chartMax = Math.max(...revenueData.map((item) => item.value));
  const withdrawPreview = parseFloat(withdrawAmount || '0');

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const softBg = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const titleColor = isDark ? '#fff' : theme.text;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#6b7280' : theme.textMuted;
  const accent ={PRIMARY_COLOR};

  useEffect(() => {
    if (route.params?.openWithdraw) {
      setIsPayoutModalOpen(true);
    }
  }, [route.params]);

  const getFinancialAdvice = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('Missing API key');
      const ai = new GoogleGenAI({ apiKey });
      const prompt =
        "Analyze this creator revenue breakdown: $12,450 available for payout. Sources: 60% Subscriptions, 30% Tickets, 10% Tips. Subscriber growth is steady at 5%. Give a 2-sentence financial strategic advice on how to optimize tips during live sessions for a musician named Mila Ray. Use cosmic metaphors.";
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setAiAdvice(
        (response as { text?: string }).text ||
          'Your financial nebula is expanding. Focus on increasing tip velocity through cosmic live interactions.',
      );
    } catch {
      setAiAdvice(
        "Your subscription base is the steady moon holding your orbit in place. Trigger a tip supernova during live sessions with low-friction rewards like custom shoutouts and instant fan callouts.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getFinancialAdvice();
  }, []);

  const handlePayoutRequest = () => {
    const amountNum = parseFloat(withdrawAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0 || amountNum > availableBalance) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount within your available balance.');
      return;
    }

    if (selectedMethod === 'momo' && !momoNumber.trim()) {
      Alert.alert('Missing Number', 'Please enter your MoMo phone number.');
      return;
    }

    setPayoutProgress(1);
    setTimeout(() => setPayoutProgress(40), 1000);
    setTimeout(() => setPayoutProgress(100), 2500);
    setTimeout(() => {
      setIsPayoutModalOpen(false);
      setPayoutProgress(0);
      setWithdrawAmount(availableBalance.toString());
      setMomoNumber('');
    }, 3500);
  };

  const payoutSummary = useMemo(
    () => [
      { label: 'Weekly Growth', value: '+12.4%', color: '#22c55e' },
      { label: 'Pending', value: '$3,240', color: titleColor },
    ],
    [titleColor],
  );

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]}>
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.96)', borderBottomColor: border }]}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={[s.headerButton, { backgroundColor: softBg, borderColor: border }]}>
            <MaterialIcons name="arrow-back" size={20} color={titleColor} />
          </Pressable>
          <Text style={[s.headerTitle, { color: titleColor }]}>Galaxy Economy</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Wallet')} style={[s.headerButton, { backgroundColor: softBg, borderColor: border }]}>
          <MaterialIcons name="settings" size={20} color={subtle} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* <View style={s.heroGlow} /> */}
        <View style={[s.balanceCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.balanceTop}>
            <View style={{ flex: 1 }}>
              <Text style={[s.microLabel, { color: muted }]}>Available for Payout</Text>
              <View style={s.balanceRow}>
                <Text style={s.balanceValue}>${availableBalance.toLocaleString()}</Text>
                <Text style={[s.balanceUnit, { color: muted }]}>PCR</Text>
              </View>
            </View>
            <View style={s.balanceRight}>
              <Text style={[s.microLabel, { color: muted }]}>Total Assets</Text>
              <Text style={[s.balanceSmallValue, { color: titleColor }]}>$45,820</Text>
            </View>
          </View>

          <View style={s.summaryGrid}>
            {payoutSummary.map((item) => (
              <View key={item.label} style={[s.summaryCard, { backgroundColor: softBg, borderColor: border }]}>
                <Text style={[s.summaryLabel, { color: muted }]}>{item.label}</Text>
                <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => setIsPayoutModalOpen(true)} style={s.requestButton}>
            <Text style={s.requestButtonText}>Request Payout</Text>
          </Pressable>
        </View>

        <View style={s.analyticsGrid}>
          <View style={[s.analyticsCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.microLabel, { color: muted }]}>Revenue Velocity</Text>
            <View style={s.chartWrap}>
              <View style={s.barRow}>
                {revenueData.map((item) => (
                  <View key={item.name} style={s.barItem}>
                    <View style={[s.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#eef2ff' }]}>
                      <View style={[s.barFill, { height: `${(item.value / chartMax) * 100}%` }]} />
                    </View>
                    <Text style={[s.barLabel, { color: muted }]}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[s.analyticsCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.microLabel, { color: muted }]}>Source Distribution</Text>
            <View style={s.distributionCenter}>
              <View style={[s.donutRing, { borderColor: '#111827' }]}>
                <View style={s.donutInner}>
                  <Text style={[s.donutValue, { color: titleColor }]}>100%</Text>
                  <Text style={[s.donutLabel, { color: muted }]}>Monetized</Text>
                </View>
              </View>
            </View>
            <View style={s.distributionList}>
              {distributionData.map((item) => (
                <View key={item.name} style={s.distributionItem}>
                  <View style={[s.distributionDot, { backgroundColor: item.color }]} />
                  <Text style={[s.distributionName, { color: subtle }]}>{item.name}</Text>
                  <Text style={[s.distributionPercent, { color: titleColor }]}>{item.value}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* <View style={[s.aiCard, { backgroundColor: isDark ? primaryColorAlpha(0.08) : theme.accentSoft, borderColor: primaryColorAlpha(0.24) }]}>
          <View style={s.aiHeader}>
            <View style={s.aiHeaderLeft}>
              <View style={s.aiIconWrap}>
                <MaterialIcons name="auto-awesome" size={26} color={accent} />
              </View>
              <View>
                <Text style={s.aiTitle}>Galaxy Advisor</Text>
                <Text style={s.aiMeta}>Strategic Intelligence</Text>
              </View>
            </View>
            <Pressable onPress={() => void getFinancialAdvice()} disabled={loading} style={[s.aiRefresh, loading && s.aiRefreshLoading]}>
              {loading ? <ActivityIndicator color={accent} /> : <MaterialIcons name="sync" size={20} color={accent} />}
            </Pressable>
          </View>

          <Text style={[s.aiBody, { color: isDark ? '#e2e8f0' : theme.textSecondary }]}>
            {loading ? 'Scanning the financial constellations...' : aiAdvice || 'No cosmic audit available yet.'}
          </Text>

          <View style={s.aiFooter}>
            <View style={[s.aiMetaCard, { backgroundColor: softBg, borderColor: border }]}>
              <Text style={[s.aiMetaLabel, { color: muted }]}>Confidence</Text>
              <Text style={s.aiMetaValue}>High (98%)</Text>
            </View>
            <View style={[s.aiMetaCard, { backgroundColor: softBg, borderColor: border }]}>
              <Text style={[s.aiMetaLabel, { color: muted }]}>Impact</Text>
              <Text style={s.aiMetaValue}>Significant</Text>
            </View>
          </View>
        </View> */}

        <View style={s.transactionsSection}>
          <View style={s.sectionHeader}>
            <Text style={[s.microLabel, { color: muted }]}>Transaction History</Text>
            <Pressable>
              <Text style={s.filterText}>Filter</Text>
            </Pressable>
          </View>

          {transactions.map((tx) => {
            const icon =
              tx.type === 'tip'
                ? 'redeem'
                : tx.type === 'subscription'
                  ? 'stars'
                  : tx.type === 'ticket'
                    ? 'confirmation-number'
                    : 'outbox';
            const iconColor =
              tx.type === 'tip'
                ? '#22c55e'
                : tx.type === 'subscription'
                  ? accent
                  : tx.type === 'ticket'
                    ? '#3b82f6'
                    : titleColor;

            return (
              <View key={tx.id} style={[s.transactionCard, { backgroundColor: cardBg, borderColor: border }]}>
                <View style={s.transactionLeft}>
                  <View style={[s.transactionIconWrap, { backgroundColor: softBg, borderColor: border }]}>
                    <MaterialIcons name={icon as any} size={22} color={iconColor} />
                  </View>
                  <View>
                    <View style={s.transactionNameRow}>
                      <Text style={[s.transactionName, { color: titleColor }]}>{tx.type === 'payout' ? 'Payout' : tx.user}</Text>
                      <View style={[s.statusBadge, { backgroundColor: tx.status === 'completed' ? 'rgba(34,197,94,0.12)' : softBg }]}>
                        <Text style={[s.statusBadgeText, { color: tx.status === 'completed' ? '#22c55e' : subtle }]}>{tx.status}</Text>
                      </View>
                    </View>
                    <Text style={[s.transactionDate, { color: muted }]}>{tx.date}</Text>
                  </View>
                </View>
                <Text style={[s.transactionAmount, { color: tx.amount.startsWith('+') ? '#22c55e' : titleColor }]}>{tx.amount}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={isPayoutModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsPayoutModalOpen(false)}>
        <View style={s.modalRoot}>
          <Pressable style={s.modalBackdrop} onPress={() => setIsPayoutModalOpen(false)} />
          <View style={[s.modalCard, { backgroundColor: theme.background, borderColor: border, paddingBottom: Math.max(20, insets.bottom) }]}>
            <View style={[s.handle, { backgroundColor: border }]} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.modalIntro}>
                <Text style={[s.modalTitle, { color: titleColor }]}>Withdraw Funds</Text>
                <Text style={[s.modalMeta, { color: muted }]}>Select Amount & Gateway</Text>
              </View>

              <View style={[s.inputCard, { backgroundColor: softBg, borderColor: border }]}>
                <Text style={[s.inputLabel, { color: muted }]}>Withdrawal Amount (USD)</Text>
                <View style={[s.amountField, { backgroundColor: theme.card, borderColor: border }]}>
                  <Text style={[s.amountPrefix, { color: muted }]}>$</Text>
                  <TextInput
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={muted}
                    style={[s.amountInput, { color: titleColor }]}
                  />
                </View>
                <View style={s.amountFooter}>
                  <Text style={[s.amountHint, { color: muted }]}>Max: ${availableBalance.toLocaleString()}</Text>
                  <Pressable onPress={() => setWithdrawAmount(availableBalance.toString())}>
                    <Text style={s.useMaxText}>Use Max</Text>
                  </Pressable>
                </View>
              </View>

              <View style={s.gatewaySection}>
                <Text style={[s.inputLabel, { color: muted }]}>Payment Gateway</Text>
                <View style={s.gatewayGrid}>
                  {payoutMethods.map((method) => {
                    const active = selectedMethod === method.id;
                    return (
                      <Pressable
                        key={method.id}
                        onPress={() => setSelectedMethod(method.id)}
                        style={[
                          s.gatewayCard,
                          {
                            backgroundColor: active ? (isDark ? 'rgba(255,255,255,0.06)' : theme.card) : softBg,
                            borderColor: active ? method.border : border,
                          },
                        ]}
                      >
                        <View style={[s.gatewayIconWrap, { backgroundColor: method.bg }]}>
                          <MaterialIcons name={method.icon} size={24} color={method.tint} />
                        </View>
                        <Text style={[s.gatewayLabel, { color: titleColor }]}>{method.label}</Text>
                        <Text style={[s.gatewaySub, { color: muted }]}>{method.sub}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {selectedMethod === 'momo' ? (
                <View style={[s.momoCard, { backgroundColor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.22)' }]}>
                  <Text style={[s.inputLabel, { color: '#eab308' }]}>MoMo Phone Number</Text>
                  <TextInput
                    value={momoNumber}
                    onChangeText={setMomoNumber}
                    keyboardType="phone-pad"
                    placeholder="+234 812 000 0000"
                    placeholderTextColor={muted}
                    style={[s.phoneInput, { backgroundColor: theme.card, borderColor: border, color: titleColor }]}
                  />
                </View>
              ) : null}

              {payoutProgress > 0 ? (
                <View style={s.progressSection}>
                  <View style={s.progressHeader}>
                    <Text style={s.progressLabel}>
                      {payoutProgress < 100 ? `Initiating ${selectedMethod.toUpperCase()} Transfer...` : 'Transfer Success!'}
                    </Text>
                    <Text style={[s.progressPercent, { color: titleColor }]}>{payoutProgress}%</Text>
                  </View>
                  <View style={[s.progressTrack, { backgroundColor: softBg }]}>
                    <View style={[s.progressFill, { width: `${payoutProgress}%` }]} />
                  </View>
                </View>
              ) : (
                <View style={s.modalActions}>
                  <Pressable onPress={() => setIsPayoutModalOpen(false)} style={[s.cancelBtn, { backgroundColor: softBg, borderColor: border }]}>
                    <Text style={[s.cancelBtnText, { color: subtle }]}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handlePayoutRequest} style={s.withdrawBtn}>
                    <Text style={s.withdrawBtnText}>Withdraw ${Number.isNaN(withdrawPreview) ? '0' : withdrawPreview.toLocaleString()}</Text>
                  </Pressable>
                </View>
              )}

              <Text style={[s.modalFootnote, { color: muted }]}>Funds typically arrive within 1-24 planetary hours.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
    gap: 22,
  },
  heroGlow: {
    position: 'absolute',
    top: 10,
    left: 30,
    right: 30,
    height: 200,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 40,
  },
  balanceCard: {
    borderRadius: 34,
    borderWidth: 1,
    padding: 20,
    gap: 22,
    overflow: 'hidden',
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  microLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  balanceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  balanceValue: {
    color: '#22c55e',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twentyFour : FontSize.twenty,
  },
  balanceUnit: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
    marginBottom: 6,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  balanceSmallValue: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twenty : FontSize.sixteen,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  summaryLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.nine : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  summaryValue: {
    marginTop: 6,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twenty : FontSize.sixteen,
  },
  requestButton: {
    height: 58,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  analyticsGrid: {
    gap: 16,
  },
  analyticsCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  chartWrap: {
    height: 190,
    justifyContent: 'flex-end',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    flex: 1,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    minHeight: 14,
  },
  barLabel: {
    marginTop: 8,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
  },
  distributionCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  donutRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 18,
    borderTopColor: PRIMARY_COLOR,
    borderRightColor: '#3b82f6',
    borderBottomColor: '#22c55e',
    borderLeftColor: 'rgba(148,163,184,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twentyTwo : FontSize.eighteen,
  },
  donutLabel: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  distributionList: {
    gap: 10,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  distributionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  distributionName: {
    flex: 1,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
  },
  distributionPercent: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
  },
  aiCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: primaryColorAlpha(0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: PRIMARY_COLOR,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  aiMeta: {
    marginTop: 3,
    color: primaryColorAlpha(0.7),
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiRefresh: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.12),
  },
  aiRefreshLoading: {
    opacity: 0.8,
  },
  aiBody: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.fourteen : FontSize.eleven,
    lineHeight: mediumScreen ? 24 : 20,
    fontStyle: 'italic',
  },
  aiFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  aiMetaCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  aiMetaLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  aiMetaValue: {
    marginTop: 5,
    color: PRIMARY_COLOR,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
  },
  transactionsSection: {
    gap: 12,
    paddingBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterText: {
    color: PRIMARY_COLOR,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  transactionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transactionName: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textTransform: 'uppercase',
  },
  transactionDate: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.nine : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  transactionAmount: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.fourteen : FontSize.twelve,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '90%',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalIntro: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twentyTwo : FontSize.eighteen,
    textTransform: 'uppercase',
  },
  modalMeta: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.nine : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  inputCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.nine : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  amountField: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  amountPrefix: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twentyFour : FontSize.twenty,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twentyFour : FontSize.twenty,
  },
  amountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountHint: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
  },
  useMaxText: {
    color: PRIMARY_COLOR,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  gatewaySection: {
    marginTop: 16,
    gap: 10,
  },
  gatewayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  gatewayCard: {
    width: '48.5%',
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  gatewayIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gatewayLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.nine,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  gatewaySub: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textAlign: 'center',
  },
  momoCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  phoneInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
  },
  progressSection: {
    marginTop: 18,
    gap: 10,
    paddingVertical: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: PRIMARY_COLOR,
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    flex: 1,
  },
  progressPercent: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve : FontSize.ten,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 999,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  withdrawBtn: {
    flex: 2,
    height: 54,
    borderRadius: 18,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.ten : FontSize.eight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  modalFootnote: {
    marginTop: 18,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eight : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
});

export default CreatorRevenue;
