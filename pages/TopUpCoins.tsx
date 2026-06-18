import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen, setUser, user as globalUser } from '../types';
import PaymentGateway from '../components/PaymentGateway';
import { fontSize } from './typography';

type CoinPackage = {
  id: number;
  coins: number;
  price: number;
  bonus: number;
  popular: boolean;
};

const USER_KEY = 'pulsar_user';
const KULCOIN_ICON = require('../assets/coin.png');

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 10, price: 1, bonus: 0, popular: false },
  { id: 2, coins: 50, price: 5, bonus: 5, popular: true },
  { id: 3, coins: 100, price: 10, bonus: 15, popular: false },
  { id: 4, coins: 250, price: 25, bonus: 50, popular: false },
  { id: 5, coins: 500, price: 50, bonus: 150, popular: false },
  { id: 6, coins: 1000, price: 100, bonus: 400, popular: false },
];

const TopUpCoins: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentCoins, setCurrentCoins] = useState(0);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (!savedUser) {
          setCurrentCoins(0);
          return;
        }
        const parsedUser = JSON.parse(savedUser);
        setCurrentCoins(parsedUser.balance || 0);
      } catch {
        setCurrentCoins(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    void loadBalance();
  }, []);

  const selectedPkgData = useMemo(
    () => coinPackages.find((pkg) => pkg.id === selectedPackage) ?? null,
    [selectedPackage]
  );
  const screenBg = isDark ? '#050816' : '#f8fafc';
  const headerIconBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const headerIconBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const subtleText = isDark ? 'rgba(255,255,255,0.45)' : theme.textSecondary;
  const sectionLabel = isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted;
  const packageBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const packageBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';
  const unselectedPill = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';
  const disclaimer = isDark ? 'rgba(255,255,255,0.25)' : theme.textMuted;
  const successOverlay = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(248,250,252,0.92)';
  const successBody = isDark ? 'rgba(255,255,255,0.6)' : theme.textSecondary;

  const handleTopUp = () => {
    if (selectedPackage === null) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPkgData) return;

    setIsProcessingPayment(true);

    try {
      const newBalance = currentCoins + selectedPkgData.coins + selectedPkgData.bonus;
      setCurrentCoins(newBalance);

      const savedUser = await AsyncStorage.getItem(USER_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const updatedUser = { ...parsedUser, balance: newBalance };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

        if (globalUser) {
          setUser({ ...globalUser, ...(updatedUser.name ? { name: updatedUser.name } : {}) });
        }
      }

      setIsPaymentOpen(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 2000);
    } catch {
      setIsPaymentOpen(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <View style={{ position: 'absolute', top: -80, left: -80, width: 220, height: 220, borderRadius: 999, backgroundColor: primaryColorAlpha(0.18) }} />
      <View style={{ position: 'absolute', bottom: -100, right: -80, width: 240, height: 240, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.12)' }} />

      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: headerIconBg,
            borderWidth: 1,
            borderColor: headerIconBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="chevron-left" size={20} color={theme.text} />
        </Pressable>
        <Text
          style={{
            color: theme.text,
            ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
            textTransform: 'uppercase',
          }}
        >
          Top Up Coins
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36, rowGap: 24 }}
      >
        <View
          style={{
            borderRadius: 40,
            padding: 24,
            alignItems: 'center',
            backgroundColor: isDark ? primaryColorAlpha(0.08) : primaryColorAlpha(0.06),
            borderWidth: 1,
            borderColor: primaryColorAlpha(0.26),
          }}
        >
          <Text
            style={{
              color: PRIMARY_COLOR,
              ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}
          >
            Current Balance
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10, marginTop: 10 }}>
            {isLoadingBalance ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Text
                  style={{
                    color: theme.text,
                    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
                  }}
                >
                  {currentCoins.toLocaleString()}
                </Text>
                <Image source={KULCOIN_ICON} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
              </>
            )}
          </View>
          <Text
            style={{
              marginTop: 8,
              color: subtleText,
              ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
            }}
          >
            Kulcoins for Creator Support
          </Text>
        </View>

        <View style={{ rowGap: 14 }}>
          <Text
            style={{
              marginLeft: 8,
              color: sectionLabel,
              ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}
          >
            Select a Package
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
            {coinPackages.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;

              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelectedPackage(pkg.id)}
                  style={{
                    width: '48%',
                    borderRadius: 32,
                    paddingHorizontal: 14,
                    paddingVertical: 18,
                    alignItems: 'center',
                    backgroundColor: isSelected ? primaryColorAlpha(0.2) : packageBg,
                    borderWidth: 1,
                    borderColor: isSelected ? PRIMARY_COLOR : packageBorder,
                  }}
                >
                  {pkg.popular ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: -10,
                        alignSelf: 'center',
                        backgroundColor: PRIMARY_COLOR,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
                          textTransform: 'uppercase',
                          letterSpacing: 1.5,
                        }}
                      >
                        Most Popular
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: primaryColorAlpha(0.12),
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Image source={KULCOIN_ICON} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
                  </View>

                  <Text
                    style={{
                      color: theme.text,
                      ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
                    }}
                  >
                    {pkg.coins.toLocaleString()}
                  </Text>

                  {pkg.bonus > 0 ? (
                    <Text
                      style={{
                        marginTop: 3,
                        color: '#4ade80',
                        ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      +{pkg.bonus} Bonus
                    </Text>
                  ) : null}

                  <View
                    style={{
                      marginTop: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: isSelected ? PRIMARY_COLOR : unselectedPill,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
                      }}
                    >
                      {pkg.price} GHS
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingBottom: 16 }}>
          <Pressable
            onPress={handleTopUp}
            disabled={selectedPackage === null}
            style={{
              minHeight: 72,
              borderRadius: 28,
              backgroundColor: PRIMARY_COLOR,
              opacity: selectedPackage === null ? 0.5 : 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              columnGap: 10,
            }}
          >
            <Text
              style={{
                color: '#fff',
                ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2,
              }}
            >
              Confirm Purchase
            </Text>
            <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          </Pressable>

          <Text
            style={{
              marginTop: 14,
              textAlign: 'center',
              color: disclaimer,
              ...fontSize.b5,
              lineHeight: 18,
              paddingHorizontal: 24,
            }}
          >
            By clicking confirm, you agree to our Terms of Service. Purchases are final and non-refundable.
          </Text>
        </View>
      </ScrollView>

      <PaymentGateway
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => void handlePaymentSuccess()}
        amount={selectedPkgData?.price ?? 0}
        currency="GHS"
        itemName={selectedPkgData ? `${selectedPkgData.coins + selectedPkgData.bonus} Kulcoins` : 'Kulcoins'}
      />

      <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: successOverlay,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 999,
              backgroundColor: primaryColorAlpha(0.2),
              borderWidth: 2,
              borderColor: PRIMARY_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
            }}
          >
            <MaterialIcons name="check-circle" size={64} color={PRIMARY_COLOR} />
          </View>

          <Text
            style={{
              color: theme.text,
              ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
              textTransform: 'uppercase',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Top Up Successful!
          </Text>
          <Text
            style={{
              color: successBody,
              ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
              textAlign: 'center',
            }}
          >
            Your cosmic balance has been updated.
          </Text>

          <View
            style={{
              marginTop: 32,
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 8,
              borderRadius: 999,
              paddingHorizontal: 18,
              paddingVertical: 12,
              backgroundColor: primaryColorAlpha(0.12),
              borderWidth: 1,
              borderColor: primaryColorAlpha(0.3),
            }}
          >
            <Image source={KULCOIN_ICON} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
            <Text
              style={{
                color: theme.text,
                ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
              }}
            >
              {currentCoins.toLocaleString()} Coins
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TopUpCoins;
