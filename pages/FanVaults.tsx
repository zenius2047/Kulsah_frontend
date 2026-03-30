import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const FanVaults: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  const vaults = [
    { name: 'Elena Rose', contentCount: 42, newCount: 3, img: 'https://picsum.photos/seed/elena/200', lastUpdate: '2h ago' },
    { name: 'Zion King', contentCount: 12, newCount: 0, img: 'https://picsum.photos/seed/zion/200', lastUpdate: '1d ago' },
    { name: 'Amara', contentCount: 8, newCount: 1, img: 'https://picsum.photos/seed/amara/200', lastUpdate: '3d ago' },
    { name: 'DJ Kay-T', contentCount: 15, newCount: 0, img: 'https://picsum.photos/seed/djk/200', lastUpdate: '5d ago' },
  ];

  return (
    <View>
      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>arrow_back</Text>
        </Pressable>
        <Text>Creator Vaults</Text>
      </View>

      <View>
        <View>
          <View>
            <View>
              <Text>stars</Text>
            </View>
            <View>
              <Text>Vault Pulse</Text>
              <Text>You have <Text>4 new items</Text> across your unlocked creator vaults.</Text>
            </View>
          </View>
          <View></View>
        </View>

        <Text>Unlocked Access</Text>
        <View>
          {vaults.map((vault) => (
            <Pressable 
              key={vault.name}
              onPress={() => navigation.navigate('/premium')}
             
            >
              <View>
                <View>
                  <View>
                    <Image source={{ uri: vault.img }} />
                  </View>
                  {vault.newCount > 0 && (
                    <View>
                      {vault.newCount}
                    </View>
                  )}
                </View>
                <View>
                  <Text>{vault.name}</Text>
                  <Text>{vault.contentCount} Assets • Updated {vault.lastUpdate}</Text>
                </View>
              </View>
              <Text>chevron_right</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

export default FanVaults;
