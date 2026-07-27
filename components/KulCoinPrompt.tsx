import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { mediumScreen } from '../types';
import { fontSize } from './typography';

const KULCOIN_ICON = require('../assets/coin.png');

interface KulCoinPromptProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCoins: number;
  currentCoins: number;
  onPurchaseKulCoins?: () => void;
}

const KulCoinPrompt: React.FC<KulCoinPromptProps> = ({
  isOpen,
  onClose,
  requiredCoins,
  currentCoins,
  onPurchaseKulCoins,
}) => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 48,
        }}
      >
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />

        <View
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 40,
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            paddingHorizontal: 24,
            paddingVertical: 28,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.05)',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 28,
                backgroundColor: 'rgba(245,158,11,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Image source={KULCOIN_ICON} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
            </View>

            <Text
              style={{
                color: theme.text,
                ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Insufficient Balance
            </Text>

            <Text
              style={{
                color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',
                ...fontSize.b5,
                lineHeight: 20,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              You need <Text style={{ color: PRIMARY_COLOR }}>{requiredCoins} KulCoins</Text> to complete this subscription. Your current balance is <Text style={{ color: theme.text }}>{currentCoins}</Text>.
            </Text>

            <View style={{ width: '100%', rowGap: 12 }}>
              <Pressable
                onPress={() => {
                  if (onPurchaseKulCoins) {
                    onPurchaseKulCoins();
                    return;
                  }
                  onClose();
                  navigation.navigate('TopUpCoins');
                }}
                style={{
                  width: '100%',
                  minHeight: 64,
                  borderRadius: 18,
                  backgroundColor: PRIMARY_COLOR,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  columnGap: 8,
                }}
              >
                <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                <Text
                  style={{
                    color: '#fff',
                    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Purchase
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={{
                  width: '100%',
                  minHeight: 64,
                  borderRadius: 18,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
                    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Maybe Later
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 24,
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: 'rgba(34,197,94,0.1)',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(34,197,94,0.2)',
              }}
            >
              <MaterialIcons name="info" size={14} color="#22c55e" />
              <Text
                style={{
                  color: '#22c55e',
                  ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                  textTransform: 'uppercase',
                  letterSpacing: 1.4,
                }}
              >
                Exchange Rate: 1 GHS = 10 KulCoins
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default KulCoinPrompt;
