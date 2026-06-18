import React, { useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { Image, Pressable, ScrollView, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { mediumScreen, type User, type UserRole } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import MovieIcon from '../assets/icons/movieIcon-svg.svg';
import StarsIcon from '../assets/icons/stars-svg.svg';
import TicketIcon from '../assets/icons/ticket-svg.svg';
import VerifyIcon from '../assets/icons/verified-svg.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KulsahInputBar from '../components/KulsahInputBar';
import { fontSize } from './typography';

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

type SignupRouteParams = {
  initialStep?: OnboardingStep;
  initialSelectedVibes?: string[];
};

type SignupVibesStepProps = {
  selectedVibes: Set<string>;
  onToggleVibe: (id: string) => void;
  onContinue: () => void;
};

export const SignupVibesStep: React.FC<SignupVibesStepProps> = ({
  selectedVibes,
  onToggleVibe,
  onContinue,
}) => {
  const { isDark, theme } = useThemeMode();

  return (
  <View style={{ gap: 10 }}>
    <Text style={{ color: theme.text, fontSize: fontSize.b1.fontSize + (mediumScreen ? 4 : 2), fontFamily: fontSize.b1.fontFamily, lineHeight: fontSize.b1.fontSize + 2+ (mediumScreen ? 4 : 2) }}>Inspirations</Text>
    <Text style={{ color: theme.textSecondary, ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 1 }}>Select your preferred creative orbits.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {INSPIRATIONS.map((tag) => {
        const isSelected = selectedVibes.has(tag.id);
        return (
          <Pressable
            key={tag.id}
            onPress={() => onToggleVibe(tag.id)}
            style={{
              width: '48%',
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: isSelected ? PRIMARY_COLOR : theme.border,
              backgroundColor: theme.card,
            }}
          >
            <Image source={{ uri: tag.img }} style={{ width: '100%', height: 140 }} />
            <View style={{
              padding: 8,
              backgroundColor: 'rgba(0,0,0,0.3)',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              justifyContent: 'flex-end'
              }}>
              <Text style={{ color: 'white', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 }}>{tag.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
    <Pressable
      disabled={selectedVibes.size === 0}
      onPress={onContinue}
      style={{
        backgroundColor: selectedVibes.size > 0 ? PRIMARY_COLOR : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.16)',
        borderRadius: 20,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: 'white' }}>Secure Orbits</Text>
    </Pressable>
  </View>
  );
};

const Signup: React.FC<SignupProps> = ({ onLogin }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as SignupRouteParams;
  const [step, setStep] = useState<OnboardingStep>(params.initialStep ?? 'welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set(params.initialSelectedVibes ?? []));
  const [isProcessing, setIsProcessing] = useState(false);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50}}>
      {/* <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: PRIMARY_COLOR }} />
      </View> */}

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
        <Text style={{ color: 'white', ...fontSize.h1, lineHeight: fontSize.h1.fontSize + 2 }}>KULSAH</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <View style={{ gap: 18 }}>
            <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase'}}>{'Enter the\nGalaxy.'}</Text>
            <Text style={{
              color: '#ffffff99',
              ...fontSize.b4,
              lineHeight: 18,
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
                  // backgroundColor: primaryColorAlpha(0.16),
                  alignItems: 'center',
                  justifyContent: 'center'
                   }}>
                  {
                    item === 'Cinematic Transmissions' ? <MovieIcon height = {24} width= {24} fill={PRIMARY_COLOR}></MovieIcon>:
                    item === 'Unlock Premium Vaults' ? <StarsIcon height = {24} width= {24} fill={PRIMARY_COLOR}></StarsIcon>:
                    <TicketIcon height = {24} width= {24} fill={PRIMARY_COLOR}></TicketIcon>
                  }
                </View>
                <Text style={{ color: '#ffffffcc' }}>{item}</Text>
              </View>
            ))}
            <Pressable
              onPress={handleNext}
              style={{ backgroundColor: PRIMARY_COLOR, borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}
            >
              <Text style={{ color: 'white'}}>Get Started</Text>
            </Pressable>
          </View>
        )}

        {step === 'name' && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2 }}>YOUR ALIAS</Text>
            <Text style={{
              color: '#FFFFFF99',
               }}>This is how the galaxy will recognize{'\n'}you.</Text>
            <Text
            style={{
              color: '#94a3b8',
              ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
              letterSpacing: 4,
              marginTop: 35,
              marginBottom: 10
            }}
            >DISPLAY NAME</Text>
            <KulsahInputBar
              value={formData.name}
              onChangeText={(name) => setFormData({ ...formData, name })}
              placeholder="e.g. Alex Moon"
              placeholderTextColor="#94a3b8"
              containerStyle={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 28,
                borderColor: '#ffffff14',
                borderWidth: 1,
                height: 64,
                paddingHorizontal: 24,
              }}
              inputStyle={{
                color: 'white',
                ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
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
                color: '#cb2bee',
                ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
                  borderColor: PRIMARY_COLOR,
                  // justifyContent: 'center',
                  paddingVertical:4,
                  alignItems: 'center'
                }}>
                  <Text
                  style = {{
                    color: PRIMARY_COLOR,
                    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
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
                  color: 'white',
                  ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
                }}
                >
                  {formData.name}
                </Text>
                <Text style={{
                  color: '#94a3b8',
                  letterSpacing: 1,
                  ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
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
                backgroundColor: formData.name.length >= 2 ? PRIMARY_COLOR : 'rgba(255,255,255,0.25)',
                borderRadius: 20,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            ><Text style={{ color: 'white' }}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === 'vibes' && <SignupVibesStep selectedVibes={selectedVibes} onToggleVibe={toggleVibe} onContinue={handleNext} />}

        {step === 'credentials' && (
          <View style={{ gap: 14 }}>
            <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2 }}>Uplink Keys</Text>
            <Text style={{ color: '#cbd5e1' }}>Synchronize your account with our secure node.</Text>
            <KulsahInputBar
              value={formData.email}
              onChangeText={(email) => setFormData({ ...formData, email })}
              placeholder="name@nexus.io"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
              containerStyle={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: '#ffffff14',
              }}
              inputStyle={{ color: 'white' }}
            />
            <KulsahInputBar
              value={formData.password}
              onChangeText={(password) => setFormData({ ...formData, password })}
              placeholder="Min. 8 characters"
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
              containerStyle={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: '#ffffff14',
              }}
              inputStyle={{ color: 'white' }}
              rightAccessory={(
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color="#cbd5e1" />
                </Pressable>
              )}
            />
            <Pressable
              disabled={formData.password.length < 8 || !formData.email || isProcessing}
              onPress={handleSubmit}
              style={{
                backgroundColor:
                  formData.password.length >= 8 && !!formData.email && !isProcessing
                    ? PRIMARY_COLOR
                    : 'rgba(255,255,255,0.25)',
                borderRadius: 20,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: 'white' }}>{isProcessing ? 'Processing...' : 'Register'}</Text>
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
                borderColor: PRIMARY_COLOR,
                borderRadius: 38
              }}
            >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 26,
                backgroundColor: PRIMARY_COLOR,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VerifyIcon fill='white' height={90} width={90}  strokeWidth={0}/>
            </View>
            </View>
            <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textAlign: 'center' }}>{'IDENTITY\nSECURED'}</Text>
            <Text style={{ color: '#cbd5e1', textAlign: 'center' }}>
              Welcome home,{'\n'}<Text style={{ color: PRIMARY_COLOR }}>{formData.name || 'Fan'}</Text>.
            </Text>
            <Pressable
              onPress={completeOnboarding}
              style={{
                backgroundColor: PRIMARY_COLOR,
                borderRadius: 20, height: 56, alignItems: 'center', justifyContent: 'center', width: '80%' }}
            >
              <Text style={{
                color: 'white',
                textTransform: 'uppercase'
                 }}>ENTER THE GALAXY</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  </KeyboardAvoidingView>
  );
};

export default Signup;

