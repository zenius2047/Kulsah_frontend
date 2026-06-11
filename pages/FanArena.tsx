import React from 'react';
import { useThemeMode } from '../theme';
import { Platform, Text, View } from 'react-native';
import { mediumScreen } from '../types';
import Discover from './Discover';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontSize } from './typography';

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

      <Discover />
    </View>
  );
};

export default FanArena;
