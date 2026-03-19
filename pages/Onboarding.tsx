import React from 'react';
import { Image, ImageBackground, Pressable, StatusBar, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface OnboardingProps {
  onLogin: (role: 'fan' | 'creator') => void;
}

const ElephantLogo = () => (
  <Image
    source={{ uri: 'https://img.icons8.com/ios-filled/150/ffffff/elephant.png' }}
    style={{ width: 72, height: 72 }}
  />
);

const Onboarding: React.FC<OnboardingProps> = ({ onLogin }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: '#060913' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent = {true} />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1200' }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(6,9,19,0.72)' }} />
      </ImageBackground>

      {/* <View style={{
        position: 'absolute',
        top: 50,
        width: '100%',
        alignItems: 'center',
      }} pointerEvents="none">
              <Text style={{
                color: '#6200EE',
              fontWeight: '900',
              letterSpacing: 4,
              }}>PULSAR GALAXY</Text>
            </View> */}

      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 36 }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 36,
              backgroundColor: '#cd2bee',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <ElephantLogo />
          </View>
          <Text style={{
            color: 
            'white',
            marginTop: 18,
            fontSize: 52, 
            // fontWeight: '900',
            letterSpacing: -1,
            fontFamily: 'PlusJakartaSansExtraBold'
            }}>KULSAH</Text>
          <Text
            style={{
              color: '#cd2bee',
              marginTop: 8,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 6,
              textTransform: 'uppercase',


            }}
          >
            The Creator Galaxy
          </Text>
        </View>

        <View style={{ 
          alignItems: 'center',
          justifyContent: 'center'
          }}>
          <Text style={{
            color: 'white',
            fontSize: 28,
            fontWeight: '900',
            textAlign: 'center',
            lineHeight: 38,
            textTransform: 'uppercase',
            fontFamily: 'PlusJakartaSansBold'
             }}>
            Own the Stage.{'\n'}Inspire the Orbits.
          </Text>
          <Text style={{
            color: '#64748b',
            marginTop: 14, 
            textAlign: 'center', 
            fontSize: 14, 
            lineHeight: 18,
            // fontWeight: '800',
            fontFamily: 'PlusJakartaSansBold'
             }}>
            Join an elite network where creative energy converts into real-world{"\n"}impact.
          </Text>
        </View>

        <View>
          <Pressable
            onPress={() => navigation.navigate('Signup')}
            style={{
              height: 62,
              borderRadius: 26,
              backgroundColor: '#cd2bee',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              flexDirection: 'row'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }}>Join The Galaxy </Text>
            <MaterialIcons name="arrow-forward" size={34} color='white'></MaterialIcons>
          </Pressable>

          {/* <Pressable
            onPress={() => onLogin('creator')}
            style={{
              height: 62,
              borderRadius: 26,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#111827', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' }}>Join as Creator</Text>
          </Pressable> */}

          <Pressable onPress={() => onLogin('fan')} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
              Sign In to Hub
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 10 }}>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Privacy</Text>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Security</Text>
            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Legal</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Onboarding;
