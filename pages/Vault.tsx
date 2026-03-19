import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const Vault: React.FC = () => {
  const navigation = useNavigation<any>();
  const content = [
    { title: 'BTS: Recording Ethereal', type: 'Video', duration: '12:40', locked: false, img: 'https://picsum.photos/seed/v1/400/300' },
    { title: 'Summer Tour Lookbook', type: 'Photo Set', count: '24 photos', locked: false, img: 'https://picsum.photos/seed/v2/400/300' },
    { title: 'Demo: Neon Dreams', type: 'Audio', duration: '4:12', locked: true, img: 'https://picsum.photos/seed/v3/400/300' },
    { title: 'Afterparty Access', type: 'Link', locked: true, img: 'https://picsum.photos/seed/v4/400/300' },
  ];

  return (
    <View>
      <View>
        <Image source={{ uri: "https://picsum.photos/seed/vaulthead/800/400" }} />
        <View></View>
        <View>
          <View>
            <Text>stars</Text>
            <Text>Subscriber Vault</Text>
          </View>
          <Text>Elena Rose: Uncut</Text>
        </View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>arrow_back</Text>
        </Pressable>
      </View>

      <View>
        <View>
          {content.map((item, i) => (
            <View key={i}>
              <View>
                <Image source={{ uri: item.img }} />
                <View>
                  <Text>{item.type === 'Video' ? 'play_circle' : 'visibility'}</Text>
                </View>
                {item.locked && (
                  <View>
                    <Text>lock</Text>
                    <Text>Upgrade Tier</Text>
                  </View>
                )}
                <View>
                  <Text>{item.duration || item.count || 'Exclusive'}</Text>
                </View>
              </View>
              <View>
                <Text>{item.title}</Text>
                <Text>{item.type}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Vault;
