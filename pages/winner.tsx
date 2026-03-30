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
import { fontScale } from '../fonts';

const completedChallenges = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxZ1KLLhqU68Nxsc2iwdJRQhOJu0SSiYWV6cAGJ_lMmLaenC2imrnOCB6FqJWkZR_alkNRc-fwLRg0dlxqKhnSZitQThNRHWLdZkYncgXoe47MZOQemMm79hGT1MVLxJD6kVjsQaLRoMtZCn60FCRiw3jataJhfItAeyHRrQbynHUU4Bu-SsxtsQOV0xea1-fxdaOeTdG4N5FWds94Tlm7D91OQbvkQo5GhXQ-RDv2y35iLWztd2JHmS5Cqzu7GhC78Z8N9AAGXJps',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAkZ0KsoOz-Ob69nmfCX1qnerY5qs4P3KOGms7FhyaHNYh3lMeKNzVvQ3kcQXZoSJLyO8fq56Dr4DPydhRjVkq5Lzfm_IL06rmp3VNjnGGdKN49QSH27ODXRWE5PPoPm_4FBKXKx36SriUVzzXZNxzkZU7nhARNbxTcCL496YUPGqYPn3hIlHFg1SWBNrHvmVyuMsiOzxM3wwtpLtLKtfNwfqj4BmoHH6czKViJd-nUaVXhHIoknSA25ycPNH5Cv6GbuncfMMZQwdNR',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCvSjk4rCZHkiW965HM2ELNTH5d5ML5n4UJvP9NlFe_R_U4kS3ychp_tZw-psKUDbMDpQ7J2K0FW7oAh1dBMfZn3SaJVnbOhkr0LkQhHfjWCLgIpCcaVObKgfFhjeI_w0cXLn4FqMoTokO3QbOwxuh2ldm7WniR3kBKRAuA_75_N8NGhsogWjytlWmNI8M6yQqMNgUVjpxGP337CNwy4Lb_hGPIGlWvlsQDt2awav4kILSkKDKWFNV2PGEwiiDrmU6pCRMPAcT9I7py',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9b1_585EPR0xm97kbIdMF65mTJ1kfhhAcmtddDu3m-bPJJhbieQNav0Vu9NSVnFc1OW3i20AN1RPg2-CJGa4PR_4TqwzIkz7egR4XuKRY2DwmlpgSt1DAz3HwSExZ3xb5bokE6Wm5xrT5mYpT9Y8IsVVceNJI8_-FyLzDvXjIovIE67HrMEqKhRbXzXJAWSuHPD4FF9uZb6PdHR2mAQi5ul3m9gNlZhM23CeSANpd_3NJpnK1lihtKW4qSv6PV2A3J3ssuWK3Yu72',
];

const winner: React.FC = () => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#120816', '#0a050d', '#050207']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topBar}>
          <Pressable style={styles.topIcon}>
            <MaterialIcons name="menu" size={24} color="#94A3B8" />
          </Pressable>
          <Text style={styles.topTitle}>WINNER ANNOUNCED</Text>
          <Pressable style={styles.topIcon}>
            <MaterialIcons name="notifications" size={24} color="#94A3B8" />
          </Pressable>
        </View>

        <View style={styles.backgroundLeaks} pointerEvents="none">
          <View style={styles.leakOne} />
          <View style={styles.leakTwo} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroWrap}>
            <View style={styles.heroHeader}>
              <View style={styles.congratsPill}>
                <Text style={styles.congratsText}>CONGRATULATIONS!</Text>
              </View>
              <Text style={styles.heroTitle}>
                YOU ARE THE <Text style={styles.heroTitleAccent}>CHAMPION</Text>
              </Text>
            </View>

            <View style={styles.winnerCard}>
              <View style={styles.confettiOne} />
              <View style={styles.confettiTwo} />
              <View style={styles.confettiThree} />

              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={['rgba(147,13,242,0.6)', 'rgba(217,21,210,0.55)']}
                  style={styles.avatarGlow}
                />
                <LinearGradient
                  colors={['#930df2', '#d915d2']}
                  style={styles.avatarRing}
                >
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB410rPsjtGkFI564vuPKQu4jQg_JIo3s308agmclE7h3DwRjy5wI3dU2Ao9QsqEcdNUujtuaBQ7OypYYsnTbNNNuVlcsMwtbt1JWQWe7dGI9d1gvWnv-T8KPeVyofhjN1MLRyAHB2V21J4adh-2Vxa9tsXF6QMh-0FvpAA6YIAo5-Fj9BJTH8SQtf4KbQU16hEo6-DYPveJDjNhULc4q-k7K4jmpn56V7fxlH16O00byUNDM3M7Ag1Jmwzs0FQTei5cPPzsg0nlrh',
                    }}
                    style={styles.avatar}
                  />
                </LinearGradient>
                <View style={styles.badge}>
                  <MaterialIcons name="stars" size={20} color="#4e2600" />
                </View>
              </View>

              <Text style={styles.name}>Alex Rivera</Text>
              <Text style={styles.handle}>@Alex_Beats</Text>

              <View style={styles.divider} />

              <View style={styles.challengeContext}>
                <Text style={styles.challengeLabel}>CHALLENGE TITLE</Text>
                <Text style={styles.challengeTitle}>"Cyberpunk Street Dance Challenge"</Text>
              </View>

              <View style={styles.rewardGrid}>
                <View style={styles.rewardCard}>
                  <MaterialIcons name="toll" size={22} color="#930df2" />
                  <Text style={styles.rewardLabel}>PULSE REWARD</Text>
                  <Text style={styles.rewardValue}>500</Text>
                </View>
                <View style={styles.rewardCard}>
                  <MaterialIcons name="confirmation-number" size={22} color="#d915d2" />
                  <Text style={styles.rewardLabel}>ACCESS</Text>
                  <Text style={styles.rewardValue}>VIP PASS</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>CLAIM YOUR PRIZE</Text>
              <MaterialIcons name="celebration" size={20} color="#fff" />
            </Pressable>

            <Pressable style={styles.secondaryButton}>
              <MaterialIcons name="share" size={18} color="#CBD5E1" />
              <Text style={styles.secondaryButtonText}>Share My Win</Text>
            </Pressable>
          </View>

          <View style={styles.completedSection}>
            <Text style={styles.completedLabel}>RECENTLY COMPLETED CHALLENGES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.completedScroll}
            >
              {completedChallenges.map((uri, index) => (
                <View key={uri + index.toString()} style={styles.completedCard}>
                  <Image source={{ uri }} style={styles.completedImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                    style={styles.completedOverlay}
                  />
                </View>
              ))}
            </ScrollView>
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
  topBar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,5,13,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(20),
    letterSpacing: -0.5,
  },
  backgroundLeaks: {
    ...StyleSheet.absoluteFillObject,
  },
  leakOne: {
    position: 'absolute',
    top: -70,
    right: -100,
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: 'rgba(147,13,242,0.12)',
  },
  leakTwo: {
    position: 'absolute',
    bottom: 140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.08)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  congratsPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.3)',
    marginBottom: 16,
  },
  congratsText: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(42),
    lineHeight: 40,
    textAlign: 'center',
  },
  heroTitleAccent: {
    color: '#d915d2',
  },
  winnerCard: {
    width: '100%',
    padding: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  confettiOne: {
    position: 'absolute',
    top: 18,
    left: 36,
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#930df2',
    opacity: 0.65,
  },
  confettiTwo: {
    position: 'absolute',
    top: 36,
    right: 42,
    width: 12,
    height: 4,
    transform: [{ rotate: '12deg' }],
    backgroundColor: '#d915d2',
    opacity: 0.65,
  },
  confettiThree: {
    position: 'absolute',
    bottom: 74,
    left: 18,
    width: 4,
    height: 14,
    transform: [{ rotate: '-40deg' }],
    backgroundColor: '#ffb781',
    opacity: 0.65,
  },
  avatarWrap: {
    width: 128,
    height: 128,
    marginBottom: 22,
    position: 'relative',
  },
  avatarGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    transform: [{ scale: 1.06 }],
  },
  avatarRing: {
    flex: 1,
    borderRadius: 999,
    padding: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffb781',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a050d',
  },
  name: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(28),
    marginBottom: 4,
  },
  handle: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(16),
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 22,
  },
  challengeContext: {
    alignItems: 'center',
    marginBottom: 24,
  },
  challengeLabel: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  challengeTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(22),
    textAlign: 'center',
  },
  rewardGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  rewardCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  rewardLabel: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 6,
  },
  rewardValue: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(20),
  },
  primaryButton: {
    width: '100%',
    maxWidth: 560,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#d915d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
    letterSpacing: 1.4,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 560,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(14),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  completedSection: {
    marginTop: 42,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  completedLabel: {
    color: '#64748B',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 2.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  completedScroll: {
    gap: 14,
    paddingBottom: 6,
  },
  completedCard: {
    width: 128,
    aspectRatio: 9 / 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  completedImage: {
    width: '100%',
    height: '100%',
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default winner;
