import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { fontScale } from '../fonts';
import { setUser, User } from '../types';
import { SignupVibesStep } from './Signup';

const SignupVibes: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set());

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedVibes.size === 0) return;

    const guestUser: User = {
      id: '',
      name: 'Guest',
      role: 'fan',
    };

    await AsyncStorage.setItem('pulsar_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50 }}>
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ height: '100%', width: '50%', backgroundColor: '#cd2bee' }} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 46,
          paddingBottom: 14,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            borderRadius: 999,
            padding: 10,
            borderColor: '#ffffff1a',
            borderWidth: 1,
            backgroundColor: '#1f1022bf',
          }}
        >
          <MaterialIcons name="chevron-left" color="white" size={24} />
        </Pressable>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: fontScale(20) }}>KULSAH</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <SignupVibesStep selectedVibes={selectedVibes} onToggleVibe={toggleVibe} onContinue={() => void handleContinue()} />
      </ScrollView>
    </View>
  );
};

export default SignupVibes;
