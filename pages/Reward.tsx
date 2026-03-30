import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB8GiYxO2nbbxNd0t2ZkcvWKoXv1xF3Xa9VUs42Utz-0cBhpcL8NAI8lOGbwvElE_wGSrxRF9uWsCyaAnJSffqEkCCItTwdWRP-IwEXfSS6EOFnEbltfVSinp19SfcrrigBDVJu5ZhME0XX0GFtOVlJSbSpNAjL0zM-EbGyFZk1D0jhLeDjW3X1XaeIuKvCZyeem87spk61ObdMLF6_vtZWiloFk-1vLwEo63u8IhjIx14Sqdfso3pakgqIsjlb_1fYZC64ehugvpsY';

const Reward: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [enabled, setEnabled] = useState(true);
  const [rewardTitle, setRewardTitle] = useState('Professional Studio Time (8 Hours)');
  const [rewardTerms, setRewardTerms] = useState(
    'This reward includes a full 8-hour session at Pulse Studios HQ. Winner will have access to a professional engineer and top-tier analog equipment.\n\nTerms:\n- Must be redeemed within 6 months.\n- Travel and accommodation not included.\n- Winner must sign a standard studio release form.'
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#120617', '#0a050d', '#050207']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.glowOne} pointerEvents="none" />
        <View style={styles.glowTwo} pointerEvents="none" />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={22} color="#f8fafc" />
            </Pressable>
            <Text style={styles.headerTitle}>REWARD CONFIG</Text>
          </View>
          <Text style={styles.headerBrand}>NEON PULSE</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(10,5,13,0.15)', 'rgba(10,5,13,0.95)']}
              locations={[0.15, 1]}
              style={styles.heroOverlay}
            />
            <View style={styles.heroTint} />
            <View style={styles.heroContent}>
              <View style={styles.heroTagRow}>
                <MaterialIcons name="stars" size={14} color="#d915d2" />
                <Text style={styles.heroTag}>Exclusive Reward</Text>
              </View>
              <Text style={styles.heroTitle}>The Studio Session</Text>
            </View>
          </View>

          <View style={styles.criteriaCard}>
            <View style={styles.criteriaLeft}>
              <View style={styles.criteriaIconWrap}>
                <MaterialIcons name="favorite" size={24} color="#d915d2" />
              </View>
              <View>
                <Text style={styles.criteriaLabel}>Winning Criteria</Text>
                <Text style={styles.criteriaTitle}>Highest Likes Winner</Text>
              </View>
            </View>
            <View style={styles.criteriaPill}>
              <Text style={styles.criteriaPillText}>1st Place Only</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.cardTitle}>Enable Reward</Text>
                <Text style={styles.cardMeta}>
                  Make this reward visible to your audience
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.16)', true: '#930df2' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Reward Title</Text>
                <TextInput
                  value={rewardTitle}
                  onChangeText={setRewardTitle}
                  style={styles.fieldInput}
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Prize Description & Terms</Text>
                <TextInput
                  value={rewardTerms}
                  onChangeText={setRewardTerms}
                  multiline
                  textAlignVertical="top"
                  style={styles.textarea}
                  placeholder="Describe the reward details, scheduling, and legal requirements..."
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewHeading}>Badge Preview</Text>

              <View style={styles.previewCard}>
                <View style={styles.previewGlowLeft} pointerEvents="none" />
                <View style={styles.previewGlowRight} pointerEvents="none" />

                <View style={styles.badgeWrap}>
                  <LinearGradient
                    colors={['#930df2', '#d915d2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.badgeRing}
                  >
                    <View style={styles.badgeCore}>
                      <View style={styles.badgeInnerGlow} />
                      <MaterialIcons name="mic-external-on" size={54} color="#ffffff" />
                    </View>
                  </LinearGradient>

                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>#1 LIKED</Text>
                  </View>
                </View>

                <View style={styles.previewTextBlock}>
                  <Text style={styles.previewTitle}>PLATINUM SESSION</Text>
                  <Text style={styles.previewSubtitle}>Unlocked by Top Supporter</Text>
                </View>

                <Pressable>
                  <Text style={styles.previewLink}>Customize Design</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
          onPress={()=>(
            navigation.navigate("finalStep")
          )}
          style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </Pressable>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  glowOne: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(147,13,242,0.18)',
  },
  glowTwo: {
    position: 'absolute',
    top: 280,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(217,21,210,0.10)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(10,5,13,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    textTransform: 'uppercase',
  },
  headerBrand: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
    letterSpacing: -0.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  heroCard: {
    height: 192,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147,13,242,0.14)',
  },
  heroContent: {
    padding: 20,
    gap: 8,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTag: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(11),
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  criteriaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  criteriaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  criteriaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,21,210,0.18)',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  criteriaLabel: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  criteriaTitle: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
    marginTop: 4,
  },
  criteriaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  criteriaPillText: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(6),
  },
  formSection: {
    gap: 18,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
  },
  cardMeta: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
    marginTop: 4,
  },
  detailsCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  fieldInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
  },
  textarea: {
    minHeight: 150,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
    lineHeight: 22,
  },
  previewSection: {
    gap: 14,
  },
  previewHeading: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
    paddingHorizontal: 4,
  },
  previewCard: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewGlowLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(147,13,242,0.12)',
  },
  previewGlowRight: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(217,21,210,0.12)',
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 8,
  },
  badgeCore: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    backgroundColor: '#0a050d',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rankPill: {
    position: 'absolute',
    bottom: -12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  rankPillText: {
    color: '#0a050d',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 0.8,
  },
  previewTextBlock: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  previewTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
    letterSpacing: 0.2,
  },
  previewSubtitle: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(10),
  },
  previewLink: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  saveButton: {
    borderRadius: 32,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
});

export default Reward;
