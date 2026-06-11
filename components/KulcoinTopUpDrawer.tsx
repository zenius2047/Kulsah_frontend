import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import KulsahInputBar from './KulsahInputBar';
import { fontSize } from './typography';

type KulcoinTopUpDrawerProps = {
  currentBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  warningText?: string;
};

type PaymentMethod = 'momo' | 'card';
type MomoProvider = 'mtn' | 'telecel' | 'airteltigo';

const coinPackages = [
  { id: 1, coins: 50, price: 1, label: '1 GHS' },
  { id: 2, coins: 250, price: 5, label: '5 GHS', popular: true },
  { id: 3, coins: 600, price: 10, label: '10 GHS' },
  { id: 4, coins: 1500, price: 25, label: '25 GHS' },
];
const CUSTOM_PACKAGE_ID = -1;
const BASE_COINS_PER_GHS = 50;
const KULCOIN_ICON = require('../assets/coin.png');

const KulcoinTopUpDrawer: React.FC<KulcoinTopUpDrawerProps> = ({
  currentBalance,
  isOpen,
  onClose,
  onSuccess,
  warningText = 'Insufficient Balance',
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedPackage(null);
      setIsPaymentOpen(false);
      setCustomAmount('');
      setPaymentMethod('momo');
      setMomoProvider('mtn');
      setPhoneNumber('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setPaymentError('');
    }
  }, [isOpen]);

  const customAmountValue = useMemo(() => {
    const parsed = Number.parseFloat(customAmount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [customAmount]);

  const customPkgData = useMemo(() => {
    if (customAmountValue <= 0) return null;
    return {
      id: CUSTOM_PACKAGE_ID,
      coins: Math.round(customAmountValue * BASE_COINS_PER_GHS),
      price: customAmountValue,
      label: `${customAmountValue} GHS`,
    };
  }, [customAmountValue]);

  const selectedPkgData = useMemo(() => {
    if (selectedPackage === CUSTOM_PACKAGE_ID) return customPkgData;
    return coinPackages.find((pkg) => pkg.id === selectedPackage) ?? null;
  }, [customPkgData, selectedPackage]);

  const handlePaymentSuccess = () => {
    if (!selectedPkgData) return;

    if (paymentMethod === 'momo' && phoneNumber.trim().length < 9) {
      setPaymentError('Enter your Mobile Money phone number.');
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setPaymentError('Enter all card details.');
      return;
    }

    setPaymentError('');
    onSuccess(selectedPkgData.coins);
    setIsPaymentOpen(false);
    onClose();
  };

  const overlayColor = isDark ? 'rgba(0,0,0,0.82)' : 'rgba(15,23,42,0.32)';
  const surfaceColor = isDark ? '#111114' : theme.card;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const handleColor = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.14)';
  const titleColor = theme.text;
  const mutedText = isDark ? 'rgba(255,255,255,0.45)' : theme.textSecondary;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : theme.textSecondary;
  const tertiaryText = isDark ? 'rgba(255,255,255,0.42)' : theme.textMuted;
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const customInputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)';
  const customInputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.1)';
  const selectedBg = isDark ? primaryColorAlpha(0.16) : primaryColorAlpha(0.1);
  const cancelBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';

  return (
    <>
      <Modal visible={isOpen && !isPaymentOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.modalRoot}
        >
          <Pressable style={[styles.modalBackdrop, { backgroundColor: overlayColor }]} onPress={onClose} />
          <View style={[styles.drawerCard, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: surfaceColor, borderColor }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.drawerScrollContent}
            >
              <View style={[styles.drawerHandle, { backgroundColor: handleColor }]} />

              <View style={styles.drawerHeader}>
                <View style={styles.warningRow}>
                  <MaterialIcons name="warning" size={14} color={PRIMARY_COLOR} />
                  <Text style={styles.warningText}>{warningText}</Text>
                </View>
                <Text style={[styles.drawerTitle, { color: titleColor }]}>Top Up Kulcoins</Text>
                <Text style={[styles.drawerBalance, { color: mutedText }]}>
                  Fuel your galaxy wallet. Current Balance: {currentBalance} KC
                </Text>
              </View>

              <View style={styles.packageGrid}>
                {coinPackages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackage;
                  return (
                    <Pressable
                      key={pkg.id}
                      onPress={() => setSelectedPackage(pkg.id)}
                      style={[
                        styles.packageCard,
                        { backgroundColor: cardBg, borderColor: cardBorder },
                        isSelected ? [styles.packageCardSelected, { backgroundColor: selectedBg }] : null,
                      ]}
                    >
                      {pkg.popular ? (
                        <View style={styles.bestValueChip}>
                          <Text style={styles.bestValueText}>Best Value</Text>
                        </View>
                      ) : null}
                      <View style={styles.packageIcon}>
                        <Image source={KULCOIN_ICON} style={styles.packageCoinImage} />
                      </View>
                      <Text style={[styles.packageCoins, { color: titleColor }]}>{pkg.coins}</Text>
                      <Text style={[styles.packageLabel, { color: tertiaryText }]}>{pkg.label}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setSelectedPackage(CUSTOM_PACKAGE_ID)}
                  style={[
                    styles.customCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    selectedPackage === CUSTOM_PACKAGE_ID
                      ? [styles.packageCardSelected, { backgroundColor: selectedBg }]
                      : null,
                  ]}
                >
                  <View style={styles.customHeader}>
                    <View style={styles.packageIcon}>
                      <MaterialIcons name="edit" size={22} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.customCopy}>
                      <Text style={[styles.customTitle, { color: titleColor }]}>Custom Amount</Text>
                      <Text style={[styles.customSubtitle, { color: mutedText }]}>
                        Set your own orbit boost for the Kulcoin universe
                      </Text>
                    </View>
                  </View>
                  <KulsahInputBar
                      value={customAmount}
                      onFocus={() => setSelectedPackage(CUSTOM_PACKAGE_ID)}
                      onChangeText={(value) => {
                        const sanitized = value.replace(/[^0-9.]/g, '');
                        setCustomAmount(sanitized);
                        setSelectedPackage(CUSTOM_PACKAGE_ID);
                      }}
                      keyboardType="decimal-pad"
                      placeholder="Enter amount"
                      placeholderTextColor={tertiaryText}
                      containerStyle={[styles.customInputWrap, { backgroundColor: customInputBg, borderColor: customInputBorder }]}
                      inputStyle={[styles.customInput, { color: titleColor }]}
                      leftAccessory={<Text style={styles.customCurrency}>GHS</Text>}
                    />
                  <Text style={[styles.customEstimate, { color: mutedText }]}>
                    {customPkgData
                      ? `You will receive about ${customPkgData.coins} KC`
                      : 'Minimum purchase must be greater than 0 GHS'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.drawerActions}>
                <Pressable
                  onPress={() => {
                    if (selectedPkgData) {
                      setPaymentError('');
                      setIsPaymentOpen(true);
                    }
                  }}
                  disabled={!selectedPkgData}
                  style={[styles.purchaseButton, !selectedPkgData ? styles.buttonDisabled : null]}
                >
                  <Text style={styles.purchaseButtonText}>Purchase</Text>
                  <MaterialIcons name="payments" size={20} color="#ffffff" />
                </Pressable>

                <Pressable onPress={onClose} style={styles.cancelTransactionButton}>
                  <Text style={[styles.cancelTransactionText, {color: isDark ? 'white': 'black'}]}>Cancel Transaction</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isOpen && isPaymentOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsPaymentOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.modalRoot}
        >
          <Pressable style={[styles.modalBackdrop, { backgroundColor: overlayColor }]} onPress={() => setIsPaymentOpen(false)} />
            <View style={[styles.paymentCard, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: surfaceColor, borderColor }]}>
            <View style={[styles.drawerHandle, { backgroundColor: handleColor }]} />
            <View style={styles.paymentHeader}>
              <Text style={[styles.paymentTitle, { color: titleColor }]}>Payment Gateway</Text>
              <Text style={[styles.paymentSubtitle, { color: mutedText }]}>
                Choose a launch path for your galaxy top-up
              </Text>
            </View>
            {selectedPkgData ? (
              <View style={[styles.paymentSummary, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: secondaryText }]}>Package</Text>
                  <Text style={[styles.paymentValue, { color: titleColor }]}>{selectedPkgData.coins} Kulcoins</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: secondaryText }]}>Amount</Text>
                  <Text style={styles.paymentAccent}>{selectedPkgData.price} GHS</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.paymentMethodRow}>
              {[
                { key: 'momo', label: 'Mobile Money', icon: 'phone-iphone' },
                { key: 'card', label: 'Card', icon: 'credit-card' },
              ].map((method) => {
                const selected = paymentMethod === method.key;
                return (
                  <Pressable
                    key={method.key}
                    onPress={() => {
                      setPaymentMethod(method.key as PaymentMethod);
                      setPaymentError('');
                    }}
                    style={[
                      styles.paymentMethod,
                      {
                        backgroundColor: selected ? primaryColorAlpha(0.12) : cardBg,
                        borderColor: selected ? PRIMARY_COLOR : borderColor,
                      },
                    ]}
                  >
                    <MaterialIcons name={method.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={selected ? PRIMARY_COLOR : secondaryText} />
                    <Text style={[styles.paymentMethodText, { color: selected ? PRIMARY_COLOR : secondaryText }]}>{method.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {paymentMethod === 'momo' ? (
              <View style={styles.paymentDetails}>
                <View style={styles.providerRow}>
                  {[
                    { key: 'mtn', label: 'MTN MoMo', color: '#fbbf24' },
                    { key: 'telecel', label: 'Telecel', color: '#ef4444' },
                    { key: 'airteltigo', label: 'AirtelTigo', color: '#2563eb' },
                  ].map((provider) => {
                    const selected = momoProvider === provider.key;
                    return (
                      <Pressable
                        key={provider.key}
                        onPress={() => {
                          setMomoProvider(provider.key as MomoProvider);
                          setPaymentError('');
                        }}
                        style={[
                          styles.providerChip,
                          {
                            backgroundColor: selected ? provider.color : cardBg,
                            borderColor: selected ? provider.color : borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.providerText, { color: selected ? '#ffffff' : secondaryText }]}>{provider.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.paymentInputLabel, { color: secondaryText }]}>Mobile Money Number</Text>
                <KulsahInputBar
                  value={phoneNumber}
                  onChangeText={(value) => {
                    setPhoneNumber(value.replace(/[^0-9+]/g, ''));
                    setPaymentError('');
                  }}
                  keyboardType="phone-pad"
                  placeholder="024XXXXXXX"
                  placeholderTextColor={tertiaryText}
                  containerStyle={[styles.paymentInputWrap, { backgroundColor: customInputBg, borderColor: customInputBorder }]}
                  inputStyle={[styles.paymentInput, { color: titleColor }]}
                />
              </View>
            ) : null}

            {paymentMethod === 'card' ? (
              <View style={styles.paymentDetails}>
                <Text style={[styles.paymentInputLabel, { color: secondaryText }]}>Card Number</Text>
                <KulsahInputBar
                  value={cardNumber}
                  onChangeText={(value) => {
                    setCardNumber(value.replace(/[^0-9 ]/g, ''));
                    setPaymentError('');
                  }}
                  keyboardType="number-pad"
                  placeholder="4111 2222 3333 4444"
                  placeholderTextColor={tertiaryText}
                  containerStyle={[styles.paymentInputWrap, { backgroundColor: customInputBg, borderColor: customInputBorder }]}
                  inputStyle={[styles.paymentInput, { color: titleColor }]}
                />
                <View style={styles.cardFieldRow}>
                  <KulsahInputBar
                    value={cardExpiry}
                    onChangeText={(value) => {
                      setCardExpiry(value.replace(/[^0-9/]/g, ''));
                      setPaymentError('');
                    }}
                    maxLength={5}
                    placeholder="MM/YY"
                    placeholderTextColor={tertiaryText}
                    containerStyle={[styles.cardSmallInputWrap, { backgroundColor: customInputBg, borderColor: customInputBorder }]}
                    inputStyle={[styles.paymentInput, styles.centeredPaymentInput, { color: titleColor }]}
                  />
                  <KulsahInputBar
                    value={cardCvv}
                    onChangeText={(value) => {
                      setCardCvv(value.replace(/[^0-9]/g, ''));
                      setPaymentError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                    placeholder="CVV"
                    placeholderTextColor={tertiaryText}
                    containerStyle={[styles.cardSmallInputWrap, { backgroundColor: customInputBg, borderColor: customInputBorder }]}
                    inputStyle={[styles.paymentInput, styles.centeredPaymentInput, { color: titleColor }]}
                  />
                </View>
              </View>
            ) : null}

            {paymentError ? <Text style={styles.paymentError}>{paymentError}</Text> : null}

            <Pressable onPress={handlePaymentSuccess} style={styles.purchaseButton}>
              <Text style={styles.purchaseButtonText}>Pay {selectedPkgData ? selectedPkgData.price : 0} GHS</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={() => setIsPaymentOpen(false)}
              style={[styles.cancelPaymentButton, { backgroundColor: cancelBg }]}
            >
              <Text style={[styles.cancelPaymentText, { color: secondaryText }]}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  drawerCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    backgroundColor: '#111114',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  drawerScrollContent: {
    paddingTop: 14,
  },
  drawerHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  drawerHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningText: {
    color: PRIMARY_COLOR,
    ...fontSize.h2, lineHeight: fontSize.h2.fontSize + 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  drawerTitle: {
    color: '#ffffff',
    ...fontSize.h1, lineHeight: fontSize.h1.fontSize + 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  drawerBalance: {
    color: 'rgba(255,255,255,0.45)',
    ...fontSize.h2, lineHeight: fontSize.h2.fontSize + 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  packageCard: {
    width: '48%',
    alignItems: 'center',
    gap: 6,
    borderRadius: 26,
    paddingHorizontal: 7,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  packageCardSelected: {
    backgroundColor: primaryColorAlpha(0.16),
    borderColor: PRIMARY_COLOR,
  },
  customCard: {
    width: '100%',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customCopy: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  customTitle: {
    color: '#ffffff',
    ...fontSize.h1, lineHeight: fontSize.h1.fontSize + 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  customSubtitle: {
    color: 'rgba(255,255,255,0.48)',
    ...fontSize.h2, lineHeight: fontSize.h2.fontSize + 2,
    textAlign: 'center',
  },
  customInputWrap: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customCurrency: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  customInput: {
    flex: 1,
    color: '#ffffff',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    paddingVertical: 0,
  },
  customEstimate: {
    color: 'rgba(255,255,255,0.56)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  bestValueChip: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  bestValueText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  packageIcon: {
    width: 48,
    height: 48,
    // borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: primaryColorAlpha(0.12),
  },
  packageCoinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  packageCoins: {
    color: '#ffffff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
  },
  packageLabel: {
    color: 'rgba(255,255,255,0.42)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  drawerActions: {
    gap: 14,
    marginTop: 24,
  },
  purchaseButton: {
    minHeight: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: PRIMARY_COLOR,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  cancelTransactionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelTransactionText: {
    color: 'rgba(255,255,255,0.26)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  paymentCard: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#111114',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  paymentTitle: {
    color: '#ffffff',
    textAlign: 'center',
    ...fontSize.h1, lineHeight: fontSize.h1.fontSize + 2,
    textTransform: 'uppercase',
  },
  paymentSubtitle: {
    textAlign: 'center',
    ...fontSize.h2, lineHeight: fontSize.h2.fontSize + 2,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  paymentSummary: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    color: 'rgba(255,255,255,0.5)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  paymentValue: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  paymentAccent: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  paymentMethod: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paymentMethodText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentDetails: {
    gap: 10,
    marginBottom: 16,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  providerText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  paymentInputLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  paymentInputWrap: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  paymentInput: {
    flex: 1,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    paddingVertical: 0,
  },
  cardFieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardSmallInputWrap: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  centeredPaymentInput: {
    textAlign: 'center',
  },
  paymentError: {
    color: '#ef4444',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  cancelPaymentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelPaymentText: {
    color: 'rgba(255,255,255,0.5)',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

export default KulcoinTopUpDrawer;
