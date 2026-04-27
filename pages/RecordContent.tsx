import React from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { fontScale } from '../fonts';
import { VoteSheetContent } from './SoundSelect';

type FilterItem = {
  id: string;
  name: string;
  image: string;
  active?: boolean;
};

type SideControl = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active?: boolean;
};

const galleryThumb =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCbezKu_kUkaiBA-7aoLNUD4B55ysJvHfiHScypbfBP7Zp6g_v1KUzobuRSjoR8KKiwr1w5tW8iRgHjH4pTHAIlCxW3Jg8DOvX31D6dlpg_nuULiAX3GNB8GPiCrTHTivLWEz5_I4WxAfI8DARjJAw6PliuHzsRq2Nli6scx8aYwbXOfb_ZiwjDQ7iojfE7BmmpTNz7jy8AJkfM-yEJmnXJoxZRn3W4DUitZDJcDaIqhnaiJhHID1vJPThCMJylP-fHJ068CjNz0f4c';

const filters: FilterItem[] = [
  {
    id: 'retro',
    name: 'Retro',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAz2lGR7OStkHE4hbI_FsxMhrSTY_RAyxJKWRU--GlFpa5FvBsSlrt1kaUV7g-Qnt3kvUwuNsSKLXOMv1V--Eqt0ixcYxZ9Nt3scKF89IBggoxBj6SUIwXxzhqbBR6yMguilYzWzFPJnG_HoItPT8_FO4-zUX2Mszn-EANldzQ2KIepRPwGpUqE0k5VVtP6ejwScnX1iUwJfMYp3jEEqAxOjScyDupyg-9qLEw6ByT0vdRNZy-avWvzHrjsBIhF_kWKrp331m5PpAmO',
    active: true,
  },
  {
    id: 'bw',
    name: 'B&W',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB23ShVE6h1bO3oCkRz8WuVDrHyZT5jEVvBfyLBob5W9UsvQhc5bb4-yVooZ1LRoBaNnB7cVzUfqN2fueFR6Clc9x44XcKbTUhEO-MZZP6i08Y5woNUbgB6EkBz5UhafSY1rMa5uJT90WwyDimY_qpcB-oVq0PF9Me9hfbSc4cG4wg2l8ZyxH9jA39euYeKSCzgpDW4qwmDx7d8WE-TyLLkCuzpwEnVpcioKnau9OOVWwykqwG-uT_zPWxIFjssvWG34UJ3uemx3aaa',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUh6iK4lNUTCw4US-RpyaaqzHswtQtX8SjaWqJpjAy2AcIYG8XOmrFpvbbSV3TOxvxAZm-ItYCYxEXyY6vOohIlVQdwGeYBsGth5Twm5uByWCmE2w4oMZPtbsa-A07Jttz-yRoLO_1BbO426FEOQ1Ratwy3pyOJHu1e6KR6b2bHl94NoZ_n0t47SMlsTo7OFItjVOvZ07Q1jnkg3yhdIxQ8KNeuvs8HQyCMUfrhwcm-6LpiA998Z62vYcz-BKtq6ZydaZvl1MYhSsB',
  },
  {
    id: 'warm',
    name: 'Warm',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCVgmlRySckbwvWsf9k9JWlXpZ4itF8-OhsCJViTUhB8rMic007i0A_a_L_-sd1cRikFmvZEqH0WBgLY68txRipZ7Om5elo91P15THlExS5nAM-9x2o216vLJ2cXLKwTzekYUVUiI68qd0kl9v-wEggQLctrNvefBW_e6MqjxJL6mXbiRGQixYoPtJJ5o_GxPp1qcUypc77F2cP8Y1h-7239B4UmpEiX0FOFGsfQ5O5LWes5b09urQ3AYtfg089wHImGKs4OaXwgy28',
  },
  {
    id: 'glow',
    name: 'Glow',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATPhjTCYjlVILbuF9DvDlS3SRAuk0NmOOPpMZ_0Aj0SVarvhQTc8iVBhlmYZrBQBsqthGi83szsE-r8N8qJGZi36Z6fmR-sQJDpaQjrKoOZcDXSiUYTCY--UWJ991_zd3BsSCdasuNotoOUx4kTjZGD5KCGwHAvkDYyeO_K09NM2mwLgfcHaSdcszEdpoRsUkg42rLefIwcFFp-i6S-HFxl36Xnr-y-JAzNXO34yypDEIvZZIZz6Stj21AkZLC-ZIZRsrcEDO6Efrp',
  },
  {
    id: 'flashy',
    name: 'Flashy',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAsiqRNO8gQnrI6I-DlVoZ8Xprc8EIYj917CSdWhriVEXNEd33AWOWUfDZLYsmD_xzQQWMU2i-eal9zLi4EQb9O34D1vL2Wz2ckeeQSMzQrgY6rVZOx8JoyMiHdChK1ajhX9iucYLmwZOEuTyXilEK89ZyGlnHLxnFUmQGjY6nRrf7rcaJea-MhZ-5ngVlOMz4h66IFRDkLlpLtBkKaeTlG1OibVi7lLHeBdALvAg1ZWvImoLPTdfhNnKEj-PFO_H00K8z1emCZSPhW',
  },
];

const sideControls: SideControl[] = [
  { id: 'flip', label: 'Flip', icon: 'flip-camera-ios' },
  { id: 'speed', label: 'Speed', icon: 'speed' },
  { id: 'beauty', label: 'Beauty', icon: 'face', active: true },
  { id: 'timer', label: 'Timer', icon: 'timer' },
  { id: 'flash', label: 'Flash', icon: 'flash-on' },
];

const modes = ['Live', 'Post', 'Create'] as const;

const RecordContent: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<'front' | 'back'>('front');
  const [activeMode, setMode] = React.useState<'Post'| 'Live' | 'Create'>('Post');
  const [soundSelectOpen, setSoundSelectOpen] = React.useState(false);

  const handleSideControlPress = async (controlId: string) => {
    if (controlId === 'flip') {
      setFacing((current) => (current === 'front' ? 'back' : 'front'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS == 'ios' ? 54: insets.top }]} edges={[]}>
      {!permission?.granted ? <View style= {styles.screen}>
        {!permission ? (
              <>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.permissionText}>Loading camera...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="photo-camera" size={40} color="#ffffff" />
                <Text style={styles.permissionTitle}>Camera access needed</Text>
                <Text style={styles.permissionText}>
                  Turn on camera permission to use live recording background.
                </Text>
                <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
                  <Text style={styles.permissionButtonText}>Enable Camera</Text>
                </Pressable>
              </>
            )}
      </View> :  <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        {/* <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        /> */}

        <CameraView style={StyleSheet.absoluteFill} facing={facing} />

        <View style={styles.topArea}>
          <LinearGradient
            colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']}
            style={styles.topFade}
          />

          <View style={styles.progressMeta}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Recording</Text>
              <Text style={styles.progressTime}>00:12 / 00:30</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={styles.headerRow}>
            <BlurView intensity={28} tint="dark" style={styles.iconCircle}>
              <Pressable style={styles.fillButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </BlurView>

            <Pressable style={styles.soundButton} onPress={() => setSoundSelectOpen(true)}>
              <MaterialIcons name="music-note" size={20} color="#cd2bee" />
              <Text style={styles.soundButtonText} numberOfLines={1}>
                Add Sound
              </Text>
            </Pressable>

            <BlurView intensity={28} tint="dark" style={styles.iconCircle}>
              <Pressable style={styles.fillButton}>
                <MaterialIcons name="settings" size={22} color="#fff" />
              </Pressable>
            </BlurView>
          </View>
        </View>

        <View style={styles.sideRailWrap}>
          <BlurView intensity={24} tint="dark" style={styles.sideRail}>
            {sideControls.map((control) => (
              <Pressable
                key={control.id}
                style={styles.sideControl}
                onPress={() => void handleSideControlPress(control.id)}
              >
                <View style={styles.sideIconWrap}>
                  <MaterialIcons
                    name={control.icon}
                    size={24}
                    color={control.active ? '#cd2bee' : '#fff'}
                  />
                </View>
                <Text style={[styles.sideLabel, control.active ? styles.sideLabelActive : null]}>
                  {control.label}
                </Text>
              </Pressable>
            ))}
          </BlurView>
        </View>

        <View style={styles.bottomArea}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
            style={styles.bottomFade}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filters.map((filter) => (
              <Pressable key={filter.id} style={styles.filterItem}>
                <Image
                  source={{ uri: filter.image }}
                  style={[styles.filterThumb, filter.active ? styles.filterThumbActive : null]}
                />
                {filter.active ? <View style={styles.filterRing} /> : null}
                <Text style={[styles.filterText, filter.active ? styles.filterTextActive : null]}>
                  {filter.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.primaryActions}>
            <Pressable style={styles.utilityAction}>
              <Image source={{ uri: galleryThumb }} style={styles.galleryThumb} />
              <Text style={styles.utilityLabel}>Upload</Text>
            </Pressable>

            <View style={styles.recordWrap}>
              <View style={styles.recordOuterRing}>
                <View style={styles.recordInnerButton} />
              </View>
            </View>

            <Pressable style={styles.utilityAction}>
              <BlurView intensity={24} tint="dark" style={styles.effectsCircle}>
                <MaterialIcons name="auto-fix-high" size={28} color="#cd2bee" />
              </BlurView>
              <Text style={[styles.utilityLabel, styles.utilityLabelActive]}>Effects</Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            {modes.map((mode) => (
              <Pressable
              onPress= {
              ()=>{
                if(mode === 'Create'){
                  navigation.navigate('CreateContent');
                }
                else if( mode === 'Live'){
                  navigation.navigate('GoLive')
                }
                else{
                  setMode('Post')
                }
              }
              } 
              key={mode} style={styles.modeButton}>
                <Text style={[styles.modeText, mode === 'Post' && activeMode === 'Post' && styles.modeTextActive]}>
                  {mode}
                </Text>
                {mode === 'Post' && activeMode === 'Post' && <View style={styles.modeUnderline} /> }
              </Pressable>
            ))}
          </View>
        </View>
        <Modal
          visible={soundSelectOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSoundSelectOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSoundSelectOpen(false)} />
          <VoteSheetContent sheetMode onClose={() => setSoundSelectOpen(false)} />
        </Modal>
      </View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050c',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050c',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.45)',
  },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a050c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(20),
    marginTop: 18,
    marginBottom: 8,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  permissionButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  permissionButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  topArea: {
    paddingHorizontal: 16,
    // paddingTop: 8,
    paddingBottom: 12,
    zIndex: 3,
  },
  topFade: {
    ...StyleSheet.absoluteFillObject,
  },
  progressMeta: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTime: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#cd2bee',
    shadowColor: '#cd2bee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fillButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 180,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  soundButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    maxWidth: 100,
  },
  sideRailWrap: {
    position: 'absolute',
    right: 16,
    top: '15%',
    zIndex: 3,
  },
  sideRail: {
    position: 'absolute',
    right: 0,
    top: 5,
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sideControl: {
    alignItems: 'center',
    marginVertical: 6,
    width: 54,
  },
  sideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sideLabelActive: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
  },
  bottomArea: {
    marginTop: 'auto',
    paddingBottom: 24,
    zIndex: 3,
  },
  bottomFade: {
    ...StyleSheet.absoluteFillObject,
  },
  filterScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    width: 72,
  },
  filterThumb: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    opacity: 0.65,
  },
  filterThumbActive: {
    borderWidth: 2,
    borderColor: '#cd2bee',
    opacity: 1,
  },
  filterRing: {
    position: 'absolute',
    top: -6,
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(205,43,238,0.18)',
  },
  filterText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  filterTextActive: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansBold',
  },
  primaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
  },
  utilityAction: {
    alignItems: 'center',
    width: 72,
  },
  galleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  utilityLabel: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    marginTop: 8,
  },
  utilityLabelActive: {
    color: '#cd2bee',
  },
  recordWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  recordInnerButton: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  effectsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 28,
  },
  modeButton: {
    alignItems: 'center',
  },
  modeText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  modeTextActive: {
    color: '#fff',
  },
  modeUnderline: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
    marginTop: 6,
  },
});

export default RecordContent;
