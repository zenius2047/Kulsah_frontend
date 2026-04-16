import React from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mediumScreen } from '../types';

const creatorAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcdWdJodmB8sMBcrMDYhE2cLRhTL5bvZdZwuz6sDZA3vg70icHCnVxvepuAyGDEw739DXsxuY86-unMcCqQJvrkZD1Rb_Nn2BHfeg37VOQ7ncJujS26RdpXjx37HO21pGqL28ipU3YQ9ahEM3Yl52sUo5K4BlIx9jECYGQyNYCfolLObGysbiuUVvq92tuBWJWp4A-p_nP-de3syT2Sr7Mc367D-llkelrbFWR7aQ75jfG3PFsAqeed5l2yXIU-0j4S4gPEcIqwC5v';

const reachPreviews = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLnWBpHDdQMrSV18Qpm0NUAx7WwKydb8c0y8FN-WPzkZ9XbsXjnGm3eI5ZMYmw2U-1k8tW6AEuc1l0AdJFo70-DtePUVT5OtUhRJy-Y7jRyJ12a24P5KEgNP3u1yDcMbbp0ZryJ3sYt82pzlcryKBq6scrod6mkdBn1yN1eKr3Xw7VTycHhgEmeJ4gGB8V8FhLdEVNY6lBeMhIw4r-LJGVk5KhC_ID379DRryrD4zVBZiUdi97yF_MEqV6HWhdz_H1N2qMe18Kt-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCl0bAaQwUhwvjDefV8XEx6PHAEHVoaSmvij2OMtxnw2WZH1DZAuzldxH-UQ7QKekVobVxvIOyyS3vIiQPfr_IS3qpKvS0BOR047TfjW1-OZ1dVGz3pWTK0d2fNjHPAIToFGJERb4lDZDXRMTo-ddKeJLB_zrOOoH8yg5Hsd8ODCqNcFuEnej282RJDFY9Cnj_VMd41irZU9JcrMgXfsnKKTquPdZzv1T-sOygbW5rEnXY7IcV7CmUqZirk8cOoZvo6WTHhA0Opnc29',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5B72ez9v9fH-cUww7ROL6r3vh_lBOyzo4xY7yge6MK4fZ4ZwLJT1CFikp7eLjZ4Za_rOEurFVOysu9TZ92lbg0ElZ8R66LA7-xmbW9x4U8RjeotrdedSokJ4oLxbn3TTQwO4uAiau6ZYQyma-5Bvi-lDlHWK9ODn3FP-Oibv6GKm-LY0qtE5Zl5qXbYfem64kbgZUkFvZzewbJzsAd15KtKFCG_0EJNzeQvqIpSJIDD0wry-wQYkX4_WeyB_UuipuQqiMYp0IqD5p',
];

const valueCards = [
  {
    id: 'recognition',
    icon: 'workspace-premium' as const,
    title: 'Recognition Only',
    text: 'Focus on building clout and reputation without the noise of material payouts.',
    tint: '#930df2',
    bg: 'rgba(147,13,242,0.18)',
    border: 'rgba(147,13,242,0.28)',
  },
  {
    id: 'organic',
    icon: 'favorite' as const,
    title: 'Organic Hype',
    text: 'Engagement is driven by genuine appreciation for creator artistry.',
    tint: '#d915d2',
    bg: 'rgba(217,21,210,0.18)',
    border: 'rgba(217,21,210,0.28)',
  },
];

const NoReward: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const bgGradient = isDark
    ? ['#120617', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const headerBg = isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.92)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const iconButtonBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const shellBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#f8fafc' : theme.text;
  const frameBorder = isDark ? '#0a050d' : theme.border;
  const frameBg = isDark ? 'rgba(255,255,255,0.03)' : theme.card;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.glowPrimary} pointerEvents="none" />
        <View style={styles.glowSecondary} pointerEvents="none" />

        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <View style={styles.headerLeft}>
            <Pressable style={[styles.iconButton, { backgroundColor: iconButtonBg }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="chevron-left" size={22} color={titleTone} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: titleTone }]}>REWARD CONFIG</Text>
          </View>

          {/* <Text style={styles.headerBrand}>NEON PULSE</Text> */}

          <View style={[styles.avatarShell, { backgroundColor: shellBg, borderColor: cardBorder }]}>
            <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={['#930df2', '#d915d2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconGradient}
              >
                <MaterialIcons name="star" size={48} color="#ffffff" />
              </LinearGradient>

              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Pure Glory</Text>
              </View>
            </View>

            <View style={styles.heroTextBlock}>
              <Text style={[styles.heroTitle, { color: titleTone }]}>Pure Talent. No Gimmicks.</Text>
              <Text style={[styles.heroText, { color: subtle }]}>
                You&apos;ve chosen the <Text style={styles.heroAccent}>Pure Glory</Text>{' '}
                path. This challenge will rely entirely on the raw talent of
                participants and the authentic love of the community.
              </Text>
            </View>
          </View>

          <View style={styles.valueGrid}>
            {valueCards.map((card) => (
              <View key={card.id} style={[styles.valueCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View
                  style={[
                    styles.valueIconWrap,
                    { backgroundColor: card.bg, borderColor: card.border },
                  ]}
                >
                  <MaterialIcons name={card.icon} size={22} color={card.tint} />
                </View>
                <Text style={[styles.valueTitle, { color: titleTone }]}>{card.title}</Text>
                <Text style={[styles.valueText, { color: subtle }]}>{card.text}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.insightShell, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border }]}>
            <View style={[styles.insightCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface }]}>
              <MaterialIcons name="info" size={20} color="#ffb781" />
              <View style={styles.insightTextWrap}>
                <Text style={[styles.insightTitle, { color: titleTone }]}>Why No Reward?</Text>
                <Text style={[styles.insightText, { color: subtle }]}>
                  Challenges without material prizes often see 40% higher
                  retention of core superfans who value the craft over the catch.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton}>
              <LinearGradient
                colors={['#930df2', '#d915d2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>LAUNCH PURE CHALLENGE</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <MaterialIcons name="edit-note" size={18} color={titleTone} />
              <Text style={[styles.secondaryButtonText, { color: titleTone }]}>ADD A REWARD INSTEAD</Text>
            </Pressable>
          </View>

          <View style={styles.reachSection}>
            <View style={styles.reachHeader}>
              <Text style={[styles.reachLabel, { color: muted }]}>Anticipated Reach</Text>
              <Text style={styles.reachValue}>12.5K+ Talents</Text>
            </View>

            <View style={styles.previewStack}>
              <View style={[styles.previewFrame, styles.previewFrameLeft, { borderColor: frameBorder, backgroundColor: frameBg }]}>
                <Image source={{ uri: reachPreviews[0] }} style={styles.previewImage} />
              </View>
              <View style={[styles.previewFrameCenter, { borderColor: frameBorder, backgroundColor: frameBg }]}>
                <Image source={{ uri: reachPreviews[1] }} style={styles.previewImage} />
              </View>
              <View style={[styles.previewFrame, styles.previewFrameRight, { borderColor: frameBorder, backgroundColor: frameBg }]}>
                <Image source={{ uri: reachPreviews[2] }} style={styles.previewImage} />
              </View>
            </View>
          </View>
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
  glowPrimary: {
    position: 'absolute',
    top: 180,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(147,13,242,0.15)',
  },
  glowSecondary: {
    position: 'absolute',
    bottom: 180,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(217,21,210,0.10)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 18 : 15,
  },
  headerBrand: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 20 : 16,
    letterSpacing: -0.4,
    marginRight: 12,
  },
  avatarShell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
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
  heroSection: {
    alignItems: 'center',
    gap: 22,
  },
  heroIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  heroPill: {
    position: 'absolute',
    top: -8,
    right: -24,
    backgroundColor: '#d915d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroPillText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTextBlock: {
    alignItems: 'center',
    gap: 10,
  },
  heroTitle: {
    color: '#f8fafc',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 26 : 22,
    lineHeight: mediumScreen ? 34 : 30,
    textAlign: 'center',
  },
  heroText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 24 : 18,
    textAlign: 'center',
  },
  heroAccent: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
  },
  valueGrid: {
    gap: 14,
  },
  valueCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  valueIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  valueTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 17 : 14,
  },
  valueText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 22 : 18,
  },
  insightShell: {
    borderRadius: 20,
    padding: 1,
  },
  insightCard: {
    borderRadius: 19,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightTextWrap: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 13,
  },
  insightText: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 22 : 18,
  },
  actions: {
    gap: 14,
    paddingTop: 8,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 1.1,
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 0.8,
  },
  reachSection: {
    paddingTop: 8,
    gap: 16,
  },
  reachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  reachLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  reachValue: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  previewStack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFrame: {
    width: 56,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  previewFrameLeft: {
    transform: [{ rotate: '-6deg' }],
    marginRight: -10,
  },
  previewFrameRight: {
    transform: [{ rotate: '6deg' }],
    marginLeft: -10,
  },
  previewFrameCenter: {
    width: 64,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    zIndex: 2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

export default NoReward;

