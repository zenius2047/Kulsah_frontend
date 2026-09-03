import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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
import { useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../src/api/payment.api';
import type {
  InitializePaymentPayload,
  MobileMoneyProvider,
  Payment,
  PaymentPurchase,
} from '../src/types/payment.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { createPaymentIdempotencyKey, isPaymentFulfilled } from '../src/utils/payment';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

export type PaymentCheckoutMethod = 'momo' | 'card' | 'bank' | 'kulcoins';

export type PaymentCheckoutProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  itemName: string;
  itemSubtitle?: string;
  merchantName?: string;
  summaryEyebrow?: string;
  itemImageUri?: string | null;
  purchase: PaymentPurchase;
  allowedMethods?: PaymentCheckoutMethod[];
  walletBalance?: number;
};

type CheckoutMethod = 'momo' | 'card';
type Step = 'checkout' | 'card_handoff' | 'pending' | 'success';
type MomoProvider = 'mtn' | 'telecel' | 'airteltigo';

const PROVIDERS: Array<{
  id: MomoProvider;
  label: string;
  shortLabel: string;
  color: string;
  paystackCode: MobileMoneyProvider;
}> = [
  { id: 'mtn', label: 'MTN', shortLabel: 'MTN', color: '#f5c400', paystackCode: 'mtn' },
  { id: 'telecel', label: 'Telecel', shortLabel: 't', color: '#e30613', paystackCode: 'vod' },
  { id: 'airteltigo', label: 'AirtelTigo', shortLabel: 'AT', color: '#e11d48', paystackCode: 'tgo' },
];

const PAYMENT_POLL_INTERVAL_MS = 8_000;

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  itemName,
  itemSubtitle = 'Secure one-time payment',
  merchantName,
  summaryEyebrow,
  itemImageUri,
  purchase,
  allowedMethods = ['momo', 'card'],
}) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isDark, theme } = useThemeMode();
  const supportedMethods = useMemo<CheckoutMethod[]>(() => {
    const methods = allowedMethods.filter(
      (candidate): candidate is CheckoutMethod => candidate === 'momo' || candidate === 'card',
    );
    return methods.length > 0 ? methods : ['momo', 'card'];
  }, [allowedMethods]);
  const [step, setStep] = useState<Step>('checkout');
  const [method, setMethod] = useState<CheckoutMethod>('card');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorText, setErrorText] = useState('');
  const completedRef = useRef(false);
  const verifyingRef = useRef(false);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentAttemptRef = useRef<{ method: CheckoutMethod; key: string } | null>(null);

  const styles = useMemo(() => createStyles(isDark, theme), [isDark, theme]);
  const displayedCurrency = (payment?.currency || currency).toUpperCase();
  const displayedAmount = payment?.amount ?? amount;
  const formattedAmount = `${displayedCurrency} ${Number(displayedAmount || 0).toFixed(2)}`;
  const canDismiss = !isStarting && !isChecking;

  useEffect(() => {
    if (!isOpen) return;

    setStep('checkout');
    setMethod(supportedMethods.includes('card') ? 'card' : 'momo');
    setPhoneNumber('');
    setMomoProvider('mtn');
    setPayment(null);
    setIsStarting(false);
    setIsChecking(false);
    setErrorText('');
    completedRef.current = false;
    verifyingRef.current = false;
    paymentAttemptRef.current = null;
  }, [isOpen]);

  useEffect(() => () => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
  }, []);

  const finish = useCallback((completedPayment: Payment) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const queryKey = completedPayment.purpose === 'kulcoin'
      ? ['kulcoin']
      : completedPayment.purpose === 'subscription'
        ? ['creator-fan']
        : ['events'];
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    setStep('success');
    completionTimerRef.current = setTimeout(() => {
      onSuccess();
      onClose();
    }, 1_100);
  }, [onClose, onSuccess, queryClient]);

  const applyPayment = useCallback((nextPayment: Payment) => {
    setPayment(nextPayment);
    if (isPaymentFulfilled(nextPayment)) {
      finish(nextPayment);
      return;
    }

    if (nextPayment.status === 'failed') {
      paymentAttemptRef.current = null;
      setErrorText('The payment was not completed. Please try again.');
      setStep(nextPayment.channel === 'card' ? 'card_handoff' : 'checkout');
      return;
    }

    setStep('pending');
  }, [finish]);

  const verifyPayment = useCallback(async (target: Payment, showProgress = false) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    if (showProgress) setIsChecking(true);
    setErrorText('');

    try {
      const response = await paymentApi.verify(target.id);
      applyPayment(response.data.data);
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    } finally {
      verifyingRef.current = false;
      if (showProgress) setIsChecking(false);
    }
  }, [applyPayment]);

  useEffect(() => {
    if (!isOpen || step !== 'pending' || !payment || completedRef.current) return;

    const timer = setInterval(() => {
      void verifyPayment(payment);
    }, PAYMENT_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isOpen, payment, step, verifyPayment]);

  useEffect(() => {
    if (!isOpen || step !== 'pending' || !payment || completedRef.current) return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void verifyPayment(payment, true);
    });
    return () => subscription.remove();
  }, [isOpen, payment, step, verifyPayment]);

  const makePayload = (
    checkoutMethod: CheckoutMethod,
    idempotencyKey: string,
  ): InitializePaymentPayload | null => {
    const base = {
      ...purchase,
      idempotency_key: idempotencyKey,
    };

    if (checkoutMethod === 'card') return { ...base, method: 'card' };

    const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, '');
    if (!/^\+?[0-9]{9,15}$/.test(normalizedPhone)) {
      setErrorText('Enter a valid Mobile Money number.');
      return null;
    }

    const selectedProvider = PROVIDERS.find((provider) => provider.id === momoProvider) ?? PROVIDERS[0];
    return {
      ...base,
      method: 'mobile_money',
      provider: selectedProvider.paystackCode,
      phone: normalizedPhone,
    };
  };

  const initialize = async (checkoutMethod: CheckoutMethod): Promise<Payment | null> => {
    if (!paymentAttemptRef.current || paymentAttemptRef.current.method !== checkoutMethod) {
      paymentAttemptRef.current = {
        method: checkoutMethod,
        key: createPaymentIdempotencyKey(
          purchase,
          checkoutMethod === 'momo' ? 'mobile_money' : 'card',
        ),
      };
    }
    const payload = makePayload(checkoutMethod, paymentAttemptRef.current.key);
    if (!payload) return null;

    setIsStarting(true);
    setErrorText('');
    try {
      const response = await paymentApi.initialize(payload);
      const initializedPayment = response.data.data;
      setPayment(initializedPayment);
      return initializedPayment;
    } catch (error) {
      paymentAttemptRef.current = null;
      setErrorText(getApiErrorMessage(error));
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  const startMobileMoneyPayment = async () => {
    const initializedPayment = await initialize('momo');
    if (initializedPayment) applyPayment(initializedPayment);
  };

  const startCardPayment = async () => {
    const initializedPayment = await initialize('card');
    if (!initializedPayment) return;

    if (!initializedPayment.authorization_url) {
      setErrorText('Paystack did not return a secure checkout link.');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(initializedPayment.authorization_url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: PRIMARY_COLOR,
      });
      setStep('pending');
      await verifyPayment(initializedPayment, true);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Unable to open secure card checkout.');
    }
  };

  const selectMethod = (nextMethod: CheckoutMethod) => {
    setMethod(nextMethod);
    setErrorText('');
  };

  const renderPaystackFooter = () => (
    <View style={styles.paystackFooter}>
      <MaterialIcons name="lock-outline" size={15} color={theme.textMuted} />
      <Text style={styles.paystackPrefix}>Secure payment powered by</Text>
      <MaterialIcons name="view-stream" size={23} color="#16c7e8" />
      <Text style={styles.paystackWordmark}>paystack</Text>
    </View>
  );

  const renderSummary = (compact = false) => (
    <View style={[styles.summaryCard, compact && styles.summaryCardCompact]}>
      <View style={styles.summaryAvatar}>
        {itemImageUri ? (
          <Image source={{ uri: itemImageUri }} style={styles.summaryImage} />
        ) : (
          <MaterialIcons name="workspace-premium" size={26} color={PRIMARY_COLOR} />
        )}
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryEyebrow}>{summaryEyebrow ?? (merchantName ? `Pay ${merchantName}` : 'Pay for')}</Text>
        <Text style={styles.summaryTitle} numberOfLines={1}>{itemName}</Text>
        <Text style={styles.summarySubtitle} numberOfLines={1}>{itemSubtitle}</Text>
      </View>
      <Text style={styles.summaryAmount}>{formattedAmount}</Text>
    </View>
  );

  const renderMethod = (
    checkoutMethod: CheckoutMethod,
    title: string,
    subtitle: string,
    icon: keyof typeof MaterialIcons.glyphMap,
  ) => {
    const active = method === checkoutMethod;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        key={checkoutMethod}
        onPress={() => selectMethod(checkoutMethod)}
        style={[styles.methodCard, active && styles.methodCardActive]}
      >
        <View style={[styles.radio, active && styles.radioActive]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={[styles.methodIcon, active && styles.methodIconActive]}>
          <MaterialIcons name={icon} size={25} color={active ? PRIMARY_COLOR : theme.text} />
        </View>
        <View style={styles.methodCopy}>
          <Text style={[styles.methodTitle, active && styles.methodTitleActive]}>{title}</Text>
          <Text style={[styles.methodSubtitle, active && styles.methodSubtitleActive]}>{subtitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={27} color={active ? PRIMARY_COLOR : theme.textMuted} />
      </Pressable>
    );
  };

  const renderMobileMoneyDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionLabel}>Mobile Money Details</Text>
      <Text style={styles.fieldLabel}>Select Network</Text>
      <View style={styles.providerRow}>
        {PROVIDERS.map((provider) => {
          const active = provider.id === momoProvider;
          return (
            <Pressable
              key={provider.id}
              onPress={() => setMomoProvider(provider.id)}
              style={[styles.providerButton, active && styles.providerButtonActive]}
            >
              <View style={[styles.providerLogo, { backgroundColor: provider.color }]}>
                <Text style={styles.providerLogoText}>{provider.shortLabel}</Text>
              </View>
              <Text style={styles.providerLabel}>{provider.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>Mobile Money Number</Text>
      <View style={styles.phoneInputWrap}>
        <MaterialIcons name="phone-in-talk" size={27} color={PRIMARY_COLOR} />
        <TextInput
          value={phoneNumber}
          onChangeText={(value) => setPhoneNumber(value.replace(/[^0-9+ ]/g, ''))}
          keyboardType="phone-pad"
          placeholder="024 123 4567"
          placeholderTextColor={theme.textMuted}
          style={styles.phoneInput}
        />
        <MaterialIcons name="contact-phone" size={28} color={PRIMARY_COLOR} />
      </View>
      <View style={styles.infoBanner}>
        <MaterialIcons name="info-outline" size={25} color={PRIMARY_COLOR} />
        <Text style={styles.infoText}>You will receive a prompt on your phone to approve the payment.</Text>
      </View>
    </View>
  );

  const renderCardSecurity = () => (
    <View style={styles.securityCard}>
      <View style={styles.securityHeadingRow}>
        <View style={styles.securityHeadingIcon}>
          <MaterialIcons name="verified-user" size={34} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.securityHeadingCopy}>
          <Text style={styles.securityTitle}>Secure Card Payment</Text>
          <Text style={styles.securityBody}>Your card information will be entered securely through Paystack.</Text>
        </View>
      </View>
      <View style={styles.securityStats}>
        {[
          ['lock-outline', 'PCI DSS\nCompliant'],
          ['verified-user', 'Your data is\nprotected'],
          ['check-circle-outline', 'Trusted by\nmillions'],
        ].map(([icon, label]) => (
          <View key={label} style={styles.securityStat}>
            <View style={styles.securityStatIcon}>
              <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={25} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.securityStatText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCheckout = () => (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {renderSummary()}
      <Text style={styles.sectionLabel}>Choose Payment Method</Text>
      <View style={styles.methodStack}>
        {supportedMethods.includes('momo')
          ? renderMethod('momo', 'Mobile Money', 'Pay with MTN, Telecel or AirtelTigo', 'phone-iphone')
          : null}
        {supportedMethods.includes('card')
          ? renderMethod('card', 'Debit / Credit Card', 'Visa, Mastercard & more', 'credit-card')
          : null}
      </View>

      {method === 'momo' ? renderMobileMoneyDetails() : renderCardSecurity()}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Pressable
        disabled={isStarting}
        onPress={method === 'momo' ? () => void startMobileMoneyPayment() : () => setStep('card_handoff')}
        style={({ pressed }) => [styles.primaryButtonOuter, (pressed || isStarting) && styles.buttonPressed]}
      >
        <LinearGradient colors={['#5f00c9', '#7600e8', '#4b00b9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
          {isStarting ? <ActivityIndicator color="#ffffff" /> : <MaterialIcons name={method === 'momo' ? 'lock' : 'arrow-forward'} size={22} color="#ffffff" />}
          <Text style={styles.primaryButtonText}>
            {method === 'momo' ? `Pay ${formattedAmount}` : 'Continue to Secure Card Payment'}
          </Text>
        </LinearGradient>
      </Pressable>
      <Pressable onPress={onClose} disabled={!canDismiss} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      {renderPaystackFooter()}
    </ScrollView>
  );

  const renderCardHandoff = () => (
    <ScrollView contentContainerStyle={[styles.centeredContent, { paddingBottom: Math.max(insets.bottom, 22) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.heroIllustration}>
        <View style={styles.heroGlow} />
        <MaterialIcons name="phone-iphone" size={110} color={PRIMARY_COLOR} />
        <View style={styles.heroCardShape}>
          <MaterialIcons name="credit-card" size={48} color="#ffffff" />
        </View>
        <View style={styles.heroShield}>
          <MaterialIcons name="lock" size={26} color={PRIMARY_COLOR} />
        </View>
      </View>
      <Text style={styles.heroTitle}>Secure Card Checkout</Text>
      <Text style={styles.heroBody}>You'll enter your card details securely through Paystack to complete your purchase.</Text>
      {renderSummary(true)}
      <View style={styles.trustList}>
        {['Card details stay secure', 'Bank authentication supported', 'Protected checkout'].map((label) => (
          <View key={label} style={styles.trustRow}>
            <MaterialIcons name="check-circle" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.trustText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.infoBanner}>
        <MaterialIcons name="info-outline" size={25} color={PRIMARY_COLOR} />
        <Text style={styles.infoText}>You may be redirected for bank authentication or 3D Secure if required.</Text>
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      <Pressable disabled={isStarting} onPress={() => void startCardPayment()} style={({ pressed }) => [styles.primaryButtonOuter, (pressed || isStarting) && styles.buttonPressed]}>
        <LinearGradient colors={['#5f00c9', '#7600e8', '#4b00b9']} style={styles.primaryButton}>
          {isStarting ? <ActivityIndicator color="#ffffff" /> : <MaterialIcons name="lock" size={22} color="#ffffff" />}
          <Text style={styles.primaryButtonText}>Open Secure Card Checkout</Text>
        </LinearGradient>
      </Pressable>
      <Pressable onPress={() => setStep('checkout')} disabled={!canDismiss} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Back to payment methods</Text>
      </Pressable>
      <Pressable onPress={onClose} disabled={!canDismiss} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      {renderPaystackFooter()}
    </ScrollView>
  );

  const renderPending = () => {
    const isMomo = payment?.channel === 'mobile_money';
    return (
      <ScrollView contentContainerStyle={[styles.centeredContent, { paddingBottom: Math.max(insets.bottom, 22) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.pendingIllustration}>
          <View style={styles.heroGlow} />
          <MaterialIcons name={isMomo ? 'phonelink-ring' : 'credit-score'} size={112} color={PRIMARY_COLOR} />
        </View>
        <Text style={styles.heroTitle}>{isMomo ? 'Check Your Phone' : 'Confirming Your Payment'}</Text>
        <Text style={styles.heroBody}>
          {isMomo
            ? "We've sent a Mobile Money payment request to the number below."
            : 'Return here after completing the secure Paystack checkout.'}
        </Text>
        {isMomo ? (
          <View style={styles.pendingDetailCard}>
            <View style={styles.pendingIcon}><MaterialIcons name="person" size={24} color="#ffffff" /></View>
            <View style={styles.pendingCopy}>
              <Text style={styles.pendingLabel}>Mobile Money Number</Text>
              <Text style={styles.pendingValue}>{phoneNumber}</Text>
            </View>
            <Pressable onPress={() => setStep('checkout')} style={styles.changeButton}>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.pendingDetailCard}>
          <View style={styles.pendingIcon}><Text style={styles.currencyIcon}>{displayedCurrency.slice(0, 3)}</Text></View>
          <View style={styles.pendingCopy}>
            <Text style={styles.pendingLabel}>Amount</Text>
            <Text style={styles.pendingValue}>{formattedAmount}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={25} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.infoBanner}>
          <MaterialIcons name="info-outline" size={25} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>{isMomo ? 'Approve the payment on your phone to complete your purchase.' : 'Your purchase unlocks after Paystack confirms the payment.'}</Text>
        </View>
        <View style={styles.waitingBlock}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.waitingTitle}>Waiting for approval</Text>
          <Text style={styles.waitingBody}>This may take a few moments.</Text>
        </View>
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <View style={styles.statusRow}>
          <View style={styles.statusHelpIcon}><MaterialIcons name="support-agent" size={27} color={PRIMARY_COLOR} /></View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Having trouble?</Text>
            <Text style={styles.statusBody}>You can check the status of your payment.</Text>
          </View>
          <Pressable
            disabled={!payment || isChecking}
            onPress={() => payment && void verifyPayment(payment, true)}
            style={styles.statusButton}
          >
            {isChecking ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : <Text style={styles.statusButtonText}>Check Status</Text>}
          </Pressable>
        </View>
        <Pressable onPress={onClose} disabled={!canDismiss} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Close for now</Text>
        </Pressable>
        {renderPaystackFooter()}
      </ScrollView>
    );
  };

  const renderSuccess = () => (
    <View style={[styles.successContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check" size={54} color="#ffffff" />
      </View>
      <Text style={styles.heroTitle}>Payment Complete</Text>
      <Text style={styles.heroBody}>Your purchase has been confirmed and is ready.</Text>
      {payment?.reference ? <Text style={styles.referenceText}>{payment.reference}</Text> : null}
    </View>
  );

  return (
    <Modal visible={isOpen} animationType="slide" statusBarTranslucent onRequestClose={() => canDismiss && onClose()}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
          {step === 'checkout' ? renderCheckout() : null}
          {step === 'card_handoff' ? renderCardHandoff() : null}
          {step === 'pending' ? renderPending() : null}
          {step === 'success' ? renderSuccess() : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (isDark: boolean, theme: ReturnType<typeof useThemeMode>['theme']) => {
  const surface = isDark ? '#0d0a16' : '#ffffff';
  const panel = isDark ? '#171121' : '#ffffff';
  const softPanel = isDark ? 'rgba(122,42,223,0.12)' : '#faf8ff';
  const border = isDark ? 'rgba(255,255,255,0.12)' : '#e8e5ed';
  const text = theme.text;
  const secondary = theme.textSecondary;
  const muted = theme.textMuted;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: surface },
    content: { paddingHorizontal: 20, paddingTop: 24, gap: 18 },
    centeredContent: { paddingHorizontal: 24, paddingTop: 34, alignItems: 'stretch', gap: 18 },
    summaryCard: {
       minHeight: 112, 
       paddingVertical: 16, 
       borderRadius: 22, 
      //  borderWidth: 1, 
      //  borderColor: border, 
       backgroundColor: panel, 
       flexDirection: 'row', 
       alignItems: 'center', 
       gap: 14, 
      //  shadowColor: '#19002f', 
      //  shadowOpacity: isDark ? 0 : 0.08, 
      //  shadowRadius: 15, 
      //  shadowOffset: { width: 0, height: 7 }, 
      //  elevation: isDark ? 0 : 3 
      },
    summaryCardCompact: { width: '100%', marginTop: 2 },
    summaryAvatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColorAlpha(0.1) },
    summaryImage: { width: '100%', height: '100%' },
    summaryCopy: { flex: 1, minWidth: 0 },
    summaryEyebrow: { color: secondary, ...fontSize.b2, },
    summaryTitle: { color: text, ...fontSize.b1, marginTop: 2 },
    summarySubtitle: { color: muted, ...fontSize.b5, lineHeight: 18, marginTop: 3 },
    summaryAmount: { color: PRIMARY_COLOR, ...fontSize.b3, lineHeight: 24 },
    sectionLabel: { color: secondary, ...fontSize.b5, lineHeight: 19, textTransform: 'uppercase', letterSpacing: 0.8 },
    methodStack: { gap: 12 },
    methodCard: { minHeight: 88, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: border, backgroundColor: panel, flexDirection: 'row', alignItems: 'center', gap: 13 },
    methodCardActive: { borderColor: PRIMARY_COLOR, backgroundColor: softPanel },
    radio: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: muted, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: PRIMARY_COLOR, borderWidth: 7 },
    radioDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffff' },
    methodIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f7f6f9', alignItems: 'center', justifyContent: 'center' },
    methodIconActive: { backgroundColor: primaryColorAlpha(0.09) },
    methodCopy: { flex: 1 },
    methodTitle: { color: text, ...fontSize.b4, lineHeight: 22 },
    methodTitleActive: { color: PRIMARY_COLOR },
    methodSubtitle: { color: muted, ...fontSize.b5, lineHeight: 19, marginTop: 3 },
    methodSubtitleActive: { color: secondary },
    detailsSection: { gap: 13 },
    fieldLabel: { color: text, ...fontSize.b5, lineHeight: 19 },
    providerRow: { flexDirection: 'row', gap: 10 },
    providerButton: { flex: 1, minHeight: 62, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: border, backgroundColor: panel, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    providerButtonActive: { borderColor: '#e8b810' },
    providerLogo: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    providerLogoText: { color: '#ffffff', fontFamily: 'Poppins_700Bold', fontSize: 9 },
    providerLabel: { color: text, fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
    phoneInputWrap: { minHeight: 64, paddingHorizontal: 16, borderRadius: 17, borderWidth: 1, borderColor: border, backgroundColor: panel, flexDirection: 'row', alignItems: 'center', gap: 12 },
    phoneInput: { flex: 1, color: text, ...fontSize.b4, lineHeight: 22, paddingVertical: 10 },
    infoBanner: { width: '100%', minHeight: 72, borderRadius: 17, paddingHorizontal: 17, paddingVertical: 15, backgroundColor: softPanel, borderWidth: 1, borderColor: isDark ? primaryColorAlpha(0.2) : '#f0eafa', flexDirection: 'row', alignItems: 'center', gap: 13 },
    infoText: { flex: 1, color: secondary, ...fontSize.b5, lineHeight: 21 },
    securityCard: { borderRadius: 22, padding: 18, gap: 22, backgroundColor: softPanel, borderWidth: 1, borderColor: isDark ? primaryColorAlpha(0.18) : '#f0ebf8' },
    securityHeadingRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    securityHeadingIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    securityHeadingCopy: { flex: 1 },
    securityTitle: { color: PRIMARY_COLOR, ...fontSize.b3, lineHeight: 25 },
    securityBody: { color: text, ...fontSize.b5, lineHeight: 21, marginTop: 7 },
    securityStats: { flexDirection: 'row', justifyContent: 'space-between' },
    securityStat: { flex: 1, alignItems: 'center', gap: 9 },
    securityStatIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: primaryColorAlpha(0.08), alignItems: 'center', justifyContent: 'center' },
    securityStatText: { color: text, fontFamily: 'Poppins_500Medium', fontSize: 11, lineHeight: 17, textAlign: 'center' },
    primaryButtonOuter: { minHeight: 62, borderRadius: 17, overflow: 'hidden' },
    primaryButton: { flex: 1, minHeight: 62, paddingHorizontal: 18, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    primaryButtonText: { color: '#ffffff', fontFamily: 'Poppins_700Bold', fontSize: 15, lineHeight: 22, textAlign: 'center' },
    buttonPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
    cancelButton: { alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 5 },
    cancelText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: 20 },
    errorText: { color: '#ef4444', fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center' },
    paystackFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    paystackPrefix: { color: muted, fontFamily: 'Poppins_400Regular', fontSize: 11 },
    paystackWordmark: { color: isDark ? '#ffffff' : '#071d42', fontFamily: 'Poppins_700Bold', fontSize: 17 },
    heroIllustration: { width: 210, height: 210, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: -2 },
    heroGlow: { position: 'absolute', width: 185, height: 185, borderRadius: 93, backgroundColor: primaryColorAlpha(isDark ? 0.18 : 0.08) },
    heroCardShape: { position: 'absolute', width: 122, height: 78, borderRadius: 13, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: 15 }] },
    heroShield: { position: 'absolute', right: 19, bottom: 35, width: 57, height: 64, borderRadius: 20, backgroundColor: panel, borderWidth: 1, borderColor: primaryColorAlpha(0.25), alignItems: 'center', justifyContent: 'center' },
    heroTitle: { color: text, fontFamily: 'Poppins_700Bold', fontSize: 27, lineHeight: 34, textAlign: 'center' },
    heroBody: { color: secondary, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 12 },
    trustList: { width: '100%', borderRadius: 20, padding: 18, gap: 11, backgroundColor: softPanel, borderWidth: 1, borderColor: isDark ? primaryColorAlpha(0.18) : '#eee7fa' },
    trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    trustText: { color: text, ...fontSize.b5, lineHeight: 20 },
    pendingIllustration: { width: 190, height: 190, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
    pendingDetailCard: { width: '100%', minHeight: 83, borderRadius: 18, backgroundColor: softPanel, borderWidth: 1, borderColor: isDark ? primaryColorAlpha(0.17) : '#f0ebf8', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
    pendingIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
    currencyIcon: { color: '#ffffff', fontFamily: 'Poppins_700Bold', fontSize: 10 },
    pendingCopy: { flex: 1 },
    pendingLabel: { color: secondary, ...fontSize.b5, lineHeight: 18 },
    pendingValue: { color: text, ...fontSize.b3, lineHeight: 25, marginTop: 2 },
    changeButton: { borderRadius: 10, borderWidth: 1, borderColor: primaryColorAlpha(0.45), paddingHorizontal: 15, paddingVertical: 10 },
    changeText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: 18 },
    waitingBlock: { alignItems: 'center', gap: 8, paddingVertical: 14 },
    waitingTitle: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: 22 },
    waitingBody: { color: secondary, ...fontSize.b5, lineHeight: 19 },
    statusRow: { width: '100%', paddingTop: 18, borderTopWidth: 1, borderTopColor: border, flexDirection: 'row', alignItems: 'center', gap: 11 },
    statusHelpIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: primaryColorAlpha(0.08), alignItems: 'center', justifyContent: 'center' },
    statusCopy: { flex: 1 },
    statusTitle: { color: text, ...fontSize.b5, lineHeight: 18 },
    statusBody: { color: secondary, fontFamily: 'Poppins_400Regular', fontSize: 10, lineHeight: 15 },
    statusButton: { minWidth: 104, minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: primaryColorAlpha(0.5), alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
    statusButtonText: { color: PRIMARY_COLOR, fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
    successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 15 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
    referenceText: { color: muted, fontFamily: 'Poppins_500Medium', fontSize: 11, textAlign: 'center', marginTop: 6 },
  });
};

export default PaymentCheckout;
