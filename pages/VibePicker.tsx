import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeMode } from '../theme';
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

const VibePicker: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const contentWidth = width - 32;
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;

  const overlayGradient = useMemo<[string, string, string]>(
    () => (isDark ? ['#18071f', '#0a050d', '#060913'] : ['#fdf4ff', '#ffffff', '#f8fafc']),
    [isDark]
  );

  const toggleVibe = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? 48 : insets.top,
        },
      ]}
      edges={['left', 'right']}
    >
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={overlayGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glow, styles.glowTop, { backgroundColor: 'rgba(205,43,238,0.16)' }]} />
        <View style={[styles.glow, styles.glowBottom, { backgroundColor: isDark ? 'rgba(205,43,238,0.12)' : 'rgba(205,43,238,0.08)' }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Pick your vibe</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#cbd5e1' : theme.textSecondary }]}>
            Select 1 or more vibe to personalize your galaxy.
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 36 }]}
        >
          <View style={styles.grid}>
            {VIBES.map((vibe, index) => {
              const isSelected = selected.has(vibe.id);
              const isRightColumn = index % 2 === 1;

              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => toggleVibe(vibe.id)}
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      marginRight: isRightColumn ? 0 : cardGap,
                      borderColor: isSelected ? theme.accent : isDark ? 'rgba(255,255,255,0.08)' : theme.border,
                      shadowColor: isSelected ? '#cd2bee' : theme.shadow,
                      opacity: isSelected ? 1 : 0.97,
                    },
                    isSelected
                      ? styles.cardSelected
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.86)' },
                  ]}
                >
                  <Image
                    source={{ uri: vibe.img }}
                    style={[styles.cardImage, !isSelected && styles.imageMuted]}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.82)']}
                    style={styles.cardOverlay}
                  />

                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </View>
                  ) : null}

                  <View style={styles.cardTextBlock}>
                    <Text style={styles.cardTitle}>{vibe.label}</Text>
                    <Text style={styles.cardDesc}>{vibe.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.95,
  },
  glowTop: {
    top: -80,
    left: -40,
    width: 220,
    height: 220,
  },
  glowBottom: {
    right: -40,
    bottom: 80,
    width: 210,
    height: 210,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: mediumScreen ? fontScale(34) : fontScale(30),
    fontFamily: 'PlusJakartaSansExtraBold',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: mediumScreen ? fontScale(15) : fontScale(12),
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: mediumScreen ? fontScale(22) : fontScale(18),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    aspectRatio: 0.8,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  cardSelected: {
    shadowOpacity: 0.34,
    shadowRadius: 26,
    elevation: 10,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageMuted: {
    opacity: 0.72,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardTextBlock: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(20) : fontScale(17),
    fontFamily: 'PlusJakartaSansExtraBold',
    lineHeight: mediumScreen ? fontScale(25) : fontScale(21),
  },
  cardDesc: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default VibePicker;
