import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from "../theme";
import { fontSize } from './typography';

type CoinPack = {
  id: string;
  coins: string;
  price: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  featured?: boolean;
};

type VoteModalContentProps = {
  onClose?: () => void;
  onConfirm?: () => void;
  sheetMode?: boolean;
};

const coinPacks: CoinPack[] = [
  { id: '100', coins: '100 Coins', price: '$0.99 USD', icon: 'toll' },
  { id: '500', coins: '500 Coins', price: '$4.49 USD', icon: 'star', featured: true },
  { id: '1000', coins: '1000 Coins', price: '$8.99 USD', icon: 'workspace-premium' },
];

const headerArtwork =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCHfY3OyXbRr7O2uM-hGpQ2GtZ_VGqr9xD19gAb5kYCjaJO43WHvai3t6eINqqbk6o6r2731NNXyeWykLceAlG93ol_jEA-qnSlqvQ0d3m-WRfx0DVj9lFK_J8B5gyzwatjPgSYPTWMN2ruaU-hcvY4k_-cgGZNhaOwV_votLH0l5a_3d3-F9QsbLoSeIPkl-3MxJTpC6pKdlKmGQTQi8rylVsHh-ByGiG7Lq0V8pHo4ad6_tk90DZnKb07kPhkEZqUwqjj7xOc6tCy';

export const VoteModalContent: React.FC<VoteModalContentProps> = ({
  onClose,
  onConfirm,
  sheetMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedPackId, setSelectedPackId] = useState('500');
  const [voteCount, setVoteCount] = useState('1');
  const normalizedVoteCount = Math.max(1, Number.parseInt(voteCount, 10) || 1);
  const walletBalance = 120;
  const needsTopUp = normalizedVoteCount > walletBalance;
  const { isDark, theme } = useThemeMode();
  const styles = useMemo(() => createStyles(isDark, theme), [isDark, theme]);

  const updateVoteCount = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, '');
    setVoteCount(numeric);
  };

  return (
    <View style={[styles.overlayRoot, sheetMode && styles.overlaySheet]}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.card,
          sheetMode && styles.sheetCard,
          { paddingBottom: Platform.OS === 'ios' ? 0 : Math.max(insets.bottom, 18) },
        ]}
      >
        <BlurView intensity={26} tint={isDark ? 'dark' : 'light'} style={styles.cardBlur}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={22} color={theme.textSecondary} />
          </Pressable>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* <View style={styles.topBar}>
              <Text style={styles.brand}>NEON PULSE</Text>
              <View style={styles.topBarRight}>
                <View style={styles.walletChip}>
                  <MaterialIcons name="account-balance-wallet" size={15} color={PRIMARY_COLOR} />
                  <Text style={styles.walletChipText}>120 Coins</Text>
                </View>
                <View style={styles.avatarRing}>
                  <Image source={{ uri: avatarArtwork }} style={styles.avatarImage} />
                </View>
              </View>
            </View> */}

            <BlurView intensity={34} tint={isDark ? 'dark' : 'light'} style={styles.heroBlurWrap}>
              <ImageBackground source={{ uri: headerArtwork }} style={styles.hero} imageStyle={styles.heroImage}>
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(10,5,13,0.08)', 'rgba(10,5,13,0.58)', '#0a050d']
                      : ['rgba(248,250,252,0.08)', 'rgba(248,250,252,0.52)', theme.background]
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.heroContent}>
                  {/* <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>HOT NOW</Text>
                  </View> */}
                  <Text style={styles.heroTitle}>Electric Sky Challenge</Text>
                  <Text style={styles.heroSubtitle}>
                    Vote for your favorite set to push them to the main stage.
                  </Text>
                </View>
              </ImageBackground>
            </BlurView>

            <View style={styles.sectionHeader}>
              <Text style={styles.modalTitle}>Cast Your Vote</Text>
              <Text style={styles.modalSubtitle}>Support your favorite creator</Text>
              <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={styles.balancePill}>
                <MaterialIcons name="payments" size={20} color="#deb7ff" />
              <Text style={styles.balanceText}>Balance: {walletBalance} Coins</Text>
              </BlurView>
            </View>

            <View style={styles.voteCounterSection}>
              <Text style={styles.packLabel}>Number of votes</Text>
              <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={styles.voteCounterCard}>
                <Pressable
                  onPress={() => setVoteCount(String(Math.max(1, (Number.parseInt(voteCount, 10) || 1) - 1)))}
                  style={styles.voteStepButton}
                >
                  <MaterialIcons name="remove" size={22} color="#ffffff" />
                </Pressable>

                <View style={styles.voteInputWrap}>
                  <TextInput
                    value={voteCount}
                    onChangeText={updateVoteCount}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    textAlign="center"
                    style={styles.voteInput}
                  />
                  <Text style={styles.voteInputCaption}>votes</Text>
                </View>

                <Pressable
                  onPress={() => setVoteCount(String(normalizedVoteCount + 1))}
                  style={styles.voteStepButton}
                >
                  <MaterialIcons name="add" size={22} color="#ffffff" />
                </Pressable>
              </BlurView>
            </View>

            {needsTopUp ? (
              <View style={styles.packSection}>
                <Text style={styles.packLabel}>Top up your wallet</Text>
                {coinPacks.map((pack) => {
                  const selected = pack.id === selectedPackId;
                  return (
                    <Pressable
                      key={pack.id}
                      onPress={() => setSelectedPackId(pack.id)}
                      style={[
                        styles.packRow,
                        selected ? styles.packRowSelected : styles.packRowDefault,
                      ]}
                    >
                      <View style={styles.packMain}>
                        <View
                          style={[
                            styles.packIconWrap,
                            selected ? styles.packIconWrapSelected : styles.packIconWrapDefault,
                          ]}
                        >
                          <MaterialIcons
                            name={pack.icon}
                            size={20}
                            color={selected ? '#ffffff' : PRIMARY_COLOR}
                          />
                        </View>

                        <View style={styles.packCopy}>
                          <Text style={[styles.packCoins, selected && styles.packCoinsSelected]}>
                            {pack.coins}
                          </Text>
                          <Text style={[styles.packPrice, selected && styles.packPriceSelected]}>
                            {pack.price}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.packActionWrap}>
                        {pack.featured ? (
                          <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                          </View>
                        ) : null}

                        <View
                          style={[
                            styles.packActionButton,
                            selected ? styles.packActionButtonSelected : styles.packActionButtonDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.packActionText,
                              selected ? styles.packActionTextSelected : styles.packActionTextDefault,
                            ]}
                          >
                            {selected ? 'PURCHASE' : 'SELECT'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Pressable style={styles.confirmButton} onPress={onConfirm ?? onClose}>
              <Text style={styles.confirmButtonText}>
                Confirm {normalizedVoteCount} Vote{normalizedVoteCount === 1 ? '' : 's'} & Purchase
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </BlurView>
      </View>
    </View>
  );
};

const Vote: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const styles = useMemo(() => createStyles(isDark, theme), [isDark, theme]);

  return (
    <SafeAreaView style={styles.screen}>
      <VoteModalContent />
    </SafeAreaView>
  );
};

const createStyles = (isDark: boolean, theme: ReturnType<typeof useThemeMode>['theme']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    overlayRoot: {
      flex: 1,
      justifyContent: 'center',
    },
    overlaySheet: {
      justifyContent: 'flex-end',
      paddingBottom: 0,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(10,5,13,0.8)' : 'rgba(15,23,42,0.45)',
    },
    card: {
      width: '100%',
      maxWidth: '100%',
      height: '85%',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    cardBlur: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    sheetCard: {
      maxWidth: 520,
      width: '100%',
      height: '85%',
    },
    scrollContent: {
      paddingBottom: 14,
      paddingTop: 60,
    },
    closeButton: {
      position: 'absolute',
      top: 14,
      right: 14,
      zIndex: 20,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
    },
    brand: {
      color: theme.text,
      ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
      fontStyle: 'italic',
      letterSpacing: 0.6,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    walletChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    walletChipText: {
      color: theme.text,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    avatarRing: {
      width: 40,
      height: 40,
      borderRadius: 20,
      padding: 2,
      borderWidth: 2,
      borderColor: PRIMARY_COLOR,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
    },
    hero: {
      height: 260,
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 24,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    heroBlurWrap: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 24,
      overflow: 'hidden',
    },
    heroImage: {
      borderRadius: 24,
    },
    heroContent: {
      paddingHorizontal: 18,
      paddingBottom: 18,
      gap: 8,
    },
    hotBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: primaryColorAlpha(0.18),
      borderWidth: 1,
      borderColor: primaryColorAlpha(0.35),
    },
    hotBadgeText: {
      color: isDark ? '#d68cef' : theme.accent,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      letterSpacing: 1.1,
      fontStyle: 'italic',
    },
    heroTitle: {
      color: theme.text,
      ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    },
    heroSubtitle: {
      color: theme.textSecondary,
      ...fontSize.b5,
      lineHeight: 18,
    },
    sectionHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 10,
    },
    modalTitle: {
      color: theme.text,
      ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    },
    modalSubtitle: {
      marginTop: 4,
      color: theme.textSecondary,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    },
    balancePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(106,0,177,0.35)' : 'rgba(56,169,229,0.12)',
      borderWidth: 1,
      borderColor: primaryColorAlpha(0.3),
      overflow: 'hidden',
    },
    voteCounterSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 10,
    },
    voteCounterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      overflow: 'hidden',
    },
    voteStepButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    balanceText: {
      color: theme.text,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    },
    voteInputWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    voteInput: {
      minWidth: 90,
      color: theme.text,
      ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
      paddingVertical: 0,
      includeFontPadding: false,
    },
    voteInputCaption: {
      color: theme.textSecondary,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    packSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 12,
    },
    packLabel: {
      paddingHorizontal: 6,
      color: theme.textMuted,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    packRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
    },
    packRowDefault: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    packRowSelected: {
      backgroundColor: primaryColorAlpha(0.12),
      borderColor: primaryColorAlpha(0.55),
    },
    packMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    packIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    packIconWrapDefault: {
      backgroundColor: primaryColorAlpha(0.12),
    },
    packIconWrapSelected: {
      backgroundColor: PRIMARY_COLOR,
    },
    packCopy: {
      gap: 3,
    },
    packCoins: {
      color: theme.text,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    },
    packCoinsSelected: {
      color: '#ffffff',
    },
    packPrice: {
      color: theme.textSecondary,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    packPriceSelected: {
      color: isDark ? '#deb7ff' : theme.accent,
    },
    packActionWrap: {
      alignItems: 'flex-end',
      gap: 8,
    },
    bestValueBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: primaryColorAlpha(0.16),
    },
    bestValueText: {
      color: isDark ? '#d68cef' : theme.accent,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      letterSpacing: 1,
      fontStyle: 'italic',
    },
    packActionButton: {
      minWidth: 84,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    packActionButtonDefault: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    packActionButtonSelected: {
      backgroundColor: PRIMARY_COLOR,
      borderColor: PRIMARY_COLOR,
    },
    packActionText: {
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      letterSpacing: 0.8,
    },
    packActionTextDefault: {
      color: theme.text,
    },
    packActionTextSelected: {
      color: '#ffffff',
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 22,
      paddingVertical: 16,
      borderRadius: 18,
      backgroundColor: PRIMARY_COLOR,
      shadowColor: PRIMARY_COLOR,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.42,
      shadowRadius: 22,
      elevation: 10,
    },
    confirmButtonText: {
      color: '#ffffff',
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    },
    cancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 10,
    },
    cancelButtonText: {
      color: theme.textMuted,
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 1.4,
    },
  });

export default Vote;
