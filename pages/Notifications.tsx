import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const Notifications: React.FC = () => {
  const navigation = useNavigation<any>();
  const items = [
    { id: 1, type: 'drop', title: 'New Release: Elena Rose', text: '“Ethereal” is now streaming exclusively on Pulsar.', time: '2m ago', img: 'https://picsum.photos/seed/n1/100' },
    { id: 2, type: 'ticket', title: 'Ticket Alert: Burna Boy', text: 'Your seats for O2 Arena are now available in your wallet.', time: '1h ago', icon: 'confirmation_number' },
    { id: 3, type: 'social', title: 'Alex Rivera sent a message', text: '“Loved the new track! Can’t wait...”', time: '3h ago', img: 'https://picsum.photos/seed/n3/100' },
    { id: 4, type: 'system', title: 'Identity Verified', text: 'Your Pulsar Identity Pass is now active.', time: 'Yesterday', icon: 'verified' },
  ];

  return (
    <View>
      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>arrow_back</Text>
        </Pressable>
        <Text>Alerts</Text>
      </View>

      <View>
        <View>
          {['All', 'Drops', 'Tickets', 'Mentions'].map((cat, i) => (
            <Pressable key={cat}>
              {cat}
            </Pressable>
          ))}
        </View>

        <View>
          {items.map((item) => (
            <View key={item.id}>
              <View>
                {item.img ? (
                  <Image source={{ uri: item.img }} />
                ) : (
                  <Text>{item.icon}</Text>
                )}
              </View>
              <View>
                <View>
                  <Text>{item.title}</Text>
                  <Text>{item.time}</Text>
                </View>
                <Text>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Notifications;
