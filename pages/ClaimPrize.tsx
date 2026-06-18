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
  Image,
  type ColorValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

type RewardType = 'digital' | 'physical' | 'custom' | 'coins' | 'money';
type PayoutMethod = 'coins' | 'momo' | 'bank';
type ClaimStep = 1 | 2 | 3 | 4;

type ClaimSubmission = {
  id: string;
  challengeTitle: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  thumbnailUrl: string;
  votes: number;
  likes: number;
  reward: string;
  rewardType: RewardType;
  accessCode?: string;
  claimed?: boolean;
  claimedAt?: string;
  claimMethod?: string;
};

const MOCK_SUBMISSIONS: ClaimSubmission[] = [
  {
    id: 'mock-sub-0',
    challengeTitle: 'Cyberpunk Street Dance Challenge',
    userName: 'Alex Rivera',
    userHandle: '@Alex_Beats',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
    votes: 8900,
    likes: 3450,
    reward: 'VIP Pass Access & Download Bundle',
    rewardType: 'digital',
    accessCode: 'VIP-CYBER-PULSE-9X99',
  },
  {
    id: 'mock-sub-1',
    challengeTitle: 'Drone Hyperlapse Speedrun',
    userName: 'Alex Rivera',
    userHandle: '@Alex_Beats',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=800',
    votes: 2400,
    likes: 1200,
    reward: 'Premium Creator Hoodie + Stickers',
    rewardType: 'physical',
  },
  {
    id: 'mock-sub-2',
    challengeTitle: 'Cinematic Vlog Sequence',
    userName: 'Alex Rivera',
    userHandle: '@Alex_Beats',
    userAvatar: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    votes: 1950,
    likes: 850,
    reward: '1:1 Private Zoom Consultation Session',
    rewardType: 'custom',
  },
];

const ClaimPrize: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const styles = useMemo(() => createStyles(isDark, theme), [isDark, theme]);
  const placeholderColor = theme.textMuted;
  const iconColor = theme.text;
  const screenGradient: readonly [ColorValue, ColorValue, ColorValue] = isDark
    ? [primaryColorAlpha(0.32), '#09060f', '#050207']
    : [primaryColorAlpha(0.16), theme.background, theme.screen];
  const [submissions, setSubmissions] = useState<ClaimSubmission[]>(MOCK_SUBMISSIONS);
  const [claimHistory, setClaimHistory] = useState<ClaimSubmission[]>([]);
  const [activeWinIndex, setActiveWinIndex] = useState(0);
  const [selectedSub, setSelectedSub] = useState<ClaimSubmission | null>(null);
  const [claimStep, setClaimStep] = useState<ClaimStep>(1);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('coins');
  const [phoneOrAccount, setPhoneOrAccount] = useState('');
  const [momoProvider, setMomoProvider] = useState('MTN Mobile Money');
  const [bankName, setBankName] = useState('Kulsah Creator Bank');
  const [shippingName, setShippingName] = useState('Alex Rivera');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Ghana');
  const [selectedSize, setSelectedSize] = useState('M');
  const [redeemEmail, setRedeemEmail] = useState('alex@kulsah.io');
  const [recipientHandle, setRecipientHandle] = useState('@Alex_Beats');
  const [customNotes, setCustomNotes] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const activeWin = submissions[Math.min(activeWinIndex, Math.max(submissions.length - 1, 0))] ?? claimHistory[0] ?? MOCK_SUBMISSIONS[0];
  const totalWins = submissions.length + claimHistory.length;

  const rewardInfo = useMemo(() => {
    const text = activeWin.reward.toUpperCase();
    return {
      coins: text.match(/([\d,]+)/)?.[1] ?? '500',
      access: text.includes('VIP') ? 'VIP PASS' : text.includes('PREMIUM') ? 'PREMIUM PASS' : 'ACCESS PASS',
    };
  }, [activeWin.reward]);

  const triggerToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const handleStartClaim = (sub: ClaimSubmission) => {
    setSelectedSub(sub);
    setClaimStep(1);
    setPayoutMethod('coins');
    setPhoneOrAccount('');
    setTxRef('');
  };

  const handleProcessClaim = () => {
    if (!selectedSub) return;
    const needsAccount = selectedSub.rewardType === 'money' && payoutMethod !== 'coins';
    const needsShipping = selectedSub.rewardType === 'physical' && (!shippingAddress.trim() || !shippingCity.trim());
    const needsCustom = selectedSub.rewardType === 'custom' && !recipientHandle.trim();

    if (needsAccount || needsShipping || needsCustom) {
      Alert.alert('Missing Details', 'Complete the required prize details before disbursement.');
      return;
    }

    setClaiming(true);
    setTimeout(() => {
      const reference = `TXN-${Math.floor(100000 + Math.random() * 900000)}-KUL`;
      const claimedSub = {
        ...selectedSub,
        claimed: true,
        claimedAt: new Date().toISOString(),
        claimMethod: selectedSub.rewardType === 'physical' ? 'shipping' : selectedSub.rewardType === 'digital' ? 'download_unlock' : payoutMethod,
      };
      setTxRef(reference);
      setSubmissions((prev) => prev.filter((sub) => sub.id !== selectedSub.id));
      setClaimHistory((prev) => [claimedSub, ...prev]);
      setActiveWinIndex(0);
      setClaimStep(4);
      setClaiming(false);
      triggerToast(`Claim successful for ${selectedSub.challengeTitle}`);
    }, 1000);
  };

  const closeClaim = () => {
    setSelectedSub(null);
    setClaimStep(1);
  };

  const renderMethodCard = (method: PayoutMethod, icon: keyof typeof MaterialIcons.glyphMap, title: string, body: string) => {
    const active = payoutMethod === method;
    return (
      <Pressable
        onPress={() => setPayoutMethod(method)}
        style={[styles.methodCard, active && styles.methodCardActive]}
      >
        <MaterialIcons name={icon} size={24} color={active ? '#fff' : PRIMARY_COLOR} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.methodTitle, active && styles.methodTitleActive]}>{title}</Text>
          <Text style={[styles.methodBody, active && styles.methodBodyActive]}>{body}</Text>
        </View>
        {active && <MaterialIcons name="check-circle" size={20} color="#fff" />}
      </Pressable>
    );
  };

  const renderClaimContent = () => {
    if (!selectedSub) return null;
    const rewardType = selectedSub.rewardType;

    if (claimStep === 1) {
      return (
        <View style={styles.modalSection}>
          <View style={styles.centerBlock}>
            <View style={styles.bigIcon}>
              <MaterialIcons name="workspace-premium" size={42} color={PRIMARY_COLOR} />
            </View>
            <Text style={styles.modalTitle}>VERIFY WIN</Text>
            <Text style={styles.modalSubtitle}>Confirm the challenge signal before claiming your reward.</Text>
          </View>
          <View style={styles.claimSummary}>
            <Text style={styles.claimLabel}>CHALLENGE</Text>
            <Text style={styles.claimValue}>{selectedSub.challengeTitle}</Text>
            <Text style={styles.claimLabel}>REWARD</Text>
            <Text style={styles.claimValue}>{selectedSub.reward}</Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={() => setClaimStep(2)}>
            <Text style={styles.primaryBtnText}>CONTINUE</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      );
    }

    if (claimStep === 2) {
      if (rewardType === 'digital') {
        return (
          <View style={styles.modalSection}>
            <Text style={styles.modalTitle}>DIGITAL DELIVERY</Text>
            <Text style={styles.modalSubtitle}>Choose where your access code and bundle link should arrive.</Text>
            <TextInput value={redeemEmail} onChangeText={setRedeemEmail} placeholder="Email address" placeholderTextColor={placeholderColor} style={styles.input} />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setClaimStep(1)}><Text style={styles.secondaryBtnText}>BACK</Text></Pressable>
              <Pressable style={styles.primaryBtnCompact} onPress={() => setClaimStep(3)}><Text style={styles.primaryBtnText}>NEXT</Text></Pressable>
            </View>
          </View>
        );
      }

      if (rewardType === 'physical') {
        return (
          <View style={styles.modalSection}>
            <Text style={styles.modalTitle}>SHIPMENT DETAILS</Text>
            <Text style={styles.modalSubtitle}>Send the prize to the right planetary coordinate.</Text>
            <TextInput value={shippingName} onChangeText={setShippingName} placeholder="Recipient name" placeholderTextColor={placeholderColor} style={styles.input} />
            <TextInput value={shippingAddress} onChangeText={setShippingAddress} placeholder="Street address" placeholderTextColor={placeholderColor} style={styles.input} />
            <View style={styles.inputRow}>
              <TextInput value={shippingCity} onChangeText={setShippingCity} placeholder="City" placeholderTextColor={placeholderColor} style={[styles.input, { flex: 1 }]} />
              <TextInput value={shippingCountry} onChangeText={setShippingCountry} placeholder="Country" placeholderTextColor={placeholderColor} style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={styles.sizeRow}>
              {['S', 'M', 'L', 'XL'].map((size) => (
                <Pressable key={size} onPress={() => setSelectedSize(size)} style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}>
                  <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>{size}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setClaimStep(1)}><Text style={styles.secondaryBtnText}>BACK</Text></Pressable>
              <Pressable style={styles.primaryBtnCompact} onPress={() => setClaimStep(3)}><Text style={styles.primaryBtnText}>NEXT</Text></Pressable>
            </View>
          </View>
        );
      }

      if (rewardType === 'custom') {
        return (
          <View style={styles.modalSection}>
            <Text style={styles.modalTitle}>CREATOR COORDINATION</Text>
            <Text style={styles.modalSubtitle}>Tell the creator where to coordinate your custom reward.</Text>
            <TextInput value={recipientHandle} onChangeText={setRecipientHandle} placeholder="@handle or email" placeholderTextColor={placeholderColor} style={styles.input} />
            <TextInput value={customNotes} onChangeText={setCustomNotes} placeholder="Preferred dates, notes, or questions..." placeholderTextColor={placeholderColor} multiline textAlignVertical="top" style={[styles.input, styles.textarea]} />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setClaimStep(1)}><Text style={styles.secondaryBtnText}>BACK</Text></Pressable>
              <Pressable style={styles.primaryBtnCompact} onPress={() => setClaimStep(3)}><Text style={styles.primaryBtnText}>NEXT</Text></Pressable>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.modalSection}>
          <Text style={styles.modalTitle}>PAYOUT METHOD</Text>
          <Text style={styles.modalSubtitle}>Pick your safest reward disbursement route.</Text>
          {renderMethodCard('coins', 'toll', 'Kulsah Coins', 'Instant wallet credit.')}
          {renderMethodCard('momo', 'phone-iphone', 'Mobile Money', 'Receive payout through a mobile wallet.')}
          {renderMethodCard('bank', 'account-balance', 'Bank Transfer', 'Route reward to a bank account.')}
          <View style={styles.modalActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => setClaimStep(1)}><Text style={styles.secondaryBtnText}>BACK</Text></Pressable>
            <Pressable style={styles.primaryBtnCompact} onPress={() => setClaimStep(3)}><Text style={styles.primaryBtnText}>NEXT</Text></Pressable>
          </View>
        </View>
      );
    }

    if (claimStep === 3) {
      const isMoney = rewardType === 'money' || rewardType === 'coins';
      return (
        <View style={styles.modalSection}>
          <Text style={styles.modalTitle}>{isMoney ? 'PAYOUT DETAILS' : 'FINAL REVIEW'}</Text>
          <Text style={styles.modalSubtitle}>Review the last details before the reward leaves the dock.</Text>
          {isMoney && payoutMethod === 'momo' && (
            <>
              <TextInput value={momoProvider} onChangeText={setMomoProvider} placeholder="MoMo provider" placeholderTextColor={placeholderColor} style={styles.input} />
              <TextInput value={phoneOrAccount} onChangeText={setPhoneOrAccount} placeholder="+233 24 123 4567" placeholderTextColor={placeholderColor} keyboardType="phone-pad" style={styles.input} />
            </>
          )}
          {isMoney && payoutMethod === 'bank' && (
            <>
              <TextInput value={bankName} onChangeText={setBankName} placeholder="Bank name" placeholderTextColor={placeholderColor} style={styles.input} />
              <TextInput value={phoneOrAccount} onChangeText={setPhoneOrAccount} placeholder="Account number" placeholderTextColor={placeholderColor} style={styles.input} />
            </>
          )}
          <View style={styles.reviewCard}>
            <Text style={styles.claimLabel}>REWARD TYPE</Text>
            <Text style={styles.claimValue}>{rewardType.toUpperCase()}</Text>
            <Text style={styles.claimLabel}>CLAIM ROUTE</Text>
            <Text style={styles.claimValue}>{rewardType === 'physical' ? `SHIP TO ${shippingCity || 'CITY'} · SIZE ${selectedSize}` : rewardType === 'digital' ? redeemEmail : rewardType === 'custom' ? recipientHandle : payoutMethod.toUpperCase()}</Text>
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => setClaimStep(2)}><Text style={styles.secondaryBtnText}>BACK</Text></Pressable>
            <Pressable style={styles.primaryBtnCompact} onPress={handleProcessClaim} disabled={claiming}>
              {claiming ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>DISBURSE</Text>}
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.modalSection}>
        <View style={styles.centerBlock}>
          <View style={[styles.bigIcon, { backgroundColor: 'rgba(34,197,94,0.14)', borderColor: 'rgba(34,197,94,0.35)' }]}>
            <MaterialIcons name={rewardType === 'digital' ? 'vpn-key' : rewardType === 'physical' ? 'local-shipping' : 'verified'} size={42} color="#22c55e" />
          </View>
          <Text style={styles.modalTitle}>{rewardType === 'physical' ? 'SHIPMENT CLEARED' : rewardType === 'digital' ? 'DIGITAL UNLOCKED' : 'CLAIM SUCCESSFUL'}</Text>
          <Text style={styles.modalSubtitle}>Your prize has been processed. Reference code: {txRef}</Text>
        </View>
        {!!selectedSub.accessCode && (
          <View style={styles.codeBox}>
            <Text style={styles.claimLabel}>ACCESS CODE</Text>
            <Text style={styles.codeText}>{selectedSub.accessCode}</Text>
          </View>
        )}
        <Pressable style={styles.primaryBtn} onPress={closeClaim}>
          <Text style={styles.primaryBtnText}>DISMISS</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <LinearGradient colors={screenGradient} style={StyleSheet.absoluteFillObject} />
      {!!toast && (
        <View style={styles.toast}>
          <MaterialIcons name="workspace-premium" size={18} color={PRIMARY_COLOR} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={22} color={iconColor} />
        </Pressable>
        <Text style={styles.headerTitle}>WINNER ANNOUNCED</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.congratsPill}>
          <Text style={styles.congratsText}>CONGRATULATIONS</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroSmall}>YOU ARE THE</Text>
          <Text style={styles.heroBig}>CHAMPION</Text>
          <Text style={styles.heroSub}>{totalWins} completed challenge wins are waiting in your prize orbit.</Text>
        </View>

        <View style={styles.victoryCard}>
          <View style={styles.cardGlowOne} />
          <View style={styles.cardGlowTwo} />
          <View style={styles.avatarStage}>
            <LinearGradient colors={[PRIMARY_COLOR, primaryColorAlpha(0.78), primaryColorAlpha(0.5)]} style={styles.avatarRing}>
              <Image source={{ uri: activeWin.userAvatar }} style={styles.avatar} />
            </LinearGradient>
            <View style={styles.starBadge}>
              <MaterialIcons name="star" size={22} color="#3f2500" />
            </View>
          </View>

          <Text style={styles.winnerName}>{activeWin.userName}</Text>
          <Text style={styles.winnerHandle}>{activeWin.userHandle}</Text>

          <View style={styles.divider} />
          <Text style={styles.challengeLabel}>CHALLENGE TITLE</Text>
          <Text style={styles.challengeTitle}>{activeWin.challengeTitle}</Text>

          <View style={styles.rewardGrid}>
            <View style={styles.rewardCard}>
              <MaterialIcons name="toll" size={22} color={PRIMARY_COLOR} />
              <Text style={styles.rewardLabel}>PULSE REWARD</Text>
              <Text style={styles.rewardValue}>{rewardInfo.coins}</Text>
            </View>
            <View style={styles.rewardCard}>
              <MaterialIcons name="confirmation-number" size={22} color={PRIMARY_COLOR} />
              <Text style={styles.rewardLabel}>ACCESS</Text>
              <Text style={styles.rewardValue}>{rewardInfo.access}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.claimBtn} onPress={() => handleStartClaim(activeWin)} disabled={!!activeWin.claimed}>
          <Text style={styles.claimBtnText}>{activeWin.claimed ? 'PRIZE CLAIMED' : 'CLAIM YOUR PRIZE'}</Text>
          <MaterialIcons name={activeWin.claimed ? 'check-circle' : 'celebration'} size={20} color="#fff" />
        </Pressable>

        <Text style={styles.sectionTitle}>WIN REGISTRY</Text>
        <View style={styles.registryList}>
          {[...submissions, ...claimHistory].map((sub, index) => (
            <Pressable
              key={sub.id}
              onPress={() => setActiveWinIndex(index)}
              style={[styles.registryCard, activeWin.id === sub.id && styles.registryCardActive]}
            >
              <Image source={{ uri: sub.thumbnailUrl }} style={styles.registryImage} />
              <View style={styles.registryCopy}>
                <Text style={styles.registryTitle} numberOfLines={1}>{sub.challengeTitle}</Text>
                <Text style={styles.registryMeta}>{sub.votes.toLocaleString()} votes · {sub.likes.toLocaleString()} likes</Text>
              </View>
              <View style={[styles.statusChip, sub.claimed && styles.statusClaimed]}>
                <Text style={[styles.statusText, sub.claimed && styles.statusTextClaimed]}>{sub.claimed ? 'CLAIMED' : 'READY'}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedSub} transparent animationType="slide" statusBarTranslucent onRequestClose={closeClaim}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={closeClaim} />
            <View style={styles.modalCard}>
              <View style={styles.grabber} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>CLAIM PRIZE</Text>
                <Pressable onPress={closeClaim} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={18} color={iconColor} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {renderClaimContent()}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (isDark: boolean, theme: ReturnType<typeof useThemeMode>['theme']) => {
  const surface = isDark ? 'rgba(18,10,34,0.78)' : theme.card;
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const softerSurface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const faintBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const titleText = theme.text;
  const mutedText = theme.textMuted;
  const secondaryText = theme.textSecondary;
  const modalBackground = isDark ? '#11091f' : theme.card;
  const starBorder = isDark ? '#09060f' : theme.card;

  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: {
    height: 58,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: faintBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: softSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: titleText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, letterSpacing: 2 },
  toast: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    backgroundColor: isDark ? '#1e1330' : theme.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toastText: { color: titleText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 0.8 },
  content: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  congratsPill: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    backgroundColor: primaryColorAlpha(0.14),
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  congratsText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 3 },
  heroCopy: { alignItems: 'center', marginTop: 18 },
  heroSmall: { color: titleText, ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 3, letterSpacing: 1.2 },
  heroBig: { color: PRIMARY_COLOR, fontFamily: 'Poppins_800ExtraBold', fontSize: 38, lineHeight: 44, letterSpacing: 0 },
  heroSub: { color: secondaryText, ...fontSize.b5, lineHeight: 16, textAlign: 'center', marginTop: 8, maxWidth: 280 },
  victoryCard: {
    width: '100%',
    marginTop: 26,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: surface,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardGlowOne: { position: 'absolute', top: -40, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: primaryColorAlpha(0.16) },
  cardGlowTwo: { position: 'absolute', bottom: -46, left: -50, width: 130, height: 130, borderRadius: 65, backgroundColor: primaryColorAlpha(0.12) },
  avatarStage: { width: 126, height: 126, marginTop: 4, marginBottom: 18 },
  avatarRing: { flex: 1, borderRadius: 63, padding: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 59, backgroundColor: theme.card },
  starBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#facc15',
    borderWidth: 2,
    borderColor: starBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerName: { color: titleText, ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase' },
  winnerHandle: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, marginTop: 4 },
  divider: { width: '100%', height: 1, backgroundColor: faintBorder, marginVertical: 20 },
  challengeLabel: { color: mutedText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 1.8 },
  challengeTitle: { color: titleText, ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 4, textAlign: 'center', marginTop: 8 },
  rewardGrid: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 20 },
  rewardCard: { flex: 1, borderRadius: 20, backgroundColor: softSurface, padding: 14, alignItems: 'center' },
  rewardLabel: { color: mutedText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, marginTop: 8, letterSpacing: 1 },
  rewardValue: { color: titleText, ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 2, marginTop: 4, textAlign: 'center' },
  claimBtn: {
    width: '100%',
    marginTop: 18,
    height: 58,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  claimBtnText: { color: '#fff', ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2, letterSpacing: 1.4 },
  sectionTitle: { alignSelf: 'flex-start', color: mutedText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 2, marginTop: 28, marginBottom: 12 },
  registryList: { width: '100%', gap: 10 },
  registryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: faintBorder,
    backgroundColor: softerSurface,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  registryCardActive: { borderColor: primaryColorAlpha(0.45), backgroundColor: primaryColorAlpha(0.1) },
  registryImage: { width: 54, height: 54, borderRadius: 15 },
  registryCopy: { flex: 1 },
  registryTitle: { color: titleText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  registryMeta: { color: secondaryText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, marginTop: 4 },
  statusChip: { borderRadius: 999, backgroundColor: primaryColorAlpha(0.15), paddingHorizontal: 9, paddingVertical: 5 },
  statusClaimed: { backgroundColor: 'rgba(34,197,94,0.14)' },
  statusText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 0.8 },
  statusTextClaimed: { color: '#22c55e' },
  modalKeyboard: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(15,23,42,0.42)' },
  modalCard: {
    maxHeight: '86%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: modalBackground,
    borderTopWidth: 1,
    borderColor: border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalHeaderText: { color: titleText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, letterSpacing: 1.6 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: softSurface, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { paddingBottom: 28 },
  modalSection: { gap: 14 },
  centerBlock: { alignItems: 'center', gap: 8 },
  bigIcon: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: primaryColorAlpha(0.3), backgroundColor: primaryColorAlpha(0.12), alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: titleText, ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textAlign: 'center', letterSpacing: 1 },
  modalSubtitle: { color: secondaryText, ...fontSize.b5, lineHeight: 16, textAlign: 'center' },
  claimSummary: { borderRadius: 22, borderWidth: 1, borderColor: faintBorder, backgroundColor: softerSurface, padding: 16, gap: 6 },
  claimLabel: { color: mutedText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 1.3 },
  claimValue: { color: titleText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 3, marginBottom: 6 },
  primaryBtn: { height: 54, borderRadius: 18, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnCompact: { flex: 1, height: 52, borderRadius: 17, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 1.3 },
  secondaryBtn: { flex: 1, height: 52, borderRadius: 17, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: secondaryText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, letterSpacing: 1.2 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  input: { height: 50, borderRadius: 16, borderWidth: 1, borderColor: border, backgroundColor: softSurface, color: titleText, paddingHorizontal: 14, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  textarea: { minHeight: 96, paddingTop: 12 },
  inputRow: { flexDirection: 'row', gap: 10 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeChip: { flex: 1, height: 42, borderRadius: 14, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' },
  sizeChipActive: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  sizeText: { color: secondaryText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  sizeTextActive: { color: '#fff' },
  methodCard: { borderRadius: 18, borderWidth: 1, borderColor: border, backgroundColor: softSurface, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodCardActive: { borderColor: PRIMARY_COLOR, backgroundColor: PRIMARY_COLOR },
  methodTitle: { color: titleText, ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  methodTitleActive: { color: '#fff' },
  methodBody: { color: secondaryText, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, marginTop: 2 },
  methodBodyActive: { color: 'rgba(255,255,255,0.8)' },
  reviewCard: { borderRadius: 20, borderWidth: 1, borderColor: faintBorder, backgroundColor: softerSurface, padding: 14 },
  codeBox: { borderRadius: 20, borderWidth: 1, borderColor: primaryColorAlpha(0.28), backgroundColor: primaryColorAlpha(0.1), padding: 16, alignItems: 'center' },
  codeText: { color: titleText, ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 3, letterSpacing: 1.2, marginTop: 6 },
  });
};

export default ClaimPrize;
