import React, { useEffect, useRef, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PlayIcon from '../assets/icons/play-arrow-svg.svg';
import ImageIcon from '../assets/icons/image-svg.svg';
import VideoCamIcon from '../assets/icons/videocam-svg.svg';
import { fontScale } from '../fonts';

type Step = 'select' | 'edit' | 'post';
type ActiveTool = 'none' | 'filters' | 'adjust' | 'voice' | 'captions' | 'trim';
type Visibility = 'public' | 'friends' | 'subscribers';

type Sound = { id: string; title: string; artist: string; duration: string; cover: string };

const FILTERS = ['none', 'vivid', 'noir', 'sepia', 'fade', 'cool'];
const SOUNDS: Sound[] = [
  { id: 's1', title: 'Neon Pulse', artist: 'Synthwave', duration: '0:30', cover: 'https://picsum.photos/seed/s1/200' },
  { id: 's2', title: 'Urban Flow', artist: 'Lo-Fi', duration: '0:45', cover: 'https://picsum.photos/seed/s2/200' },
  { id: 's3', title: 'Electric Sky', artist: 'Alternative', duration: '0:15', cover: 'https://picsum.photos/seed/s3/200' },
];
const MEDIA = Array.from({ length: 9 }).map((_, i) => ({
  id: `m${i + 1}`,
  img: `https://picsum.photos/seed/m${i + 1}/400`,
}));

const UploadContent: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [step, setStep] = useState<Step>('select');
  const [tool, setTool] = useState<ActiveTool>('none');
  const [selectedMediaId, setSelectedMediaId] = useState('m1');
  const [thumbnail, setThumbnail] = useState('https://picsum.photos/seed/vid/400/600');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionText, setCaptionText] = useState('Visualizing the future of sound...');
  const [caption, setCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(false);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 100 });
  const [adjust, setAdjust] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [voice, setVoice] = useState('none');
  // const audioRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (route.params?.sound) setSelectedSound(route.params.sound);
  }, [route.params]);

  useEffect(() => {
    return () => {
      // void audioRef.current?.unloadAsync();
    };
  }, []);

  const playPreview = async (type: 'sound' | 'voice') => {
    try {
      const uri =
        type === 'sound'
          ? 'https://www.soundjay.com/buttons/sounds/button-09.mp3'
          : 'https://www.soundjay.com/buttons/sounds/button-3.mp3';
      // if (audioRef.current) await audioRef.current.unloadAsync();
      // const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      // audioRef.current = sound;
    } catch {
      Alert.alert('Preview unavailable');
    }
  };

  const goBack = () => {
    if (step === 'post') setStep('edit');
    else if (step === 'edit') setStep('select');
    else navigation.goBack();
  };

  const publish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);
    }, 2000);
  };

  const selectedImage = MEDIA.find((m) => m.id === selectedMediaId)?.img ?? thumbnail;

  if (isPublished) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}>
          <MaterialIcons name="verified" size={64} color="#cd2bee" />
          <Text style={s.title}>Transmission Established</Text>
          <Text style={s.muted}>Your visual broadcast is now live.</Text>
          <Pressable style={s.primary} onPress={() => navigation.navigate('MainTabs')}>
            <Text style={s.primaryText}>Return to Console</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Pressable onPress={goBack}><MaterialIcons name={step === 'select' ? 'close' : 'arrow-back-ios'} size={20} color="#fff" /></Pressable>
        <Text style={s.headerText}>{step === 'select' ? 'Create & Upload' : step === 'edit' ? 'Preview & Edit' : 'New Post'}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {step === 'select' && (
          <>
            <View style={s.preview}>
              <Image source={{ uri: selectedImage }} style={{
                height: '100%',
                width: '100%'
              }}/>
              <LinearGradient
              colors={['transparent', '#0000005a']}
                locations={[0,0.9]}
                start = {{
                  x : 0,
                  y : 0,
                }}
                end={{ x: 0, y: 1 }}
                style={{
                  // padding: 2,
                  // position: 'absolute',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  height: "100%",
                  width: '100%',
                  alignItems: 'center',
                  // flexDirection: 'row',
                  justifyContent: 'center',
                  borderRadius: 16,
                  position: 'absolute'
                }}
              >
              <View style={{
                flexDirection: 'row',
                position: 'absolute',
                top: 10,
                left: 10,
                alignItems:'center'
              }}>
                <View style={{
                  width: 14,
                  height : 14,
                  borderRadius: 7,
                  backgroundColor: 'red'
                }}>   
                </View>
                <View>
                  <Text style={{
                    fontFamily: 'PlusJakartaBold',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fontScale(12),

                  }}>  LIVE PREVIEW</Text>
                </View>
              </View>
              <View style={{
                // position: 'absolute',
                // height: '100%',
                // width: '100%',
                // backgroundColor: 'transparent',
                height: 70,
                width: 70,
                borderRadius: 999,
                backgroundColor: '#cd2bee',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <PlayIcon fill='white' height={54} width={54}/>
              </View>
              <View style={{
                // position: 'absolute',
                // height: '100%',
                // width: '100%',
                // backgroundColor: 'transparent',
                // height: 70,
                // width: 70,
                // borderRadius: 999,
                // backgroundColor: '#cd2bee',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{
                  color: '#rgba(255 255 255 / 0.7)',
                  fontWeight: '700',
                  fontSize: fontScale(10),
                  marginTop: 10
                }}>
                  Connect with your fans instantly
                </Text>
              </View>
              </LinearGradient>
              
            </View>

            <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
            >
            <View style={{
              backgroundColor: '#1f1022',
              borderRadius: 32,
              height: 120,
              width: 120,
              justifyContent: 'center',
              alignItems: 'center',
              // flexDirection: 'row'
            }}>
              <View style={{
                backgroundColor: '#ef44441a',
                borderRadius: 999,
                padding: 10,
              }}>
                <MaterialIcons name= 'sensors'
                size={24}
                color='red'></MaterialIcons>
              </View>
              <Text
              style={{
                color: '#64748b',
                fontSize: fontScale(8),
                fontWeight: '900',
                marginTop: 6,
              }}
              >GO LIVE</Text>
            </View>


            <View style={{
              backgroundColor: '#1f1022',
              borderRadius: 32,
              height: 120,
              width: 120,
              justifyContent: 'center',
              alignItems: 'center',
              // flexDirection: 'row'
            }}>
              <View style={{
                backgroundColor: '#3B82F61A',
                borderRadius: 50,
                padding: 10,
              }}>
                <VideoCamIcon 
                height={24}
                width={24}
                fill='#3b82f6'/>
              </View>
              <Text
              style={{
                color: '#64748b',
                fontSize: fontScale(8),
                fontWeight: '900',
                marginTop: 6,
              }}
              >RECORD</Text>
            </View>


            <View style={{
              backgroundColor: '#1f1022',
              borderRadius: 32,
              height: 120,
              width: 120,
              justifyContent: 'center',
              alignItems: 'center',
              // flexDirection: 'row'
            }}>
              <View style={{
                backgroundColor: '#10B9811A',
                borderRadius: 50,
                padding: 10,
              }}>
                <ImageIcon 
                height={24}
                width={24}
                fill='#10B981'/>
              </View>
              <Text
              style={{
                color: '#64748b',
                fontSize: fontScale(8),
                fontWeight: '900',
                marginTop: 6,
              }}
              >LIBRARY</Text>
            </View>

            </View>
            <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
        >
        <View>
          <Text style={{
            color: '#FFFFFF66',
            fontWeight: '900',
            fontSize: fontScale(10),
            letterSpacing: 3
          }}>
            RECENT MEDIA
          </Text>
        </View>
        <View>
          <Text style={{
            color: '#CD2BEE',
            fontWeight: '900',
            fontSize: fontScale(10),
            letterSpacing: 3
          }}>
            VIEW ALL
          </Text>
        </View>
        </View>
            <View style={s.grid}>
              {MEDIA.map((m) => (
                <Pressable key={m.id} onPress={() => { setSelectedMediaId(m.id); setThumbnail(m.img); }} style={[s.tile, selectedMediaId === m.id && s.tileActive]}>
                  <Image source={{ uri: m.img }} style={s.tileImg} />
                </Pressable>
              ))}
            </View>
            <View style={s.row}>
              {/* <Pressable style={s.secondary} onPress={() => setIsRecording(true)}><Text style={s.secondaryText}>Record</Text></Pressable> */}
              <Pressable style={s.primary} onPress={() => setStep('edit')}>
                <Text style={s.primaryText}>Continue </Text>
                <MaterialIcons name= 'arrow-forward' size={20} color='white'></MaterialIcons>
                </Pressable>
            </View>
          </>
        )}
        
        {step === 'edit' && (
          <>
            <View style={[s.preview, { height: 550 }]}>
            <Image source={{ uri: selectedImage }} style={[s.preview, { height: 550 }]} />
            <View style={{
              position: 'absolute',
              right: 10,
              top: 10,
              justifyContent: 'space-around',
              height: '70%'
            }}>
              {(['trim', 'filters', 'adjust', 'voice', 'captions'] as ActiveTool[]).map((t) => (
                
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Pressable key={t} style={[s.chip, tool === t && s.chipActive]} onPress={() => setTool(t)}>
                  <MaterialIcons name={
                    t==='trim'? 'content-cut' : 
                    t ==='filters' ? 'auto-awesome': 
                    t ==='adjust' ? 'tune' : 
                    t==='voice' ? 'graphic-eq': 'closed-caption'} 
                    size={30}
                    color = 'white'
                    ></MaterialIcons>
                </Pressable>
                <Text style={[s.chipText, tool === t && s.chipTextActive, {marginBottom: 10}]}>{t.toUpperCase()}</Text>

                </View>
              ))}
            </View>
            <View style={{
              position: 'absolute',
              backgroundColor: '#00000033',
              borderRadius: 999,
              height: 60,
              width: 60,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <PlayIcon height={44} width={44} fill='white'/>
            </View>
            <View style={{
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: '5%',
              height: 30,
              // backgroundColor: 'gold'
            }}>
              <View
              style = {{
                backgroundColor: '#FFFFFF33',
                // backgroundColor: 'red',
                height: 10,
                width: '100%',
                position: 'absolute',
                borderRadius: 32
              }}
              >
              <View
              style={{
                backgroundColor: '#cd2bee',
                height: 10,
                width: '10%',
                position: 'absolute',
                borderRadius: 32,
              }}
              >
                
              </View>
              </View>
              <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
              >
                <Text
                style={{
                  color: '#FFFFFF99',
                  fontSize: fontScale(10),
                  fontWeight: '900'
                }}
                >0:12</Text>
                <Text
                style={{
                  color: '#FFFFFF99',
                  fontSize: fontScale(10),
                  fontWeight: '900'
                }}
                >0:45</Text>
              </View>
            </View>
            <View>

            </View>
            </View>
            {captionsEnabled && <Text style={s.captionPreview}>{captionText}</Text>}
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              
            </ScrollView> */}

            {tool === 'filters' && (
              <View style={s.panel}>
                <Text style={s.panelTitle}>Filters</Text>
                <View style={s.rowWrap}>
                  {FILTERS.map((f) => (
                    <Pressable key={f} style={[s.chip, selectedFilter === f && s.chipActive]} onPress={() => setSelectedFilter(f)}>
                      <Text style={[s.chipText, selectedFilter === f && s.chipTextActive]}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {tool === 'adjust' && (
              <View style={s.panel}>
                {(['brightness', 'contrast', 'saturation'] as const).map((k) => (
                  <View key={k} style={s.spaceBetween}>
                    <Text style={s.text}>{k}</Text>
                    <View style={s.row}>
                      <Pressable style={s.stepBtn} onPress={() => setAdjust((p) => ({ ...p, [k]: Math.max(0, p[k] - 10) }))}><Text style={s.text}>-</Text></Pressable>
                      <Text style={s.text}>{adjust[k]}%</Text>
                      <Pressable style={s.stepBtn} onPress={() => setAdjust((p) => ({ ...p, [k]: Math.min(200, p[k] + 10) }))}><Text style={s.text}>+</Text></Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {tool === 'voice' && (
              <View style={s.panel}>
                <View style={s.rowWrap}>
                  {['none', 'chipmunk', 'deep', 'robot', 'echo'].map((v) => (
                    <Pressable key={v} style={[s.chip, voice === v && s.chipActive]} onPress={() => { setVoice(v); if (v !== 'none') void playPreview('voice'); }}>
                      <Text style={[s.chipText, voice === v && s.chipTextActive]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {tool === 'captions' && (
              <View style={s.panel}>
                <View style={s.spaceBetween}>
                  <Text style={s.text}>Enable captions</Text>
                  <Switch value={captionsEnabled} onValueChange={setCaptionsEnabled} />
                </View>
                {captionsEnabled && <TextInput style={s.input} value={captionText} onChangeText={setCaptionText} placeholder="Overlay text" placeholderTextColor="#777" />}
              </View>
            )}

            {tool === 'trim' && (
              <View style={s.panel}>
                <Text style={s.text}>Trim: {trimRange.start}s - {trimRange.end}s</Text>
                <View style={s.row}>
                  <Pressable style={s.stepBtn} onPress={() => setTrimRange((p) => ({ ...p, start: Math.max(0, p.start - 5) }))}><Text style={s.text}>-Start</Text></Pressable>
                  <Pressable style={s.stepBtn} onPress={() => setTrimRange((p) => ({ ...p, end: Math.min(100, p.end + 5) }))}><Text style={s.text}>+End</Text></Pressable>
                </View>
              </View>
            )}

            <Text style={s.muted}>Background Sound</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {SOUNDS.map((sound) => (
                <Pressable key={sound.id} onPress={() => { setSelectedSound(sound); void playPreview('sound'); }}>
                  <Image source={{ uri: sound.cover }} style={[s.sound, selectedSound?.id === sound.id && s.tileActive]} />
                  <Text style={s.muted}>{sound.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.primary} onPress={() => setStep('post')}><Text style={s.primaryText}>Next</Text></Pressable>
          </>
        )}

        {step === 'post' && (
          <>
            <Image source={{ uri: thumbnail }} style={s.preview} />
            <TextInput style={[s.input, { minHeight: 100 }]} multiline value={caption} onChangeText={setCaption} placeholder="What's happening?" placeholderTextColor="#777" />
            <View style={s.panel}>
              {(['public', 'subscribers'] as Visibility[]).map((v) => (
                <Pressable key={v} style={s.spaceBetween} onPress={() => setVisibility(v)}>
                  <Text style={s.text}>{v}</Text>
                  <MaterialIcons name={visibility === v ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={visibility === v ? '#cd2bee' : '#999'} />
                </Pressable>
              ))}
            </View>
            <View style={s.panel}>
              <View style={s.spaceBetween}><Text style={s.text}>Allow Comments</Text><Switch value={allowComments} onValueChange={setAllowComments} /></View>
              <View style={s.spaceBetween}><Text style={s.text}>Allow Duet</Text><Switch value={allowDuet} onValueChange={setAllowDuet} /></View>
              <View style={s.spaceBetween}><Text style={s.text}>Allow Stitch</Text><Switch value={allowStitch} onValueChange={setAllowStitch} /></View>
            </View>
            <View style={s.row}>
              <Pressable style={s.secondary}><Text style={s.secondaryText}>Draft</Text></Pressable>
              <Pressable style={s.primary} onPress={publish} disabled={isPublishing}>
                {isPublishing ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Post</Text>}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={isRecording} transparent animationType="fade">
        <View style={s.modal}>
          <Text style={s.title}>Recording...</Text>
          <Pressable style={s.primary} onPress={() => { setIsRecording(false); setStep('edit'); }}><Text style={s.primaryText}>Stop</Text></Pressable>
          <Pressable onPress={() => setIsRecording(false)}><Text style={s.muted}>Cancel</Text></Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#222', backgroundColor: 'rgba(10 5 12 / 0.8)' },
  headerText: { color: '#fff', fontWeight: '800' },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  preview: { width: '100%', height: 260, borderRadius: 32, backgroundColor: '#171717', overflow: 'hidden', justifyContent: 'center', alignItems: 'center'},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  tileActive: { borderColor: '#cd2bee' },
  tileImg: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderColor: '#FFFFFF1A', 
    borderRadius: 32,
    paddingHorizontal: 0, 
    paddingVertical: 0, 
    height : 60, width: 60, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#00000066'
  },
  chipActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  chipText: { color: '#ffffffb3', fontSize: fontScale(8), fontWeight: '900' },
  chipTextActive: { color: '#cd2bee' },
  panel: { backgroundColor: '#15151A', borderRadius: 12, padding: 12, gap: 10 },
  panelTitle: { color: '#cd2bee', fontWeight: '800' },
  text: { color: '#eee', fontSize: fontScale(12) },
  muted: { color: '#8A8A8F', fontSize: fontScale(11) },
  input: { backgroundColor: '#15151A', borderRadius: 12, color: '#fff', padding: 12, borderWidth: 1, borderColor: '#333' },
  primary: { flex: 1, height: 64, backgroundColor: '#cd2bee', borderRadius: 32, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  secondaryText: { color: '#ddd', fontWeight: '700' },
  captionPreview: { color: '#fff', textAlign: 'center', marginTop: -44, marginBottom: 24, fontWeight: '700' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepBtn: { borderWidth: 1, borderColor: '#444', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  sound: { width: 80, height: 80, borderRadius: 12, marginBottom: 4 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { color: '#fff', fontWeight: '900', fontSize: fontScale(18), textAlign: 'center' },
});

export default UploadContent;
