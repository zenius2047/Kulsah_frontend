import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';

interface Vibe {
  id: string;
  label: string;
  img: string;
  desc: string;
}

const VIBES: Vibe[] = [
  { id: 'afro', label: 'Afrobeats', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400', desc: 'Rhythm & Soul' },
  { id: 'synth', label: 'Synthwave', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400', desc: 'Retro Future' },
  { id: 'hiphop', label: 'Hip-Hop', img: 'https://images.unsplash.com/photo-1546707012-c51841275c6f?auto=format&fit=crop&q=80&w=400', desc: 'Lyrical flow' },
  { id: 'amapiano', label: 'Amapiano', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400', desc: 'Deep house fusion' },
  { id: 'lofi', label: 'Lo-Fi', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400', desc: 'Chill beats' },
  { id: 'skits', label: 'Skits', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400', desc: 'Creative Shorts' },
  { id: 'podcasts', label: 'Podcasts', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400', desc: 'Deep Conversations' },
  { id: 'comedy', label: 'Comedy', img: 'https://images.unsplash.com/photo-1527224857810-8c5d6c4471f1?auto=format&fit=crop&q=80&w=400', desc: 'Unfiltered Laughs' },
  { id: 'techno', label: 'Techno', img: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=400', desc: 'Industrial pulse' },
  { id: 'rnb', label: 'Midnight R&B', img: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400', desc: 'Smooth vibes' },
  { id: 'drill', label: 'Drill', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400', desc: 'Urban intensity' },
];

const VibePickert: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const contentWidth = width - 32;
  const cardGap = 16;
  const cardWidth = (contentWidth - cardGap) / 2;
  const hasSelected = selected.size > 0;

  const toggleVibe = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    if (!hasSelected) return;
    navigation.navigate('Feed');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.screen}>
        <LinearGradient
          colors={['rgba(205,43,238,0.14)', 'rgba(205,43,238,0)']}
          style={styles.backgroundGradient}
        />

        <View style={[styles.header, { paddingTop: insets.top + 48 }]}>
          <Text style={styles.title}>Pick your vibe</Text>
          <Text style={styles.subtitle}>Select 1 or more vibe to personalize your galaxy.</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
        >
          <View style={styles.grid}>
            {VIBES.map((vibe, index) => {
              const isSelected = selected.has(vibe.id);
              const isRightColumn = index % 2 === 1;

              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => toggleVibe(vibe.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Select ${vibe.label} vibe`}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      width: cardWidth,
                      marginRight: isRightColumn ? 0 : cardGap,
                      borderColor: isSelected ? '#cd2bee' : 'rgba(255,255,255,0.06)',
                      shadowColor: isSelected ? '#cd2bee' : '#000',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <Image source={{ uri: vibe.img }} style={[styles.cardImage, !isSelected && styles.imageMuted]} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.72)']}
                    style={StyleSheet.absoluteFill}
                  />

                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </View>
                  ) : null}

                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{vibe.label}</Text>
                    <Text style={styles.cardDesc}>{vibe.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <LinearGradient
          colors={['rgba(6,9,19,0)', '#060913', '#060913']}
          style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={handleContinue}
            disabled={!hasSelected}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasSelected }}
            style={({ pressed }) => [
              styles.continueButton,
              hasSelected ? styles.continueButtonActive : styles.continueButtonDisabled,
              pressed && hasSelected ? styles.continueButtonPressed : null,
            ]}
          >
            <Text style={[styles.continueText, !hasSelected && styles.continueTextDisabled]}>Enter the Galaxy</Text>
            <MaterialIcons
              name="arrow-forward"
              size={24}
              color={hasSelected ? '#fff' : 'rgba(255,255,255,0.22)'}
              style={hasSelected ? styles.continueIconActive : undefined}
            />
          </Pressable>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060913',
  },
  screen: {
    flex: 1,
    backgroundColor: '#060913',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(38) : fontScale(34),
    fontFamily: 'PlusJakartaSansExtraBold',
    letterSpacing: -1.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontScale(13),
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    aspectRatio: 0.8,
    marginBottom: 16,
    borderRadius: 32,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  cardSelected: {
    shadowOpacity: 0.34,
    shadowRadius: 30,
    elevation: 10,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageMuted: {
    opacity: 0.5,
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#cd2bee',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
  },
  cardCopy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
  },
  cardTitle: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(20) : fontScale(18),
    fontFamily: 'PlusJakartaSansExtraBold',
    lineHeight: mediumScreen ? fontScale(25) : fontScale(22),
  },
  cardDesc: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 32,
    paddingTop: 46,
  },
  continueButton: {
    width: '100%',
    height: 72,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 10,
  },
  continueButtonActive: {
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  continueText: {
    color: '#fff',
    fontSize: fontScale(20),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  continueTextDisabled: {
    color: 'rgba(255,255,255,0.22)',
  },
  continueIconActive: {
    transform: [{ translateX: 4 }],
  },
});

export default VibePickert;
