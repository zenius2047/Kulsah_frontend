import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { User, UserRole } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import MovieIcon from '../assets/icons/movieIcon-svg.svg';
import StarsIcon from '../assets/icons/stars-svg.svg';
import TicketIcon from '../assets/icons/ticket-svg.svg';
import VerifyIcon from '../assets/icons/verified-svg.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontScale } from '../fonts';

interface SignupProps {
  onLogin: (role: UserRole, redirectTo?: string) => void;
}

type OnboardingStep = 'welcome' | 'name' | 'vibes' | 'credentials' | 'success';

interface InspirationTag {
  id: string;
  label: string;
  img: string;
}

const INSPIRATIONS: InspirationTag[] = [
  { id: 'afro', label: 'Afro-Cinema', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400' },
  { id: 'synth', label: 'Synthwave', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400' },
  { id: 'concert', label: 'Live Events', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=400' },
  { id: 'vlogs', label: 'Creator Vlogs', img: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=400' },
  { id: 'neon', label: 'Neon Art', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400' },
  { id: 'hifi', label: 'High Fidelity', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400' },
  { id: 'education', label: 'Education', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400' },
  { id: 'tech', label: 'Tech', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
  { id: 'podcasts', label: 'Podcasts', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332c17?auto=format&fit=crop&q=80&w=400' },
  { id: 'comedy', label: 'Comedy', img: 'https://images.unsplash.com/photo-1527224857810-8c5d6c4471f1?auto=format&fit=crop&q=80&w=400' },
];

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [user, setUser] = useState<User>({id: "", name: "", role: 'fan'});

  const steps: OnboardingStep[] = useMemo(
    () => ['welcome', 'name', 'vibes', 'credentials', 'success'],
    []
  );
  const progress = (steps.indexOf(step) / (steps.length - 1)) * 100;

  function generateRandom10Digit(): string {
  let result = "";
  
  for (let i = 0; i < 10; i++) {
    result += Math.floor(Math.random() * 10);
  }

  return result;
}


  const handleNext = () => {
    setUser({
      ...user,
      name: formData.name
    })
    const nextIdx = steps.indexOf(step) + 1;
    if (nextIdx < steps.length) setStep(steps[nextIdx]);
  };

  const handleBack = () => {
    const prevIdx = steps.indexOf(step) - 1;
    if (prevIdx >= 0) setStep(steps[prevIdx]);
    else navigation.goBack();
  };

  const toggleVibe = (id: string) => {
    const next = new Set(selectedVibes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVibes(next);
  };

  const handleSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
    }, 1200);
  };

  const completeOnboarding = async() => {
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(user));
    onLogin('fan', '/feed');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50}}>
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: '#cd2bee' }} />
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
        {step !== 'success' ? (
          <Pressable onPress={handleBack} style={{
            borderRadius: 999,
            padding: 10,
            borderColor: '#ffffff1a',
            borderWidth: 1,
            backgroundColor: '#1f1022bf'
          }}>
            <MaterialIcons name='chevron-left' color='white' size={24}></MaterialIcons>
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={{ color: 'white', fontWeight: '900', fontSize: fontScale(20) }}>KULSAH</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }}>
        {step === 'welcome' && (
          <View style={{ gap: 18 }}>
            <Text style={{ color: 'white', fontSize: fontScale(40), textTransform: 'uppercase', fontFamily: 'PlusJakartaSansExtraBold'}}>{'Enter the\nGalaxy.'}</Text>
            <Text style={{
              color: '#ffffff99',
              fontSize: fontScale(16),
              lineHeight: 18,
              fontFamily: 'PlusJakartaSansBold'
               }}>
              Join a new era of creator-fan connection. Your unique identity starts here.
            </Text>
            {[
              'Cinematic Transmissions',
              'Unlock Premium Vaults',
              'Secure Exclusive Entry',
            ].map((item) => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ 
                  width: 46, 
                  height: 46, 
                  borderRadius: 14, 
                  borderColor: '#e5e7eb',
                  borderWidth: 1,
                  // backgroundColor: 'rgba(205,43,238,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center'
                   }}>
                  {
                    item === 'Cinematic Transmissions' ? <MovieIcon height = {24} width= {24} fill= '#cd2bee'></MovieIcon>:
                    item === 'Unlock Premium Vaults' ? <StarsIcon height = {24} width= {24} fill= '#cd2bee'></StarsIcon>: 
                    <TicketIcon height = {24} width= {24} fill= '#cd2bee'></TicketIcon>
                  }
                </View>
                <Text style={{ color: '#ffffffcc', fontWeight: '700', fontFamily: 'PlusJakartaSansMedium' }}>{item}</Text>
              </View>
            ))}
            <Pressable
              onPress={handleNext}
              style={{ backgroundColor: '#cd2bee', borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Get Started</Text>
            </Pressable>
          </View>
        )}

        {step === 'name' && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: 'white', fontSize: fontScale(30), fontFamily: 'PlusJakartaSansExtraBold' }}>YOUR ALIAS</Text>
            <Text style={{
              color: '#FFFFFF99',
              fontFamily: 'PlusJakartaSansMedium'
               }}>This is how the galaxy will recognize{'\n'}you.</Text>
            <Text
            style={{
              color: '#94a3b8',
              fontFamily: 'PlusJakartaSansBold',
              fontSize: fontScale(10),
              letterSpacing: 4,
              marginTop: 35,
              marginBottom: 10
            }}
            >DISPLAY NAME</Text>
            <TextInput
              value={formData.name}
              onChangeText={(name) => setFormData({ ...formData, name })}
              placeholder="e.g. Alex Moon"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'white',
                borderRadius: 28,
                borderColor: !isFocused ? '#ffffff14': '#3b82f680',
                borderWidth: 1,
                height: 64,
                paddingHorizontal: 24,
                // paddingVertical: 29,
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'PlusJakartaSansBold',
                fontSize: fontScale(16),
              }}
            />
              {formData.name.length > 2 && <View
              style={{
                borderRadius: 32,
                backgroundColor: '#1F1022BF',
                borderColor: '#ffffff14',
                borderWidth: 1,
                height: 118,
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
              >
              <Text
              style = {{
                fontFamily: "PlusJakartaSansBold",
                color: '#cb2bee',
                fontSize: fontScale(9),
                letterSpacing: 4,
              }} 
              >
                PUBLIC PREVIEW
              </Text>
              <View
              style = {{
                flexDirection: 'row',
                marginTop: 10,
              }}
              >
                <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  borderWidth: 3,
                  borderColor: '#cd2bee',
                  // justifyContent: 'center',
                  paddingVertical:4,
                  alignItems: 'center'
                }}>
                  <Text 
                  style = {{
                    fontFamily: 'PlusJakartaSansBold',
                    color: '#cd2bee',
                    fontSize: fontScale(20),
                    textAlign: 'center'
                  }}
                  >
                    {formData.name[0]}
                  </Text>
                </View>
                <View
                style={{
                  marginLeft: 15,
                }}
                >
                <Text 
                style={{
                  fontFamily: 'PlusJakartaSansBold',
                  color: 'white',
                  fontSize: fontScale(16),
                }}
                >
                  {formData.name}
                </Text>
                <Text style={{
                  color: '#94a3b8',
                  letterSpacing: 1,
                  fontSize: fontScale(10),
                  fontWeight: '700',
                  fontFamily: 'PlusJakartaSans',
                }}>
                  NEW ARRIVAL {'#'}0042
                </Text>
                </View>
              </View>
              </View>}
              
            <Pressable
              disabled={formData.name.length < 2}
              onPress={handleNext}
              style={{
                backgroundColor: formData.name.length >= 2 ? '#cd2bee' : 'rgba(255,255,255,0.25)',
                borderRadius: 20,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            ><Text style={{ color: 'white', fontWeight: '900' }}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === 'vibes' && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: 'white', fontSize: fontScale(30), fontWeight: '900' }}>Inspirations</Text>
            <Text style={{ color: '#cbd5e1' }}>Select your preferred creative orbits.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {INSPIRATIONS.map((tag) => {
                const isSelected = selectedVibes.has(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleVibe(tag.id)}
                    style={{
                      width: '48%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isSelected ? '#cd2bee' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Image source={{ uri: tag.img }} style={{ width: '100%', height: 88 }} />
                    <View style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                      <Text style={{ color: 'white', fontSize: fontScale(11), fontWeight: '700' }}>{tag.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              disabled={selectedVibes.size === 0}
              onPress={handleNext}
              style={{
                backgroundColor: selectedVibes.size > 0 ? '#cd2bee' : 'rgba(255,255,255,0.25)',
                borderRadius: 20,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Secure Orbits</Text>
            </Pressable>
          </View>
        )}

        {step === 'credentials' && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: 'white', fontSize: fontScale(30), fontWeight: '900' }}>Uplink Keys</Text>
            <Text style={{ color: '#cbd5e1' }}>Synchronize your account with our secure node.</Text>
            <TextInput
              value={formData.email}
              onChangeText={(email) => setFormData({ ...formData, email })}
              placeholder="name@nexus.io"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14 }}
            />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4 }}>
              <TextInput
                value={formData.password}
                onChangeText={(password) => setFormData({ ...formData, password })}
                placeholder="Min. 8 characters"
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
                style={{ color: 'white', paddingVertical: 10 }}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: 14, top: 12 }}>
                <Text style={{ color: '#cbd5e1' }}>{showPassword ? 'visibility_off' : 'visibility'}</Text>
              </Pressable>
            </View>
            <Pressable
              disabled={formData.password.length < 8 || !formData.email || isProcessing}
              onPress={handleSubmit}
              style={{
                backgroundColor:
                  formData.password.length >= 8 && !!formData.email && !isProcessing
                    ? '#cd2bee'
                    : 'rgba(255,255,255,0.25)',
                borderRadius: 20,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>{isProcessing ? 'Processing...' : 'Register'}</Text>
            </Pressable>
          </View>
        )}

        {step === 'success' && (
          <View style={{ alignItems: 'center', gap: 16, paddingTop: 30 }}>
            <View
            style={{
                padding: 5,
                borderWidth: 5,
                backgroundColor:'black',
                borderColor: '#cd2bee',
                borderRadius: 38
              }}
            >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 26,
                backgroundColor: '#cd2bee',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VerifyIcon fill='white' height={90} width={90}  strokeWidth={0}/>
            </View>
            </View>
            <Text style={{ color: 'white', fontSize: fontScale(34), textAlign: 'center', fontFamily: 'PlusJakartaSansExtraBold' }}>{'IDENTITY\nSECURED'}</Text>
            <Text style={{ color: '#cbd5e1', textAlign: 'center' }}>
              Welcome home,{'\n'}<Text style={{ color: '#cd2bee', fontWeight: '900' }}>{formData.name || 'Fan'}</Text>.
            </Text>
            <Pressable
              onPress={completeOnboarding}
              style={{
                backgroundColor: '#cd2bee',
                borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', width: '80%' }}
            >
              <Text style={{
                color: 'white', 
                fontWeight: '900',
                textTransform: 'uppercase'
                 }}>ENTER THE GALAXY</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Signup;

