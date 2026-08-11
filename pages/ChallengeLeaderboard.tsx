import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { user, User } from '../types';
import PaymentGateway from '../components/PaymentGateway';
import { fontSize } from '../typography';

type LeaderboardTab = 'rankings' | 'rules' | 'prizes';
type BoostPaymentMethod = 'momo' | 'kc' | 'card';
type MomoProvider = 'mtn' | 'telecel' | 'at';
type BoostStage = 'input' | 'processing' | 'momo_otp' | 'success';
type BoostInputStep = 'payload' | 'payment';

type BoostPackage = {
  id: string;
  name: string;
  votes: number;
  priceGhc: number;
  kcEquivalent: number;
  badge: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: readonly [string, string];
};

type BoostUser = User & { balance?: number };

const topThree = [
  { rank: 2, name: 'MusicLover99', votes: '12.8k', avatar: 'https://picsum.photos/seed/fan1/200' },
  {
    rank: 1,
    name: 'Champion Fan',
    votes: '15.4k',
    avatar: 'https://picsum.photos/seed/fan2/200',
    isWinner: true,
  },
  { rank: 3, name: 'BassMaster', votes: '10.2k', avatar: 'https://picsum.photos/seed/fan3/200' },
];

const globalRankings = [
  {
    rank: 4,
    name: 'MelodyJane',
    votes: '8.9k',
    avatar: 'https://picsum.photos/seed/fan4/200',
    entry: 'https://picsum.photos/seed/e1/100',
  },
  {
    rank: 5,
    name: 'RetroVibe_X',
    votes: '7.4k',
    avatar: 'https://picsum.photos/seed/fan5/200',
    entry: 'https://picsum.photos/seed/e2/100',
  },
  {
    rank: 6,
    name: 'DigitalGhost',
    votes: '6.1k',
    avatar: 'https://picsum.photos/seed/fan6/200',
    entry: 'https://picsum.photos/seed/e3/100',
  },
  {
    rank: 7,
    name: 'NeonDancer',
    votes: '5.8k',
    avatar: 'https://picsum.photos/seed/fan7/200',
    entry: 'https://picsum.photos/seed/e4/100',
  },
];

const rules = [
  {
    title: 'Original Content',
    desc: 'All submissions must be your own original work or a remix of the provided stems.',
  },
  {
    title: 'Video Format',
    desc: 'Videos should be between 15-60 seconds in vertical 9:16 format.',
  },
  {
    title: 'No Explicit Content',
    desc: 'Keep it clean. Any offensive or explicit content will be disqualified immediately.',
  },
  {
    title: 'Voting Period',
    desc: 'Voting remains open until the challenge deadline. One vote per user per day.',
  },
];

const prizes = [
  {
    rank: 'Grand Prize',
    prize: '$1,000 + Studio Session',
    desc: 'The ultimate winner gets a cash prize and a 4-hour studio session with the creator.',
    colors: ['#fbbf24', '#f97316'] as const,
    icon: 'workspace-premium' as const,
  },
  {
    rank: 'Runner Up',
    prize: '$500 + Signed Merch',
    desc: 'Second place receives a cash prize and a limited edition signed merchandise bundle.',
    colors: ['#cbd5e1', '#64748b'] as const,
    icon: 'military-tech' as const,
  },
  {
    rank: 'Third Place',
    prize: '$250 + Shoutout',
    desc: "Third place gets a cash prize and a permanent shoutout on the creator's main profile.",
    colors: ['#d97706', '#92400e'] as const,
    icon: 'stars' as const,
  },
];

const tabItems: { key: LeaderboardTab; label: string }[] = [
  { key: 'rankings', label: 'Rankings' },
  { key: 'rules', label: 'Rules' },
  { key: 'prizes', label: 'Prizes' },
];

const boostPackages: BoostPackage[] = [
  { id: 'b1', name: 'Starter Spark', votes: 150, priceGhc: 10, kcEquivalent: 50, badge: 'Popular for Beginners', icon: 'bolt', colors: ['rgba(59,130,246,0.2)', 'rgba(6,182,212,0.05)'] },
  { id: 'b2', name: 'Rapid Boost', votes: 500, priceGhc: 25, kcEquivalent: 120, badge: 'Best Value', icon: 'rocket-launch', colors: ['rgba(168,85,247,0.3)', 'rgba(244,63,94,0.05)'] },
  { id: 'b3', name: 'Stratosphere Surge', votes: 1200, priceGhc: 50, kcEquivalent: 240, badge: 'Creator Recommends', icon: 'cyclone', colors: ['rgba(245,158,11,0.3)', 'rgba(249,115,22,0.05)'] },
  { id: 'b4', name: 'Cosmic Supernova', votes: 3500, priceGhc: 120, kcEquivalent: 500, badge: 'Insane Results', icon: 'star-rate', colors: ['rgba(236,72,153,0.4)', 'rgba(139,92,246,0.1)'] },
];

const getBoostRank = (packageId: string) => {
  if (packageId === 'b1') return 19;
  if (packageId === 'b2') return 12;
  if (packageId === 'b3') return 6;
  return 2;
};

const formatVotes = (votes: number) => {
  if (votes >= 1000) return `${(votes / 1000).toFixed(1)}k`;
  return `${votes}`;
};

const BoostEntryDialog = ({
  isOpen,
  onClose,
  currentUser,
  currentRank,
  baseVotes,
  onBoostApplied,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: BoostUser | null;
  currentRank: number;
  baseVotes: number;
  onBoostApplied: (votesAdded: number, updatedRank: number) => void;
}) => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [selectedPackage, setSelectedPackage] = useState<BoostPackage>(boostPackages[1]);
  const [paymentMethod, setPaymentMethod] = useState<BoostPaymentMethod>('momo');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [stage, setStage] = useState<BoostStage>('input');
  const [inputStep, setInputStep] = useState<BoostInputStep>('payload');
  const [processingStatus, setProcessingStatus] = useState('');
  const [countdown, setCountdown] = useState(15);
  const [otpInput, setOtpInput] = useState('');
  const [errorText, setErrorText] = useState('');
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);

  const availableBalance = currentUser?.balance ?? 1250;
  const updatedRank = getBoostRank(selectedPackage.id);
  const boostedTotal = baseVotes + selectedPackage.votes;
  const canDismiss = stage !== 'processing' && stage !== 'momo_otp';
  const surface = isDark ? '#0f0f12' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const muted = isDark ? 'rgba(255,255,255,0.46)' : '#64748b';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';

  useEffect(() => {
    if (!isOpen) return;
    setStage('input');
    setInputStep('payload');
    setSelectedPackage(boostPackages[1]);
    setPaymentMethod('momo');
    setMomoProvider('mtn');
    setPhoneNumber('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setOtpInput('');
    setCountdown(15);
    setErrorText('');
    setPaymentGatewayOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (stage !== 'momo_otp') return;
    if (countdown === 0) {
      handleOtpVerify();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, stage]);

  const completeBoost = () => {
    setStage('success');
    onBoostApplied(selectedPackage.votes, updatedRank);
  };

  const handleContinueToPayment = () => {
    setErrorText('');
    setPaymentGatewayOpen(true);
  };

  const handleBackToPayload = () => {
    setErrorText('');
    setInputStep('payload');
  };

  const handleStartPayment = () => {
    setErrorText('');
    if (paymentMethod === 'momo' && !phoneNumber.trim()) {
      setErrorText('Enter your Mobile Money phone number.');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setErrorText('Enter all card details.');
      return;
    }
    if (paymentMethod === 'kc' && availableBalance < selectedPackage.kcEquivalent) {
      setErrorText(`Insufficient balance. You need ${selectedPackage.kcEquivalent} KC.`);
      return;
    }

    setStage('processing');
    setProcessingStatus('Connecting to Ghana National Payment Gateway...');

    setTimeout(() => {
      if (paymentMethod === 'momo') {
        setProcessingStatus(`Sending Instant USSD Push Request to ${phoneNumber}...`);
        setTimeout(() => {
          setStage('momo_otp');
          setCountdown(15);
        }, 1500);
        return;
      }

      setProcessingStatus('Securing Payment Reference Code & Authorizing...');
      setTimeout(() => {
        setProcessingStatus('Finalizing Boost Sequence Allocation...');
        setTimeout(completeBoost, 1500);
      }, 1500);
    }, 1500);
  };

  const handleOtpVerify = () => {
    setStage('processing');
    setProcessingStatus('Verifying secret Momo transaction hash...');
    setTimeout(() => {
      setProcessingStatus('Allocating live votes to SuperFan_01 index...');
      setTimeout(completeBoost, 1500);
    }, 1500);
  };

  const closeAfterSuccess = () => {
    onClose();
  };

  return (
    <>
    <Modal visible={isOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => canDismiss && onClose()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.boostModalRoot}>
        <Pressable style={styles.boostBackdrop} onPress={() => canDismiss && onClose()} />
        <View style={[styles.boostSheet, { backgroundColor: surface, borderColor: border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[styles.boostHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0' }]} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.boostScrollContent}>
            {stage === 'input' ? (
              <View style={styles.boostStackLarge}>
                <View style={styles.boostHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.boostTitle, { color: theme.text }]}>Boost Your Entry</Text>
                    <Text style={[styles.boostSubtitle, { color: muted }]}>Rocket up the leaderboard & dominate the orbit</Text>
                  </View>
                  <Pressable onPress={onClose} style={[styles.boostClose, { backgroundColor: inputBg }]}>
                    <MaterialIcons name="close" size={20} color={muted} />
                  </Pressable>
                </View>

                <LinearGradient colors={[primaryColorAlpha(0.1), 'rgba(236,72,153,0.1)']} style={styles.boostStatusCard}>
                  <View style={styles.boostStatusLeft}>
                    <Image source={{ uri: 'https://picsum.photos/seed/user/200' }} style={styles.boostStatusAvatar} />
                    <View>
                      <Text style={[styles.boostStatusName, { color: theme.text }]}>SuperFan_01</Text>
                      <Text style={styles.boostStatusRank}>Current Standing: Rank #{currentRank}</Text>
                    </View>
                  </View>
                  <View style={styles.boostStatusVotes}>
                    <Text style={[styles.boostStatusVoteValue, { color: theme.text }]}>{baseVotes.toLocaleString()}</Text>
                    <Text style={[styles.boostTinyMuted, { color: muted }]}>Base Votes</Text>
                  </View>
                </LinearGradient>

                {inputStep === 'payload' ? (
                  <>
                    {/* <View style={styles.boostStepPills}>
                      <View style={styles.boostStepPillActive}>
                        <Text style={styles.boostStepPillTextActive}>1 Payload</Text>
                      </View>
                      <View style={[styles.boostStepPill, { borderColor: border }]}>
                        <Text style={[styles.boostStepPillText, { color: muted }]}>2 Payment</Text>
                      </View>
                    </View> */}

                    <View style={styles.boostStack}>
                      <Text style={[styles.boostSectionLabel, { color: muted }]}>Select Galaxy Boost Payload</Text>
                      <ScrollView style={styles.boostPackageScroller} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        <View style={styles.boostStackSmall}>
                          {boostPackages.map((pkg) => {
                            const selected = selectedPackage.id === pkg.id;
                            return (
                              <Pressable
                                key={pkg.id}
                                onPress={() => setSelectedPackage(pkg)}
                                style={[styles.boostPackageCard, { borderColor: selected ? PRIMARY_COLOR : border }]}
                              >
                                <LinearGradient colors={pkg.colors} style={StyleSheet.absoluteFillObject} />
                                <View style={styles.boostPackageLeft}>
                                  <View style={[styles.boostPackageIcon, { backgroundColor: selected ? PRIMARY_COLOR : inputBg }]}>
                                    <MaterialIcons name={pkg.icon} size={22} color={selected ? '#ffffff' : muted} />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <View style={styles.boostPackageTitleRow}>
                                      <Text style={[styles.boostPackageName, { color: selected ? PRIMARY_COLOR : theme.text }]}>{pkg.name}</Text>
                                      <Text style={styles.boostVotesChip}>+{pkg.votes} Votes</Text>
                                    </View>
                                    <Text style={[styles.boostTinyMuted, { color: muted }]}>{pkg.badge}</Text>
                                  </View>
                                </View>
                                <View style={styles.boostPriceBlock}>
                                  <Text style={[styles.boostPrice, { color: theme.text }]}>GHc{pkg.priceGhc}</Text>
                                  <Text style={[styles.boostTinyMuted, { color: muted }]}>or {pkg.kcEquivalent} KC</Text>
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    <Pressable onPress={handleContinueToPayment} style={styles.boostPayButton}>
                      <Text style={styles.boostPayButtonText}>Continue to Payment</Text>
                      <MaterialIcons name="arrow-forward" size={16} color="#ffffff" />
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* <View style={styles.boostStepPills}>
                      <Pressable onPress={handleBackToPayload} style={[styles.boostStepPill, { borderColor: border }]}>
                        <Text style={[styles.boostStepPillText, { color: muted }]}>1 Payload</Text>
                      </Pressable>
                      <View style={styles.boostStepPillActive}>
                        <Text style={styles.boostStepPillTextActive}>2 Payment</Text>
                      </View>
                    </View> */}

                    <View style={[styles.boostSelectedPayload, { backgroundColor: inputBg, borderColor: border }]}>
                      <View style={styles.boostPackageLeft}>
                        <View style={[styles.boostPackageIcon, { backgroundColor: PRIMARY_COLOR }]}>
                          <MaterialIcons name={selectedPackage.icon} size={22} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.boostPackageName, { color: theme.text }]}>{selectedPackage.name}</Text>
                          <Text style={[styles.boostTinyMuted, { color: muted }]}>+{selectedPackage.votes} votes selected</Text>
                        </View>
                      </View>
                      <View style={styles.boostPriceBlock}>
                        <Text style={[styles.boostPrice, { color: theme.text }]}>GHc{selectedPackage.priceGhc}</Text>
                        <Pressable onPress={handleBackToPayload}>
                          <Text style={styles.boostChangeText}>Change</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.boostStack}>
                      <Text style={[styles.boostSectionLabel, { color: muted }]}>Choose Payment Pipeline</Text>
                      <View style={styles.boostPaymentGrid}>
                        {([
                          { key: 'momo', icon: 'sms', label: 'Momo' },
                          { key: 'kc', icon: 'toll', label: 'Kulcoins' },
                          { key: 'card', icon: 'credit-card', label: 'Card' },
                        ] as const).map((method) => {
                          const selected = paymentMethod === method.key;
                          return (
                            <Pressable
                              key={method.key}
                              onPress={() => setPaymentMethod(method.key)}
                              style={[styles.boostPaymentButton, { borderColor: selected ? PRIMARY_COLOR : border, backgroundColor: selected ? primaryColorAlpha(0.08) : 'transparent' }]}
                            >
                              <MaterialIcons name={method.icon} size={19} color={selected ? PRIMARY_COLOR : muted} />
                              <Text style={[styles.boostPaymentText, { color: selected ? PRIMARY_COLOR : muted }]}>{method.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {paymentMethod === 'momo' ? (
                      <View style={styles.boostStack}>
                        <View style={styles.boostProviderRow}>
                          {(['mtn', 'telecel', 'at'] as const).map((provider) => {
                            const selected = momoProvider === provider;
                            return (
                              <Pressable
                                key={provider}
                                onPress={() => setMomoProvider(provider)}
                                style={[styles.boostProviderButton, { borderColor: selected ? 'transparent' : border, backgroundColor: selected ? (isDark ? '#ffffff' : '#111827') : 'transparent' }]}
                              >
                                <Text style={[styles.boostProviderText, { color: selected ? (isDark ? '#000000' : '#ffffff') : muted }]}>
                                  {provider === 'mtn' ? 'MTN MoMo' : provider === 'telecel' ? 'Telecel' : 'AT Money'}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <Text style={[styles.boostInputLabel, { color: muted }]}>Mobile Money Phone Number</Text>
                        <TextInput includeFontPadding={false}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          placeholder="e.g. 054 123 4567"
                          placeholderTextColor={muted}
                          style={[styles.boostInput, { backgroundColor: inputBg, borderColor: border, color: theme.text }]}
                        />
                      </View>
                    ) : null}

                    {paymentMethod === 'kc' ? (
                      <View style={styles.boostKcCard}>
                        <Text style={styles.boostKcTitle}>Pay with KulCoins</Text>
                        <Text style={[styles.boostKcBalance, { color: theme.text }]}>{availableBalance} KC <Text style={{ color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }}>Available</Text></Text>
                        <Text style={[styles.boostTinyMuted, { color: muted }]}>Deductible for this pay: {selectedPackage.kcEquivalent} KC</Text>
                      </View>
                    ) : null}

                    {paymentMethod === 'card' ? (
                      <View style={styles.boostStack}>
                        <Text style={[styles.boostInputLabel, { color: muted }]}>Card Number</Text>
                        <TextInput includeFontPadding={false} value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={19} placeholder="4111 2222 3333 4444" placeholderTextColor={muted} style={[styles.boostInput, { backgroundColor: inputBg, borderColor: border, color: theme.text }]} />
                        <View style={styles.boostCardInputRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.boostInputLabel, { color: muted }]}>Expiry Date</Text>
                            <TextInput includeFontPadding={false} value={cardExpiry} onChangeText={setCardExpiry} maxLength={5} placeholder="MM/YY" placeholderTextColor={muted} style={[styles.boostInput, styles.boostCenteredInput, { backgroundColor: inputBg, borderColor: border, color: theme.text }]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.boostInputLabel, { color: muted }]}>CVV Code</Text>
                            <TextInput includeFontPadding={false} value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" maxLength={3} secureTextEntry placeholder="***" placeholderTextColor={muted} style={[styles.boostInput, styles.boostCenteredInput, { backgroundColor: inputBg, borderColor: border, color: theme.text }]} />
                          </View>
                        </View>
                      </View>
                    ) : null}

                    {errorText ? <Text style={styles.boostError}>{errorText}</Text> : null}
                    <View style={styles.boostActionRow}>
                      <Pressable onPress={handleBackToPayload} style={[styles.boostBackButton, { borderColor: border }]}>
                        <MaterialIcons name="arrow-back" size={16} color={muted} />
                        <Text style={[styles.boostBackButtonText, { color: muted }]}>Back</Text>
                      </Pressable>
                      <Pressable onPress={handleStartPayment} style={[styles.boostPayButton, styles.boostActionPayButton]}>
                        <Text style={styles.boostPayButtonText}>Authorize GHc{selectedPackage.priceGhc}</Text>
                        <MaterialIcons name="bolt" size={16} color="#ffffff" />
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ) : null}

            {stage === 'processing' ? (
              <View style={styles.boostStageWrap}>
                <View style={styles.boostSpinnerWrap}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                </View>
                <Text style={[styles.boostStageTitle, { color: theme.text }]}>Processing Payload</Text>
                <Text style={[styles.boostStageBody, { color: muted }]}>{processingStatus}</Text>
              </View>
            ) : null}

            {stage === 'momo_otp' ? (
              <View style={styles.boostStackLarge}>
                <View style={styles.boostOtpIcon}>
                  <MaterialIcons name="sms" size={34} color="#f59e0b" />
                </View>
                <Text style={[styles.boostStageTitle, { color: theme.text }]}>Momo Authorization Sent</Text>
                <Text style={[styles.boostStageBody, { color: muted }]}>
                  We sent a secure USSD push request to {phoneNumber}. Authorize on your phone, then enter the 4-digit reference code.
                </Text>
                <TextInput includeFontPadding={false}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  maxLength={4}
                  keyboardType="number-pad"
                  placeholder="5241"
                  placeholderTextColor={muted}
                  style={[styles.boostOtpInput, { backgroundColor: inputBg, borderColor: border, color: theme.text }]}
                />
                <Pressable onPress={handleOtpVerify} style={[styles.boostDarkButton, { backgroundColor: isDark ? '#ffffff' : '#111827' }]}>
                  <Text style={[styles.boostDarkButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>Confirm Authorization</Text>
                </Pressable>
                <Text style={[styles.boostCountdown, { color: muted }]}>Auto-Verifying in <Text style={{ color: PRIMARY_COLOR }}>{countdown}s</Text></Text>
              </View>
            ) : null}

            {stage === 'success' ? (
              <View style={styles.boostStageWrap}>
                <View style={styles.boostSuccessIcon}>
                  <MaterialIcons name="upgrade" size={54} color="#ffffff" />
                </View>
                <Text style={[styles.boostSuccessTitle, { color: theme.text }]}>Power Boost Successful!</Text>
                <Text style={[styles.boostStageBody, { color: muted }]}>
                  Your entry has been upgraded with +{selectedPackage.votes} verified votes.
                </Text>
                <View style={[styles.boostSuccessStats, { backgroundColor: inputBg, borderColor: border }]}>
                  <View style={styles.boostSuccessStat}>
                    <Text style={[styles.boostTinyMuted, { color: muted }]}>New Standings</Text>
                    <Text style={styles.boostSuccessNumber}>{boostedTotal.toLocaleString()}</Text>
                    <Text style={[styles.boostTinyMuted, { color: muted }]}>Total Votes</Text>
                  </View>
                  <View style={[styles.boostSuccessStat, { borderLeftColor: border, borderLeftWidth: 1 }]}>
                    <Text style={[styles.boostTinyMuted, { color: muted }]}>Rank Boosted</Text>
                    <Text style={styles.boostRankMove}>{`#${currentRank} -> #${updatedRank}`}</Text>
                    <Text style={styles.boostRankGain}>Up {currentRank - updatedRank} Spots!</Text>
                  </View>
                </View>
                <Pressable onPress={closeAfterSuccess} style={[styles.boostDarkButton, { backgroundColor: isDark ? '#ffffff' : '#111827' }]}>
                  <Text style={[styles.boostDarkButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>View Updated Rankings</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    <PaymentGateway
      isOpen={isOpen && paymentGatewayOpen}
      onClose={() => setPaymentGatewayOpen(false)}
      onSuccess={() => {
        setPaymentGatewayOpen(false);
        completeBoost();
      }}
      amount={selectedPackage.priceGhc}
      currency="GHS"
      itemName={`${selectedPackage.name} - ${selectedPackage.votes} Votes`}
      allowedMethods={['momo', 'card', 'bank', 'kulcoins']}
      walletBalance={availableBalance}
    />
    </>
  );
};

const ChallengeLeaderboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('rankings');
  const [boostOpen, setBoostOpen] = useState(false);
  const [userRank, setUserRank] = useState(24);
  const [userVotes, setUserVotes] = useState(2100);

  const screenBg = isDark ? '#07080d' : '#f8fafc';
  const headerBg = isDark ? 'rgba(7,8,13,0.86)' : 'rgba(248,250,252,0.92)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const mutedText = isDark ? 'rgba(255,255,255,0.42)' : '#64748b';
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]} edges={['left', 'right']}>
      <View style={[styles.screen, { backgroundColor: screenBg }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: headerBg,
              borderBottomColor: borderColor,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          {/* <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.headerButton, { backgroundColor: softSurface, borderColor }]}
          >
            <MaterialIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable> */}

          <Text style={[styles.headerTitle, { color: theme.text }]}>Orbit Leaderboard</Text>

          <Pressable style={[styles.headerButton, { backgroundColor: softSurface, borderColor }]}>
            <MaterialIcons name="share" size={22} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom + 120,
            gap: 24,
          }}
        >
          <View style={[styles.tabWrap, { backgroundColor: softSurface, borderColor }]}>
            {tabItems.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    active
                      ? {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                        }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? PRIMARY_COLOR : mutedText },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'rankings' ? (
            <View style={styles.sectionGap}>
              <View style={styles.podiumRow}>
                <View style={styles.sidePodiumItem}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: topThree[0].avatar }} style={styles.sidePodiumAvatar} />
                    <View style={[styles.placeBadge, { backgroundColor: '#cbd5e1' }]}>
                      <Text style={[styles.placeBadgeText, { color: '#0f172a' }]}>2nd</Text>
                    </View>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.sidePodiumName, { color: theme.text }]}>{topThree[0].name}</Text>
                    <Text style={styles.voteAccent}>{topThree[0].votes} Votes</Text>
                  </View>
                </View>

                <View style={styles.winnerPodiumItem}>
                  <MaterialIcons name="emoji-events" size={34} color={PRIMARY_COLOR} style={styles.trophyIcon} />
                  <View style={styles.winnerAvatarRing}>
                    <Image source={{ uri: topThree[1].avatar }} style={styles.winnerAvatar} />
                  </View>
                  <View style={[styles.placeBadge, styles.winnerBadge]}>
                    <Text style={styles.winnerBadgeText}>#1</Text>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.winnerName, { color: theme.text }]}>{topThree[1].name}</Text>
                    <Text style={styles.winnerVotes}>{topThree[1].votes} Votes</Text>
                  </View>
                </View>

                <View style={styles.sidePodiumItem}>
                  <View style={styles.podiumAvatarWrap}>
                    <Image source={{ uri: topThree[2].avatar }} style={[styles.sidePodiumAvatar, styles.thirdAvatar]} />
                    <View style={[styles.placeBadge, { backgroundColor: '#b45309' }]}>
                      <Text style={styles.winnerBadgeText}>3rd</Text>
                    </View>
                  </View>
                  <View style={styles.centerAlign}>
                    <Text style={[styles.sidePodiumName, { color: theme.text }]}>{topThree[2].name}</Text>
                    <Text style={styles.voteAccent}>{topThree[2].votes} Votes</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionGap}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Global Rankings</Text>
                <View style={styles.sectionGapSmall}>
                  {globalRankings.map((fan) => (
                    <View
                      key={fan.rank}
                      style={[
                        styles.rankCard,
                        {
                          backgroundColor: softSurface,
                          borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.rankNumber, { color: mutedText }]}>{fan.rank}</Text>
                      <Image source={{ uri: fan.avatar }} style={[styles.rankAvatar, { borderColor }]} />
                      <View style={styles.rankCopy}>
                        <Text style={[styles.rankName, { color: theme.text }]}>{fan.name}</Text>
                        <Text style={[styles.rankVotes, { color: mutedText }]}>{fan.votes} votes</Text>
                      </View>
                      <Image source={{ uri: fan.entry }} style={[styles.entryThumb, { borderColor }]} />
                      <Pressable style={styles.heartButton}>
                        <MaterialIcons name="favorite" size={20} color={PRIMARY_COLOR} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              <LinearGradient
                colors={[PRIMARY_COLOR, '#db2777'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.userRankCard}
              >
                <View style={styles.userGlow} />
                <View style={styles.userRankContent}>
                  <View style={styles.userRankLeft}>
                    <Text style={styles.userRankNumber}>{userRank}</Text>
                    <Image source={{ uri: 'https://picsum.photos/seed/user/200' }} style={styles.userAvatar} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userName}>You (SuperFan_01)</Text>
                      <Text style={styles.userStats}>{formatVotes(userVotes)} votes * Top 15%</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setBoostOpen(true)} style={styles.boostButton}>
                    <Text style={styles.boostButtonText}>Boost Entry</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          ) : null}

          {activeTab === 'rules' ? (
            <View style={styles.sectionGap}>
              <View style={[styles.rulesCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.rulesHeader}>
                  <MaterialIcons name="gavel" size={24} color={PRIMARY_COLOR} />
                  <Text style={[styles.rulesTitle, { color: theme.text }]}>Challenge Rules</Text>
                </View>

                <View style={styles.sectionGap}>
                  {rules.map((rule, index) => (
                    <View key={rule.title} style={styles.ruleRow}>
                      <View style={styles.ruleIndex}>
                        <Text style={styles.ruleIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.ruleCopy}>
                        <Text style={[styles.ruleTitle, { color: theme.text }]}>{rule.title}</Text>
                        <Text style={[styles.ruleDesc, { color: mutedText }]}>{rule.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noticeCard}>
                <MaterialIcons name="verified" size={30} color="#10b981" />
                <Text style={styles.noticeText}>
                  Verified creators will review the top 10 entries to select the final winners.
                </Text>
              </View>
            </View>
          ) : null}

          {activeTab === 'prizes' ? (
            <View style={styles.sectionGapSmall}>
              {prizes.map((prize) => (
                <View
                  key={prize.rank}
                  style={[
                    styles.prizeCard,
                    {
                      backgroundColor: cardBg,
                      borderColor,
                    },
                  ]}
                >
                  <LinearGradient colors={prize.colors} style={styles.prizeIconWrap}>
                    <MaterialIcons name={prize.icon} size={30} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.prizeCopy}>
                    <Text style={styles.prizeRank}>{prize.rank}</Text>
                    <Text style={[styles.prizeTitle, { color: theme.text }]}>{prize.prize}</Text>
                    <Text style={[styles.prizeDesc, { color: mutedText }]}>{prize.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <BoostEntryDialog
          isOpen={boostOpen}
          onClose={() => setBoostOpen(false)}
          currentUser={user as BoostUser | null}
          currentRank={userRank}
          baseVotes={userVotes}
          onBoostApplied={(votesAdded, updatedRank) => {
            setUserVotes((prev) => prev + votesAdded);
            setUserRank(updatedRank);
          }}
        />

        {/* <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: headerBg,
              borderTopColor: borderColor,
            },
          ]}
        >
          {[
            { icon: 'home', label: 'Home' },
            { icon: 'play-circle', label: 'Videos' },
            { icon: 'emoji-events', label: 'Rankings', active: true },
            { icon: 'music-note', label: 'Music' },
          ].map((item) => (
            <View key={item.label} style={styles.navItem}>
              <MaterialIcons
                name={item.icon as keyof typeof MaterialIcons.glyphMap}
                size={24}
                color={item.active ? PRIMARY_COLOR : mutedText}
              />
              <Text style={[styles.navText, { color: item.active ? PRIMARY_COLOR : mutedText }]}>
                {item.label}
              </Text>
            </View>
          ))}

          <View style={styles.navItem}>
            <Image source={{ uri: 'https://picsum.photos/seed/user/100' }} style={[styles.profileThumb, { borderColor }]} />
            <Text style={[styles.navText, { color: mutedText }]}>Profile</Text>
          </View>
        </View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...fontSize.h1, lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  tabWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionGap: {
    gap: 24,
  },
  sectionGapSmall: {
    gap: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 14,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sidePodiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  winnerPodiumItem: {
    flex: 1.12,
    alignItems: 'center',
    gap: 10,
  },
  trophyIcon: {
    marginBottom: -2,
  },
  podiumAvatarWrap: {
    alignItems: 'center',
  },
  sidePodiumAvatar: {
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#cbd5e1',
  },
  thirdAvatar: {
    borderColor: '#b45309',
  },
  winnerAvatarRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 4,
    borderColor: PRIMARY_COLOR,
    padding: 4,
    backgroundColor: primaryColorAlpha(0.12),
  },
  winnerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  placeBadge: {
    marginTop: -10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeBadgeText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  winnerBadge: {
    backgroundColor: PRIMARY_COLOR,
  },
  winnerBadgeText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  centerAlign: {
    alignItems: 'center',
    gap: 3,
  },
  sidePodiumName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  voteAccent: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  winnerName: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  winnerVotes: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  sectionTitle: {
    marginLeft: 6,
    ...fontSize.mediumTitleText, lineHeight: fontSize.mediumTitleText.lineHeight,
    textTransform: 'uppercase',
  },
  rankCard: {
    padding: 14,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  rankCopy: {
    flex: 1,
    gap: 3,
  },
  rankName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  rankVotes: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  entryThumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  heartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRankCard: {
    overflow: 'hidden',
    borderRadius: 999,
    padding: 22,
  },
  userGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  userRankLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userRankNumber: {
    color: 'rgba(255,255,255,0.45)',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  userAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userCopy: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#ffffff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  userStats: {
    color: 'rgba(255,255,255,0.64)',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  boostButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  boostButtonText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  boostModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  boostBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  boostSheet: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
  },
  boostHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 2,
  },
  boostScrollContent: {
    padding: 24,
    paddingBottom: 34,
  },
  boostStackLarge: {
    gap: 24,
  },
  boostStack: {
    gap: 12,
  },
  boostStackSmall: {
    gap: 10,
  },
  boostHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  boostTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
  },
  boostSubtitle: {
    marginTop: 6,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  boostClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostStatusCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.2),
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  boostStatusLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boostStatusAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.3),
  },
  boostStatusName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostStatusRank: {
    marginTop: 4,
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostStatusVotes: {
    alignItems: 'flex-end',
  },
  boostStatusVoteValue: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  boostStepPills: {
    flexDirection: 'row',
    gap: 8,
  },
  boostStepPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostStepPillActive: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  boostStepPillText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  boostStepPillTextActive: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  boostSelectedPayload: {
    minHeight: 78,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  boostChangeText: {
    marginTop: 4,
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostTinyMuted: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  boostSectionLabel: {
    marginLeft: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  boostPackageScroller: {
    minHeight: 220,
  },
  boostPackageCard: {
    minHeight: 76,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  boostPackageLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boostPackageIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostPackageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  boostPackageName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostVotesChip: {
    color: '#db2777',
    backgroundColor: 'rgba(236,72,153,0.12)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostPriceBlock: {
    alignItems: 'flex-end',
    minWidth: 62,
  },
  boostPrice: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  boostPaymentGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  boostPaymentButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  boostPaymentText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  boostProviderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  boostProviderButton: {
    flex: 1,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostProviderText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostInputLabel: {
    marginLeft: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  boostInput: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  boostCenteredInput: {
    textAlign: 'center',
  },
  boostCardInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  boostKcCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.12)',
    backgroundColor: 'rgba(245,158,11,0.06)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  boostKcTitle: {
    color: '#f59e0b',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  boostKcBalance: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  boostError: {
    color: '#ef4444',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  boostPayButton: {
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  boostActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boostBackButton: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  boostBackButtonText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  boostActionPayButton: {
    flex: 1,
  },
  boostPayButtonText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  boostStageWrap: {
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  boostSpinnerWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.08),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.2),
  },
  boostStageTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  boostStageBody: {
    maxWidth: 320,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  boostOtpIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  boostOtpInput: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    textAlign: 'center',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: 8,
  },
  boostDarkButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostDarkButtonText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  boostCountdown: {
    textAlign: 'center',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  boostSuccessIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  boostSuccessTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  boostSuccessStats: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
  },
  boostSuccessStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  boostSuccessNumber: {
    color: PRIMARY_COLOR,
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  boostRankMove: {
    color: '#10b981',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  boostRankGain: {
    color: '#059669',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  rulesCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rulesTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 14,
  },
  ruleIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.12),
  },
  ruleIndexText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  ruleCopy: {
    flex: 1,
    gap: 4,
  },
  ruleTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  ruleDesc: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  noticeCard: {
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.26)',
  },
  noticeText: {
    flex: 1,
    color: '#34d399',
    ...fontSize.b5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: fontSize.b5.lineHeight,
  },
  prizeCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prizeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeCopy: {
    flex: 1,
    gap: 4,
  },
  prizeRank: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  prizeTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  prizeDesc: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  profileThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
});

export default ChallengeLeaderboard;
