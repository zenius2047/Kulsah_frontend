import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const FanPremium: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  const premiums = [
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
        <Text>Creator Premium</Text>
      </View>

      <View>
        <View>
          <View>
            <View>
              <Text>stars</Text>
            </View>
            <View>
              <Text>Premium Pulse</Text>
              <Text>You have <Text>4 new items</Text> across your unlocked creator channels.</Text>
            </View>
          </View>
          <View></View>
        </View>

        <Text>Unlocked Access</Text>
        <View>
          {premiums.map((prem) => (
            <Pressable 
              key={prem.name}
              onPress={() => navigation.navigate('/premium')}
             
            >
              <View>
                <View>
                  <View>
                    <Image source={{ uri: prem.img }} />
                  </View>
                  {prem.newCount > 0 && (
                    <View>
                      {prem.newCount}
                    </View>
                  )}
                </View>
                <View>
                  <Text>{prem.name}</Text>
                  <Text>{prem.contentCount} Assets • Updated {prem.lastUpdate}</Text>
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

export default FanPremium;
