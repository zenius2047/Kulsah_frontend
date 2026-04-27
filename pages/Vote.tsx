import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';

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
const avatarArtwork =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCaoc34r0ZPrSPhn9y8KGXLGaDVEGVQAFIFFHKPphn40n--m99MF3048CysMZJlmUgfYyMIMJgA7CBl4kB962Z20KvSNvFpCegO8y_A18sfITp5iTEMkQs4h1YG9Kd3VxbL3sQRKh1re6QHazEHNFefpn7cfoy4J8gslemV57JpbS1DXrKMH5rYKD0L2OfVDqpw56iU3j_FaslFqJAK2SUh3sf-slQIjchMtbmm9f5kCtWAisIcxzJXvQ5FQ83MHdfIuTcIzdlOboNU';

export const VoteModalContent: React.FC<VoteModalContentProps> = ({
  onClose,
  onConfirm,
  sheetMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedPackId, setSelectedPackId] = useState('500');

  return (
    <View style={[styles.overlayRoot, sheetMode && styles.overlaySheet]}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.card,
          sheetMode && styles.sheetCard,
          { paddingBottom: Math.max(insets.bottom, 18) },
        ]}
      >
        <Pressable style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={22} color="#94a3b8" />
        </Pressable>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topBar}>
            <Text style={styles.brand}>NEON PULSE</Text>
            <View style={styles.topBarRight}>
              <View style={styles.walletChip}>
                <MaterialIcons name="account-balance-wallet" size={15} color="#cd2bee" />
                <Text style={styles.walletChipText}>120 Coins</Text>
              </View>
              <View style={styles.avatarRing}>
                <Image source={{ uri: avatarArtwork }} style={styles.avatarImage} />
              </View>
            </View>
          </View>

          <ImageBackground source={{ uri: headerArtwork }} style={styles.hero} imageStyle={styles.heroImage}>
            <LinearGradient
              colors={['rgba(10,5,13,0.08)', 'rgba(10,5,13,0.58)', '#0a050d']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>HOT NOW</Text>
              </View>
              <Text style={styles.heroTitle}>Electric Sky Challenge</Text>
              <Text style={styles.heroSubtitle}>
                Vote for your favorite set to push them to the main stage.
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.sectionHeader}>
            <Text style={styles.modalTitle}>Cast Your Vote</Text>
            <Text style={styles.modalSubtitle}>Support your favorite creator</Text>
            <View style={styles.balancePill}>
              <MaterialIcons name="payments" size={20} color="#deb7ff" />
              <Text style={styles.balanceText}>Balance: 120 Coins</Text>
            </View>
          </View>

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
                        color={selected ? '#ffffff' : '#cd2bee'}
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

          <Pressable style={styles.confirmButton} onPress={onConfirm ?? onClose}>
            <Text style={styles.confirmButtonText}>Confirm Vote & Purchase</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
};

const Vote: React.FC = () => {
  return (
    <SafeAreaView style={styles.screen}>
      <VoteModalContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  overlayRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  overlaySheet: {
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.8)',
  },
  card: {
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    maxHeight: '92%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  sheetCard: {
    maxWidth: 520,
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '94%',
  },
  scrollContent: {
    paddingBottom: 14,
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
    backgroundColor: 'rgba(10,5,13,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  walletChipText: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(9),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: '#cd2bee',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  hero: {
    height: 260,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
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
    backgroundColor: 'rgba(205,43,238,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
  },
  hotBadgeText: {
    color: '#d68cef',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(7),
    letterSpacing: 1.1,
    fontStyle: 'italic',
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(17),
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
    lineHeight: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
  },
  modalSubtitle: {
    marginTop: 4,
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(106,0,177,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.3)',
  },
  balanceText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
  },
  packSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  packLabel: {
    paddingHorizontal: 6,
    color: '#64748b',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(7),
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  packRowSelected: {
    backgroundColor: 'rgba(205,43,238,0.12)',
    borderColor: 'rgba(205,43,238,0.55)',
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
    backgroundColor: 'rgba(205,43,238,0.12)',
  },
  packIconWrapSelected: {
    backgroundColor: '#cd2bee',
  },
  packCopy: {
    gap: 3,
  },
  packCoins: {
    color: '#e2e8f0',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
  },
  packCoinsSelected: {
    color: '#ffffff',
  },
  packPrice: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  packPriceSelected: {
    color: '#deb7ff',
  },
  packActionWrap: {
    alignItems: 'flex-end',
    gap: 8,
  },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(205,43,238,0.16)',
  },
  bestValueText: {
    color: '#d68cef',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6),
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  packActionButtonSelected: {
    backgroundColor: '#cd2bee',
    borderColor: '#cd2bee',
  },
  packActionText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    letterSpacing: 0.8,
  },
  packActionTextDefault: {
    color: '#e2e8f0',
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
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(11),
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#64748b',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

export default Vote;
