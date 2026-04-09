import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mediumScreen } from '../types';

const strategyOptions = [
  {
    id: 'high-likes',
    title: 'High Likes',
    subtitle: 'Reward Fans',
    icon: 'workspace-premium' as const,
  },
  {
    id: 'no-reward',
    title: 'No Reward',
    subtitle: 'Bragging Rights',
    icon: 'block' as const,
  },
];

const rewardTypes = [
  {
    id: 'record-deal',
    title: 'Record Deal',
    description: 'Official distribution and marketing support for a single.',
    icon: 'album' as const,
    badge: 'HOT',
  },
  {
    id: 'artist-merch',
    title: 'Artist Merch (T-Shirt)',
    description: 'Exclusive limited edition drop for the top supporter.',
    icon: 'checkroom' as const,
  },
  {
    id: 'studio-time',
    title: 'Studio Time Session',
    description: '2-hour professional recording block at HQ.',
    icon: 'mic-external-on' as const,
  },
];

const RewardConfig: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [strategy, setStrategy] = useState<'high-likes' | 'no-reward'>('high-likes');
  const [selectedReward, setSelectedReward] = useState('artist-merch');
  const [customReward, setCustomReward] = useState('');
  const bgGradient = isDark
    ? ['#120617', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const headerBg = isDark ? 'rgba(10,5,13,0.8)' : 'rgba(255,255,255,0.92)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const iconButtonBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#f8fafc' : theme.text;
  const placeholder = isDark ? '#475569' : theme.textMuted;
  const strategyActiveBg = isDark ? 'rgba(147,13,242,0.08)' : theme.accentSoft;
  const tipBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const tipBorder = isDark ? 'rgba(255,255,255,0.05)' : theme.border;
  const selectedIcon = isDark ? '#475569' : theme.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.topGlow} pointerEvents="none" />
        <View style={styles.midGlow} pointerEvents="none" /> */}

        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <View style={styles.headerLeft}>
            <Pressable style={[styles.iconButton, { backgroundColor: iconButtonBg }]} onPress={() => navigation.goBack()}>
              <MaterialIcons name="chevron-left" size={22} color={titleTone} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: titleTone }]}>REWARD CONFIG</Text>
          </View>
          <Text style={styles.headerBrand}>NEON</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeText}>Pure Likes Challenge</Text>
            </View>
            <Text style={[styles.heroTitle, { color: titleTone }]}>Choose Your Reward</Text>
            <Text style={[styles.heroDescription, { color: subtle }]}>
              Incentivize your fans or keep it competitive. High rewards drive 3x
              more engagement.
            </Text>
          </View>

          <View style={styles.strategyGrid}>
            {strategyOptions.map((option) => {
              const isActive = option.id === strategy;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => setStrategy(option.id as 'high-likes' | 'no-reward')}
                  style={[
                    styles.strategyCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                    isActive && styles.strategyCardActive,
                    isActive && { backgroundColor: strategyActiveBg },
                  ]}
                >
                  {isActive ? (
                    <View style={styles.checkBadge}>
                      <MaterialIcons name="check" size={14} color="#fff" />
                    </View>
                  ) : null}

                  <MaterialIcons
                    name={option.icon}
                    size={32}
                    color={isActive ? '#930df2' : subtle}
                    style={styles.strategyIcon}
                  />
                  <Text style={[styles.strategyTitle, { color: isActive ? titleTone : subtle }, !isActive && styles.strategyTitleMuted]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.strategyMeta, { color: subtle }]}>{option.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: subtle }]}>Available Reward Types</Text>
              <Text style={styles.sectionHint}>SELECT ONE</Text>
            </View>

            <View style={styles.rewardList}>
              {rewardTypes.map((reward) => {
                const isSelected = reward.id === selectedReward;

                return (
                  <Pressable
                    key={reward.id}
                    onPress={() => setSelectedReward(reward.id)}
                    style={[
                      styles.rewardCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      isSelected && styles.rewardCardSelected,
                      isSelected && { backgroundColor: strategyActiveBg },
                    ]}
                  >
                    <View
                      style={[
                        styles.rewardIconWrap,
                        { backgroundColor: inputBg },
                        isSelected && styles.rewardIconWrapSelected,
                      ]}
                    >
                      <MaterialIcons
                        name={reward.icon}
                        size={26}
                        color={isSelected ? '#930df2' : '#d915d2'}
                      />
                    </View>

                    <View style={styles.rewardBody}>
                      <View style={styles.rewardTitleRow}>
                        <Text style={[styles.rewardTitle, { color: titleTone }]}>{reward.title}</Text>
                        {reward.badge ? (
                          <View style={styles.hotBadge}>
                            <Text style={styles.hotBadgeText}>{reward.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.rewardDescription, { color: subtle }]}>{reward.description}</Text>
                    </View>

                    <MaterialIcons
                      name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                      size={22}
                      color={isSelected ? '#930df2' : selectedIcon}
                    />
                  </Pressable>
                );
              })}

              <View style={[styles.customCard, { backgroundColor: inputBg, borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.border }]}>
                <View style={styles.customHeader}>
                  <MaterialIcons name="add-circle" size={16} color={subtle} />
                  <Text style={[styles.customLabel, { color: subtle }]}>Custom Reward</Text>
                </View>
                <TextInput
                  value={customReward}
                  onChangeText={setCustomReward}
                  placeholder="Enter custom prize description..."
                  placeholderTextColor={placeholder}
                  style={[styles.customInput, { color: titleTone }]}
                />
              </View>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: tipBg, borderColor: tipBorder }]}>
            <MaterialIcons name="lightbulb" size={20} color="#ffb781" />
            <Text style={[styles.tipText, { color: isDark ? '#d0c1d8' : subtle }]}>
              <Text style={[styles.tipStrong, { color: titleTone }]}>Pro Tip:</Text> Physical merch rewards like{' '}
              <Text style={styles.tipAccent}>T-Shirts</Text> create more "Proof of Win"
              social shares for your brand.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomShell}>
          <View style={styles.ctaWrap}>
            <Pressable
            onPress={()=>(
              navigation.navigate("Reward")
            )}
            style={styles.ctaButton}>
              <Text style={styles.ctaText}>Next Step: Final Review</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
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
  topGlow: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(147,13,242,0.22)',
  },
  midGlow: {
    position: 'absolute',
    top: 240,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
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
    fontSize: mediumScreen ? 16 : 13,
    letterSpacing: 0.8,
  },
  headerBrand: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 22 : 18,
    letterSpacing: -0.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 28,
  },
  hero: {
    gap: 10,
  },
  challengeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.3)',
  },
  challengeBadgeText: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 21 : 18,
    lineHeight: mediumScreen ? 34 : 30,
  },
  heroDescription: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 24 : 18,
    maxWidth: 340,
  },
  strategyGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  strategyCard: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    opacity: 0.65,
  },
  strategyCardActive: {
    borderWidth: 2,
    borderColor: '#930df2',
    opacity: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#930df2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#930df2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  strategyIcon: {
    marginBottom: 14,
  },
  strategyTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 17 : 14,
    marginBottom: 4,
  },
  strategyTitleMuted: {
    color: '#94a3b8',
  },
  strategyMeta: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 13 : 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionHint: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 1.1,
  },
  rewardList: {
    gap: 12,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  rewardCardSelected: {
    borderColor: '#930df2',
  },
  rewardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconWrapSelected: {
    backgroundColor: 'rgba(147,13,242,0.12)',
  },
  rewardBody: {
    flex: 1,
    gap: 4,
  },
  rewardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rewardTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 16 : 13,
    flex: 1,
  },
  hotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(147,13,242,0.18)',
  },
  hotBadgeText: {
    color: '#deb7ff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 12 : 8,
    letterSpacing: 0.5,
  },
  rewardDescription: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 22 : 18,
  },
  customCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  customInput: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    padding: 0,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16 : 12,
    lineHeight: mediumScreen ? 22 : 18,
  },
  tipStrong: {
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  tipAccent: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansBold',
  },
  bottomShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 7,
  },
  ctaText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14 : 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default RewardConfig;

