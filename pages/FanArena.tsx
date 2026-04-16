import React from 'react';
import { useThemeMode } from '../theme';
import { Platform, Text, View } from 'react-native';
import { mediumScreen } from '../types';
import Discover from './Discover';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FanArena: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: Platform.OS == 'ios' ? 54: insets.top,
      }}
    >

      <View
        style={{
          alignItems: 'center',
          marginTop: 15,
          backgroundColor: theme.screen,
        }}
      >
        <Text
          style={{
            color: isDark ? '#ffffff' : '#000000',
            fontFamily: 'PlusJakartaSansBold',
            fontSize: mediumScreen ? 20 : 16,
            // marginBottom: 10,
          }}
        >
          Discover
        </Text>
      </View>

      <Discover embedded />
    </View>
  );
};

export default FanArena;
