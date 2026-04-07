import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_nWXY2AjaIksgSrdVz-rWJuHhSgT-45-SRU3MJ6e4gJxNtQZGIYyPIlbQ9PEIkdyN4qv28cdTSaRODCpkLcUIG9ftoeHKVQ05SBQ09b-NaLDq3rvKAprnqeOLPF_nXSr8bQHKD_GQz_Hmqf1ISoPQZHvJHRDaMVEHv2LJtIkI8A-oYXv2fZVI79soN7r-cUbNV8mlgAc2cdq8N1atKiZGY3EttYb1xX5mLWFxqAi3d3cE11d3kprkfZrbaT_JV42R-ZZAeRVvMh80';

const timelineFrames = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDfsG95ALQamVYUPsuJtIBXNYtmOaKa7estwrAzCWTyhh7bByynMUkxs80qKFgJejNG3HCCja9UJbTxyHd6Y-SOFoi5Ax8cNOR3-3mMs4Y7sjHUNFC2djpf7gdbsno7YIqiAevGlw_xHLYypMNlgWcGAthEKiggoIm0ryf_HcKpunsoKYxnsS912o_hsmiPOrpBLLTKxLe38dx7wg8nYoBXdx4Ih-WtYo41qj-ofOijZ2s43bxkij7fvejj4Z8LHzdqbf6B1uX9kA3R',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrVPFrSbHL85gMGYxul1QmtcZMZzMYkP6rX1VF2vXht2v934bo0A-C9JS0BsQAoAeJf826Y1BMm5BtfZ61_l_P8AEPhKH_cqKru6jC17ybH8FkBkwVCHP16h7XbcGmBi881eP2tLVL_tybJeG4uBYzPAsQqCNrpxHB4380UjnhE3qrmOo4RNuoDfIQ1xOIzJCsjzB2HpFk-tXrmJ7Fbq4KkjeLqRdELqegqB_kUu3Yi6t9brYZPlMsDQMr99joW3Od3dYXgpf33XV9',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC9WKGuPLXRFc_0heD9SxaFz8JYEIROk1NUZSTparx4G3MSGnbJgvKqDg381LLEfD4TrtnXqBakQmEaoX_n0l44wvxRPCzg32ioP8KhOe9elqspjkT1kfAhRXP73OEOhDBxhlnYN70gWU3G68zT37yzboV8cH5SoITaK2vHhOVsl3ovojJs9fJOBP_tXOlXyQ5W3p0xL3GllYGDjevbHGuonvqb120XrKZ_cSJq2fEHsHskEVEU-LTK_BQPcRAwUCWUh3n1CAPim47X',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuByzB4NauRJpg6cUWEZ5jIKrhD-YU9efbVltvZRay20Iic7oP8nvW7o_XdzWUWQrShcFKpCm5JtCSkkHZse-dZwZ5TYQfrHTh0SzeKLj-C8h4RkUBIRvAnMIPv6qFg_Rh6cSPbgM3ROIr0pylMSIy1rp0CJnOypyY1llKFIhk2TtpoDfYS6B9im_B7zWdQcFjjqI2s8Ft-xw3E-j9_1qqbEBpZ3h2uxOaUC7zsipq4OSwaBwSbWCDLadWtem9VziXC1h7BMTg5Tx_5r',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBJXBUCjal8jLWvwIIzQOC0zZjWq4h-lGGLMN1VRNa3-YgjKhUBXj5TECYksFw9I1xmB6jsVpDRj9V1ziHng3fl7Npgxu-in7TeZj1qrDOan52BLWnRh-2zIXn6ZC1YrrqdOIr62kwi5RG3l-Gq2KxsVfxlSXiNmbJMn6h6KKP4_MVqG37hFzfbiHUCAWbcM9ISu92tnzxbUomHL7oXUPrU-dZcEWl_dbcCQGwFUKT7EQqQDgXHlzG4SP6XtIgxtEeyrH0KAHMY0jw8',
];

const quickActions = [
  { id: 'draw', label: 'Draw', icon: 'brush' as const },
  { id: 'text', label: 'Text', icon: 'text-fields' as const },
];

const EditSubmission: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.screen, { backgroundColor: isDark ? '#0a050d' : theme.background }]}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.08)', 'rgba(10,5,13,0.96)']}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.82)',
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBack}>
              <MaterialIcons name="arrow-back" size={22} color={isDark ? '#94a3b8' : theme.textSecondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Submission</Text>
          </View>

          <Pressable
          onPress={()=>(
            navigation.navigate("Submitentry")
          )}
          style={styles.postButton}>
            <Text style={styles.postButtonText}>POST</Text>
          </Pressable>
        </View>

        <View style={styles.overlayLayer}>
          <View style={styles.challengeBadgeWrap}>
            <View
              style={[
                styles.challengeBadge,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.badgeDot} />
              <Text style={styles.badgeMeta}>Participating In</Text>
              <Text style={[styles.badgeTitle, { color: theme.text }]}>NEON VIBE CHECK</Text>
            </View>
          </View>

          <View style={styles.rightRail}>
            {quickActions.map((action) => (
              <View key={action.id} style={styles.quickActionItem}>
                <Pressable
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <MaterialIcons name={action.icon} size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.quickActionLabel, { color: isDark ? '#94a3b8' : theme.textSecondary }]}>
                  {action.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomPanelWrap}>
            <View
              style={[
                styles.timelinePanel,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.76)',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.timelineHeader}>
                <Text style={[styles.timelineMeta, { color: isDark ? '#94a3b8' : theme.textSecondary }]}>
                  00:08 / 00:15
                </Text>
                <View style={styles.speedWrap}>
                  <MaterialIcons name="slow-motion-video" size={16} color={isDark ? '#94a3b8' : theme.textSecondary} />
                  <Text style={[styles.timelineMeta, { color: isDark ? '#94a3b8' : theme.textSecondary }]}>
                    1.0x
                  </Text>
                </View>
              </View>

              <View style={styles.timelineStrip}>
                {timelineFrames.map((frame, index) => (
                  <View key={index} style={styles.frameCell}>
                    <Image source={{ uri: frame }} style={styles.frameImage} />
                  </View>
                ))}

                <View style={styles.trimWindow}>
                  <View style={styles.trimHandleLeft} />
                  <View style={styles.trimHandleRight} />
                </View>
                <View style={styles.playhead} />
              </View>
            </View>
          </View>
        </View>
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
    paddingTop: 20,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    height: 94,
    paddingHorizontal: 20,
    paddingTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(13),
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#930df2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  postButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    letterSpacing: 0.8,
  },
  overlayLayer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 84,
    paddingBottom: 42,
  },
  challengeBadgeWrap: {
    position: 'absolute',
    top: 96,
    left: 20,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeMeta: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  badgeTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(9),
  },
  rightRail: {
    position: 'absolute',
    right: 20,
    bottom: 222,
    gap: 22,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickActionLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomPanelWrap: {
    paddingHorizontal: 20,
  },
  timelinePanel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineMeta: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  speedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineStrip: {
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    position: 'relative',
  },
  frameCell: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  trimWindow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '20%',
    right: '30%',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: '#930df2',
    backgroundColor: 'rgba(147,13,242,0.2)',
  },
  trimHandleLeft: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -8,
    width: 3,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  trimHandleRight: {
    position: 'absolute',
    right: -6,
    top: '50%',
    marginTop: -8,
    width: 3,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '55%',
    width: 2,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
});

export default EditSubmission;
