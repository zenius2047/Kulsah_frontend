import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import { Pressable, Text, View } from 'react-native';
import { mediumScreen } from '../types';
import Discover from './Discover';
import Community from './Community';

const FanArena: React.FC = () => {
  const { theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<'discover' | 'community'>('discover');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: 54,
      }}
    >

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 15,
          backgroundColor: theme.screen,
        }}
      >
        {[
          { key: 'discover', label: 'Discover' },
          { key: 'community', label: 'Community' },
        ].map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setActiveTab(item.key as 'discover' | 'community')}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: isActive ? theme.accent : theme.textSecondary,
                  fontFamily: 'PlusJakartaSansBold',
                  fontSize: mediumScreen ? 20 : 16,
                  marginBottom: 10,
                }}
              >
                {item.label}
              </Text>
              {isActive ? (
                <View
                  style={{
                    height: 2.5,
                    width: 88,
                    backgroundColor: theme.accent,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'discover' ? <Discover embedded /> : null}
      {activeTab === 'community' ? <Community embedded /> : null}
    </View>
  );
};

export default FanArena;
