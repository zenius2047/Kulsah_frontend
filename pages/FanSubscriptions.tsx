import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const FanSubscriptions: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  const subs = [
    { id: '1', name: 'Elena Rose', tier: 'Gold', price: '$49.99', nextBill: 'Sep 12, 2024', img: 'https://picsum.photos/seed/elena/150', color: 'border-yellow-500/40 bg-yellow-500/5', perks: ['1:1 Live Monthly', 'All Premium Access', 'VIP Merch Store'] },
    { id: '2', name: 'Zion King', tier: 'Silver', price: '$14.99', nextBill: 'Sep 15, 2024', img: 'https://picsum.photos/seed/zion/150', color: 'border-slate-400/40 bg-slate-400/5', perks: ['Monthly BTS', 'Standard Premium'] },
    { id: '3', name: 'Amara', tier: 'Bronze', price: '$4.99', nextBill: 'Oct 01, 2024', img: 'https://picsum.photos/seed/amara/150', color: 'border-orange-600/40 bg-orange-600/5', perks: ['Feed Exclusives'] },
  ];

  return (
    <View>
      <View>
        <View>
          <Pressable onPress={() => navigation.goBack()}>
            <Text>chevron_left</Text>
          </Pressable>
          <Text>Active Support</Text>
        </View>
        <View>
          <Text>{subs.length} Active</Text>
        </View>
      </View>

      <View>
        {subs.map((sub) => (
          <View 
            key={sub.id}
           
          >
            <View>
              <View>
                <Image source={{ uri: sub.img }} />
              </View>
              <View>
                <View>
                  <Text>{sub.name}</Text>
                  <Text>verified</Text>
                </View>
                <View>
                  <Text>Membership</Text>
                </View>
              </View>
            </View>

            <View>
               <Text>Unlocked Perks</Text>
               <View>
                  {sub.perks.map((p, i) => (
                    <Text key={i}>• {p}</Text>
                  ))}
               </View>
            </View>

            <View>
              <View>
                <Text>Next Renewal</Text>
                <Text>{sub.nextBill}</Text>
              </View>
              <View>
                <Text>Monthly Cost</Text>
                <Text>{sub.price}</Text>
              </View>
            </View>

            <View>
               <Pressable 
                onPress={() => navigation.navigate(`/profile/${sub.name}`)}
               
              >
                Visit Hub
              </Pressable>
              <Pressable>
                Manage
              </Pressable>
            </View>
            
            {/* Background Texture */}
            <View></View>
          </View>
        ))}

        <View>
          <View>
             <Text>add_circle</Text>
          </View>
          <Pressable 
            onPress={() => navigation.navigate('/explore')}
           
          >
            Discover new creators to support
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default FanSubscriptions;
