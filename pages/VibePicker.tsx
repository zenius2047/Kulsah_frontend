import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


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
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleVibe = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleContinue = () => {
    if (selected.size > 0) {
      navigation.navigate('/feed', { replace: true });
    }
  };

  return (
    <View>
      {/* Decorative background gradients */}
      <View></View>
      
      <View>
        <Text>Pick your vibe</Text>
        <Text>Select 1 or more vibe to personalize your galaxy.</Text>
      </View>

      <View>
        <View>
          {VIBES.map((vibe) => {
            const isSelected = selected.has(vibe.id);
            return (
              <Pressable
                key={vibe.id}
                onPress={() => toggleVibe(vibe.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${vibe.label} vibe`}
               
              >
                <Image source={{ uri: vibe.img }} />
                <View></View>
                
                {isSelected && (
                  <View>
                    <Text>check</Text>
                  </View>
                )}

                <View>
                  <Text>{vibe.label}</Text>
                  <Text>{vibe.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Pressable
          onPress={handleContinue}
          disabled={selected.size === 0}
          aria-disabled={selected.size === 0}
        >
          Enter the Galaxy
          <Text>arrow_forward</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default VibePicker;
