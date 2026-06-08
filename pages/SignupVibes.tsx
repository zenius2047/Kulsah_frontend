import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { setUser, User } from '../types';
import { SignupVibesStep } from './Signup';
import { useThemeMode } from "../theme";
import { fontSize } from './typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SignupVibes: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();

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
      name: 'guest',
      role: 'fan',
    };

    await AsyncStorage.setItem('pulsar_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.screen, paddingTop: Platform.OS === 'ios' ? 54: insets.top }}>
      {/* <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ height: '100%', width: '50%', backgroundColor: PRIMARY_COLOR }} />
      </View> */}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          // paddingTop: 16,
          paddingBottom: 14,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            borderRadius: 999,
            padding: 10,
            borderColor: theme.border,
            borderWidth: 1,
            backgroundColor: isDark ? 'rgba(31,16,34,0.75)' : 'rgba(15,23,42,0.04)',
          }}
        >
          <MaterialIcons name="chevron-left" color={theme.text} size={24} />
        </Pressable>
        <Text style={{ color: theme.text, fontWeight: '900', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2 }}>KULSAH</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <SignupVibesStep selectedVibes={selectedVibes} onToggleVibe={toggleVibe} onContinue={() => void handleContinue()} />
      </ScrollView>
    </View>
  );
};

export default SignupVibes;
