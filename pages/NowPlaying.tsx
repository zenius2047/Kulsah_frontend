import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  art: string;
  duration: string;
  url?: string;
}

const INITIAL_QUEUE: Track[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", art: 'https://picsum.photos/seed/album/400/400', duration: '4:03', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', art: 'https://picsum.photos/seed/starboy/400/400', duration: '3:50', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Nightcall', artist: 'Kavinsky', album: 'OutRun', art: 'https://picsum.photos/seed/kavinsky/400/400', duration: '4:18', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const NowPlaying: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_QUEUE[0]);
  const [queue, setQueue] = useState<Track[]>(INITIAL_QUEUE.slice(1));
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const playSfx = useCallback((type: 'pop' | 'sparkle' | 'slide') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'pop') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'sparkle') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'slide') {
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        osc.start(now); osc.stop(now + 0.2);
      }
    } catch (e) {}
  }, []);

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    if (nextState) playSfx('sparkle');
    else playSfx('pop');
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
      playSfx('pop');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = parseFloat(value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const runAiSonicAudit = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the sonic profile of "${currentTrack.title}" by ${currentTrack.artist}. It's in the ${currentTrack.album} album. Give a 1-sentence poetic audit focusing on soundscapes and emotional resonance.`,
      });
      setAiAudit(response.text || "A cascading arrangement of lush pads and driving percussion.");
    } catch (e) {
      setAiAudit("Sonic Audit: High mid-range presence with ethereal spatial distribution. Recommended for late-night focus.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePlayFromQueue = (track: Track, index: number) => {
    playSfx('pop');
    const oldTrack = currentTrack;
    setCurrentTrack(track);
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    newQueue.unshift(oldTrack);
    setQueue(newQueue);
    setIsPlaying(true);
    setAiAudit(null);
  };

  return (
    <View aria-label="Music Player">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => setIsPlaying(false)}
        autoPlay={isPlaying}
      />
      
      {/* Dynamic Background */}
      <View>
        <Image source={{ uri: currentTrack.art }} aria-hidden="true" />
        <View></View>
      </View>

      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>keyboard_arrow_down</Text>
        </Pressable>
        <View>
          <Text>Playing from</Text>
          <Text>{currentTrack.album}</Text>
        </View>
        <Pressable>
          <Text>more_vert</Text>
        </Pressable>
      </View>

      <View>
        {/* Vinyl Animation */}
        <View>
          <View></View>
          <View>
            <Image 
              source={{ uri: currentTrack.art }} 
              
              
            />
            <View></View>
            <View>
              <View></View>
            </View>
          </View>
        </View>

        <View>
          <View>
            <Text>{currentTrack.title}</Text>
            <Text>{currentTrack.artist}</Text>
          </View>
          <Pressable 
            onPress={handleToggleLike}
           
          >
            <Text>favorite</Text>
          </Pressable>
        </View>

        {/* AI Insight Box */}
        {aiAudit && (
          <View>
             <View>
               <Text>auto_awesome</Text>
             </View>
             <Text>Sonic Audit</Text>
             <Text>"{aiAudit}"</Text>
          </View>
        )}

        <View>
          <View>
            <TextInput 
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
             
            />
            <View>
              <Text>{formatTime(currentTime)}</Text>
              <Text>{duration ? formatTime(duration) : currentTrack.duration}</Text>
            </View>
          </View>

          <View>
            <Pressable onPress={runAiSonicAudit} disabled={isAiLoading}>
              <Text>auto_awesome</Text>
            </Pressable>
            <Pressable>
              <Text>skip_previous</Text>
            </Pressable>
            <Pressable 
              onPress={handleTogglePlay}
             
            >
              <Text>{isPlaying ? 'pause' : 'play_arrow'}</Text>
            </Pressable>
            <Pressable>
              <Text>skip_next</Text>
            </Pressable>
            <Pressable>
              <Text>repeat</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View>
        <Pressable>
          <Text>airplay</Text>
          <Text>Studio Pro</Text>
        </Pressable>
        <Pressable 
          onPress={() => { setIsQueueOpen(true); playSfx('slide'); }}
         
        >
          <Text>Up Next</Text>
          <Text>playlist_play</Text>
        </Pressable>
      </View>

      {/* Queue Drawer */}
      {isQueueOpen && (
        <View>
          <View onPress={() => setIsQueueOpen(false)}></View>
          <View>
            <View></View>
            <View>
              <Text>Queue</Text>
              <Pressable onPress={() => setIsQueueOpen(false)}><Text>close</Text></Pressable>
            </View>
            <View>
               {queue.map((track, idx) => (
                 <View key={track.id} onPress={() => handlePlayFromQueue(track, idx)}>
                   <View><Image source={{ uri: track.art }} /></View>
                   <View>
                     <Text>{track.title}</Text>
                     <Text>{track.artist}</Text>
                   </View>
                   <Text>drag_indicator</Text>
                 </View>
               ))}
            </View>
          </View>
        </View>
      )}

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #cd2bee;
          box-shadow: 0 0 10px #cd2bee;
          cursor: pointer;
          margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
      `}</style>
    </View>
  );
};

export default NowPlaying;
