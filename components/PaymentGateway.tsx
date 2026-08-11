import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

export type PaymentGatewayMethod = 'momo' | 'card' | 'bank' | 'kulcoins';

type PaymentGatewayProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  itemName: string;
  allowedMethods?: PaymentGatewayMethod[];
  walletBalance?: number;
};

type Step = 'methods' | 'details' | 'processing' | 'success';
type MomoProvider = 'mtn' | 'telecel' | 'airteltigo';

const methodConfig: Record<PaymentGatewayMethod, {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
}> = {
  momo: { title: 'Mobile Money', subtitle: 'MTN, Telecel, AirtelTigo', icon: 'phone-iphone', tint: '#f59e0b' },
  card: { title: 'Card Payment', subtitle: 'Visa, Mastercard, Verve', icon: 'credit-card', tint: '#2563eb' },
  bank: { title: 'Bank Transfer', subtitle: 'Direct bank deposit', icon: 'account-balance', tint: '#10b981' },
  kulcoins: { title: 'KulCoins', subtitle: 'Pay from wallet balance', icon: 'toll', tint: PRIMARY_COLOR },
};

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  itemName,
  allowedMethods = ['momo', 'card', 'bank'],
  walletBalance = 0,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [step, setStep] = useState<Step>('methods');
  const [method, setMethod] = useState<PaymentGatewayMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [errorText, setErrorText] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const styles = useMemo(() => createStyles(isDark, theme), [isDark, theme]);
  const canClose = step !== 'processing';
  const placeholderColor = theme.textMuted;
  const formattedAmount = `${amount} ${currency}`;

  useEffect(() => {
    if (!isOpen) {
      setStep('methods');
      setMethod(null);
      setPhoneNumber('');
      setMomoProvider('mtn');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setErrorText('');
      setPaymentId('');
    }
  }, [isOpen]);

  const selectMethod = (nextMethod: PaymentGatewayMethod) => {
    setMethod(nextMethod);
    setErrorText('');
    setStep('details');
  };

  const handlePayment = () => {
    setErrorText('');

    if (method === 'momo' && phoneNumber.trim().length < 9) {
      setErrorText('Enter a valid Mobile Money phone number.');
      return;
    }

    if (method === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setErrorText('Enter all card details.');
      return;
    }

    if (method === 'kulcoins' && walletBalance < amount) {
      setErrorText('Insufficient KulCoins for this purchase.');
      return;
    }

    setStep('processing');
    setTimeout(() => {
      setPaymentId(`KUL-${(Math.random() + 1).toString(36).substring(7).toUpperCase()}`);
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    }, 1600);
  };

  const renderMethod = (paymentMethod: PaymentGatewayMethod) => {
    const config = methodConfig[paymentMethod];
    return (
      <Pressable key={paymentMethod} onPress={() => selectMethod(paymentMethod)} style={styles.methodCard}>
        <View style={[styles.methodIcon, { backgroundColor: `${config.tint}18`, borderColor: `${config.tint}33` }]}>
          <MaterialIcons name={config.icon} size={24} color={config.tint} />
        </View>
        <View style={styles.methodCopy}>
          <Text style={styles.methodTitle}>{config.title}</Text>
          <Text style={styles.methodSubtitle}>{config.subtitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
      </Pressable>
    );
  };

  const renderDetails = () => (
    <View style={styles.stackLarge}>
      <Pressable onPress={() => setStep('methods')} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={16} color={PRIMARY_COLOR} />
        <Text style={styles.backText}>Back to methods</Text>
      </Pressable>

      {method === 'momo' ? (
        <View style={styles.stack}>
          <View style={styles.providerRow}>
            {(['mtn', 'telecel', 'airteltigo'] as const).map((provider) => {
              const active = momoProvider === provider;
              return (
                <Pressable
                  key={provider}
                  onPress={() => setMomoProvider(provider)}
                  style={[styles.providerChip, active && styles.providerChipActive]}
                >
                  <Text style={[styles.providerText, active && styles.providerTextActive]}>
                    {provider === 'airteltigo' ? 'AT Money' : provider}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput includeFontPadding={false}
            value={phoneNumber}
            onChangeText={(value) => setPhoneNumber(value.replace(/[^0-9+ ]/g, ''))}
            keyboardType="phone-pad"
            placeholder="024 000 0000"
            placeholderTextColor={placeholderColor}
            style={styles.input}
          />
        </View>
      ) : null}

      {method === 'card' ? (
        <View style={styles.stack}>
          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput includeFontPadding={false}
            value={cardNumber}
            onChangeText={(value) => setCardNumber(value.replace(/[^0-9 ]/g, ''))}
            keyboardType="number-pad"
            maxLength={19}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={placeholderColor}
            style={styles.input}
          />
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Expiry</Text>
              <TextInput includeFontPadding={false}
                value={cardExpiry}
                onChangeText={(value) => setCardExpiry(value.replace(/[^0-9/]/g, ''))}
                maxLength={5}
                placeholder="MM/YY"
                placeholderTextColor={placeholderColor}
                style={[styles.input, styles.centerInput]}
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput includeFontPadding={false}
                value={cardCvv}
                onChangeText={(value) => setCardCvv(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
                placeholder="123"
                placeholderTextColor={placeholderColor}
                style={[styles.input, styles.centerInput]}
              />
            </View>
          </View>
        </View>
      ) : null}

      {method === 'bank' ? (
        <View style={styles.bankBox}>
          <Text style={styles.bankBody}>Transfer exactly <Text style={styles.bankStrong}>{formattedAmount}</Text> to the account below.</Text>
          <Text style={styles.bankLabel}>Bank Name</Text>
          <Text style={styles.bankValue}>Kulsah Ecobank</Text>
          <Text style={styles.bankLabel}>Account Number</Text>
          <Text style={styles.accountNumber}>1441008829001</Text>
        </View>
      ) : null}

      {method === 'kulcoins' ? (
        <View style={styles.walletBox}>
          <MaterialIcons name="account-balance-wallet" size={28} color={PRIMARY_COLOR} />
          <Text style={styles.walletTitle}>KulCoins Wallet</Text>
          <Text style={styles.walletBody}>Balance: {walletBalance.toLocaleString()} KC</Text>
          <Text style={[styles.walletHint, walletBalance < amount && styles.errorText]}>
            {walletBalance >= amount ? `${formattedAmount} will be deducted from your wallet.` : 'Top up KulCoins before completing this purchase.'}
          </Text>
        </View>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Pressable onPress={handlePayment} style={styles.payButton}>
        <Text style={styles.payButtonText}>Pay {formattedAmount}</Text>
        <MaterialIcons name="lock" size={18} color="#ffffff" />
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (step === 'processing') {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.stateTitle}>Processing Payment</Text>
          <Text style={styles.stateBody}>Please do not close this window</Text>
          {method === 'momo' ? <Text style={styles.primaryHint}>Check your phone for the MoMo prompt</Text> : null}
        </View>
      );
    }

    if (step === 'success') {
      return (
        <View style={styles.centerState}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={52} color="#ffffff" />
          </View>
          <Text style={styles.stateTitle}>Payment Successful</Text>
          <Text style={styles.successId}>ID: {paymentId}</Text>
        </View>
      );
    }

    if (step === 'details') return renderDetails();

    return (
      <View style={styles.stack}>
        <Text style={styles.sectionLabel}>Select Payment Method</Text>
        {allowedMethods.map(renderMethod)}
      </View>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => canClose && onClose()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Pressable style={styles.backdrop} onPress={() => canClose && onClose()} />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <View style={styles.brandIcon}>
              <MaterialIcons name="rocket-launch" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Kulsah Pay</Text>
              <Text style={styles.subtitle}>Secured Payment Gateway</Text>
            </View>
            <Pressable onPress={() => canClose && onClose()} disabled={!canClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>Paying For</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{itemName}</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.amountText}>{formattedAmount}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>

          <View style={styles.footer}>
            <MaterialIcons name="verified-user" size={14} color={theme.textMuted} />
            <Text style={styles.footerText}>PCI DSS Compliant</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (isDark: boolean, theme: ReturnType<typeof useThemeMode>['theme']) => {
  const cardBg = isDark ? '#111827' : theme.card;
  const panelBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
  const border = isDark ? 'rgba(255,255,255,0.09)' : theme.border;
  const text = theme.text;
  const muted = theme.textMuted;
  const secondary = theme.textSecondary;

  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'center', padding: 18 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.36)' },
    card: { maxHeight: '92%', borderRadius: 32, overflow: 'hidden', backgroundColor: cardBg, borderWidth: 1, borderColor: border },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: border, backgroundColor: panelBg, flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColorAlpha(0.1), borderWidth: 1, borderColor: primaryColorAlpha(0.2) },
    headerCopy: { flex: 1 },
    title: { color: text, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight, textTransform: 'uppercase' },
    subtitle: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 3 },
    closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: panelBg },
    summary: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border, backgroundColor: primaryColorAlpha(0.04), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    summaryCopy: { flex: 1 },
    summaryLabel: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.3 },
    summaryValue: { color: text, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', marginTop: 4 },
    amountBlock: { alignItems: 'flex-end' },
    amountText: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginTop: 4 },
    content: { padding: 20 },
    stack: { gap: 12 },
    stackLarge: { gap: 18 },
    sectionLabel: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 2 },
    methodCard: { minHeight: 76, borderRadius: 20, padding: 14, backgroundColor: panelBg, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 12 },
    methodIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    methodCopy: { flex: 1 },
    methodTitle: { color: text, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    methodSubtitle: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', marginTop: 4 },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    backText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
    providerRow: { flexDirection: 'row', gap: 8 },
    providerChip: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: border, backgroundColor: panelBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    providerChipActive: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
    providerText: { color: secondary, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', textAlign: 'center' },
    providerTextActive: { color: '#ffffff' },
    inputLabel: { color: secondary, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
    input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: border, backgroundColor: panelBg, color: text, paddingHorizontal: 14, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputHalf: { flex: 1, gap: 8 },
    centerInput: { textAlign: 'center' },
    bankBox: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(245,158,11,0.26)', backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)', padding: 18, gap: 10 },
    bankBody: { color: secondary, ...fontSize.b5, lineHeight: 18 },
    bankStrong: { color: text },
    bankLabel: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
    bankValue: { color: text, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    accountNumber: { color: PRIMARY_COLOR, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight, letterSpacing: 1.6 },
    walletBox: { borderRadius: 22, borderWidth: 1, borderColor: primaryColorAlpha(0.28), backgroundColor: primaryColorAlpha(0.08), padding: 18, alignItems: 'center', gap: 8 },
    walletTitle: { color: text, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase' },
    walletBody: { color: secondary, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    walletHint: { color: muted, ...fontSize.b5, lineHeight: 17, textAlign: 'center' },
    errorText: { color: '#ef4444', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textAlign: 'center', textTransform: 'uppercase' },
    payButton: { minHeight: 58, borderRadius: 20, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    payButtonText: { color: '#ffffff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
    centerState: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 14 },
    stateTitle: { color: text, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight, textTransform: 'uppercase', textAlign: 'center' },
    stateBody: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4, textAlign: 'center' },
    primaryHint: { color: PRIMARY_COLOR, backgroundColor: primaryColorAlpha(0.08), borderWidth: 1, borderColor: primaryColorAlpha(0.16), paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', textAlign: 'center' },
    successIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    successId: { color: '#10b981', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: border, backgroundColor: panelBg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    footerText: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  });
};

export default PaymentGateway;
